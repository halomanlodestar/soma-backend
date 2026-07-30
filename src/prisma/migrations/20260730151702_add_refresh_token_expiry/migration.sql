/*
  Warnings:

  - Added the required column `refresh_token_expires_at` to the `auth_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "auth_sessions" ADD COLUMN     "refresh_token_expires_at" TIMESTAMP(3) NOT NULL;
