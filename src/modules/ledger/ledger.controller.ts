import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, Roles } from '../../common/auth.decorators';
import { LedgerEntryType, RoleCode } from '../../common/domain.enums';
import { RequestActor } from '../../common/auth.decorators';
import { LedgerService } from './ledger.service';

@ApiTags('ledger')
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledger: LedgerService) {}

  @Get()
  @Roles(RoleCode.FINANCE_ADMIN, RoleCode.COMPLIANCE_ADMIN, RoleCode.SUPER_ADMIN)
  list() {
    return this.ledger.list();
  }

  @Post('entries')
  @Roles(RoleCode.FINANCE_ADMIN, RoleCode.SUPER_ADMIN)
  append(@Actor() actor: RequestActor, @Body() body: { accountId: string; amount: number; currency: string; referenceType: string; referenceId: string }) {
    return this.ledger.append({ ...body, type: LedgerEntryType.CORRECTION, createdBy: actor.id });
  }

  @Patch('entries/:id')
  update() {
    return this.ledger.update();
  }

  @Delete('entries/:id')
  delete() {
    return this.ledger.delete();
  }
}
