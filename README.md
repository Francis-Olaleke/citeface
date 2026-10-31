# Citeface

**Research. Connect. Discover.**

Citeface is a researcher-first social and knowledge platform designed to make sharing research, discovering scientific work, and connecting with other researchers easier.

The platform aims to combine research storytelling, scientific discovery, and professional networking while preserving authorship, context, and research integrity.

## Project Status

Citeface is currently in Phase 1: Initial MVP Development.

We are completing Build 0 - Project Foundation.

## Technology Stack

| Area | Technology |
|---|---|
| Web application | React, TypeScript, Vite |
| API | Node.js, TypeScript, Fastify |
| Package manager | pnpm |
| Database | PostgreSQL (Neon planned for Build 1) |
| ORM | Prisma (planned for Build 1) |
| Media storage | Object storage (to be selected) |
| Testing | Vitest and additional testing tools as needed |

## Repository Structure

```text
citeface/
  apps/
    api/
    web/
  packages/
    configuration/
    contracts/
    shared/
  database/
    migrations/
    seeds/
  docs/
  scripts/
  tests/
  .env.example
  .gitignore
  package.json
  pnpm-workspace.yaml
  README.md
```

## Documentation

Project requirements and architectural decisions are maintained in the `docs/` directory.

- `docs/product/` - Product direction and publishing requirements.
- `docs/architecture/` - Technical architecture and data model.
- `docs/decisions/` - Recorded architectural and product decisions.
- `docs/builds/` - Build scopes and completion checklists.

## Getting Started

### Prerequisites

- Node.js 22.13 or later
- pnpm 12.9.1 or compatible version

### Install Dependencies

```bash
pnpm install
```

### Run the Web Application

```bash
pnpm --filter @citeface/web dev
```

### Run the API

```bash
pnpm --filter @citeface/api dev
```

### Run Type Checks

```bash
pnpm typecheck
```

### Build the Web Application

```bash
pnpm --filter @citeface/web build
```

### Build the API

```bash
pnpm --filter @citeface/api build
```

## Environment Configuration

Use `.env.example` as the reference for required environment variables.

Create local environment files when needed. Never commit actual credentials, passwords, database URLs, or secrets.

## Development Principles

- Use TypeScript across the application.
- Maintain clear boundaries between the web application, API, and shared packages.
- Prefer a modular monolith over premature microservices.
- Keep database changes version-controlled through migrations.
- Store media files separately from relational database records.
- Protect research authorship, attribution, and integrity.
- Test and verify each build before moving to the next.

## Development Roadmap

| Build | Focus |
|---|---|
| Build 0 | Project foundation |
| Build 1 | Database foundation |
| Build 2 | Authentication |
| Build 3 | Researcher profiles |
| Build 4 | Research publishing |
| Build 5 | Video publishing |
| Build 6 | Research feed |
| Build 7 | Researcher network |
| Build 8 | Discovery and search |
| Build 9 | Research discussions |
| Build 10 | Research integrity and moderation |
| Build 11 | Notifications and analytics |
| Build 12 | Testing and security |
| Build 13 | Deployment and launch |

This roadmap is a working plan and may be refined as development progresses.