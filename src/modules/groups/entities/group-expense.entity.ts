import { Column, Entity, ManyToOne } from "typeorm";
import { SoftDeleteEntity } from "../../../common/entities/soft-delete-entity";
import { UserEntity } from "../../auth/entities/user.entity";
import { GroupEntity } from "./group.entity";

export enum SplitType {
  EQUAL = "equal",
  EXACT = "exact",
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
}

@Entity()
export class GroupExpenseEntity extends SoftDeleteEntity {
  @ManyToOne(() => GroupEntity)
  group: GroupEntity;

  @ManyToOne(() => UserEntity)
  payer: UserEntity;

  @Column("decimal", { precision: 18, scale: 2 })
  amount: number;

  @Column()
  description: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  date: Date;

  @Column({
    type: "enum",
    enum: SplitType,
    default: SplitType.EQUAL,
  })
  splitType: SplitType;

  @Column({ type: "jsonb", nullable: true })
  splits: ExpenseSplit[];
}
