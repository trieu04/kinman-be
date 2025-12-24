import { Controller, Get, Post, Delete, Body, UseGuards, HttpCode, HttpStatus, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { UserEntity } from "../../auth/entities/user.entity";
import { PushNotificationService } from "../services/push-notification.service";
import {
  CreatePushSubscriptionDto,
  UnsubscribePushDto,
  VapidPublicKeyDto,
} from "../dtos/notification.dto";
import { PushSubscriptionEntity } from "../entities/push-subscription.entity";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications/push")
export class PushSubscriptionsController {
  constructor(private readonly pushService: PushNotificationService) { }

  @Get("vapid-key")
  @ApiOperation({ summary: "Get VAPID public key for web push" })
  @ApiResponse({ status: 200, type: VapidPublicKeyDto })
  getVapidPublicKey(): VapidPublicKeyDto {
    const publicKey = this.pushService.getVapidPublicKey();
    if (!publicKey) {
      throw new BadRequestException("Push notifications are not configured");
    }
    return { publicKey };
  }

  @Post("subscribe")
  @ApiOperation({ summary: "Subscribe to push notifications" })
  @ApiResponse({ status: 201, description: "Subscription created" })
  async subscribe(
    @GetUser() user: UserEntity,
    @Body() dto: CreatePushSubscriptionDto,
  ): Promise<PushSubscriptionEntity> {
    if (dto.platform === "web" && (!dto.endpoint || !dto.keys)) {
      throw new BadRequestException("Web push requires endpoint and keys");
    }

    if ((dto.platform === "android" || dto.platform === "ios") && !dto.fcmToken) {
      throw new BadRequestException("Mobile push requires fcmToken");
    }

    return this.pushService.subscribe(
      user.id,
      dto.platform,
      dto.endpoint,
      dto.keys,
      dto.fcmToken,
      dto.deviceId,
      dto.deviceName,
    );
  }

  @Delete("unsubscribe")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Unsubscribe from push notifications" })
  @ApiResponse({ status: 204, description: "Unsubscribed" })
  async unsubscribe(
    @GetUser() user: UserEntity,
    @Body() dto: UnsubscribePushDto,
  ): Promise<void> {
    if (!dto.endpoint && !dto.fcmToken && !dto.deviceId) {
      throw new BadRequestException("Must provide endpoint, fcmToken, or deviceId");
    }

    await this.pushService.unsubscribe(user.id, dto.endpoint, dto.fcmToken, dto.deviceId);
  }
}
