# Citeface MVP — Detailed Product and Engineering Specification

**Version:** 1.0  
**Date:** 4 November 2026  
**Status:** Proposed implementation specification; reconcile with codebase audit before implementation.

## 1. Purpose and scope

This document translates the Citeface strategy into implementable MVP requirements. It defines feature behaviour, proposed data entities, API contracts, acceptance criteria and test cases.

It is not a mandate to rebuild existing functionality. First inspect the repository and map each requirement to existing code, tests and database structures. Reuse working implementations and document gaps.

### MVP product outcome

A user can register, create a profile, discover research stories, watch a short video or browse image slides, inspect sources and contributors, follow researchers/topics, appreciate/save a story, ask a question, and publish their own story with appropriate provenance and privacy controls.

### Out of scope
Direct messages, group chat, jobs/grants marketplace, institutional analytics, subscriptions, AI recommendations/assistant, semantic search, native mobile apps, complex reputation systems and microservices.

## 2. Roles and permissions

| Role | Permissions |
|---|---|
| Visitor | Browse only publicly accessible published content and public profiles; registration required for protected interactions |
| Member | Manage own profile; follow, appreciate, save, comment/question, report; create own stories |
| Publisher/author | All member permissions; manage own stories, drafts, contributors and permitted corrections |
| Moderator | Review reports and take documented moderation actions within assigned scope |
| Administrator | Manage platform configuration and privileged account/moderation operations |

Role checks must be enforced by the API, not only by hiding frontend controls.

Verification is a profile status/claim workflow, not a role that grants scientific authority. Do not make publication access dependent on academic verification in the MVP.

## 3. Global product rules

1. Published stories are public under the initial policy.
2. Draft stories are private to their owner and authorised administrators where required for support/security.
3. The publisher attests that they have authority to list named contributors.
4. Contributor names, order and roles are stored.
5. Co-author approval is deferred.
6. DOI/URL metadata may be entered or imported, but the author confirms it.
7. A DOI or verified affiliation does not prove that all claims are scientifically correct.
8. Published stories are archived/soft-deleted with audit history where applicable.
9. Retraction is a distinct visible status, not ordinary deletion.
10. Content formats include text, short video and image-slide stories.
11. Video leads the feed identity, but image-slide stories are first-class alternatives.
12. No confidential/unpublished material is sent to external AI in the MVP.
13. All state-changing operations require server-side validation and authorisation.

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

**Tests:**
- Valid registration.
- Missing required field.
- Invalid email.
- Username too short/invalid characters.
- Password below policy.
- Duplicate email.
- Duplicate username.
- Password hash differs from plaintext.
- Response does not expose hash or secret.
- Concurrent duplicate registration produces one account only.

### F-02 Login, logout and current session

**User story:** As a registered user, I want to sign in and securely end my session.

**API:**
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

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

**API:**
- `GET /api/users/:username`
- `GET /api/me/profile`
- `PATCH /api/me/profile`

**Behaviour:**
- Public profile endpoint exposes only public fields.
- Owner can update their own profile.
- Validate lengths and URL formats.
- Never allow a normal member to set their own verified status or privileged role.
- Profile fields remain optional except the identity fields required by account creation.

**Acceptance criteria:** owner can update allowed fields; another user cannot edit profile; public response omits private fields; verification cannot be self-assigned; invalid values are rejected.

**Tests:** profile retrieval; profile update; forbidden cross-user update; private field omission; invalid URL; overlong biography; mass-assignment attempt for role/verification.

### F-04 Research interests and taxonomy

**User story:** As a member, I want to select multiple research interests to make discovery more relevant.

**Proposed initial taxonomy:** discipline, field, topic. Seed broad discipline-independent taxonomy; prioritise Life Sciences, Health and Engineering for initial community curation.

**API:**
- `GET /api/research-categories`
- `PUT /api/me/interests`

**Behaviour:**
- Users may select multiple interests.
- A researcher may select interests across disciplines.
- Taxonomy changes are managed through controlled seed/admin operations, not arbitrary client-created categories in the MVP.
- Category IDs are validated.

**Acceptance criteria:** categories can be listed; multiple interests can be saved; duplicate/unknown IDs are rejected or safely deduplicated; one discipline does not restrict other interests.

**Tests:** list categories; save multiple interests; unknown category; duplicate category; unauthorised update; cross-discipline selection.

### F-05 Research story draft and publication

**User story:** As a contributor, I want to compose, preview, save and publish a research story.

**Proposed story fields:**
- id, author_user_id
- title, slug (if used), summary/body
- format: `text`, `video`, `image_slides`
- status: `draft`, `published`, `archived`, `retracted`
- research_status: `peer_reviewed`, `preprint`, `thesis`, `report`, `conference_presentation`, `ongoing_project`, `author_described`, `educational`
- category/topic references
- research question/background, approach, findings, significance (optional structured fields)
- published_at, created_at, updated_at, archived_at
- correction/retraction metadata where applicable

**API:**
- `POST /api/stories`
- `GET /api/stories/:storyId`
- `PATCH /api/stories/:storyId`
- `POST /api/stories/:storyId/publish`
- `POST /api/stories/:storyId/archive`
- `POST /api/stories/:storyId/retract`

**Behaviour:**
- Create starts as draft.
- Draft is private to owner.
- Only owner or authorised admin can edit a draft.
- Publish validates required content, contributors, category and media constraints.
- Published story becomes publicly readable.
- Editing a published story must follow a documented policy and preserve audit history for material changes.
- Archive is not the same as retract.
- Retraction requires a reason and visible status.
- Do not allow clients to set protected ownership, status timestamps or audit fields directly through generic PATCH.

**Acceptance criteria:**
- Authenticated member can create a draft.
- Draft is invisible to other members and public feed/search.
- Owner can edit own draft.
- Another member cannot read/edit draft.
- Valid draft can be published.
- Published story appears in feed and public detail.
- Invalid story cannot publish.
- Archive removes story from normal discovery but preserves required history.
- Retraction status is visible and distinct.

**Tests:** create draft; unauthenticated create; owner read; non-owner read denied; owner edit; non-owner edit denied; publish valid; publish missing title; publish without required media; published feed visibility; draft excluded from search; archive; retract without reason; retract with reason; audit event creation.

### F-06 Contributors and authorship attestation

**User story:** As a publisher, I want to record contributors and confirm that I am authorised to list them.

**Proposed contributor fields:** story_id, display_name, contributor_order, role (free-text initially or controlled taxonomy), optional profile_user_id, created_at.

**API:** contributor data may be included in story create/update requests or handled through a nested endpoint, provided transaction integrity is maintained.

**Behaviour:**
- Publisher must affirm an authorship-authority attestation before publication.
- Store attestation timestamp and policy/version identifier.
- Preserve contributor order.
- Do not imply that listed contributors have individually approved the story.
- Co-author approval is not in MVP.

**Acceptance criteria:** publisher cannot publish without attestation; contributor order is preserved; contributor names and roles are visible on published story; attestation is auditable.

**Tests:** no contributor; multiple contributors; ordering; missing attestation blocks publish; attestation recorded; client cannot spoof attestation timestamp; update contributor list only by authorised publisher.

### F-07 Sources and publication metadata

**User story:** As a reader, I want to inspect the sources and publication status behind a research story.

**Proposed source fields:** story_id, source_type, title, DOI, URL, publisher/journal (optional), publication_date (optional), author_confirmed, confirmed_at.

**API:** sources may be nested in story create/update or use `POST/DELETE /api/stories/:storyId/sources`.

**Behaviour:**
- Accept DOI and/or URL where relevant.
- Validate URL scheme and length; prevent unsafe server-side URL fetching.
- Imported metadata must be explicitly confirmed by author before publication.
- Distinguish source metadata from platform validation.
- Never display a source as peer-reviewed solely because a DOI exists.

**Acceptance criteria:** valid sources can be attached; malformed URLs rejected; imported/unconfirmed metadata is not represented as confirmed; source details are visible on public story.

**Tests:** valid DOI; valid HTTPS URL; malformed URL; unsupported scheme; unconfirmed imported source; author confirmation; source visibility; unauthorised source modification.

### F-08 Media upload and processing

**User story:** As a contributor, I want to upload a short research video or images for an image-slide story.

**Media fields:** id, owner_user_id, storage_key, media_type, MIME type, file_size, processing_status, duration (video), width, height, checksum (optional), created_at, deleted_at.

**API pattern (choose one consistent approach):**
- `POST /api/media/upload-intents` to create a controlled upload.
- Upload to managed object storage using a short-lived signed URL, or use a protected API upload if that is the established infrastructure.
- `POST /api/media/:mediaId/complete` to confirm upload and initiate validation/processing.
- `DELETE /api/media/:mediaId` for owner deletion when not attached to a published story, subject to policy.

**Behaviour:**
- Allow-list MIME types and inspect file signatures; do not trust extension or client MIME alone.
- Enforce configured byte limits and video duration limits.
- Store objects privately by default; expose published media through controlled public delivery.
- Use random storage keys; do not use user-supplied filenames as storage paths.
- Process/optimise images and video as required by the selected provider.
- Reject executable and unsupported formats.
- Ensure draft media does not become publicly accessible through guessable URLs.
- Define cleanup for abandoned uploads.
- Consider malware scanning where supported and proportionate.

**Acceptance criteria:** allowed media can be uploaded; unsupported type/oversize media rejected; media ownership enforced; upload status tracked; draft media is private; published media is accessible according to story visibility; failed processing is surfaced safely.

**Tests:** allowed image; allowed video; spoofed MIME; invalid file signature; oversize file; duration limit; unauthorised media access; cross-user deletion; abandoned upload cleanup; processing failure; published delivery access.

### F-09 Image-slide story ordering

**User story:** As a contributor, I want to arrange multiple images into a clear sequence.

**Behaviour:**
- Image-slide stories contain an ordered list of owned image media IDs.
- Enforce a maximum slide count and per-image size based on deployment configuration.
- Validate every media item belongs to the story owner.
- Preserve order when reading the story.

**Acceptance criteria:** multiple images can be attached; order is preserved; invalid/foreign media IDs are rejected; slide count limit is enforced.

**Tests:** create slides; reorder; remove slide; duplicate image ID handling; foreign media ID; over-limit count; read order.

### F-10 Discovery feed and story detail

**User story:** As a reader, I want a relevant feed of published research stories.

**API:**
- `GET /api/feed?cursor=...&limit=...&category=...&format=...`
- `GET /api/stories/:storyId`

**Behaviour:**
- Return published, non-archived stories only, subject to moderation visibility.
- Exclude drafts and restricted/removed content.
- Default ordering may be recent-first for MVP; do not claim personalised ranking until implemented.
- Support cursor pagination or another stable pagination strategy.
- Include safe author, contributor, category, source and media metadata.
- Support video and image-slide formats in one feed.
- Avoid N+1 queries.

**Acceptance criteria:** feed returns public stories; draft excluded; pagination does not duplicate records under stable ordering; category and format filters work; story detail returns safe complete data; removed content follows visibility policy.

**Tests:** empty feed; mixed formats; category filter; format filter; cursor pagination; no duplicate page records; draft exclusion; archived exclusion; retracted story label; unauthorised/private media excluded.

### F-11 Follow researchers and topics

**User story:** As a member, I want to follow researchers and topics to personalise my discovery.

**Proposed tables:** user_follows (follower_user_id, followed_user_id, created_at), topic_follows (user_id, topic_id, created_at).

**API:**
- `POST /api/users/:userId/follow`
- `DELETE /api/users/:userId/follow`
- `GET /api/me/following`
- `PUT /api/me/topic-follows` or topic-specific POST/DELETE endpoints.

**Behaviour:** prevent self-follow if desired; make follow idempotent; enforce unique pair; do not expose private account data.

**Acceptance criteria:** member can follow/unfollow; duplicate follow does not create duplicate rows; own follow list is available; unauthenticated request denied.

**Tests:** follow; duplicate follow; unfollow; repeat unfollow; self-follow policy; unauthenticated follow; topic follow/unfollow; database uniqueness.

### F-12 Appreciation/reactions

**User story:** As a reader, I want to appreciate a story.

**MVP recommendation:** one simple appreciation action rather than a large reaction taxonomy.

**Proposed table:** story_reactions (user_id, story_id, reaction_type, created_at), unique user/story for single appreciation.

**API:** `PUT /api/stories/:storyId/appreciation`, `DELETE /api/stories/:storyId/appreciation`.

**Acceptance criteria:** authenticated user can appreciate/unappreciate; one appreciation per user/story; counts are consistent; private/unavailable story cannot be reacted to.

**Tests:** add appreciation; duplicate request idempotency; remove; count update; unauthenticated request; unavailable story.

### F-13 Saves

**User story:** As a reader, I want to save stories for later.

**Table:** story_saves (user_id, story_id, created_at), unique user/story.

**API:** `PUT /api/stories/:storyId/save`, `DELETE /api/stories/:storyId/save`, `GET /api/me/saved-stories`.

**Acceptance criteria:** user can save/unsave; saved list is private to owner; duplicate saves are idempotent; unavailable stories follow defined visibility behaviour.

**Tests:** save; duplicate save; unsave; list saved; cross-user access denied; deleted/retracted story behaviour.

### F-14 Questions and comments

**User story:** As a reader, I want to ask questions and discuss research.

**Proposed table:** story_comments (id, story_id, author_user_id, parent_comment_id nullable, body, status, created_at, updated_at, deleted_at).

**API:**
- `GET /api/stories/:storyId/comments?cursor=...`
- `POST /api/stories/:storyId/comments`
- `PATCH /api/comments/:commentId`
- `DELETE /api/comments/:commentId` (soft delete or moderation-aware removal)

**Behaviour:**
- Authenticated users can comment on public stories.
- Validate body length and reject empty content.
- Define whether nested replies are supported in first release; simplest MVP is one-level replies or flat comments.
- Users can edit/delete own comments within policy.
- Moderators can hide/remove content with audit trail.
- Escape/render user content safely; do not trust HTML.

**Acceptance criteria:** valid comment persists; empty/oversized content rejected; user cannot edit another user's comment; moderated content is hidden according to policy; comments are associated with correct story.

**Tests:** create comment; empty body; max length; XSS payload safely rendered; edit own; edit another's denied; delete own; moderation hide; comments on unavailable story.

### F-15 Search

**User story:** As a reader, I want to find stories and researchers by keywords and category.

**API:** `GET /api/search?q=...&type=stories|users&category=...&cursor=...`

**Behaviour:**
- MVP can use database full-text or indexed case-insensitive matching, depending on current database.
- Search only public profiles and published stories.
- Apply length/rate limits.
- Escape query safely and use parameterised queries.
- Advanced semantic search is deferred.

**Acceptance criteria:** matching stories/users can be found; drafts and private fields are excluded; category filter works; empty/too-long query handled; pagination is stable.

**Tests:** title match; summary/body match as supported; username/display name match; category filter; draft exclusion; private profile exclusion; SQL injection string; empty query; max query length; rate limit.

### F-16 Notifications (minimum viable)

**User story:** As a user, I want to know when someone interacts with my story or responds to me.

**Proposed table:** notifications (id, recipient_user_id, actor_user_id nullable, type, entity_type, entity_id, read_at, created_at).

**API:** `GET /api/me/notifications`, `POST /api/me/notifications/:id/read`, optionally bulk-read endpoint.

**Behaviour:** generate only supported high-value notification types; do not notify a user about their own action; enforce recipient ownership; avoid duplicate notification storms.

**Acceptance criteria:** supported event creates notification; only recipient can read/mark read; read state persists; notification links to a valid entity.

**Tests:** notification creation; self-action suppression; recipient isolation; mark read; invalid ID; deleted entity handling.

If notifications would threaten MVP delivery, release a minimal in-app notification list after core publishing/discovery and document the temporary deferral.

### F-17 Reporting and moderation

**User story:** As a member, I want to report content; as a moderator, I want to review and act on reports.

**Tables:**
- content_reports (id, reporter_user_id, target_type, target_id, reason_code, details, status, created_at, reviewed_at, reviewer_user_id)
- moderation_actions (id, moderator_user_id, target_type, target_id, action, reason, created_at)

**API:**
- `POST /api/reports`
- `GET /api/admin/reports`
- `POST /api/admin/reports/:reportId/actions`

**Behaviour:**
- Require authentication for reporting in MVP.
- Validate target and reason.
- Prevent duplicate report spam where appropriate.
- Admin endpoints require moderator/admin permission.
- Record moderation actions and reasons.
- Do not reveal reporter identity to reported users by default.
- Define urgent handling and escalation for safety/legal issues.

**Acceptance criteria:** report is recorded; unauthorised users cannot access moderation queue; moderator action is audited; reported content visibility follows the chosen action.

**Tests:** create valid report; invalid target; duplicate/rate limit; non-moderator queue access denied; moderator action; audit record; reporter identity not exposed.

### F-18 Corrections, archive and retraction

**User story:** As a publisher, I want to correct or retract a story responsibly.

**Behaviour:**
- Published story edits that materially change research claims should create a revision/audit record.
- Archive removes story from normal discovery while retaining required history.
- Retraction requires a reason and timestamp and displays a clear label.
- Do not silently rewrite a retracted story as though it remains valid.
- Define whether retracted story content remains visible with warning or is restricted; default recommendation is visible metadata/status and explanation, with content visibility controlled by policy/moderation.

**API:** `POST /api/stories/:id/corrections`, `POST /api/stories/:id/archive`, `POST /api/stories/:id/retract`.

**Acceptance criteria:** correction is recorded; archive is distinct from retraction; retraction reason/status visible; unauthorised user cannot change status; history is preserved.

**Tests:** correction record; archive; retract; missing reason; non-owner retract; retracted story feed/detail behaviour; audit history.

### F-19 Administration and audit

**User story:** As an administrator, I want authorised tools to manage platform safety and inspect important changes.

**Behaviour:**
- Separate admin/moderator permissions from ordinary user roles.
- Record privileged actions.
- Avoid logging passwords, session secrets or unnecessary personal data.
- Provide minimal admin workflows required for beta.

**Tests:** role escalation denied; admin endpoint protected; audit record created; sensitive values absent from logs.

### F-20 Analytics and operational readiness

**Events to consider:** registration_completed, login_completed, profile_completed, interest_selected, story_draft_created, story_published, media_upload_started/completed/failed, story_viewed, story_saved, appreciation_added, comment_created, researcher_followed, report_submitted.

**Rules:**
- Define event names and properties centrally.
- Avoid collecting sensitive research content in analytics payloads.
- Do not count automated/bot activity as meaningful engagement where detectable.
- Provide error monitoring, backup checks and release health indicators.

**Tests:** event emitted on expected action; event not emitted on failed action; payload excludes secrets; duplicate event handling is understood; backup restoration procedure is tested.

## 5. Proposed relational data model

The following is a logical starting point, not a command to replace existing tables. Inspect the current schema and map existing equivalents before creating migrations.

### Core tables

**users**
- id (PK)
- display_name
- username (unique, normalised)
- email (unique, normalised)
- password_hash
- role (member/moderator/admin; protect from self-assignment)
- account_status
- created_at, updated_at

**profiles**
- user_id (PK/FK users)
- bio
- avatar_media_id nullable
- institution
- department
- position
- country_code
- website_url
- orcid_url
- verification_status (unverified/pending/verified/rejected)
- created_at, updated_at

**research_categories**
- id
- name
- slug (unique)
- parent_id nullable
- description
- is_active
- sort_order

**user_interests**
- user_id (FK)
- category_id (FK)
- created_at
- composite unique(user_id, category_id)

**stories**
- id
- author_user_id (FK users)
- title
- slug nullable
- summary
- body
- format (text/video/image_slides)
- status (draft/published/archived/retracted)
- research_status
- primary_category_id (FK)
- research_question nullable
- approach nullable
- findings nullable
- significance nullable
- authorship_attested_at nullable
- authorship_policy_version nullable
- published_at nullable
- archived_at nullable
- retracted_at nullable
- retraction_reason nullable
- created_at, updated_at

**story_categories** (optional if multi-category)
- story_id
- category_id
- composite unique(story_id, category_id)

**story_contributors**
- id
- story_id
- profile_user_id nullable
- display_name
- contributor_order
- role nullable
- created_at

**story_sources**
- id
- story_id
- source_type
- title nullable
- doi nullable
- url nullable
- publisher_or_journal nullable
- publication_date nullable
- author_confirmed boolean
- confirmed_at nullable
- created_at

**media_assets**
- id
- owner_user_id
- storage_key (unique)
- media_type (image/video)
- mime_type
- file_size_bytes
- duration_seconds nullable
- width nullable
- height nullable
- processing_status
- created_at
- deleted_at nullable

**story_media**
- story_id
- media_asset_id
- display_order
- role (video/slide/thumbnail)
- composite unique(story_id, media_asset_id)

**user_follows**
- follower_user_id
- followed_user_id
- created_at
- composite unique(follower_user_id, followed_user_id)
- check follower != followed

**topic_follows**
- user_id
- category_id
- created_at
- composite unique(user_id, category_id)

**story_reactions**
- user_id
- story_id
- reaction_type
- created_at
- composite unique(user_id, story_id) for single appreciation

**story_saves**
- user_id
- story_id
- created_at
- composite unique(user_id, story_id)

**story_comments**
- id
- story_id
- author_user_id
- parent_comment_id nullable
- body
- status
- created_at, updated_at, deleted_at nullable

**notifications**
- id
- recipient_user_id
- actor_user_id nullable
- type
- entity_type
- entity_id
- read_at nullable
- created_at

**content_reports**
- id
- reporter_user_id
- target_type
- target_id
- reason_code
- details nullable
- status
- created_at
- reviewed_at nullable
- reviewer_user_id nullable

**moderation_actions**
- id
- moderator_user_id
- target_type
- target_id
- action
- reason
- created_at

**story_revisions**
- id
- story_id
- editor_user_id
- revision_number
- snapshot or change representation
- change_summary nullable
- created_at

**audit_events**
- id
- actor_user_id nullable
- action
- entity_type
- entity_id
- metadata_json (allow-listed, no secrets)
- created_at

### Database constraints and indexes

- Unique normalised username and email.
- Foreign keys for all owned entities.
- Unique composite constraints for follows, saves and appreciation.
- Index stories(status, published_at), stories(primary_category_id, published_at), stories(author_user_id, created_at).
- Index comments(story_id, created_at).
- Index notifications(recipient_user_id, created_at, read_at).
- Index reports(status, created_at).
- Index media_assets(owner_user_id, processing_status).
- Use transactions for story publication and related contributor/source/media association.
- Use database-level constraints as well as application validation.
- Define cascade/restrict/soft-delete behaviour deliberately; avoid accidental deletion of audit history.

## 6. API conventions

Adapt paths and naming to the current API rather than creating duplicate endpoints.

### General
- JSON request/response unless uploading binary content.
- Consistent error shape, e.g. `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }`.
- Use correct HTTP status codes.
- Validate all input server-side.
- Use parameterised database queries/ORM-safe operations.
- Add pagination to collection endpoints.
- Apply rate limits to authentication, search, comments, uploads and reporting.
- Do not expose internal stack traces or secrets.
- Enforce ownership and roles in service/API layer.

### Suggested endpoint inventory

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| POST | `/api/auth/register` | No | Register |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/auth/me` | Optional | Current user |
| GET | `/api/me/profile` | Yes | Own profile |
| PATCH | `/api/me/profile` | Yes | Update own profile |
| GET | `/api/users/:username` | No | Public profile |
| GET | `/api/research-categories` | No | List taxonomy |
| PUT | `/api/me/interests` | Yes | Set interests |
| POST | `/api/stories` | Yes | Create draft |
| GET | `/api/stories/:id` | Conditional | Read story |
| PATCH | `/api/stories/:id` | Owner/admin | Update story |
| POST | `/api/stories/:id/publish` | Owner | Publish |
| POST | `/api/stories/:id/archive` | Owner/admin | Archive |
| POST | `/api/stories/:id/retract` | Owner/admin | Retract |
| GET | `/api/feed` | Optional | Public discovery feed |
| GET | `/api/search` | Optional | Search public stories/users |
| POST | `/api/media/upload-intents` | Yes | Start upload |
| POST | `/api/media/:id/complete` | Yes | Complete upload |
| PUT | `/api/users/:id/follow` | Yes | Follow user |
| DELETE | `/api/users/:id/follow` | Yes | Unfollow |
| PUT | `/api/stories/:id/appreciation` | Yes | Appreciate |
| DELETE | `/api/stories/:id/appreciation` | Yes | Remove appreciation |
| PUT | `/api/stories/:id/save` | Yes | Save |
| DELETE | `/api/stories/:id/save` | Yes | Unsave |
| GET | `/api/me/saved-stories` | Yes | List saves |
| GET | `/api/stories/:id/comments` | Optional | List discussion |
| POST | `/api/stories/:id/comments` | Yes | Comment/question |
| POST | `/api/reports` | Yes | Report |
| GET | `/api/me/notifications` | Yes | List notifications |
| GET | `/api/admin/reports` | Moderator | Moderation queue |
| POST | `/api/admin/reports/:id/actions` | Moderator | Moderation action |

## 7. Cross-cutting security and privacy checks

- Authentication and authorisation are enforced server-side.
- No user can set their own role or verification status.
- Draft story endpoints verify ownership.
- Draft media objects are private.
- File uploads validate actual file signatures and limits.
- Use safe random storage keys and short-lived signed upload URLs if applicable.
- Prevent XSS by safely rendering user-generated text; do not render arbitrary HTML.
- Prevent SQL injection through parameterised queries.
- Protect cookie-authenticated state-changing endpoints against CSRF as appropriate.
- Rate-limit abuse-prone endpoints.
- Keep secrets and sensitive data out of logs and analytics.
- Restrict admin actions and audit them.
- Ensure public APIs omit private profile fields and private drafts.
- Define backup retention and test restoration.
- Define data export/deletion obligations before public launch.

## 8. Test strategy

### Unit tests
- Validators and normalisers.
- Permission rules.
- Story publication rules.
- Content status transitions.
- Media type/size/duration validation.
- Feed filtering and ordering.
- Contributor attestation logic.

### Integration tests
- Auth routes with database.
- Profile ownership.
- Story draft/publish lifecycle.
- Media association and access control.
- Feed and search visibility.
- Follows, reactions and saves.
- Comments and notifications.
- Reports and moderation actions.
- Correction/retraction audit history.

### End-to-end tests
1. Register → login → complete profile.
2. Select research interests.
3. Create a text draft → publish → view in feed.
4. Create a video story → upload → publish → play.
5. Create an image-slide story → reorder slides → publish.
6. Reader follows author → saves story → appreciates → comments.
7. Draft remains private to its owner.
8. User reports content → moderator reviews → action recorded.
9. Publisher corrects or retracts story → status is visible.
10. Logout → protected routes and APIs reject unauthenticated access.

### Non-functional tests
- Keyboard navigation and basic accessibility.
- Responsive layout at mobile/tablet/desktop widths.
- Upload size and duration boundaries.
- Feed pagination under concurrent publication.
- Basic load/performance test for feed and media.
- Backup restoration rehearsal.
- Dependency and security scanning.
- Production cookie/security-header verification.

## 9. MVP release gates

### Gate A — Functional completeness
- All P0 journeys work end-to-end.
- No known critical/blocking defects.
- Tests cover permissions and privacy boundaries.

### Gate B — Trust and safety
- Draft privacy verified.
- Contributor attestation recorded.
- Source/status labels implemented.
- Reporting/moderation workflow usable.
- Correction/retraction behaviour documented and tested.

### Gate C — Operational readiness
- Production secrets configured outside source control.
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

This specification is a target contract. The repository audit determines the safe implementation sequence.
