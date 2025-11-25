import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WalletEntity } from "../entities/wallet.entity";
import { CreateWalletDto, UpdateWalletDto } from "../dtos/wallet.dto";

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletRepo: Repository<WalletEntity>,
  ) {}

  async create(userId: string, dto: CreateWalletDto) {
    return this.walletRepo.save({
      ...dto,
      user: { id: userId },
    });
  }

  async findAll(userId: string) {
    return this.walletRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string, userId: string) {
    const wallet = await this.walletRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }
    return wallet;
  }

  async update(id: string, userId: string, dto: UpdateWalletDto) {
    const wallet = await this.findOne(id, userId);
    return this.walletRepo.save({
      ...wallet,
      ...dto,
    });
  }

  async remove(id: string, userId: string) {
    const wallet = await this.findOne(id, userId);
    return this.walletRepo.softRemove(wallet);
  }

  async updateBalance(id: string, amount: number) {
    const wallet = await this.walletRepo.findOne({ where: { id } });
    if (wallet) {
      wallet.balance = Number(wallet.balance) + Number(amount);
      await this.walletRepo.save(wallet);
    }
  }
}
