import { IsString } from 'class-validator';

export class AuthHandoffExchangeDto {
  @IsString()
  handoffCode: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
