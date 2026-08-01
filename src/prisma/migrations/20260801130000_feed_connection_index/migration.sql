-- Supports the published feed's keyset pagination order.
CREATE INDEX "posts_visibility_hot_score_id_idx"
ON "posts"("visibility", "hot_score", "id");
