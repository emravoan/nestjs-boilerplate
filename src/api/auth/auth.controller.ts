import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('Auth')
@ApiSecurity('api-secret')
@ApiSecurity('csrf-token')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user and returns auth tokens.
   */
  @ResponseMessage('Registered successfully')
  @Post('register')
  register(@Body() payload: CreateUserDto) {
    return this.authService.register(payload);
  }

  /**
   * Authenticates user credentials and returns auth tokens.
   */
  @ResponseMessage('Logged in successfully')
  @Post('login')
  @ApiBody({ type: LoginDto })
  @UseGuards(LocalAuthGuard)
  login(@Request() req: { user: { id: number; username: string } }) {
    return this.authService.login(req.user);
  }

  /**
   * Exchanges a refresh token for a new token pair.
   */
  @ResponseMessage('Token refreshed successfully')
  @Post('refresh-token')
  @ApiBody({ type: RefreshTokenDto })
  refreshToken(@Body() payload: RefreshTokenDto) {
    return this.authService.refreshToken(payload.refreshToken);
  }

  /**
   * Returns the profile of the currently authenticated user.
   */
  @ResponseMessage('Current user fetched successfully')
  @Get('me')
  @ApiBearerAuth()
  me(@Request() req: { user: { id: number } }) {
    return this.authService.me(req.user.id);
  }
}
