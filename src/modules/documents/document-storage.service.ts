import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type ObjectReferencePurpose =
  | 'delivery_photo'
  | 'pickup_photo'
  | 'signature'
  | 'warehouse_packing_proof'
  | 'dispute_evidence'
  | 'document';

export type ObjectReference = {
  id: string;
  ownerType: string;
  ownerId: string;
  purpose: ObjectReferencePurpose;
  objectKey: string;
  contentType: string;
  checksum?: string;
  createdAt: Date;
};

@Injectable()
export class DocumentStorageService {
  private readonly refs: ObjectReference[] = [];

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  createReference(input: Omit<ObjectReference, 'id' | 'createdAt'>): ObjectReference {
    if (!input.objectKey || input.objectKey.includes('..') || input.objectKey.startsWith('/')) {
      throw new BadRequestException('Object key must be a safe storage reference, not a filesystem path.');
    }
    const ref = Object.freeze({
      ...input,
      id: `obj_${this.refs.length + 1}`,
      createdAt: new Date()
    });
    this.refs.push(ref);
    if (this.hasPrisma()) {
      void (this.prisma as any).document.create({
        data: {
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          objectKey: input.objectKey,
          contentType: input.contentType,
          checksum: input.checksum,
          accessLevel: 'private'
        }
      });
    }
    return ref;
  }

  list(ownerType?: string, ownerId?: string): readonly ObjectReference[] {
    return this.refs.filter((ref) => (!ownerType || ref.ownerType === ownerType) && (!ownerId || ref.ownerId === ownerId));
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).document?.create === 'function');
  }
}
