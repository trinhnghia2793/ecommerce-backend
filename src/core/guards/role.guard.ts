import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/shared/types/user-role.enum';
import { ROLES_KEY } from '../decorators/role.decorator';
import { AuthenticatedRequest } from './auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {} // Reflector: NestJS tool, read metadata which attached on route using SetMetadata

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!user || !user.role) {
      throw new ForbiddenException('You do not have access');
    }
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have access');
    }

    return true;
  }
}
