# Build 6: Research interests and topic onboarding

**Milestone:** M1  
**Depends on:** Build 5  
**User stories:** PROFILE-003, DISC-001

## Outcome

Let members state what research they care about and use that information to
make discovery more relevant.

## Scope

- Define the initial seeded topic/discipline taxonomy and labels.
- Add an optional onboarding interest-selection step and profile edit path.
- Persist topic follows only after explicit user action.
- Explain skip/change behavior; do not require academic credentials.
- Keep recommendations deterministic and transparent; no AI ranking.

## Acceptance gate

- Users can skip onboarding and later edit interests.
- Selected topics persist and do not reveal private profile fields.
- Empty taxonomy, loading, save failure, and retry states are designed.
- API authorization and topic validation are tested.

**References:** [product strategy](../product/citeface-product-strategy-requirements-roadmap.md),
[domain map](../architecture/domain-map.md).

## Copilot execution prompt

```text
Execute Build 6 in Milestone M1 - Researcher identity. Confirm Build 5's profile gate. Inspect topic models and current taxonomy before adding or changing data. Implement optional interest selection, skip, persistence, and later editing with clear loading/empty/failure/retry states. Require explicit user choice, avoid academic-credential barriers, and do not invent recommendation ranking. Add tests for persistence, authorization, and skip behavior; verify the M1 exit gate.
```
