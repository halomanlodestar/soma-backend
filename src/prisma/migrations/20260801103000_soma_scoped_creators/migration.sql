-- Move from global publishing states to an explicit review lifecycle.
CREATE TYPE "PostVisibility_new" AS ENUM (
  'DRAFT', 'SUBMITTED', 'NEEDS_CHANGES', 'APPROVED',
  'PUBLISHED', 'REJECTED', 'REMOVED', 'ARCHIVED'
);

ALTER TABLE "posts" ALTER COLUMN "visibility" DROP DEFAULT;
ALTER TABLE "posts"
  ALTER COLUMN "visibility" TYPE "PostVisibility_new"
  USING (
    CASE "visibility"::text
      WHEN 'PUBLIC' THEN 'PUBLISHED'
      WHEN 'SUBSCRIBER_ONLY' THEN 'PUBLISHED'
      WHEN 'WAITING' THEN 'SUBMITTED'
      WHEN 'DELETING' THEN 'ARCHIVED'
    END
  )::"PostVisibility_new";
ALTER TYPE "PostVisibility" RENAME TO "PostVisibility_old";
ALTER TYPE "PostVisibility_new" RENAME TO "PostVisibility";
DROP TYPE "PostVisibility_old";
ALTER TABLE "posts" ALTER COLUMN "visibility" SET DEFAULT 'DRAFT';

CREATE TYPE "SomaMembershipRole" AS ENUM ('CREATOR', 'MODERATOR', 'OWNER');
CREATE TYPE "SomaMembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LEFT');
CREATE TYPE "MediaProcessingStatus" AS ENUM ('NONE', 'PENDING', 'READY', 'FAILED');
CREATE TYPE "SomaCreatorApplicationStatus" AS ENUM (
  'SUBMITTED', 'IN_REVIEW', 'NEEDS_INFO', 'APPROVED', 'DECLINED', 'WITHDRAWN'
);

CREATE TABLE "soma_memberships" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "user_id" UUID NOT NULL,
  "soma_id" UUID NOT NULL,
  "role" "SomaMembershipRole" NOT NULL,
  "status" "SomaMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "approved_by_id" UUID,
  "approved_at" TIMESTAMP(3),
  "suspended_at" TIMESTAMP(3),
  "left_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "soma_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "soma_creator_applications" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "applicant_id" UUID NOT NULL,
  "soma_id" UUID NOT NULL,
  "portfolio_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "disciplines" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "statement" TEXT NOT NULL,
  "process_samples" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "moderation_consent" BOOLEAN NOT NULL,
  "status" "SomaCreatorApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
  "reviewer_id" UUID,
  "reviewer_note" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "soma_creator_applications_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "posts" ADD COLUMN "creator_membership_id" UUID;
ALTER TABLE "posts" ADD COLUMN "media_status" "MediaProcessingStatus" NOT NULL DEFAULT 'NONE';

CREATE UNIQUE INDEX "soma_memberships_user_id_soma_id_key"
  ON "soma_memberships"("user_id", "soma_id");
CREATE INDEX "soma_memberships_soma_id_role_status_idx"
  ON "soma_memberships"("soma_id", "role", "status");
CREATE UNIQUE INDEX "soma_creator_applications_applicant_id_soma_id_key"
  ON "soma_creator_applications"("applicant_id", "soma_id");
CREATE INDEX "soma_creator_applications_soma_id_status_created_at_idx"
  ON "soma_creator_applications"("soma_id", "status", "created_at");

ALTER TABLE "posts" ADD CONSTRAINT "posts_creator_membership_id_fkey"
  FOREIGN KEY ("creator_membership_id") REFERENCES "soma_memberships"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "soma_memberships" ADD CONSTRAINT "soma_memberships_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "soma_memberships" ADD CONSTRAINT "soma_memberships_soma_id_fkey"
  FOREIGN KEY ("soma_id") REFERENCES "somas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "soma_memberships" ADD CONSTRAINT "soma_memberships_approved_by_id_fkey"
  FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "soma_creator_applications" ADD CONSTRAINT "soma_creator_applications_applicant_id_fkey"
  FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "soma_creator_applications" ADD CONSTRAINT "soma_creator_applications_soma_id_fkey"
  FOREIGN KEY ("soma_id") REFERENCES "somas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "soma_creator_applications" ADD CONSTRAINT "soma_creator_applications_reviewer_id_fkey"
  FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
