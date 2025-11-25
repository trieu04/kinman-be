import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { SoftDeleteEntity } from "../../../common/entities/soft-delete-entity";
import { UserEntity } from "../../auth/entities/user.entity";
import { GroupMemberEntity } from "./group-member.entity";

@Entity()
export class GroupEntity extends SoftDeleteEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @ManyToOne(() => UserEntity)
  creator: UserEntity;

  @OneToMany(() => GroupMemberEntity, (member) => member.group)
  members: GroupMemberEntity[];
}
