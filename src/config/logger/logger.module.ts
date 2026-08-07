import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';
import { LoggerModule } from 'nestjs-pino';
import { CORRELATION_ID_HEADER } from 'src/constants/correlation-id';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get('NODE_ENV') === 'development';
        return {
          pinoHttp: {
            level: isDev ? 'debug' : 'info',
            transport: isDev
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
            // note: logger runs before middleware (CorrelationIdMiddleware)
            // --> logger will declare request id, CorrelationIdMiddleware no need to do this but still keep this logic in middleware
            // go check CorrelationIdMiddleware to see that.
            genReqId: (req, res) => {
              const existing = req.headers[CORRELATION_ID_HEADER];
              const id = existing ?? randomUUID();
              req.headers[CORRELATION_ID_HEADER] = id;
              res.setHeader(CORRELATION_ID_HEADER, id);
              return id;
            },
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookies',
                'req.body.password',
                'req.headers["set-cookie"]',
              ],
              consor: '[REDACTED]', // replace sensitive data with this string
            }, // hide sensitive informations

            customProps: (req: IncomingMessage) => ({
              userId: (req as IncomingMessage & { user?: { id: string } }).user
                ?.id,
            }),
          },
        };
      },
    }),
  ],
  exports: [LoggerModule],
})
export class PinoLoggerModule {}
