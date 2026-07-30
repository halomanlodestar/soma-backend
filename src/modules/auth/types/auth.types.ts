export interface GoogleUserData {
  email: string;
  displayName: string;
  profilePhoto?: string;
}

export interface AuthSessionMetadata {
  clientType: 'WEB' | 'IOS' | 'ANDROID';
  deviceName?: string;
  userAgent?: string;
}

export interface LoginUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: string;
}

export type RefreshResult =
  | { status: 'invalid' }
  | { status: 'reused' }
  | {
      status: 'success';
      user: LoginUser;
      sessionId: string;
      refreshToken: string;
    };
