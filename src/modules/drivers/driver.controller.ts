import { Body, Controller, Get, Optional, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, Roles } from '../../common/auth.decorators';
import { DeliveryProofDto, PickupProofDto } from '../../common/dto';
import { RoleCode } from '../../common/domain.enums';
import { RequestActor } from '../../common/auth.decorators';
import { OperationsService } from '../shipments/operations.service';
import { LocationService } from '../tracking/location.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('drivers')
@Controller('driver')
@Roles(RoleCode.DRIVER, RoleCode.SUPER_ADMIN)
export class DriverController {
  constructor(
    private readonly operations: OperationsService,
    private readonly locations: LocationService,
    @Optional() private readonly prisma?: PrismaService
  ) {}

  @Get('jobs')
  async jobs(@Actor() actor: RequestActor) {
    if (this.hasPrisma()) {
      return { jobs: await (this.prisma as any).dispatchAssignment.findMany({ where: { driverId: actor.id }, include: { shipment: true, vehicle: true } }) };
    }
    return { jobs: [] };
  }

  @Post('jobs/:id/accept')
  async accept(@Param('id') id: string) {
    if (this.hasPrisma()) return (this.prisma as any).dispatchAssignment.update({ where: { id }, data: { status: 'accepted' } });
    return { jobId: id, status: 'accepted' };
  }

  @Post('jobs/:id/reject')
  async reject(@Param('id') id: string) {
    if (this.hasPrisma()) return (this.prisma as any).dispatchAssignment.update({ where: { id }, data: { status: 'rejected' } });
    return { jobId: id, status: 'rejected' };
  }

  @Post('pickup/:shipmentId/complete')
  pickup(@Actor() actor: RequestActor, @Param('shipmentId') shipmentId: string, @Body() dto: PickupProofDto) {
    return this.operations.completePickup(actor.id, shipmentId, dto);
  }

  @Post('delivery/:shipmentId/attempt')
  attempt(@Param('shipmentId') shipmentId: string, @Body() body: Record<string, unknown>) {
    return { shipmentId, status: 'delivery_attempted', ...body };
  }

  @Post('delivery/:shipmentId/complete')
  complete(@Actor() actor: RequestActor, @Param('shipmentId') shipmentId: string, @Body() dto: DeliveryProofDto) {
    return this.operations.completeDelivery(actor.id, shipmentId, dto.tier, dto);
  }

  @Post('location')
  location(@Body() body: Record<string, unknown>) {
    return this.locations.checkIn(body as { driverId: string; latitude: number; longitude: number; accuracyMeters?: number; shipmentId?: string });
  }

  @Get('earnings')
  earnings() {
    return { currency: 'EUR', pending: 0, paid: 0 };
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).dispatchAssignment?.findMany === 'function');
  }
}

@ApiTags('drivers')
@Controller('drivers')
@Roles(RoleCode.DRIVER, RoleCode.SUPER_ADMIN)
export class DriversController {
  constructor(private readonly operations: OperationsService) {}

  @Post('pickup/:shipmentId/complete')
  pickup(@Actor() actor: RequestActor, @Param('shipmentId') shipmentId: string, @Body() dto: PickupProofDto) {
    return this.operations.completePickup(actor.id, shipmentId, dto);
  }

  @Post('delivery/:shipmentId/complete')
  complete(@Actor() actor: RequestActor, @Param('shipmentId') shipmentId: string, @Body() dto: DeliveryProofDto) {
    return this.operations.completeDelivery(actor.id, shipmentId, dto.tier, dto);
  }
}
