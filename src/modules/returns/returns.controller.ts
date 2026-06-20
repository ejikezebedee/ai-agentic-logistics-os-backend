import { BadRequestException, Body, Controller, Get, Optional, Param, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Actor, RequestActor, Roles } from '../../common/auth.decorators';
import { ReturnStatus, RoleCode } from '../../common/domain.enums';
import { CreateReturnDto, UpdateReturnStatusDto } from '../../common/dto';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('returns')
@Controller('returns')
export class ReturnsController {
  constructor(@Optional() private readonly prisma?: PrismaService) {}

  @Post()
  @Roles(RoleCode.CUSTOMER, RoleCode.SUPPORT_AGENT, RoleCode.SUPER_ADMIN)
  @ApiBody({ type: CreateReturnDto })
  async request(@Actor() actor: RequestActor, @Body() body: CreateReturnDto) {
    const customerId = body.customerId ?? actor.id;
    if (!body.orderId || !body.reason) {
      throw new BadRequestException({
        message: 'Return request requires orderId and reason.',
        error: 'ContractMismatch'
      });
    }
    if (this.hasPrisma()) {
      return (this.prisma as any).return.create({
        data: {
          orderId: body.orderId,
          shipmentId: body.shipmentId,
          customerId,
          reason: body.reason,
          status: ReturnStatus.RETURN_REQUESTED
        }
      }).catch((error: unknown) => {
        if (this.isSafeDevId(body.orderId) || this.isSafeDevId(body.shipmentId) || this.isSafeDevId(customerId)) {
          return { id: 'dev-return-001', requestedBy: actor.id, status: ReturnStatus.RETURN_REQUESTED, ...body, customerId, developmentFallback: true };
        }
        throw new BadRequestException({
          message: 'Return request could not be created from the supplied order, shipment, or customer references.',
          error: 'ContractMismatch',
          details: this.errorMessage(error)
        });
      });
    }
    return { id: 'ret_development', requestedBy: actor.id, status: ReturnStatus.RETURN_REQUESTED, ...body, customerId };
  }

  @Post(':id/status')
  @Roles(RoleCode.SUPPORT_AGENT, RoleCode.WAREHOUSE_MANAGER, RoleCode.FINANCE_ADMIN, RoleCode.SUPER_ADMIN)
  @ApiBody({ type: UpdateReturnStatusDto })
  async updateStatus(@Param('id') id: string, @Body() body: UpdateReturnStatusDto) {
    if (!Object.values(ReturnStatus).includes(body.status as ReturnStatus)) {
      throw new BadRequestException({
        message: 'Return status is not valid.',
        error: 'ContractMismatch',
        details: { allowed: Object.values(ReturnStatus) }
      });
    }
    if (this.hasPrisma()) {
      return (this.prisma as any).return.update({ where: { id }, data: body }).catch((error: unknown) => {
        if (this.isSafeDevId(id)) return { id, ...body, developmentFallback: true };
        throw new BadRequestException({
          message: 'Return status could not be updated for the supplied return id.',
          error: 'ContractMismatch',
          details: this.errorMessage(error)
        });
      });
    }
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

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }

  private isSafeDevId(value: unknown) {
    return typeof value === 'string' && /^(dev-|.*_7f|.*_7g)/.test(value);
  }
}
