# Build 12: Discovery feed

**Milestone:** M3  
**Depends on:** Builds 3 and 11  
**User stories:** DISC-002

## Outcome

Make the landing experience useful for signed-out readers and returning members.

## Scope

- Design the responsive discovery feed with video-first identity and first-class
  image stories.
- Include pagination, clear content/status labels, researcher attribution, and
  meaningful media previews.
- Use recent-first ordering until ranking definitions for Trending/Top are
  approved.
- Ensure every feed query applies current visibility, moderation, creator
  status, and deletion rules.
- Provide useful signed-out, empty, loading, and error experiences.

## Acceptance gate

- Feed never exposes restricted or draft content through rows, totals, or
  previews.
- Pagination remains stable and accessible.
- Media cards load safely on mobile and desktop.
- Feed API tests and browser flow checks pass.

**References:** [product strategy](../product/citeface-product-strategy-requirements-roadmap.md),
[stories routes](../../apps/api/src/modules/stories/stories.routes.ts).

## Copilot execution prompt

```text
Execute Build 12 in Milestone M3 - Discovery and community. Confirm Build 3 and 11 gates. Inspect the current feed API and dashboard before redesigning the responsive feed with video-first identity, image stories, clear author/status, pagination, and meaningful loading/empty/error states. Keep ordering recent-first until ranking rules are approved. Apply server-side visibility and moderation filters before counts/previews. Add API/UI tests and browser checks at mobile and desktop sizes; report M3 gate evidence.
```
