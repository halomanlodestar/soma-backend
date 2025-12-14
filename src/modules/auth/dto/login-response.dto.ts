export class LoginResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    role: string;
  };
}
