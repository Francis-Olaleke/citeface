# Citeface Publishing User Stories

**Document status:** Product requirements  
**Version:** 2.1  
**Last updated:** 4 November 2026  
**Product:** Citeface

---

## 1. Purpose

This document defines the user stories for creating, saving, editing, publishing, discovering, and managing research content on Citeface.

Citeface is a research social discovery and knowledge-sharing platform.

The publishing experience supports the broader user journey:

**Discover → Understand → Engage → Connect → Return**

The initial publishing experience must support written research stories, short research videos, images, paper announcements, and research methods.

A Citeface post is not automatically a formal scientific publication, peer-reviewed work, or independently validated research result.

## 2. Priority definitions

| Priority | Meaning |
|---|---|
| P0 | Required for the first MVP release |
| P1 | Important follow-up capability |
| P2 | Later enhancement |
| Out of scope | Not planned for the initial MVP |

## 3. Publishing and content creation

### PUB-001 — Select a content type

**Priority:** P0

As an authenticated user, I want to select a research content type so that I can create content using an appropriate publishing experience.

**Acceptance criteria:**
- The system supports STORY, VIDEO, PHOTO, PAPER, and METHODS.
- The selected type determines the relevant fields and media requirements.
- The selected type is stored with the post.
- The user can identify the selected type before saving or publishing.

### PUB-002 — Create a written research story

**Priority:** P0

As a researcher, I want to publish a written research story so that I can communicate research ideas, findings, and explanations.

**Acceptance criteria:**
- The form supports a title and main text.
- The user can add relevant topics or disciplines.
- The user can provide optional source or DOI information.
- Required fields are validated before publication.
- Published content displays its author and relevant research context.

### PUB-003 — Publish a research video

**Priority:** P0

As a researcher, I want to publish a short research video so that I can explain findings, demonstrate methods, and communicate research visually.

**Acceptance criteria:**
- The system accepts supported video formats.
- Video duration must be between 90 and 300 seconds inclusive.
- The server or trusted processing provider validates actual duration.
- The system provides upload and processing feedback.
- Failed or invalid uploads cannot be published.
- The video is playable after successful publication.

### PUB-004 — Publish research images

**Priority:** P0

As a researcher, I want to publish research images and graphical abstracts so that I can communicate research visually.

**Acceptance criteria:**
- The system supports approved image formats.
- The system validates file type, integrity, and size.
- The system supports the configured image-count limit.
- Images display appropriately on mobile and desktop.
- The user confirms that they have the necessary rights to share the images.

### PUB-005 — Share a paper announcement

**Priority:** P0

As a researcher, I want to share information about a research paper so that other users can discover and discuss the work.

**Acceptance criteria:**
- The form supports paper title and description or summary.
- DOI and external URL are optional.
- Contributor information can be supplied.
- The interface does not imply that a DOI proves peer review or scientific validity.

### PUB-006 — Share research methods

**Priority:** P0

As a researcher, I want to share research methods and processes so that others can understand and learn from my work.

**Acceptance criteria:**
- The form supports a title and method description.
- Relevant topics or disciplines can be added.
- Source or DOI information is optional.
- The user can supply relevant contributor information.

## 4. Private saved drafts

### PUB-007 — Create and save a private draft

**Priority:** P0

As an authenticated user, I want to save unpublished research content as a private draft so that I can continue working on it later.

**Acceptance criteria:**
- A user can save a draft without publishing it.
- A draft can be incomplete.
- The system assigns the draft to its authenticated owner.
- Saving a draft does not make it publicly visible.
- The draft persists across sessions and devices.

### PUB-008 — View and reopen my drafts

**Priority:** P0

As an authenticated user, I want to view and reopen my saved drafts so that I can continue unfinished publishing work.

**Acceptance criteria:**
- A user can retrieve their own drafts.
- The user cannot retrieve another user's drafts.
- Drafts are available after signing out and signing back in.
- Drafts remain private and do not appear in public discovery.
- Administrators and moderators cannot retrieve another user's drafts.

### PUB-009 — Edit and resave a draft

**Priority:** P0

As an authenticated user, I want to edit and resave my draft so that I can improve my research content before publication.

**Acceptance criteria:**
- The owner can update their own draft.
- The system preserves the draft's ownership.
- Updates persist successfully.
- Unauthorized users cannot modify the draft.
- Incomplete drafts remain saveable.

### PUB-010 — Delete my draft

**Priority:** P0

As an authenticated user, I want to delete my own draft so that I can remove unpublished content I no longer need.

**Acceptance criteria:**
- The owner can delete their own draft.
- Unauthorized users cannot delete another user's draft.
- Deleted drafts are no longer available through normal draft retrieval.
- Associated media is handled according to the approved media-cleanup policy.

### PUB-011 — Publish a saved draft

**Priority:** P0

As an authenticated user, I want to publish a saved draft when it is ready so that I do not have to recreate the content.

**Acceptance criteria:**
- The owner can initiate publication of their draft.
- The system performs full publication validation.
- Required content fields must be complete.
- The author must select a valid publication audience before publishing.
- Public is selected by default.
- The author may choose Public, Citeface Members, or Followers.
- The selected audience is stored with the published post.
- The published post becomes accessible only to users permitted by its selected audience.
- Required media must be READY.
- Rights and permissions confirmation must be completed.
- Failed validation leaves the draft intact.
- Successful publication changes the post to PUBLISHED.
- The post becomes accessible according to its selected audience.
- The system must not create duplicate published posts from repeated requests.
- At least one contributor is listed and the authorship attestation is recorded before publication.

## 5. Audience, identity, and research integrity

### PUB-012 — Select a publication audience

**Priority:** P0

As an author, I want to choose who can access my published content so that I can control its visibility.

**Acceptance criteria:**
- The publishing interface provides three audience options: Public, Citeface Members, and Followers.
- Public is selected by default for every new story.
- Authors can change the selected audience before publication.
- The selected audience is stored with the post.
- Public content is accessible to everyone, including signed-out visitors.
- Members-only content is accessible only to authenticated Citeface users.
- Followers-only content is accessible only to authenticated users who follow the author.
- Audience permissions are enforced on the server.
- Unauthorized users cannot access restricted content through feeds, profiles, search results, direct links, API requests, notifications, or media URLs.
- Drafts remain private to their owners regardless of the intended publication audience.
- The author can change the audience of their published post, subject to platform rules.
- Audience changes are enforced across all access points and recorded in the audit history.

### PUB-013 — Display author identity

**Priority:** P0

As a reader, I want to see who created a research post so that I can understand its authorship.

**Acceptance criteria:**
- Published posts display the authenticated author.
- Author information links to the appropriate profile.
- The system does not allow a user to impersonate another author.

### PUB-014 — Display contributor information

**Priority:** P0

As an author, I want to provide contributor names, order, and roles so that the people involved in the research can be acknowledged.

**Acceptance criteria:**
- Contributor names can be recorded.
- Contributor order can be preserved.
- Contributor roles can be recorded where supplied.
- The publishing user attests that they have authority to list the contributors.
- At least one contributor is required to publish.
- The attestation is server-generated and linked to the contributor-list version it covers.
- Changing a published contributor list requires renewed attestation and audit history.
- Formal co-author approval is not required in the initial MVP.

### PUB-015 — Display source and research status accurately

**Priority:** P0

As a reader, I want to distinguish user-provided research information, external sources, and verified information so that I can interpret posts appropriately.

**Acceptance criteria:**
- DOI and external URL fields are optional.
- Imported metadata is confirmed by the author.
- A DOI is not presented as proof of peer review or scientific correctness.
- A Citeface post is not automatically labelled as a formal scientific publication.
- Verification status is distinct from scientific validation.
- Source metadata is visible only to users authorized to view the parent story.

### PUB-016 — Confirm content-sharing rights

**Priority:** P0

As an author, I want to confirm that I have the necessary rights and permissions to share my content so that the platform can discourage unauthorized publication.

**Acceptance criteria:**
- The publishing workflow presents a rights confirmation.
- The author must confirm before publication.
- The system records the confirmation.
- Users can report suspected copyright or ownership violations.

## 6. Media upload and processing

### PUB-017 — Track media upload progress

**Priority:** P0

As an author, I want to see upload and processing progress so that I understand when my media is ready.

**Acceptance criteria:**
- The interface communicates upload progress.
- The interface communicates processing status.
- The system distinguishes uploading, processing, ready, and failed states.
- A post requiring media cannot be published until required media is ready.

### PUB-018 — Recover from media upload failure

**Priority:** P0

As an author, I want to understand and recover from media upload failures so that I do not lose my work.

**Acceptance criteria:**
- The system displays an actionable failure message.
- A failed upload does not silently publish the post.
- The draft remains available.
- The author can retry or remove the failed media.
- Unauthorized users cannot access unpublished media.

## 7. Published-content management

### PUB-019 — Edit my published post

**Priority:** P0

As an author, I want to edit my published post so that I can correct or improve information.

**Acceptance criteria:**
- Only the author or an explicitly authorized system role can edit the post.
- The system validates changes.
- Relevant change history is retained.
- Unauthorized edits are rejected.
- The author can change the published post's audience.
- Any audience change is enforced across all access points and recorded in the audit history.
- Contributor changes on a published post require renewed attestation and are audited.

### PUB-020 — Archive my published post

**Priority:** P0

As an author, I want to archive my published post so that I can manage content I no longer want displayed.

**Acceptance criteria:**
- Only the author or an authorized system role can initiate archival.
- Archived content is excluded from normal discovery; authors keep access to their own archived posts.
- Appropriate historical records and audit information are retained.
- Archival is distinguishable from retraction.
- Platform moderation removal is a separate moderation action, not an author action.

### PUB-021 — Correct a published post

**Priority:** P0

As an author, I want to issue a visible correction to a published post so that readers can identify and understand corrected information.

**Acceptance criteria:**
- The system records the correction.
- The correction is visible to readers.
- The correction date and responsible actor are recorded.
- Relevant historical information is preserved.
- A correction is distinguishable from ordinary editing.

### PUB-022 — Mark a post as retracted

**Priority:** P0

As an authorized author or system role, I want to mark a post as retracted so that readers are not misled by content that has been formally withdrawn.

**Acceptance criteria:**
- Retraction is a distinct visible status.
- An appropriate explanation or reason can be recorded.
- Retraction history is retained.
- A retracted post is distinguishable from an ordinary archived or removed post.
- External paper retractions are distinguished from retractions of Citeface posts.

## 8. Reader reporting and moderation

### PUB-023 — Report a published post

**Priority:** P0

As a reader, I want to report content that may violate platform rules so that Citeface can review it.

**Acceptance criteria:**
- Authenticated users can submit reports.
- A report records the relevant post and reporting user.
- The system captures a reason or category.
- Reports are not automatically treated as proof of wrongdoing.
- Reports are available to authorized moderation roles.

### PUB-024 — Review reported content

**Priority:** P0

As an authorized moderator, I want to review reported content so that I can take appropriate action.

**Acceptance criteria:**
- Only authorized moderation roles can access moderation records.
- Moderation actions are recorded.
- Appropriate action can be taken under platform rules.
- Sensitive moderation information is not exposed to ordinary users.

### PUB-030 — Engagement respects story access

**Priority:** P0

As a reader, I want to appreciate, save, comment on and share only stories I am currently authorized to access so that restricted stories stay restricted.

**Acceptance criteria:**
- Reactions, saves and comments require current access to the parent story.
- Saved entries and notification previews never return restricted content after access is revoked.
- Commenting does not change the story's audience.

### PUB-031 — Share a story without bypassing its audience

**Priority:** P0

As a reader, I want to share a story link so that others can reach it according to the story's audience.

**Acceptance criteria:**
- Public stories can be shared with anyone, including signed-out visitors.
- Links, previews and media for restricted stories preserve current access rules.
- Previews of restricted stories expose no title, summary, author or media.

## 9. Deferred and out-of-scope stories

### PUB-025 — Schedule a post

**Priority:** Out of scope

As an author, I want to schedule a post for future publication.

**Reason for exclusion:** Scheduled publishing is not required for the first MVP.

### PUB-026 — Collaboratively edit a draft

**Priority:** Out of scope

As multiple contributors, we want to edit a shared draft together.

**Reason for exclusion:** Collaborative authoring is not part of the initial private-draft requirement.

### PUB-027 — Share a draft externally for review

**Priority:** Out of scope

As an author, I want to share a private draft with external reviewers before publication.

**Reason for exclusion:** External draft sharing and review introduce additional access-control complexity.

### PUB-028 — Use advanced video editing

**Priority:** Out of scope

As an author, I want to edit videos using advanced production tools within Citeface.

**Reason for exclusion:** Basic upload, validation, processing, and playback are sufficient for the first MVP.

### PUB-029 — Use AI to generate research content

**Priority:** Out of scope

As an author, I want AI to generate research claims, summaries, or other content for my post.

**Reason for exclusion:** AI-assisted writing is deferred pending a clear privacy, research-integrity, and permission framework.

## 10. MVP publishing scope summary

The first Citeface MVP must support:

- Five content types: STORY, VIDEO, PHOTO, PAPER, and METHODS.
- Private saved drafts and their full basic lifecycle.
- Draft persistence across sessions and devices.
- Server-side draft ownership and privacy enforcement.
- Publication validation.
- Audience selection with Public as the default and Citeface Members and Followers as additional options.
- Server-side audience enforcement across feeds, profiles, search, direct links, APIs, notifications, and media delivery.
- Support for changing the audience of published posts, with immediate access-control enforcement and audit history.
- Public access to stories without requiring authentication.
- Video duration validation between 90 and 300 seconds inclusive.
- Secure media upload and processing.
- Author and contributor attribution.
- Optional DOI and source references.
- Rights confirmation.
- Published-content editing and removal.
- Visible corrections and retractions.
- Content reporting and basic moderation.
- Appropriate audit records.
- Versioned contributor attestation.
- Sharing that preserves audience rules.
- Engagement (reactions, saves, comments) that respects story access.

The first MVP does not require scheduled publishing, collaborative editing, external draft review, advanced video editing, or AI-assisted writing.

## 11. Relationship to other documents

This document must remain consistent with:

- `citeface-product-strategy-requirements-roadmap.md`
- `design-reference-and-product-architecture.md`
- `publishing-specification.md`
- `publishing-acceptance-criteria.md`
- `ADR-0001-publishing-rules.md`
- `publishing-data-model.md`
- `citeface-mvp-specification.md`

Changes to accepted publishing decisions must be reflected across the relevant specifications, acceptance criteria, data model, and decision records.