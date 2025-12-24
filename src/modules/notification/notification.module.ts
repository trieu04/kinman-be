import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";

// Entities
import { NotificationEntity } from "./entities/notification.entity";
import { NotificationSettingEntity } from "./entities/notification-setting.entity";
import { PushSubscriptionEntity } from "./entities/push-subscription.entity";
import { UserEntity } from "../auth/entities/user.entity";

// Controllers
import { NotificationsController } from "./controllers/notifications.controller";
import { NotificationSettingsController } from "./controllers/notification-settings.controller";
import { PushSubscriptionsController } from "./controllers/push-subscriptions.controller";

// Services
import { NotificationsService } from "./services/notifications.service";
import { EmailNotificationService } from "./services/email-notification.service";
import { PushNotificationService } from "./services/push-notification.service";
import { NotificationDispatcherService } from "./services/notification-dispatcher.service";
import { NotificationSchedulerService } from "./services/notification-scheduler.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      NotificationSettingEntity,
      PushSubscriptionEntity,
      UserEntity,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    NotificationsController,
    NotificationSettingsController,
    PushSubscriptionsController,
  ],
  providers: [
    NotificationsService,
    EmailNotificationService,
    PushNotificationService,
    NotificationDispatcherService,
    NotificationSchedulerService,
  ],
  exports: [
    NotificationsService,
    NotificationDispatcherService,
  ],
})
export class NotificationModule { }
