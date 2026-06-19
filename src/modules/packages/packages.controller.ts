import { Body, Controller, Get, Optional, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth.decorators';
import { PackageStatus, RoleCode } from '../../common/domain.enums';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('packages')
@Controller('packages')
export class PackagesController {
  constructor(@Optional() private readonly prisma?: PrismaService) {}

  @Post()
  @Roles(RoleCode.MERCHANT, RoleCode.WAREHOUSE_STAFF, RoleCode.SUPER_ADMIN)
  async create(@Body() body: { shipmentId: string; barcode?: string; weightKg?: number; dimensions?: Record<string, unknown> }) {
    if (this.hasPrisma()) return (this.prisma as any).package.create({ data: { ...body, status: PackageStatus.CREATED } });
    return { id: 'pkg_development', status: PackageStatus.CREATED, ...body };
  }

  @Get(':id')
  @Roles(RoleCode.CUSTOMER, RoleCode.MERCHANT, RoleCode.WAREHOUSE_STAFF, RoleCode.LOGISTIC_DISPONENT, RoleCode.SUPPORT_AGENT, RoleCode.SUPER_ADMIN)
  async get(@Param('id') id: string) {
    if (this.hasPrisma()) return (this.prisma as any).package.findUnique({ where: { id }, include: { events: true, shipment: true } });
    return { id, status: PackageStatus.CREATED };
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).package?.create === 'function');
  }
}
