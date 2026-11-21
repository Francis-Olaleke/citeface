# Build 15: Researcher/topic network

**Milestone:** M3  
**Depends on:** Builds 5, 6, and 11  
**User stories:** NET-001, NET-002

## Outcome

Help members build a useful research network around people and topics.

## Scope

- Implement or reconcile idempotent follow/unfollow flows for researchers and
  topics.
- Design profile, topic, and network states including counts and empty states.
- Re-evaluate FOLLOWERS story access immediately after follow changes.
- Prevent self-follow and duplicate relationships.
- Do not add DMs, mutual-connection claims, or collaboration matching.

## Acceptance gate

- Follow actions work with keyboard, touch, pending, and error states.
- Unfollowing immediately revokes follower-only access on subsequent reads.
- Relationship changes are idempotent and authorized.
- Follow/topic authorization and visibility tests pass.

**References:** [product strategy](../product/citeface-product-strategy-requirements-roadmap.md),
[domain map](../architecture/domain-map.md).

## Copilot execution prompt

```text
Execute Build 15 in Milestone M3 - Discovery and community. Confirm Build 5, 6, and 11 gates. Inspect follow/topic schema and routes; implement idempotent follow/unfollow APIs and responsive profile/topic/network controls with pending/error/empty states. Prevent self-follow and duplicate relations. Re-evaluate follower-only access immediately after unfollow; do not add messaging or collaboration matching. Add relationship and revocation tests and verify the M3 gate.
```
