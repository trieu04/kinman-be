import { Column, Entity, ManyToOne } from "typeorm";
import { SoftDeleteEntity } from "../../../common/entities/soft-delete-entity";
import { UserEntity } from "../../auth/entities/user.entity";
import { CategoryEntity } from "../../finance/entities/category.entity";
import { WalletEntity } from "../../finance/entities/wallet.entity";

@Entity()
export class TransactionEntity extends SoftDeleteEntity {
  @Column("decimal", {
    precision: 18,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
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
