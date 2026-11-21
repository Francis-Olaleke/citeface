# Build 16: Reactions, saves, and discussions

**Milestone:** M3  
**Depends on:** Builds 11, 13, and 15  
**User stories:** ENG-001, ENG-002, ENG-003, PUB-030, PUB-031

## Outcome

Enable meaningful, access-aware participation on research stories.

## Scope

- Provide the approved appreciation reaction, save/unsave, comments, and
  questions; distinguish question/discussion semantics in the UI.
- Enforce current parent-story access on every read and write.
- Provide report entry points and safe link sharing that never bypasses audience.
- Add validation, pagination, moderation/deleted states, and accessible feedback.
- Avoid vanity ranking or voting semantics not approved by product.

## Acceptance gate

- Members can interact only while authorized for the parent story.
- Private saves, comments, and restricted link previews do not leak story data.
- Duplicate reactions/saves and invalid comment operations are handled safely.
- API and UI tests cover signed-out and revoked-access cases.

**References:** [publishing user stories](../user-stories/README.md),
[MVP specification](../product/citeface-mvp-specification.md).

## Copilot execution prompt

```text
Execute Build 16 in Milestone M3 - Discovery and community. Confirm Build 11, 13, and 15 gates. Inspect existing interaction models/routes and implement only approved appreciation, save, comment, question, report-entry, and safe-share flows. Check current access to the parent story on every request; handle duplicate actions, validation, deleted/moderated content, and revoked access. Do not add voting or popularity ranking. Add focused API/UI tests and verify M3 privacy and usability gates.
```
