import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { GoogleProfile } from '../types/profiles.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    const providerAccountId = profile.id;
    const emailVerified = profile._json?.email_verified === true;

    if (!email || !providerAccountId) {
      throw new UnauthorizedException(
        'Google did not return a usable identity.',
      );
    }

    const user = await this.authService.validateGoogleUser({
      providerAccountId,
      email,
      emailVerified,
      displayName: profile.displayName ?? email,
      profilePhoto: profile.photos?.[0]?.value,
    });

    done(null, user);
  }
}
