# ADR-0002: Post Lifecycle, Content Taxonomy, Moderation State and Contributor Attestation

- **Status:** ACCEPTED (approved by the product owner, 2026-11-05)
- **Date:** 2026-11-05
- **Area:** Citeface publishing MVP
- **Relationship:** Extends ADR-0001. Does not change any accepted ADR-0001 decision.

## 1. Context

The documentation set used conflicting vocabularies: the MVP specification used `draft/published/archived/retracted` and `text/video/image_slides`, while the publishing specification used `DRAFT/PUBLISHED/REMOVED` and five content types (`STORY, VIDEO, PHOTO, PAPER, METHODS`). The authorship attestation was specified as a single timestamp, which cannot prove which contributor list was attested once the list is edited.

## 2. Decisions

**D1. Lifecycle.** `status` is one of `DRAFT`, `PUBLISHED`, `ARCHIVED`, `RETRACTED`. `REMOVED` is not a lifecycle state.

**D2. Moderation state.** Platform hiding/removal is a separate field, `moderation_state` (`NONE`, `HIDDEN`, `REMOVED`), so moderation can never be confused with author archival or retraction. Moderation never grants access to drafts.

**D3. Taxonomy.** `content_type` = `STORY | VIDEO | PHOTO | PAPER | METHODS`; `media_type` = `image | video` (uploaded assets); `presentation_format` only if a distinct presentation choice is later needed. Mapping from earlier terms: text → STORY, video → VIDEO, image_slides → PHOTO.

**D4. Contributor versioning and attestation.** Contributor lists are immutable versions. An append-only authorship attestation (publisher, server timestamp, policy version) references the exact version covered. At least one contributor is required to publish. Changing a published contributor list creates a new version and requires renewed attestation and an audit record. Rights/permissions confirmation is recorded separately.

**D5. Access policy.** One central policy function evaluates draft → author → moderation → archive → audience (see MVP specification 3.2) and is used by every read path.

## 3. Still open (not decided here)

1. What viewers see for a retracted post (content with notice vs tombstone).
2. Who besides the author may retract, and under what policy.
3. Treatment of posts whose author account is suspended or deleted.
4. Retention/deletion of archived and retracted posts and media.
5. Image count, file size, MIME and video encoding limits.
6. Draft autosave and multi-session conflict strategy.
7. Exact schema representation of contributor versioning.
8. Unauthorized-response convention (404 vs 401 vs 403).
9. Moderator access to restricted published stories under report.
10. Saved-list behaviour when access is revoked (placeholder vs omit).

## 4. Consequences

As accepted, the MVP specification, publishing specification, data model, user stories, acceptance criteria and audit worksheet use this vocabulary, and a migration maps any existing `REMOVED` rows to `ARCHIVED` (author-removed) or `moderation_state` (moderator-removed).

## 5. Decision history

| Date | Decision | Status |
|---|---|---|
| 2026-11-05 | Lifecycle, taxonomy, moderation state, contributor attestation approved | Accepted |
