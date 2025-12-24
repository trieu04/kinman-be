import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as webPush from "web-push";
import { PushSubscriptionEntity, PushPlatform } from "../entities/push-subscription.entity";
import { NotificationEntity } from "../entities/notification.entity";

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private vapidConfigured = false;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PushSubscriptionEntity)
    private readonly subscriptionRepo: Repository<PushSubscriptionEntity>,
  ) { }

  onModuleInit() {
    this.configureVapid();
  }

  private configureVapid() {
    const publicKey = this.configService.get<string>("notification.vapid.publicKey");
    const privateKey = this.configService.get<string>("notification.vapid.privateKey");
    const subject = this.configService.get<string>("notification.vapid.subject");

    if (publicKey && privateKey && subject) {
      webPush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidConfigured = true;
      this.logger.log("VAPID keys configured successfully");
    }
    else {
      this.logger.warn("VAPID keys not configured. Web push notifications will not work.");
    }
  }

  getVapidPublicKey(): string | null {
    return this.configService.get<string>("notification.vapid.publicKey") || null;
  }

  async subscribe(
    userId: string,
    platform: PushPlatform,
    endpoint?: string,
    keys?: { p256dh: string; auth: string },
    fcmToken?: string,
    deviceId?: string,
    deviceName?: string,
  ): Promise<PushSubscriptionEntity> {
    // Check for existing subscription
    let subscription: PushSubscriptionEntity | null = null;

    if (endpoint) {
      subscription = await this.subscriptionRepo.findOne({ where: { endpoint } });
    }
    else if (fcmToken) {
      subscription = await this.subscriptionRepo.findOne({ where: { fcmToken } });
    }
    else if (deviceId) {
      subscription = await this.subscriptionRepo.findOne({ where: { userId, deviceId } });
    }

    if (subscription) {
      // Update existing subscription
      subscription.userId = userId;
      subscription.platform = platform;
      subscription.keys = keys || subscription.keys;
      subscription.fcmToken = fcmToken || subscription.fcmToken;
      subscription.deviceName = deviceName || subscription.deviceName;
    }
    else {
      // Create new subscription
      subscription = this.subscriptionRepo.create({
        userId,
        platform,
        endpoint,
        keys,
        fcmToken,
        deviceId,
        deviceName,
      });
    }

    return this.subscriptionRepo.save(subscription);
  }

  async unsubscribe(userId: string, endpoint?: string, fcmToken?: string, deviceId?: string): Promise<boolean> {
    let deleted = false;

    if (endpoint) {
      const result = await this.subscriptionRepo.delete({ userId, endpoint });
      deleted = (result.affected || 0) > 0;
    }
    else if (fcmToken) {
      const result = await this.subscriptionRepo.delete({ userId, fcmToken });
      deleted = (result.affected || 0) > 0;
    }
    else if (deviceId) {
      const result = await this.subscriptionRepo.delete({ userId, deviceId });
      deleted = (result.affected || 0) > 0;
    }

    return deleted;
  }

  async sendToUser(userId: string, notification: NotificationEntity): Promise<number> {
    const subscriptions = await this.subscriptionRepo.find({ where: { userId } });
    let successCount = 0;

    for (const subscription of subscriptions) {
      try {
        if (subscription.platform === PushPlatform.WEB) {
          await this.sendWebPush(subscription, notification);
          successCount++;
        }
        else if (subscription.platform === PushPlatform.ANDROID || subscription.platform === PushPlatform.IOS) {
          // FCM implementation would go here
          // await this.sendFcmPush(subscription, notification);
          this.logger.debug("FCM push not implemented yet");
        }

        // Update last pushed timestamp
        subscription.lastPushedAt = new Date();
        await this.subscriptionRepo.save(subscription);
      }
      catch (error: any) {
        this.logger.error(`Failed to send push to subscription ${subscription.id}:`, error.message);

        // Remove invalid subscriptions (410 Gone or 404 Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          await this.subscriptionRepo.delete({ id: subscription.id });
          this.logger.log(`Removed invalid subscription ${subscription.id}`);
        }
      }
    }

    return successCount;
  }

  private async sendWebPush(subscription: PushSubscriptionEntity, notification: NotificationEntity): Promise<void> {
    if (!this.vapidConfigured) {
      throw new Error("VAPID not configured");
    }

    if (!subscription.endpoint || !subscription.keys) {
      throw new Error("Invalid web push subscription");
    }

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    };

    const payload = JSON.stringify({
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      notificationId: notification.id,
      timestamp: notification.createdAt.toISOString(),
    });

    await webPush.sendNotification(pushSubscription, payload);
  }
}
