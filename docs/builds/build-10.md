# Build 10: Sources, authorship, and rights

**Milestone:** M2  
**Depends on:** Builds 7 and 8  
**User stories:** PUB-014, PUB-015, PUB-016

## Outcome

Make provenance and contributor attribution clear and responsibly represented.

## Scope

- Design source/DOI/URL fields and author-confirmed imported metadata.
- Support ordered contributors, roles, affiliation text, and corresponding
  author where supported by the model.
- Capture publisher authority-to-list-contributors attestation and content
  rights confirmation as version-bound, auditable records.
- Explain that a DOI or profile verification is not proof of peer review or
  scientific validity.
- Keep contributor/source visibility inherited from the parent story.

## Acceptance gate

- Publication requires at least one contributor and required rights confirmation.
- Contributor order/roles survive save, edit, and publish.
- Changes to a published contributor list require renewed attestation.
- API validation, version history, and privacy tests pass.

**References:** [publishing acceptance criteria](../product/publishing-acceptance-criteria.md),
[publishing data model](../architecture/publishing-data-model.md).

## Copilot execution prompt

```text
Execute Build 10 in Milestone M2 - Publishing. Confirm Build 7/8 contracts and inspect existing source, author, version, and audit models. Implement source/DOI confirmation, ordered contributors/roles, publisher authority attestation, and rights confirmation with clear review UX. Do not imply DOI or verification proves scientific validity, and do not claim co-author approval. Make contributor changes versioned and auditable; add focused persistence/authorization tests and report M2 gate evidence.
```
