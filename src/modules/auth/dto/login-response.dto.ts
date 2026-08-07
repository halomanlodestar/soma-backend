export class LoginResponseDto {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  sessionId: string;
  user: {
    id: string;
    email: string;
    platformRole: string;
    profile: {
      username: string;
      displayName: string | null;
    } | null;
  };
}
