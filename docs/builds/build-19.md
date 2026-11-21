# Build 19: Product-wide quality and observability

**Milestone:** M4  
**Depends on:** Builds 14, 17, and 18  
**User stories:** OPS-001

## Outcome

Verify the end-to-end product journey and make failures measurable and recoverable.

## Scope

- Add or complete integration/browser coverage for guest discovery, auth,
  profile, draft, media, publish, restricted access, discussion, and moderation.
- Audit keyboard and screen-reader semantics, contrast, responsive layouts,
  reduced motion, and media controls.
- Measure feed/search/API performance and upload failure/retry behavior.
- Add privacy-safe operational events and error reporting; never log secrets,
  passwords, draft content, or restricted previews.
- Define retention, cleanup, backup, restore, and support runbooks.

## Acceptance gate

- Critical journeys pass automated and manual browser checks.
- Typechecks, tests, production build, dependency audit, and agreed thresholds
  have recorded outcomes.
- Observability captures actionable failures without sensitive payloads.
- Known risks have owners and explicit release decisions.

**References:** [MVP acceptance criteria](../product/publishing-acceptance-criteria.md),
[repository audit worksheet](../audits/citeface-repository-audit-worksheet.md).

## Copilot execution prompt

```text
Execute Build 19 in Milestone M4 - Readiness and launch. Confirm Builds 14, 17, and 18 gates. Test the actual end-to-end journeys across guest, member, publisher, and moderator roles; add focused browser/integration coverage for remaining critical gaps. Audit responsive behavior, accessibility, performance, privacy-safe logs/events, uploads, backups, and recovery. Run repository typechecks, tests, and production builds; report exact commands/results, pre-existing failures, thresholds, and risks. Do not conceal failures or log secrets/restricted content.
```
