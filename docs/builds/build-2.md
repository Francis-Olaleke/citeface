# Build 2: User journeys and information architecture

**Milestone:** M0  
**Depends on:** Build 1  
**User stories:** UX-001

## Outcome

Define a coherent, researcher-first product structure before redesigning
individual screens.

## Scope

- Specify visitor, member, researcher/publisher, and moderator journeys.
- Define primary navigation and page hierarchy for mobile and desktop.
- Use the core journey: Discover -> Understand -> Engage -> Connect -> Return.
- Recommend Home/Discover, Create, My drafts, Network, Notifications, and Profile
  as first-release destinations; exclude non-MVP messaging and events.
- Document route transitions, access states, back/close behavior, and entry
  points to publishing.
- Mark decisions that need product approval instead of inventing policy.

## Acceptance gate

- Each MVP journey has a start, key screens, success state, and recovery path.
- Navigation labels and route intents are consistent across viewport sizes.
- Draft/private/restricted content states are distinguished from public pages.
- Every planned screen maps to a user story and later build.

**References:** [product strategy](../product/citeface-product-strategy-requirements-roadmap.md),
[design reference](../product/design-reference-and-product-architecture.md).

## Copilot execution prompt

```text
Execute Build 2 in Milestone M0 - Direction and foundation. Confirm Build 1's baseline evidence, then map visitor, member, researcher/publisher, and moderator journeys to existing and planned routes. Produce an implementable navigation/page map for mobile and desktop, including entry, success, empty, loading, error, and recovery states. Use the approved Citeface product promise; flag unresolved decisions instead of inventing policy. Do not code screens in this information-architecture build. Check every journey against the user-story catalog and stop at this build's acceptance gate.
```
