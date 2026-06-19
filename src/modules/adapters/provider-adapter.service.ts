import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

export type AdapterHealth = {
  provider: string;
  mode: 'mock';
  status: 'ready';
  liveConnection: false;
};

@Injectable()
export class ProviderAdapterService {
  readonly storage = {
    createUploadReference: (input: { objectKey: string; contentType: string }) => ({
      provider: 'mock-s3',
      uploadUrl: `mock://storage/${input.objectKey}`,
      objectKey: input.objectKey,
      contentType: input.contentType,
      liveConnection: false
    })
  };

  readonly payment = {
    authorize: (input: { amount: number; currency: string; orderId: string }) => ({
      provider: 'mock-payment',
      providerRef: `mock_pay_${input.orderId}`,
      status: 'authorized',
      amount: input.amount,
      currency: input.currency,
      liveMovement: false
    })
  };

  readonly maps = {
    eta: (input: { origin: unknown; destination: unknown }) => ({
      provider: 'mock-maps',
      etaMinutes: 30,
      distanceKm: 12,
      origin: input.origin,
      destination: input.destination,
      liveConnection: false
    })
  };

  readonly messaging = {
    send: (input: { channel: 'sms' | 'email' | 'whatsapp'; recipient: string; templateCode: string }) => ({
      provider: `mock-${input.channel}`,
      status: 'queued',
      recipient: input.recipient,
      templateCode: input.templateCode,
      liveDelivery: false
    })
  };

  readonly kyc = {
    verify: (input: { subjectType: string; subjectId: string }) => ({
      provider: 'mock-kyc',
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      status: 'verified_for_development',
      liveCheck: false
    })
  };

  readonly carrier = {
    createShipment: (input: { shipmentId: string; carrierCode?: string }) => ({
      provider: 'mock-carrier',
      shipmentId: input.shipmentId,
      carrierCode: input.carrierCode ?? 'mock-carrier',
      trackingRef: `mock_carrier_${input.shipmentId}`,
      liveBooking: false
    })
  };

  readonly erp = {
    postLedgerEvent: (input: { referenceId: string; amount: number; currency: string }) => ({
      provider: 'mock-erp-accounting',
      externalJournalId: `mock_journal_${input.referenceId}`,
      amount: input.amount,
      currency: input.currency,
      livePosting: false
    })
  };

  verifyWebhookSignature(input: { provider: string; payload: string; signature: string; signingSecret?: string }) {
    if (!input.signingSecret) {
      return {
        provider: input.provider,
        signatureValid: false,
        liveSecretUsed: false,
        reason: 'No signing secret configured. Production must inject provider-specific secret from secret manager.'
      };
    }
    const expected = createHmac('sha256', input.signingSecret).update(input.payload).digest('hex');
    const signatureValid =
      expected.length === input.signature.length &&
      timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(input.signature, 'utf8'));
    return { provider: input.provider, signatureValid, liveSecretUsed: false, algorithm: 'hmac-sha256' };
  }

  health(): AdapterHealth[] {
    return ['mock-s3', 'mock-payment', 'mock-maps', 'mock-sms-email-whatsapp', 'mock-kyc', 'mock-carrier', 'mock-erp-accounting'].map((provider) => ({
      provider,
      mode: 'mock',
      status: 'ready',
      liveConnection: false
    }));
  }

  catalog() {
    return {
      mode: 'mock_only',
      liveProvidersEnabled: false,
      providers: this.health().map((adapter) => adapter.provider),
      productionRequiredCapabilities: [
        'secret_manager_injection',
        'webhook_replay_protection',
        'idempotency_keys',
        'retry_backoff',
        'reconciliation_jobs',
        'provider_certification'
      ]
    };
  }
}
