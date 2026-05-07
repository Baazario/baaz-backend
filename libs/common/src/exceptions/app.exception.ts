import { ErrorCode } from './error-code.enum';

export class AppException extends Error {
  constructor(
    public readonly errorCode: ErrorCode,
    message: string,
    public readonly statusCode: number = 500,
    public readonly meta?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppException';
    Error.captureStackTrace(this, this.constructor);
  }
}
