-- CreateTable
CREATE TABLE "auth_handoffs" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_handoffs_code_hash_key" ON "auth_handoffs"("code_hash");

-- CreateIndex
CREATE INDEX "auth_handoffs_expires_at_idx" ON "auth_handoffs"("expires_at");

-- AddForeignKey
ALTER TABLE "auth_handoffs" ADD CONSTRAINT "auth_handoffs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
