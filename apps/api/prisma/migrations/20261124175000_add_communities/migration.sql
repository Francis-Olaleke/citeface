CREATE TYPE "CommunityMemberRole" AS ENUM ('MEMBER', 'MODERATOR', 'OWNER');

CREATE TABLE "Community" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityMember" (
    "communityId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "CommunityMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMPTZ(6),

    CONSTRAINT "CommunityMember_pkey" PRIMARY KEY ("communityId", "userId")
);

CREATE TABLE "CommunityPost" (
    "id" UUID NOT NULL,
    "communityId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Community_slug_key" ON "Community"("slug");
CREATE INDEX "Community_ownerId_createdAt_idx" ON "Community"("ownerId", "createdAt");
CREATE INDEX "Community_isPrivate_createdAt_idx" ON "Community"("isPrivate", "createdAt");
CREATE INDEX "CommunityMember_userId_joinedAt_idx" ON "CommunityMember"("userId", "joinedAt");
CREATE INDEX "CommunityPost_communityId_createdAt_idx" ON "CommunityPost"("communityId", "createdAt");
CREATE INDEX "CommunityPost_authorId_createdAt_idx" ON "CommunityPost"("authorId", "createdAt");

ALTER TABLE "Community"
    ADD CONSTRAINT "Community_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityMember"
    ADD CONSTRAINT "CommunityMember_communityId_fkey"
    FOREIGN KEY ("communityId") REFERENCES "Community"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityMember"
    ADD CONSTRAINT "CommunityMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityPost"
    ADD CONSTRAINT "CommunityPost_communityId_fkey"
    FOREIGN KEY ("communityId") REFERENCES "Community"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityPost"
    ADD CONSTRAINT "CommunityPost_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
