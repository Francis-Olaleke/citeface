# Build 1: Repository and product baseline

**Milestone:** M0  
**Depends on:** Build 0 foundation  
**User stories:** FOUNDATION-001

## Outcome

Give Copilot a trustworthy picture of what already works so the new UI/UX
extends the application instead of replacing working authentication, publishing,
profiles, media, or tests.

## Scope

- Inventory existing web routes/components, API routes, Prisma models, tests,
  environment requirements, and known worktree changes.
- Classify each MVP capability as implemented, partial, schema-only, missing, or
  blocked; cite source files and test evidence.
- Record current visual patterns and the current user journey, including rough
  spots that the redesign must solve.
- Identify unresolved product choices; do not convert ideas from reference
  screens into committed scope.

## Acceptance gate

- Audit includes evidence and baseline commands; no secrets are copied into
  documentation.
- Existing behavior that should be preserved is explicitly listed.
- No production feature code is changed in this build.
- The next build can begin without guessing the product's current state.

**References:** [MVP specification](../product/citeface-mvp-specification.md),
[repository audit worksheet](../audits/citeface-repository-audit-worksheet.md).

## Copilot execution prompt

```text
Execute Build 1 in Milestone M0 - Direction and foundation. Read milestones.md and this build, then inspect the repository, current worktree, routes, Prisma schema, tests, and existing UI before proposing changes. Run and record baseline checks. Produce an evidence-backed implemented/partial/schema-only/missing inventory, list behavior to preserve, UX gaps, environment blockers without exposing secrets, and unresolved decisions. Do not implement product features or claim a database model is a working feature. Stop at this build's acceptance gate.
```
