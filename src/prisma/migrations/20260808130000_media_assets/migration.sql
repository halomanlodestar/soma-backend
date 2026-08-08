CREATE TYPE "MediaUploadPurpose" AS ENUM ('POST_MEDIA', 'PROFILE_AVATAR', 'PROFILE_BANNER');
CREATE TYPE "MediaAssetStatus" AS ENUM ('UPLOAD_PENDING', 'UPLOADED', 'PROCESSING', 'READY', 'FAILED', 'REJECTED', 'DELETED');

CREATE TABLE "media_assets" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "owner_id" UUID NOT NULL,
    "purpose" "MediaUploadPurpose" NOT NULL,
    "type" "MediaType" NOT NULL,
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'UPLOAD_PENDING',
    "staging_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "declared_mime_type" TEXT NOT NULL,
    "declared_byte_size" BIGINT NOT NULL,
    "mime_type" TEXT,
    "byte_size" BIGINT,
    "checksum" TEXT,
    "metadata" JSONB,
    "uploaded_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "failure_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "media_asset_variants" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "asset_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "byte_size" BIGINT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_asset_variants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "post_media_attachments" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "post_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "alt_text" TEXT,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "post_media_attachments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "user_profiles" ADD COLUMN "avatar_asset_id" UUID;
ALTER TABLE "user_profiles" ADD COLUMN "banner_asset_id" UUID;

CREATE UNIQUE INDEX "media_assets_staging_key_key" ON "media_assets"("staging_key");
CREATE INDEX "media_assets_owner_id_status_created_at_idx" ON "media_assets"("owner_id", "status", "created_at");
CREATE INDEX "media_assets_status_expires_at_idx" ON "media_assets"("status", "expires_at");
CREATE UNIQUE INDEX "media_asset_variants_storage_key_key" ON "media_asset_variants"("storage_key");
CREATE UNIQUE INDEX "media_asset_variants_asset_id_name_key" ON "media_asset_variants"("asset_id", "name");
CREATE UNIQUE INDEX "post_media_attachments_post_id_asset_id_key" ON "post_media_attachments"("post_id", "asset_id");
CREATE UNIQUE INDEX "post_media_attachments_post_id_position_key" ON "post_media_attachments"("post_id", "position");
CREATE INDEX "post_media_attachments_asset_id_idx" ON "post_media_attachments"("asset_id");
CREATE UNIQUE INDEX "user_profiles_avatar_asset_id_key" ON "user_profiles"("avatar_asset_id");
CREATE UNIQUE INDEX "user_profiles_banner_asset_id_key" ON "user_profiles"("banner_asset_id");

ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media_asset_variants" ADD CONSTRAINT "media_asset_variants_asset_id_fkey"
  FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_media_attachments" ADD CONSTRAINT "post_media_attachments_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_media_attachments" ADD CONSTRAINT "post_media_attachments_asset_id_fkey"
  FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_avatar_asset_id_fkey"
  FOREIGN KEY ("avatar_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_banner_asset_id_fkey"
  FOREIGN KEY ("banner_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
