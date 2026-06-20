import { ConflictException, Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditLogRecord = {
  actorId: string;
  actorType: string;
  action: string;
  targetType: string;
  targetId?: string;
  riskLevel?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditLogService {
  private readonly memoryLogs: AuditLogRecord[] = [];

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  create(record: AuditLogRecord): AuditLogRecord {
    const immutableRecord = Object.freeze({
      ...record,
      metadata: Object.freeze(record.metadata ?? {})
    });
    if (this.hasPrisma()) {
      void (this.prisma as any).auditLog.create({
        data: {
          actorId: record.actorId,
          actorType: record.actorType,
          action: record.action,
          targetType: record.targetType,
          targetId: record.targetId,
          riskLevel: record.riskLevel,
          metadata: record.metadata ?? {}
        }
      }).catch(() => undefined);
    }
    this.memoryLogs.push(immutableRecord);
    return immutableRecord;
  }

  list(): readonly AuditLogRecord[] {
    return this.memoryLogs;
  }

  delete(): never {
    throw new ConflictException('Audit logs are immutable and cannot be deleted.');
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).auditLog?.create === 'function');
  }
}
