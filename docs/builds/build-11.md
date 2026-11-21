# Build 11: Publication and audience authorization

**Milestone:** M2  
**Depends on:** Builds 8, 9, and 10  
**User stories:** PUB-011, PUB-012, PUB-019, PUB-020, PUB-021, PUB-022

## Outcome

Publish complete stories with explicit visibility and consistently enforced
access rules.

## Scope

- Implement or reconcile `PUBLIC`, `MEMBERS`, and `FOLLOWERS` audiences with
  PUBLIC as the default; require an approved migration if absent.
- Centralize `canViewStory`-style API authorization and apply it to feeds,
  details, profile lists, search, interactions, previews, notifications, media,
  and caches.
- Design final preview, audience picker, rights/author attestations, publish
  confirmation, and post-publication edit/archive/correction/retraction states.
- Recheck access after audience changes and unfollow.

## Acceptance gate

- Signed-out users can read PUBLIC only; members can read MEMBERS; only active
  followers can read FOLLOWERS; authors retain owner access.
- Drafts stay private regardless of intended audience.
- Restricted responses reveal no title, author, summary, source, or media.
- Publish is idempotent and all access/audit tests pass.

**References:** [ADR-0004](../decisions/ADR-0004-public-publishing-and-access-control.md),
[MVP specification](../product/citeface-mvp-specification.md).

## Copilot execution prompt

```text
Execute Build 11 in Milestone M2 - Publishing. Confirm Build 8, 9, and 10 gates. Inspect the actual schema and every story read/write path; propose migrations if audience or audit fields are absent. Implement one reusable server-side visibility policy for PUBLIC, MEMBERS, FOLLOWERS, DRAFT, ARCHIVED, and RETRACTED content and apply it to all access paths, including media, metadata, interactions, notifications, and caches. Add boundary tests for signed-out/member/follower/author and immediate revocation. Never treat UI hiding as authorization; stop only when the M2 publication gate is evidenced.
```
