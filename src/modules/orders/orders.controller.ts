import { Body, Controller, Get, Optional, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, Roles } from '../../common/auth.decorators';
import { CreateOrderDto } from '../../common/dto';
import { OrderStatus, RoleCode, TrackingEventCode } from '../../common/domain.enums';
import { AuditLogService } from '../audit/audit-log.service';
import { RequestActor } from '../../common/auth.decorators';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly audit: AuditLogService,
    @Optional() private readonly prisma?: PrismaService
  ) {}

  @Post()
  @Roles(RoleCode.CUSTOMER, RoleCode.MERCHANT, RoleCode.SUPER_ADMIN)
  async create(@Actor() actor: RequestActor, @Body() dto: CreateOrderDto) {
    const order = this.hasPrisma()
      ? await (this.prisma as any).order.create({
          data: {
            customerId: dto.customerId,
            merchantId: dto.merchantId,
            status: OrderStatus.DRAFT,
            totalAmount: this.total(dto.items),
            currency: 'EUR',
            items: {
              create: dto.items.map((item) => ({
                skuId: String(item.skuId),
                quantity: Number(item.quantity ?? 1),
                unitPrice: Number(item.unitPrice ?? 0)
              }))
            }
          },
          include: { items: true }
        })
      : { id: 'ord_development', ...dto, status: OrderStatus.DRAFT };
    this.audit.create({ actorId: actor.id, actorType: 'user', action: TrackingEventCode.ORDER_CREATED, targetType: 'order', targetId: order.id });
    return order;
  }

  @Get(':id')
  @Roles(RoleCode.CUSTOMER, RoleCode.MERCHANT, RoleCode.SUPPORT_AGENT, RoleCode.SUPER_ADMIN)
  async get(@Param('id') id: string) {
    if (this.hasPrisma()) return (this.prisma as any).order.findUnique({ where: { id }, include: { items: true, shipments: true, payments: true } });
    return { id, status: OrderStatus.DRAFT };
  }

  private total(items: Array<Record<string, unknown>>) {
    return items.reduce((sum, item) => sum + Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1), 0);
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).order?.create === 'function');
  }
}
