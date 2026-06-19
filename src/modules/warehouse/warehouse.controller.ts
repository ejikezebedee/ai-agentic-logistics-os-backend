import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
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
  @ApiBody({ type: WarehousePackageDto })
  startPick(@Actor() actor: RequestActor, @Body() dto: WarehousePackageDto) {
    return this.warehouse.startPick(actor.id, this.packageId(dto));
  }

  @Post('scan')
  @ApiBody({ type: WarehousePackageDto })
  scan(@Actor() actor: RequestActor, @Body() dto: WarehousePackageDto) {
    const packageId = this.packageId(dto);
    return this.warehouse.scanItem(actor.id, packageId, dto.barcode ?? packageId);
  }

  @Post('pack')
  @ApiBody({ type: WarehousePackageDto })
  pack(@Actor() actor: RequestActor, @Body() dto: WarehousePackageDto) {
    return this.warehouse.pack(actor.id, this.packageId(dto));
  }

  @Post('label')
  @ApiBody({ type: WarehousePackageDto })
  label(@Actor() actor: RequestActor, @Body() dto: WarehousePackageDto) {
    return this.warehouse.generateLabel(actor.id, this.packageId(dto));
  }

  @Post('stage')
  @ApiBody({ type: WarehousePackageDto })
  stage(@Actor() actor: RequestActor, @Body() dto: WarehousePackageDto) {
    return this.warehouse.stage(actor.id, this.packageId(dto));
  }

  @Post('ready-for-dispatch')
  @ApiBody({ type: WarehousePackageDto })
  ready(@Actor() actor: RequestActor, @Body() dto: WarehousePackageDto) {
    return this.warehouse.markReady(actor.id, this.packageId(dto));
  }

  private packageId(dto: WarehousePackageDto) {
    const packageId = dto.packageId ?? dto.id ?? dto.barcode;
    if (!packageId) {
      throw new BadRequestException({
        message: 'packageId, id, or barcode is required.',
        error: 'ContractMismatch'
      });
    }
    return packageId;
  }
}
