import { Column, Entity, ManyToOne } from "typeorm";
import { SoftDeleteEntity } from "../../../common/entities/soft-delete-entity";
import { UserEntity } from "../../auth/entities/user.entity";
import { GroupEntity } from "./group.entity";

@Entity()
export class GroupMemberEntity extends SoftDeleteEntity {
  @ManyToOne(() => GroupEntity, group => group.members)
  group: GroupEntity;

  @ManyToOne(() => UserEntity)
  user: UserEntity;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  joinedAt: Date;

  @Column({ default: false })
  isHidden: boolean;
}
