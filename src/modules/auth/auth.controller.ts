import {
  Controller,
  Get,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from '../../common/guards/google-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Res } from '@nestjs/common';

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
    const { accessToken } = await this.authService.login(req.user as any);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    return res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${accessToken}`,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser() user: Express.User) {
    return user;
  }
}
