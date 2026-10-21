import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { Verification } from './entities/verification.entity';
import { SessionAuthService } from './session-auth/session-auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Session, Verification]), UserModule],
  providers: [SessionAuthService],
  exports: [SessionAuthService],
  controllers: [AuthController],
})
export class AuthModule {}
