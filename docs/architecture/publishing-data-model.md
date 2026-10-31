# Citeface Publishing — Data Model Implications

**Status:** Proposed logical model; not yet a finalized Prisma schema.

## 1. Design principles

- Keep post identity and publishing metadata separate from large media files.
- Store video and image binaries in object storage, not PostgreSQL.
- Store storage references and media metadata in PostgreSQL.
- Make audience authorization explicit and enforce it on the server.
- Represent content type explicitly.
- Preserve optional source references without requiring a DOI.
- Distinguish technical upload state from publication state.
- Do not add a saved-draft feature to the MVP schema unless the product decision changes.

## 2. Proposed entities

### User
Represents an authenticated account.

Suggested fields:
- `id`
- `email`
- `passwordHash` or external identity reference
- `accountStatus`
- `createdAt`
- `updatedAt`

### ResearcherProfile
Represents the public/professional identity associated with a user.

Suggested fields:
- `id`
- `userId`
- `displayName`
- `biography`
- `institution`
- `location`
- `researchInterests`
- `expertise`
- `orcid` (optional)
- `createdAt`
- `updatedAt`

### ResearchPost
Represents the shared publishing object.

Suggested fields:
- `id`
- `authorId`
- `contentType` — `STORY | VIDEO | PHOTO | PAPER | METHODS`
- `title` (required only for applicable types)
- `body` or `caption`
- `audience` — initial proposal: `PUBLIC | MEMBERS | FOLLOWERS`
- `publicationState` — for example `PENDING_MEDIA | PUBLISHED | REMOVED`
- `sourceUrl` (optional)
- `doi` (optional)
- `publicationStatus` (optional, controlled vocabulary to be defined)
- `createdAt`
- `publishedAt`
- `updatedAt`

The audience list and publication-status vocabulary must be confirmed before schema migration. If audience is required at publication time, it should be non-null for published posts.

### MediaAsset
Represents an uploaded media file and its storage metadata.

Suggested fields:
- `id`
- `ownerId`
- `storageProvider`
- `storageKey`
- `mediaType` — `VIDEO | IMAGE`
- `mimeType`
- `fileSizeBytes`
- `durationSeconds` (video only)
- `width` (optional)
- `height` (optional)
- `uploadState` — `PENDING_UPLOAD | UPLOADING | PROCESSING | READY | FAILED`
- `checksum` (optional)
- `createdAt`
- `updatedAt`

Do not store the raw media binary in this table.

### PostMedia
Associates one or more media assets with a post.

Suggested fields:
- `postId`
- `mediaAssetId`
- `position`
- `createdAt`

This supports multiple images in a photo post and an explicitly defined media attachment relationship. The first MVP may restrict a video post to one primary video asset.

### Topic
Represents a research topic or discipline.

Suggested fields:
- `id`
- `name`
- `slug`
- `description` (optional)

### PostTopic
Join table associating posts and topics.

Suggested fields:
- `postId`
- `topicId`

### PostReport
Represents a report submitted by a user.

Suggested fields:
- `id`
- `postId`
- `reporterId`
- `reason`
- `details` (optional)
- `status`
- `createdAt`
- `reviewedAt` (optional)

### PostCorrection
A proposed follow-up entity for recording corrections without silently overwriting important research context.

Suggested fields:
- `id`
- `postId`
- `authorId`
- `correctionText`
- `createdAt`

This may be introduced after the basic publishing flow if correction workflows are not included in the first implementation milestone.

## 3. Relationships

- One `User` may have one `ResearcherProfile`.
- One `User` may author many `ResearchPost` records.
- One `ResearchPost` may reference zero or more `MediaAsset` records through `PostMedia`.
- One `ResearchPost` may have zero or more topics through `PostTopic`.
- One `ResearchPost` may have zero or more reports.
- One `ResearchPost` may have zero or more correction records over time.

## 4. Important constraints

- Video duration must be between 90 and 300 seconds inclusive, based on trusted metadata.
- Only validated media assets in the `READY` state may be attached to a published media post.
- A post must have a valid author.
- A published post must have an explicit audience.
- `doi` and `sourceUrl` are nullable.
- A `VIDEO` post must have its required video asset before publication.
- A `PHOTO` post must have at least one valid image asset before publication.
- A `STORY`, `PAPER` or `METHODS` post must satisfy its content-type-specific content requirements.
- The API must authorize every post read against the selected audience.
- Media storage keys must not be treated as public authorization tokens.

## 5. No draft status

Do not include a user-facing `DRAFT` state in the initial MVP. Technical upload states belong to `MediaAsset` or an upload-session record. A failed upload is not a saved draft.

## 6. Decisions still required before database implementation

1. Exact audience options and behavior for blocked/private accounts.
2. Whether posts can contain multiple videos or only one.
3. Maximum image count and media file-size limits.
4. Supported image/video formats and whether transcoding is required.
5. Publication-status vocabulary and who can assert each status.
6. Whether paper announcements need structured bibliographic fields beyond title, source URL and optional DOI.
7. Whether editing a post creates version history or updates the existing record.
8. Retention and cleanup rules for abandoned or failed uploads.
