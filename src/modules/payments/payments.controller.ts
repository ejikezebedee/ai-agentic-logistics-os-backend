import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Actor, Roles } from '../../common/auth.decorators';
import { RefundDto } from '../../common/dto';
import { RoleCode } from '../../common/domain.enums';
import { RequestActor } from '../../common/auth.decorators';
import { OperationsService } from '../shipments/operations.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly operations: OperationsService) {}

  @Post('refunds')
  @Roles(RoleCode.FINANCE_ADMIN, RoleCode.SUPER_ADMIN)
  @ApiBody({ type: RefundDto })
  refund(@Actor() actor: RequestActor, @Body() dto: RefundDto) {
    return this.operations.refund(actor.id, dto);
  }
}
