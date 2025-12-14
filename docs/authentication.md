# Soma Authentication System

Complete authentication implementation using Google OAuth, JWT, and Prisma.

## Features

- ✅ Google OAuth 2.0 authentication
- ✅ JWT-based authorization
- ✅ Role-based access control (VIEWER, CREATOR, ADMIN)
- ✅ Automatic user creation on first login
- ✅ Unique username generation
- ✅ Protected routes with guards
- ✅ User profile management

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT signing (min 16 characters)
- `JWT_EXPIRATION`: Token expiration time (default: "7d")
- `GOOGLE_CLIENT_ID`: From Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
- `GOOGLE_CALLBACK_URL`: OAuth callback URL (e.g., http://localhost:3000/auth/google/callback)

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - Your production callback URL
7. Copy Client ID and Client Secret to `.env`

### 3. Database Migration

Run Prisma migrations to create database schema:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## API Endpoints

### Authentication

#### `GET /auth/google`

Initiates Google OAuth flow. Redirects to Google login page.

#### `GET /auth/google/callback`

OAuth callback endpoint. Returns JWT token and user info.

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "displayName": "John Doe",
    "role": "VIEWER"
  }
}
```

#### `GET /auth/me`

Get current authenticated user info. Requires JWT token.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Response:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "role": "VIEWER"
}
```

### User Profile

#### `GET /users/me`

Get full profile of authenticated user.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Response:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "displayName": "John Doe",
  "bio": "Software developer",
  "role": "VIEWER",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

#### `PATCH /users/me`

Update authenticated user's profile.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Body:**

```json
{
  "displayName": "New Display Name",
  "bio": "Updated bio"
}
```

**Response:** Updated user object

#### `GET /users/:username`

Get public profile by username (no auth required).

**Response:** User object

## Guards and Decorators

### `@UseGuards(JwtAuthGuard)`

Protects routes requiring authentication. Validates JWT token.

```typescript
@Get('protected')
@UseGuards(JwtAuthGuard)
async protectedRoute(@CurrentUser() user: any) {
  return { message: 'This is protected', user };
}
```

### `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`

Protects routes requiring specific roles.

```typescript
@Post('posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CREATOR', 'ADMIN')
async createPost(@CurrentUser() user: any, @Body() dto: CreatePostDto) {
  // Only CREATOR and ADMIN can create posts
}
```

### `@CurrentUser()`

Injects authenticated user into route handler.

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
async getMe(@CurrentUser() user: any) {
  return user; // { id, email, username, role }
}
```

## Authentication Flow

### 1. User Login

```
User → /auth/google → Google OAuth → /auth/google/callback → JWT Token
```

### 2. Protected Request

```
Client sends JWT in Authorization header
→ JwtAuthGuard validates token
→ JwtStrategy extracts user from token
→ User attached to request
→ Route handler receives user via @CurrentUser()
```

### 3. Role-based Authorization

```
Request → JwtAuthGuard (validates auth)
→ RolesGuard (checks user.role against @Roles())
→ Allow/Deny access
```

## User Roles

- **VIEWER**: Default role for all new users. Can view content.
- **CREATOR**: Can create posts and content. Manually assigned.
- **ADMIN**: Full system access. Manually assigned.

## Username Generation

When a new user signs up via Google:

1. Try username from email prefix (e.g., `john.doe@gmail.com` → `johndoe`)
2. If taken, try username from display name
3. If still taken, append random 4-digit number
4. Fallback to timestamp if all else fails

All usernames are:

- Lowercase
- Alphanumeric only
- Unique

## Security Notes

- JWT tokens are stateless (no server-side session storage)
- Tokens expire based on `JWT_EXPIRATION` setting
- No refresh token implementation (add if needed)
- User roles must be manually assigned in database
- Passwords not supported (OAuth only)

## Testing

### Manual Testing

1. Start the server:

```bash
npm run start:dev
```

2. Navigate to `http://localhost:3000/auth/google`

3. Complete Google OAuth flow

4. Save the returned `accessToken`

5. Use token in subsequent requests:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/auth/me
```

### Update User Role

To grant CREATOR role to a user:

```sql
UPDATE "User"
SET role = 'CREATOR'
WHERE email = 'user@example.com';
```

## Architecture

```
┌─────────────────┐
│  Controller     │  ← HTTP requests
└────────┬────────┘
         │
         │ uses
         ↓
┌─────────────────┐
│   AuthGuard     │  ← Validates JWT
│  (Passport)     │
└────────┬────────┘
         │
         │ delegates to
         ↓
┌─────────────────┐
│   Strategy      │  ← Google/JWT
└────────┬────────┘
         │
         │ calls
         ↓
┌─────────────────┐
│   AuthService   │  ← Business logic
└────────┬────────┘
         │
         │ uses
         ↓
┌─────────────────┐
│ PrismaService   │  ← Database
└─────────────────┘
```

## Files Structure

```
src/
├── modules/
│   ├── auth/
│   │   ├── strategies/
│   │   │   ├── google.strategy.ts    # Google OAuth handler
│   │   │   └── jwt.strategy.ts        # JWT validation
│   │   ├── dto/
│   │   │   └── login-response.dto.ts  # Response types
│   │   ├── auth.controller.ts         # Auth endpoints
│   │   ├── auth.service.ts            # Auth business logic
│   │   └── auth.module.ts             # Module configuration
│   └── users/
│       ├── dto/
│       │   ├── update-user-profile.dto.ts
│       │   └── user-response.dto.ts
│       ├── users.controller.ts        # User endpoints
│       ├── users.service.ts           # User business logic
│       └── users.module.ts            # Module configuration
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # @CurrentUser()
│   │   └── roles.decorator.ts         # @Roles()
│   └── guards/
│       ├── jwt-auth.guard.ts          # JWT authentication
│       ├── google-auth.guard.ts       # Google OAuth
│       └── roles.guard.ts             # Role authorization
└── config/
    └── config.schema.ts               # Environment validation
```

## Next Steps

- [ ] Add refresh tokens for longer sessions
- [ ] Implement email/password authentication (optional)
- [ ] Add rate limiting for auth endpoints
- [ ] Implement account deletion
- [ ] Add OAuth for other providers (GitHub, etc.)
- [ ] Add audit logging for authentication events
