import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { SoftDeleteEntity } from "../../../common/entities/soft-delete-entity";
import { UserEntity } from "../../auth/entities/user.entity";
import { CategoryEntity } from "./category.entity";
import { WalletEntity } from "./wallet.entity";
import { GroupEntity } from "./group.entity";
import { TransactionSplitEntity } from "./transaction-split.entity";

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

  @ManyToOne(() => CategoryEntity, { nullable: true })
  category: CategoryEntity;

  @ManyToOne(() => WalletEntity, { nullable: true })
  wallet: WalletEntity;

  @ManyToOne(() => UserEntity)
  user: UserEntity;

  @ManyToOne(() => GroupEntity, { nullable: true })
  group: GroupEntity;

  @OneToMany(() => TransactionSplitEntity, split => split.transaction, { cascade: true })
  splits: TransactionSplitEntity[];
}
