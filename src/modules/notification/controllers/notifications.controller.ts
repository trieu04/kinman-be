import { Controller, Get, Patch, Delete, Param, Query, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { UserEntity } from "../../auth/entities/user.entity";
import { NotificationsService } from "../services/notifications.service";
import {
  NotificationResponseDto,
  NotificationListQueryDto,
  NotificationUnreadCountDto,
} from "../dtos/notification.dto";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get()
  @ApiOperation({ summary: "Get user notifications" })
  @ApiResponse({ status: 200, description: "List of notifications" })
  async list(
    @GetUser() user: UserEntity,
    @Query() query: NotificationListQueryDto,
  ): Promise<{ data: NotificationResponseDto[]; total: number; page: number; limit: number }> {
    return this.notificationsService.findByUser(user.id, query);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notification count" })
  @ApiResponse({ status: 200, type: NotificationUnreadCountDto })
  async getUnreadCount(@GetUser() user: UserEntity): Promise<NotificationUnreadCountDto> {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark notification as read" })
  @ApiResponse({ status: 200, description: "Notification marked as read" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async markAsRead(
    @GetUser() user: UserEntity,
    @Param("id") id: string,
  ): Promise<NotificationResponseDto | null> {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  @ApiResponse({ status: 200, description: "All notifications marked as read" })
  async markAllAsRead(@GetUser() user: UserEntity): Promise<{ updated: number }> {
    const updated = await this.notificationsService.markAllAsRead(user.id);
    return { updated };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a notification" })
  @ApiResponse({ status: 204, description: "Notification deleted" })
  async delete(@GetUser() user: UserEntity, @Param("id") id: string): Promise<void> {
    await this.notificationsService.delete(id, user.id);
  }
}
