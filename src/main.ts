/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { parseEnvOrigins } from './utils/parse-env-origins';
import { ValidationPipe } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// get origin list
const getCorsAllowList = (config: ConfigService) => {
  return parseEnvOrigins(
    config.get<string>('CLIENT_URL'),
    config.get<string>('CORS_OTHER_URL'),
  );
};

// bootstrap
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // get env from config service
  const config = app.get(ConfigService);

  // cookie parser --> request.cookies() to get cookies
  app.use(cookieParser());

  // cors --> allow frontend to call backend
  const allowList = getCorsAllowList(config);
  app.enableCors({
    origin: (requestOrigin: string, callback) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      if (allowList.includes(requestOrigin)) {
        callback(null, true);
        return;
      }

      // log warning

      callback(null, false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: [
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

  await app.listen(config.get<number>('PORT') ?? 8080);
}
void bootstrap();
