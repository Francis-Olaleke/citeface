# Build 13: Story detail experience

**Milestone:** M3  
**Depends on:** Builds 11 and 12  
**User stories:** DISC-003, PUB-013

## Outcome

Help readers understand a research story, its authors, media, status, and sources.

## Scope

- Design a readable story detail page with responsive media playback, captions,
  contributor order/roles, research sections, sources, and provenance labels.
- Link to researcher profiles and preserve a safe return to discovery.
- Show correction/retraction status prominently when present.
- Apply the shared visibility policy before returning any story, source, or media.
- Provide unavailable, not-found, loading, and retry states without leaking why
  restricted content is unavailable.

## Acceptance gate

- Public story content and media render for permitted viewers.
- Restricted/draft detail URLs disclose no metadata to unauthorized viewers.
- Keyboard, screen-reader, and small-screen reading/media behavior passes checks.
- Detail API and route tests pass.

**References:** [story detail implementation](../../apps/web/src/pages/StoryDetail.tsx),
[publishing specification](../product/publishing-specification.md).

## Copilot execution prompt

```text
Execute Build 13 in Milestone M3 - Discovery and community. Confirm Build 11 and 12 gates. Inspect story detail routes, types, and page components, then implement a readable responsive detail view for story sections, ordered contributors, sources, accessible media, and correction/retraction notices. Ensure unauthorized direct links return a generic unavailable state without metadata. Add route/API/accessibility tests and verify media playback and return-to-discovery behavior against the M3 gate.
```
