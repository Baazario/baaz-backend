import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // RPC (TCP microservice) — internal transport, return raw data
    if (context.getType() === 'rpc') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();

    // Terminus health endpoints return their own shape — don't wrap
    if (req.url.startsWith('/health')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
