import { BadRequestException, Body, Controller, Get, Optional, Param, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Actor, RequestActor, Roles } from '../../common/auth.decorators';
import { AssignDriverDto } from '../../common/dto';
import { PackageStatus, RoleCode } from '../../common/domain.enums';
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
    if (this.hasPrisma()) {
      return (this.prisma as any).dispatchAssignment.create({ data: { ...body, assignedBy: actor.id, status: 'assigned' } }).catch((error: unknown) => {
        throw new BadRequestException({
          message: 'Dispatch assignment could not be created from the supplied shipment, driver, vehicle, carrier, or tour references.',
          error: 'ContractMismatch',
          details: error instanceof Error ? error.message : String(error)
        });
      });
    }
    return { id: 'dsp_development', assignedBy: actor.id, status: 'assigned', ...body };
  }

  @Post('assign-driver')
  @ApiBody({ type: AssignDriverDto })
  assignDriver(@Actor() actor: RequestActor, @Body() dto: AssignDriverDto) {
    const shipmentId = dto.shipmentId ?? dto.packageId;
    const driverId = dto.driverId ?? dto.assignedDriverId ?? (typeof dto.userId === 'string' ? dto.userId : undefined);
    if (!shipmentId || !driverId) {
      throw new BadRequestException({
        message: ['Dispatch assignment requires shipmentId/packageId and driverId/assignedDriverId.']
      });
    }
    return this.operations.assignDriver(actor.id, dto.packageStatus ?? PackageStatus.READY_FOR_DISPATCH, shipmentId, driverId);
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
