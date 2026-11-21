# Citeface Build Plan

This directory is the execution plan for the next product and UI/UX increments.
Build 0 remains the repository foundation reference. Builds 1-20 are ordered,
small-enough implementation increments; the machine-readable index is
[`build-plan.json`](./build-plan.json).

## How Copilot should execute a build

1. Read the selected build, its dependencies, the linked user stories, and the
   referenced product/architecture decisions.
2. Inspect the current code and tests before changing anything. Reuse working
   code; a build is not permission to rewrite unrelated modules.
3. Implement only that build's scope. Treat its acceptance criteria as the
   completion gate. Do not silently decide unresolved product or privacy rules.
4. Add or update focused tests, run the smallest relevant test/typecheck/build
   commands, and report exact outcomes and blockers.
5. Do not start a later build until the current build's gate passes or the user
   explicitly accepts a documented exception.

Run `node scripts/validate-build-plan.mjs` from the repository root to verify
that all 20 build files and dependency references are present.

## Milestones

See [`milestones.md`](./milestones.md) for goals and exit criteria. The user
story catalog and domain map are in [`../user-stories/README.md`](../user-stories/README.md)
and [`../architecture/domain-map.md`](../architecture/domain-map.md).

## Build index

| Build | Focus | Milestone |
|---|---|---|
| 1 | Repository and product baseline | M0 - Direction and foundation |
| 2 | User journeys and information architecture | M0 - Direction and foundation |
| 3 | UI system and application shell | M0 - Direction and foundation |
| 4 | Authentication and onboarding | M1 - Researcher identity |
| 5 | Researcher profiles | M1 - Researcher identity |
| 6 | Research interests and topic onboarding | M1 - Researcher identity |
| 7 | Publishing domain and composer | M2 - Publishing |
| 8 | Private drafts | M2 - Publishing |
| 9 | Image/video upload and playback | M2 - Publishing |
| 10 | Sources, authorship, and rights | M2 - Publishing |
| 11 | Publication and audience authorization | M2 - Publishing |
| 12 | Discovery feed | M3 - Discovery and community |
| 13 | Story detail experience | M3 - Discovery and community |
| 14 | Search and discovery filters | M3 - Discovery and community |
| 15 | Researcher/topic network | M3 - Discovery and community |
| 16 | Reactions, saves, and discussions | M3 - Discovery and community |
| 17 | Notifications and activity | M3 - Discovery and community |
| 18 | Trust, safety, and research integrity | M4 - Readiness and launch |
| 19 | Product-wide quality and observability | M4 - Readiness and launch |
| 20 | Beta, deployment, and launch gate | M4 - Readiness and launch |

Builds describe intended work, not claims that a feature is missing. In each
build, Copilot must distinguish implemented, partial, schema-only, and missing
work using repository evidence.
