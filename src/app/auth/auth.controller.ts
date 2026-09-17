import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { SessionAuthService } from './session-auth/session-auth.service';
import { plainToInstance } from 'class-transformer';
import { UserReponseDto } from '../user/dto/user-response.dto';
import { User } from '../user/entities/user.entity';
import { ResEx } from 'src/swagger/response-examples';

@ApiTags('Authentication (Auth)')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly sessionAuth: SessionAuthService,
  ) {}

  //
  private mapUserResponse(user: User) {
    return plainToInstance(UserReponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  //
  private async sessionFromRequest(req: { headers: any }) {
    const ctx = await this.sessionAuth.resolveSessionContext(req.headers);

    if (!ctx) return null;

    return {
      user: this.mapUserResponse(ctx.user),
      session: {
        token: ctx.session.token,
        expiresAt: ctx.session.expiresAt,
      },
    };
  }

  // verify user email
  @Get('verify-email')
  @ApiOperation({
    summary: 'Verify email through token (query)',
    operationId: 'auth_verify_email',
  })
  @ApiOkResponse({
    description: 'Response example',
    schema: { example: ResEx.auth.verifyEmail },
  })
  async verifyEmail(
    @Query('token') token: string,
    @Query('email') email: string,
  ) {
    return this.authService.verifyEmailCustom(token, email);
  }

  // get current user info (get-me)
  @Get('me')
  @ApiOperation({
    summary: "Get current user's information (Bearer or cookie session)",
    operationId: 'auth_get_me',
  })
  @ApiOkResponse({
    description:
      'Respone example when authenticated; when not have session, response return authenticated: false',
    schema: { example: ResEx.auth.me },
  })
  @ApiBadRequestResponse({
    description: 'Token is invalid or expired',
    schema: { example: ResEx.auth.verifyEmailBadRequest },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: { example: ResEx.auth.verifyEmailNotFound },
  })
  @ApiBearerAuth()
  async getCurrentUser(@Req() req: any) {
    const session = await this.sessionFromRequest(req);

    if (!session?.user) {
      return {
        success: false,
        authenticated: false,
        messsage: 'Not authenticated',
        user: null,
      };
    }

    const fullUser = await this.userService.getUser(session.user.id);

    return {
      success: true,
      authenticated: true,
      user: fullUser ? this.mapUserResponse(fullUser) : session.user,
    };
  }

  // get session & user from request
  @Get('session')
  @ApiOperation({
    summary: 'Get session (token, expires at, user)',
    operationId: 'auth_get_session',
  })
  @ApiOkResponse({
    description: 'Response example when have session',
    schema: { example: ResEx.auth.session },
  })
  @ApiBearerAuth()
  async getSession(@Req() req: any) {
    const session = await this.sessionFromRequest(req);

    if (!session?.session) {
      return {
        success: false,
        authenticated: false,
      };
    }

    return {
      success: true,
      authenticated: true,
      session: {
        token: session.session.token,
        expiresAt: session.session.expiresAt,
      },
      user: session.user,
    };
  }

  // check if user is authenticated (logged in)
  @Get('check')
  @ApiOperation({
    summary: 'Check if user is authenticated (logged in)',
    operationId: 'auth_check',
  })
  @ApiOkResponse({
    description: 'Response example',
    schema: { example: ResEx.auth.check },
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK) // always return 200
  async checkAuth(@Req() req: any) {
    const session = await this.sessionFromRequest(req);

    if (!session?.user) {
      return {
        authenticated: false,
        user: null,
      };
    }

    return {
      authenticated: true,
      user: session.user,
    };
  }
}
