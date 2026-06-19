import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, Roles } from '../../common/auth.decorators';
import { WarehousePackageDto } from '../../common/dto';
import { RoleCode } from '../../common/domain.enums';
import { RequestActor } from '../../common/auth.decorators';
import { WarehouseFlowService } from './warehouse-flow.service';

@ApiTags('warehouse')
@Controller('warehouse')
@Roles(RoleCode.WAREHOUSE_STAFF, RoleCode.WAREHOUSE_MANAGER, RoleCode.SUPER_ADMIN)
export class WarehouseController {
  constructor(private readonly warehouse: WarehouseFlowService) {}

  @Get('packages/:id')
  get(@Param('id') id: string) {
    return this.warehouse.get(id);
  }

  @Post('pick/start')
  startPick(@Actor() actor: RequestActor, @Body() dto: WarehousePackageDto) {
    return this.warehouse.startPick(actor.id, dto.packageId);
  }

  @Post('scan')
  scan(@Actor() actor: RequestActor, @Body() dto: WarehousePackageDto) {
    return this.warehouse.scanItem(actor.id, dto.packageId, dto.barcode ?? dto.packageId);
  }

  @Post('pack')
  pack(@Actor() actor: RequestActor, @Body() dto: WarehousePackageDto) {
    return this.warehouse.pack(actor.id, dto.packageId);
  }

  @Post('label')
  label(@Actor() actor: RequestActor, @Body() dto: WarehousePackageDto) {
    return this.warehouse.generateLabel(actor.id, dto.packageId);
  }

  @Post('stage')
  stage(@Actor() actor: RequestActor, @Body() dto: WarehousePackageDto) {
    return this.warehouse.stage(actor.id, dto.packageId);
  }

  @Post('ready-for-dispatch')
  ready(@Actor() actor: RequestActor, @Body() dto: WarehousePackageDto) {
    return this.warehouse.markReady(actor.id, dto.packageId);
  }
}
