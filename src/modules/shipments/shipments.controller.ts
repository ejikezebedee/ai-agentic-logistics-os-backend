import { Controller, Get, Optional, Param, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoleCode, ShipmentStatus } from '../../common/domain.enums';
import { Roles } from '../../common/auth.decorators';
import { StateMachineService } from './state-machine.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('shipments')
@Controller('shipments')
export class ShipmentsController {
  constructor(
    private readonly stateMachine: StateMachineService,
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

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).shipment?.create === 'function');
  }
}
