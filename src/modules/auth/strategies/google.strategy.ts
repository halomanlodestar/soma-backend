import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

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
    accessToken: string,
    refreshToken: string,
    profile: Record<string, any>,
    done: VerifyCallback,
  ): Promise<any> {
    const emails = profile.emails as Array<{ value: string }>;
    const displayName = profile.displayName as string;
    const photos = profile.photos as Array<{ value: string }> | undefined;

    const email = emails[0].value;

    const user = await this.authService.validateGoogleUser({
      email,
      displayName,
      profilePhoto: photos?.[0]?.value,
    });

    done(null, user);
  }
}
