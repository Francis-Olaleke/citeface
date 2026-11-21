# Build 20: Beta, deployment, and launch gate

**Milestone:** M4  
**Depends on:** Build 19  
**User stories:** OPS-002

## Outcome

Release a controlled, supportable Citeface beta with clear rollback and feedback
paths.

## Scope

- Verify production environment variables, database migrations, media provider,
  webhook reachability, domains, cookies, HTTPS, and CORS.
- Document build/deploy/rollback, backup/restore, monitoring, support, and
  incident-response procedures.
- Prepare contributor onboarding, rights-cleared sample content, moderation
  staffing, and feedback capture.
- Define launch metrics and go/no-go owners; avoid treating registrations or
  views alone as product success.
- Keep native apps, paid plans, AI, and non-MVP modules deferred.

## Acceptance gate

- Staging smoke tests pass with production-like configuration.
- Rollback and restore procedures are rehearsed.
- Privacy, moderation, upload, and access-control release gates are signed off.
- Product owner makes an explicit go/no-go decision and records remaining risks.

**References:** [product roadmap](../product/citeface-product-strategy-requirements-roadmap.md),
[milestones](./milestones.md).

## Copilot execution prompt

```text
Execute Build 20 in Milestone M4 - Readiness and launch. Confirm Build 19's quality gate. Verify staging/production configuration, migrations, Cloudinary and HTTPS webhook reachability, cookies/CORS, deployment, rollback, restore, monitoring, support, and moderation readiness without printing secrets. Run production-like smoke tests and prepare an evidence-based go/no-go checklist. Do not claim launch readiness while a critical access, privacy, safety, or recovery gate is open; record residual risks for the product owner.
```
