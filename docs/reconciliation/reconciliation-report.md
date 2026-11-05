# Citeface Documentation Reconciliation Report

**Date:** 5 November 2026
**Applies the plan in:** Citeface Documentation Reconciliation Pack
**Scope:** Ten Citeface documentation files. Documentation only; no implementation status is claimed.

## 1. Delivery summary

| # | File | Result |
|---|---|---|
| 1 | `docs/product/citeface-mvp-specification.md` | **Fully rewritten** (v1.1) |
| 4 | `docs/product/publishing-specification.md` | **Fully rewritten and completed** (v2.1); original ended mid-sentence |
| 9 | `docs/builds/build-0-foundation.md` | **Rewritten** (superseded decisions replaced) |
| 7 | `docs/decisions/ADR-0001-publishing-rules.md` | **No change** (aligned). New `ADR-0002` proposed separately |
| 2 | `citeface-product-strategy-requirements-roadmap.md` | **Patch list** (section 3 below) |
| 3 | `design-reference-and-product-architecture.md` | **Patch list** (section 4) |
| 5 | `publishing-user-stories.md` | **Patch list** (section 5) |
| 6 | `publishing-acceptance-criteria.md` | **Patch list** (section 6) |
| 8 | `docs/architecture/publishing-data-model.md` | **Not supplied.** Addendum in section 7 |
| 10 | `docs/audits/citeface-repository-audit-worksheet.md` | **Not supplied.** Replacement rows in section 8 |

Two notes on what you sent: the Build 0 file appeared twice (identical, both with the superseded decisions), and the data model and audit worksheet were not in the upload, so I could not edit them directly. For files 2, 3, 5 and 6 I give exact edits rather than retyping about 15,000 words of text that is already mostly correct, per the pack's "do not blindly replace whole documents".

## 2. Conflicts found and how each was resolved

Pack items (P) and additional conflicts I found (A).

| # | Conflict | Resolution |
|---|---|---|
| P1 | MVP rule 1 "published stories are public"; rule 2 let administrators see drafts | Rewritten: audience model; draft owner-only; admin gets no draft access |
| P2 | Role table implied admin/"Owner/admin" access | Explicit resource-level ownership paragraph; "Owner/admin" removed everywhere |
| P3 | F-07 sources visible on "public story" | Sources inherit parent-story access |
| P4 | F-10 feed was public-only | Audience-aware feed, detail, filters, counts |
| P5 | F-12/13/14 limited to public stories | Require current access to the parent story; saves never bypass access |
| P6 | F-15 search not audience-aware | Authorize at query time; autocomplete, snippets, counts covered |
| P7 | F-16 notifications could outlive access | Access re-checked at read time |
| P8 | F-17 moderation vs draft privacy unclear | Moderation excludes drafts; `moderation_state` separate from `status` |
| P9 | Lifecycle `REMOVED` vs `archived/retracted` | Canonical `DRAFT/PUBLISHED/ARCHIVED/RETRACTED` (approved, ADR-0002) |
| P10 | `format` (text/video/image_slides) vs five content types | `content_type` + `media_type`; mapping documented |
| P11 | Attestation was a single timestamp | Versioned contributor lists + append-only attestation |
| P12 | Draft delete and audience-change endpoints missing | Added `DELETE /stories/:id`, `PATCH /stories/:id/audience`; allow-listed PATCH |
| P13 | Publishing spec ended mid-sentence | Completed; added section 9 cross-cutting authorization |
| P14 | Build 0 said drafts unsupported, audience undefined | Replaced |
| A1 | `GET /api/auth/me` listed as "Optional" auth but F-02 says it returns 401 | Changed to required |
| A2 | Follow endpoint: F-11 said `POST`, inventory said `PUT` | Standardised on idempotent `PUT` |
| A3 | Self-follow "if desired" vs DB check constraint | Self-follow rejected |
| A4 | Rights/permissions confirmation (PUB-016, PUB-AC-019) missing from MVP spec | Added to F-06, data model, publish validation |
| A5 | 90–300 s video rule absent from MVP spec | Added to rules, F-08, tests (89/90/300/301 s) |
| A6 | F-08 "controlled public delivery" for published media contradicted audience rules | Media follows current audience; signed URLs short-lived |
| A7 | `GET /api/me/drafts` missing though PUB-AC-008 requires draft retrieval | Added |
| A8 | Sharing (FR-17, a MVP must-have) had no MVP feature | Added F-21 |
| A9 | Media processing states absent from MVP spec | Added five states |
| A10 | Draft content could leak via logs/analytics | Explicitly excluded in F-19/F-20 |
| A11 | "Audience" column missing from MVP data model | Added `audience`, `content_type`, `moderation_state`, rights fields, versioned contributor tables, indexes |
| A12 | Acceptance criteria say "Citeface Members"; specs say `MEMBERS` | Label vs enum mapping documented |
| A13 | Design reference shows a "message" action and voting; MVP excludes DMs and uses single appreciation | Flagged in section 4 |
| A14 | PUB-020 "remove or archive" ambiguous with moderation removal | Author action is archive; moderation is separate |

## 3. Patches: product strategy, requirements and roadmap

Set version to 1.1 and add "Last reconciled: 5 November 2026".

**3.1 Section 6.** After "Video must not be compulsory." insert:

```md
### Content types and video duration
The first release supports five content types: STORY (written research explanations), VIDEO, PHOTO (images and image-slide stories), PAPER (paper announcements) and METHODS. Video leads the feed identity; other types are first-class. Short videos are 90–300 seconds inclusive, validated from trusted media metadata.
```

**3.2 FR-04.** Replace with:
`- **FR-04 Story creation:** Authenticated users can create research stories of type STORY, VIDEO, PHOTO, PAPER or METHODS.`

**3.3 FR-08.** Replace with:
`- **FR-08 Attribution:** At least one contributor is required to publish. The publisher attests to authority to list contributors (not individual co-author approval) and confirms rights and permissions. Contributor names, order and roles are recorded in versioned contributor lists; the attestation is bound to the version it covers, and changing a published list requires renewed attestation.`

**3.4 FR-18.** Append: `Notification previews and targets are re-authorized at read time and never preserve access after an audience change or unfollow.`

**3.5 Section 10.** Add bullets:
```md
- Contributor lists are versioned; attestation metadata is server-generated and tied to the list version it covers.
- Source metadata, contributor details, comments, reactions, saves, previews and notifications inherit the access rules of the parent story.
- Administrators and moderators do not automatically gain access to another user's drafts or draft media.
```

**3.6 Section 11, Publishing must-haves.** Replace "Text explanations. / Short-video upload and playback. / Image upload and image-slide stories." with:
```md
- Five content types: STORY, VIDEO, PHOTO, PAPER and METHODS.
- Short-video upload and playback (90–300 seconds inclusive).
- Image upload and image-slide (PHOTO) stories.
- Rights and permissions confirmation and versioned contributor attestation.
```

**3.7 Section 13, Phase 4 Sprint 1.** Change "contributor/source/status data" to "contributor/source/status data, rights confirmation, versioned authorship attestation".

**3.8 Section 16.** After the audience list, add:
```md
- ARCHIVED: author only, excluded from discovery. RETRACTED: visible status per the retraction policy (pending decision).
- Platform moderation hiding/removal is a separate `moderation_state`, not a lifecycle state, and never grants draft access.
```

Everything else (positioning, audience policy, roadmap phases, metrics, business model) is already consistent and is unchanged.

## 4. Patches: design reference and product architecture

**4.1 Reference A, product implication.** Append: `Scope note: the "message" action is not an MVP commitment (direct messages are out of scope). Profile story lists are audience-aware and never include drafts.`

**4.2 Reference B, trust requirement.** Append: `MVP scope: a single appreciation action only; voting and ratings are not in the MVP until their meaning is decided.`

**4.3 Section 10.** Replace the bullet list with this classified table:

```md
## 10. Decisions still required

| Decision | Classification |
|---|---|
| Exact navigation for the first release | Required before MVP implementation |
| Definitions for Trending, Discussed and Top (recent-first until defined) | Required before the filters are shown |
| Whether voting is included and what votes mean | Safe to decide during feed/engagement build; MVP uses appreciation only |
| Verification categories, evidence and review process | Safe to decide during the profile build |
| Whether citation/h-index metrics are shown and from which source | Safe to decide during the profile build; deferred by default |
| Whether shared/mutual connections are in the MVP | Explicitly deferred |
| Research hub creation, ownership, moderation and taxonomy | Explicitly deferred (MVP uses seeded categories) |
| Scope of messaging, events and communities | Explicitly deferred |
```

## 5. Patches: publishing user stories

Set version 2.1.

- **PUB-008** add criterion: `Administrators and moderators cannot retrieve another user's drafts.`
- **PUB-011** add: `At least one contributor is listed and the authorship attestation is recorded before publication.`
- **PUB-014** replace criteria with: contributor names, order and roles recorded; at least one contributor required to publish; publisher attests authority to list contributors; attestation is server-generated and linked to the contributor-list version; changing a published contributor list requires renewed attestation and audit history; formal co-author approval not required in the MVP.
- **PUB-015** add: `Source metadata is visible only to users authorized to view the parent story.`
- **PUB-019** add: `Contributor changes on a published post require renewed attestation and are audited.`
- **PUB-020** replace the title with "Archive my published post" and criteria bullet 2 with: `Archived content is excluded from normal discovery; authors keep access to their own archived posts.` Add: `Platform moderation removal is a separate moderation action, not an author action.`
- **Add PUB-030 (P0): Engagement respects story access.** As a reader, I can appreciate, save, comment on and share only stories I am currently authorized to access. Criteria: reactions, saves and comments require access to the parent story; saved entries and notification previews never return restricted content after access is revoked; commenting does not change the story's audience.
- **Add PUB-031 (P0): Share a story without bypassing its audience.** Criteria: public stories can be shared with anyone including signed-out visitors; restricted stories' links, previews and media preserve current access rules; previews of restricted stories expose no title, summary, author or media.
- **Section 10 summary**, add: versioned contributor attestation; sharing that preserves audience rules; engagement that respects story access.

## 6. Patches: publishing acceptance criteria

Set version 2.1. Priorities (P0/P1/P2/Out of scope) are unchanged.

- **PUB-AC-008** add verification: `Administrators and moderators acting without ownership cannot retrieve or reopen another user's draft.`
- **PUB-AC-011** add verification: `At least one contributor and a valid authorship attestation are present.`
- **PUB-AC-015** add verifications:
  - Source metadata, contributor details and previews respect the selected audience.
  - Comments, reactions and saves require current access to the parent story.
  - Notification previews and targets are re-authorized at read time.
  - Search autocomplete, snippets, counts and facets do not leak restricted stories.
  - Shared links and link previews expose no metadata of restricted stories.
- **PUB-AC-017** replace verification with: records are tied to the correct post; order and roles preserved; at least one contributor required; attestation server-generated (client cannot supply publisher, timestamp or policy version); attestation references the contributor-list version covered; changing a published list creates a new version, requires renewed attestation and an audit record; earlier versions and attestations remain unchanged; co-author approval is not required.
- **PUB-AC-019** add: `Rights confirmation is recorded with a server timestamp and policy version, separately from the authorship attestation.`
- **PUB-AC-022** add: `Authorized system roles cannot edit drafts.`
- **PUB-AC-023** add: `Moderation removal is represented separately from author archival and from retraction.`
- **Add PUB-AC-033 — Draft access by privileged roles (P0).** Given a user owns a draft, when an administrator or moderator without ownership requests, edits, publishes or deletes it, then the server denies the request.
- **Add PUB-AC-034 — Sharing and previews (P0).** Verify public link signed-out; MEMBERS and FOLLOWERS links denied to unauthorized users without metadata; link stops working after audience restriction or unfollow.
- **Section 12.1 unit tests** add: video duration boundaries (89, 90, 300, 301 s), central audience policy matrix, contributor-list versioning, attestation binding.
- **Section 12.2/12.3** add: draft access denied to administrator/moderator; audience-aware sources, comments, reactions, saves; notification preview authorization at read time; search autocomplete/count leakage; cache invalidation after audience change/unfollow; published contributor update requiring renewed attestation.
- **Section 13 release gate** add item: `Contributor attestation is versioned and server-generated.`

## 7. Data model addendum (`publishing-data-model.md`, not supplied)

Verify the file contains the following; add whatever is missing. It must match MVP specification section 5.

1. `stories`: `content_type`, `status` (DRAFT/PUBLISHED/ARCHIVED/RETRACTED), `audience` (not null, default PUBLIC), `moderation_state`, rights confirmation timestamp and policy version.
2. `contributor_list_versions`, `story_contributors` (unique order per version), append-only `authorship_attestations` referencing the version.
3. `media_assets.processing_status` using the five media states; media follows parent-story audience.
4. `story_sources.origin` and author confirmation.
5. `user_follows` with unique pair, no-self-follow check, and index on (followed_user_id, follower_user_id).
6. `story_corrections`, `story_revisions`, `audit_events` (audience changes, attestations, status changes).
7. Remove any `REMOVED` post status; map existing data per ADR-0002.

## 8. Audit worksheet (`citeface-repository-audit-worksheet.md`, not supplied)

Replace the row `Publishing without saved drafts | Not inspected` with these rows (status stays `Not inspected` until code, schema, migrations and tests are examined):

```md
| Private draft creation/retrieval/update/deletion | Not inspected | | |
| Draft persistence across sessions/devices | Not inspected | | |
| Draft ownership authorization, including admin non-owner denial | Not inspected | | |
| Draft media privacy and secure delivery | Not inspected | | |
| Story publication validation and state transition | Not inspected | | |
| Audience defaults and PUBLIC/MEMBERS/FOLLOWERS enforcement | Not inspected | | |
| Published-story audience changes and audit history | Not inspected | | |
| Immediate access revocation after unfollow | Not inspected | | |
| Audience-aware feeds, profiles, search and direct access | Not inspected | | |
| Audience-aware notifications, previews and caches | Not inspected | | |
| Audience-aware sharing, link previews, comments, reactions and saves | Not inspected | | |
| Contributor list versioning and authorship attestation | Not inspected | | |
| Published contributor changes and renewed attestation | Not inspected | | |
| Rights and permissions confirmation | Not inspected | | |
| Video duration validation 90–300 s inclusive (trusted metadata) | Not inspected | | |
| Media processing states separate from post status | Not inspected | | |
| Archive, correction and retraction lifecycle | Not inspected | | |
```

Security checklist additions:

```md
- [ ] Draft ownership is enforced on every API read/write/delete/publish operation.
- [ ] Administrative and moderator roles do not automatically bypass draft ownership.
- [ ] Audience authorization is enforced on direct story reads and every discovery path.
- [ ] Audience changes and unfollowing revoke access on subsequent requests.
- [ ] Source metadata, notifications, previews, counts, shared links and caches do not leak restricted stories.
- [ ] Published media inherits parent-story audience; draft media remains author-only.
- [ ] Authorship attestation is server-generated and bound to the contributor-list version.
- [ ] Published contributor changes require renewed attestation and preserve history.
- [ ] Generic story PATCH uses an allow-list (no owner, status, moderation or attestation fields).
```

## 9. Decisions you need to make

All ten were approved on 2026-11-05 and recorded in ADR-0002 (lifecycle and taxonomy) and ADR-0003 (the remaining nine decisions).

1. DONE: canonical lifecycle and taxonomy approved (ADR-0002, accepted 2026-11-05).
2. What is shown for a retracted post, and who besides the author may retract.
3. Policy for posts whose author is suspended or deleted.
4. Retention/deletion policy for archived and retracted posts and media.
5. Image count, file size, MIME and video encoding limits.
6. Draft autosave and multi-session conflict strategy.
7. Contributor versioning schema representation.
8. Unauthorized-response convention (404/401).
9. Moderator access to restricted published stories under report.
10. Saved-list behaviour after access is revoked.

## 10. Verification after applying

Search all ten files for: "REMOVED", "all published stories are public", "Owner/admin", "without saved drafts", "not supported in the first MVP", "image_slides", "Optional" next to `/api/auth/me`. None should remain except where explaining the migration or mapping.
