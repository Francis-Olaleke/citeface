# Build 4: Authentication and onboarding

**Milestone:** M1  
**Depends on:** Build 3  
**User stories:** AUTH-001, AUTH-002

## Outcome

Make registration, sign-in, session restoration, sign-out, and recovery clear
and reliable within the new UI.

## Scope

- Reuse existing auth routes and session security; audit before changing them.
- Redesign registration, login, forgot-password, and reset-password flows.
- Provide field-level validation, pending/success/error states, and safe retry.
- Route guests to public discovery and protected actions to sign-in without
  losing their return destination where safe.
- Do not expose whether an email address exists in recovery responses.

## Acceptance gate

- Authenticated and guest route behavior remains correct after refresh.
- Keyboard and mobile form flows work; password visibility is not sent to logs.
- API authorization remains the source of truth.
- Existing auth and password-reset tests pass.

**References:** [MVP specification](../product/citeface-mvp-specification.md),
[auth routes](../../apps/api/src/modules/auth/auth.routes.ts).

## Copilot execution prompt

```text
Execute Build 4 in Milestone M1 - Researcher identity. Confirm Build 3 is complete, inspect current auth API/session behavior, and reuse it unless evidence shows a defect. Implement the responsive registration, sign-in, session-restoration, sign-out, and recovery UX with accessible validation and explicit pending/success/error/retry states. Do not weaken cookie/session security or reveal account existence. Add focused tests, run auth integration tests and web typecheck/build, and verify this build's M1 acceptance gate.
```
