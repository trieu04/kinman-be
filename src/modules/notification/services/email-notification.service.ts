import { Injectable, Logger } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { NotificationType } from "../entities/notification.entity";

export interface EmailNotificationPayload {
  to: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);

  constructor(private readonly mailerService: MailerService) { }

  async send(payload: EmailNotificationPayload): Promise<boolean> {
    const template = this.getTemplateForType(payload.type);
    const subject = this.getSubjectForType(payload.type, payload.title);

    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject,
        template,
        context: {
          title: payload.title,
          body: payload.body,
          ...payload.data,
        },
      });

      this.logger.log(`Email notification sent to ${payload.to} for type ${payload.type}`);
      return true;
    }
    catch (error) {
      this.logger.error(`Failed to send email notification to ${payload.to}:`, error);
      return false;
    }
  }

  private getTemplateForType(type: NotificationType): string {
    switch (type) {
      case NotificationType.DAILY_INPUT:
        return "daily-reminder";
      case NotificationType.BUDGET_ALERT:
        return "budget-alert";
      case NotificationType.GROUP_JOIN:
      case NotificationType.GROUP_LEAVE:
      case NotificationType.GROUP_TRANSACTION:
        return "group-activity";
      default:
        return "group-activity";
    }
  }

  private getSubjectForType(type: NotificationType, title: string): string {
    const prefix = "[KinMan]";
    switch (type) {
      case NotificationType.DAILY_INPUT:
        return `${prefix} ⏰ Nhắc nhở ghi chép chi tiêu`;
      case NotificationType.BUDGET_ALERT:
        return `${prefix} ⚠️ Cảnh báo ngân sách`;
      case NotificationType.GROUP_JOIN:
        return `${prefix} 👋 ${title}`;
      case NotificationType.GROUP_LEAVE:
        return `${prefix} ${title}`;
      case NotificationType.GROUP_TRANSACTION:
        return `${prefix} 💳 ${title}`;
      default:
        return `${prefix} ${title}`;
    }
  }
}
