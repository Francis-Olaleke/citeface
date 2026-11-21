# Build 17: Notifications and activity

**Milestone:** M3  
**Depends on:** Builds 15 and 16  
**User stories:** NOTIF-001

## Outcome

Give members timely, useful activity updates without retaining access that they
no longer have.

## Scope

- Define notification events, in-app list, unread state, and read/update actions.
- Include only approved MVP notification types.
- Re-authorize story/resource targets and previews at read time.
- Remove or safely redact previews when access changes, a user unfollows, or
  content is removed.
- Defer email/push delivery until product and consent rules are approved.

## Acceptance gate

- Notifications are scoped to their recipient and pagination is bounded.
- Preview/target links never bypass story audience checks.
- Empty, unread, failure, and revoked-access states are clear.
- Notification access and read-state tests pass.

**References:** [FR-18](../product/citeface-product-strategy-requirements-roadmap.md),
[MVP specification](../product/citeface-mvp-specification.md).

## Copilot execution prompt

```text
Execute Build 17 in Milestone M3 - Discovery and community. Confirm Build 15/16 gates. Define only approved notification events; implement recipient-scoped in-app activity, unread state, bounded pagination, and accessible empty/error states. Re-authorize targets and previews at read time and redact/remove data after audience changes, unfollow, or removal. Do not add email/push without approved consent policy. Add access/read-state tests and report M3 gate evidence.
```
