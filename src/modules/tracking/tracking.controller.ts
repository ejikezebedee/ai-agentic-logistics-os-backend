import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth.decorators';
import { TrackingEventDto } from '../../common/dto';
import { RoleCode } from '../../common/domain.enums';
import { TrackingEventService } from './tracking-event.service';

@ApiTags('tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly tracking: TrackingEventService) {}

  @Get(':shipmentId')
  @Roles(RoleCode.CUSTOMER, RoleCode.MERCHANT, RoleCode.LOGISTIC_DISPONENT, RoleCode.SUPPORT_AGENT, RoleCode.SUPER_ADMIN)
  timeline(@Param('shipmentId') shipmentId: string) {
    return this.tracking.timeline(shipmentId);
  }

  @Post('events')
  @Roles(RoleCode.DRIVER, RoleCode.WAREHOUSE_STAFF, RoleCode.LOGISTIC_DISPONENT, RoleCode.AI_AGENT, RoleCode.SUPER_ADMIN)
  append(@Body() dto: TrackingEventDto) {
    return this.tracking.append(dto);
  }

  @Delete(':shipmentId/events/:id')
  @Roles(RoleCode.SUPER_ADMIN)
  delete() {
    return this.tracking.delete();
  }
}
