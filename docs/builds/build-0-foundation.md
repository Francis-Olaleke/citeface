# Build 0 — Foundation

**Project:** Citeface
**Status:** Planned / in progress
**Primary objective:** Establish a clean, reproducible, documented TypeScript monorepo before implementing product features.

## 1. Build 0 outcomes

1. Create a dedicated GitHub repository named `citeface`.
2. Create the local project directory.
3. Verify Node.js, npm, Git and pnpm.
4. Initialize a pnpm workspace.
5. Establish TypeScript configuration conventions.
6. Establish initial application/package boundaries.
7. Add project documentation and engineering conventions.
8. Configure Git ignore rules and environment-variable examples.
9. Add baseline formatting, linting and type-check scripts where appropriate.
10. Make and push a clean initial commit.

## 2. Technology direction

Proposed stack:
- Frontend: React, TypeScript and Vite.
- API: Node.js, TypeScript and Fastify.
- Database: PostgreSQL and Prisma.
- Media: S3-compatible object storage or a suitable managed media service.
- Package manager: pnpm.
- Tests: Vitest, API integration tests and Playwright for critical browser journeys.
- Version control: Git and GitHub.

These are selected directions to validate in Build 0. Do not claim a tool is configured until the local verification command succeeds.

## 3. Architecture approach

Use a monorepo with a modular monolith for the initial product. Keep the web application, API, shared contracts, database assets, tests and documentation in clear boundaries. Do not introduce microservices for the MVP.

Proposed top-level layout:

```text
citeface/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── contracts/
│   ├── shared/
│   └── configuration/
├── database/
│   ├── migrations/
│   └── seeds/
├── tests/
│   ├── integration/
│   ├── end-to-end/
│   └── security/
├── docs/
│   ├── product/
│   ├── architecture/
│   ├── requirements/
│   ├── design-system/
│   ├── database/
│   ├── api/
│   ├── security/
│   ├── research-integrity/
│   ├── testing/
│   ├── decisions/
│   ├── risks/
│   └── builds/
├── scripts/
├── .github/
├── .env.example
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

Create directories when they have a real purpose; avoid filling the repository with empty folders.

## 4. Product documentation to keep in the repository

- Product vision and product scope.
- MVP feature boundaries and roadmap.
- Publishing specification.
- Publishing user stories.
- Publishing acceptance criteria.
- Publishing data-model implications.
- Architecture overview and decisions.
- Security, privacy and research-integrity requirements.
- UI/UX reference notes.
- Build plans and completion reports.

## 5. Engineering conventions

- TypeScript strictness should be enabled for new TypeScript packages.
- Validate environment variables at application startup.
- Never commit `.env` files, credentials, private keys or production data.
- Use database migrations for schema changes.
- Keep business rules out of UI components.
- Enforce authorization on the server.
- Add tests for business rules and security-sensitive behavior.
- Use meaningful branch names, commits and pull requests.
- Keep the main branch stable.
- Document material architecture decisions.
- Review AI-generated code and understand it before merging.

## 6. Build 0 verification checklist

- [ ] GitHub repository exists and is dedicated to Citeface.
- [ ] Local project folder is correct.
- [ ] Node.js version is compatible with selected tools.
- [ ] Git is installed and configured.
- [ ] pnpm is installed and responds to `pnpm --version`.
- [ ] pnpm workspace is recognized.
- [ ] TypeScript configuration is valid.
- [ ] README explains the project and local setup.
- [ ] `.gitignore` excludes dependencies, build outputs, local environment files and secrets.
- [ ] `.env.example` contains placeholders only.
- [ ] Baseline lint, type-check and test commands run where configured.
- [ ] Git remote points to the user's Citeface repository.
- [ ] Initial commit is pushed successfully.
- [ ] No product feature implementation has started prematurely.

## 7. Explicitly out of scope for Build 0

- Authentication implementation.
- Researcher profile implementation.
- Feed implementation.
- Video or image upload implementation.
- Database business schema implementation.
- Messaging, funding, collaboration or billing implementation.
- AI research search.
- Production deployment.

Build 0 creates the foundation and documents decisions. Product implementation begins in later builds after the foundation is verified.

## 8. Current publishing decisions to carry forward

- Supported types: story, video, photo, paper announcement and methods.
- Video duration: 90–300 seconds inclusive.
- DOI/original-paper link: optional.
- Audience: selected by author for each post; exact audience options still require definition.
- Saved drafts: not supported in the first MVP.
- Media upload states are technical workflow states, not drafts.
