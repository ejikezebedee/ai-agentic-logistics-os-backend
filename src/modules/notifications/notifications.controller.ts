import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth.decorators';
import { RoleCode } from '../../common/domain.enums';
import { NotificationRequest, NotificationService } from './notification.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationService) {}

  @Post()
  @Roles(RoleCode.SUPPORT_AGENT, RoleCode.LOGISTIC_DISPONENT, RoleCode.SUPER_ADMIN, RoleCode.AI_AGENT)
  enqueue(@Body() body: NotificationRequest) {
    return this.notifications.enqueue(body);
  }

  @Get()
  @Roles(RoleCode.SUPPORT_AGENT, RoleCode.COMPLIANCE_ADMIN, RoleCode.SUPER_ADMIN)
  list() {
    return this.notifications.list();
  }
}
