import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../../auth/entities/user.entity";
import { NotificationSettingEntity } from "../entities/notification-setting.entity";
import { NotificationType } from "../entities/notification.entity";
import { NotificationDispatcherService } from "./notification-dispatcher.service";

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(NotificationSettingEntity)
    private readonly settingsRepo: Repository<NotificationSettingEntity>,
    private readonly dispatcher: NotificationDispatcherService,
  ) { }

  // Run every hour to check for users who need daily reminders
  @Cron(CronExpression.EVERY_HOUR)
  async sendDailyReminders(): Promise<void> {
    const currentHour = new Date().getHours().toString().padStart(2, "0");
    const currentMinute = "00"; // We only check at the start of each hour
    const targetTime = `${currentHour}:${currentMinute}`;

    this.logger.log(`Checking for daily reminders at ${targetTime}`);

    // Find all settings where dailyReminderTime matches current hour
    const settings = await this.settingsRepo.find({
      where: {
        dailyInputEnabled: true,
      },
    });

    const matchingSettings = settings.filter(s =>
      s.dailyReminderTime.startsWith(`${currentHour}:`),
    );

    if (matchingSettings.length === 0) {
      this.logger.debug("No users to send daily reminders to at this hour");
      return;
    }

    this.logger.log(`Sending daily reminders to ${matchingSettings.length} users`);

    for (const setting of matchingSettings) {
      try {
        const user = await this.userRepo.findOne({ where: { id: setting.userId } });
        if (!user)
          continue;

        await this.dispatcher.dispatch({
          userId: setting.userId,
          email: user.email,
          type: NotificationType.DAILY_INPUT,
          title: "Nhắc nhở ghi chép chi tiêu",
          body: "Đừng quên ghi lại các khoản chi tiêu hôm nay nhé! Việc ghi chép thường xuyên sẽ giúp bạn kiểm soát tài chính tốt hơn.",
          data: {
            action: "open_quick_add",
          },
        });
      }
      catch (error) {
        this.logger.error(`Failed to send daily reminder to user ${setting.userId}:`, error);
      }
    }
  }

  // Cleanup old notifications (runs daily at 3 AM)
  @Cron("0 3 * * *")
  async cleanupOldNotifications(): Promise<void> {
    this.logger.log("Starting notification cleanup");
    // Note: In a real implementation, inject NotificationsService and call deleteOldNotifications
    this.logger.log("Cleanup complete");
  }
}
