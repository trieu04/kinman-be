import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import { TransactionEntity } from "../entities/transaction.entity";
import { CreateTransactionDto, TransactionFilterDto, UpdateTransactionDto } from "../dtos/transaction.dto";
import { WalletsService } from "../services/wallets.service";
import { CategoriesService } from "../services/categories.service";
import { GroupsService } from "../services/groups.service";
import { TransactionSplitEntity } from "../entities/transaction-split.entity";
import { CategoryType } from "../entities/category.entity";

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
    @InjectRepository(TransactionSplitEntity)
    private readonly splitRepo: Repository<TransactionSplitEntity>,
    private readonly walletsService: WalletsService,
    private readonly categoriesService: CategoriesService,
    private readonly groupsService: GroupsService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    const category = dto.categoryId ? await this.categoriesService.findOne(dto.categoryId, userId) : undefined;
    const wallet = dto.walletId ? await this.walletsService.findOne(dto.walletId, userId) : undefined;
    let group: any;
    if (dto.groupId) {
      group = await this.groupsService.findOne(dto.groupId, userId);
    }

    // Chuẩn hóa dấu tiền theo loại danh mục
    const signedAmount = category?.type === CategoryType.INCOME
      ? Math.abs(dto.amount)
      : -Math.abs(dto.amount);

    const transaction = this.transactionRepo.create({
      ...dto,
      amount: signedAmount,
      date: dto.date ? new Date(dto.date) : new Date(),
      user: { id: userId },
      category,
      wallet,
      group,
    });

    if (dto.splits && dto.splits.length > 0) {
      transaction.splits = dto.splits.map(s => this.splitRepo.create({
        amount: s.amount,
        user: { id: s.userId },
      }));
    }

    await this.transactionRepo.save(transaction);

    // Update wallet balance theo số tiền đã chuẩn hóa
    if (wallet) {
      await this.walletsService.updateBalance(wallet.id, signedAmount);
    }

    return transaction;
  }

  async findAll(userId: string, filter: TransactionFilterDto) {
    const where: any = { user: { id: userId } };

    if (filter.startDate && filter.endDate) {
      where.date = Between(new Date(filter.startDate), new Date(filter.endDate));
    }
    if (filter.categoryId) {
      where.category = { id: filter.categoryId };
    }
    if (filter.walletId) {
      where.wallet = { id: filter.walletId };
    }

    return this.transactionRepo.find({
      where,
      relations: ["category", "wallet"],
      order: { date: "DESC" },
    });
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.transactionRepo.findOne({
      where: { id, user: { id: userId } },
      relations: ["category", "wallet"],
    });
    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }
    return transaction;
  }

  async update(id: string, userId: string, dto: UpdateTransactionDto) {
    const oldTransaction = await this.findOne(id, userId);
    const newCategory = dto.categoryId && dto.categoryId !== oldTransaction.category.id
      ? await this.categoriesService.findOne(dto.categoryId, userId)
      : oldTransaction.category;

    const newWallet = dto.walletId && dto.walletId !== oldTransaction.wallet.id
      ? await this.walletsService.findOne(dto.walletId, userId)
      : oldTransaction.wallet;

    // Tính tiền ký mới dựa trên category mới
    const newAmount = dto.amount !== undefined ? dto.amount : oldTransaction.amount;
    const signedAmount = newCategory.type === CategoryType.INCOME
      ? Math.abs(newAmount)
      : -Math.abs(newAmount);

    // Nếu amount hoặc wallet thay đổi, cần update wallet balance
    if (newAmount !== oldTransaction.amount || newWallet.id !== oldTransaction.wallet.id) {
      // Revert số tiền cũ từ wallet cũ
      const reverseOldAmount = oldTransaction.category.type === CategoryType.INCOME
        ? -oldTransaction.amount
        : Math.abs(oldTransaction.amount);
      await this.walletsService.updateBalance(oldTransaction.wallet.id, reverseOldAmount);

      // Thêm số tiền mới vào wallet mới (có thể giống wallet cũ)
      await this.walletsService.updateBalance(newWallet.id, signedAmount);
    }

    const updatedTransaction = await this.transactionRepo.save({
      ...oldTransaction,
      ...dto,
      amount: signedAmount,
      category: newCategory,
      wallet: newWallet,
      date: dto.date ? new Date(dto.date) : oldTransaction.date,
    });

    return updatedTransaction;
  }

  async remove(id: string, userId: string) {
    const transaction = await this.findOne(id, userId);

    // Revert balance
    const amount = transaction.category.type === CategoryType.INCOME ? -transaction.amount : transaction.amount;
    await this.walletsService.updateBalance(transaction.wallet.id, amount);

    return this.transactionRepo.softRemove(transaction);
  }
}
