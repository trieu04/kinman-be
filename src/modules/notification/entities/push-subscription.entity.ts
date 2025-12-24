import { Column, Entity, Index, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../../common/entities/base-entity";
import { UserEntity } from "../../auth/entities/user.entity";

export enum PushPlatform {
  WEB = "web",
  ANDROID = "android",
  IOS = "ios",
}

@Entity("push_subscriptions")
@Index(["userId", "platform"])
@Index(["endpoint"], { unique: true, where: "endpoint IS NOT NULL" })
export class PushSubscriptionEntity extends BaseEntity {
  @Column("uuid")
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  @Column({
    type: "enum",
    enum: PushPlatform,
  })
  platform: PushPlatform;

  // Web Push subscription endpoint
  @Column({ type: "text", nullable: true })
  endpoint: string;

  // Web Push keys (p256dh and auth)
  @Column({ type: "json", nullable: true })
  keys: {
    p256dh: string;
    auth: string;
  };

  // FCM device token for mobile
  @Column({ type: "text", nullable: true })
  fcmToken: string;

  // Device identifier (for managing multiple devices)
  @Column({ nullable: true })
  deviceId: string;

  // User agent or device name for display
  @Column({ nullable: true })
  deviceName: string;

  // Last successful push timestamp
  @Column({ type: "timestamptz", nullable: true })
  lastPushedAt: Date;
}
