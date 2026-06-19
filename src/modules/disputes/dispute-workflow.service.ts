import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { DisputeStatus } from '../../common/domain.enums';
import { PrismaService } from '../../prisma/prisma.service';

type Evidence = {
  disputeId: string;
  evidenceType: string;
  objectKey?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class DisputeWorkflowService {
  private readonly evidence = new Map<string, Evidence[]>();

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  addEvidence(input: Evidence): Evidence {
    const existing = this.evidence.get(input.disputeId) ?? [];
    existing.push(Object.freeze(input));
    this.evidence.set(input.disputeId, existing);
    if (this.hasPrisma()) {
      void (this.prisma as any).disputeEvidence.create({
        data: {
          disputeId: input.disputeId,
          evidenceType: input.evidenceType,
          objectKey: input.objectKey,
          metadata: input.metadata ?? {}
        }
      });
    }
    return input;
  }

  assertCanResolve(disputeId: string): void {
    if (!this.evidence.get(disputeId)?.length) {
      throw new BadRequestException('Cannot resolve dispute without evidence.');
    }
  }

  resolve(disputeId: string, decision: string) {
    this.assertCanResolve(disputeId);
    if (this.hasPrisma()) {
      void (this.prisma as any).dispute.update({
        where: { id: disputeId },
        data: { status: decision as DisputeStatus, resolvedAt: new Date() }
      });
    }
    return { disputeId, decision, status: 'resolved' };
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).disputeEvidence?.create === 'function');
  }
}
