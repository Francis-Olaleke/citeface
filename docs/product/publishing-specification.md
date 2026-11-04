# Citeface Publishing Specification

**Document status:** Product specification  
**Version:** 2.0  
**Last updated:** 4 November 2026  
**Product:** Citeface  
**Tagline:** Research. Connect. Discover.

---

## 1. Purpose

This document defines how users create, save, edit, publish, discover, and manage research content on Citeface.

Citeface is a research social discovery and knowledge-sharing platform. Its publishing experience should help researchers communicate research ideas, findings, methods, processes, and publications in accessible formats while preserving authorship, context, provenance, privacy, and research integrity.

Publishing must support the broader Citeface experience:

**Discover → Understand → Engage → Connect → Return**

A Citeface post is not automatically a formal scientific publication, peer-reviewed work, or independently validated research result.

## 2. Product principles

The publishing system must follow these principles:

1. **Research communication:** Support accessible sharing of research, not merely document storage.
2. **Multiple formats:** Support text, video, images, paper announcements, and methods.
3. **Author control:** Authors control their own drafts and can manage their published content within platform rules.
4. **Privacy by default for drafts:** Unpublished content and its associated media remain private.
5. **Transparent provenance:** Preserve contributor information and distinguish user-provided information from verified information.
6. **Research integrity:** Do not imply that engagement, a DOI, or a Citeface post proves scientific validity or peer review.
7. **Accessible discovery:** Published content should be discoverable according to its audience and applicable access rules.
8. **Secure media handling:** Validate uploads and prevent unauthorized access to private media.
9. **Accountability:** Preserve appropriate history for corrections, removals, retractions, and moderation actions.

## 3. Supported publishing formats

The first publishing release supports five content types.

| Content type | Purpose |
|---|---|
| STORY | Research explanations, findings, ideas, observations, and commentary |
| VIDEO | Short research videos, demonstrations, explanations, and presentations |
| PHOTO | Research images, graphical abstracts, diagrams, and image-slide content |
| PAPER | Announcements or discussions about research papers and publications |
| METHODS | Research methods, protocols, workflows, and experimental processes |

Each type should have an appropriate creation experience while sharing common publishing infrastructure.

### 3.1 STORY

Users can publish written research content.

The form should support:
- Title or headline.
- Main text.
- Research topics or disciplines.
- Optional source or reference.
- Optional DOI or external URL.
- Relevant contributor information.
- Audience selection.

### 3.2 VIDEO

Users can publish short research videos.

Supported use cases include:
- Research explanations.
- Short findings and discoveries.
- Laboratory demonstrations.
- Research processes.
- Video summaries.
- Short presentations.

The initial video duration requirement is **90–300 seconds inclusive**.

The server or trusted media-processing provider must validate the actual media duration. Client-side validation alone is insufficient.

### 3.3 PHOTO

Users can publish research images, graphical abstracts, diagrams, and image-slide content.

The system should support one or more images, subject to implementation-defined file-count, file-size, and format limits.

Uploaded images must be validated before publication.

### 3.4 PAPER

Users can share information about a research paper or publication.

The system should support:
- Paper title.
- Description or summary.
- Optional DOI.
- Optional external URL.
- Contributor information.
- Research topics.
- Audience selection.

A DOI or external link must not automatically be treated as proof that a paper is peer-reviewed, authentic, or scientifically correct.

### 3.5 METHODS

Users can share research methods, protocols, workflows, and experimental processes.

The form should support:
- Title.
- Method description.
- Relevant research context.
- Topics or disciplines.
- Optional source or reference.
- Optional DOI or URL.
- Contributor information.
- Audience selection.

## 4. Content fields and provenance

A research post should support the following logical information:

| Field | Requirement |
|---|---|
| Title or headline | Required where applicable to the content type |
| Body, description, or caption | Required according to content type |
| Content type | Required |
| Topics or disciplines | Supported |
| Author | Required; derived from the authenticated account |
| Contributors | Optional; names, order, and roles where supplied |
| Affiliation | Optional |
| DOI | Optional |
| External source URL | Optional |
| Research status | Optional where relevant |
| Audience | Required before publication |
| Media references | Required for media-dependent content |
| Created timestamp | System-generated |
| Updated timestamp | System-generated |
| Published timestamp | Set when publication succeeds |

The system must distinguish between:
- Information supplied by the user.
- Information imported from an external source.
- Information verified by Citeface.

Imported DOI or publication metadata must be confirmed by the author before it is presented as confirmed information.

The publishing user attests that they have authority to list the named contributors. Formal co-author approval is outside the initial MVP scope.

## 5. Audience and visibility

Citeface must allow authors to select the intended audience for each published story before publication.

The supported audience categories are:

- **Public:** Content is accessible to everyone, including visitors who are not signed in. This is the default audience for all new stories.
- **Citeface members:** Content is accessible only to authenticated Citeface users.
- **Followers:** Content is accessible only to authenticated users who follow the author.

### 5.1 Default audience

- Public must be selected by default when an author creates a new story.
- Authors may change the audience before publishing.
- The selected audience must be clearly displayed in the publishing interface.
- Authors must be able to review the selected audience before confirming publication.

### 5.2 Audience enforcement

Audience restrictions must be enforced on the server, not only in the frontend.

The selected audience must be respected across:

- Research feeds and discovery recommendations.
- Author profiles and published-story listings.
- Search results.
- Story detail pages and direct links.
- Sharing and external access.
- Notifications and activity feeds.
- API responses.
- Media files and media delivery URLs.

Public stories must remain accessible to signed-out visitors.

Members-only stories must require authentication.

Followers-only stories must require authentication and an active follow relationship with the author.

Unauthorized users must not be able to retrieve restricted story content or associated media by guessing URLs, calling APIs directly, or accessing cached responses.

### 5.3 Draft visibility

- All unpublished drafts must remain private, regardless of the audience selected for eventual publication.
- Only the draft's author may view, edit, delete, or publish it.
- Drafts must not appear in public feeds, profiles, search results, recommendations, or public sharing.
- Draft content and associated unpublished media must be protected by server-side ownership and authorization checks.
- The selected publication audience becomes effective only when the story is successfully published.

### 5.4 Audience changes after publication

- Authors may change the audience of their published stories, subject to platform rules.
- Audience changes must take effect across all access points.
- When a story becomes more restrictive, users who no longer qualify must immediately lose access to its content and media.
- When a story becomes less restrictive, access must follow the newly selected audience.
- Audience changes must be recorded in the audit history.

### 5.5 Privacy and access-control principles

- Audience selection controls who can access a story on Citeface; it does not guarantee confidentiality outside the platform.
- Users must be informed that public stories can be accessed and shared by people outside Citeface.
- Restricted stories must not expose their content through search indexing, previews, notifications, public metadata endpoints, or media URLs.
- The platform must apply consistent authorization rules across web, API, and media-delivery layers.

## 6. Private saved drafts — MVP requirement

**Decision: Basic private saved drafts are included in the first Citeface MVP.**

A user must be able to save unpublished research content and return to it later without having to publish it immediately.

### 6.1 Draft capabilities

The MVP must allow an authenticated user to:

1. Create a draft.
2. Save an incomplete draft.
3. Reopen an existing draft.
4. Edit and update a draft.
5. Delete their own draft.
6. Publish a draft after satisfying publication requirements.

Drafts must persist across sessions and devices when the user signs in to the same account.

### 6.2 Draft lifecycle

The basic draft lifecycle is:

**Create → Save → Reopen → Edit → Save again → Publish or Delete**

A draft remains private until publication succeeds.

Saving a draft must not:
- Publish it.
- Make it discoverable.
- Add it to a public profile.
- Trigger public notifications.
- Expose its content or media to unauthorized users.

### 6.3 Draft validation

Drafts may be incomplete.

The system must not require all publication fields to be completed before a draft can be saved.

Full publication validation must occur when the user attempts to publish. The system must then check the requirements for the selected content type, audience, contributor information, rights confirmation, and media readiness where applicable.

If publication fails validation, the system must:
- Explain what needs to be corrected.
- Keep the draft intact.
- Avoid creating a partially published post.
- Allow the author to return to editing.

### 6.4 Draft ownership and security

The server must verify ownership for every draft operation.

A user must not be able to retrieve, update, delete, or publish another user's draft by changing a request identifier.

Draft content and associated unpublished media must be protected through server-side authorization and secure media delivery.

### 6.5 Draft media

A draft may contain media that is still uploading or processing.

The media-processing lifecycle is separate from the draft's publication state.

If an upload or processing operation fails, the draft should remain available. The user should receive an actionable error and be able to retry or remove the failed media.

A post requiring media must not be published until the required media is validated and ready.

### 6.6 Draft features excluded from MVP

The following are not required for the first MVP:
- Scheduled publishing.
- Collaborative draft editing.
- External draft sharing or review.
- Editorial approval workflows.
- Complex version history.
- AI-assisted writing or research generation.

## 7. Publication and media states

The system must keep a post's publication state separate from the technical state of its media.

### 7.1 Post publication states

The logical publication lifecycle includes:

| State | Meaning |
|---|---|
| DRAFT | Private, unpublished content owned by its author |
| PUBLISHED | Content successfully published and accessible according to its audience |
| REMOVED | Content removed from normal public access while appropriate records and audit history are retained |

Corrections, retractions, and archival information must also be represented appropriately. A retraction must not be treated as an ordinary deletion.

### 7.2 Media-processing states

Media assets may move through these technical states:

| State | Meaning |
|---|---|
| PENDING_UPLOAD | Upload has been initiated |
| UPLOADING | Media is being transferred |
| PROCESSING | Media is being validated or processed |
| READY | Media has passed required checks and is ready for use |
| FAILED | Upload or processing has failed |

These are technical media states, not publication states.

A draft may remain a DRAFT while its media is pending, uploading, processing, ready, or failed.

### 7.3 Publication readiness

Before publishing a post containing media, the system must confirm that:
- Required uploads are complete.
- Media processing has succeeded.
- The file type and size are permitted.
- Video duration is valid where applicable.
- The media is safe and accessible.
- The author has confirmed the required rights and permissions.

A media failure must not result in silent publication or an inaccessible published post.

## 8. Media validation and storage

### 8.1 General requirements

The system must:
- Validate file type and size on the server.
- Reject unsupported or invalid files.
- Use secure media storage.
- Avoid exposing storage credentials or private infrastructure details.
- Restrict access to unpublished media.
- Provide clear upload progress and failure feedback.
- Avoid making media public before the associated post is published and authorized for access.

The exact storage provider, file-size limits, image-count limits, supported formats, codecs, and transcoding configuration remain technical decisions to be confirmed.

### 8.2 Video requirements

- Minimum duration: 90 seconds.
- Maximum duration: 300 seconds.
- Both limits are inclusive.
- Duration must be validated using trusted media metadata or processing.
- Failed validation must prevent publication.
- Playback must provide appropriate user controls.
- Processing failures must be communicated clearly.

### 8.3 Image requirements

- Validate supported image formats.
- Validate file size and file integrity.
- Support appropriate image presentation on desktop