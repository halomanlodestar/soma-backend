CREATE TABLE "saved_posts" (
  "id" UUID NOT NULL DEFAULT uuidv7(), "user_id" UUID NOT NULL, "post_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_posts_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "collections" (
  "id" UUID NOT NULL DEFAULT uuidv7(), "user_id" UUID NOT NULL, "title" TEXT NOT NULL,
  "description" TEXT, "is_public" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "collection_items" (
  "id" UUID NOT NULL DEFAULT uuidv7(), "collection_id" UUID NOT NULL, "post_id" UUID NOT NULL,
  "position" INTEGER NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "saved_posts_user_id_post_id_key" ON "saved_posts"("user_id", "post_id");
CREATE INDEX "saved_posts_user_id_created_at_idx" ON "saved_posts"("user_id", "created_at");
CREATE INDEX "collections_user_id_updated_at_idx" ON "collections"("user_id", "updated_at");
CREATE UNIQUE INDEX "collection_items_collection_id_post_id_key" ON "collection_items"("collection_id", "post_id");
CREATE INDEX "collection_items_collection_id_position_idx" ON "collection_items"("collection_id", "position");
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
