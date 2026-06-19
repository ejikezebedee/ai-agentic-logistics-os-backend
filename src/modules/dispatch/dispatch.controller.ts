import { Body, Controller, Get, Optional, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, RequestActor, Roles } from '../../common/auth.decorators';
import { AssignDriverDto } from '../../common/dto';
import { RoleCode } from '../../common/domain.enums';
import { PrismaService } from '../../prisma/prisma.service';
import { OperationsService } from '../shipments/operations.service';

@ApiTags('dispatch')
@Controller('dispatch')
@Roles(RoleCode.LOGISTIC_DISPONENT, RoleCode.SUPER_ADMIN)
export class DispatchController {
  constructor(
    private readonly operations: OperationsService,
    @Optional() private readonly prisma?: PrismaService
  ) {}

  @Post('assignments')
  async create(@Actor() actor: RequestActor, @Body() body: { shipmentId: string; driverId?: string; vehicleId?: string; carrierId?: string; tourPlanId?: string }) {
    if (this.hasPrisma()) return (this.prisma as any).dispatchAssignment.create({ data: { ...body, assignedBy: actor.id, status: 'assigned' } });
    return { id: 'dsp_development', assignedBy: actor.id, status: 'assigned', ...body };
  }

  @Post('assign-driver')
  assignDriver(@Actor() actor: RequestActor, @Body() dto: AssignDriverDto) {
    return this.operations.assignDriver(actor.id, dto.packageStatus, dto.shipmentId, dto.driverId);
  }

  @Get('assignments/:id')
  async get(@Param('id') id: string) {
    if (this.hasPrisma()) return (this.prisma as any).dispatchAssignment.findUnique({ where: { id }, include: { shipment: true, driver: true, vehicle: true, carrier: true } });
    return { id, status: 'assigned' };
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).dispatchAssignment?.create === 'function');
  }
}
