import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, LessThan } from "typeorm";
import { NotificationEntity, NotificationType } from "../entities/notification.entity";
import { NotificationSettingEntity } from "../entities/notification-setting.entity";
import { NotificationListQueryDto } from "../dtos/notification.dto";

export interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(NotificationSettingEntity)
    private readonly settingsRepo: Repository<NotificationSettingEntity>,
  ) { }

  async create(payload: CreateNotificationPayload): Promise<NotificationEntity> {
    const notification = this.notificationRepo.create({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    });

    const saved = await this.notificationRepo.save(notification);
    this.logger.log(`Created notification ${saved.id} of type ${saved.type} for user ${saved.userId}`);
    return saved;
  }

  async findByUser(
    userId: string,
    query: NotificationListQueryDto,
  ): Promise<{ data: NotificationEntity[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, type, unreadOnly } = query;

    const where: FindOptionsWhere<NotificationEntity> = { userId };

    if (type) {
      where.type = type;
    }

    if (unreadOnly) {
      where.isRead = false;
    }

    const [data, total] = await this.notificationRepo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string, userId: string): Promise<NotificationEntity | null> {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return null;
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return result.affected || 0;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.notificationRepo.delete({ id, userId });
    return (result.affected || 0) > 0;
  }

  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepo.delete({
      createdAt: LessThan(cutoffDate),
    });

    this.logger.log(`Cleaned up ${result.affected} old notifications`);
    return result.affected || 0;
  }

  // Settings methods
  async getSettings(userId: string): Promise<NotificationSettingEntity> {
    let settings = await this.settingsRepo.findOne({ where: { userId } });

    if (!settings) {
      // Create default settings
      settings = this.settingsRepo.create({ userId });
      settings = await this.settingsRepo.save(settings);
    }

    return settings;
  }

  async updateSettings(
    userId: string,
    updates: Partial<NotificationSettingEntity>,
  ): Promise<NotificationSettingEntity> {
    let settings = await this.getSettings(userId);

    // Apply updates
    Object.assign(settings, updates);
    settings = await this.settingsRepo.save(settings);

    return settings;
  }

  // Check if user has enabled specific notification type
  async isNotificationEnabled(userId: string, type: NotificationType): Promise<boolean> {
    const settings = await this.getSettings(userId);

    switch (type) {
      case NotificationType.DAILY_INPUT:
        return settings.dailyInputEnabled;
      case NotificationType.BUDGET_ALERT:
        return settings.budgetAlertEnabled;
      case NotificationType.GROUP_JOIN:
      case NotificationType.GROUP_LEAVE:
      case NotificationType.GROUP_TRANSACTION:
        return settings.groupActivityEnabled;
      default:
        return true;
    }
  }
}
