# ADR-0004: Public Publishing, Private Drafts and Access Control

- **Status:** Accepted
- **Date:** 2026-11-08
- **Area:** Citeface publishing, authorization and content visibility
- **Relationship:** Supersedes conflicting audience and visibility provisions in ADR-0001 and ADR-0003. Retains compatible decisions from ADR-0001, ADR-0002 and ADR-0003.

## 1. Context

Citeface is a research social discovery and knowledge-sharing platform.

Its publishing model must make published research accessible to the wider research community while protecting unpublished work and private account resources.

Earlier decisions introduced three publishing audiences:

- Public.
- Citeface Members.
- Followers.

Subsequent product direction established that all published stories must be publicly accessible, including to visitors who are not authenticated.

The earlier audience model is therefore no longer appropriate.

Citeface still requires authorization for private drafts, account-specific operations, moderation activities and other resources that are not publicly accessible.

This ADR establishes the authoritative publishing visibility and access-control policy.

## 2. Decisions

### D1. All published stories are public

Every successfully published Citeface story is publicly accessible to anyone, whether signed in or signed out.

This applies to all supported publishing content types:

- STORY.
- VIDEO.
- PHOTO.
- PAPER.
- METHODS.

A published story must not require:
- A Citeface account.
- Authentication.
- Following the author.
- Membership in a particular group.
- An invitation or special audience permission.

The platform does not provide Members-only or Followers-only publishing audiences in the MVP.

### D2. Unpublished drafts remain private

Every unpublished draft is private and accessible only to its author.

This applies to:
- Draft creation.
- Draft retrieval.
- Draft editing.
- Draft deletion.
- Draft autosaving.
- Draft metadata.
- Draft-associated media.
- Draft publication.

Draft privacy must be enforced server-side.

Unauthorized users must not be able to retrieve draft content, metadata, contributor information or associated media through alternative API endpoints, direct links, search, feeds, profiles or storage URLs.

Drafts must persist across authenticated sessions and devices.

Existing ADR-0001 D5 draft functionality remains accepted.

### D3. Publishing audience selection is removed

The publishing workflow must not require authors to select a publishing audience.

The following options are retired:

- Citeface Members.
- Followers.
- Public as a selectable audience.

Public visibility is the universal rule for successfully published stories, not an optional audience selection.

Consequently:
- Publishing validation must not require an audience field.
- Authors cannot change a published story's audience.
- Following and unfollowing authors must not change access to their published stories.
- Audience-specific authorization logic must not determine whether published stories are readable.

Following remains a social discovery and relationship feature.

### D4. Public access must be consistent across delivery paths

Published stories must be publicly accessible through all applicable delivery paths, including:

- Public discovery feeds.
- Researcher profiles.
- Search results.
- Recommendations.
- Individual story pages.
- Direct links.
- Public APIs.
- Public sharing and previews.
- Notifications that link to public stories.
- Published media delivery.

The backend must enforce the same publication and moderation rules across these paths.

Frontend visibility controls alone are insufficient.

Publicly accessible stories must not expose private account information, unpublished drafts, internal moderation records or sensitive operational metadata.

### D5. Lifecycle and moderation remain separate

ADR-0002 D1 and D2 remain authoritative.

Publication lifecycle states are:

- DRAFT.
- PUBLISHED.
- ARCHIVED.
- RETRACTED.

Moderation states remain separate:

- NONE.
- HIDDEN.
- REMOVED.

These concepts must not be conflated.

An archived story is not automatically a retracted story.

A retracted story is not automatically a moderation-hidden story.

Public access is subject to the story's lifecycle and moderation state.

### D6. Retraction behaviour

ADR-0003 D1 remains accepted, with the following clarification:

A retracted story remains publicly accessible through its direct link and the author's profile, with a prominent retraction notice showing the reason and date.

Retracted stories:
- Are excluded from ordinary discovery feeds.
- Are excluded from search and recommendations.
- Have comments locked.
- Do not accept new appreciations.
- Do not accept new saves.

The retraction notice and public visibility must not depend on authentication or a previous audience selection.

The author may retract their story.

A moderator or administrator may retract a story only through a documented moderation action with a reason, notification to the author and an audit record.

Harmful or unlawful content requiring removal from public access must use the moderation process rather than treating retraction as a substitute for moderation.

### D7. Moderation-hidden published stories

A published story placed in moderation state HIDDEN must not be publicly accessible while that state remains in effect.

Authorized moderators and administrators may inspect moderation-hidden published stories only through an open moderation or report case.

Access is limited to the reported target or content relevant to that case.

Every privileged view must be recorded in the audit history, including the responsible actor, target and access time.

Moderators and administrators must not browse moderation-hidden content without an authorized case.

Moderation privileges do not grant access to unpublished drafts.

This decision preserves ADR-0003 D8's case-based and audited access principle while removing its dependence on restricted publishing audiences.

### D8. Saved research when content becomes unavailable

A saved story must not expose content that has subsequently become unavailable to the saving user.

When a saved story is archived, hidden, deleted or otherwise made unavailable, its saved-list entry remains as a neutral placeholder:

**No longer available**

The placeholder must not reveal:
- Story title.
- Author information.
- Story summary.
- Media.
- Restricted metadata.

The user may remove the placeholder from their saved list.

If the story becomes publicly accessible again, the saved entry may display the story normally.

Retraction follows ADR-0003 D1: new saves are blocked, and existing saved entries must not expose content beyond the permitted retraction presentation.

Following or unfollowing an author does not revoke access to a public published story.

### D9. Centralized authorization policy

The backend must implement a consistent authorization policy for all content retrieval and mutation operations.

The policy must distinguish:

1. Publication lifecycle.
2. Draft ownership.
3. Moderation state.
4. Retraction and archival behaviour.
5. Privileged moderation access.
6. Public versus private resources.

Public published stories must be readable without authentication unless their moderation or lifecycle state explicitly restricts access.

Drafts must always require authenticated ownership.

Privileged moderation access must require the authorization conditions established in D7.

Every applicable read path must use consistent policy enforcement.

### D10. Unauthorized-response behaviour

ADR-0003 D7 is retained for private drafts, with these clarifications:

- Unauthorized access to another user's draft returns 404 with a generic response.
- Draft content and metadata must not be included in unauthorized responses.
- Public published stories do not require authentication.
- Members-only and Followers-only response rules are retired because these publishing audiences no longer exist.
- Internal moderation details must not be disclosed through public or unauthorized endpoints.

The API must avoid revealing whether a private resource exists when the requester is not authorized to access it.

## 3. Superseded decisions

This ADR supersedes the following provisions:

### ADR-0001

- D4: Three selectable publishing audiences.
- D4: Audience changes before and after publication.
- D4: Audience-specific access enforcement.
- D5: Audience selection as a publication requirement.
- Consequences requiring Public, Members and Followers options.
- Consequences requiring audience-specific access and revocation.

The original decisions remain part of the historical record but are no longer authoritative.

### ADR-0003

- D1: Audience eligibility checks for retracted stories.
- D7: Followers-only and Members-only unauthorized-response rules.
- D8: Moderator access conditions that depend on restricted publishing audiences.
- D9: Audience-revocation behaviour where it conflicts with the public-only publishing policy.

The compatible parts of those decisions remain accepted as specified in this ADR.

## 4. Decisions retained without change

The following remain authoritative:

- ADR-0001 D1: Supported publishing content types.
- ADR-0001 D2: Video duration.
- ADR-0001 D3: Original source and DOI principles.
- ADR-0001 D5: Private saved drafts.
- ADR-0001 D6: Media upload and processing separation.
- ADR-0002 D1: Publication lifecycle.
- ADR-0002 D2: Separate moderation state.
- ADR-0002 D3: Content and media taxonomy.
- ADR-0002 D4: Immutable contributor versions and append-only authorship attestations.
- ADR-0003 D2: Suspended and deleted author treatment.
- ADR-0003 D3: Retention and deletion.
- ADR-0003 D4: Technical media limits.
- ADR-0003 D5: Draft autosave and conflict handling.
- ADR-0003 D6: Contributor versioning schema.

These decisions remain subject to implementation and technical reconciliation.

## 5. Implementation consequences

The product documentation, acceptance criteria, data model, API authorization design, frontend experience and automated tests must be reconciled with this ADR.

In particular:

1. Remove the publishing audience-selection interface.
2. Remove Members and Followers publishing audience fields from the intended MVP architecture.
3. Ensure public published stories are readable without authentication.
4. Ensure private drafts are inaccessible to anyone except their author.
5. Remove audience-based access revocation logic.
6. Preserve following as a social relationship.
7. Preserve case-based audited moderator access.
8. Ensure saved lists do not reveal unavailable content.
9. Update API response rules and authorization tests.
10. Reconcile the existing Prisma schema with these requirements before database changes.

This ADR does not authorize a database migration or immediate implementation.

## 6. Security and privacy considerations

Public publishing does not make every resource public.

Citeface must continue protecting:
- Unpublished research.
- Draft media.
- Private account information.
- Authentication credentials and sessions.
- Internal moderation records.
- Audit information not intended for public disclosure.
- Privileged moderation operations.

Public media must not be served through insecure draft-storage paths.

Access-control checks must be enforced on the server and must not rely solely on frontend restrictions.

Privacy, retention, deletion and regulatory obligations remain subject to the applicable data-protection requirements and legal review.

## 7. Decision history

| Date | Decision | Status |
|---|---|---|
| 2026-11-04 | Public, Members and Followers audience options accepted | Superseded |
| 2026-11-08 | Public-only publishing and private drafts proposed | Status: Accepted |

## 8. Approval

This ADR becomes authoritative only after explicit approval by the Citeface product owner.

Upon acceptance, the documentation and implementation must use this policy as the source of truth.