# Citeface Publishing — Acceptance Criteria

These criteria are intended to be testable. They should become automated tests where practical.

## 1. Content type selection

**PUB-AC-001**
- Given an authenticated user opens the publishing experience,
- when they start a post,
- then they can select research story, video, photo, paper announcement or methods post.

**PUB-AC-002**
- Given a content type is selected,
- when the publishing form is displayed,
- then the form presents fields appropriate to that type and does not require irrelevant fields.

## 2. Optional source information

**PUB-AC-003**
- Given an author creates any supported post type,
- when no DOI or original-paper URL is supplied,
- then the post may still be submitted if its other required fields are valid.

**PUB-AC-004**
- Given an author supplies a DOI or source URL,
- when the post is saved,
- then the supplied source information is associated with that post and displayed to readers according to visibility permissions.

**PUB-AC-005**
- Given a post includes a DOI,
- then the interface must not automatically label the post or its claims as verified or peer-reviewed solely because a DOI exists.

## 3. Audience selection and authorization

**PUB-AC-006**
- Given an author creates a post,
- when they reach the publication step,
- then they must explicitly select an audience from the configured audience options.

**PUB-AC-007**
- Given a post has an audience restriction,
- when a user requests it through the feed, profile, search, direct URL or API,
- then the server returns the content only if that user is authorized to view it.

**PUB-AC-008**
- Given an unauthorized user requests a restricted post,
- then the response must not disclose the post body, private media URL or other protected metadata.

## 4. Video validation

**PUB-AC-009**
- Given a video has a trusted measured duration of 90 seconds,
- when it passes all other validations,
- then it is eligible for publication.

**PUB-AC-010**
- Given a video has a trusted measured duration of 300 seconds,
- when it passes all other validations,
- then it is eligible for publication.

**PUB-AC-011**
- Given a video is shorter than 90 seconds or longer than 300 seconds,
- when the server validates it,
- then publication is rejected with a clear, actionable error.

**PUB-AC-012**
- Given a browser reports a duration within the allowed range but trusted server/provider metadata reports a duration outside it,
- then the server/provider result takes precedence and publication is rejected.

**PUB-AC-013**
- Given an upload fails or media processing fails,
- then the post is not published and the author receives a useful failure state and retry guidance.

**PUB-AC-014**
- Given a video has not completed required storage and validation,
- then it must not be available as a published feed item.

## 5. Photo and file validation

**PUB-AC-015**
- Given an uploaded file has an unsupported type or exceeds the configured size limit,
- then the upload is rejected before publication.

**PUB-AC-016**
- Given a user uploads media,
- then the publishing flow presents the required rights/permission confirmation.

## 6. No-drafts policy

**PUB-AC-017**
- Given a user starts creating a post,
- then the MVP does not offer a save-draft action or a drafts area.

**PUB-AC-018**
- Given a media upload is in progress,
- then its technical upload state is not exposed as a user-editable saved draft.

## 7. Author identity and research context

**PUB-AC-019**
- Given a post is published,
- then the post is associated with its author and content type.

**PUB-AC-020**
- Given source or publication-status information is supplied,
- then it is displayed without implying that Citeface has independently validated the underlying scientific claims.

## 8. Edit, remove and report

**PUB-AC-021**
- Given an author attempts to edit or remove a post,
- then the server verifies ownership or an explicitly authorized moderation role.

**PUB-AC-022**
- Given a reader reports a post,
- then a report record is created and made available to the authorized moderation workflow.

## 9. Cross-cutting quality criteria

**PUB-AC-023**
- Publishing and media APIs validate input on the server, not only in the browser.

**PUB-AC-024**
- Repeated client submissions or retries do not create unintended duplicate posts or duplicate media associations.

**PUB-AC-025**
- Media storage credentials and private storage keys are never exposed to unauthorized clients.

**PUB-AC-026**
- Publishing forms and playback controls work at supported mobile and desktop viewport sizes.

**PUB-AC-027**
- Automated tests cover valid inputs, invalid inputs, permission boundaries, upload failures and retry behavior.
