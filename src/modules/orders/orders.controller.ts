import { BadRequestException, Body, Controller, Get, Optional, Param, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
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
  @ApiBody({ type: CreateOrderDto })
  async create(@Actor() actor: RequestActor, @Body() dto: CreateOrderDto) {
    const items = this.normalizedItems(dto.items);
    const order = this.hasPrisma()
      ? await (this.prisma as any).order.create({
          data: {
            customerId: dto.customerId,
            merchantId: dto.merchantId,
            status: OrderStatus.DRAFT,
            totalAmount: this.total(items),
            currency: dto.currency ?? 'EUR',
            items: {
              create: items.map((item) => ({
                skuId: String(item.skuId),
                quantity: Number(item.quantity ?? 1),
                unitPrice: Number(item.unitPrice ?? 0)
              }))
            }
          },
          include: { items: true }
        }).catch((error: unknown) => {
          throw new BadRequestException({
            message: 'Order could not be created from the supplied customer, merchant, or item references.',
            error: 'ContractMismatch',
            details: this.errorMessage(error)
          });
        })
      : { id: 'ord_development', ...dto, items, status: OrderStatus.DRAFT };
    this.audit.create({ actorId: actor.id, actorType: 'user', action: TrackingEventCode.ORDER_CREATED, targetType: 'order', targetId: order.id });
    return order;
  }

  @Get(':id')
  @Roles(RoleCode.CUSTOMER, RoleCode.MERCHANT, RoleCode.SUPPORT_AGENT, RoleCode.SUPER_ADMIN)
  async get(@Param('id') id: string) {
    if (this.hasPrisma()) return (this.prisma as any).order.findUnique({ where: { id }, include: { items: true, shipments: true, payments: true } });
    return { id, status: OrderStatus.DRAFT };
  }

  @Post(':id/confirm')
  @Roles(RoleCode.CUSTOMER, RoleCode.MERCHANT, RoleCode.SUPER_ADMIN)
  async confirm(@Actor() actor: RequestActor, @Param('id') id: string) {
    let order: Record<string, unknown> = { id, status: OrderStatus.BOOKED, developmentFallback: true };
    if (this.hasPrisma()) {
      order = await (this.prisma as any).order
        .update({ where: { id }, data: { status: OrderStatus.BOOKED }, include: { items: true, shipments: true, payments: true } })
        .catch(() => order);
    }
    this.audit.create({ actorId: actor.id, actorType: 'user', action: 'order.confirmed', targetType: 'order', targetId: id });
    return order;
  }

  private normalizedItems(items: CreateOrderDto['items']) {
    return items.map((item, index) => {
      const skuId = item.skuId ?? item.sku ?? item.productId ?? item.itemId;
      if (!skuId) {
        throw new BadRequestException({
          message: `items[${index}] requires skuId, sku, productId, or itemId.`,
          error: 'ContractMismatch'
        });
      }
      return {
        ...item,
        skuId,
        quantity: item.quantity ?? item.qty ?? 1,
        unitPrice: item.unitPrice ?? item.price ?? 0
      };
    });
  }

  private total(items: CreateOrderDto['items']) {
    return items.reduce((sum, item) => sum + Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1), 0);
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).order?.create === 'function');
  }
}
