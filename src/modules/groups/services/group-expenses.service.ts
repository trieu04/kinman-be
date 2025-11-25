import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GroupExpenseEntity, SplitType } from "../entities/group-expense.entity";
import { CreateGroupExpenseDto } from "../dtos/group-expense.dto";
import { GroupsService } from "./groups.service";
import { SettleUpDto } from "../dtos/settle-up.dto";
import { SettlementEntity } from "../entities/settlement.entity";

@Injectable()
export class GroupExpensesService {
  constructor(
    @InjectRepository(GroupExpenseEntity)
    private readonly expenseRepo: Repository<GroupExpenseEntity>,
    @InjectRepository(SettlementEntity)
    private readonly settlementRepo: Repository<SettlementEntity>,
    private readonly groupsService: GroupsService,
  ) {}

  async addExpense(userId: string, groupId: string, dto: CreateGroupExpenseDto) {
    const group = await this.groupsService.findOne(groupId, userId);

    let splits = dto.splits;

    if (dto.splitType === SplitType.EQUAL) {
      // Calculate equal splits
      const memberCount = group.members.length; // Or use selected members if supported
      // For simplicity, assume split equally among ALL members if splits not provided
      // But usually user selects who to split with.
      // If splits provided, use them. If not, split among all.
      if (!splits || splits.length === 0) {
        const amountPerPerson = dto.amount / memberCount;
        splits = group.members.map((m) => ({
          userId: m.user.id,
          amount: Number(amountPerPerson.toFixed(2)),
        }));
      }
    }

    const expense = this.expenseRepo.create({
      ...dto,
      group,
      payer: { id: userId },
      splits,
    });

    return this.expenseRepo.save(expense);
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

    // Calculate net balances
    const balances: Record<string, number> = {};

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

    // Separate into debtors and creditors
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    Object.entries(balances).forEach(([id, amount]) => {
      if (amount < -0.01) debtors.push({ id, amount }); // Negative balance means they owe
      if (amount > 0.01) creditors.push({ id, amount }); // Positive balance means they are owed
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
      if (Math.abs(debtor.amount) < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return debts;
  }

  async settleUp(userId: string, groupId: string, dto: SettleUpDto) {
    const group = await this.groupsService.findOne(groupId, userId);

    const settlement = this.settlementRepo.create({
      group,
      fromUser: { id: userId },
      toUser: { id: dto.toUserId },
      amount: dto.amount,
    });

    return this.settlementRepo.save(settlement);
  }
}
