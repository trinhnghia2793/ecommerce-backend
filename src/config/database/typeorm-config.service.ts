import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DATABASE_CONFIG } from './database.config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  // constructor
  constructor(private readonly config: ConfigService) {}

  // get connection config
  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbConfig =
      this.config.getOrThrow<TypeOrmModuleOptions>(DATABASE_CONFIG);

    const isDev = this.config.get('NODE_ENV') === 'development';

    return {
      ...dbConfig,
      autoLoadEntities: true, // TypeORM load entities automatically; Register entity in module
      synchronize: false, // for use migration instead of update schema
      logging: isDev ? ['error', 'warn', 'query'] : ['error'],
      migrationsRun: false, // not run migration automatically when server starts (must run migration by commands)
      retryAttempts: 5,
      retryDelay: 3000,
      namingStrategy: new SnakeNamingStrategy(), // auto convert into snake_case for Postgres
    };
  }
}
