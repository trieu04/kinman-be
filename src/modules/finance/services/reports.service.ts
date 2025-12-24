import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { TransactionEntity } from "../entities/transaction.entity";

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async getCategoryBreakdown(userId: string, year: number, month?: number) {
    const query = this.dataSource
      .getRepository(TransactionEntity)
      .createQueryBuilder("transaction")
      .innerJoin("transaction.category", "category")
      .select("category.name", "category")
      .addSelect("SUM(transaction.amount)", "total")
      .where("transaction.user.id = :userId", { userId })
      .andWhere("EXTRACT(YEAR FROM transaction.date) = :year", { year });

    if (month) {
      query.andWhere("EXTRACT(MONTH FROM transaction.date) = :month", { month });
    }

    const result = await query.groupBy("category.name").getRawMany();

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
      .createQueryBuilder("transaction")
      .select("EXTRACT(MONTH FROM transaction.date)", "month")
      .addSelect("SUM(transaction.amount)", "total")
      .where("transaction.user.id = :userId", { userId })
      .andWhere("EXTRACT(YEAR FROM transaction.date) = :year", { year })
      .groupBy("EXTRACT(MONTH FROM transaction.date)")
      .orderBy("month", "ASC")
      .getRawMany();

    // Ensure we have all 12 months defaulting to 0
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      name: new Date(0, i).toLocaleString("default", { month: "short" }),
      total: 0,
    }));

    result.forEach((item) => {
      const monthIndex = Number(item.month) - 1;
      if (months[monthIndex]) {
        months[monthIndex].total = Number(item.total);
      }
    });

    return months;
  }

  async getDailyTrend(userId: string, startDate?: Date, endDate?: Date) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end);

    // Normalize range: default to last 30 days when start not provided
    if (!startDate) {
      start.setDate(end.getDate() - 29);
    }

    // Ensure time boundaries for inclusive range
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const result = await this.dataSource
      .getRepository(TransactionEntity)
      .createQueryBuilder("transaction")
      .select("DATE(transaction.date)", "date")
      .addSelect("SUM(transaction.amount)", "total")
      .addSelect("COUNT(*)", "count")
      .where("transaction.user.id = :userId", { userId })
      .andWhere("transaction.date BETWEEN :start AND :end", { start, end })
      .groupBy("DATE(transaction.date)")
      .orderBy("date", "ASC")
      .getRawMany();

    const map = new Map<string, { total: number; count: number }>();
    result.forEach(item => {
      const key = new Date(item.date).toISOString().slice(0, 10);
      map.set(key, {
        total: Number(item.total),
        count: Number(item.count),
      });
    });

    const daily: Array<{ date: string; total: number; count: number }> = [];
    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const key = cursor.toISOString().slice(0, 10);
      const stats = map.get(key);
      daily.push({
        date: key,
        total: stats?.total ?? 0,
        count: stats?.count ?? 0,
      });
    }

    return daily;
  }
}
