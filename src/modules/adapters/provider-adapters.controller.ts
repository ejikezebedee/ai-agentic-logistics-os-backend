import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth.decorators';
import { RoleCode } from '../../common/domain.enums';
import { ProviderAdapterService } from './provider-adapter.service';

@ApiTags('provider-adapters')
@Controller('provider-adapters')
@Roles(RoleCode.SUPER_ADMIN, RoleCode.COMPLIANCE_ADMIN, RoleCode.LOGISTIC_DISPONENT)
export class ProviderAdaptersController {
  constructor(private readonly adapters: ProviderAdapterService) {}

  @Get('health')
  health() {
    return { adapters: this.adapters.health() };
  }

  @Get('catalog')
  catalog() {
    return this.adapters.catalog();
  }

  @Post('storage/upload-reference')
  storage(@Body() body: { objectKey: string; contentType: string }) {
    return this.adapters.storage.createUploadReference(body);
  }

  @Post('payments/authorize')
  @Roles(RoleCode.FINANCE_ADMIN, RoleCode.SUPER_ADMIN)
  payment(@Body() body: { amount: number; currency: string; orderId: string }) {
    return this.adapters.payment.authorize(body);
  }

  @Post('maps/eta')
  eta(@Body() body: { origin: unknown; destination: unknown }) {
    return this.adapters.maps.eta(body);
  }

  @Post('messaging/send')
  @Roles(RoleCode.SUPPORT_AGENT, RoleCode.LOGISTIC_DISPONENT, RoleCode.SUPER_ADMIN)
  messaging(@Body() body: { channel: 'sms' | 'email' | 'whatsapp'; recipient: string; templateCode: string }) {
    return this.adapters.messaging.send(body);
  }

  @Post('kyc/verify')
  @Roles(RoleCode.COMPLIANCE_ADMIN, RoleCode.SUPER_ADMIN)
  kyc(@Body() body: { subjectType: string; subjectId: string }) {
    return this.adapters.kyc.verify(body);
  }

  @Post('carrier/shipments')
  carrier(@Body() body: { shipmentId: string; carrierCode?: string }) {
    return this.adapters.carrier.createShipment(body);
  }

  @Post('erp/ledger-events')
  @Roles(RoleCode.FINANCE_ADMIN, RoleCode.SUPER_ADMIN)
  erp(@Body() body: { referenceId: string; amount: number; currency: string }) {
    return this.adapters.erp.postLedgerEvent(body);
  }

  @Post('webhooks/verify-signature')
  @Roles(RoleCode.COMPLIANCE_ADMIN, RoleCode.SUPER_ADMIN)
  verifyWebhook(@Body() body: { provider: string; payload: string; signature: string; signingSecret?: string }) {
    return this.adapters.verifyWebhookSignature(body);
  }
}
