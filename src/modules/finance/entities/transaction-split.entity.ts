import { Column, Entity, ManyToOne } from "typeorm";
import { SoftDeleteEntity } from "../../../common/entities/soft-delete-entity";
import { TransactionEntity } from "../entities/transaction.entity";
import { UserEntity } from "../../auth/entities/user.entity";

@Entity()
export class TransactionSplitEntity extends SoftDeleteEntity {
  @Column("decimal", { precision: 18, scale: 2 })
  amount: number;

  @ManyToOne(() => TransactionEntity, transaction => transaction.splits)
  transaction: TransactionEntity;

  @ManyToOne(() => UserEntity)
  user: UserEntity;
}
