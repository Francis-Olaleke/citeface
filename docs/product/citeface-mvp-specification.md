# Citeface MVP — Detailed Product and Engineering Specification

**Version:** 1.1 (reconciled)
**Date:** 5 November 2026
**Status:** Proposed implementation specification; reconcile with codebase audit before implementation.
**Supersedes:** v1.0 (4 November 2026)

> Decisions are recorded in ADR-0002 and ADR-0003 (both accepted 2026-11-05). Values marked configurable may be tuned without code changes. See `docs/reconciliation/reconciliation-report.md`.

## 1. Purpose and scope

This document translates the Citeface strategy into implementable MVP requirements. It defines feature behaviour, proposed data entities, API contracts, acceptance criteria and test cases.

It is not a mandate to rebuild existing functionality. First inspect the repository and map each requirement to existing code, tests and database structures. Reuse working implementations and document gaps.

### MVP product outcome

A user can register, create a profile, discover research stories, watch a short video or browse image stories, inspect sources and contributors, follow researchers/topics, appreciate/save a story, ask a question, and publish their own story with appropriate provenance, audience and privacy controls.

### Out of scope
Direct messages, group chat, jobs/grants marketplace, institutional analytics, subscriptions, AI recommendations/assistant, semantic search, native mobile apps, complex reputation systems, microservices, scheduled publishing, collaborative draft editing, external draft sharing/review, editorial approval workflows and complex draft version history.

## 2. Roles and permissions

| Role | Permissions |
|---|---|
| Visitor | Browse PUBLIC published stories and public profiles; registration required for protected interactions |
| Member | Manage own profile; follow, appreciate, save, comment/question, report; create and manage own drafts and stories; access MEMBERS stories, and FOLLOWERS stories of authors they actively follow |
| Publisher/author | Member permissions applied to their own stories: manage own drafts, contributors, sources, audience, archive, corrections and retraction. Confers no rights over anyone else's drafts or stories |
| Moderator | Review reports and take documented moderation actions on published/reportable content within assigned scope |
| Administrator | Manage platform configuration and privileged account/moderation operations |

Role checks must be enforced by the API, not only by hiding frontend controls.

Draft ownership is an explicit resource-level authorization rule, not an administrative role privilege. Moderators and administrators do not automatically gain access to another user's unpublished drafts or draft media. Any exceptional access required by law, incident response or infrastructure operations must be handled outside ordinary application access, be narrowly controlled, and be separately specified and audited before implementation. It is not part of the MVP application permission model.

Verification is a profile status/claim workflow, not a role that grants scientific authority. Do not make publication access dependent on academic verification in the MVP.

## 3. Global product rules

1. Every published story has an audience: `PUBLIC`, `MEMBERS` or `FOLLOWERS`.
2. `PUBLIC` is the default audience for new stories.
3. `PUBLIC` stories are accessible to everyone, including signed-out visitors.
4. `MEMBERS` stories are accessible only to authenticated Citeface users.
5. `FOLLOWERS` stories are accessible only to authenticated users who actively follow the story author.
6. Authors retain access to their own published stories regardless of audience.
7. Authors may change the audience of their published stories; changes must be authorized, immediately enforced and recorded in audit history.
8. Unfollowing an author immediately revokes access to that author's `FOLLOWERS` stories.
9. Drafts are private and accessible only to their authors. Administrative roles do not automatically grant access to unpublished drafts.
10. Draft ownership and every draft operation are enforced server-side.
11. Drafts persist across authenticated sessions and devices; associated unpublished media remains private. A draft's intended audience does not change its private status.
12. At least one contributor is required before publication. The publisher attests that they are authorized to submit the story and list the named contributors; this does not imply individual co-author approval.
13. Contributor names, order and roles are stored, and the attestation is linked to the contributor-list version it covers.
14. The publisher confirms they hold the rights and permissions needed to share the content; the confirmation is recorded.
15. DOI/URL metadata may be entered or imported, but imported metadata must be confirmed by the author.
16. A DOI, source link or verified affiliation does not prove that all claims are scientifically correct or peer reviewed.
17. Published stories support documented editing, archival, correction and retraction with appropriate audit history.
18. Retraction is a distinct visible status, not ordinary deletion or archival. Retractions of Citeface posts must be distinguishable from retractions of external papers a post references.
19. Supported content types are `STORY`, `VIDEO`, `PHOTO`, `PAPER` and `METHODS`.
20. Video duration is 90–300 seconds inclusive, validated from trusted media metadata.
21. Media-processing state is separate from post lifecycle state.
22. No confidential/unpublished material is sent to external AI in the MVP.
23. All state-changing operations require server-side validation and authorization.
24. Account suspension hides the author's published stories (moderation_state HIDDEN, reversible). Self-deleted accounts follow the 30-day grace period and erasure policy in ADR-0003 D2.

### 3.1 Canonical lifecycle and taxonomy

**Post lifecycle (`status`):**

| State | Meaning |
|---|---|
| `DRAFT` | Unpublished; accessible only to its author |
| `PUBLISHED` | Published; accessible according to audience and moderation state |
| `ARCHIVED` | Author-archived; excluded from normal discovery; history retained |
| `RETRACTED` | Visibly retracted; distinct from archival or removal |

`REMOVED` is not a lifecycle state. Moderation hiding/removal is a separate control (`moderation_state`: `NONE`, `HIDDEN`, `REMOVED`) so it cannot be confused with author archival or retraction.

**Content taxonomy (do not create duplicate enums):**

| Concept | Field | Values |
|---|---|---|
| Product content type | `content_type` | `STORY`, `VIDEO`, `PHOTO`, `PAPER`, `METHODS` |
| Uploaded asset type | `media_type` | `image`, `video` |
| Presentation choice (optional) | `presentation_format` | only if a distinct choice is needed, e.g. text vs image slides |

Mapping from v1.0 formats: `text` → `STORY`; `video` → `VIDEO`; `image_slides` → `PHOTO` (ordered images). Video leads feed identity; PHOTO image-slide stories are first-class alternatives and video is never compulsory.

**Audience labels:** API/database values are `PUBLIC`, `MEMBERS`, `FOLLOWERS`; UI labels are "Public", "Citeface Members", "Followers".

### 3.2 Central access policy

One reusable server-side policy function (for example `canViewStory(viewer, story)`) governs every read path. Evaluation order:

1. `status = DRAFT` → author only. No other role, including administrator, passes.
2. Author of the story → allowed (own `ARCHIVED`/`RETRACTED` stories included).
3. `moderation_state` of `HIDDEN`/`REMOVED` → denied to ordinary viewers.
4. `status = ARCHIVED` → denied for discovery and ordinary viewers.
5. `status` `PUBLISHED` or `RETRACTED` → apply audience:
   - `PUBLIC`: anyone.
   - `MEMBERS`: authenticated user.
   - `FOLLOWERS`: authenticated user with an existing `user_follows` row for the author, evaluated at request time.

A RETRACTED story stays reachable by direct link and on the author's profile for viewers who pass the audience check, showing its content behind a prominent retraction banner with reason and date. It is removed from feeds, search and recommendations; comments are locked and new appreciations and saves are blocked (ADR-0003 D1).

The same policy must be applied to: feed, story detail, profiles' story lists, search (results, autocomplete, snippets, counts, facets), recommendations, comments, reactions, saves, sources/contributors/previews, notifications, shared links, media delivery, and caches.

**Unauthorized response convention (ADR-0003 D7):** drafts and non-qualifying FOLLOWERS stories return `404`; MEMBERS stories requested while signed out return `401` with a generic body. Responses never include title, summary, author or media metadata of a restricted story.

**Caching:** responses for non-PUBLIC stories must not be stored in shared caches (`Cache-Control: private` or `no-store`). Shared caches/CDNs for PUBLIC content must be invalidated or bypassed when a story's audience becomes more restrictive. Signed media URLs are short-lived and issued only after the access check; they must never act as permanent public links.

## 4. Feature specifications

### F-01 Registration

**User story:** As a visitor, I want to create an account so I can participate in Citeface.

**Inputs:** display name, username, email, password, password confirmation (confirmation is client-side only and must not be sent/stored).

**Behaviour:**
- Validate required fields on client and server.
- Normalise username/email consistently.
- Enforce uniqueness for username and email.
- Enforce documented password policy.
- Hash passwords using a modern password-hashing algorithm; never store plaintext.
- Avoid revealing whether an email exists in sensitive recovery flows.
- Create a session or return the established authentication mechanism.
- Return safe user profile fields only.

**API contract (illustrative; adapt to existing API conventions):**
- `POST /api/auth/register`
- Request: `{ "displayName": "...", "username": "...", "email": "...", "password": "..." }`
- Success: `201 { "user": { "id": "...", "displayName": "...", "username": "...", "email": "..." } }`
- Errors: `400` validation, `409` uniqueness conflict, `429` rate limit, `500` unexpected server error.

**Acceptance criteria:**
- Valid registration creates one account.
- Duplicate username/email is rejected.
- Invalid fields are rejected server-side.
- Password is never returned or logged.
- Response contains no password hash or session secret.
- Session behaviour matches the current application architecture.

**Tests:** valid registration; missing required field; invalid email; username too short/invalid characters; password below policy; duplicate email; duplicate username; password hash differs from plaintext; response does not expose hash or secret; concurrent duplicate registration produces one account only.

### F-02 Login, logout and current session

**User story:** As a registered user, I want to sign in and securely end my session.

**API:** `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`

**Behaviour:**
- Verify credentials using secure password verification.
- Use the project's chosen session/cookie mechanism consistently.
- If cookies are used, set appropriate `HttpOnly`, `Secure` in production, `SameSite`, path and expiry attributes.
- Protect state-changing cookie-authenticated requests against CSRF as appropriate to the architecture.
- Logout invalidates the session server-side where applicable.
- `/me` returns the current safe user object or `401`.

**Acceptance criteria:**
- Correct credentials establish a session.
- Incorrect credentials return a generic authentication error.
- `/me` returns the authenticated user.
- `/me` without a valid session returns `401`.
- Logout invalidates the session.
- Protected API routes reject unauthenticated requests.

**Tests:** correct login; wrong password; unknown account; missing fields; `/me` authenticated/unauthenticated; logout; expired/invalid session; cookie attributes; CSRF protection where applicable; rate limiting.

### F-03 Profile management

**User story:** As a member, I want a profile that explains my research interests and background.

**Proposed fields:** user ID, display name, username, biography, avatar media reference, institution, department, position/role, country/region, website, ORCID/external profile URLs, verification status, created/updated timestamps.

**API:** `GET /api/users/:username`, `GET /api/me/profile`, `PATCH /api/me/profile`

**Behaviour:**
- Public profile endpoint exposes only public fields.
- A profile's story list is audience-aware for the requesting viewer and never lists drafts.
- Owner can update their own profile.
- Validate lengths and URL formats.
- Never allow a normal member to set their own verified status or privileged role.
- User-entered academic metrics (e.g. citations, h-index), if later added, are labelled as user-provided unless sourced and attributed.
- Profile fields remain optional except the identity fields required by account creation.

**Acceptance criteria:** owner can update allowed fields; another user cannot edit profile; public response omits private fields; verification cannot be self-assigned; invalid values are rejected; profile story lists respect audience.

**Tests:** profile retrieval; profile update; forbidden cross-user update; private field omission; invalid URL; overlong biography; mass-assignment attempt for role/verification; profile story list for signed-out, member, follower and non-follower.

### F-04 Research interests and taxonomy

**User story:** As a member, I want to select multiple research interests to make discovery more relevant.

**Proposed initial taxonomy:** discipline, field, topic. Seed a broad discipline-independent taxonomy; prioritise Life Sciences, Health and Engineering for initial community curation.

**API:** `GET /api/research-categories`, `PUT /api/me/interests`

**Behaviour:**
- Users may select multiple interests across disciplines.
- Taxonomy changes are managed through controlled seed/admin operations, not client-created categories in the MVP.
- Category IDs are validated.

**Acceptance criteria:** categories can be listed; multiple interests can be saved; duplicate/unknown IDs are rejected or safely deduplicated; one discipline does not restrict other interests.

**Tests:** list categories; save multiple interests; unknown category; duplicate category; unauthorised update; cross-discipline selection.

### F-05 Story drafts, publication and audience

**User story:** As a contributor, I want to compose, preview, save, publish and manage the audience of a research story.

**Proposed story fields:**
- id, author_user_id
- `content_type`: `STORY`, `VIDEO`, `PHOTO`, `PAPER`, `METHODS`
- `status`: `DRAFT`, `PUBLISHED`, `ARCHIVED`, `RETRACTED` (see 3.1)
- `audience`: `PUBLIC` (default), `MEMBERS`, `FOLLOWERS`
- `moderation_state`: `NONE`, `HIDDEN`, `REMOVED`
- title, slug (if used), summary/body
- research_status: `peer_reviewed`, `preprint`, `thesis`, `report`, `conference_presentation`, `ongoing_project`, `author_described`, `educational`
- category/topic references
- optional structured fields: research question/background, approach, findings, significance (METHODS: method description and research context)
- rights confirmation and authorship attestation references (F-06)
- published_at, created_at, updated_at, archived_at, retracted_at, retraction_reason
- correction/retraction metadata where applicable

**API:**
- `POST /api/stories` — create draft (server sets owner and `DRAFT`)
- `GET /api/me/drafts` — list own drafts
- `GET /api/stories/:storyId` — read per access policy
- `PATCH /api/stories/:storyId` — update (allow-listed fields; draft owner for drafts)
- `DELETE /api/stories/:storyId` — delete draft (draft owner only; published stories use archive)
- `POST /api/stories/:storyId/publish`
- `PATCH /api/stories/:storyId/audience` — author changes audience of a published story
- `POST /api/stories/:storyId/archive`
- `POST /api/stories/:storyId/retract`
- `POST /api/stories/:storyId/corrections` (F-18)

If equivalent endpoints already exist, document and reuse them rather than adding duplicates.

**Behaviour:**
- Create starts as `DRAFT` with `audience = PUBLIC` preselected.
- Drafts may be incomplete; full validation occurs at publish.
- Drafts autosave about every 30 seconds and when the user leaves a field. Each draft has a version number; a stale write returns `409` and the UI offers load-latest or overwrite. Drafts do not expire in the MVP (ADR-0003 D5).
- Only the author may read, edit, delete or publish their own drafts. Administrative roles do not automatically gain draft access.
- Drafts persist across sessions and devices; every draft operation enforces server-side ownership.
- Draft media stays private to the author.
- Publish validates, in one transaction: content type and required fields, at least one contributor, authorship attestation, rights confirmation, category, confirmed sources, required media `READY`, video duration, and a valid audience. Failure leaves the draft intact and creates no partial post. Repeated publish requests must not create duplicates (idempotent).
- Audience changes: authorized (author only), validated, immediately enforced across all access paths, and written to `audit_events` (previous and new audience, actor, timestamp).
- Associated published media inherits the story's current audience.
- Editing a published story follows a documented policy; material changes create a revision/audit record. Published contributor changes require renewed attestation.
- Archive is not retract. Retraction requires a reason and is visible.
- The generic `PATCH` uses an allow-list and must not allow clients to set owner, `status`, `moderation_state`, timestamps, audit fields or attestation fields. Status changes occur only through dedicated endpoints.
- "Owner/admin" is not a permission shorthand: authorization depends on resource state and action.

**Acceptance criteria:**
- Authenticated member can create a draft; new stories default to `PUBLIC`.
- Draft persists across sessions and devices; author can list, reopen, edit and delete it.
- Another member, including an administrator acting without ownership, cannot read, edit, publish or delete it.
- Drafts and their media are excluded from feeds, profiles, search, recommendations, notifications, APIs and media access for everyone but the author.
- Author can select `PUBLIC`, `MEMBERS` or `FOLLOWERS` before publication; invalid values are rejected.
- `PUBLIC` is accessible to signed-out visitors; `MEMBERS` requires authentication; `FOLLOWERS` requires an active follow.
- Published stories appear only in access-authorized feeds, profiles, search results and direct views.
- Audience changes take effect on the next request and create audit records.
- Unfollowing immediately revokes access to `FOLLOWERS` stories.
- Invalid stories cannot be published; repeated publish creates no duplicate.
- Archive removes stories from normal discovery while preserving history; retraction status is visible and distinct.

**Tests:** draft creation; unauthenticated creation denied; list own drafts; owner read; non-owner read denied (404); administrator non-owner read denied; owner edit; non-owner edit denied; owner delete; non-owner delete denied; delete of published story rejected (use archive); draft persistence across sessions; draft media privacy; publish valid; publish missing title; publish without contributor; publish with media not `READY`; failed publish leaves draft; double-publish idempotency; invalid audience rejected; default `PUBLIC`; signed-out access to PUBLIC; MEMBERS requires authentication; FOLLOWERS follower/non-follower/author; audience change and audit record; immediate revocation on restrictive change; unfollow revocation; audience-aware feed, search and profile; direct access by guessed ID; PATCH mass-assignment of `status`/`owner`/`audience`-bypass; archive; retraction; audit event creation.

### F-06 Contributors, authorship attestation and rights confirmation

**User story:** As a publisher, I want to record contributors and confirm that I am authorized to list them and to share the content.

**Behaviour:**
- At least one contributor is required to publish.
- Contributors belong to an immutable, versioned **contributor list**; order is stable and unique within a version.
- Per contributor: display name, order, role (free text initially or controlled taxonomy), optional linked profile user.
- The publisher affirms an authorship-authority attestation before publication. The server sets publisher identity, timestamp and policy version; clients cannot supply them.
- The attestation references the exact contributor-list version it covers.
- Changing a published story's contributor list creates a new version and requires renewed attestation plus an audit record.
- The publisher also confirms rights and permissions for uploaded and referenced material. This may share one UI step with the attestation but is stored as a distinct, server-timestamped record with a policy version.
- Do not imply that listed contributors approved the story. Co-author approval is not in MVP.
- A reporting route exists for suspected rights or ownership violations (F-17).

**Acceptance criteria:** publish blocked without at least one contributor, attestation or rights confirmation; order preserved; names and roles visible on the story to authorized viewers; attestation and rights confirmation auditable and bound to the covered contributor-list version; historical attestations preserved after later edits.

**Tests:** no contributor; multiple contributors; ordering; duplicate order rejected; missing attestation blocks publish; missing rights confirmation blocks publish; attestation recorded with server timestamp; client-supplied timestamp/publisher ignored; contributor change on published story requires new attestation; earlier version and attestation remain unchanged; only the author may modify contributors.

### F-07 Sources and publication metadata

**User story:** As a reader, I want to inspect the sources and publication status behind a research story.

**Proposed source fields:** story_id, source_type, title, DOI, URL, publisher/journal (optional), publication_date (optional), `origin` (`user_entered`/`imported`), author_confirmed, confirmed_at.

**API:** nested in story create/update, or `POST/DELETE /api/stories/:storyId/sources`.

**Behaviour:**
- DOI and URL are optional (for example, for ongoing or unpublished work).
- Validate URL scheme and length; prevent unsafe server-side URL fetching (SSRF).
- Imported metadata must be explicitly confirmed by the author before publication.
- Distinguish source metadata from platform validation.
- Never display a source as peer-reviewed solely because a DOI exists.
- A Citeface post is distinguishable from a formal external publication.
- Source details are visible only to users authorized to view the parent story.

**Acceptance criteria:**
- Valid source metadata can be attached.
- Malformed URLs and unsupported schemes are rejected.
- Imported/unconfirmed metadata is not represented as author-confirmed and blocks publication until confirmed.
- Source details, previews and metadata endpoints do not leak restricted story information.
- Source metadata does not imply peer review or scientific validation.
- Only the story author can modify sources.

**Tests:** valid DOI; valid HTTPS URL; malformed URL; unsupported scheme; unconfirmed imported source blocks publish; author confirmation; source visible to authorized viewer; source hidden from unauthorized viewer; unauthorised source modification; DOI without peer-review claim.

### F-08 Media upload and processing

**User story:** As a contributor, I want to upload a short research video or images.

**Media fields:** id, owner_user_id, storage_key, media_type, MIME type, file_size, `processing_status`, duration (video), width, height, checksum (optional), created_at, deleted_at.

**Processing states (technical, separate from post status):** `PENDING_UPLOAD`, `UPLOADING`, `PROCESSING`, `READY`, `FAILED`.

**API pattern (choose one consistent approach):**
- `POST /api/media/upload-intents`
- Upload to managed object storage using a short-lived signed URL, or a protected API upload if that is the established infrastructure.
- `POST /api/media/:mediaId/complete` to confirm upload and start validation/processing.
- `DELETE /api/media/:mediaId` for owner deletion when not attached to a published story, subject to policy.

**Behaviour:**
- Allow-list MIME types and inspect file signatures; do not trust extension or client MIME.
- Enforce byte limits. Launch limits (configurable without code changes; ADR-0003 D4): images are JPEG, PNG or WebP only, up to 10 per PHOTO story and 10 MB each (SVG and GIF rejected); a VIDEO story has one video, MP4 (H.264/AAC), up to 500 MB and 90-300 seconds, transcoded to 720p with a 480p fallback and a generated thumbnail.
- Video duration must be **90–300 seconds inclusive**, taken from trusted server-side or provider metadata, never client-reported only.
- Store objects privately; use random storage keys, never user-supplied filenames.
- Draft media is never reachable through guessable or permanent public URLs.
- Published media is delivered according to the parent story's **current audience** (see 3.2); a completed upload or finished processing does not make media public.
- Storage credentials and internal infrastructure details are never exposed to clients.
- A failed upload/processing leaves the draft intact, gives an actionable error, and lets the user retry or remove the media.
- Required media must be `READY` before publish.
- Purge abandoned uploads after 24 hours and media of deleted drafts within 7 days (ADR-0003 D3); consider malware scanning where proportionate.
- Reject executable and unsupported formats.

**Acceptance criteria:** allowed media uploads; unsupported/oversize rejected; ownership enforced; state tracked; video of exactly 90 s and 300 s accepted, 89 s and 301 s rejected; draft media private; published media follows story audience, including immediately after an audience change; failures surface safely without destroying the draft.

**Tests:** allowed image; allowed video; spoofed MIME; invalid file signature; oversize file; duration 89/90/300/301 s; client-reported duration ignored; unauthorised media access; cross-user deletion; abandoned upload cleanup; processing failure and retry; draft media denied to others; published PUBLIC media to signed-out; MEMBERS media denied signed-out; FOLLOWERS media denied after unfollow; media denied after audience restricted; cached/signed URL expiry.

### F-09 Image-story ordering (PHOTO)

**User story:** As a contributor, I want to arrange multiple images into a clear sequence.

**Behaviour:**
- A `PHOTO` story contains an ordered list of owned image media IDs.
- Enforce maximum image count and per-image size from configuration.
- Validate every media item belongs to the story owner.
- Preserve order when reading; provide accessible alternative text where applicable.

**Acceptance criteria:** multiple images attach; order preserved; foreign/invalid media IDs rejected; count limit enforced; images display correctly on mobile and desktop.

**Tests:** create; reorder; remove; duplicate image ID; foreign media ID; over-limit count; read order.

### F-10 Discovery feed and story detail

**User story:** As a reader, I want a relevant feed of published research stories.

**API:** `GET /api/feed?cursor=...&limit=...&category=...&content_type=...`, `GET /api/stories/:storyId`

**Behaviour:**
- Return published, non-archived stories only, subject to moderation state and the requesting viewer's current audience permissions (3.2).
- Exclude drafts from all discovery and ordinary retrieval.
- Signed-out visitors see `PUBLIC` only; members add `MEMBERS`; `FOLLOWERS` stories only for active followers; authors see their own.
- Apply the same authorization to queries, story detail, pagination, filters, counts, previews and related metadata.
- Default ordering may be recent-first; do not claim personalised ranking until implemented. Trending/Top/Discussed filters only when ranking definitions are documented.
- Support cursor pagination or another stable strategy.
- Include only safe author, contributor, category, source and media metadata for stories the viewer may access.
- Support all five content types in one feed; video-first presentation does not exclude other types.
- Avoid N+1 queries without weakening authorization.

**Acceptance criteria:**
- Signed-out visitors receive `PUBLIC` stories only.
- Members receive `PUBLIC` and `MEMBERS` stories plus `FOLLOWERS` stories they may access.
- Authors access their own published stories regardless of audience.
- Drafts and archived stories are excluded from normal discovery.
- Restricted stories do not leak through pagination, filters, counts, previews or detail.
- Audience changes and unfollowing are reflected on the next authorized read.
- Pagination does not duplicate records under stable ordering.
- Category and content-type filters do not bypass authorization.
- Retraction and moderation visibility follow their defined policies.

**Tests:** empty feed; mixed content types; category filter; content-type filter; cursor pagination; no duplicates; draft exclusion; archived exclusion; retracted label; signed-out/member/follower/non-follower/author views; audience change; unfollow revocation; restricted metadata leakage (counts, cursors, previews); unauthorized media excluded.

### F-11 Follow researchers and topics

**User story:** As a member, I want to follow researchers and topics to personalise my discovery.

**Tables:** `user_follows` (follower_user_id, followed_user_id, created_at), `topic_follows` (user_id, category_id, created_at).

**API:**
- `PUT /api/users/:userId/follow` (idempotent)
- `DELETE /api/users/:userId/follow`
- `GET /api/me/following`
- `PUT /api/me/topic-follows` or topic-specific `PUT/DELETE` endpoints.

**Behaviour:** self-follow is rejected (also enforced by a database check); follow and unfollow are idempotent; the pair is unique; a follow row is the single source of truth for `FOLLOWERS` access, so unfollowing takes effect on the next request with no caching of follow state beyond the request; no private account data exposed.

**Acceptance criteria:** member can follow/unfollow; duplicate follow creates no duplicate row; own list available; unauthenticated request denied; unfollow immediately revokes `FOLLOWERS` access.

**Tests:** follow; duplicate follow; unfollow; repeat unfollow; self-follow rejected; unauthenticated follow; topic follow/unfollow; database uniqueness; follow grants then unfollow revokes access to a FOLLOWERS story.

### F-12 Appreciation/reactions

**User story:** As a reader, I want to appreciate a story.

**MVP recommendation:** one simple appreciation action; no voting or rating (their meaning is undecided). Appreciation is a community signal, not evidence of scientific validity.

**Table:** `story_reactions` (user_id, story_id, reaction_type, created_at), unique user/story.

**API:** `PUT /api/stories/:storyId/appreciation`, `DELETE /api/stories/:storyId/appreciation`.

**Acceptance criteria:** authenticated user can appreciate/unappreciate stories they are authorized to access; one per user/story; counts consistent; draft, restricted-to-viewer or otherwise unavailable stories cannot be reacted to and reveal nothing.

**Tests:** add; duplicate idempotency; remove; count update; unauthenticated; unavailable story; non-follower on FOLLOWERS story denied; access revoked then reaction denied.

### F-13 Saves

**User story:** As a reader, I want to save stories for later.

**Table:** `story_saves` (user_id, story_id, created_at), unique user/story.

**API:** `PUT /api/stories/:storyId/save`, `DELETE /api/stories/:storyId/save`, `GET /api/me/saved-stories`.

**Behaviour:** a user may save only stories they can currently access. A saved entry never bypasses authorization: if access is later revoked (audience change, unfollow, archive, moderation), the saved list must not return the story's content, media or title; it shows a "No longer available" placeholder with no title, author or media, which the user can remove; if access returns, the entry reappears in full (ADR-0003 D9).

**Acceptance criteria:** save/unsave; list private to owner; duplicate idempotent; revoked/unavailable stories return no restricted content.

**Tests:** save; duplicate save; unsave; list saved; cross-user access denied; save of inaccessible story denied; unfollow after save hides content; retracted/archived behaviour.

### F-14 Questions and comments

**User story:** As a reader, I want to ask questions and discuss research.

**Table:** `story_comments` (id, story_id, author_user_id, parent_comment_id nullable, body, status, created_at, updated_at, deleted_at).

**API:** `GET /api/stories/:storyId/comments?cursor=...`, `POST /api/stories/:storyId/comments`, `PATCH /api/comments/:commentId`, `DELETE /api/comments/:commentId`.

**Behaviour:**
- Authenticated users may comment only on stories they are authorized to access. Commenting never makes the parent story more public.
- Reading comments requires access to the parent story.
- Validate body length; reject empty content.
- Replies: flat or one-level in first release.
- Users edit/delete own comments within policy; moderators hide/remove with audit trail.
- Escape/render user content safely; never render arbitrary HTML.

**Acceptance criteria:** valid comment persists on the correct story; empty/oversized rejected; cannot edit another user's comment; moderated content hidden per policy; comments of restricted stories not readable by unauthorized users.

**Tests:** create; empty body; max length; XSS payload safely rendered; edit own; edit another's denied; delete own; moderation hide; comment on inaccessible story denied; comment list denied after unfollow.

### F-15 Search

**User story:** As a reader, I want to find stories and researchers by keywords and category.

**API:** `GET /api/search?q=...&type=stories|users&category=...&cursor=...`

**Behaviour:**
- MVP uses database full-text or indexed case-insensitive matching.
- Results, autocomplete, snippets, counts, facets and previews are filtered by the viewer's current authorization. Signed-out visitors discover `PUBLIC` stories only.
- Search indexes must not create a side channel for restricted content. Audience changes and unfollows must invalidate or safely re-evaluate indexed/cached results (authorize at query time, not at index time).
- Search only public profile fields and non-draft stories.
- Apply length and rate limits; parameterised queries only.
- Semantic search is deferred.

**Acceptance criteria:** matching stories/users found; drafts and private fields excluded; restricted stories excluded unless authorized; category filter works; empty/too-long query handled; stable pagination.

**Tests:** title match; summary/body match; username/display name; category filter; draft exclusion; private profile exclusion; MEMBERS story absent for signed-out; FOLLOWERS story present only for followers; audience change reflected; counts/snippets do not leak; SQL injection string; empty query; max length; rate limit.

### F-16 Notifications (minimum viable)

**User story:** As a user, I want to know when someone interacts with my story or responds to me.

**Table:** `notifications` (id, recipient_user_id, actor_user_id nullable, type, entity_type, entity_id, read_at, created_at).

**API:** `GET /api/me/notifications`, `POST /api/me/notifications/:id/read`, optional bulk-read.

**Behaviour:** generate only supported high-value types; no self-action notifications; recipient ownership enforced; avoid storms. Notifications must not disclose restricted content to an unauthorized recipient: before returning a preview or resolving a target, the server re-checks current access. A notification created while access existed does not preserve access after an audience change or unfollow. Drafts never generate public notifications.

**Acceptance criteria:** supported event creates a notification; only recipient can read/mark read; read state persists; links resolve to valid, currently accessible entities; previews respect current access.

**Tests:** creation; self-action suppression; recipient isolation; mark read; invalid ID; deleted entity; preview hidden after unfollow; preview hidden after audience restricted; draft produces no notification.

If notifications threaten MVP delivery, release a minimal in-app list after core publishing/discovery and document the deferral.

### F-17 Reporting and moderation

**User story:** As a member, I want to report content; as a moderator, I want to review and act on reports.

**Tables:** `content_reports` (id, reporter_user_id, target_type, target_id, reason_code, details, status, created_at, reviewed_at, reviewer_user_id); `moderation_actions` (id, moderator_user_id, target_type, target_id, action, reason, created_at).

**API:** `POST /api/reports`, `GET /api/admin/reports`, `POST /api/admin/reports/:reportId/actions`.

**Behaviour:**
- Authentication required to report; reporter must be able to access the target.
- Validate target and reason; include copyright/rights-violation reason codes; prevent duplicate spam.
- Admin endpoints require moderator/admin permission.
- Moderation applies to published or otherwise reportable platform content. It does **not** grant moderators access to unpublished drafts or draft media; any exceptional legal/security process must be separately defined.
- Moderator access to restricted (MEMBERS/FOLLOWERS) published stories is limited to reported targets and every view is written to the audit log; there is no browsing of restricted content (ADR-0003 D8).
- Moderation hiding/removal sets `moderation_state`; it does not alter lifecycle `status`.
- Record actions and reasons; reporter identity is not revealed to the reported user by default; a report is not proof of wrongdoing.
- Define urgent handling and escalation for safety/legal issues.

**Acceptance criteria:** report recorded; non-moderators cannot access the queue; moderator action audited; visibility follows the action; drafts not exposed in the queue.

**Tests:** valid report; invalid target; report of inaccessible story denied; duplicate/rate limit; non-moderator denied; moderator action; audit record; reporter identity not exposed; moderator cannot read a draft; moderation sets `moderation_state` not `status`.

### F-18 Corrections, archive and retraction

**User story:** As a publisher, I want to correct, archive or retract a story responsibly.

**Behaviour:**
- Edits that materially change research claims create a revision/audit record.
- A **correction** is a visible, dated record naming the responsible actor, distinguishable from an ordinary edit; prior content is preserved.
- **Archive** removes the story from normal discovery while retaining history; it is not retraction.
- **Retraction** requires a reason and timestamp and shows a clear label; content is never silently rewritten as if still valid.
- Retractions of Citeface posts are distinguishable from retractions of external papers a post references; claims about external retractions require an appropriate source or confirmation.
- Visibility of retracted content follows ADR-0003 D1 (see 3.2).
- Besides the author, a moderator or administrator may retract only through a documented moderation action with a reason, which notifies the author and is audited (ADR-0003 D1). Harmful or unlawful content uses moderation_state HIDDEN instead.

**API:** `POST /api/stories/:id/corrections`, `/archive`, `/retract`.

**Acceptance criteria:** correction recorded and visible; archive distinct from retraction; retraction reason/status visible; unauthorised users cannot change status; history preserved; audience rules still apply to archived/retracted stories for the author and authorized viewers.

**Tests:** correction record; correction vs ordinary edit; archive; retract; missing reason; non-owner retract; retracted story feed/detail behaviour; external-retraction label requires source; audit history.

### F-19 Administration and audit

**User story:** As an administrator, I want authorized tools to manage platform safety and inspect important changes.

**Behaviour:**
- Separate admin/moderator permissions from ordinary roles.
- Record privileged actions; audit events cover publish, audience change, archive, correction, retraction, contributor change, attestation, moderation actions and role changes.
- Avoid logging passwords, session secrets, draft content or unnecessary personal data.
- Provide minimal admin workflows required for beta.
- Retain audit events for at least 24 months; ordinary user actions cannot delete them (ADR-0003 D3).

**Tests:** role escalation denied; admin endpoint protected; admin cannot read another user's draft; audit record created for each event type above; sensitive values and draft content absent from logs.

### F-20 Analytics and operational readiness

**Events to consider:** registration_completed, login_completed, profile_completed, interest_selected, story_draft_created, story_published, story_audience_changed, media_upload_started/completed/failed, story_viewed, story_saved, appreciation_added, comment_created, researcher_followed, report_submitted.

**Rules:**
- Define event names and properties centrally.
- Exclude research content, draft content and secrets from analytics payloads.
- Do not count detectable bot activity as meaningful engagement.
- Provide error monitoring, backup checks and release health indicators.

**Tests:** event emitted on expected action; not emitted on failed action; payload excludes secrets and draft content; duplicate event handling understood; backup restoration procedure tested.

### F-21 Sharing and shared links

**User story:** As a reader, I want to share a story without weakening its access rules.

**Behaviour:**
- Sharing uses the story's canonical URL; there are no tokenised links that bypass audience checks.
- `PUBLIC` stories can be shared with anyone, including signed-out visitors, and may expose link previews.
- For non-`PUBLIC` stories, link previews and metadata tags expose no title, summary, author or media; recipients must pass the access policy.
- Users are told that public stories can be accessed and shared outside Citeface, and that audience restriction does not guarantee confidentiality outside the platform.
- Shared links, previews and media always reflect the story's current audience.

**Acceptance criteria:** public link works signed-out; restricted link yields no content or metadata to unauthorized users; link stops working for a user after an audience restriction or unfollow; previews leak nothing for restricted stories.

**Tests:** public share signed-out; MEMBERS link signed-out; FOLLOWERS link non-follower; preview/OG tags for restricted story contain no metadata; link after audience change.

## 5. Proposed relational data model

A logical starting point, not a command to replace existing tables. Inspect the current schema and map existing equivalents before creating migrations.

### Core tables

**users** — id (PK), display_name, username (unique, normalised), email (unique, normalised), password_hash, role (member/moderator/admin; protected from self-assignment), account_status, created_at, updated_at.

**profiles** — user_id (PK/FK), bio, avatar_media_id nullable, institution, department, position, country_code, website_url, orcid_url, verification_status (unverified/pending/verified/rejected), created_at, updated_at.

**research_categories** — id, name, slug (unique), parent_id nullable, description, is_active, sort_order.

**user_interests** — user_id, category_id, created_at; unique(user_id, category_id).

**stories**
- id, author_user_id (FK)
- content_type (STORY/VIDEO/PHOTO/PAPER/METHODS)
- presentation_format nullable (only if needed)
- status (DRAFT/PUBLISHED/ARCHIVED/RETRACTED)
- audience (PUBLIC/MEMBERS/FOLLOWERS), not null, default PUBLIC
- moderation_state (NONE/HIDDEN/REMOVED), default NONE
- title, slug nullable, summary, body
- research_status
- primary_category_id (FK)
- research_question, approach, findings, significance (nullable)
- rights_confirmed_at nullable, rights_policy_version nullable
- current_contributor_list_version_id nullable
- published_at, archived_at, retracted_at, retraction_reason (nullable)
- created_at, updated_at

**story_categories** (optional multi-category) — story_id, category_id; unique pair.

**contributor_list_versions** — id, story_id (FK), version_number, created_by_user_id, created_at; unique(story_id, version_number).

**story_contributors** — id, contributor_list_version_id (FK), display_name, contributor_order, role nullable, profile_user_id nullable, created_at; unique(contributor_list_version_id, contributor_order).

**authorship_attestations** — id, story_id, publisher_user_id, contributor_list_version_id (FK), attested_at (server-generated), policy_version. Append-only; never updated or deleted.

**story_sources** — id, story_id, source_type, title, doi, url, publisher_or_journal, publication_date (nullable), origin (user_entered/imported), author_confirmed boolean, confirmed_at nullable, created_at.

**media_assets** — id, owner_user_id, storage_key (unique, random), media_type (image/video), mime_type, file_size_bytes, duration_seconds nullable, width, height, processing_status (PENDING_UPLOAD/UPLOADING/PROCESSING/READY/FAILED), created_at, deleted_at nullable.

**story_media** — story_id, media_asset_id, display_order, role (video/slide/thumbnail); unique(story_id, media_asset_id).

**user_follows** — follower_user_id, followed_user_id, created_at; unique pair; check follower != followed.

**topic_follows** — user_id, category_id, created_at; unique pair.

**story_reactions** — user_id, story_id, reaction_type, created_at; unique(user_id, story_id).

**story_saves** — user_id, story_id, created_at; unique(user_id, story_id).

**story_comments** — id, story_id, author_user_id, parent_comment_id nullable, body, status, created_at, updated_at, deleted_at nullable.

**notifications** — id, recipient_user_id, actor_user_id nullable, type, entity_type, entity_id, read_at nullable, created_at.

**content_reports** — id, reporter_user_id, target_type, target_id, reason_code, details nullable, status, created_at, reviewed_at nullable, reviewer_user_id nullable.

**moderation_actions** — id, moderator_user_id, target_type, target_id, action, reason, created_at.

**story_revisions** — id, story_id, editor_user_id, revision_number, snapshot or change representation, change_summary nullable, created_at.

**story_corrections** — id, story_id, actor_user_id, correction_text, created_at (distinct from revisions).

**audit_events** — id, actor_user_id nullable, action, entity_type, entity_id, metadata_json (allow-listed, no secrets, no draft content), created_at.

### Database constraints and indexes

- Unique normalised username and email.
- Foreign keys for all owned entities.
- Unique composite constraints for follows, saves, appreciation, contributor order per version.
- Check constraints for allowed `status`, `audience`, `content_type`, `moderation_state` values and no self-follow.
- `authorship_attestations` and historical `contributor_list_versions` are immutable (no update/delete path).
- Indexes: stories(status, audience, published_at); stories(primary_category_id, published_at); stories(author_user_id, status, created_at) for draft listing; user_follows(followed_user_id, follower_user_id) for follower checks; comments(story_id, created_at); notifications(recipient_user_id, created_at, read_at); reports(status, created_at); media_assets(owner_user_id, processing_status).
- Use transactions for publication and related contributor/source/media/attestation association.
- Use database constraints as well as application validation.
- Define cascade/restrict/soft-delete deliberately; never accidentally delete audit history. Hard deletion is permitted only for never-published drafts.

## 6. API conventions

Adapt paths and naming to the current API rather than creating duplicate endpoints.

### General
- JSON request/response unless uploading binary content.
- Consistent error shape, e.g. `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }`.
- Correct HTTP status codes; never expose stack traces or secrets.
- Validate all input server-side; parameterised queries or ORM-safe operations.
- Pagination on collection endpoints.
- Rate limits on authentication, search, comments, uploads and reporting.
- Enforce ownership, roles and audience in the service/API layer through the central policy (3.2).

### Endpoint inventory

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/auth/me` | Yes (`401` if none) | Current user |
| GET | `/api/me/profile` | Yes | Own profile |
| PATCH | `/api/me/profile` | Yes | Update own profile |
| GET | `/api/users/:username` | No | Public profile (audience-aware story list) |
| GET | `/api/research-categories` | No | List taxonomy |
| PUT | `/api/me/interests` | Yes | Set interests |
| POST | `/api/stories` | Yes | Create draft; server sets owner and `DRAFT` |
| GET | `/api/me/drafts` | Yes | List own drafts |
| GET | `/api/stories/:id` | Policy | Read story/draft per access policy |
| PATCH | `/api/stories/:id` | Draft owner / story author | Allow-listed update |
| DELETE | `/api/stories/:id` | Draft owner | Delete draft |
| POST | `/api/stories/:id/publish` | Draft owner | Publish with full validation |
| PATCH | `/api/stories/:id/audience` | Story author | Change audience; audited, immediate |
| PUT | `/api/stories/:id/contributors` | Draft owner; published edit needs renewed attestation | Replace contributor list (new version) |
| POST | `/api/stories/:id/archive` | Story author | Archive |
| POST | `/api/stories/:id/retract` | Authorized actor per policy | Retract |
| POST | `/api/stories/:id/corrections` | Story author | Visible correction |
| GET | `/api/feed` | Optional | Audience-aware discovery feed |
| GET | `/api/search` | Optional | Audience-aware search |
| POST | `/api/media/upload-intents` | Yes | Start upload |
| POST | `/api/media/:id/complete` | Yes | Complete upload |
| DELETE | `/api/media/:id` | Owner | Delete unattached media |
| PUT | `/api/users/:id/follow` | Yes | Follow user |
| DELETE | `/api/users/:id/follow` | Yes | Unfollow |
| GET | `/api/me/following` | Yes | Own follows |
| PUT | `/api/me/topic-follows` | Yes | Set topic follows |
| PUT | `/api/stories/:id/appreciation` | Yes + story access | Appreciate |
| DELETE | `/api/stories/:id/appreciation` | Yes | Remove appreciation |
| PUT | `/api/stories/:id/save` | Yes + story access | Save |
| DELETE | `/api/stories/:id/save` | Yes | Unsave |
| GET | `/api/me/saved-stories` | Yes | List saves |
| GET | `/api/stories/:id/comments` | Policy | List discussion (requires story access) |
| POST | `/api/stories/:id/comments` | Yes + story access | Comment/question |
| POST | `/api/reports` | Yes + target access | Report |
| GET | `/api/me/notifications` | Yes | List notifications |
| POST | `/api/me/notifications/:id/read` | Yes | Mark read |
| GET | `/api/admin/reports` | Moderator | Moderation queue |
| POST | `/api/admin/reports/:id/actions` | Moderator | Moderation action |

## 7. Cross-cutting security and privacy checks

- Authentication, authorization and audience policy are enforced server-side; frontend visibility is never the security boundary.
- No user can set their own role or verification status.
- Draft endpoints verify ownership; administrators and moderators do not bypass it.
- Draft media objects are private; published media inherits current story audience.
- Audience authorization covers feeds, profiles, detail, search, recommendations, notifications, shared links, APIs, media delivery and caches.
- File uploads validate real file signatures and limits; random storage keys; short-lived signed URLs if applicable.
- Prevent XSS (never render arbitrary HTML) and SQL injection (parameterised queries).
- Protect cookie-authenticated state-changing endpoints against CSRF.
- Rate-limit abuse-prone endpoints.
- Keep secrets, draft content and sensitive data out of logs and analytics.
- Restrict and audit admin actions.
- Public APIs omit private profile fields and drafts.
- Define backup retention and test restoration; define data export/deletion obligations before public launch.
- No confidential or unpublished material goes to external AI providers in the MVP.

## 8. Test strategy

### Unit tests
Validators and normalisers; permission rules including the central audience policy (draft, author, PUBLIC, MEMBERS, FOLLOWERS, archived, retracted, moderation states); default audience; audience-change validation; publication readiness; status transitions; media type/size/duration validation (89/90/300/301 s); feed filtering and ordering; contributor attestation logic and list versioning.

### Integration tests
Auth routes with database; profile ownership; draft create/list/update/delete/publish lifecycle and ownership; audience enforcement on every read path; audience change and unfollow revocation; media association and access control; feed and search visibility; follows, reactions and saves; comments and notifications access; reports and moderation; correction/retraction audit history.

### End-to-end tests
1. Register → login → complete profile.
2. Select research interests.
3. Create an incomplete draft → sign out/in → reopen, edit, resave.
4. Another account (and an administrator) cannot access the draft; it is absent from feed, profile, search and media URLs.
5. Publish a STORY; PUBLIC is the default; signed-out visitor can view it.
6. Publish a VIDEO story (90–300 s) → upload → process → play; invalid duration blocked.
7. Publish a PHOTO story → reorder images → publish.
8. Publish a MEMBERS story: signed-out denied, member allowed.
9. Publish a FOLLOWERS story: follower allowed, non-follower denied, denied after unfollow.
10. Change a published story's audience; access updates immediately; audit record exists; no leak via search, profile, feed, notification or media URL.
11. Reader follows author → saves → appreciates → comments.
12. User reports content → moderator reviews → action recorded.
13. Publisher issues a correction, archives, or retracts → status visible and distinct.
14. Published contributor change requires renewed attestation.
15. Logout → protected routes and APIs reject unauthenticated access.

### Non-functional tests
Keyboard navigation and basic accessibility; responsive layout at mobile/tablet/desktop; upload size and duration boundaries; feed pagination under concurrent publication; basic load test for feed and media; cache behaviour after audience change; backup restoration rehearsal; dependency and security scanning; production cookie/security-header verification.

## 9. MVP release gates

### Gate A — Functional completeness
- All P0 journeys work end-to-end.
- No known critical/blocking defects.
- Tests cover permissions and privacy boundaries.

### Gate B — Trust, safety and privacy
- Draft privacy and admin non-owner denial verified.
- PUBLIC, MEMBERS and FOLLOWERS enforced on all access paths; audience changes and unfollow revoke immediately; no known critical privacy or authorization vulnerability.
- Contributor attestation (versioned) and rights confirmation recorded.
- Source/status labels implemented; DOI never implies peer review.
- Reporting/moderation workflow usable.
- Correction/archive/retraction behaviour documented and tested.

### Gate C — Operational readiness
- Production secrets outside source control.
- Backups and restore procedure verified.
- Error monitoring active.
- Upload limits and storage costs understood.
- Rollback/release process documented.

### Gate D — Beta readiness
- Sample content permission-cleared.
- User onboarding prepared.
- Feedback and incident channels established.
- Analytics events defined.
- Moderation coverage arranged.

## 10. Implementation rule

Before implementing any item:
1. Locate existing route, component, service, database model and tests.
2. Mark the requirement as **Existing**, **Partial**, **Missing** or **Not applicable**.
3. Reuse and extend working code.
4. Add migrations only for confirmed schema gaps.
5. Add or update tests with each change.
6. Run the relevant test, typecheck and build commands.
7. Record the change and remaining risks.

Do not silently invent answers to open decisions; record them in an ADR before implementing. This specification is a target contract; the repository audit determines the safe implementation sequence.
