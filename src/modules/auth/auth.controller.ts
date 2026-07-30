import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from '../../common/guards/google-auth.guard';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Res } from '@nestjs/common';
import { AuthHandoffExchangeDto, RefreshTokenDto } from './dto/auth-token.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard redirects to Google OAuth - no implementation needed
  }

  @Get('google/callback')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const handoffCode = await this.authService.createHandoff(req.user);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    return res.redirect(
      `${frontendUrl}/api/auth/callback?code=${encodeURIComponent(handoffCode)}`,
    );
  }

  @Post('exchange')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  exchange(@Body() body: AuthHandoffExchangeDto) {
    return this.authService.exchangeHandoff(body.handoffCode);
  }

  @Post('refresh')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async logout(@Body() body: RefreshTokenDto) {
    await this.authService.logout(body.refreshToken);
    return { success: true };
  }
}
