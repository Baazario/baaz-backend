import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { throwError } from 'rxjs';
import { AppException } from '../exceptions/app.exception';
import { ErrorCode } from '../exceptions/error-code.enum';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): unknown {
    const type = host.getType<'http' | 'rpc'>();

    if (type === 'rpc') {
      this.logException(exception);
      return throwError(() =>
        exception instanceof AppException
          ? { statusCode: exception.statusCode, errorCode: exception.errorCode, message: exception.message, meta: exception.meta }
          : { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, errorCode: ErrorCode.INTERNAL_ERROR, message: 'Internal server error' },
      );
    }

    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof AppException
        ? exception.statusCode
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorCode =
      exception instanceof AppException ? exception.errorCode : ErrorCode.INTERNAL_ERROR;

    const message =
      exception instanceof AppException ? exception.message : 'Internal server error';

    this.logException(exception, statusCode);

    res.status(statusCode).json({
      success: false,
      statusCode,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }

  private logException(exception: unknown, statusCode?: number): void {
    const isServer = !statusCode || statusCode >= 500;
    const msg = exception instanceof Error ? exception.message : String(exception);
    const stack = exception instanceof Error ? exception.stack : undefined;
    isServer ? this.logger.error(msg, stack) : this.logger.warn(msg);
  }
}
