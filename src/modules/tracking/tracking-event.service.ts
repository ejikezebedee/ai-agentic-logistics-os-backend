import { ConflictException, Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type TrackingTimelineEvent = {
  shipmentId: string;
  eventCode: string;
  actorType: string;
  actorId?: string;
  occurredAt: Date;
  location?: Record<string, unknown>;
  proofRef?: string;
  nextAllowedStates?: string[];
  metadata?: Record<string, unknown>;
};

@Injectable()
export class TrackingEventService {
  private readonly events: TrackingTimelineEvent[] = [];

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  append(input: Omit<TrackingTimelineEvent, 'occurredAt'>): TrackingTimelineEvent {
    const event = Object.freeze({ ...input, occurredAt: new Date() });
    this.events.push(event);
    if (this.hasPrisma()) {
      void (this.prisma as any).trackingEvent.create({
        data: {
          shipmentId: input.shipmentId,
          packageId: (input.metadata?.packageId as string | undefined) ?? undefined,
          eventCode: input.eventCode,
          actorType: input.actorType,
          actorId: input.actorId,
          location: input.location,
          proofRef: input.proofRef,
          nextAllowedStates: input.nextAllowedStates ?? [],
          metadata: input.metadata ?? {}
        }
      }).catch(() => undefined);
    }
    return event;
  }

  timeline(shipmentId: string): readonly TrackingTimelineEvent[] {
    return this.events.filter((event) => event.shipmentId === shipmentId);
  }

  delete(): never {
    throw new ConflictException('Tracking history is immutable and cannot be deleted.');
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).trackingEvent?.create === 'function');
  }
}
