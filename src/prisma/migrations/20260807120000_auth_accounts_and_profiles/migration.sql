CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE');

ALTER TABLE "users" RENAME COLUMN "role" TO "platform_role";
ALTER TABLE "users" RENAME COLUMN "is_verified" TO "email_verified";

CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "cover_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

INSERT INTO "user_profiles" (
    "user_id", "username", "display_name", "bio", "avatar_url", "cover_url", "created_at", "updated_at"
)
SELECT
    "id", "username", "display_name", "bio", "avatar_url", "cover_url", "created_at", "updated_at"
FROM "users";

ALTER TABLE "users"
    DROP COLUMN "username",
    DROP COLUMN "display_name",
    DROP COLUMN "bio",
    DROP COLUMN "avatar_url",
    DROP COLUMN "cover_url";

CREATE TABLE "auth_accounts" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "provider_email" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");
CREATE UNIQUE INDEX "user_profiles_username_key" ON "user_profiles"("username");
CREATE UNIQUE INDEX "auth_accounts_provider_provider_account_id_key" ON "auth_accounts"("provider", "provider_account_id");
CREATE INDEX "auth_accounts_user_id_idx" ON "auth_accounts"("user_id");

ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
