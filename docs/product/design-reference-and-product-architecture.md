# Citeface — Product Architecture and Design References

**Status:** Product direction / planning reference
**Product:** Citeface

## 1. Purpose of this document

This document records the visual and product references supplied during Citeface planning. These references inform product direction; they are not specifications to copy exactly. Citeface must develop its own coherent identity, interaction model and accessible interface.

## 2. Product positioning

Citeface is a researcher-first social and knowledge platform. It connects research communication, scientific discovery and professional relationships.

Its three central pillars are:

1. **Share research:** publish research stories, short videos, photographs, paper announcements and methods posts.
2. **Discover knowledge:** explore research topics, publications, research hubs and scientific discussions.
3. **Build research relationships:** establish professional identities, find researchers and collaborators, and access relevant opportunities.

A Citeface post is not automatically a scientific publication, peer-reviewed output or validation of a scientific claim.

## 3. Supplied visual references

### Reference A — Researcher profile

The supplied researcher-profile reference illustrates:
- researcher name, professional title and affiliation;
- location and biography;
- research interests, disciplines and skills;
- research activity and publications;
- citation count and h-index;
- shared connections;
- follow and message actions.

**Product implication:** Citeface profiles should function as professional research identities, not merely generic social profiles.

**Scope note:** the "message" action is not an MVP commitment (direct messages are out of scope). Profile story lists are audience-aware and never include drafts.

**Trust requirement:** academic metrics such as citations and h-index should only be presented with clear source attribution. User-entered metrics must not be represented as independently verified.

### Reference B — Research discovery feed

The supplied research-discovery reference illustrates:
- research hubs and disciplines;
- Trending, Discussed, Newest and Top feed filters;
- research contributions and scientific discussions;
- voting, ratings and comments;
- trending users and latest community activity.

**Product implication:** Citeface should support topic-based research discovery and discussion, not rely only on a single chronological social feed.

**Trust requirement:** votes, ratings and engagement are community signals. They must not be presented as proof of scientific validity or research quality.

**MVP scope:** a single appreciation action only; voting and ratings are not in the MVP until their meaning is decided.

### Reference C — Researcher-first social dashboard

The supplied Citeface/ResearchSphere-style dashboard reference illustrates:
- a left navigation for Home, Discover, My Network, Messages, Saved and Research Library;
- research publishing controls for photos, videos, paper links and methods;
- a central research feed;
- researcher identity and verification indicators;
- trending research topics;
- recommended researchers;
- appreciation, discussion, saving and sharing;
- an events panel.

**Product implication:** the interface should bring professional networking and social research discovery together, with publishing as a prominent action.

**Scope note:** messaging, communities and events require separate MVP decisions. Their appearance in a visual reference does not automatically make them first-release commitments.

## 4. Proposed product domains

The long-term product may be organized around these domains:

1. Social publishing and media.
2. Research discovery and research hubs.
3. Professional researcher identity.
4. Networking and collaboration.
5. Funding and grants.
6. Jobs and research opportunities.
7. Research library and knowledge tools.
8. Organizations, institutions and partnerships.
9. Notifications and messaging.
10. Trust, safety, moderation and research integrity.
11. Analytics and subscriptions.

These are product domains, not a commitment to implement every domain in the first MVP.

## 5. Proposed navigation direction

Initial navigation concepts:
- Home
- Discover
- My Network
- Research Hubs
- Research Library
- Opportunities
- My Profile

Messages, Communities, Events, Funding and Collaboration should be added to navigation only when their release scope and user journeys are approved.

## 6. Research hubs

A research hub is a topic- or discipline-based discovery space. Examples for early information architecture exploration include Molecular Biology, Genomics, Microbiology, Biotechnology, Public Health, Artificial Intelligence, Agricultural Science and Environmental Science.

A hub may eventually contain relevant research stories, videos, publications, discussions and researcher profiles. The initial taxonomy and hub-management rules remain to be specified.

## 7. Profile and credibility principles

- Distinguish user-provided profile information from platform-verified information.
- Make verification badges explain what was checked and by whom.
- Attribute academic metrics to their data source and retrieval date where applicable.
- Do not infer peer review or scientific validity from the presence of a DOI.
- Keep researcher identity, institutional affiliation and publication records distinct data concepts.

## 8. Discovery and engagement principles

- Provide useful discovery filters such as Trending, Discussed, Newest and Top only when their ranking definitions are documented.
- Explain or internally define what drives trending and top rankings.
- Distinguish popularity and community feedback from scientific evidence.
- Support meaningful discussion and source inspection rather than optimizing only for vanity metrics.
- Design feed and discovery experiences for mobile and desktop.

## 9. Scope discipline

The visual references contain capabilities that may exceed the first MVP. Each feature must be classified as:
- first-release requirement;
- later expansion;
- long-term direction;
- or reference-only pending validation.

Do not implement a feature solely because it appears in a screenshot.

## 10. Decisions still required

| Decision | Classification |
|---|---|
| Exact navigation for the first release | Required before MVP implementation |
| Definitions for Trending, Discussed and Top (recent-first until defined) | Required before those filters are shown |
| Whether voting is included and what votes mean | Safe to decide during the feed/engagement build; MVP uses appreciation only |
| Verification categories, evidence and review process | Safe to decide during the profile build |
| Whether citation/h-index metrics are shown and from which source | Safe to decide during the profile build; deferred by default |
| Whether shared/mutual connections are in the MVP | Explicitly deferred |
| Research hub creation, ownership, moderation and taxonomy | Explicitly deferred (MVP uses seeded categories) |
| Scope of messaging, events and communities | Explicitly deferred |
