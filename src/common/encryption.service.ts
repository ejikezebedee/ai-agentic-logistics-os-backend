import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(@Inject(ConfigService) config: ConfigService) {
    const configured = config.get<string>('ENCRYPTION_KEY_BASE64');
    this.key = configured && !configured.startsWith('replace-')
      ? Buffer.from(configured, 'base64')
      : Buffer.from('00000000000000000000000000000000');
  }

  encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
  }

  decrypt(value: string): string {
    const [ivRaw, tagRaw, encryptedRaw] = value.split('.');
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivRaw, 'base64'));
    decipher.setAuthTag(Buffer.from(tagRaw, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw, 'base64')),
      decipher.final()
    ]).toString('utf8');
  }
}
