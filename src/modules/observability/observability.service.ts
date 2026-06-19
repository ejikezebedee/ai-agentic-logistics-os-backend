import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger('ai-agentic-logistics-os');
  private readonly startedAt = Date.now();
  private readonly counters = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  health() {
    return {
      status: 'ok',
      service: 'ai-agentic-logistics-os-backend',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000)
    };
  }

  async readiness() {
    const checks: Record<string, { status: 'ready' | 'blocked'; reason?: string }> = {
      api: { status: 'ready' },
      database: { status: 'blocked', reason: 'Not checked.' },
      providers: { status: 'ready', reason: 'Mock/dev adapters only; no live provider connections.' },
      queues: { status: 'ready', reason: 'Enqueue-only mock queue; no workers or polling loops started.' }
    };

    try {
      if (typeof (this.prisma as any).$queryRawUnsafe === 'function') {
        await (this.prisma as any).$queryRawUnsafe('SELECT 1');
        checks.database = { status: 'ready' };
      }
    } catch (error) {
      checks.database = { status: 'blocked', reason: error instanceof Error ? error.message : 'Database check failed.' };
    }

    return {
      status: Object.values(checks).every((check) => check.status === 'ready') ? 'ready' : 'degraded',
      checks
    };
  }

  metrics() {
    return {
      metricsReady: true,
      format: 'json',
      counters: Object.fromEntries(this.counters.entries()),
      notes: ['Prometheus/OpenTelemetry exporter can wrap this service in production.']
    };
  }

  auditSecurityEvent(eventType: string, severity: string, metadata?: Record<string, unknown>) {
    this.increment(`security.${eventType}`);
    this.logger.warn({ eventType, severity, metadata });
    return { accepted: true, eventType, severity };
  }

  increment(metric: string) {
    this.counters.set(metric, (this.counters.get(metric) ?? 0) + 1);
  }
}
