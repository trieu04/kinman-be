import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsBoolean, IsInt, Min, Max, Matches } from "class-validator";
import { NotificationType } from "../entities/notification.entity";
import { PushPlatform } from "../entities/push-subscription.entity";

// Notification DTOs
export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiPropertyOptional()
  data?: Record<string, any>;

  @ApiProperty()
  isRead: boolean;

  @ApiPropertyOptional()
  readAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class NotificationListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;
}

export class NotificationUnreadCountDto {
  @ApiProperty()
  count: number;
}

// Notification Settings DTOs
export class NotificationSettingsResponseDto {
  @ApiProperty()
  dailyInputEnabled: boolean;

  @ApiProperty()
  budgetAlertEnabled: boolean;

  @ApiProperty()
  groupActivityEnabled: boolean;

  @ApiProperty()
  emailEnabled: boolean;

  @ApiProperty()
  pushEnabled: boolean;

  @ApiProperty()
  dailyReminderTime: string;

  @ApiProperty()
  budgetAlertThreshold: number;
}

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dailyInputEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  budgetAlertEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  groupActivityEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ description: "Daily reminder time in HH:mm format" })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "dailyReminderTime must be in HH:mm format" })
  dailyReminderTime?: string;

  @ApiPropertyOptional({ description: "Budget alert threshold percentage (1-100)" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  budgetAlertThreshold?: number;
}

// Push Subscription DTOs
export class WebPushKeysDto {
  @ApiProperty()
  @IsString()
  p256dh: string;

  @ApiProperty()
  @IsString()
  auth: string;
}

export class CreatePushSubscriptionDto {
  @ApiProperty({ enum: PushPlatform })
  @IsEnum(PushPlatform)
  platform: PushPlatform;

  @ApiPropertyOptional({ description: "Web Push subscription endpoint" })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({ description: "Web Push keys" })
  @IsOptional()
  keys?: WebPushKeysDto;

  @ApiPropertyOptional({ description: "FCM device token for mobile" })
  @IsOptional()
  @IsString()
  fcmToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class UnsubscribePushDto {
  @ApiPropertyOptional({ description: "Web Push endpoint to unsubscribe" })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({ description: "FCM token to unsubscribe" })
  @IsOptional()
  @IsString()
  fcmToken?: string;

  @ApiPropertyOptional({ description: "Device ID to unsubscribe" })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class VapidPublicKeyDto {
  @ApiProperty()
  publicKey: string;
}
