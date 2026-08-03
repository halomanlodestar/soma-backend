-- Public-work full-text search. The expression is intentionally identical to
-- SearchService's document expression so PostgreSQL can use this GIN index.
CREATE INDEX "posts_published_search_document_idx"
ON "posts" USING GIN (
  (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("excerpt", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("body", '')), 'C')
  )
)
WHERE "visibility" = 'PUBLISHED';

-- Prefix autocomplete indexes. They do not support arbitrary substring search
-- by design: autocomplete is restricted to the start of a value.
CREATE INDEX "posts_published_title_prefix_idx"
ON "posts" (lower("title") text_pattern_ops)
WHERE "visibility" = 'PUBLISHED';

CREATE INDEX "users_username_prefix_idx"
ON "users" (lower("username") text_pattern_ops);

CREATE INDEX "users_display_name_prefix_idx"
ON "users" (lower("display_name") text_pattern_ops);

CREATE INDEX "somas_name_prefix_idx"
ON "somas" (lower("name") text_pattern_ops);

CREATE INDEX "somas_slug_prefix_idx"
ON "somas" (lower("slug") text_pattern_ops);
