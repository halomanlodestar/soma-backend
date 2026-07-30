/*
  Warnings:

  - The primary key for the `auth_sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `awards` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `comment_id` column on the `awards` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `post_id` column on the `awards` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `comments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `parent_comment_id` column on the `comments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `follows` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `media_collections` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `media_collections` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `media_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `media_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `media_variants` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `media_variants` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `notifications` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `notifications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `comment_id` column on the `notifications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `post_id` column on the `notifications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `posts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `refresh_token_history` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `somas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `votes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `comment_id` column on the `votes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `post_id` column on the `votes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `id` on the `auth_sessions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `auth_sessions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `awards` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `awarded_by_id` on the `awards` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `comments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `author_id` on the `comments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `post_id` on the `comments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `follows` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `follower_id` on the `follows` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `following_id` on the `follows` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `post_id` on the `media_collections` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `collection_id` on the `media_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `media_item_id` on the `media_variants` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `posts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `author_id` on the `posts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `soma_id` on the `posts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `refresh_token_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `session_id` on the `refresh_token_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `somas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `votes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `votes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "auth_sessions" DROP CONSTRAINT "auth_sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "awards" DROP CONSTRAINT "awards_awarded_by_id_fkey";

-- DropForeignKey
ALTER TABLE "awards" DROP CONSTRAINT "awards_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "awards" DROP CONSTRAINT "awards_post_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_author_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_parent_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_post_id_fkey";

-- DropForeignKey
ALTER TABLE "follows" DROP CONSTRAINT "follows_follower_id_fkey";

-- DropForeignKey
ALTER TABLE "follows" DROP CONSTRAINT "follows_following_id_fkey";

-- DropForeignKey
ALTER TABLE "media_collections" DROP CONSTRAINT "media_collections_post_id_fkey";

-- DropForeignKey
ALTER TABLE "media_items" DROP CONSTRAINT "media_items_collection_id_fkey";

-- DropForeignKey
ALTER TABLE "media_variants" DROP CONSTRAINT "media_variants_media_item_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_post_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_author_id_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_soma_id_fkey";

-- DropForeignKey
ALTER TABLE "refresh_token_history" DROP CONSTRAINT "refresh_token_history_session_id_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_post_id_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_user_id_fkey";

-- AlterTable
ALTER TABLE "auth_sessions" DROP CONSTRAINT "auth_sessions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "awards" DROP CONSTRAINT "awards_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "awarded_by_id",
ADD COLUMN     "awarded_by_id" UUID NOT NULL,
DROP COLUMN "comment_id",
ADD COLUMN     "comment_id" UUID,
DROP COLUMN "post_id",
ADD COLUMN     "post_id" UUID,
ADD CONSTRAINT "awards_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "comments" DROP CONSTRAINT "comments_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "author_id",
ADD COLUMN     "author_id" UUID NOT NULL,
DROP COLUMN "post_id",
ADD COLUMN     "post_id" UUID NOT NULL,
DROP COLUMN "parent_comment_id",
ADD COLUMN     "parent_comment_id" UUID,
ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "follows" DROP CONSTRAINT "follows_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "follower_id",
ADD COLUMN     "follower_id" UUID NOT NULL,
DROP COLUMN "following_id",
ADD COLUMN     "following_id" UUID NOT NULL,
ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "media_collections" DROP CONSTRAINT "media_collections_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT uuidv7(),
DROP COLUMN "post_id",
ADD COLUMN     "post_id" UUID NOT NULL,
ADD CONSTRAINT "media_collections_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "media_items" DROP CONSTRAINT "media_items_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT uuidv7(),
DROP COLUMN "collection_id",
ADD COLUMN     "collection_id" UUID NOT NULL,
ADD CONSTRAINT "media_items_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "media_variants" DROP CONSTRAINT "media_variants_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT uuidv7(),
DROP COLUMN "media_item_id",
ADD COLUMN     "media_item_id" UUID NOT NULL,
ADD CONSTRAINT "media_variants_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT uuidv7(),
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
DROP COLUMN "comment_id",
ADD COLUMN     "comment_id" UUID,
DROP COLUMN "post_id",
ADD COLUMN     "post_id" UUID,
ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "posts" DROP CONSTRAINT "posts_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "author_id",
ADD COLUMN     "author_id" UUID NOT NULL,
DROP COLUMN "soma_id",
ADD COLUMN     "soma_id" UUID NOT NULL,
ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "refresh_token_history" DROP CONSTRAINT "refresh_token_history_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "session_id",
ADD COLUMN     "session_id" UUID NOT NULL,
ADD CONSTRAINT "refresh_token_history_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "somas" DROP CONSTRAINT "somas_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "somas_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "votes" DROP CONSTRAINT "votes_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
DROP COLUMN "comment_id",
ADD COLUMN     "comment_id" UUID,
DROP COLUMN "post_id",
ADD COLUMN     "post_id" UUID,
ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_revoked_at_idx" ON "auth_sessions"("user_id", "revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_following_id_key" ON "follows"("follower_id", "following_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_collections_post_id_key" ON "media_collections"("post_id");

-- CreateIndex
CREATE INDEX "refresh_token_history_session_id_idx" ON "refresh_token_history"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_user_id_post_id_key" ON "votes"("user_id", "post_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_user_id_comment_id_key" ON "votes"("user_id", "comment_id");

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token_history" ADD CONSTRAINT "refresh_token_history_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_soma_id_fkey" FOREIGN KEY ("soma_id") REFERENCES "somas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_collections" ADD CONSTRAINT "media_collections_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "media_collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_variants" ADD CONSTRAINT "media_variants_media_item_id_fkey" FOREIGN KEY ("media_item_id") REFERENCES "media_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awards" ADD CONSTRAINT "awards_awarded_by_id_fkey" FOREIGN KEY ("awarded_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awards" ADD CONSTRAINT "awards_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awards" ADD CONSTRAINT "awards_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
