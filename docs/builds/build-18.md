# Build 18: Trust, safety, and research integrity

**Milestone:** M4  
**Depends on:** Builds 11, 16, and 17  
**User stories:** TRUST-001, TRUST-002

## Outcome

Give readers and moderators an accountable process for reports, corrections,
retractions, and harmful or misleading content.

## Scope

- Implement report submission and a role-protected moderator queue/actions.
- Keep moderation state separate from author lifecycle state.
- Make correction and retraction histories visible, auditable, and distinct from
  ordinary edits/archive.
- Add copyright/media complaint and account safety entry points.
- Keep moderation records and private drafts inaccessible to ordinary members.

## Acceptance gate

- Every moderation action records actor, target, reason, and time.
- Unauthorized moderation requests reveal no sensitive report details.
- Retraction and correction views are clear and accessible.
- Abuse, authorization, audit, and privacy tests pass.

**References:** [research integrity](../product/citeface-product-strategy-requirements-roadmap.md),
[publishing data model](../architecture/publishing-data-model.md).

## Copilot execution prompt

```text
Execute Build 18 in Milestone M4 - Readiness and launch. Confirm Build 11, 16, and 17 gates. Inspect report/moderation/correction/retraction models and current roles before implementing workflows. Protect moderator data and actions server-side; record actor, target, reason, and time; keep moderation separate from author lifecycle. Make corrections/retractions visible and distinguishable from ordinary edits/archive. Add authorization, audit, privacy, and UI tests, then report M4 gate evidence and operational blockers.
```
