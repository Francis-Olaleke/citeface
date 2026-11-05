# Citeface Publishing Specification

**Document status:** Product specification
**Version:** 2.1 (reconciled)
**Last updated:** 5 November 2026
**Product:** Citeface
**Tagline:** Research. Connect. Discover.

> Items marked **[PENDING DECISION]** need product-owner approval. See `docs/reconciliation/reconciliation-report.md`.

---

## 1. Purpose

This document defines how users create, save, edit, publish, discover, and manage research content on Citeface.

Citeface is a research social discovery and knowledge-sharing platform. Its publishing experience should help researchers communicate research ideas, findings, methods, processes, and publications in accessible formats while preserving authorship, context, provenance, privacy, and research integrity.

Publishing must support the broader Citeface experience:

**Discover → Understand → Engage → Connect → Return**

A Citeface post is not automatically a formal scientific publication, peer-reviewed work, or independently validated research result.

## 2. Product principles

1. **Research communication:** Support accessible sharing of research, not merely document storage.
2. **Multiple formats:** Support text, video, images, paper announcements, and methods.
3. **Author control:** Authors control their own drafts and can manage their published content within platform rules.
4. **Privacy by default for drafts:** Unpublished content and its associated media remain private.
5. **Transparent provenance:** Preserve contributor information and distinguish user-provided information from verified information.
6. **Research integrity:** Do not imply that engagement, a DOI, or a Citeface post proves scientific validity or peer review.
7. **Accessible discovery:** Published content is discoverable according to its audience and applicable access rules.
8. **Secure media handling:** Validate uploads and prevent unauthorized access to private media.
9. **Accountability:** Preserve appropriate history for corrections, archival, retractions, audience changes, and moderation actions.

## 3. Supported publishing formats

The first publishing release supports five content types (`content_type`).

| Content type | Purpose |
|---|---|
| STORY | Research explanations, findings, ideas, observations, and commentary |
| VIDEO | Short research videos, demonstrations, explanations, and presentations |
| PHOTO | Research images, graphical abstracts, diagrams, and image-slide content |
| PAPER | Announcements or discussions about research papers and publications |
| METHODS | Research methods, protocols, workflows, and experimental processes |

Each type has an appropriate creation experience while sharing common publishing infrastructure.

**Taxonomy note:** `content_type` is the product classification above. `media_type` (image/video) describes an uploaded asset. A separate `presentation_format` field is added only if a distinct presentation choice is needed. These must not be conflated or duplicated as competing enums. The earlier MVP-specification formats map as: text → STORY, video → VIDEO, image_slides → PHOTO.

### 3.1 STORY

The form supports: title or headline; main text; research topics or disciplines; optional source or reference; optional DOI or external URL; contributor information; audience selection.

### 3.2 VIDEO

Short research videos: explanations, short findings, laboratory demonstrations, research processes, video summaries and short presentations.

The video duration requirement is **90–300 seconds inclusive**. The server or trusted media-processing provider must validate actual media duration; client-side validation alone is insufficient.

### 3.3 PHOTO

Research images, graphical abstracts, diagrams, and image-slide content. One or more images, subject to configured file-count, file-size, and format limits. Images are validated before publication and are ordered when more than one is supplied.

### 3.4 PAPER

The form supports: paper title; description or summary; optional DOI; optional external URL; contributor information; research topics; audience selection.

A DOI or external link must not be treated as proof that a paper is peer-reviewed, authentic, or scientifically correct.

### 3.5 METHODS

The form supports: title; method description; research context; topics or disciplines; optional source or reference; optional DOI or URL; contributor information; audience selection.

## 4. Content fields and provenance

| Field | Requirement |
|---|---|
| Title or headline | Required where applicable to the content type |
| Body, description, or caption | Required according to content type |
| Content type | Required |
| Topics or disciplines | Supported |
| Author | Required; derived from the authenticated session |
| Contributors | At least one required to publish; names, order, and roles where supplied |
| Affiliation | Optional |
| DOI | Optional |
| External source URL | Optional |
| Research status | Optional where relevant |
| Audience | Required before publication; defaults to PUBLIC |
| Media references | Required for media-dependent content |
| Authorship attestation | Required to publish; server-generated metadata |
| Rights and permissions confirmation | Required to publish; server-generated metadata |
| Created / updated timestamps | System-generated |
| Published timestamp | Set when publication succeeds |

The system distinguishes information supplied by the user, information imported from an external source, and information verified by Citeface. Imported DOI or publication metadata must be confirmed by the author before it is presented as confirmed.

### 4.1 Authorship attestation and contributor versions

- The publishing user attests that they are authorized to submit the story and to list the named contributors. This is not individual co-author approval, which is outside the initial MVP.
- Contributor lists are versioned. The attestation references the exact contributor-list version it covers; the server sets the publisher, timestamp and policy version.
- Changing the contributor list of a published story creates a new version, requires renewed attestation, and is recorded in audit history. Earlier versions and attestations are preserved.
- Rights and permissions confirmation is recorded separately from the authorship attestation, although both may appear in one publishing step.

## 5. Audience and visibility

Authors select the intended audience for each story before publication.

- **Public:** accessible to everyone, including signed-out visitors. This is the default for all new stories.
- **Citeface Members:** accessible only to authenticated Citeface users.
- **Followers:** accessible only to authenticated users who actively follow the author.

Stored values are `PUBLIC`, `MEMBERS`, `FOLLOWERS`. Authors always retain access to their own published stories.

### 5.1 Default audience

- Public is selected by default when an author creates a new story.
- Authors may change the audience before publishing.
- The selected audience is clearly displayed in the publishing interface and can be reviewed before confirming publication.

### 5.2 Audience enforcement

Audience restrictions are enforced on the server, not only in the frontend, through a central reusable authorization policy. The selected audience is respected across:

- Research feeds and discovery recommendations.
- Author profiles and published-story listings.
- Search results, autocomplete, snippets, counts and facets.
- Story detail pages and direct links.
- Sharing, link previews and external access.
- Notifications and activity feeds (access re-checked at read time).
- Comments, reactions and saves on the story.
- Sources, contributor details and other story metadata.
- API responses.
- Media files and media delivery URLs.
- Caches.

Public stories remain accessible to signed-out visitors. Members stories require authentication. Followers stories require authentication and an active follow relationship with the author.

Unauthorized users must not retrieve restricted content or media by guessing URLs, calling APIs directly, or reading cached responses, and must not receive restricted titles or metadata in error responses.

### 5.3 Draft visibility

- All unpublished drafts remain private, regardless of the audience selected for eventual publication.
- Only the draft's author may view, edit, delete, or publish it. Administrative and moderation roles do not automatically grant access to unpublished drafts.
- Drafts do not appear in feeds, profiles, search results, recommendations, notifications or public sharing.
- Draft content and unpublished media are protected by server-side ownership checks.
- The selected audience becomes effective only when the story is successfully published.

### 5.4 Audience changes after publication

- Authors may change the audience of their published stories.
- Changes take effect on the next request across all access points.
- When a story becomes more restrictive, users who no longer qualify immediately lose access to its content and media; shared caches are invalidated or bypassed.
- When a story becomes less restrictive, access follows the new audience.
- Unfollowing an author immediately revokes access to that author's Followers stories.
- Every audience change is recorded in the audit history.

### 5.5 Privacy and access-control principles

- Audience selection controls who can access a story on Citeface; it does not guarantee confidentiality outside the platform.
- Users are informed that public stories can be accessed and shared by people outside Citeface.
- Restricted stories do not expose content through search indexing, previews, notifications, public metadata endpoints, or media URLs.
- The platform applies consistent authorization across web, API, and media-delivery layers.

## 6. Private saved drafts — MVP requirement

**Decision: Basic private saved drafts are included in the first Citeface MVP** (ADR-0001, D5, revised 2026-11-04).

### 6.1 Draft capabilities

An authenticated user can: create a draft; save an incomplete draft; list and reopen their drafts; edit and update a draft; delete their own draft; publish a draft after satisfying publication requirements. Drafts persist across sessions and devices.

### 6.2 Draft lifecycle

**Create → Save → Reopen → Edit → Save again → Publish or Delete**

A draft remains private until publication succeeds. Saving a draft does not publish it, make it discoverable, add it to a profile, trigger public notifications, or expose its content or media.

### 6.3 Draft validation

Drafts may be incomplete. Full publication validation occurs on publish and checks the requirements for the content type, audience, at least one contributor, authorship attestation, rights confirmation, confirmed sources, and media readiness. If validation fails the system explains what to correct, keeps the draft intact, creates no partially published post, and allows returning to editing. Repeated publish requests must not create duplicates.

### 6.4 Draft ownership and security

The server verifies ownership on every draft operation. A user cannot retrieve, update, delete, or publish another user's draft by changing an identifier. Unauthorized requests reveal no draft content or metadata.

### 6.5 Draft media

A draft may contain media still uploading or processing. Media-processing state is separate from the post lifecycle. If upload or processing fails the draft remains available, the user gets an actionable error and can retry or remove the media. Media is not published until required media is validated and ready.

### 6.6 Draft features excluded from MVP

Scheduled publishing; collaborative draft editing; external draft sharing or review; editorial approval workflows; complex version history; AI-assisted writing or research generation.

## 7. Publication and media states

Post lifecycle is kept separate from the technical state of media.

### 7.1 Post lifecycle states

| State | Meaning |
|---|---|
| `DRAFT` | Private, unpublished content owned by its author |
| `PUBLISHED` | Published and accessible according to audience and moderation state |
| `ARCHIVED` | Author-archived; excluded from normal discovery; history retained |
| `RETRACTED` | Visibly retracted; distinct from ordinary archival or removal |

`REMOVED` is retired as a lifecycle state. Platform moderation hiding or removal is a separate control (`moderation_state`: `NONE`, `HIDDEN`, `REMOVED`) so it is never confused with author archival or retraction. A retraction is never treated as an ordinary deletion. What authorized viewers see for a retracted story (retained content with notice versus tombstone) is **[PENDING DECISION]**; default recommendation is visible status, reason and metadata with content visibility governed by policy.

### 7.2 Media-processing states

| State | Meaning |
|---|---|
| PENDING_UPLOAD | Upload has been initiated |
| UPLOADING | Media is being transferred |
| PROCESSING | Media is being validated or processed |
| READY | Media has passed required checks and is ready for use |
| FAILED | Upload or processing has failed |

These are technical states, not publication states. A draft may remain `DRAFT` while its media is in any of them.

### 7.3 Publication readiness

Before publishing a post containing media the system confirms that required uploads are complete, processing has succeeded, file type and size are permitted, video duration is valid, the media is safe and accessible, and the author has confirmed rights and permissions. A media failure must not result in silent publication or an inaccessible published post.

## 8. Media validation and storage

### 8.1 General requirements

The system must validate file type and size on the server; reject unsupported or invalid files; use secure media storage; avoid exposing storage credentials or private infrastructure; restrict access to unpublished media; provide clear upload progress and failure feedback; and avoid making media public before the post is published and authorized for access.

Storage provider, file-size limits, image-count limits, supported formats, codecs and transcoding configuration remain technical decisions **[PENDING DECISION: technical limits]**.

### 8.2 Video requirements

- Minimum duration 90 seconds; maximum 300 seconds; both inclusive.
- Duration validated using trusted media metadata or processing.
- Failed validation prevents publication.
- Playback provides appropriate user controls.
- Processing failures are communicated clearly.

### 8.3 Image requirements

- Validate supported image formats.
- Validate file size and file integrity.
- Support responsive image presentation on supported desktop and mobile layouts while preserving image aspect ratio and providing accessible alternative text where applicable.

## 9. Cross-cutting authorization and delivery

- Every published post is delivered according to its current audience.
- Source metadata, contributor details, previews and media inherit the access rules of the parent post unless a separately documented public field is explicitly approved.
- Drafts and associated media remain accessible only to the author.
- Audience authorization is enforced server-side for direct requests, feeds, profiles, search, notifications, media delivery and cached responses.
- Audience changes and unfollowing revoke access immediately on subsequent requests.
- Storage keys and signed delivery URLs must not become permanent public authorization bypasses.
- Authorization failures must not disclose restricted content or sensitive metadata.

## 10. Relationship to other documents

This document must remain consistent with `citeface-product-strategy-requirements-roadmap.md`, `design-reference-and-product-architecture.md`, `publishing-user-stories.md`, `publishing-acceptance-criteria.md`, `ADR-0001-publishing-rules.md`, `publishing-data-model.md` and `citeface-mvp-specification.md`.
