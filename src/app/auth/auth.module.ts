import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { Verification } from './entities/verification.entity';
import { SessionAuthService } from './session-auth/session-auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { RolesGuard } from 'src/core/guards/role.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Session, Verification]), UserModule],
  providers: [SessionAuthService, AuthGuard, RolesGuard],
  exports: [SessionAuthService, AuthGuard, RolesGuard],
  controllers: [AuthController],
})
export class AuthModule {}
