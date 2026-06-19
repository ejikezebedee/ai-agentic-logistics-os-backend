import { Body, Controller, Get, Optional, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, RequestActor, Roles } from '../../common/auth.decorators';
import { ReturnStatus, RoleCode } from '../../common/domain.enums';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('returns')
@Controller('returns')
export class ReturnsController {
  constructor(@Optional() private readonly prisma?: PrismaService) {}

  @Post()
  @Roles(RoleCode.CUSTOMER, RoleCode.SUPPORT_AGENT, RoleCode.SUPER_ADMIN)
  async request(@Actor() actor: RequestActor, @Body() body: { orderId: string; shipmentId?: string; customerId: string; reason: string }) {
    if (this.hasPrisma()) {
      return (this.prisma as any).return.create({
        data: {
          orderId: body.orderId,
          shipmentId: body.shipmentId,
          customerId: body.customerId,
          reason: body.reason,
          status: ReturnStatus.RETURN_REQUESTED
        }
      });
    }
    return { id: 'ret_development', requestedBy: actor.id, status: ReturnStatus.RETURN_REQUESTED, ...body };
  }

  @Post(':id/status')
  @Roles(RoleCode.SUPPORT_AGENT, RoleCode.WAREHOUSE_MANAGER, RoleCode.FINANCE_ADMIN, RoleCode.SUPER_ADMIN)
  async updateStatus(@Param('id') id: string, @Body() body: { status: ReturnStatus; inspection?: Record<string, unknown>; refundId?: string }) {
    if (this.hasPrisma()) return (this.prisma as any).return.update({ where: { id }, data: body });
    return { id, ...body };
  }

  @Get(':id')
  @Roles(RoleCode.CUSTOMER, RoleCode.SUPPORT_AGENT, RoleCode.FINANCE_ADMIN, RoleCode.SUPER_ADMIN)
  async get(@Param('id') id: string) {
    if (this.hasPrisma()) return (this.prisma as any).return.findUnique({ where: { id } });
    return { id, status: ReturnStatus.RETURN_REQUESTED };
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).return?.create === 'function');
  }
}
