import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../../auth/entities/user.entity";
import { NotificationType } from "../entities/notification.entity";
import { NotificationsService, CreateNotificationPayload } from "./notifications.service";
import { EmailNotificationService } from "./email-notification.service";
import { PushNotificationService } from "./push-notification.service";

export interface DispatchNotificationPayload extends CreateNotificationPayload {
  email?: string; // User email for email notifications
}

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailNotificationService,
    private readonly pushService: PushNotificationService,
  ) { }

  async dispatch(payload: DispatchNotificationPayload): Promise<void> {
    const { userId, type, title, body, data, email } = payload;

    // Check if notification type is enabled for user
    const isEnabled = await this.notificationsService.isNotificationEnabled(userId, type);
    if (!isEnabled) {
      this.logger.debug(`Notification type ${type} is disabled for user ${userId}`);
      return;
    }

    const settings = await this.notificationsService.getSettings(userId);

    // Create in-app notification
    const notification = await this.notificationsService.create({
      userId,
      type,
      title,
      body,
      data,
    });

    // Send email if enabled
    if (settings.emailEnabled && email) {
      await this.emailService.send({
        to: email,
        type,
        title,
        body,
        data,
      });
    }

    // Send push notification if enabled
    if (settings.pushEnabled) {
      await this.pushService.sendToUser(userId, notification);
    }
  }

  async dispatchToMultipleUsers(
    userIds: string[],
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    // Get user emails
    const users = await this.userRepo.find({
      where: userIds.map(id => ({ id })),
      select: ["id", "email"],
    });

    const userMap = new Map(users.map(u => [u.id, u.email]));

    for (const userId of userIds) {
      await this.dispatch({
        userId,
        type,
        title,
        body,
        data,
        email: userMap.get(userId),
      });
    }
  }
}
