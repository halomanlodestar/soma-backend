export class LoginResponseDto {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  sessionId: string;
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    role: string;
  };
}
