CREATE TYPE "ExpertServiceType" AS ENUM (
    'MENTORSHIP',
    'TUTORING',
    'TEACHING',
    'CONSULTING',
    'RESEARCH_ADVICE'
);

ALTER TABLE "MentorOffering"
    ADD COLUMN "serviceType" "ExpertServiceType" NOT NULL DEFAULT 'MENTORSHIP',
    ADD COLUMN "priceMinor" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD',
    ADD COLUMN "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    ADD COLUMN "stripePriceId" TEXT;

ALTER TABLE "MentorshipRequest"
    ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
    ADD COLUMN "stripeCheckoutSessionId" TEXT,
    ADD COLUMN "stripePaymentIntentId" TEXT;

ALTER TABLE "ResearcherProfile"
    ADD COLUMN "stripeAccountId" TEXT,
    ADD COLUMN "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false;
