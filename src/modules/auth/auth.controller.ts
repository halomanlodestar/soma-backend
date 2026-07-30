import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from '../../common/guards/google-auth.guard';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Res } from '@nestjs/common';
import { AuthTokenDto } from './dto/auth-token.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard redirects to Google OAuth - no implementation needed
  }

  @Get('google/callback')
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
  exchange(@Body() body: AuthTokenDto) {
    return this.authService.exchangeHandoff(body.token);
  }

  @Post('refresh')
  refresh(@Body() body: AuthTokenDto) {
    return this.authService.refresh(body.token);
  }

  @Post('logout')
  async logout(@Body() body: AuthTokenDto) {
    await this.authService.logout(body.token);
    return { success: true };
  }
}
