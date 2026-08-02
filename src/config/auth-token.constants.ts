export const AUTH_TOKEN_LIFETIMES = {
  accessTokenSeconds: 15 * 60,
  refreshTokenDays: 30,
  refreshTokenRotationDays: 25,
  sessionDays: 90,
} as const;
