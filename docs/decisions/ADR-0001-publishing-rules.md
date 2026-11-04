# ADR-0001: Initial Publishing Rules

- **Status:** Accepted, with D5 superseded by the decision dated 2026-11-04
- **Original date:** 2026-10-30
- **Last updated:** 2026-11-04
- **Area:** Citeface publishing MVP

## 1. Context

Citeface needs a publishing experience for research communication across multiple formats while retaining source attribution, audience control, research context, authorship and privacy.

Researchers may need multiple sessions to prepare research stories, add contributors, verify source information and complete media uploads. The publishing experience must support this without exposing unpublished content.

## 2. Decisions

### D1. Supported content types

The first MVP supports:

- Research stories.
- Short videos.
- Photo posts.
- Paper announcements.
- Methods posts.

### D2. Video duration

The accepted video duration range is 90 seconds through 300 seconds (five minutes), inclusive.

Duration must be validated using trusted server-side or media-provider metadata.

### D3. Original source

An original-paper link or DOI is optional.

Posts about unpublished or ongoing work are allowed, subject to platform rules, author control and research-integrity requirements.

A DOI or source link does not automatically establish peer review, scientific validity or correctness.

### D4. Audience

The author chooses the audience for each post.

The exact audience options and access semantics must be finalized before implementation.

The backend must enforce audience permissions on every relevant retrieval path.

### D5. Saved drafts — revised decision (2026-11-04)

**Decision:** The first Citeface MVP includes basic private saved drafts.

This supersedes the original D5 decision dated 2026-10-30, which excluded saved drafts.

Authors must be able to:

- Save an unpublished research post as a draft.
- Reopen and continue editing their own drafts.
- Delete their own drafts.
- Publish a draft when ready.

Drafts must persist across authenticated sessions and devices.

Draft privacy is mandatory:

- Only the author and explicitly authorized system roles may access a draft.
- Drafts must not appear in public feeds, researcher profiles, public search results or public discovery.
- Unauthorized API requests must not reveal draft content or metadata.
- Draft media must remain private and inaccessible to unauthorized users.
- Ownership and authorization must be enforced server-side, not merely through frontend visibility.

Before a draft is published, the backend must validate the complete content, required metadata, audience selection, contributor information and media readiness.

A successful publication must transition the post from DRAFT to PUBLISHED through an authorized server-side operation.

The MVP does not include:

- Scheduled publishing.
- Collaborative draft editing.
- External draft sharing or review.
- Editorial approval workflows.
- Complex version history.
- AI-assisted writing.

### D6. Media upload and processing

Media upload and processing states are technical workflow states, not substitutes for publication status.

A draft may have associated media that is still being uploaded or processed.

A media post must not become publicly available until all required media has passed validation and reached the required ready state.

Failed uploads must produce actionable errors and must not silently publish incomplete content.

## 3. Consequences

The publishing system must:

- Provide content-type-specific forms.
- Support private draft creation, retrieval, editing and deletion.
- Enforce draft ownership and privacy on every API request.
- Prevent drafts from appearing in public discovery and retrieval systems.
- Keep unpublished media private.
- Validate all required publishing rules before publication.
- Enforce audience permissions on all content retrieval paths.
- Store media binaries separately from relational metadata.
- Validate video duration using trusted metadata.
- Allow nullable source URL and DOI fields.
- Maintain clear separation between publication status and media-processing status.
- Record important publishing, archival, correction and retraction events in an auditable manner.

## 4. Explicitly outside this ADR

This decision record does not specify:

- Media hosting vendor.
- File-size limits.
- Accepted media codecs and formats.
- Image-count limits.
- Video transcoding provider.
- Exact API endpoint names.
- Final audience options.
- Detailed database indexing strategy.
- Complex draft version history.

These details must be defined in the relevant technical specifications and architecture decisions before implementation.

## 5. Decision history

| Date | Decision | Status |
|---|---|---|
| 2026-10-30 | Saved drafts excluded from the first MVP | Superseded |
| 2026-11-04 | Basic private saved drafts included in the first MVP | Accepted |

The revised decision is authoritative for future product specifications, architecture, implementation and testing.