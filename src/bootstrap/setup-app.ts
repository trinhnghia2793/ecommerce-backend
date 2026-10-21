import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { APP_CONFIG } from 'src/config/app/app.config';

export function setupApp(
  app: NestExpressApplication,
  logger: Logger,
  config: ConfigService,
) {
  // cookie parser --> request.cookies() to get cookies
  app.use(cookieParser());

  // cors --> allow frontend to call backend
  const appCfg = config.getOrThrow<{ corsOrigins: string[] }>(APP_CONFIG);
  const allowList = appCfg.corsOrigins;
  app.enableCors({
    origin: (requestOrigin: string, callback) => {
      // requests from postman, thunder client... (not have origin) --> approved
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      // requests from allow list --> approved
      if (allowList.includes(requestOrigin)) {
        callback(null, true);
        return;
      }

      // block requests not in allow list
      logger.warn(
        `CORS: blocked request from origin ${requestOrigin} (not in allowList)`,
      );
      callback(null, false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    credentials: true,
  });

  // global validation pipe config
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // allow convert request data --> DTO instance
      transformOptions: { enableImplicitConversion: true }, // allow NestJS guess data type & convert to the data type base on DTO's attribute
      whitelist: true, // discard fields that not included in DTO
      forbidNonWhitelisted: true, // return 400 if request data contains "no need" fields
    }),
  );

  // api versioning config --> /api/v1
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // shut down app safety
  app.enableShutdownHooks();
}
