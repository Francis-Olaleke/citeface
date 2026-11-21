# Build 8: Private drafts

**Milestone:** M2  
**Depends on:** Build 7  
**User stories:** PUB-007, PUB-008, PUB-009, PUB-010

## Outcome

Let authors save unfinished work, safely return to it, and control its lifecycle.

## Scope

- Reuse and audit current draft create/list/edit/delete operations.
- Redesign My drafts, draft editor, autosave/manual-save feedback, and unsaved
  changes behavior.
- Keep every draft and unpublished attachment author-only on every API path.
- Explain whether save succeeded and preserve local form state on failures.
- Do not grant moderator/administrator draft access by default.

## Acceptance gate

- Drafts persist across sessions and are absent from public feed, profile,
  search, notifications, and unauthorized direct requests.
- Owners can create, reopen, edit, and delete drafts.
- Unauthorized ownership tests pass for reads and mutations.
- Empty, loading, stale, save-failure, and deleted states are covered.

**References:** [publishing user stories](../user-stories/README.md),
[draft routes](../../apps/api/src/modules/stories/stories.routes.ts).

## Copilot execution prompt

```text
Execute Build 8 in Milestone M2 - Publishing. Confirm Build 7's domain/contract gate. Inspect and preserve working draft endpoints; implement the responsive My Drafts and editor UX with clear save/unsaved, loading, empty, failure, retry, and delete-confirmation states. Enforce author-only ownership server-side on every draft and unpublished-media path; do not grant admin/moderator draft access. Add tests for cross-user read/write/delete denial and persistence, run draft integration tests, and verify the M2 gate.
```
