# CITEFACE
## Product Strategy, Requirements & Master Roadmap

Version: 1.1  
Date: 4 November 2026  
Status: Foundational product reference  
Positioning: Research. Connect. Discover.

---

## 1. Executive summary

Citeface is a global research social discovery and knowledge-sharing platform designed to make research easier to share, discover, understand and connect around.

It combines short-form research videos, image-slide research stories, accessible research explanations, researcher profiles, community interaction and professional discovery. It is not simply an article repository or researcher directory. Its central experience is:

**Discover → Understand → Engage → Connect → Return.**

Citeface will accommodate every research discipline. Its initial community-building and content acquisition focus will be **Life Sciences, Health Research and Engineering-related Research**, while registration and participation remain open to all disciplines.

Short research videos will lead the content experience. Image-slide stories and graphical abstracts will be supported from the first meaningful release. Open registration, optional researcher verification, clear source and publication-status labels, private drafts and moderation will support an accessible but trustworthy community.

The immediate objective is to build a useful, safe and reliable core experience before introducing professional opportunities, institutional services, premium subscriptions or AI research intelligence.

## 2. Vision, mission and product promise

### Vision
To become a global digital community where research, knowledge and innovation are accessible, discoverable and connected.

### Mission
To make research more accessible and engaging by empowering researchers and knowledge seekers to share discoveries, communicate ideas, exchange knowledge and build meaningful professional relationships.

### Product promise
Make research sharing feel as easy as posting on a social network while keeping authorship, sources, context and research integrity visible.

### Positioning
Citeface is a research social discovery and knowledge-sharing platform that connects people with research through short videos, visual stories, discussions and professional relationships.

## 3. The problem

Research knowledge can be difficult to discover, understand and engage with outside conventional academic channels. Researchers may have valuable findings but lack accessible ways to communicate them. Students and early-career researchers may struggle to discover relevant work, identify researchers and build professional relationships.

Citeface addresses:
1. Research discoverability across disciplines and institutions.
2. The difficulty of communicating specialist research accessibly.
3. Limited opportunities for meaningful questions and discussion.
4. Professional isolation and difficulty finding relevant researchers.
5. The lack of everyday reasons to return to platforms that focus only on publication deposits.

Citeface must provide value to readers as well as contributors.

## 4. Target users and initial community

### Primary users
- Researchers, academics, lecturers, scientists and principal investigators.
- Postgraduate students, PhD candidates, research interns and early-career researchers.
- Research readers, students, educators and science communicators.
- Universities, laboratories, research centres and scientific organisations (later organisational features).

### Initial community-building focus

**Life Sciences**
- Molecular biology, microbiology, genetics, genomics, biotechnology, biochemistry, cell biology, ecology, agricultural sciences and related fields.

**Health Research**
- Public health, biomedical sciences, infectious diseases, epidemiology, clinical research, pharmaceutical sciences, medical biotechnology and health technology.

**Engineering-related Research**
- Computer, electrical, electronic, mechanical, civil, chemical, biomedical, materials and environmental engineering, renewable energy and related fields.

These are acquisition priorities, not participation restrictions. Citeface must remain open to other disciplines, including social sciences, arts, humanities, education, law and economics.

### Geography
Citeface will be globally accessible from its first release, with community-building focused on Nigeria, other African research communities and international participation. Global accessibility does not require equal marketing expenditure across all markets at launch.

### Access model
Adopt open registration with optional researcher identity or affiliation verification. Readers should not need academic credentials to join. Verification indicates that an identity or affiliation was checked; it does not validate every scientific claim or publication associated with that account.

## 5. Product philosophy and core experience

The product experience is:

1. **Discover:** Encounter research stories, videos, visual explanations, researchers and topics.
2. **Understand:** Learn through accessible explanations, sources and visual presentations.
3. **Engage:** Appreciate content, ask questions and participate in discussion.
4. **Connect:** Follow researchers and topics and build professional relationships.
5. **Return:** Revisit for new discoveries, followed content, conversations and eventually opportunities.

The product should encourage meaningful engagement rather than empty scrolling or vanity metrics.

## 6. Content strategy

### Video-first research discovery
Short research videos lead the content identity. Initial formats include video abstracts, research explainers, findings, laboratory demonstrations, scientific processes and short project presentations.

### Image-slide research stories
Supported from the first meaningful release. Formats include graphical abstracts, infographics, diagrams, charts, illustrations and multi-image presentations. Video must not be compulsory.

### Content types and video duration
The first release supports five content types: STORY (written research explanations), VIDEO, PHOTO (images and image-slide stories), PAPER (paper announcements) and METHODS. Video leads the feed identity; other types are first-class. Short videos are 90-300 seconds inclusive, validated from trusted media metadata.

### Research story information
A story may include:
- Title and short description.
- Discipline, topic and category.
- Content format.
- Research question or background.
- Method or approach.
- Findings or observations.
- Significance or implications.
- Contributors and roles.
- References and source links.
- Publication or research status.
- Optional media.

Not every field is mandatory for every story type. The composer should be adaptable across disciplines.

### Content status
Distinguish peer-reviewed publication, preprint, thesis/dissertation, research report, conference presentation, ongoing project, author-described research and educational/explanatory content. 

A DOI or URL provides provenance but does not independently validate every claim.

Research status is descriptive metadata supplied by the author or confirmed from an appropriate source. It must remain distinct from Citeface account verification and must not imply independent scientific validation by Citeface.

## 7. Product modules

1. **Identity and authentication:** registration, login, logout, recovery, sessions and account settings.
2. **Profiles:** display name, username, biography, interests, affiliation, location, links, verification and stories.
3. **Research publishing:** create, edit, draft, publish, media, sources, contributors and status.
4. **Discovery and feed:** video-first feed, image-slide stories, story previews, topics and followed content.
5. **Community:** appreciation, questions, comments, follows, saves, sharing and notifications.
6. **Search:** stories, researchers, topics, disciplines and filters.
7. **Trust and safety:** reporting, moderation, corrections, retractions, copyright, privacy and audit history.
8. **Administration and analytics:** moderation tools, essential product events and operational monitoring.

Future modules include opportunities, institutions/labs, advanced networking, analytics, AI research discovery and premium services.

## 8. Functional requirements

- **FR-01 Registration:** Users can create accounts with validated required fields.
- **FR-02 Authentication:** Users can log in and log out; protected operations require authentication.
- **FR-03 Profiles:** Users can create and update profiles; optional personal information is not unnecessarily compulsory.
- **FR-04 Story creation:** Authenticated users can create research stories of type STORY, VIDEO, PHOTO, PAPER or METHODS.
- **FR-05 Media upload:** Supported short videos and images can be uploaded with file-type and size validation.
- **FR-06 Drafts:** Authenticated users can create, save, reopen, edit, update, delete and publish their own drafts. Drafts persist across sessions and devices and are accessible only to their authors. Drafts must remain private regardless of their intended publication audience and must be excluded from feeds, profiles, search, recommendations, notifications and unauthorized API or media access. Server-side ownership authorization is required for every draft operation.
- **FR-07 Publication:** Authenticated users can publish completed stories after server-side validation. Every new story defaults to the PUBLIC audience. Authors can select PUBLIC, MEMBERS or FOLLOWERS before publication and can change the audience of their published stories. PUBLIC stories are accessible to everyone, including signed-out visitors. MEMBERS stories are accessible only to authenticated Citeface users. FOLLOWERS stories are accessible only to authenticated users who follow the author. Audience permissions must be enforced server-side across all relevant access paths.
- **FR-08 Attribution:** At least one contributor is required to publish. The publisher attests to authority to list contributors (not individual co-author approval) and confirms rights and permissions. Contributor names, order and roles are recorded in versioned contributor lists; the attestation is bound to the version it covers, and changing a published list requires renewed attestation.
- **FR-09 Feed:** Users can discover published stories in a feed supporting video and image-slide formats.
- **FR-10 Story detail:** Story details include content, contributors, sources and status.
- **FR-11 Follow researchers:** Users can follow/unfollow researchers.
- **FR-12 Follow topics:** Users can follow research interests/topics.
- **FR-13 Appreciation:** Users can appreciate/react to stories.
- **FR-14 Discussion:** Users can ask questions and comment.
- **FR-15 Saves:** Users can save/unsave stories.
- **FR-16 Search:** Users can search stories and researcher profiles.
- **FR-17 Sharing:** Users can share stories through appropriate in-platform and external sharing mechanisms. Public stories can be shared with anyone, including signed-out visitors. Sharing a restricted story must never bypass its audience permissions. Shared links, previews and media must preserve the story's current access rules.
- **FR-18 Notifications:** Users receive relevant interaction and followed-content notifications. Previews and targets are re-authorized at read time and never preserve access after an audience change or unfollow.
- **FR-19 Reporting:** Users can report content and suspicious behaviour.
- **FR-20 Moderation:** Authorised moderators can review reports and take actions.
- **FR-21 Corrections/retractions:** Stories support visible correction and retraction workflows.
- **FR-22 Analytics:** Essential product and operational events are captured.
- **FR-23 Administration:** Authorised administrators can manage accounts and moderation.
- **FR-24 Audience management:** Authors can review and change the audience of their published stories. Audience changes must be authorized, validated, immediately enforced across all access paths and recorded in the audit history. Unfollowing an author must immediately revoke access to that author's FOLLOWERS stories.

## 9. Non-functional requirements

### Security
Secure password hashing, session management, server-side authorisation, input validation, common web vulnerability protections, upload validation, secrets management and administrative access controls.

Audience-based authorization must be enforced server-side for feeds, profiles, story details, search, recommendations, direct links, APIs, notifications, media delivery and caches. Frontend visibility controls alone are insufficient.

### Privacy
Protect unpublished drafts through strict author-only access. Enforce PUBLIC, MEMBERS and FOLLOWERS visibility rules for published stories. Prevent unauthorized access and information leakage through APIs, database queries, search indexes, previews, notifications, media URLs, storage and caches. Apply appropriate consent, data-minimization, confidentiality and retention/deletion protections.

### Performance
Responsive feed loading, optimised images, controlled video delivery, pagination, efficient queries and caching only where justified.

### Accessibility
Responsive layouts, readable typography, adequate contrast, keyboard access, captions/transcripts where practical and clear navigation/errors.

### Reliability
Backups, monitoring, logging, recovery procedures, automated tests and deployment checks.

### Scalability
Start with a modular monolith and relational database. Introduce distributed services only when measured operational needs justify them.

## 10. Research integrity, trust and safety

- Stories should provide sources/DOIs/URLs where applicable.
- Imported metadata must be confirmed by the responsible author.
- The publisher attests to authority to list contributors; record names, order and roles.
- Drafts remain private and must not leak through APIs, search or media URLs.
- Clearly distinguish publication and research statuses.
- Corrections and retractions must be visible and auditable.
- Published stories may be archived/soft-deleted with audit history; retraction is a distinct status.
- Users must have rights or permissions for uploaded material; provide reporting/takedown procedures.
- Verification is not scientific validation.
- Do not send confidential or unpublished research to external AI providers without an explicit permission framework and reviewed privacy/security basis.
- Published stories support three audiences: PUBLIC, MEMBERS and FOLLOWERS. PUBLIC is the default.
- PUBLIC stories are accessible to everyone, including signed-out visitors.
- MEMBERS stories require an authenticated Citeface account.
- FOLLOWERS stories require an authenticated user with an active follow relationship with the author.
- Authors may change the audience of their published stories. Changes must take effect immediately and be recorded in the audit history.
- Audience restrictions apply to story content, media, previews, notifications, search results, feeds, profiles and shared links.
- Authors retain access to their own published stories regardless of audience.
- Unfollowing an author immediately revokes access to that author's FOLLOWERS stories.

- Contributor lists are versioned; attestation metadata is server-generated and tied to the list version it covers.
- Source metadata, contributor details, comments, reactions, saves, previews and notifications inherit the access rules of the parent story.
- Administrators and moderators do not automatically gain access to another user's drafts or draft media.

Citeface must distinguish corrections and retractions of content published on Citeface from corrections and retractions of external research papers referenced by Citeface posts.

## 11. MVP definition

The MVP is the smallest credible version that delivers the core promise. It must not be reduced to authentication plus an empty dashboard.

### MVP must-haves

**Identity**
- Registration, login, logout and basic account management.
- Researcher/member profiles and research interests.

**Publishing**
- Create/edit research stories.
- Draft and publish workflows.
- Five content types: STORY, VIDEO, PHOTO, PAPER and METHODS.
- Text explanations.
- Short-video upload and playback (90-300 seconds inclusive).
- Image upload and image-slide (PHOTO) stories.
- Rights and permissions confirmation and versioned contributor attestation.
- Categories, contributors, sources and status labels.
- Audience selection for published stories, with PUBLIC as the default and MEMBERS and FOLLOWERS as additional options.
- Audience changes for published stories, including immediate authorization updates and audit history.

**Discovery**
- Central feed with video-first presentation.
- Image-slide presentation.
- Story detail pages.
- Basic search and category filtering.

**Engagement**
- Follow researchers.
- Follow topics where feasible in the first MVP increment.
- Appreciate, save, comment/question and public sharing.

**Trust and operations**
- Private drafts, status/provenance, reporting, basic moderation, correction/retraction handling, audit history, essential analytics, monitoring, backups and security tests.
- Server-side draft ownership enforcement, private draft persistence, secure unpublished-media access, and tests confirming that unauthorized users cannot retrieve, modify, publish or delete another user's drafts.
- Server-side audience authorization across feeds, profiles, story details, search, recommendations, APIs, notifications, shared links and media delivery.
- Tests confirming that signed-out visitors can access PUBLIC stories, authenticated members can access MEMBERS stories, and only active followers can access FOLLOWERS stories.
- Tests confirming that audience changes and unfollowing immediately revoke access where required.
- Tests confirming that drafts and their media remain accessible only to their authors.

### Explicitly deferred
AI recommendation engines, semantic search, AI assistants, automated collaboration matching, DMs/group chats, complex reputation/gamification, institutional analytics, native apps, large-scale streaming infrastructure, advanced citation networks, paid subscriptions and extensive recruitment/opportunity systems.

## 12. Core user journeys

### Reader
Register or browse → select interests → discover video/slide story → open story and sources → appreciate/save/comment → follow researcher/topic → return.

### Contributor
Register → create profile → create story → add video or slides → add title, explanation, category, sources, status and contributor details → preview → select publication audience (PUBLIC, MEMBERS or FOLLOWERS) → save draft or publish → respond to engagement.

### Returning member
Log in → discover stories from followed researchers and topics → explore content available to their account → revisit saved stories → participate in discussions → receive relevant notifications → return for new research and conversations.

### Researcher discovery
Search topic → discover stories/researchers → inspect profile → follow → save relevant stories → participate in discussions → build relationships.

## 13. Master roadmap

Timelines are estimates, not commitments. Each phase has an evidence-based exit gate.
The audience feature must be included in the actual development and testing plan, not left as an implied requirement.

### Phase 0 — Product foundation
Finalise vision, users, initial communities, product principles, assumptions, risks, metrics, governance and architecture.  
**Exit:** scope and priorities are clear enough to guide validation and design.

### Phase 1 — User and market validation
Conduct approximately 15–30 interviews across researchers, students and readers; recruit about five founding contributors; prepare 20–30 permission-cleared sample stories; test video/slide preferences, publishing willingness and reasons to return.  
**Exit:** evidence supports the MVP or strategy is revised.

### Phase 2 — Design and MVP specification
Define information architecture, navigation, responsive wireframes, feed, profiles, publishing, media, search, discussion, moderation, user stories and acceptance criteria.  
**Exit:** core journeys are understood and usability-tested.

### Phase 3 — Technical foundation
Review the existing monorepo; finalise schema and API contracts; establish authentication/authorisation, media storage, environments, secrets, logging, tests, backups and deployment.  
**Exit:** foundation supports core workflows securely.

### Phase 4 — MVP development
- Sprint 1: identity, profiles, research story creation, private drafts, text publishing, audience selection, contributor/source/status data, rights confirmation, versioned authorship attestation and server-side ownership authorization.
- Sprint 2: short-video and image upload, image-slide stories, media presentation, audience-authorized media delivery, feed and story details.
- Sprint 3: follows, audience-aware discovery, appreciation, saves, questions/comments, sharing, notifications and basic search.
- Sprint 4: reporting, moderation, corrections/retractions, audience changes, audit history, analytics, monitoring, security, privacy and performance testing.

Sprint boundaries may change based on dependencies.  
**Exit:** complete journey from registration through discovery, publishing and meaningful engagement.

### Phase 5 — Closed beta
Invite a controlled cohort; support contributors; observe discovery/publishing; test media; collect feedback; review moderation and return behaviour. Experimental targets: 50–100 invitees, 15–30 active contributors and 20–30 cleared stories. These are not proof of product-market fit.  
**Exit:** core tasks work, safety processes function and recurring value can be assessed.

### Phase 6 — Public launch and community growth
Open registration; develop Nigeria/Africa/international outreach; engage universities and labs; establish ambassador/content programmes; improve onboarding, feed, search, notifications and low-bandwidth performance.  
**Exit:** sustainable acquisition, repeat participation and useful content growth.

### Phase 7 — Advanced discovery and networking
Topic communities, advanced researcher discovery, better search, collections, notifications, connection tools, collaboration interest and recommendations.  
**Exit:** demonstrable improvement in discovery and connections.

### Phase 8 — Professional opportunities
Jobs, grants, fellowships, scholarships, internships, conferences, workshops, competitions, collaborations and institutional recruitment.  
**Exit:** credible audience and demonstrated demand.

### Phase 9 — Citeface Intelligence
Semantic search, related research, source-grounded summaries, topic exploration, citation context, trends, topic maps and recommendations. Require source grounding, clear AI labels, human oversight where appropriate, confidentiality safeguards and no fabricated citations.  
**Exit:** features demonstrate reliable usefulness and satisfy privacy/security requirements.

### Phase 10 — Premium and institutional expansion
Individual researcher tools, university/lab pages, team tools, institutional analytics, sponsored collections, event promotion and opportunity services. Keep core participation free. Never sell verification, scientific credibility or preferential organic ranking.  
**Exit:** monetisation is supported by demand without damaging trust.

### Phase 11 — International scale
Improve video delivery, feed/search capacity, moderation operations, resilience, accessibility, partnerships, integrations and native apps only when justified.  
**Exit:** operations and architecture meet measured scale requirements.

## 14. Success metrics

### Primary candidate metric
**Weekly Meaningfully Engaged Research Stories**, considered alongside returning readers and repeat contributors.

A story may count when it receives a meaningful action such as a substantive question/comment, save, appreciation or qualifying share. Define event rules and thresholds before analytics implementation.

### Supporting metrics
- Acquisition: registrations, referrals and acquisition cost when applicable.
- Activation: profile completion, first follow/save/engagement and first publication.
- Engagement: story views, meaningful interactions, questions, saves and follows.
- Retention: weekly returning readers, repeat contributors and cohort retention.
- Publishing: completion rate, repeat publishing, upload success and source completeness.
- Trust: reports, response times, correction/retraction handling and incidents.

Registrations or views alone do not prove product-market fit.

## 15. Business model

Adopt a hybrid long-term model, introduced only after core value and retention are demonstrated.

- **Free core platform:** discovery, publishing and community participation.
- **Individual premium:** advanced collections, personal insights, productivity and discovery tools.
- **Institutional plans:** organisational pages, team tools, showcases and aggregated analytics.
- **Opportunity services:** clearly labelled paid job/grant/fellowship listings.
- **Sponsored collections/events:** clearly labelled and relevant.

Protect privacy, editorial independence, fair access and trust. Do not sell scientific credibility, verification or organic ranking.

## 16. Technical architecture principles

Start with a modular monolith, relational database, managed object storage for media and clear module boundaries:
- Authentication.
- Users/profiles.
- Research stories.
- Contributors/sources.
- Media.
- Discovery.
- Social interactions.
- Search.
- Notifications.
- Moderation.
- Administration.
- Analytics.

Keep media files out of database rows. Use secure upload validation, limits, processing/optimisation, access controls and removal workflows. Use clear API contracts, server-side permission checks, reusable frontend components, central error handling and automated tests.

### Audience authorization and content privacy

The backend must implement a centralized, reusable authorization policy for published stories and associated media.

- DRAFT: author only.
- PUBLIC: everyone, including signed-out visitors.
- MEMBERS: authenticated Citeface users.
- FOLLOWERS: authenticated users with an active follow relationship with the author.
- ARCHIVED: author only, excluded from discovery. RETRACTED: visible status per the retraction policy (pending decision).
- Platform moderation hiding/removal is a separate moderation state, not a lifecycle state, and never grants draft access.

Authorization must be enforced consistently across all relevant API endpoints, database queries, feeds, profiles, search, recommendations, notifications, shared links, media delivery and caches. Audience changes and follow/unfollow actions must immediately affect access. Relevant actions must be recorded in the audit history.

The frontend must communicate the selected audience clearly, but must never be treated as the security boundary.

## 17. Governance

Maintain:
- Product decision log.
- Assumptions register.
- Risk register.
- Prioritised backlog.
- Metrics definitions.
- Release checklist.

Review each cycle: completed work, acceptance criteria, user feedback, metrics, risks and next priorities. Decisions may be proceed, proceed with conditions, revise, pivot, pause or stop.

## 18. Immediate development priorities

1. Audit the existing codebase and current application behaviour.
2. Verify registration, login, logout, sessions and protected routes.
3. Review database schema, API, frontend structure and tests.
4. Verify draft ownership, privacy and persistence.
5. Implement and test PUBLIC, MEMBERS and FOLLOWERS audience authorization.
6. Verify media access, audience changes and follow/unfollow authorization.
7. Establish the authenticated discovery experience—not a generic dashboard.
8. Build the feed and story detail experience.
9. Build video and image-slide publishing.
10. Add community interactions.
11. Complete trust, safety, analytics and release readiness.
12. Test with real users before expanding scope.

## 19. Strategic conclusion

Citeface is a global research social discovery and knowledge-sharing platform. Its architecture accommodates all disciplines; its initial community-building focus is Life Sciences, Health and Engineering-related Research. Short research videos lead, with image-slide stories supported from the first meaningful release. Open registration and optional verification support inclusion, while provenance, privacy, moderation and publication-status labels support trust.

Professional opportunities, institutional services, premium tools and AI research intelligence are long-term ecosystem capabilities. The immediate objective is a useful, accessible and trustworthy community that gives people a reason to discover, understand, engage, connect and return.

**Citeface should not simply give researchers another place to upload their work. It should give research a more engaging way to travel, connect people and create value.**
