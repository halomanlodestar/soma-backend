/*
  Warnings:

  - You are about to drop the column `refresh_token_expires_at` on the `auth_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token_hash` on the `auth_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `used_at` on the `refresh_token_history` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "auth_sessions_refresh_token_hash_key";

-- DropIndex
DROP INDEX "refresh_token_history_session_id_idx";

-- AlterTable
ALTER TABLE "auth_sessions" DROP COLUMN "refresh_token_expires_at",
DROP COLUMN "refresh_token_hash";

-- AlterTable
ALTER TABLE "refresh_token_history" DROP COLUMN "used_at",
ADD COLUMN     "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "revoked_at" TIMESTAMP(3),
ADD COLUMN     "rotated_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "refresh_token_history_session_id_rotated_at_idx" ON "refresh_token_history"("session_id", "rotated_at");
