import { Column, Entity, Index, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../../common/entities/base-entity";
import { UserEntity } from "../../auth/entities/user.entity";

export enum NotificationType {
  DAILY_INPUT = "daily_input",
  BUDGET_ALERT = "budget_alert",
  GROUP_JOIN = "group_join",
  GROUP_LEAVE = "group_leave",
  GROUP_TRANSACTION = "group_transaction",
}

@Entity("notifications")
@Index(["userId", "createdAt"])
@Index(["userId", "isRead"])
export class NotificationEntity extends BaseEntity {
  @Column({
    type: "enum",
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: "text" })
  body: string;

  @Column({ type: "json", nullable: true })
  data: Record<string, any>;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: "timestamptz", nullable: true })
  readAt: Date;

  @Column("uuid")
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;
}
