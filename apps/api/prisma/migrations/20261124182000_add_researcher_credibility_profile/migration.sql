ALTER TABLE "ResearcherProfile"
    ADD COLUMN "linkedinUrl" TEXT,
    ADD COLUMN "googleScholarUrl" TEXT,
    ADD COLUMN "citationCount" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "specializations" JSONB,
    ADD COLUMN "education" JSONB,
    ADD COLUMN "grants" JSONB,
    ADD COLUMN "fellowships" JSONB,
    ADD COLUMN "professionalBodies" JSONB;
