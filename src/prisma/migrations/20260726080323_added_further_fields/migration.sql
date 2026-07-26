/*
  Warnings:

  - You are about to drop the column `target_id` on the `awards` table. All the data in the column will be lost.
  - You are about to drop the column `target_type` on the `awards` table. All the data in the column will be lost.
  - You are about to drop the column `target_id` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `target_type` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `target_id` on the `votes` table. All the data in the column will be lost.
  - You are about to drop the column `target_type` on the `votes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,post_id]` on the table `votes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,comment_id]` on the table `votes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "awards" DROP CONSTRAINT "awards_awarded_by_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_author_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_parent_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_post_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_author_id_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_soma_id_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_user_id_fkey";

-- DropIndex
DROP INDEX "votes_user_id_target_type_target_id_key";

-- AlterTable
ALTER TABLE "awards" DROP COLUMN "target_id",
DROP COLUMN "target_type",
ADD COLUMN     "comment_id" TEXT,
ADD COLUMN     "post_id" TEXT;

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "vote_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "target_id",
DROP COLUMN "target_type",
ADD COLUMN     "comment_id" TEXT,
ADD COLUMN     "post_id" TEXT;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "comment_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "hot_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "media_url" TEXT,
ADD COLUMN     "vote_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "somas" ADD COLUMN     "cover_url" TEXT,
ADD COLUMN     "member_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weekly_visitor_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "cover_url" TEXT,
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "votes" DROP COLUMN "target_id",
DROP COLUMN "target_type",
ADD COLUMN     "comment_id" TEXT,
ADD COLUMN     "post_id" TEXT;

-- DropEnum
DROP TYPE "AwardTargetType";

-- DropEnum
DROP TYPE "VoteTargetType";

-- CreateIndex
CREATE UNIQUE INDEX "votes_user_id_post_id_key" ON "votes"("user_id", "post_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_user_id_comment_id_key" ON "votes"("user_id", "comment_id");

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
