import { Controller, Get, Optional, Param, Post, Body } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { DeliveryProofDto } from '../../common/dto';
import { ProofTier, RoleCode, ShipmentStatus } from '../../common/domain.enums';
import { Actor, RequestActor, Roles } from '../../common/auth.decorators';
import { StateMachineService } from './state-machine.service';
import { OperationsService } from './operations.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('shipments')
@Controller('shipments')
export class ShipmentsController {
  constructor(
    private readonly stateMachine: StateMachineService,
    private readonly operations: OperationsService,
    @Optional() private readonly prisma?: PrismaService
  ) {}

  @Post()
  @Roles(RoleCode.MERCHANT, RoleCode.LOGISTIC_DISPONENT, RoleCode.SUPER_ADMIN)
  async create(@Body() body: { orderId: string; packageBarcode?: string }) {
    if (this.hasPrisma()) {
      return (this.prisma as any).shipment.create({
        data: {
          orderId: body.orderId,
          status: ShipmentStatus.AWAITING_DISPATCH,
          custodyType: 'warehouse',
          responsibility: 'warehouse_staff',
          packages: { create: [{ barcode: body.packageBarcode, status: 'created' }] }
        },
        include: { packages: true }
      });
    }
    return { id: 'ship_development', orderId: body.orderId, status: ShipmentStatus.AWAITING_DISPATCH };
  }

  @Get(':id/next-states')
  @Roles(RoleCode.LOGISTIC_DISPONENT, RoleCode.SUPER_ADMIN, RoleCode.DRIVER, RoleCode.CARRIER)
  nextStates(@Param('id') id: string) {
    return { shipmentId: id, current: ShipmentStatus.AWAITING_DISPATCH, next: this.stateMachine.nextShipmentStates(ShipmentStatus.AWAITING_DISPATCH) };
  }

  @Get(':id')
  @Roles(RoleCode.CUSTOMER, RoleCode.MERCHANT, RoleCode.LOGISTIC_DISPONENT, RoleCode.SUPPORT_AGENT, RoleCode.SUPER_ADMIN, RoleCode.DRIVER)
  async get(@Param('id') id: string) {
    if (this.hasPrisma()) return (this.prisma as any).shipment.findUnique({ where: { id }, include: { packages: true, trackingEvents: true, dispatches: true } });
    return { id, status: ShipmentStatus.AWAITING_DISPATCH };
  }

  @Post(':id/deliver')
  @Roles(RoleCode.DRIVER, RoleCode.LOGISTIC_DISPONENT, RoleCode.SUPER_ADMIN)
  @ApiBody({ type: DeliveryProofDto })
  deliver(@Actor() actor: RequestActor, @Param('id') id: string, @Body() dto: DeliveryProofDto) {
    return this.operations.completeDelivery(actor.id, id, dto.tier ?? ProofTier.LOW_VALUE, dto);
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).shipment?.create === 'function');
  }
}
