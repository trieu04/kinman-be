import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { GroupExpenseEntity } from '../finance/entities/group-expense.entity';
import { SettlementEntity } from '../finance/entities/settlement.entity';
import { GroupEntity } from '../finance/entities/group.entity';
import { CategoryEntity } from '../finance/entities/category.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { ReportQueryDto } from './dtos/report-query.dto';
import {
    UserSummaryResponse,
    GroupReportResponse,
    CategorySummary,
    MemberExpense,
    DebtSummary,
} from './dtos/report-response.dto';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(TransactionEntity)
        private readonly transactionRepo: Repository<TransactionEntity>,
        @InjectRepository(GroupExpenseEntity)
        private readonly groupExpenseRepo: Repository<GroupExpenseEntity>,
        @InjectRepository(SettlementEntity)
        private readonly settlementRepo: Repository<SettlementEntity>,
        @InjectRepository(GroupEntity)
        private readonly groupRepo: Repository<GroupEntity>,
        @InjectRepository(CategoryEntity)
        private readonly categoryRepo: Repository<CategoryEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
    ) { }

    /**
     * Báo cáo chi tiêu cá nhân
     */
    async getUserSummary(
        userId: string,
        query: ReportQueryDto,
    ): Promise<UserSummaryResponse> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { from, to } = this.getDateRange(query);

        // Lấy personal transactions
        const transactions = await this.transactionRepo.find({
            where: {
                user: { id: userId },
                createdAt: Between(from, to),
            },
            relations: ['category', 'user'],
        });

        // Lấy group expenses (nơi user là payer)
        const groupExpensesWhere: any = {
            payer: { id: userId },
            date: Between(from, to),
        };

        if (query.groupId) {
            groupExpensesWhere.group = { id: query.groupId };
        }

        const groupExpenses = await this.groupExpenseRepo.find({
            where: groupExpensesWhere,
            relations: ['group', 'payer'],
        });

        // Tính tổng chi tiêu (cả personal + group)
        const personalTotal = transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
        const groupTotal = groupExpenses.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
        const totalSpent = personalTotal + groupTotal;

        // Group by category (từ transactions)
        const byCategoryMap = new Map<string, { name: string; amount: number; count: number }>();

        for (const tx of transactions) {
            const catId = tx.category?.id || 'uncategorized';
            const catName = tx.category?.name || 'Uncategorized';

            if (!byCategoryMap.has(catId)) {
                byCategoryMap.set(catId, { name: catName, amount: 0, count: 0 });
            }

            const cat = byCategoryMap.get(catId)!;
            cat.amount += Math.abs(Number(tx.amount));
            cat.count += 1;
        }

        const byCategory: CategorySummary[] = Array.from(byCategoryMap.entries()).map(
            ([id, data]) => ({
                categoryId: id,
                categoryName: data.name,
                amount: data.amount,
                count: data.count,
            }),
        );

        // Group by group
        const byGroupMap = new Map<string, { name: string; amount: number; count: number }>();

        for (const exp of groupExpenses) {
            const groupId = exp.group.id;
            const groupName = exp.group.name;

            if (!byGroupMap.has(groupId)) {
                byGroupMap.set(groupId, { name: groupName, amount: 0, count: 0 });
            }

            const grp = byGroupMap.get(groupId)!;
            grp.amount += Math.abs(Number(exp.amount));
            grp.count += 1;
        }

        const byGroup = Array.from(byGroupMap.entries()).map(([id, data]) => ({
            groupId: id,
            groupName: data.name,
            amount: data.amount,
            count: data.count,
        }));

        return {
            userId,
            userName: user.name || user.email,
            totalSpent,
            transactionCount: transactions.length + groupExpenses.length,
            byCategory,
            byGroup,
            period: {
                from: from.toISOString(),
                to: to.toISOString(),
            },
        };
    }

    /**
     * Báo cáo chi tiêu theo nhóm
     */
    async getGroupSummary(
        groupId: string,
        query: ReportQueryDto,
    ): Promise<GroupReportResponse> {
        const group = await this.groupRepo.findOne({
            where: { id: groupId },
            relations: ['members', 'members.user'],
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        const { from, to } = this.getDateRange(query);

        // Lấy group expenses
        const expenses = await this.groupExpenseRepo.find({
            where: {
                group: { id: groupId },
                date: Between(from, to),
            },
            relations: ['payer'],
        });

        const totalExpenses = expenses.reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

        // By category - GroupExpense không có category, tạm thời để trống
        // Hoặc có thể dùng description để group
        const byCategory: CategorySummary[] = [
            {
                categoryId: 'group-expenses',
                categoryName: 'Group Expenses',
                amount: totalExpenses,
                count: expenses.length,
            },
        ];

        // Member expenses
        const memberMap = new Map<string, MemberExpense>();

        for (const member of group.members) {
            memberMap.set(member.user.id, {
                userId: member.user.id,
                userName: member.user.name || member.user.email,
                paid: 0,
                owed: 0,
                balance: 0,
            });
        }

        // Tính paid (người trả)
        for (const exp of expenses) {
            const payerId = exp.payer.id;
            if (memberMap.has(payerId)) {
                memberMap.get(payerId)!.paid += Math.abs(Number(exp.amount));
            }
        }

        // Tính owed từ splits
        for (const exp of expenses) {
            if (exp.splits && Array.isArray(exp.splits)) {
                for (const split of exp.splits) {
                    if (memberMap.has(split.userId)) {
                        memberMap.get(split.userId)!.owed += Math.abs(Number(split.amount));
                    }
                }
            }
        }

        // Tính balance
        for (const member of memberMap.values()) {
            member.balance = member.paid - member.owed;
        }

        const members = Array.from(memberMap.values());

        // Debt summary từ settlements
        const settlements = await this.settlementRepo.find({
            where: {
                group: { id: groupId },
                date: Between(from, to),
            },
            relations: ['fromUser', 'toUser'],
        });

        const debts: DebtSummary[] = [];

        // Tính debt từ balance của members (ai nợ ai)
        const positiveBalances = members.filter(m => m.balance > 0.01); // creditors
        const negativeBalances = members.filter(m => m.balance < -0.01); // debtors

        for (const debtor of negativeBalances) {
            for (const creditor of positiveBalances) {
                const debtAmount = Math.abs(debtor.balance);
                if (debtAmount > 0.01) {
                    debts.push({
                        debtorId: debtor.userId,
                        debtorName: debtor.userName,
                        creditorId: creditor.userId,
                        creditorName: creditor.userName,
                        amount: debtAmount,
                        settled: false, // Check từ settlements
                    });
                }
            }
        }

        // Mark settled debts
        for (const settlement of settlements) {
            const debt = debts.find(
                d => d.debtorId === settlement.fromUser.id && d.creditorId === settlement.toUser.id,
            );
            if (debt) {
                debt.settled = true;
            }
        }

        return {
            groupId,
            groupName: group.name,
            totalExpenses,
            memberCount: group.members.length,
            members,
            debts,
            byCategory,
            period: {
                from: from.toISOString(),
                to: to.toISOString(),
            },
        };
    }

    /**
     * Export CSV - User Report
     */
    generateUserReportCSV(data: UserSummaryResponse): string {
        const lines: string[] = [];

        // Header
        lines.push('KINMAN - USER EXPENSE REPORT');
        lines.push('');
        lines.push(`User,${data.userName}`);
        lines.push(`Period,"${data.period.from} to ${data.period.to}"`);
        lines.push(`Total Spent,${data.totalSpent.toLocaleString()}`);
        lines.push(`Transactions,${data.transactionCount}`);
        lines.push('');

        // By Category
        lines.push('EXPENSES BY CATEGORY');
        lines.push('Category,Amount,Count');
        for (const cat of data.byCategory) {
            lines.push(`"${cat.categoryName}",${cat.amount},${cat.count}`);
        }
        lines.push('');

        // By Group
        if (data.byGroup.length > 0) {
            lines.push('EXPENSES BY GROUP');
            lines.push('Group,Amount,Count');
            for (const grp of data.byGroup) {
                lines.push(`"${grp.groupName}",${grp.amount},${grp.count}`);
            }
        }

        return lines.join('\n');
    }

    /**
     * Export CSV - Group Report
     */
    generateGroupReportCSV(data: GroupReportResponse): string {
        const lines: string[] = [];

        // Header
        lines.push('KINMAN - GROUP EXPENSE REPORT');
        lines.push('');
        lines.push(`Group,${data.groupName}`);
        lines.push(`Period,"${data.period.from} to ${data.period.to}"`);
        lines.push(`Total Expenses,${data.totalExpenses.toLocaleString()}`);
        lines.push(`Members,${data.memberCount}`);
        lines.push('');

        // By Category
        lines.push('EXPENSES BY CATEGORY');
        lines.push('Category,Amount,Count');
        for (const cat of data.byCategory) {
            lines.push(`"${cat.categoryName}",${cat.amount},${cat.count}`);
        }
        lines.push('');

        // Member Expenses
        lines.push('MEMBER EXPENSES');
        lines.push('Member,Paid,Owed,Balance');
        for (const member of data.members) {
            lines.push(
                `"${member.userName}",${member.paid},${member.owed},${member.balance}`,
            );
        }
        lines.push('');

        // Debts
        if (data.debts.length > 0) {
            lines.push('DEBT SUMMARY');
            lines.push('Debtor,Creditor,Amount,Status');
            for (const debt of data.debts) {
                const status = debt.settled ? 'Settled' : 'Pending';
                lines.push(
                    `"${debt.debtorName}","${debt.creditorName}",${debt.amount},${status}`,
                );
            }
        }

        return lines.join('\n');
    }

    /**
     * Helper: Get date range
     */
    private getDateRange(query: ReportQueryDto): { from: Date; to: Date } {
        const now = new Date();

        const from = query.from
            ? new Date(query.from)
            : new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month

        const to = query.to
            ? new Date(query.to)
            : now;

        if (from > to) {
            throw new BadRequestException('Invalid date range: from must be before to');
        }

        return { from, to };
    }
}
