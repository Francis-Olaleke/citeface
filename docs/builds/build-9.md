# Build 9: Image/video upload and playback

**Milestone:** M2  
**Depends on:** Build 8  
**User stories:** PUB-003, PUB-004, PUB-017, PUB-018

## Outcome

Make image and short-video publishing dependable from file selection through
processing, preview, publication, and playback.

## Scope

- Audit the Cloudinary signed upload flow, limits, chunking, webhook, and
  cleanup; do not expose provider secrets or storage keys.
- Support approved image formats and MP4 videos of 90-300 seconds inclusive.
- Show upload progress, processing, ready, retry, and failure states.
- Let authors remove or retry failed attachments without losing draft content.
- Generate access-checked signed delivery links; media follows its parent
  story's visibility.
- Require a publicly reachable HTTPS eager-processing callback for video.

## Acceptance gate

- Real provider configuration uploads image/video and verifies server-side
  metadata; media cannot publish before ready.
- Draft media is author-only; published delivery is audience-authorized.
- Mobile playback, keyboard controls, captions/alt text, and failure UX work.
- Upload, webhook, authorization, and cleanup tests pass.

**References:** [publishing specification](../product/publishing-specification.md),
[media service](../../apps/api/src/modules/media/media.service.ts).

## Copilot execution prompt

```text
Execute Build 9 in Milestone M2 - Publishing. Confirm Build 8's private-draft gate. Inspect the complete browser/API/Cloudinary flow and existing media tests; preserve private authenticated assets. Implement image/video selection, progress, processing, retry/removal, accessible preview/playback, and safe signed delivery. Enforce the approved size/type and 90-300 second video limits from trusted server metadata. Verify required provider/webhook configuration without reading or printing secrets. Add failure, privacy, and ready-state tests; report real-provider blockers and M2 evidence.
```
