import { Column, Entity, ManyToOne } from "typeorm";
import { SoftDeleteEntity } from "../../../common/entities/soft-delete-entity";
import { UserEntity } from "../../auth/entities/user.entity";
import { CategoryEntity } from "../../categories/entities/category.entity";
import { WalletEntity } from "../../wallets/entities/wallet.entity";

@Entity()
export class TransactionEntity extends SoftDeleteEntity {
  @Column("decimal", { precision: 18, scale: 2 })
  amount: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  date: Date;

  @Column({ nullable: true })
  note: string;

  @Column({ nullable: true })
  imageUrl: string;

  @ManyToOne(() => CategoryEntity)
  category: CategoryEntity;

  @ManyToOne(() => WalletEntity)
  wallet: WalletEntity;

  @ManyToOne(() => UserEntity)
  user: UserEntity;
}
