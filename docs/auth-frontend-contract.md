# Authentication Frontend Contract

Base REST URL: `/api/v1/auth`

## Token lifetimes

| Credential | Lifetime |
| --- | --- |
| Access token | 15 minutes |
| Refresh token | 30 days of inactivity |
| Auth session | 90 days maximum |
| Web handoff code | 60 seconds, single use |

Use the access token on GraphQL requests:

```http
Authorization: Bearer <accessToken>
```

Do not put either Soma token in a URL.

## Web: Google sign-in through Next.js

1. Redirect the browser to `GET /api/v1/auth/google`.
2. The backend completes Google OAuth and redirects to:

   ```text
   {NEXT_APP_URL}/api/auth/callback?code=<handoffCode>
   ```

3. The Next.js route handler reads `code` and performs a server-to-server request:

   ```http
   POST /api/v1/auth/exchange
   Content-Type: application/json

   { "handoffCode": "<handoffCode>" }
   ```

4. Store `refreshToken` in a Next.js-managed `HttpOnly`, `Secure` cookie. Return or retain the access token according to the frontend's BFF/session design.

The handoff code is not a Soma credential. It expires after 60 seconds and can only be exchanged once.

## REST API

### `POST /exchange`

Request:

```json
{ "handoffCode": "string" }
```

### `POST /refresh`

Request:

```json
{ "refreshToken": "string" }
```

### `POST /logout`

Request:

```json
{ "refreshToken": "string" }
```

Response:

```json
{ "success": true }
```

Both `/exchange` and `/refresh` return:

```json
{
  "accessToken": "string",
  "accessTokenExpiresIn": 900,
  "refreshToken": "string",
  "sessionId": "uuid",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "string",
    "displayName": "string | null",
    "role": "VIEWER | CREATOR | ADMIN"
  }
}
```

Refresh tokens remain valid for 30 days of inactivity and are rotated when they are 25 days old. Before that threshold, `/refresh` returns the existing refresh token with a new access token. On rotation, replace the previous refresh token immediately. A reused rotated token revokes that session and returns `401`.

## GraphQL session management

All operations require an access-token bearer header.

```graphql
query MySessions {
  mySessions {
    id
    clientType
    deviceName
    userAgent
    createdAt
    lastUsedAt
    expiresAt
  }
}

mutation RevokeSession($sessionId: String!) {
  revokeSession(sessionId: $sessionId)
}

mutation RevokeAllSessions {
  revokeAllSessions
}
```

`revokeSession` returns `Boolean`; `revokeAllSessions` returns the count of revoked sessions.

## Future mobile integration

The mobile app will obtain a Google ID token from the native Google SDK and submit it to a dedicated backend endpoint. After backend verification, it receives the same token response as `/exchange` and stores `refreshToken` in Keychain/Keystore. The backend does not set cookies.

## Limits and handling

- Google start/callback/exchange: 10 requests/minute.
- Refresh/logout: 30 requests/minute.
- Treat `401` from refresh/exchange as a sign-in-required state.
- Do not log handoff codes, access tokens, or refresh tokens in frontend logs or analytics.
