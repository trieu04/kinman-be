import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GroupExpenseEntity, SplitType } from "../entities/group-expense.entity";
import { CreateGroupExpenseDto } from "../dtos/group-expense.dto";
import { GroupsService } from "./groups.service";
import { SettleUpDto } from "../dtos/settle-up.dto";
import { SettlementEntity } from "../entities/settlement.entity";
import { UserEntity } from "../../auth/entities/user.entity";
import { NotificationDispatcherService } from "../../notification/services/notification-dispatcher.service";
import { NotificationType } from "../../notification/entities/notification.entity";
import { RealtimeService } from "../../realtime/realtime.service";

@Injectable()
export class GroupExpensesService {
  constructor(
    @InjectRepository(GroupExpenseEntity)
    private readonly expenseRepo: Repository<GroupExpenseEntity>,
    @InjectRepository(SettlementEntity)
    private readonly settlementRepo: Repository<SettlementEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly groupsService: GroupsService,
    private readonly notificationDispatcher: NotificationDispatcherService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async addExpense(userId: string, groupId: string, dto: CreateGroupExpenseDto) {
    const group = await this.groupsService.findOne(groupId, userId);
    if (!group || !group.members) {
      throw new Error("Group not found or has no members");
    }

    // Use paidBy from DTO if provided, otherwise default to current user
    const payerId = dto.paidBy || userId;
    const payer = await this.userRepo.findOne({ where: { id: payerId } });
    if (!payer) {
      throw new Error("Payer not found");
    }

    // Verify payer is a member of the group
    const isPayerMember = group.members.some(m => m.user.id === payerId);
    if (!isPayerMember) {
      throw new Error("Payer must be a member of the group");
    }

    let splits = dto.splits || [];

    // If no splits provided, calculate them based on splitType
    if (!splits || splits.length === 0) {
      if (dto.splitType === SplitType.EQUAL) {
        // Split equally among all group members
        const memberCount = group.members.length;
        if (memberCount === 0) {
          throw new Error("No members in group to split expense among");
        }

        const amountPerPerson = Number((dto.amount / memberCount).toFixed(2));
        splits = group.members.map(m => ({
          userId: m.user.id,
          amount: amountPerPerson,
        }));
      } else if (dto.splitType === SplitType.EXACT) {
        // For exact split, splits must be provided
        throw new Error("Exact split requires specific amounts for each member");
      }
    }

    const expense = this.expenseRepo.create({
      ...dto,
      group,
      payer: { id: payerId },
      splits,
    });

    const savedExpense = await this.expenseRepo.save(expense);

    // Recalculate debts if needed
    // This should trigger debt settlement calculations for the group

    // Notify group members about new expense (except payer)
    const otherMembers = group.members.filter(m => m.user.id !== userId);
    for (const member of otherMembers) {
      await this.notificationDispatcher.dispatch({
        userId: member.user.id,
        email: member.user.email,
        type: NotificationType.GROUP_TRANSACTION,
        title: `Chi tiêu mới trong "${group.name}"`,
        body: `${payer?.name || payer?.email || "Một thành viên"} đã thêm khoản chi "${dto.description}" - ${dto.amount}đ`,
        data: {
          groupId: group.id,
          groupName: group.name,
          expenseId: savedExpense.id,
          expenseDescription: dto.description,
          expenseAmount: dto.amount,
          paidBy: payer?.name || payer?.email,
        },
      });
    }

    // Broadcast realtime event to all group members
    this.realtimeService.notifyExpenseAdded(groupId, {
      id: savedExpense.id,
      groupId,
      description: dto.description,
      amount: dto.amount,
      paidBy: payer?.name || payer?.email,
    });

    return savedExpense;
  }

  async getExpenses(userId: string, groupId: string) {
    await this.groupsService.findOne(groupId, userId); // Validate access
    return this.expenseRepo.find({
      where: { group: { id: groupId } },
      relations: ["payer"],
      order: { date: "DESC" },
    });
  }

  async getDebts(userId: string, groupId: string) {
    await this.groupsService.findOne(groupId, userId); // Validate access

    const expenses = await this.expenseRepo.find({
      where: { group: { id: groupId } },
      relations: ["payer"],
    });

    // Get all settlements for this group
    const settlements = await this.settlementRepo.find({
      where: { group: { id: groupId } },
      relations: ["fromUser", "toUser"],
    });

    // Calculate net balances
    const balances: Record<string, number> = {};

    // Process expenses
    expenses.forEach((expense) => {
      const payerId = expense.payer.id;
      const amount = Number(expense.amount);

      // Payer gets positive balance (they paid, so they are owed)
      balances[payerId] = (balances[payerId] || 0) + amount;

      // Splitters get negative balance (they owe)
      if (expense.splits) {
        expense.splits.forEach((split) => {
          balances[split.userId] = (balances[split.userId] || 0) - Number(split.amount);
        });
      }
    });

    // Process settlements: fromUser pays toUser
    // This reduces fromUser's debt (increases their balance) and reduces toUser's credit (decreases their balance)
    settlements.forEach((settlement) => {
      const amount = Number(settlement.amount);
      balances[settlement.fromUser.id] = (balances[settlement.fromUser.id] || 0) + amount;
      balances[settlement.toUser.id] = (balances[settlement.toUser.id] || 0) - amount;
    });

    // Separate into debtors and creditors
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    Object.entries(balances).forEach(([id, amount]) => {
      if (amount < -0.01)
        debtors.push({ id, amount }); // Negative balance means they owe
      if (amount > 0.01)
        creditors.push({ id, amount }); // Positive balance means they are owed
    });

    // Sort by magnitude to optimize (greedy approach)
    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const debts: { from: string; to: string; amount: number }[] = [];

    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      // The amount to settle is the minimum of what debtor owes and creditor is owed
      const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

      debts.push({
        from: debtor.id,
        to: creditor.id,
        amount: Number(amount.toFixed(2)),
      });

      // Update balances
      debtor.amount += amount;
      creditor.amount -= amount;

      // Move to next if settled
      if (Math.abs(debtor.amount) < 0.01)
        i++;
      if (creditor.amount < 0.01)
        j++;
    }

    // Fetch user data for all debts
    const userIds = new Set<string>();
    debts.forEach(debt => {
      userIds.add(debt.from);
      userIds.add(debt.to);
    });

    const users = await this.userRepo.findByIds(Array.from(userIds));
    const userMap = new Map(users.map(u => [u.id, u]));

    // Map debts to include full user objects
    return debts.map(debt => ({
      from: userMap.get(debt.from),
      to: userMap.get(debt.to),
      amount: debt.amount,
    }));
  }

  async settleUp(userId: string, groupId: string, dto: SettleUpDto) {
    const group = await this.groupsService.findOne(groupId, userId);

    const settlement = this.settlementRepo.create({
      group,
      fromUser: { id: dto.fromUserId },
      toUser: { id: dto.toUserId },
      amount: dto.amount,
    });

    const saved = await this.settlementRepo.save(settlement);

    // Broadcast realtime event
    this.realtimeService.notifyDebtSettled(groupId, {
      id: saved.id,
      groupId,
      fromUserId: dto.fromUserId,
      toUserId: dto.toUserId,
      amount: dto.amount,
    });

    return saved;
  }
}
