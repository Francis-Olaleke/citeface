# Citeface UI/UX Implementation Brief

**Audience:** Copilot and product/design contributors  
**Status:** Execution brief for Builds 2-3; later screens are specified in their
build files.

## Product experience

Design for **Discover -> Understand -> Engage -> Connect -> Return**. Citeface
is a research community, not a generic engagement feed. Research authorship,
research status, sources, and visibility must be understandable without
overwhelming readers.

## Navigation and page map

- **Guest:** Discover, Search, Story detail, Researcher profile, Sign in, Join.
- **Member:** Home/Discover, Create, My drafts, Network, Notifications, Profile.
- Keep Create prominent but do not require publishing to browse.
- Do not expose disabled Messages, Events, Opportunities, or AI destinations
  as if they were working MVP features.
- Use route-level loading, not-found, unavailable, empty, and retry states.

## Key screen behaviors

- **Feed:** mobile single column; desktop content column with optional side
  context. Show author, status/type, title/summary, media preview, and clear
  path to details. Avoid autoplay and undefined "trending" claims.
- **Composer:** progressive sections for content type, narrative, media,
  contributors/sources, rights, preview, and audience. Preserve entered values
  on errors. Draft always stays private until explicit publish confirmation.
- **Profile:** identity and research interests first; distinguish user-provided
  information from platform-checked claims.
- **Story detail:** readable text hierarchy, ordered authors, accessible media
  controls, sources, status and correction/retraction notices.
- **Engagement:** explain sign-in requirements and show optimistic updates only
  when errors can be rolled back.

## Visual and interaction system

- Keep the Citeface blue/orange identity while improving spacing, hierarchy,
  consistency, and content density.
- Define tokens and reusable React/TypeScript components before page-specific
  styling; avoid copying reference screenshots or mixing frameworks.
- Support keyboard operation, visible focus, semantic headings/labels,
  sufficient contrast, reduced motion, touch-friendly controls, and zoom.
- Use responsive layouts starting at 320px; no horizontal page overflow.
- Forms require inline validation plus a summary/error announcement where
  appropriate. Buttons show pending and disabled states.
- Media uses explicit controls; images require useful alt text, videos require
  a title/caption and must not autoplay with sound.

## Copilot design-to-code contract

For each UI build, first inspect existing components, route behavior, services,
and design tokens. Implement the smallest cohesive slice; do not invent backend
behavior or mock successful API responses. Add screenshots/browser checks when
available and report the tested viewport, route, state, and limitations.

**References:** [design reference](../product/design-reference-and-product-architecture.md),
[Build 2](../builds/build-2.md), [Build 3](../builds/build-3.md).
