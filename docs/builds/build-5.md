# Build 5: Researcher profiles

**Milestone:** M1  
**Depends on:** Build 4  
**User stories:** PROFILE-001, PROFILE-002

## Outcome

Give each member a useful professional research identity without implying
unearned verification or scientific authority.

## Scope

- Redesign profile view/edit and public researcher page using current profile
  APIs where they satisfy the requirements.
- Support display name, username, headline, biography, location, website,
  affiliation, ORCID, and profile image as optional/validated fields.
- Explain the meaning and limits of verification indicators.
- Ensure profile story lists use the central story visibility policy.
- Keep messaging and unsupported academic metrics out of the MVP UI.

## Acceptance gate

- Owners can update their profile; visitors see only intended public fields.
- Image upload/removal has visible progress and recovery states.
- No profile or story query exposes private draft data.
- Profile API tests and responsive/accessibility checks pass.

**References:** [researcher routes](../../apps/api/src/modules/researchers/researchers.routes.ts),
[design reference](../product/design-reference-and-product-architecture.md).

## Copilot execution prompt

```text
Execute Build 5 in Milestone M1 - Researcher identity. Confirm Build 4's auth gate, inspect profile schema/routes/UI, and reuse existing functionality. Implement the profile view/edit UX and public researcher page for approved fields, with clear distinction between user-provided and platform-checked claims. Keep profile story lists audience-aware; do not add messaging or unsupported academic metrics. Add authorization and responsive/accessibility tests, run profile tests and web checks, and report M1 gate evidence.
```
