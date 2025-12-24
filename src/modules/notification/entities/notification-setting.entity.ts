import { Column, Entity, Index, OneToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../../common/entities/base-entity";
import { UserEntity } from "../../auth/entities/user.entity";

@Entity("notification_settings")
@Index(["userId"], { unique: true })
export class NotificationSettingEntity extends BaseEntity {
  @Column("uuid", { unique: true })
  userId: string;

  @OneToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  // Notification type toggles
  @Column({ default: true })
  dailyInputEnabled: boolean;

  @Column({ default: true })
  budgetAlertEnabled: boolean;

  @Column({ default: true })
  groupActivityEnabled: boolean;

  // Channel toggles
  @Column({ default: true })
  emailEnabled: boolean;

  @Column({ default: true })
  pushEnabled: boolean;

  // Daily reminder time (HH:mm format)
  @Column({ default: "20:00" })
  dailyReminderTime: string;

  // Budget alert threshold (percentage of budget, e.g., 80 means alert at 80%)
  @Column({ type: "int", default: 80 })
  budgetAlertThreshold: number;
}
