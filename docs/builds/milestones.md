# Citeface Milestones

Milestones group the 20 execution builds into user-visible outcomes. They are
gates, not calendar estimates.

## M0 - Direction and foundation (Builds 1-3)

**Outcome:** An agreed product journey, prioritized UI/UX specification,
accessible design foundation, and a working application shell.

**Exit:** Existing implementation has been audited; navigation and responsive
page structure are documented; shared UI tokens/components are in place; the
web application builds and its primary routes have loading, empty, and error
states.

## M1 - Researcher identity (Builds 4-6)

**Outcome:** A member can register, return to a session, create a useful
researcher identity, and choose interests that inform discovery.

**Exit:** Authenticated and guest journeys are clear; profile edits and image
handling work; interest choices are persisted and validated; privacy controls
and accessible form feedback are tested.

## M2 - Publishing (Builds 7-11)

**Outcome:** A contributor can create private research content, add image or
video media, give accurate provenance/authorship, preview it, choose an
audience, and publish safely.

**Exit:** Draft ownership and media privacy are enforced server-side; uploads
and processing have recoverable states; rights and contributor attestations
are recorded; publication and every audience read path are authorized and
tested.

## M3 - Discovery and community (Builds 12-17)

**Outcome:** Readers can find, understand, discuss, save, and follow relevant
research and researchers.

**Exit:** Feed, detail, search, follows, discussions, saves, and notifications
respect current access permissions; responsive and keyboard flows work; empty
and failure states do not strand users.

## M4 - Readiness and launch (Builds 18-20)

**Outcome:** Citeface can operate a safe, observable, supportable beta.

**Exit:** Reporting and moderation have auditable paths; security, accessibility,
performance, and recovery checks pass; deployment and rollback are documented;
the release gate has an explicit go/no-go decision.

## Cross-milestone rules

- PUBLIC, MEMBERS, and FOLLOWERS access decisions are server-side; the UI is
  never the security boundary.
- Drafts and unpublished media remain author-only, including for administrative
  roles unless a separately approved policy changes that rule.
- Do not add messaging, AI research processing, or institutional services
  without an approved scope change.
- A milestone may be accepted only with test evidence and known limitations
  recorded.
