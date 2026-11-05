# ADR-0003: Resolution of Open Publishing Decisions

- **Status:** Accepted (approved by the product owner, 2026-11-05)
- **Date:** 2026-11-05
- **Area:** Citeface publishing MVP
- **Relationship:** Resolves the ten items left open in ADR-0002 section 3. Extends ADR-0001 and ADR-0002; changes no accepted audience or draft decision.

## 1. Decisions

**D1. Retracted posts and retraction authority.** Viewers who pass the audience check still see the content behind a prominent retraction banner showing reason and date. Retracted posts leave feeds, search and recommendations but stay reachable by direct link and on the author's profile with a Retracted label. Comments are locked; new appreciations and saves are blocked. The author may retract. A moderator or administrator may retract only through a documented moderation action with a reason, which notifies the author and is audited. Harmful or unlawful content uses moderation_state HIDDEN instead of retraction.

**D2. Suspended or deleted authors.** Suspension sets the author's published stories to moderation_state HIDDEN (reversible, no data loss). Self-deletion has a 30-day grace period. After it, drafts and draft media are erased and personal profile data is removed; published stories are archived under Deleted account and their audit records are kept with the actor pseudonymised. Legal review against the Nigeria Data Protection Act 2023 is required before public launch.

**D3. Retention.** Archived and retracted posts and their media are retained as records until an erasure request or moderation takedown. Deleted drafts are removed from access immediately and their media purged within 7 days. Abandoned uploads are purged after 24 hours. Audit events are retained for at least 24 months and cannot be deleted by ordinary user actions.

**D4. Technical limits (launch defaults, configurable).** Images: JPEG, PNG or WebP only, up to 10 per PHOTO post, 10 MB each; SVG and GIF rejected. Video: one per VIDEO post, MP4 (H.264/AAC), up to 500 MB, 90-300 seconds inclusive, transcoded to 720p with a 480p fallback, thumbnail generated.

**D5. Draft autosave and conflicts.** Autosave about every 30 seconds and when the user leaves a field. Each draft has a version number; a stale write returns 409 and the UI offers load-latest or overwrite. No merging in the MVP. Drafts do not expire in the MVP.

**D6. Contributor versioning schema.** Relational design: contributor_list_versions, story_contributors and append-only authorship_attestations. Immutability is achieved by providing no update or delete code path; database triggers may be added later.

**D7. Unauthorized responses.** Drafts and FOLLOWERS stories requested by a non-follower return 404. A MEMBERS story requested while signed out returns 401 with a generic body. Never 403 with details; never include title or other metadata; use random IDs. Accepted trade-off: a signed-out user can confirm that a MEMBERS story exists at a given ID.

**D8. Moderator access to restricted stories.** Moderators and administrators may view a restricted published story only through an open report case, only for the reported target, and every view is written to the audit log. No browsing of restricted content; no access to drafts.

**D9. Saved list after access is revoked.** The entry remains as a No longer available placeholder with no title, author or media, and the user can remove it. If access returns, the entry reappears in full.

## 2. Consequences

The MVP specification, publishing specification, data model and reconciliation report are updated to reference these decisions. Limits in D4 and timings in D3 and D5 are configuration values, not hard-coded constants.

## 3. Decision history

| Date | Decision | Status |
|---|---|---|
| 2026-11-05 | D1-D9 approved; resolves ADR-0002 open items 1-10 | Accepted |
