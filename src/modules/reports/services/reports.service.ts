import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async getCategoryBreakdown(userId: string, year: number, month?: number) {
    const query = this.dataSource
      .getRepository(TransactionEntity)
      .createQueryBuilder('transaction')
      .innerJoin('transaction.category', 'category')
      .select('category.name', 'category')
      .addSelect('SUM(transaction.amount)', 'total')
      .where('transaction.user.id = :userId', { userId })
      .andWhere('EXTRACT(YEAR FROM transaction.date) = :year', { year });

    if (month) {
      query.andWhere('EXTRACT(MONTH FROM transaction.date) = :month', { month });
    }

    const result = await query.groupBy('category.name').getRawMany();
    
    // Format for frontend: { name: string, value: number, fill: string }
    // We can handle fill color on frontend or backend.
    return result.map(item => ({
      name: item.category,
      value: Number(item.total),
    }));
  }

  async getMonthlyTrend(userId: string, year: number) {
    const result = await this.dataSource
      .getRepository(TransactionEntity)
      .createQueryBuilder('transaction')
      .select('EXTRACT(MONTH FROM transaction.date)', 'month')
      .addSelect('SUM(transaction.amount)', 'total')
      .where('transaction.user.id = :userId', { userId })
      .andWhere('EXTRACT(YEAR FROM transaction.date) = :year', { year })
      .groupBy('EXTRACT(MONTH FROM transaction.date)')
      .orderBy('month', 'ASC')
      .getRawMany();

    // Ensure we have all 12 months defaulting to 0
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      name: new Date(0, i).toLocaleString('default', { month: 'short' }),
      total: 0,
    }));

    result.forEach(item => {
      const monthIndex = Number(item.month) - 1;
      if (months[monthIndex]) {
        months[monthIndex].total = Number(item.total);
      }
    });

    return months;
  }
}
