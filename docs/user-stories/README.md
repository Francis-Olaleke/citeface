# Citeface User Story Catalog

This catalog is the cross-domain index for the 20-build plan. Detailed,
authoritative publishing stories and acceptance criteria remain in
[`../product/publishing-user-stories.md`](../product/publishing-user-stories.md)
and [`../product/publishing-acceptance-criteria.md`](../product/publishing-acceptance-criteria.md).
Do not fork or silently contradict those canonical publishing requirements.

| ID | User need | Primary build |
|---|---|---:|
| FOUNDATION-001 | As the product team, I need a verified baseline so that changes preserve working behavior. | 1 |
| UX-001 | As a visitor or member, I need clear journeys and navigation so that I can find the next useful action. | 2 |
| UX-002 | As any user, I need a responsive, accessible interface so that I can use Citeface across devices and input methods. | 3 |
| AUTH-001 | As a visitor, I need to register and recover access so that I can participate. | 4 |
| AUTH-002 | As a member, I need a reliable session and sign-out so that my account remains usable and controlled. | 4 |
| PROFILE-001 | As a researcher, I need a professional public profile so that readers can understand who I am. | 5 |
| PROFILE-002 | As a member, I need to edit my profile and image so that my identity stays current. | 5 |
| PROFILE-003 | As a member, I need to choose research interests so that I can shape discovery. | 6 |
| DISC-001 | As a new member, I need to select or skip topic interests so that onboarding remains useful and optional. | 6 |
| DISC-002 | As a reader, I need a relevant feed so that I can discover research across formats. | 12 |
| DISC-003 | As a reader, I need story details, media, contributors, and sources so that I can understand what is being presented. | 13 |
| DISC-004 | As a reader, I need search and filters so that I can find relevant stories and researchers. | 14 |
| NET-001 | As a member, I need to follow researchers so that I can return to their work. | 15 |
| NET-002 | As a member, I need to follow topics so that discovery reflects my interests. | 15 |
| ENG-001 | As a reader, I need to appreciate a story so that I can acknowledge useful work. | 16 |
| ENG-002 | As a reader, I need to ask a question or comment so that I can engage substantively. | 16 |
| ENG-003 | As a member, I need to save and safely share stories so that I can revisit or recommend them. | 16 |
| NOTIF-001 | As a member, I need relevant activity notifications so that I can return to conversations and followed work. | 17 |
| TRUST-001 | As a reader, I need to report concerning content so that it can be reviewed. | 18 |
| TRUST-002 | As a moderator, I need an authorized, auditable review process so that I can act consistently. | 18 |
| OPS-001 | As the product team, I need measurable, privacy-safe quality checks so that beta readiness is evidence-based. | 19 |
| OPS-002 | As an operator, I need repeatable deployment and recovery steps so that launch is supportable. | 20 |

## Canonical publishing story mapping

The existing `PUB-*` story identifiers remain canonical; this is their build
crosswalk, not a second copy of their full acceptance criteria.

| Existing story IDs | Build |
|---|---:|
| PUB-001, PUB-002, PUB-005, PUB-006 | 7 |
| PUB-007 through PUB-010 | 8 |
| PUB-003, PUB-004, PUB-017, PUB-018 | 9 |
| PUB-014, PUB-015, PUB-016 | 10 |
| PUB-011, PUB-012, PUB-019 through PUB-022 | 11 |
| PUB-013 | 13 |
| PUB-023, PUB-024 | 18 |
| PUB-030, PUB-031 | 16 |
| PUB-025 through PUB-029 | Deferred; do not implement without approval |

## Execution rule

Every implementation PR should name the build and story IDs it satisfies,
include focused acceptance evidence, and identify any story that is deferred,
blocked, or changed by an approved product decision.
