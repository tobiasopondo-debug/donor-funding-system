import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  ResendOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto);
  }

  @Post('otp/resend')
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.auth.resendOtp(dto);
  }

  @Post('refresh')
  refresh(@Req() req: Request) {
    const fromCookie = req.cookies?.refresh_token as string | undefined;
    const fromBody = (req.body as { refreshToken?: string })?.refreshToken;
    return this.auth.refresh(fromCookie ?? fromBody);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  logout(@CurrentUser() user: AuthUser, @Req() req: Request) {
    const fromCookie = req.cookies?.refresh_token as string | undefined;
    return this.auth.logout(user.id, fromCookie);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
