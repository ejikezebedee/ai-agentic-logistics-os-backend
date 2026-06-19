import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app' | 'webhook';

export type NotificationRequest = {
  channel: NotificationChannel;
  recipientType: string;
  recipientId: string;
  templateCode: string;
  payload: Record<string, unknown>;
  webhookUrl?: string;
};

@Injectable()
export class NotificationService {
  private readonly notifications: Array<NotificationRequest & { id: string; status: string }> = [];

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  enqueue(input: NotificationRequest) {
    const record = Object.freeze({ ...input, id: `ntf_${this.notifications.length + 1}`, status: 'queued' });
    this.notifications.push(record);
    if (this.hasPrisma()) {
      void (this.prisma as any).notification.create({
        data: {
          channel: input.channel,
          recipientType: input.recipientType,
          recipientId: input.recipientId,
          templateCode: input.templateCode,
          payload: { ...input.payload, webhookUrl: input.webhookUrl }
        }
      });
    }
    return record;
  }

  list(): ReadonlyArray<NotificationRequest & { id: string; status: string }> {
    return this.notifications;
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).notification?.create === 'function');
  }
}
