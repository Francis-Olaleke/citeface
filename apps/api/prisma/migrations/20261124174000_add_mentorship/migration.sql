CREATE TYPE "MentorshipRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CLOSED');

CREATE TABLE "MentorOffering" (
    "id" UUID NOT NULL,
    "mentorId" UUID NOT NULL,
    "expertise" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorOffering_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MentorshipRequest" (
    "id" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "mentorId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "status" "MentorshipRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorshipRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MentorOffering_mentorId_isActive_idx"
    ON "MentorOffering"("mentorId", "isActive");
CREATE INDEX "MentorshipRequest_mentorId_status_createdAt_idx"
    ON "MentorshipRequest"("mentorId", "status", "createdAt");
CREATE INDEX "MentorshipRequest_requesterId_status_createdAt_idx"
    ON "MentorshipRequest"("requesterId", "status", "createdAt");

ALTER TABLE "MentorOffering"
    ADD CONSTRAINT "MentorOffering_mentorId_fkey"
    FOREIGN KEY ("mentorId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorshipRequest"
    ADD CONSTRAINT "MentorshipRequest_offeringId_fkey"
    FOREIGN KEY ("offeringId") REFERENCES "MentorOffering"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorshipRequest"
    ADD CONSTRAINT "MentorshipRequest_requesterId_fkey"
    FOREIGN KEY ("requesterId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorshipRequest"
    ADD CONSTRAINT "MentorshipRequest_mentorId_fkey"
    FOREIGN KEY ("mentorId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
