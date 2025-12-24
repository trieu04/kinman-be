import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { UserEntity } from "../../auth/entities/user.entity";
import { NotificationsService } from "../services/notifications.service";
import {
  NotificationSettingsResponseDto,
  UpdateNotificationSettingsDto,
} from "../dtos/notification.dto";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications/settings")
export class NotificationSettingsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get()
  @ApiOperation({ summary: "Get notification settings" })
  @ApiResponse({ status: 200, type: NotificationSettingsResponseDto })
  async getSettings(@GetUser() user: UserEntity): Promise<NotificationSettingsResponseDto> {
    const settings = await this.notificationsService.getSettings(user.id);
    return {
      dailyInputEnabled: settings.dailyInputEnabled,
      budgetAlertEnabled: settings.budgetAlertEnabled,
      groupActivityEnabled: settings.groupActivityEnabled,
      emailEnabled: settings.emailEnabled,
      pushEnabled: settings.pushEnabled,
      dailyReminderTime: settings.dailyReminderTime,
      budgetAlertThreshold: settings.budgetAlertThreshold,
    };
  }

  @Patch()
  @ApiOperation({ summary: "Update notification settings" })
  @ApiResponse({ status: 200, type: NotificationSettingsResponseDto })
  async updateSettings(
    @GetUser() user: UserEntity,
    @Body() dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettingsResponseDto> {
    const settings = await this.notificationsService.updateSettings(user.id, dto);
    return {
      dailyInputEnabled: settings.dailyInputEnabled,
      budgetAlertEnabled: settings.budgetAlertEnabled,
      groupActivityEnabled: settings.groupActivityEnabled,
      emailEnabled: settings.emailEnabled,
      pushEnabled: settings.pushEnabled,
      dailyReminderTime: settings.dailyReminderTime,
      budgetAlertThreshold: settings.budgetAlertThreshold,
    };
  }
}
