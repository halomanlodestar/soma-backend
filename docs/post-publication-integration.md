# Post publication integration

## Creator flow

1. Call `createUploadIntent` for each file with `purpose: POST_MEDIA`.
2. Upload each file to its `presignedUploadUrl` with `PUT`.
3. Call `createPost` once with the returned `assetId` values.
4. Redirect the creator to Studio. Do not call `submitPost`; it is not part of this flow.

`createPost` persists the post as a temporary `DRAFT` and emits media processing. Once every staging object is verified, the worker marks the media `READY`, auto-approves the post, and queues publication. The publication worker promotes the media to public storage and changes the post to `PUBLISHED` only after every promotion succeeds.

## Public reads

`getPostById`, feeds, and public media endpoints expose only `PUBLISHED` posts. A newly created post can therefore return `NotFoundError` until background publication completes. Creator-facing status views must use `myStudioPosts` or `myStudioPost` instead.

After publication, the worker invalidates `query:post:{postId}` so a cached pre-publication `NotFoundError` cannot outlive the transition.

## States

```text
local browser draft
  -> createPost: DRAFT + PENDING media
  -> media worker: APPROVED + READY media
  -> publication worker: PUBLISHED
```

`APPROVED` is currently an internal auto-approval/promotion state. When moderator review is introduced, replace the worker's automatic `DRAFT -> APPROVED` transition with a moderator decision; publication remains unchanged.
