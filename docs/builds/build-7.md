# Build 7: Publishing domain and composer

**Milestone:** M2  
**Depends on:** Builds 3 and 5  
**User stories:** PUB-001, PUB-002, PUB-005, PUB-006

## Outcome

Provide one understandable authoring entry point that adapts to the five
approved research content types.

## Scope

- Reconcile the current ResearchStory schema with STORY, VIDEO, PHOTO, PAPER,
  and METHODS product types; document required migrations before coding.
- Design a progressive composer with title, summary, research context, type,
  topics, sources, and media affordances as appropriate.
- Explain that a Citeface post is not automatically a formal publication.
- Keep optional information optional and show field limits.
- Do not add a separate `domain.js`; use TypeScript contracts and the Prisma
  schema as the implementation sources of truth.

## Acceptance gate

- Every content type has a defined form, validation, and preview behavior.
- UI and API contracts agree; no unsupported type can be submitted.
- Required decisions are resolved before schema/API changes.
- Focused domain and form tests pass.

**References:** [publishing specification](../product/publishing-specification.md),
[domain map](../architecture/domain-map.md).

## Copilot execution prompt

```text
Execute Build 7 in Milestone M2 - Publishing. Read the canonical publishing specification and PUB stories, then inspect current story schema, API contracts, composer, and tests. Reconcile the five product content types with existing implementation and propose required migrations/contracts before coding. Implement the adaptive composer only for approved types and fields; keep optional fields optional and explain provenance accurately. Do not create a parallel domain.js or duplicate Prisma enums. Add focused contract/form tests and report unresolved decisions against the M2 gate.
```
