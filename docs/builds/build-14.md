# Build 14: Search and discovery filters

**Milestone:** M3  
**Depends on:** Builds 12 and 13  
**User stories:** DISC-004

## Outcome

Let readers find relevant research without exposing restricted stories in search
results or metadata.

## Scope

- Define basic search across published stories and public researcher profiles.
- Add approved filters such as classification/type, topic, and date only when
  the data and interaction are defined.
- Use URL-backed query state, clear/remove-filter controls, and empty/no-match UX.
- Authorize before computing snippets, counts, autocomplete, and facets.
- Defer semantic/AI search and undefined popularity rankings.

## Acceptance gate

- Search results, counts, snippets, and filters obey audience permissions.
- Query validation, pagination, and cancellation/debounce behavior are bounded.
- Search is usable by keyboard and on mobile.
- API tests cover restricted-result non-disclosure.

**References:** [FR-16](../product/citeface-product-strategy-requirements-roadmap.md),
[MVP specification](../product/citeface-mvp-specification.md).

## Copilot execution prompt

```text
Execute Build 14 in Milestone M3 - Discovery and community. Confirm Build 12/13 gates. Inspect current query APIs and data indexes; implement basic story/researcher search and only approved filters with URL-backed state, pagination, and accessible no-results/clear-filter UX. Enforce visibility before results, snippets, autocomplete, counts, or facets are computed. Defer semantic/AI search and undefined rankings. Add tests proving restricted items never leak, then report M3 gate evidence.
```
