# Build 3: UI system and application shell

**Milestone:** M0  
**Depends on:** Build 2  
**User stories:** UX-002

## Outcome

Create the accessible visual foundation and reusable application shell for the
new UI/UX.

## Scope

- Establish design tokens for color, type, spacing, borders, focus, elevation,
  and responsive breakpoints using the existing Citeface identity.
- Implement reusable buttons, fields, cards, badges, dialogs, alerts, skeletons,
  and empty/error states using existing React/TypeScript patterns.
- Define responsive navigation and authenticated/guest shells.
- Add keyboard, focus-visible, reduced-motion, contrast, and touch-target
  behavior.
- Preserve working routes and avoid adding UI dependencies unless justified.

## Acceptance gate

- Components have consistent states and semantic labels.
- Shell works at mobile, tablet, and desktop sizes without horizontal overflow.
- Keyboard-only users can navigate the shell and identify focus.
- Web typecheck and production build pass; existing tests remain green.

**References:** [design reference](../product/design-reference-and-product-architecture.md),
[UI/UX brief](../design/ui-ux-implementation-brief.md).

## Copilot execution prompt

```text
Execute Build 3 in Milestone M0 - Direction and foundation. Verify the approved Build 2 navigation first. Inspect existing React components, CSS, routes, and design tokens; implement the smallest reusable accessible UI system and responsive app shell that supports the approved page map. Preserve working routes and behavior, avoid new dependencies unless justified, and include keyboard/focus/reduced-motion/responsive states. Add focused tests or browser checks, run web typecheck and production build, and report exact evidence against the M0 exit gate.
```
