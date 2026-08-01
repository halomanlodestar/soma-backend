CREATE TYPE "SomaAccessAuditAction" AS ENUM (
  'APPLICATION_REVIEWED', 'MEMBERSHIP_GRANTED',
  'MEMBERSHIP_ROLE_CHANGED', 'MEMBERSHIP_STATUS_CHANGED'
);

CREATE TABLE "soma_access_audit_logs" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "soma_id" UUID NOT NULL,
  "actor_id" UUID NOT NULL,
  "target_user_id" UUID NOT NULL,
  "action" "SomaAccessAuditAction" NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "soma_access_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "soma_access_audit_logs_soma_id_created_at_idx"
  ON "soma_access_audit_logs"("soma_id", "created_at");
