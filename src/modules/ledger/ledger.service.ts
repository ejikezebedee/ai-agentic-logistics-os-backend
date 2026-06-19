import { BadRequestException, ConflictException, Injectable, Optional } from '@nestjs/common';
import { LedgerEntryType } from '../../common/domain.enums';
import { PrismaService } from '../../prisma/prisma.service';

export type LedgerEntryInput = {
  accountId: string;
  type: LedgerEntryType;
  amount: number;
  currency: string;
  referenceType: string;
  referenceId: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
};

export type LedgerEntry = LedgerEntryInput & {
  id: string;
  createdAt: Date;
};

@Injectable()
export class LedgerService {
  private readonly entries: LedgerEntry[] = [];

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  append(input: LedgerEntryInput): LedgerEntry {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new BadRequestException('Ledger entry amount must be positive.');
    }
    const entry = Object.freeze({
      ...input,
      id: `led_${this.entries.length + 1}`,
      createdAt: new Date()
    });
    this.entries.push(entry);
    if (this.hasPrisma()) {
      void (this.prisma as any).ledgerEntry.create({
        data: {
          accountId: input.accountId,
          type: input.type,
          amount: input.amount,
          currency: input.currency,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          createdBy: input.createdBy,
          metadata: input.metadata ?? {}
        }
      });
    }
    return entry;
  }

  reverse(originalEntryId: string, createdBy: string, reason: string): LedgerEntry {
    const original = this.entries.find((entry) => entry.id === originalEntryId);
    if (!original) throw new BadRequestException('Original ledger entry not found.');
    return this.append({
      accountId: original.accountId,
      type: LedgerEntryType.REVERSAL,
      amount: original.amount,
      currency: original.currency,
      referenceType: 'ledger_entry',
      referenceId: original.id,
      createdBy,
      metadata: { reason }
    });
  }

  update(): never {
    throw new ConflictException('Ledger history is immutable. Create correcting or reversing entries instead.');
  }

  delete(): never {
    throw new ConflictException('Ledger entries are immutable and cannot be deleted.');
  }

  list(): readonly LedgerEntry[] {
    return this.entries;
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).ledgerEntry?.create === 'function');
  }
}
