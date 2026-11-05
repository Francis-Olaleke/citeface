# Citeface Publishing Acceptance Criteria

**Document status:** Product acceptance criteria  
**Version:** 2.1  
**Last updated:** 4 November 2026  
**Product:** Citeface

---

## 1. Purpose

This document defines the acceptance criteria for Citeface publishing functionality.

It establishes the conditions that must be satisfied before publishing features can be considered complete and ready for release.

The criteria cover:
- Content creation.
- Five supported content types.
- Private saved drafts.
- Publication and audience control.
- Media uploads and processing.
- Authorship and research provenance.
- Published-content management.
- Corrections and retractions.
- Reporting and moderation.
- Security, privacy, and reliability.

## 2. Priority definitions

| Priority | Meaning |
|---|---|
| P0 | Required for the first MVP release |
| P1 | Important follow-up |
| P2 | Later enhancement |
| Out of scope | Not required for the initial MVP |

## 3. Content type acceptance criteria

### PUB-AC-001 — Supported content types

**Priority:** P0

**Given** an authenticated user opens the publishing interface,

**When** the user selects a content type,

**Then** the system must support:
- STORY
- VIDEO
- PHOTO
- PAPER
- METHODS

**Verification:**
- Confirm all five types are available.
- Confirm the selected type is stored correctly.
- Confirm the appropriate content fields are displayed.
- Confirm invalid or unsupported content types are rejected by the server.

### PUB-AC-002 — Story publishing

**Priority:** P0

**Given** a user creates a STORY,

**When** the user submits valid required content,

**Then** the system must publish the story successfully.

**Verification:**
- Required title and body validation works.
- Optional source and DOI fields are accepted.
- Topics or disciplines can be associated with the post.
- The authenticated author is correctly recorded.
- Published content displays correctly.

### PUB-AC-003 — Video publishing

**Priority:** P0

**Given** a user selects VIDEO,

**When** the user uploads a valid video,

**Then** the system must validate and process the video before publication.

**Verification:**
- Supported formats are accepted.
- Unsupported formats are rejected.
- Actual video duration is validated using trusted media metadata or processing.
- The minimum duration is 90 seconds.
- The maximum duration is 300 seconds.
- Videos of exactly 90 and 300 seconds are accepted.
- Videos shorter than 90 seconds or longer than 300 seconds are rejected.
- Processing failure prevents publication.
- Successful videos are playable after publication.

### PUB-AC-004 — Image publishing

**Priority:** P0

**Given** a user selects PHOTO,

**When** the user uploads valid research images,

**Then** the system must validate and associate those images with the post.

**Verification:**
- Supported image formats are accepted.
- Unsupported formats are rejected.
- File-size limits are enforced.
- File integrity is checked.
- The configured maximum image count is enforced.
- Images display correctly on mobile and desktop.
- Unpublished images remain private.

### PUB-AC-005 — Paper announcement publishing

**Priority:** P0

**Given** a user selects PAPER,

**When** the user supplies the required paper information,

**Then** the system must publish the announcement with its relevant metadata.

**Verification:**
- Paper title and description are validated.
- DOI is optional.
- External URL is optional.
- Contributor information can be recorded.
- The interface does not imply that a DOI proves peer review or scientific validity.

### PUB-AC-006 — Methods publishing

**Priority:** P0

**Given** a user selects METHODS,

**When** the user supplies valid method information,

**Then** the system must publish the method content.

**Verification:**
- Required title and method description are validated.
- Topics or disciplines can be associated.
- Source or DOI information is optional.
- Author and contributor information is preserved.

## 4. Private saved draft acceptance criteria

### PUB-AC-007 — Create and save a draft

**Priority:** P0

**Given** an authenticated user creates research content,

**When** the user chooses to save it as a draft,

**Then** the system must persist the content as a private unpublished draft.

**Verification:**
- A draft can be saved without publication.
- A draft may be incomplete.
- The draft is associated with the authenticated user.
- The draft receives a unique identifier.
- The draft publication state is DRAFT.
- Saving does not create a public post.
- The draft remains available after the user signs out and signs back in.

### PUB-AC-008 — Retrieve and reopen a draft

**Priority:** P0

**Given** an authenticated user has saved drafts,

**When** the user opens their draft collection,

**Then** the system must return only drafts the user is authorized to access.

**Verification:**
- The owner can retrieve their drafts.
- The owner can reopen a draft.
- Draft content and metadata are restored correctly.
- Drafts persist across sessions and devices.
- Another user cannot retrieve the draft by guessing or changing its identifier.
- Unauthorized direct API requests are rejected.
- Administrators and moderators acting without ownership cannot retrieve or reopen another user's draft.

### PUB-AC-009 — Update a draft

**Priority:** P0

**Given** a user owns a saved draft,

**When** the user changes its content and saves the update,

**Then** the system must persist the changes without publishing the draft.

**Verification:**
- The owner can update the draft.
- Updated fields persist.
- The publication state remains DRAFT.
- Ownership cannot be changed through an ordinary update request.
- Incomplete drafts remain saveable.
- Unauthorized update attempts are rejected.

### PUB-AC-010 — Delete a draft

**Priority:** P0

**Given** a user owns a saved draft,

**When** the user requests deletion,

**Then** the system must remove that draft from normal draft access.

**Verification:**
- The owner can delete the draft.
- Another user cannot delete it.
- Deleted drafts cannot be retrieved through normal draft endpoints.
- Associated media is handled according to the approved cleanup policy.
- Deletion does not accidentally affect another user's media or posts.

### PUB-AC-011 — Publish a saved draft

**Priority:** P0

**Given** a user owns a saved draft,

**When** the user attempts to publish it,

**Then** the system must validate all publication requirements before changing its state to PUBLISHED.

**Verification:**
- Draft ownership is verified server-side.
- Required content fields are complete.
- Content type is valid.
- The author has selected a valid publication audience.
- Public is selected by default for new stories.
- The author can select Public, Citeface Members, or Followers.
- The selected audience is stored with the published post.
- At least one contributor is listed and a valid authorship attestation is recorded.
- Contributor and rights requirements are satisfied.
- Required media is READY.
- Video duration is valid where applicable.
- Successful publication changes the publication state to PUBLISHED.
- Failed validation leaves the draft intact.
- No partially published post is created.
- Repeated publication requests do not create duplicate posts.
- Published content follows its selected audience restrictions.

### PUB-AC-012 — Draft privacy

**Priority:** P0

**Given** a user has an unpublished draft,

**When** another user or an unauthorized service attempts to discover or access it,

**Then** the system must deny access.

**Verification:**
- Drafts do not appear in public feeds.
- Drafts do not appear in member feeds.
- Drafts do not appear on researcher profiles.
- Drafts do not appear in search results.
- Drafts do not appear in recommendations.
- Drafts are excluded from public sharing pages.
- Unauthorized API requests cannot retrieve draft content.
- Draft media cannot be accessed through unauthorized URLs.
- Draft content is not accidentally included in public notifications.
- Server-side authorization is enforced independently of frontend visibility.

### PUB-AC-013 — Draft media failure and recovery

**Priority:** P0

**Given** a user has attached media to a draft,

**When** upload or processing fails,

**Then** the draft must remain available and unpublished.

**Verification:**
- Media failure does not delete the draft.
- The user receives an actionable error.
- The user can retry the upload.
- The user can remove failed media.
- The system does not silently publish the post.
- Media access remains private until publication and authorization.

## 5. Audience and access-control acceptance criteria

### PUB-AC-014 — Audience selection

**Priority:** P0

**Given** an author is preparing a post for publication,

**When** the author selects an audience,

**Then** the system must store the selected audience and enforce its access permissions.

**Verification:**
- The interface provides three audience options: Public, Citeface Members, and Followers.
- Public is selected by default for every new story.
- The author can change the selected audience before publication.
- The server validates the selected audience.
- The selected audience is stored correctly with the post.
- Public content is accessible to everyone, including signed-out visitors.
- Members-only content is accessible only to authenticated Citeface users.
- Followers-only content is accessible only to authenticated users who follow the author.
- The author retains access to their own published content.
- Invalid audience values are rejected by the server.
- Draft privacy remains independent of the selected publication audience.
- Audience changes are recorded in the audit history.

### PUB-AC-015 — Published-content access enforcement

**Priority:** P0

**Given** a published post has an assigned audience,

**When** a user requests the post through any supported access path,

**Then** the server must verify the user's authorization before returning protected content or media.

**Verification:**
- Public stories are accessible without authentication.
- Members-only stories require authentication.
- Followers-only stories require authentication and an active follow relationship with the author.
- Users who do not follow the author cannot access Followers-only stories.
- Users who have unfollowed the author lose access to Followers-only stories.
- Feed access respects the selected audience.
- Profile listings respect the selected audience.
- Search results respect the selected audience.
- Recommendations respect the selected audience.
- Direct post requests respect the selected audience.
- API responses respect the selected audience.
- Notifications do not expose restricted story content to unauthorized users.
- Media delivery respects the selected audience.
- Changing a post identifier does not bypass authorization.
- Unauthorized requests do not reveal restricted content or sensitive metadata.
- Cached responses do not expose restricted content to unauthorized users.
- Source metadata, contributor details and previews respect the selected audience.
- Comments, reactions and saves require current access to the parent story.
- Notification previews and targets are re-authorized at read time.
- Search autocomplete, snippets, counts and facets do not leak restricted stories.
- Shared links and link previews expose no metadata of restricted stories.
- Server-side authorization works independently of frontend visibility controls.

## 6. Authorship and research integrity acceptance criteria

### PUB-AC-016 — Author identity

**Priority:** P0

**Given** an authenticated user publishes a post,

**When** the post is stored,

**Then** the system must associate it with the authenticated author.

**Verification:**
- Author identity is derived from the authenticated session.
- A client cannot assign another user as the author through an ordinary publishing request.
- Published content displays the correct author.
- Unauthorized impersonation attempts are rejected.

### PUB-AC-017 — Contributor information

**Priority:** P0

**Given** an author supplies contributor details,

**When** the post is saved or published,

**Then** the system must preserve contributor names, order, and roles where supplied.

**Verification:**
- Contributor records are associated with the correct post.
- Contributor order is preserved.
- Contributor roles are preserved where supplied.
- The publishing user confirms authority to list contributors.
- At least one contributor is required to publish.
- The attestation is server-generated; the client cannot supply publisher, timestamp or policy version.
- The attestation references the contributor-list version it covers.
- Changing a published list creates a new version, requires renewed attestation and an audit record.
- Earlier versions and attestations remain unchanged.
- Formal co-author approval is not required for the initial MVP.

### PUB-AC-018 — DOI and source metadata

**Priority:** P0

**Given** a user supplies a DOI or external source,

**When** the system stores or displays the information,

**Then** it must distinguish supplied or imported metadata from verified information.

**Verification:**
- DOI may be omitted.
- External URL may be omitted.
- Imported metadata requires author confirmation.
- DOI presence does not automatically mark a post as peer-reviewed.
- The platform does not imply scientific correctness based on a DOI.
- A Citeface post is distinguishable from a formal external publication.

### PUB-AC-019 — Rights and permissions confirmation

**Priority:** P0

**Given** a user is publishing content,

**When** the user submits the publication request,

**Then** the system must require the appropriate rights and permissions confirmation.

**Verification:**
- The confirmation is presented clearly.
- Publication is blocked until required confirmation is supplied.
- The confirmation is recorded.
- The system provides a reporting route for suspected rights violations.
- The confirmation is recorded with a server timestamp and policy version, separately from the authorship attestation.

## 7. Media-processing acceptance criteria

### PUB-AC-020 — Media state management

**Priority:** P0

**Given** media is uploaded,

**When** it moves through the processing lifecycle,

**Then** the system must maintain a distinct technical state for the media asset.

**Verification:**
- PENDING_UPLOAD is represented correctly.
- UPLOADING is represented correctly.
- PROCESSING is represented correctly.
- READY is represented correctly.
- FAILED is represented correctly.
- Media state is separate from the post publication state.
- A draft may contain media in any applicable technical state.
- Required media must be READY before publication.

### PUB-AC-021 — Secure media storage and delivery

**Priority:** P0

**Given** a user uploads media,

**When** the system stores or delivers it,

**Then** the system must enforce the relevant privacy and access rules.

**Verification:**
- Storage credentials are not exposed to clients.
- Unpublished media is private.
- Published media is accessible only according to the post's audience.
- Unauthorized media requests are denied.
- File type and size are validated server-side.
- Media processing failures are handled safely.
- Public media delivery does not expose internal storage infrastructure.

## 8. Published-content management acceptance criteria

### PUB-AC-022 — Edit a published post

**Priority:** P0

**Given** a published post exists,

**When** its author or an authorized system role edits it,

**Then** the system must validate and persist the changes.

**Verification:**
- The author can edit their own post.
- Unauthorized users cannot edit the post.
- Updated content is stored correctly.
- Relevant change history is retained.
- Invalid updates are rejected.
- The author can change the audience of their published post.
- The server validates every audience change.
- Audience changes are recorded in the audit history.
- Changing to a more restrictive audience immediately prevents unauthorized access.
- Changing to a less restrictive audience applies the new access permissions.
- Feeds, profiles, search, direct links, APIs, notifications, and media delivery reflect the updated audience.
- Cached content does not bypass updated access permissions.
- Authorized system roles cannot edit drafts.

### PUB-AC-023 — Remove or archive a published post

**Priority:** P0

**Given** a published post exists,

**When** an authorized user removes or archives it,

**Then** it must be excluded from normal public discovery while appropriate records are retained.

**Verification:**
- Only authorized actors can remove or archive the post.
- The post is removed from normal discovery.
- Appropriate audit history is preserved.
- Removal is distinguishable from retraction.
- Moderation removal is represented separately from author archival and from retraction.
- Unauthorized requests are rejected.

### PUB-AC-024 — Visible corrections

**Priority:** P0

**Given** a published post requires correction,

**When** an authorized actor issues a correction,

**Then** readers must be able to identify that a correction occurred.

**Verification:**
- Correction information is stored.
- The correction is visible to readers.
- Correction date and responsible actor are recorded.
- Relevant historical information is preserved.
- A correction is distinguishable from an ordinary edit.

### PUB-AC-025 — Visible retractions

**Priority:** P0

**Given** a post must be retracted,

**When** an authorized actor records the retraction,

**Then** the system must display a distinct retracted status and preserve appropriate history.

**Verification:**
- Retraction is distinguishable from removal or archiving.
- An explanation or reason can be recorded.
- Retraction history is preserved.
- Readers can identify the retracted status.
- External paper retractions are distinguishable from retractions of Citeface posts.
- External retraction claims require an appropriate source or confirmation.

## 9. Reporting and moderation acceptance criteria

### PUB-AC-026 — Report a post

**Priority:** P0

**Given** a user identifies potentially problematic content,

**When** the user submits a report,

**Then** the system must record the report for authorized review.

**Verification:**
- The report references the correct post.
- The reporting user is recorded.
- A report reason or category is captured.
- Unauthorized users cannot access private report records.
- A report is not automatically treated as proof of wrongdoing.

### PUB-AC-027 — Review a report

**Priority:** P0

**Given** a report exists,

**When** an authorized moderator reviews it,

**Then** the system must permit appropriate moderation action.

**Verification:**
- Only authorized moderators can access moderation records.
- Actions are recorded.
- Unauthorized moderation actions are rejected.
- Sensitive moderation information is not exposed publicly.

### PUB-AC-033 — Draft access by privileged roles

**Priority:** P0

**Given** a user owns a draft,

**When** an administrator or moderator without ownership requests, edits, publishes or deletes it,

**Then** the server must deny the request.

### PUB-AC-034 — Sharing and previews

**Priority:** P0

**Given** a story has an audience,

**When** its link or preview is requested,

**Then** access follows the story's current audience.

**Verification:**
- A public link works for signed-out visitors.
- MEMBERS and FOLLOWERS links are denied to unauthorized users without exposing metadata.
- Previews of restricted stories contain no title, summary, author or media.
- A link stops working for a user after an audience restriction or unfollow.

## 10. Reliability and usability acceptance criteria

### PUB-AC-028 — Preserve user work during errors

**Priority:** P0

**Given** a user is creating or editing content,

**When** a network, server, or media operation fails,

**Then** the system must avoid unnecessary loss of valid user work.

**Verification:**
- Failed requests display understandable errors.
- Failed publication does not destroy the draft.
- Media failure does not destroy the draft.
- Retrying an operation does not create unintended duplicate posts.
- Sensitive internal details are not exposed in error messages.

### PUB-AC-029 — Responsive publishing experience

**Priority:** P0

**Given** a user accesses the publishing experience from a supported device,

**When** the user creates, edits, saves, or publishes content,

**Then** the interface must remain usable and understandable.

**Verification:**
- Forms work on supported desktop browsers.
- Forms work on supported mobile browsers.
- Upload progress and failure messages are understandable.
- Validation messages identify the relevant problem.
- Users can access their saved drafts.
- Media previews display appropriately.

## 11. Security and privacy acceptance criteria

### PUB-AC-030 — Authentication and authorization

**Priority:** P0

**Given** a publishing or draft-management request is received,

**When** the server processes the request,

**Then** it must verify authentication and the required authorization.

**Verification:**
- Unauthenticated users cannot create, edit, delete, or publish private drafts.
- Users cannot modify another user's draft.
- Users cannot publish another user's draft.
- Users cannot edit or remove another user's post without an authorized role.
- Privileged operations require explicit authorization.
- Access control is enforced server-side.

### PUB-AC-031 — Input validation and safe content rendering

**Priority:** P0

**Given** a user submits content,

**When** the server validates and stores it,

**Then** invalid or unsafe input must be handled securely.

**Verification:**
- Required fields are validated server-side.
- Content-type constraints are enforced.
- Input is handled safely.
- Output rendering prevents script injection.
- Database operations use safe parameterized access through the chosen data layer.
- Error messages do not expose internal implementation details.

### PUB-AC-032 — Secrets and sensitive data protection

**Priority:** P0

**Given** publishing or media operations require credentials or sensitive information,

**When** the application processes them,

**Then** secrets and sensitive information must remain protected.

**Verification:**
- Storage credentials are not exposed to the browser.
- Authentication tokens and passwords are not logged.
- Private drafts are not included in public logs or analytics.
- Sensitive moderation records are access-controlled.
- Environment secrets are not committed to source control.

## 12. Testing requirements

The implementation must include automated tests for the relevant acceptance criteria.

At minimum, the test suite should cover:

### 12.1 Unit tests
- Content-type validation.
- Required-field validation.
- Video duration validation.
- Audience validation.
- Default audience assignment.
- Public, Members, and Followers permission evaluation.
- Follow-relationship authorization.
- Audience-change validation.
- Draft-state validation.
- Media-state validation.
- Publication readiness checks.
- Contributor and rights-confirmation validation.
- Video duration boundaries (89, 90, 300 and 301 seconds).
- Central audience policy matrix (draft, author, PUBLIC, MEMBERS, FOLLOWERS, archived, retracted, moderation states).
- Contributor-list versioning and attestation binding.

### 12.2 API and integration tests
- Draft creation.
- Draft retrieval.
- Draft updating.
- Draft deletion.
- Draft publication.
- Draft ownership enforcement.
- Draft privacy.
- Public access without authentication.
- Members-only access with and without authentication.
- Followers-only access for followers and non-followers.
- Access denial after unfollowing an author.
- Audience changes after publication.
- Immediate enforcement of restrictive audience changes.
- Updated access after less restrictive audience changes.
- Audience enforcement across feeds, profiles, search, direct links, APIs, notifications, and media delivery.
- Cache and media authorization after audience changes.
- Media upload and processing failure.
- Published-content editing.
- Removal and archival.
- Corrections and retractions.
- Reporting and moderation authorization.
- Draft access denied to administrator or moderator without ownership.
- Audience-aware sources, comments, reactions and saves.
- Notification preview authorization at read time.
- Search autocomplete, snippet and count leakage.
- Cache invalidation after audience change or unfollow.
- Published contributor update requiring renewed attestation.

### 12.3 End-to-end tests
- Register and authenticate.
- Create and save an incomplete draft.
- Sign out and sign back in.
- Reopen the draft.
- Edit and resave it.
- Attempt unauthorized access from another account.
- Confirm the draft is not visible publicly.
- Complete required fields.
- Publish successfully.
- Confirm Public is selected by default.
- Publish a Public story and confirm signed-out visitors can access it.
- Publish a Members-only story and confirm signed-out visitors cannot access it.
- Confirm authenticated members can access Members-only stories.
- Publish a Followers-only story and confirm an eligible follower can access it.
- Confirm a non-follower cannot access the Followers-only story.
- Confirm access is denied after the user unfollows the author.
- Change a published story's audience and verify that access permissions update.
- Confirm restricted stories do not leak through search, profiles, feeds, notifications, or media URLs.
- Confirm invalid media prevents publication.
- Confirm correction and retraction status is visible.

## 13. MVP release gate

Publishing is ready for the first MVP release only when:

1. All P0 publishing stories have been implemented.
2. All P0 acceptance criteria have been tested.
3. Draft ownership and privacy are enforced server-side.
4. Public, Members, and Followers audience permissions are enforced server-side across all relevant access paths.
5. Public stories are accessible to signed-out visitors.
6. Members-only and Followers-only stories cannot be accessed by unauthorized users.
7. Published-story audience changes are enforced immediately and recorded in audit history.
8. Required media validation works.
9. Failed publication does not destroy drafts.
10. Published-content editing and removal work correctly.
11. Basic visible corrections and retractions work.
12. Reporting and basic moderation authorization work.
13. Security and regression tests pass.
14. The publishing experience works on supported desktop and mobile browsers.
15. No known critical privacy or authorization vulnerability remains.
16. Contributor attestation is versioned and server-generated.

A feature must not be marked complete merely because its interface exists. Its server behaviour, persistence, authorization, failure handling, and tests must also satisfy the applicable criteria.

## 14. Relationship to other Citeface documents

This document must remain consistent with:

- `citeface-product-strategy-requirements-roadmap.md`
- `design-reference-and-product-architecture.md`
- `publishing-specification.md`
- `publishing-user-stories.md`
- `ADR-0001-publishing-rules.md`
- `publishing-data-model.md`
- `citeface-mvp-specification.md`

Changes to accepted product decisions must be reflected across the relevant documentation and decision records.

**Controlling draft decision:** Basic private saved drafts are included in the first Citeface MVP, as accepted on 4 November 2026.