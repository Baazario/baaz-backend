import { Params } from 'nestjs-pino';

export function buildLoggerOptions(serviceName: string): Params {
  const isDev = process.env.NODE_ENV !== 'production';
  return {
    pinoHttp: {
      name: serviceName,
      level: isDev ? 'debug' : 'info',
      ...(isDev && {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, singleLine: true, translateTime: 'SYS:standard' },
        },
      }),
      customProps: () => ({ service: serviceName }),
      quietReqLogger: true,
    },
  };
}
