FROM node:22-alpine AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN corepack enable && pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY apps/web apps/web
RUN pnpm --filter @citeface/api exec prisma generate && pnpm --filter @citeface/api build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN corepack enable && pnpm install --frozen-lockfile

COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/src/generated apps/api/src/generated
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY --from=build /app/apps/api/prisma7.config.ts apps/api/prisma7.config.ts

EXPOSE 3000
CMD ["sh","-c","pnpm --dir apps/api migrate:deploy && pnpm --dir apps/api start"]
