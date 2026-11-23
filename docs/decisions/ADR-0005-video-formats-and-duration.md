# ADR-0005: Video Formats and Duration

- **Status:** Accepted
- **Date:** 2026-11-23
- **Area:** Video uploads and processing
- **Relationship:** Clarifies supported video inputs under ADR-0003 D4 and supersedes its 300-second duration maximum.

## Context

Researchers need common source formats while keeping predictable playback and processing requirements. MP4 remains preferred; MOV and WebM are accepted as additional formats. MKV and AVI require compatibility evaluation before support.

## Decision

- Accept MP4, MOV (`video/quicktime`), and WebM (`video/webm`); MP4 is preferred.
- Keep MKV and AVI unsupported until their Cloudinary ingestion and conversion behavior is evaluated.
- Let Cloudinary convert compatible uploads into MP4 playback renditions.
- Video duration must be at least 90 seconds; there is no duration maximum.
- The upload-size limit remains 500 MB; technical provider constraints still apply.
- Duration is determined from trusted server-side or media-provider metadata, not client-reported values.

## Consequences

- Videos shorter than 90 seconds fail validation; videos of 90 seconds or longer may proceed subject to the 500 MB size cap.
- Upload and processing tests cover all accepted formats and confirm MP4 playback renditions.
- Product specifications, acceptance criteria, tests, and build gates use the 90-second minimum and 500 MB maximum file size.
