# ADR-0001: Initial Publishing Rules

- **Status:** Accepted product decisions; technical details partly provisional
- **Date:** 2026-10-30
- **Area:** Citeface publishing MVP

## Context

Citeface needs a publishing experience for research communication across multiple formats while retaining source attribution, audience control and research context.

## Decisions

### D1. Supported content types
The first MVP supports:
- research stories;
- short videos;
- photo posts;
- paper announcements;
- methods posts.

### D2. Video duration
The accepted duration range is 90 seconds through 300 seconds (five minutes), inclusive.

### D3. Original source
An original-paper link or DOI is optional. Posts about unpublished or ongoing work are allowed, subject to platform rules and author control.

### D4. Audience
The author chooses the audience for each post. The exact audience options and access semantics remain to be finalized before implementation.

### D5. Drafts
The first MVP does not include saved drafts. Technical upload and processing states are permitted and are not user-editable drafts.

## Consequences

- The publishing UI must provide content-type-specific forms.
- The backend must enforce audience permissions on all content retrieval paths.
- Media storage must be separate from relational metadata.
- Video duration must be validated using trusted metadata.
- The data model must allow nullable source URL and DOI fields.
- No user-facing draft feature or draft workflow should be built in the MVP.
- Media posts need safe upload, failure and retry behavior.

## Not decided by this ADR

This decision does not specify media hosting vendor, file-size limits, accepted codecs, image-count limits, video transcoding provider, precise publication-status taxonomy, or final audience options.
