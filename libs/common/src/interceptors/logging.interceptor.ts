import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() === 'rpc') {
      const start = Date.now();
      const pattern = JSON.stringify(context.switchToRpc().getContext());
      return next
        .handle()
        .pipe(tap(() => this.logger.log(`RPC ${pattern} (${Date.now() - start}ms)`)));
    }

    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        this.logger.log(`${method} ${url} → ${res.statusCode} (${Date.now() - start}ms)`);
      }),
    );
  }
}
