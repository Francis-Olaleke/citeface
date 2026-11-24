ALTER TABLE "ResearcherProfile"
    ADD COLUMN "careerStage" TEXT,
    ADD COLUMN "professionalRanks" JSONB,
    ADD COLUMN "researchInterests" JSONB,
    ADD COLUMN "researchGoal" TEXT;
