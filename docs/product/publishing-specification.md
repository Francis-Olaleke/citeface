# Citeface Publishing — Product Specification

**Document status:** Draft for Build 0
**Product:** Citeface
**Area:** Research publishing
**Priority:** Core MVP capability

## 1. Purpose

Citeface publishing enables researchers and students to communicate research work through structured stories, short videos, photographs, paper announcements, and methods-focused posts. Publishing should make research communication approachable while preserving authorship, context, source attribution, and research-integrity signals.

A Citeface post is not automatically a scientific publication, peer-reviewed output, or validation of a scientific claim.

## 2. Supported content types

The first MVP supports five content types:

1. **Research story** — a written explanation of a research question, context, approach, findings, limitations or significance.
2. **Short video** — a video explaining, demonstrating or documenting research work.
3. **Photo post** — one or more research-related photographs or images with explanatory text.
4. **Paper announcement** — a post introducing or discussing a paper, publication, preprint, thesis, conference output or other research document.
5. **Methods post** — a focused explanation or demonstration of a research method, protocol, technique, instrument or workflow.

The publishing interface should guide the author to provide content appropriate to the selected type. Do not force every type into an identical form.

## 3. Original paper and DOI

An original-paper link or DOI is optional across the publishing experience.

- Authors may link a DOI, publication URL, repository record or other relevant source.
- A post may describe ongoing, unpublished or exploratory work without a DOI.
- When an author says a post discusses a specific published paper, the interface should encourage linking that paper, but the link is not a universal publishing prerequisite.
- A DOI or link is a source reference; it does not independently prove that every statement in the post is correct.
- Citeface should preserve the supplied source and attribution information rather than imply that Citeface has independently verified the research.

## 4. Audience selection

The author chooses the audience for each post at publication time. There is no assumed universal default audience.

The initial audience options are:
- **Public:** accessible to people who are not signed in, subject to platform visibility and moderation rules.
- **Citeface members:** accessible to signed-in members.
- **Followers:** accessible to the author's followers, subject to the platform's follow relationship and account rules.

The final option labels and whether additional restricted audiences are needed must be confirmed before implementation. The selected audience must be visible to the author before publishing and enforced by the server for every read path, including feed, profile, search, direct links and API access.

## 5. Draft policy

The first MVP does not provide a saved-draft feature. Authors create a post and publish it directly.

This does not mean media uploads must be instantaneous. A post may pass through temporary technical states such as `uploading`, `processing`, `ready` or `failed`. These are operational states, not user-editable drafts.

If an upload fails, Citeface should provide a clear recovery path. It must not silently publish an incomplete post. The product should not promise draft persistence or recovery after a user leaves the publishing flow unless that capability is separately approved.

## 6. Video requirements

- Minimum duration: **90 seconds**.
- Maximum duration: **300 seconds (5 minutes)**.
- The server or trusted media-processing provider must validate duration; client-side validation is only an early usability check.
- Validate actual file format, file size, upload integrity and media safety.
- File-size limits and the initial supported video formats remain configuration decisions to finalize when the storage and media provider are selected.
- The interface must show upload progress and actionable failure feedback.
- A video post must not become publicly available until its media is successfully stored and has passed required validation/processing.
- Playback should support common user controls such as play, pause, mute/unmute and replay, with responsive behavior on mobile and desktop.

## 7. Photo requirements

- Support research-related photo/image uploads.
- Support one or more images per photo post, subject to configured limits.
- Validate file type, size and upload integrity.
- Preserve author attribution and any caption or explanatory context.
- Do not assume that uploaded images are owned by the uploader. Include an appropriate rights/permission confirmation in the publishing flow.

Image count, file-size limits and accepted formats require configuration before implementation.

## 8. Content and attribution fields

A post should support, as applicable:
- title or headline;
- main text, summary or caption;
- content type;
- topic tags or research disciplines;
- author identity;
- optional institution/affiliation context;
- optional original source URL and DOI;
- optional publication/source status;
- audience selection;
- attached media references;
- creation and publication timestamps.

The exact required fields vary by content type and will be finalized in the content schema and UI design.

## 9. Publishing lifecycle

The user-facing workflow is direct publication, without saved drafts:

1. Author selects a content type.
2. Author enters the relevant content and optional source information.
3. Author selects an audience.
4. Author submits the post.
5. Text-only posts are validated and published.
6. Media posts upload and pass server-side validation/processing.
7. A media post is published only when its required media is ready.
8. The author receives a clear success or failure result.

Suggested technical states:
- `pending_upload`
- `uploading`
- `processing`
- `ready`
- `published`
- `failed`
- `removed`

These states must not be presented as a saved-draft feature.

## 10. Research integrity and user control

- Show who created the post.
- Distinguish Citeface content from the original paper or publication it references.
- Do not label a post as peer-reviewed merely because it links to a DOI.
- Allow the author to correct or remove their content in accordance with platform rules.
- Provide a report mechanism and a route for moderation.
- Plan for correction and retraction notices when a post refers to a paper whose status changes.
- Do not require researchers to disclose confidential or unpublished information.
- Include rights/consent prompts for media uploads.

## 11. Out of scope for the first publishing MVP

Unless separately approved, the first release excludes:
- saved drafts and scheduled publishing;
- advanced video editing, filters and in-app production tools;
- live streaming;
- long-form video beyond five minutes;
- automated scientific fact-checking;
- automatic DOI-based verification of research claims;
- complex collaborative authoring;
- AI-generated research claims or summaries.

## 12. Success measures

Measure whether authors can complete publishing reliably and whether readers can understand and engage with posts. Initial measures may include:
- publishing completion rate;
- media upload success and failure rates;
- time to publish;
- repeat publishing by contributors;
- reader engagement such as meaningful discussion, saves and shares;
- reports and moderation outcomes.

These measures do not constitute a measure of scientific quality or validity.
