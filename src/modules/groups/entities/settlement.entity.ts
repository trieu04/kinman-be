import { Column, Entity, ManyToOne } from "typeorm";
import { SoftDeleteEntity } from "../../../common/entities/soft-delete-entity";
import { UserEntity } from "../../auth/entities/user.entity";
import { GroupEntity } from "./group.entity";

@Entity()
export class SettlementEntity extends SoftDeleteEntity {
  @ManyToOne(() => GroupEntity)
  group: GroupEntity;

  @ManyToOne(() => UserEntity)
  fromUser: UserEntity;

  @ManyToOne(() => UserEntity)
  toUser: UserEntity;

  @Column("decimal", { precision: 18, scale: 2 })
  amount: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  date: Date;
}
