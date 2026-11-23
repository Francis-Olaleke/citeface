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
- Support approved image formats and MP4-preferred, MOV, and WebM videos of at least 90 seconds and up to 500 MB; keep MKV and AVI unsupported pending evaluation.
- Convert compatible video sources to MP4 playback renditions through Cloudinary.
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

## Increment gates

| Increment | Scope | Gate |
|---|---|---|
| 9.1 - Upload infrastructure | Cloudinary connection, image upload, attachment registration | Product owner reports image upload, attachment registration, and `READY` status verified |
| 9.2 - Media preview and management | Actual image and video previews in the composer, understandable processing states, attachment removal | Owners can preview ready media, see pending/processing/ready/failed state, and remove an attachment safely |
| 9.3 - Video upload and processing | MP4/MOV/WebM upload, Cloudinary conversion, server-side duration/metadata validation, processing callbacks, thumbnail/rendition readiness | Valid videos of at least 90 seconds and up to 500 MB reach `READY`; unsupported formats or shorter videos cannot publish |
| 9.4 - Playback | Responsive video player, controls, accessible labels/captions | Ready video plays on supported desktop/mobile browsers without autoplay |
| 9.5 - Reliability and security | Retry/recovery, authorization, upload limits, privacy, publication gate | Owner-only draft media, validated upload limits, and ready-media publication checks pass |
| 9.6 - Build acceptance | Focused automated tests and real browser verification | Automated gates pass and image/video journeys are verified in a browser with provider configuration |

## Copilot execution prompt

```text
Execute Build 9 in Milestone M2 - Publishing, following increments 9.1 through 9.6 in order. Treat 9.1 as verified only to the extent reported by the product owner. For 9.2, support actual previews for both images and videos, clear upload/processing/ready/failed states, and owner-authorized attachment removal. Then complete video processing (9.3), responsive accessible playback (9.4), reliability/security (9.5), and automated plus real-browser acceptance (9.6). Confirm Build 8's private-draft gate; inspect the full browser/API/Cloudinary flow and tests, preserve authenticated private media, and enforce trusted server-side type, size, duration, and publication checks. Do not print secrets. Report each increment's exact evidence and blockers separately.
```
