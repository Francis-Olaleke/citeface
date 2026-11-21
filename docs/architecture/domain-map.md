# Citeface Domain Map

This is the product/domain boundary map for implementation planning. It is not
a second schema. The Prisma schema and typed API contracts remain the technical
sources of truth; update this document when a material domain boundary changes.

## Domains

| Domain | Owns | Current repository evidence | Planned capability |
|---|---|---|---|
| Identity and access | User identity, credentials, sessions, roles, consent | `apps/api/src/modules/auth`, Prisma `User`, `Session`, `UserRole` | Complete account settings, consent UX, centralized authorization |
| Researcher identity | Public profile, affiliation, profile image, verification claims | `apps/api/src/modules/researchers`, Prisma profile/affiliation models | Interest management and verification workflow |
| Publishing | Story lifecycle, structured research narrative, contributors, sources | `apps/api/src/modules/stories`, `ResearchStory`, `StoryAuthor`, `StorySource` | Five product content types, versioned attestations, corrections/retractions UX |
| Media | Upload authorization, object metadata, processing, delivery, cleanup | `apps/api/src/modules/media`, `MediaAsset`, `StoryMedia` | Audience-aware signed delivery, retry/removal UX, robust operations |
| Discovery | Feed, story detail, query/filter, ranking | Story feed/detail routes and web pages | Search, topic discovery, accessibility and performance |
| Network | Researcher and topic follow relationships | Prisma `UserFollow`, `UserTopicFollow` | API/UI flows and access revocation on unfollow |
| Engagement | Appreciation, comments, questions, saves, shares | Prisma `StoryReaction`, `Comment`, `Question`, `SavedItem`, `ShareEvent` | API/UI, authorization, moderation and meaningful metrics |
| Notifications | Recipient-specific activity and delivery | Prisma `Notification`, `NotificationDelivery` | Read-time authorization, in-app activity UX, delivery policy |
| Trust and integrity | Reports, moderation, corrections, retractions, audit | Prisma report/action/correction/retraction/audit models | Role-protected workflows, visible notices, operational policy |
| Product operations | Product events, health, retention, deployment, support | API health routes, cleanup job, `ProductEvent` | Privacy-safe analytics, monitoring, recovery, release controls |

## Core entities and ownership

- `User` owns credentials and account state; never expose password/session
  secrets.
- `ResearcherProfile` extends public identity; optional claims and verification
  are not proof that a research claim is correct.
- `ResearchStory` belongs to one creator and owns its lifecycle, audience,
  research narrative, topics, source/contributor records, and engagement.
- `MediaAsset` belongs to its uploader; `StoryMedia` attaches it to a story.
  Draft ownership and published-story audience both govern delivery.
- `StoryAuthor` records listed contributor identity/order/role. An attestation
  records the publisher's authority; it is not co-author approval.
- `UserFollow` and `UserTopicFollow` express member choices and must be checked
  at request time for follower-only access.
- Interaction, notification, report, and audit records inherit access rules
  from their parent resource and recipient/actor permissions.

## Dependency and implementation rules

1. Keep the modular monolith; do not create microservices for these builds.
2. Keep media binaries outside PostgreSQL; persist metadata and storage keys.
3. Use TypeScript for domain helpers/contracts. Do not introduce a parallel
   `domain.js` or duplicate Prisma enums in an untyped model.
4. Centralize visibility and ownership policy, then call it from every read and
   mutation path; component hiding is not authorization.
5. Preserve unknown/unimplemented models as schema-only until routes, UI, and
   tests exist. A database model alone does not mean a product feature works.
6. Require migrations and tests for domain changes; never edit generated Prisma
   output as the source.

**References:** [Prisma schema](../../apps/api/prisma/schema.prisma),
[MVP specification](../product/citeface-mvp-specification.md),
[publishing data model](./publishing-data-model.md).
