import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Actor, Roles } from '../../common/auth.decorators';
import { EscrowReleaseDto } from '../../common/dto';
import { RoleCode } from '../../common/domain.enums';
import { RequestActor } from '../../common/auth.decorators';
import { OperationsService } from '../shipments/operations.service';

@ApiTags('escrow')
@Controller('escrow')
export class EscrowController {
  constructor(private readonly operations: OperationsService) {}

  @Post('release')
  @Roles(RoleCode.FINANCE_ADMIN, RoleCode.SUPER_ADMIN)
  @ApiBody({ type: EscrowReleaseDto })
  release(@Actor() actor: RequestActor, @Body() dto: EscrowReleaseDto) {
    return this.operations.releaseEscrow(actor.id, dto);
  }
}
