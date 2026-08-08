DROP TABLE IF EXISTS "notifications";

CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "recipient_id" UUID NOT NULL,
    "actor_id" UUID,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB NOT NULL,
    "source_event_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notifications_source_event_id_key" ON "notifications"("source_event_id");
CREATE INDEX "notifications_recipient_id_created_at_idx" ON "notifications"("recipient_id", "created_at" DESC);

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey"
  FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
