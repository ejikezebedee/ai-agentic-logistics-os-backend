import { BadRequestException, Body, Controller, Get, Optional, Param, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Actor, Roles } from '../../common/auth.decorators';
import { AssignDriverDto } from '../../common/dto';
import { PackageStatus, RoleCode } from '../../common/domain.enums';
import { RequestActor } from '../../common/auth.decorators';
import { OperationsService } from '../shipments/operations.service';
import { LocationService } from '../tracking/location.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('disponent')
@Controller('disponent')
@Roles(RoleCode.LOGISTIC_DISPONENT, RoleCode.SUPER_ADMIN)
export class DisponentController {
  constructor(
    private readonly operations: OperationsService,
    private readonly locations: LocationService,
    @Optional() private readonly prisma?: PrismaService
  ) {}

  @Get('queue')
  async queue() {
    if (this.hasPrisma()) {
      const readyForDispatch = await (this.prisma as any).package.findMany({ where: { status: 'ready_for_dispatch' }, include: { shipment: true } });
      const unassignedShipments = await (this.prisma as any).shipment.findMany({ where: { status: { in: ['awaiting_dispatch', 'planned'] } }, include: { packages: true } });
      return { readyForDispatch, unassignedShipments };
    }
    return { readyForDispatch: [], unassignedShipments: [] };
  }

  @Get('live-map')
  liveMap() {
    return { shipments: [], vehicles: [], exceptions: [], ...this.locations.liveMap() };
  }

  @Get('exceptions')
  exceptions() {
    return { exceptions: [] };
  }

  @Post('tour-plans')
  async createTourPlan(@Body() body: Record<string, unknown>) {
    if (this.hasPrisma()) {
      return (this.prisma as any).tourPlan.create({ data: { disponentId: body.disponentId as string | undefined, routeSummary: body.routeSummary ?? {}, aiRecommendationId: body.aiRecommendationId as string | undefined } });
    }
    return { id: 'tour_development', status: 'draft', ...body };
  }

  @Post('tour-plans/:id/approve')
  async approveTourPlan(@Param('id') id: string) {
    if (this.hasPrisma()) {
      return (this.prisma as any).tourPlan
        .update({ where: { id }, data: { status: 'approved', approvedAt: new Date() } })
        .catch(() => ({ id, status: 'approved', developmentFallback: true }));
    }
    return { id, status: 'approved' };
  }

  @Post('tours/:id/approve')
  async approveTour(@Param('id') id: string) {
    return this.approveTourPlan(id);
  }

  @Post('tour-plans/:id/reject')
  async rejectTourPlan(@Param('id') id: string) {
    if (this.hasPrisma()) return (this.prisma as any).tourPlan.update({ where: { id }, data: { status: 'rejected' } });
    return { id, status: 'rejected' };
  }

  @Post('assign-driver')
  @ApiBody({ type: AssignDriverDto })
  assignDriver(@Actor() actor: RequestActor, @Body() dto: AssignDriverDto) {
    return this.operations.assignDriver(actor.id, dto.packageStatus ?? PackageStatus.READY_FOR_DISPATCH, this.shipmentId(dto), this.driverId(dto));
  }

  @Post('reassign-driver')
  @ApiBody({ type: AssignDriverDto })
  reassignDriver(@Actor() actor: RequestActor, @Body() dto: AssignDriverDto) {
    return this.operations.assignDriver(actor.id, dto.packageStatus ?? PackageStatus.READY_FOR_DISPATCH, this.shipmentId(dto), this.driverId(dto));
  }

  @Post('assign-carrier')
  assignCarrier(@Body() body: Record<string, unknown>) {
    return { status: 'carrier_assigned', ...body };
  }

  @Post('exceptions/:id/resolve')
  resolveException(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return { id, status: 'resolved', ...body };
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).tourPlan?.create === 'function');
  }

  private shipmentId(dto: AssignDriverDto) {
    const shipmentId = dto.shipmentId ?? dto.packageId;
    if (!shipmentId) throw new BadRequestException('Dispatch assignment requires shipmentId or packageId.');
    return shipmentId;
  }

  private driverId(dto: AssignDriverDto) {
    const driverId = dto.driverId ?? dto.assignedDriverId ?? (typeof dto.userId === 'string' ? dto.userId : undefined);
    if (!driverId) throw new BadRequestException('Dispatch assignment requires driverId or assignedDriverId.');
    return driverId;
  }
}
