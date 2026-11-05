# Citeface Publishing Data Model

**Document type:** Logical data model and architecture specification  
**Version:** 3.0  
**Last updated:** 2026-11-04  
**Status:** Proposed logical model — implementation must be verified against the actual Prisma schema and migrations  
**Primary database:** PostgreSQL  
**Media storage:** S3-compatible object storage or an appropriate managed media service

---

## 1. Purpose

This document defines the logical data model for Citeface publishing and its related research-social features.

It establishes how Citeface should represent:

- User accounts and researcher profiles.
- Research posts and their publication states.
- Private saved drafts.
- Video and image media assets.
- Topics and research disciplines.
- Researchers and topic-following relationships.
- Reactions, comments and saved posts.
- Research contributors and source references.
- Verification records.
- Corrections, retractions and archival.
- Moderation, rights complaints and audit history.

This is a logical architecture specification, not a finalized Prisma schema.

---

## 2. Core architecture principles

1. PostgreSQL is the primary relational database for structured application data.
2. Media binaries are stored in object storage, not directly in PostgreSQL.
3. PostgreSQL stores media metadata and references to storage objects.
4. All audience and ownership authorization is enforced server-side.
5. Publication state and media-processing state are separate.
6. Research content types are explicit and validated.
7. DOI and original-source URLs are optional.
8. A DOI does not establish peer review or scientific validity.
9. Citeface posts are not automatically scientific publications.
10. The initial product uses a modular monolith, not premature microservices.
11. Private saved drafts are included in the first MVP.
12. Unpublished research content and media must remain private.
13. Important publishing, moderation, correction, retraction and archival actions must be auditable.
14. External AI processing of unpublished or confidential research requires an appropriate explicit permission framework and reviewed privacy/security basis.

---

## 3. Core entities

### 3.1 User

Represents an authenticated Citeface account.

Proposed fields:

- id
- email
- passwordHash or externalIdentity reference
- accountStatus
- createdAt
- updatedAt

Requirements:

- Email must be unique.
- Authentication credentials must be securely handled.
- Account status must support appropriate access restrictions.
- Password hashes must never be returned through API responses.

### 3.2 ResearcherProfile

Represents the public-facing researcher identity associated with a user.

Proposed fields:

- id
- userId
- displayName
- username
- biography
- institution
- location
- researchInterests
- expertise
- optional ORCID
- createdAt
- updatedAt

Requirements:

- A user may have one primary researcher profile.
- User-provided information must be distinguishable from platform-verified information.
- Optional researcher verification must not be confused with scientific validation.

### 3.3 ResearchPost

Represents a research-related post published or prepared on Citeface.

Proposed fields:

- id
- authorId
- contentType
- title
- body
- audience
- publicationState
- sourceUrl (optional)
- doi (optional)
- publicationStatus (optional)
- createdAt
- updatedAt
- publishedAt (nullable)
- archivedAt (nullable)
- retractedAt (nullable)
- moderationState (NONE, HIDDEN, REMOVED; default NONE)
- rightsConfirmedAt (nullable, server-generated)
- rightsPolicyVersion (nullable)
- currentContributorListVersionId (nullable)

Supported content types:

- STORY
- VIDEO
- PHOTO
- PAPER
- METHODS

Supported publication states:

- DRAFT
- PUBLISHED
- ARCHIVED
- RETRACTED

ARCHIVED is an author action that removes a post from normal discovery while retaining history. RETRACTED is a distinct, visible status and is never an ordinary deletion. REMOVED is not a publication state: platform moderation hiding or removal is a separate moderationState field (NONE, HIDDEN, REMOVED) so it cannot be confused with archival or retraction (see ADR-0002).

Audience must be a required publication property with the following supported values:

- PUBLIC
- MEMBERS
- FOLLOWERS

The audience field must default to PUBLIC for every new post.

The selected audience must be persisted with the ResearchPost record. It must not be inferred from frontend settings or user-interface state.

A draft may store its intended publication audience, but that audience must not grant anyone other than its author access to the draft.

The server must validate the audience value before publication. Invalid or unsupported audience values must be rejected.

Requirements:

- Every post has an authenticated author.
- DRAFT posts are private and accessible only to their authors.
- DRAFT posts must never appear in public feeds, researcher profiles, public search results or discovery endpoints.
- The author must be authorized to retrieve, update, delete or publish a draft.
- The backend must enforce ownership on every draft operation.
- A draft may be incomplete.
- Required publication fields are validated before publishing, not necessarily when saving an incomplete draft.
- Only PUBLISHED posts may enter public or audience-authorized discovery systems.
- PUBLISHED posts must obey their selected audience.
- ARCHIVED posts, and posts whose moderationState is HIDDEN or REMOVED, must not appear in ordinary discovery.
- Archived posts retain appropriate audit history.
- A published post must have a valid publication timestamp.
- DOI and source URL remain nullable.
- Every new post defaults to the PUBLIC audience.
- Published posts support PUBLIC, MEMBERS and FOLLOWERS audiences.
- PUBLIC posts are accessible to everyone, including signed-out visitors.
- MEMBERS posts are accessible only to authenticated Citeface users.
- FOLLOWERS posts are accessible only to authenticated users who follow the post's author.
- Authors may change the audience before publication and may change the audience of their published posts.
- Audience changes must be validated server-side, enforced immediately and recorded in the audit history.
- The author retains access to their own published posts.
- Draft privacy is independent of the intended publication audience.

### 3.4 MediaAsset

Represents an uploaded or processed media file.

Proposed fields:

- id
- ownerId
- storageProvider
- storageKey
- mediaType
- mimeType
- fileSizeBytes
- durationSeconds (nullable)
- width (nullable)
- height (nullable)
- uploadState
- checksum
- createdAt
- updatedAt

Supported media types:

- VIDEO
- IMAGE

Suggested upload states:

- PENDING_UPLOAD
- UPLOADING
- PROCESSING
- READY
- FAILED

Requirements:

- Media binaries are stored in object storage.
- Storage credentials and private storage keys must not be exposed to unauthorized clients.
- Draft media remains private.
- Media ownership and post access must be checked server-side.
- Only READY media may be used to complete publication of a post that requires that media.
- Video duration must be checked using trusted server-side or media-provider metadata.
- Valid video duration is 90-300 seconds inclusive.
- File type, size, integrity and safety must be validated.
- Failed uploads must produce actionable error states.
- Media associated with unpublished drafts must remain private to the draft author.
- Access to media associated with published posts must follow the parent post's current audience permissions.
- Private media must not be exposed through permanent public URLs or unprotected storage objects.
- Media delivery must perform appropriate server-side authorization before providing access.
- Audience changes must also affect associated media access immediately.
- Media caches and delivery mechanisms must not preserve access after a user's authorization has been revoked.

### 3.5 PostMedia

Associates media assets with research posts.

Proposed fields:

- id
- postId
- mediaAssetId
- position
- createdAt

Requirements:

- A post may have multiple images.
- Image ordering must be preserved.
- Media attached to a draft must not become publicly accessible because of the association.
- Authorization must follow the parent post's visibility and ownership rules.
- A video post must use valid video media.
- A photo post must use valid image media.
- Access to a media asset must be authorized using the parent ResearchPost's current publication state and audience.
- A media asset attached to a DRAFT must remain accessible only to the draft's author.
- Changing the parent post's audience must immediately update authorization for all associated media.
- A PostMedia association must never independently grant public access to an asset.

### 3.6 Topic

Represents a research subject or discipline used for discovery.

Proposed fields:

- id
- name
- slug
- description
- parentTopicId (optional)
- createdAt
- updatedAt

Requirements:

- Topic names and slugs must be managed consistently.
- A hierarchical taxonomy may be introduced where justified.
- Topics should support multidisciplinary research discovery.

### 3.7 PostTopic

Associates research posts with topics.

Proposed fields:

- postId
- topicId
- createdAt

Requirements:

- A post may belong to multiple topics.
- Duplicate post-topic associations must be prevented.
- Draft topic associations remain private with the draft.

---

## 4. Social and engagement entities

These entities support the research-social experience.

### 4.1 UserFollow

Represents a researcher following another researcher.

Proposed fields:

- id
- followerId
- followedUserId
- createdAt

Requirements:

- Prevent duplicate follow relationships.
- Prevent users from following themselves.
- Follow relationships must support discovery and personalized feeds.
- FOLLOWERS audience authorization must use the authenticated user's current active follow relationship with the post's author.
- Unfollowing an author must immediately revoke access to that author's FOLLOWERS posts.
- Follow relationships must be checked server-side and must not be trusted solely from cached frontend state.

### 4.2 TopicFollow

Represents a user following a research topic.

Proposed fields:

- id
- userId
- topicId
- createdAt

### 4.3 Reaction

Represents appreciation or another supported reaction to a published post.

Proposed fields:

- id
- userId
- postId
- reactionType
- createdAt

Requirements:

- A user must not create duplicate reactions of the same permitted type for the same post.
- Reaction counts must not imply scientific validity.
- Reactions must respect post visibility and access permissions.

### 4.4 Comment

Represents discussion or questions attached to a published research post.

Proposed fields:

- id
- postId
- authorId
- parentCommentId (optional)
- body
- status
- createdAt
- updatedAt

Requirements:

- Comments must respect parent-post visibility.
- Deleted or moderated comments must have appropriate handling.
- Comment creation must be authorized.
- Comments on private drafts are not part of the initial MVP.

### 4.5 SavedPost

Represents a user's saved published post.

Proposed fields:

- id
- userId
- postId
- createdAt

Requirements:

- Users can save and unsave eligible published posts.
- Users can access their own saved-post collection.
- Saved posts must respect current access permissions.

---

## 5. Research authorship and provenance

### 5.1 Contributors, authorship attestation and rights confirmation

Contributor lists are versioned so that an attestation always refers to the exact list the publisher approved. Table names are logical; map them to the actual Prisma schema.

**ContributorListVersion**

- id
- postId
- versionNumber
- createdByUserId
- createdAt

**PostContributor**

- id
- contributorListVersionId
- displayName
- role
- position (unique within a contributor-list version)
- affiliation (optional)
- profileUserId (optional)
- createdAt

**AuthorshipAttestation** (append-only)

- id
- postId
- publisherUserId (server-set)
- contributorListVersionId
- attestedAt (server-generated)
- policyVersion

**RightsConfirmation** (append-only; may share a UI step with the attestation)

- id
- postId
- publisherUserId (server-set)
- confirmedAt (server-generated)
- policyVersion

Requirements:

- At least one contributor is required before publication.
- Contributor order is preserved and unique within a version.
- The publishing user attests that they are authorized to submit the story and list the named contributors. This is not individual co-author approval, which is deferred from the initial MVP.
- The server, not the client, sets the publisher, timestamp and policy version.
- Changing a published post's contributor list creates a new version, requires renewed attestation and is recorded as an AuditEvent. Earlier versions and attestations are never altered or deleted.
- Contributor information must be clearly distinguishable from verified identity.
- The publishing user confirms they hold the rights and permissions for submitted material; the confirmation is recorded separately from the attestation.

### 5.2 ResearchWorkReference

Represents an external research work or source linked to a post.

Proposed fields:

- id
- postId
- referenceType
- doi (optional)
- url (optional)
- title (optional)
- publicationDate (optional)
- sourceMetadata (optional)
- confirmationStatus
- createdAt
- updatedAt

Requirements:

- DOI or URL metadata may be imported.
- The author must confirm imported metadata before publication.
- Imported metadata must not automatically be treated as verified.
- Source information must not imply scientific validity.
- Source details are visible only to users authorized to view the parent post and must not leak restricted post information.

### 5.3 AffiliationRecord

Represents a researcher's institutional affiliation.

Proposed fields:

- id
- userId
- institutionName
- department (optional)
- role (optional)
- verificationStatus
- createdAt
- updatedAt

Requirements:

- User-provided affiliations must be distinguishable from verified affiliations.
- Verification evidence and status must be recorded appropriately.

---

## 6. Verification

### 6.1 VerificationRecord

Represents an optional platform verification check.

Proposed fields:

- id
- userId
- verificationType
- status
- evidenceReference
- verifiedBy
- verifiedAt
- expiresAt (optional)
- createdAt
- updatedAt

Requirements:

- Verification must identify what was checked.
- Verification must not imply that a user's research is scientifically valid.
- Verification must not be mandatory for reading or participating in Citeface.

---

## 7. Corrections, retractions and archival

### 7.1 PostCorrection

Represents a correction to an existing Citeface post.

Proposed fields:

- id
- postId
- correctionText
- createdBy
- createdAt
- updatedAt

Requirements:

- Significant corrections must be visible to readers.
- Correction history must be auditable.
- The original publication context must not be silently misrepresented.
- Minor editorial changes may follow a simpler policy, to be specified separately.

### 7.2 RetractionRecord

Represents a visible retraction notice.

Proposed fields:

- id
- postId
- reason
- retractedBy
- retractedAt
- createdAt

Requirements:

- Retraction must be distinct from ordinary removal or archival.
- Retraction notices must remain visible where appropriate.
- Retraction actions must be auditable.
- Retraction of a Citeface post must be distinguished from retraction of an underlying external scientific publication.

### 7.3 AuditEvent

Represents an important platform action.

Proposed fields:

- id
- actorId
- entityType
- entityId
- action
- metadata
- createdAt

Requirements:

- Important publishing, moderation, archival, correction and retraction actions must be recorded.
- Audit records must not be silently altered through ordinary user operations.
- Sensitive information must not be unnecessarily copied into audit metadata.

---

## 8. Trust and safety

### 8.1 PostReport

Represents a user report against a post.

Proposed fields:

- id
- postId
- reporterId
- reason
- details (optional)
- status
- createdAt
- updatedAt

### 8.2 ModerationCase

Represents a moderation workflow.

Proposed fields:

- id
- reportId (optional)
- postId (optional)
- assignedModeratorId (optional)
- status
- resolution
- createdAt
- updatedAt
- resolvedAt (optional)

### 8.3 RightsComplaint

Represents a complaint concerning ownership, licensing, permission or other content rights.

Proposed fields:

- id
- postId
- complainantId
- reason
- evidenceReference (optional)
- status
- createdAt
- updatedAt
- resolvedAt (optional)

Requirements:

- Publishing users must confirm they have appropriate rights or permissions for submitted material.
- Rights complaints must have an actionable review process.
- Takedown and moderation actions must be auditable.

---

## 9. Future AI processing permissions

### 9.1 AIProcessingPermission

Potential future entity for recording user permissions for external AI processing.

Proposed fields:

- id
- userId
- processingPurpose
- provider
- permissionStatus
- grantedAt
- revokedAt (optional)
- createdAt
- updatedAt

This is not a commitment to include external AI processing in the first MVP.

Unpublished or confidential research must not be sent to external AI providers without an explicit permission framework and reviewed privacy/security basis.

---

## 10. Relationships

- User has one primary ResearcherProfile.
- User has many ResearchPosts.
- User has many MediaAssets.
- ResearchPost has many PostMedia records.
- MediaAsset may be associated with posts through PostMedia.
- ResearchPost has many PostTopic records.
- Topic has many PostTopic records.
- User has many UserFollow relationships as follower and followed user.
- User has many TopicFollow relationships.
- User has many Reactions.
- User has many Comments.
- User has many SavedPost records.
- ResearchPost has many ContributorListVersion records; each version has many PostContributor records.
- ResearchPost has many AuthorshipAttestation and RightsConfirmation records; each attestation references one ContributorListVersion.
- ResearchPost has many ResearchWorkReference records.
- User may have multiple AffiliationRecords.
- User may have multiple VerificationRecords.
- ResearchPost may have many PostCorrection records.
- ResearchPost may have a RetractionRecord.
- Important actions generate AuditEvent records.
- ResearchPost may have PostReport, ModerationCase and RightsComplaint records.

---

## 11. Data integrity and authorization constraints

### 11.1 Draft privacy

- A DRAFT post is private to its author.
- Only the author may retrieve, update, delete or publish their unpublished drafts.
- No other user or privileged system role may access draft content through ordinary application access paths.
- All draft read, update, delete and publish operations require server-side ownership authorization.
- Unauthorized users must not be able to infer draft existence, contents or sensitive metadata.
- Drafts must be excluded from public feeds, profiles, search, recommendations and discovery queries.
- Draft media must remain private and accessible only to the draft author.
- Draft privacy must remain independent of the intended publication audience.
- Frontend route protection alone is insufficient.
- Draft privacy must be enforced across APIs, database queries, object storage, media delivery, notifications, caches and other relevant access paths.

### 11.2 Draft persistence

- Drafts must persist across authenticated sessions and devices.
- Draft creation and updates must be associated with the authenticated author.
- Drafts may be incomplete.
- Draft updates must not accidentally change ownership.
- Deleting a draft must handle associated media and metadata safely.
- Orphaned media cleanup must not delete media still referenced by another valid post.

### 11.3 Publication validation

Before a draft transitions to PUBLISHED, the backend must validate:

- Authenticated author and ownership.
- Required title and content fields for the selected content type.
- Valid content type.
- Valid audience selection.
- At least one contributor, and a valid server-generated authorship attestation bound to the current contributor-list version.
- DOI and source confirmation where provided.
- Media type and media readiness.
- Video duration of 90–300 seconds inclusive.
- Applicable rights and permissions confirmations.
- All other required publication rules.
- Audience is one of PUBLIC, MEMBERS or FOLLOWERS.
- PUBLIC is the default audience for every new post.
- The selected audience is stored with the post.
- The author has permission to publish the draft.
- Required media is authorized, valid and READY.

Publishing must be an authorized, validated operation.

### 11.4 Publication and media state separation

Publication states:

- DRAFT
- PUBLISHED
- ARCHIVED
- RETRACTED

Media upload states:

- PENDING_UPLOAD
- UPLOADING
- PROCESSING
- READY
- FAILED

A DRAFT may have media in any valid technical upload state.

A post requiring media must not be published until all required media is READY and passes validation.

### 11.5 General constraints

- Every post has a valid author.
- Every published post has a valid audience.
- DOI and source URL may be null.
- VIDEO posts require valid video media.
- PHOTO posts require valid image media.
- Unique constraints must prevent duplicate relationships where appropriate.
- Foreign keys must preserve referential integrity.
- API authorization must be applied to every read and write path.
- Database queries must avoid exposing private content through joins, counts, aggregations or search indexes.
- Storage keys and credentials must not act as publicly exposed authorization tokens.
- The audience field must use a controlled enum or equivalent database constraint.
- The default audience for new posts must be PUBLIC.
- Every PUBLISHED post must have a valid audience.
- DRAFT access must always be restricted to the author, regardless of the audience field.
- PUBLIC access must not require authentication.
- MEMBERS access requires an authenticated Citeface account.
- FOLLOWERS access requires authentication and an active UserFollow relationship with the author.
- Authors must retain access to their own published posts.
- Audience authorization must be applied consistently across all retrieval and media-delivery paths.
- Audience changes must be recorded as AuditEvent records, including the actor, affected post, previous audience, new audience and timestamp.
- Audience changes must immediately affect feeds, profiles, search, recommendations, direct access, APIs, notifications, media delivery and caches.
- Restricted content must not leak through database joins, aggregations, search indexes, previews or cached responses.
- publicationState, mediaUploadState and moderationState are separate fields and must not be overloaded.
- AuthorshipAttestation, RightsConfirmation and historical ContributorListVersion records are immutable.
- Comments, reactions, saves, notification previews and shared-link previews must re-check the viewer's current access to the parent post.

---

## 12. Publication lifecycle

The intended first-MVP publication lifecycle is:

1. An authenticated author creates a research post.
2. The author may save it as a private DRAFT.
3. The author may reopen and update the DRAFT.
4. Associated media may be uploaded or processed independently.
5. The author requests publication.
6. The server checks ownership and validates all required publication rules.
7. The server confirms all required media is READY.
8. The server records the publication event and changes the post state to PUBLISHED.
9. The post becomes available only to its selected audience.

A draft must never become publicly accessible merely because its media upload has completed.

A failed publication attempt must preserve the draft and provide an actionable error wherever possible.

---

## 13. Decisions still requiring specification

The following technical details remain open and must be resolved before the relevant functionality is implemented:

1. Whether private researcher accounts are supported.
2. Maximum number of videos per post.
3. Image count and file-size limits.
4. Accepted media formats and transcoding requirements.
5. Publication-status vocabulary and who may assert each status.
6. Required bibliographic fields for paper announcements.
7. Exact correction and retraction workflow.
8. Draft deletion and media-retention policy.
9. Draft autosave behaviour and conflict handling across multiple sessions.
10. Draft expiration or retention policy, if any.
11. What viewers see for a retracted post, and who besides the author may retract.
12. Treatment of posts whose author account is suspended or deleted.
13. Retention and deletion of archived and retracted posts and their media.
14. Unauthorized-response convention (404 versus 401) and saved-list behaviour after access is revoked.

Items 11 to 14 remain open; the lifecycle vocabulary is approved in ADR-0002.

The audience options and access semantics are already decided in ADR-0001 and must not be reopened during implementation without an explicit product decision.

Drafts are accessible only to their authors. Additional privileged draft-access roles are not part of the approved MVP policy.

---

## 14. Recommended implementation sequence

1. Confirm the actual PostgreSQL and Prisma configuration.
2. Finalize the logical schema and database constraints.
3. Implement private draft creation, retrieval, update and deletion.
4. Implement server-side draft ownership and authorization tests.
5. Implement media upload and private media access.
6. Implement publication validation and the DRAFT-to-PUBLISHED transition.
7. Implement publishing and audience enforcement.
8. Implement feed and discovery queries that exclude drafts.
9. Implement social engagement and provenance relationships.
10. Implement correction, retraction, archival and audit capabilities.
11. Verify all critical authorization and privacy requirements.

Implementation must follow the actual repository audit and agreed MVP specification.

---

## 15. Final architecture position

Citeface will use PostgreSQL as its primary relational database and object storage for media binaries.

The first MVP supports private saved drafts, direct publication, research content attribution, audience-controlled publishing and a video-first research discovery experience.

Publication state, media-processing state and content integrity status must remain distinct.

Privacy and server-side authorization are mandatory for drafts, media and published content.

The architecture should remain modular, testable and maintainable without introducing unnecessary infrastructure or premature microservices.