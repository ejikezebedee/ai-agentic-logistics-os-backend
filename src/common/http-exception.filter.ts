import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  retryAfterSeconds?: number;
  details?: unknown;
};

@Catch()
export class HttpErrorEnvelopeFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { correlationId?: string }>();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = this.bodyFor(exception);
    const messages = Array.isArray(body.message) ? body.message : [body.message ?? this.defaultMessage(status)];

    response.status(status).json({
      error: {
        code: this.codeFor(status, body),
        message: messages[0],
        details: {
          messages,
          retryAfterSeconds: body.retryAfterSeconds,
          validation: Array.isArray(body.message) ? body.message : undefined,
          providerFailure: status === HttpStatus.BAD_GATEWAY || body.error === 'ProviderFailure' ? body.details ?? body.message : undefined,
          approvalRequired: body.error === 'ApprovalRequired' ? body.details ?? body.message : undefined
        },
        status,
        path: request.originalUrl ?? request.url,
        correlationId: request.correlationId ?? request.headers['x-correlation-id'] ?? null,
        timestamp: new Date().toISOString()
      }
    });
  }

  private bodyFor(exception: unknown): ErrorBody {
    if (!(exception instanceof HttpException)) return { message: 'Internal server error.' };
    const response = exception.getResponse();
    if (typeof response === 'string') return { message: response };
    return response as ErrorBody;
  }

  private codeFor(status: number, body: ErrorBody) {
    if (status === HttpStatus.UNAUTHORIZED) return 'AUTH_UNAUTHORIZED';
    if (status === HttpStatus.FORBIDDEN) return 'RBAC_PERMISSION_DENIED';
    if (status === HttpStatus.BAD_REQUEST && Array.isArray(body.message)) return 'VALIDATION_FAILED';
    if (status === HttpStatus.TOO_MANY_REQUESTS) return 'RATE_LIMIT_EXCEEDED';
    if (body.error === 'ProviderFailure' || status === HttpStatus.BAD_GATEWAY) return 'PROVIDER_FAILURE';
    if (body.error === 'ApprovalRequired') return 'AI_APPROVAL_REQUIRED';
    return body.error?.toUpperCase().replace(/[^A-Z0-9]+/g, '_') || `HTTP_${status}`;
  }

  private defaultMessage(status: number) {
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) return 'Internal server error.';
    return 'Request failed.';
  }
}
