# Citeface Repository Audit Worksheet

**Purpose:** Complete this audit against the actual repository before changing application code.  
**Status:** Not yet inspected in this environment.

## 1. Repository baseline
- [ ] Confirm repository root and current branch.
- [ ] Record `git status --short`.
- [ ] Record latest commit (`git log -1 --oneline`).
- [ ] Inspect workspace/package manager and scripts.
- [ ] Identify apps, packages, database, migrations and docs.
- [ ] Do not overwrite uncommitted user changes.

## 2. Existing implementation inventory

For each row, record file paths, implementation status, tests and evidence.

| Area | Status (Existing/Partial/Missing/N/A) | Files and evidence | Gap / next action |
|---|---|---|---|
| Registration | Not inspected | | |
| Login/logout/session | Not inspected | | |
| Current-user endpoint | Not inspected | | |
| Protected frontend routes | Not inspected | | |
| Profile read/update | Not inspected | | |
| Research interests/taxonomy | Not inspected | | |
| | Publishing without saved drafts | Not inspected | | |
| Story edit/publish | Not inspected | | |
| Contributors/attestation | Not inspected | | |
| Sources/DOI/URL confirmation | Not inspected | | |
| Video upload/storage/playback | Not inspected | | |
| Image upload/slides/order | Not inspected | | |
| Discovery feed/pagination | Not inspected | | |
| Story detail/status labels | Not inspected | | |
| Search/filtering | Not inspected | | |
| Follow researchers/topics | Not inspected | | |
| Appreciation | Not inspected | | |
| Saves | Not inspected | | |
| Comments/questions | Not inspected | | |
| Notifications | Not inspected | | |
| Reports/moderation | Not inspected | | |
| Corrections/retractions/archive | Not inspected | | |
| Audit history | Not inspected | | |
| Analytics | Not inspected | | |
| Backups/monitoring | Not inspected | | |
| Automated tests | Not inspected | | |
| Security/privacy controls | Not inspected | | |

## 3. Database review
- [ ] Identify database engine and ORM/query layer.
- [ ] Inspect schema and migrations.
- [ ] Map existing tables to the MVP specification.
- [ ] Check unique constraints and foreign keys.
- [ ] Check ownership and role enforcement.
- [ ] Check published-content audience and access-control rules.
- [ ] Check indexes for feed and common queries.
- [ ] Identify migration and backup procedures.

## 4. API review
- [ ] Inventory routes and methods.
- [ ] Check request validation.
- [ ] Check response/error conventions.
- [ ] Check authentication and authorisation per endpoint.
- [ ] Check rate limiting and upload handling.
- [ ] Check pagination and filtering.
- [ ] Check API tests.

## 5. Frontend review
- [ ] Inventory routes/pages/components.
- [ ] Check auth state and route guards.
- [ ] Check loading, empty, success and error states.
- [ ] Check responsive layouts.
- [ ] Check accessibility basics.
- [ ] Compare authenticated landing experience with Discover → Understand → Engage → Connect → Return.
- [ ] Identify reusable components before adding new ones.

## 6. Build and test baseline
Run the repository's actual documented scripts; do not assume these names are correct:
- [ ] Install status / lockfile consistency.
- [ ] Typecheck.
- [ ] Unit tests.
- [ ] Integration tests.
- [ ] Production build.
- [ ] Lint.
- [ ] Record failures that existed before any changes.

## 7. Security and privacy review
- [ ] Password hashing and session/cookie configuration.
- [ ] Server-side role/ownership checks.
- [ ] CSRF strategy if cookie-authenticated.
- [ ] XSS-safe rendering.
- [ ] Parameterised database access.
- [ ] Secret management and `.gitignore`.
- [ ] Published-content audience enforcement and private media access.
- [ ] Upload signature/type/size validation.
- [ ] Safe logging.
- [ ] Admin audit trail.

## 8. Audit outcome

Summarise:
1. What works and should be preserved.
2. What is partially implemented and needs extension.
3. What is missing.
4. Critical security/privacy gaps.
5. Existing tests and baseline failures.
6. Recommended implementation order based on dependencies.
7. Files that should be changed in the first implementation increment.

**Important:** Do not mark any item complete without inspecting the corresponding source and, where possible, running a test or reproducing the behaviour.