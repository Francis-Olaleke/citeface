
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { FastifyInstance } from "fastify";

import { prisma } from "../src/plugins/database.js";
import {
  makeApp,
  registerAndLogin,
  resetDb,
} from "./helpers.js";

let app: FastifyInstance;

type UserStatusValue = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

type StoryStatusValue =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED"
  | "RETRACTED";

async function createUser(
  n = 1,
  options: {
    status?: UserStatusValue;
    deletedAt?: Date | null;
  } = {},
) {
  return prisma.user.create({
    data: {
      email: `feeduser${n}@example.com`,
      displayName: `Feed User ${n}`,
      username: `feeduser${n}`,
      status: options.status ?? "ACTIVE",
      deletedAt: options.deletedAt ?? null,
    },
  });
}

async function createStory(
  creatorId: string,
  options: {
    title?: string;
    slug?: string;
    status?: StoryStatusValue;
    publishedAt?: Date | null;
    deletedAt?: Date | null;
    classification?:
      | "PEER_REVIEWED_ARTICLE"
      | "PREPRINT"
      | "THESIS_DISSERTATION"
      | "CONFERENCE_PAPER"
      | "RESEARCH_REPORT"
      | "AUTHOR_DESCRIBED_PROJECT"
      | "PRELIMINARY_UNPUBLISHED";
    researchQuestion?: string;
    methodology?: string;
    findings?: string;
    significance?: string;
    limitations?: string;
  } = {},
) {
  const title = options.title ?? "Test Research Story";
  const slug = options.slug ?? `test-story-${Date.now()}-${Math.random()}`;

  return prisma.researchStory.create({
    data: {
      creatorId,
      title,
      slug,
      summary: "A research story created for feed testing.",
      classification: options.classification ?? "RESEARCH_REPORT",
      researchQuestion: options.researchQuestion,
      methodology: options.methodology,
      findings: options.findings,
      significance: options.significance,
      limitations: options.limitations,
      status: options.status ?? "PUBLISHED",
      publishedAt:
        options.publishedAt === undefined
          ? new Date()
          : options.publishedAt,
      deletedAt: options.deletedAt ?? null,
    },
  });
}
beforeAll(async () => {
  app = await makeApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetDb();
});

describe("F-04 discovery feed", () => {
  it("returns published research stories with creator information", async () => {
    const user = await createUser();

        await prisma.researcherProfile.create({
      data: {
        userId: user.id,
        headline: "Molecular Biology Researcher",
        profileImageUrl: "https://res.cloudinary.com/test/image/upload/profile.png",
        isVerified: true,
      },
    });

    await createStory(user.id, {
      title: "Understanding Malaria Transmission",
      slug: "understanding-malaria-transmission",
    });

    const res = await app.inject({
      method: "GET",
      url: "/stories/feed",
    });

    
    expect(res.statusCode).toBe(200);

    const body = res.json();

    expect(body.stories).toHaveLength(1);
    expect(body.stories[0].title).toBe(
      "Understanding Malaria Transmission",
    );
    expect(body.stories[0].creator.username).toBe("feeduser1");
    expect(body.stories[0].creator.researcherProfile).toMatchObject({
      headline: "Molecular Biology Researcher",
      profileImageUrl: "https://res.cloudinary.com/test/image/upload/profile.png",
      isVerified: true,
    });

    expect(body.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it("excludes drafts, archived stories, retracted stories and deleted stories", async () => {
    const user = await createUser();

    await createStory(user.id, {
      title: "Published Story",
      slug: "published-story",
      status: "PUBLISHED",
    });

    await createStory(user.id, {
      title: "Draft Story",
      slug: "draft-story",
      status: "DRAFT",
      publishedAt: null,
    });

    await createStory(user.id, {
      title: "Archived Story",
      slug: "archived-story",
      status: "ARCHIVED",
    });

    await createStory(user.id, {
      title: "Retracted Story",
      slug: "retracted-story",
      status: "RETRACTED",
    });

    await createStory(user.id, {
      title: "Deleted Story",
      slug: "deleted-story",
      status: "PUBLISHED",
      deletedAt: new Date(),
    });

    await createStory(user.id, {
      title: "Unpublished Story",
      slug: "unpublished-story",
      status: "PUBLISHED",
      publishedAt: null,
    });

    const res = await app.inject({
      method: "GET",
      url: "/stories/feed",
    });

    expect(res.statusCode).toBe(200);

    const body = res.json();

    expect(body.stories).toHaveLength(1);
    expect(body.stories[0].title).toBe("Published Story");
    expect(body.pagination.total).toBe(1);
  });

  it("excludes stories created by suspended or deleted accounts", async () => {
    const activeUser = await createUser(1);

    const suspendedUser = await createUser(2, {
      status: "SUSPENDED",
    });

    const deletedUser = await createUser(3, {
      deletedAt: new Date(),
    });

    await createStory(activeUser.id, {
      title: "Active Account Story",
      slug: "active-account-story",
    });

    await createStory(suspendedUser.id, {
      title: "Suspended Account Story",
      slug: "suspended-account-story",
    });

    await createStory(deletedUser.id, {
      title: "Deleted Account Story",
      slug: "deleted-account-story",
    });

    const res = await app.inject({
      method: "GET",
      url: "/stories/feed",
    });

    expect(res.statusCode).toBe(200);

    const body = res.json();

    expect(body.stories).toHaveLength(1);
    expect(body.stories[0].title).toBe("Active Account Story");
  });

  it("supports pagination and orders stories by publication date", async () => {
    const user = await createUser();

    await createStory(user.id, {
      title: "Oldest Story",
      slug: "oldest-story",
      publishedAt: new Date("2026-01-01T10:00:00Z"),
    });

    await createStory(user.id, {
      title: "Middle Story",
      slug: "middle-story",
      publishedAt: new Date("2026-02-01T10:00:00Z"),
    });

    await createStory(user.id, {
      title: "Newest Story",
      slug: "newest-story",
      publishedAt: new Date("2026-03-01T10:00:00Z"),
    });

    const firstPage = await app.inject({
      method: "GET",
      url: "/stories/feed?page=1&limit=2",
    });

    expect(firstPage.statusCode).toBe(200);

    const firstBody = firstPage.json();

    expect(firstBody.stories).toHaveLength(2);
    expect(firstBody.stories[0].title).toBe("Newest Story");
    expect(firstBody.stories[1].title).toBe("Middle Story");

    expect(firstBody.pagination).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    });

    const secondPage = await app.inject({
      method: "GET",
      url: "/stories/feed?page=2&limit=2",
    });

    expect(secondPage.statusCode).toBe(200);

    const secondBody = secondPage.json();

    expect(secondBody.stories).toHaveLength(1);
    expect(secondBody.stories[0].title).toBe("Oldest Story");

    expect(secondBody.pagination.hasNextPage).toBe(false);
    expect(secondBody.pagination.hasPreviousPage).toBe(true);
  });

  it("does not expose account secrets, author emails or media storage details", async () => {
    const user = await createUser();

    const story = await createStory(user.id, {
      title: "Privacy Test Story",
      slug: "privacy-test-story",
    });

    await prisma.storyAuthor.create({
      data: {
        storyId: story.id,
        displayName: "External Research Author",
        email: "private-author@example.com",
        sortOrder: 0,
      },
    });

    const media = await prisma.mediaAsset.create({
      data: {
        uploadedById: user.id,
        type: "VIDEO",
        storageKey: "private/internal/video-secret-key",
        storageProvider: "private-storage-provider",
        originalName: "research-video.mp4",
        mimeType: "video/mp4",
        sizeBytes: 12345n,
      },
    });

    await prisma.storyMedia.create({
      data: {
        storyId: story.id,
        mediaAssetId: media.id,
        sortOrder: 0,
        caption: "Research video",
      },
    });

    const res = await app.inject({
      method: "GET",
      url: "/stories/feed",
    });

    expect(res.statusCode).toBe(200);

    const body = res.json();
    const responseText = JSON.stringify(body);

    expect(body.stories[0].authors[0].displayName).toBe(
      "External Research Author",
    );

    expect(body.stories[0].media[0].media.type).toBe("VIDEO");

    expect(responseText).not.toContain("passwordHash");
    expect(responseText).not.toContain("feeduser1@example.com");
    expect(responseText).not.toContain("private-author@example.com");
    expect(responseText).not.toContain("storageKey");
    expect(responseText).not.toContain("storageProvider");
    expect(responseText).not.toContain("private/internal/video-secret-key");
    expect(responseText).not.toContain("12345");
  });

  it("rejects invalid pagination parameters", async () => {
    const zeroPage = await app.inject({
      method: "GET",
      url: "/stories/feed?page=0",
    });

    const excessiveLimit = await app.inject({
      method: "GET",
      url: "/stories/feed?limit=21",
    });

    expect(zeroPage.statusCode).toBe(400);
    expect(excessiveLimit.statusCode).toBe(400);
  });

  it("searches research titles and content case-insensitively", async () => {
    const user = await createUser();

    await createStory(user.id, {
      title: "Malaria Research",
      slug: "malaria-research-search",
      findings: "The study identified seasonal transmission patterns.",
    });

    await createStory(user.id, {
      title: "Coastal Water Quality",
      slug: "coastal-water-quality-search",
      findings: "Heavy metal concentrations were measured.",
    });

    const titleSearch = await app.inject({
      method: "GET",
      url: "/stories/feed?q=MALARIA",
    });

    expect(titleSearch.statusCode).toBe(200);
    expect(titleSearch.json().stories).toHaveLength(1);
    expect(titleSearch.json().stories[0].title).toBe("Malaria Research");

    const contentSearch = await app.inject({
      method: "GET",
      url: "/stories/feed?q=seasonal%20transmission",
    });

    expect(contentSearch.statusCode).toBe(200);
    expect(contentSearch.json().stories).toHaveLength(1);
    expect(contentSearch.json().stories[0].title).toBe("Malaria Research");
  });

  it("filters stories by research classification", async () => {
    const user = await createUser();

    await createStory(user.id, {
      title: "Peer Reviewed Study",
      slug: "peer-reviewed-filter-test",
      classification: "PEER_REVIEWED_ARTICLE",
    });

    await createStory(user.id, {
      title: "Research Report",
      slug: "research-report-filter-test",
      classification: "RESEARCH_REPORT",
    });

    const res = await app.inject({
      method: "GET",
      url: "/stories/feed?classification=PEER_REVIEWED_ARTICLE",
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().stories).toHaveLength(1);
    expect(res.json().stories[0].title).toBe("Peer Reviewed Study");
    expect(res.json().pagination.total).toBe(1);
  });

  it("combines search and classification filters", async () => {
    const user = await createUser();

    await createStory(user.id, {
      title: "Malaria Peer Reviewed Study",
      slug: "malaria-peer-reviewed-combined",
      classification: "PEER_REVIEWED_ARTICLE",
    });

    await createStory(user.id, {
      title: "Malaria Research Report",
      slug: "malaria-report-combined",
      classification: "RESEARCH_REPORT",
    });

    await createStory(user.id, {
      title: "Dengue Peer Reviewed Study",
      slug: "dengue-peer-reviewed-combined",
      classification: "PEER_REVIEWED_ARTICLE",
    });

    const res = await app.inject({
      method: "GET",
      url: "/stories/feed?q=malaria&classification=PEER_REVIEWED_ARTICLE",
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().stories).toHaveLength(1);
    expect(res.json().stories[0].title).toBe("Malaria Peer Reviewed Study");
    expect(res.json().pagination.total).toBe(1);
  });

  it("calculates pagination totals after applying classification filters", async () => {
    const user = await createUser();

    await createStory(user.id, {
      title: "Filtered Study One",
      slug: "filtered-study-one",
      classification: "PREPRINT",
    });

    await createStory(user.id, {
      title: "Filtered Study Two",
      slug: "filtered-study-two",
      classification: "PREPRINT",
    });

    await createStory(user.id, {
      title: "Unfiltered Study",
      slug: "unfiltered-study",
      classification: "RESEARCH_REPORT",
    });

    const res = await app.inject({
      method: "GET",
      url: "/stories/feed?classification=PREPRINT&page=1&limit=1",
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().stories).toHaveLength(1);
    expect(res.json().pagination.total).toBe(2);
  });

  it("never exposes drafts through search", async () => {
    const user = await createUser();

    await createStory(user.id, {
      title: "Public Malaria Findings",
      slug: "public-malaria-findings-search",
      findings: "Malaria transmission was observed.",
    });

    await createStory(user.id, {
      title: "Private Malaria Draft",
      slug: "private-malaria-draft-search",
      status: "DRAFT",
      publishedAt: null,
      findings: "Malaria transmission was observed.",
    });

    const res = await app.inject({
      method: "GET",
      url: "/stories/feed?q=malaria",
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().stories).toHaveLength(1);
    expect(res.json().stories[0].title).toBe("Public Malaria Findings");
  });

  it("rejects invalid classification and excessively long search queries", async () => {
    const invalidClassification = await app.inject({
      method: "GET",
      url: "/stories/feed?classification=NOT_A_REAL_CLASSIFICATION",
    });

    const excessiveQuery = await app.inject({
      method: "GET",
      url: `/stories/feed?q=${"a".repeat(201)}`,
    });

    expect(invalidClassification.statusCode).toBe(400);
    expect(excessiveQuery.statusCode).toBe(400);
  });
});


describe("F-05 research story draft creation", () => {
  it("rejects draft creation without authentication", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/stories",
      payload: {
        title: "Understanding Malaria Transmission",
        summary: "A study of malaria transmission patterns.",
        classification: "RESEARCH_REPORT",
      },
    });

    expect(res.statusCode).toBe(401);
    expect(await prisma.researchStory.count()).toBe(0);
  });

  it("creates a private draft for the authenticated user", async () => {
    const { cookie } = await registerAndLogin(app);

    const user = await prisma.user.findUniqueOrThrow({
      where: { username: "testuser1" },
    });

    const res = await app.inject({
      method: "POST",
      url: "/stories",
      cookies: cookie,
      payload: {
        title: "Understanding Malaria Transmission",
        summary: "A study of malaria transmission patterns.",
        classification: "RESEARCH_REPORT",
        researchQuestion: "What factors influence malaria transmission?",
        methodology: "A descriptive research approach.",
        findings: "Several transmission factors were identified.",
      },
    });

    expect(res.statusCode).toBe(201);

    const body = res.json();

    expect(body.story).toMatchObject({
      creatorId: user.id,
      title: "Understanding Malaria Transmission",
      summary: "A study of malaria transmission patterns.",
      classification: "RESEARCH_REPORT",
      status: "DRAFT",
      publishedAt: null,
    });

    expect(body.story.id).toBeTruthy();
    expect(body.story.slug).toBeTruthy();

    const storedStory = await prisma.researchStory.findUniqueOrThrow({
      where: { id: body.story.id },
    });

    expect(storedStory.creatorId).toBe(user.id);
    expect(storedStory.status).toBe("DRAFT");
  });

  it("does not expose a newly created draft in the public feed", async () => {
    const { cookie } = await registerAndLogin(app);

    const created = await app.inject({
      method: "POST",
      url: "/stories",
      cookies: cookie,
      payload: {
        title: "A Private Research Draft",
        summary: "This draft must not appear in public discovery.",
        classification: "RESEARCH_REPORT",
      },
    });

    expect(created.statusCode).toBe(201);

    const feed = await app.inject({
      method: "GET",
      url: "/stories/feed",
    });

    expect(feed.statusCode).toBe(200);
    expect(feed.json().stories).toHaveLength(0);
  });

  it("rejects a creatorId supplied in the request body", async () => {
    const { cookie } = await registerAndLogin(app, 1);
    const secondUser = await registerAndLogin(app, 2);

    const secondUserRecord = await prisma.user.findUniqueOrThrow({
      where: { username: "testuser2" },
    });

    const res = await app.inject({
      method: "POST",
      url: "/stories",
      cookies: cookie,
      payload: {
        title: "Attempted Account Impersonation",
        summary: "Testing creator ownership protection.",
        classification: "RESEARCH_REPORT",
        creatorId: secondUserRecord.id,
      },
    });

    expect(secondUser.res.statusCode).toBe(201);
    expect(res.statusCode).toBe(400);
    expect(await prisma.researchStory.count()).toBe(0);
  });

  it("rejects invalid story creation data", async () => {
    const { cookie } = await registerAndLogin(app);

    const res = await app.inject({
      method: "POST",
      url: "/stories",
      cookies: cookie,
      payload: {
        title: "",
        summary: "",
        classification: "INVALID_CLASSIFICATION",
      },
    });

    expect(res.statusCode).toBe(400);
    expect(await prisma.researchStory.count()).toBe(0);
  });
});


describe("F-05.2 research story draft listing", () => {
  it("rejects draft listing without authentication", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/stories/drafts",
    });

    expect(res.statusCode).toBe(401);
  });

  it("returns only drafts belonging to the authenticated user", async () => {
    const firstUser = await registerAndLogin(app, 1);
    const secondUser = await registerAndLogin(app, 2);

    const firstDraft = await app.inject({
      method: "POST",
      url: "/stories",
      cookies: firstUser.cookie,
      payload: {
        title: "First Researcher's Draft",
        summary: "A private research draft.",
        classification: "RESEARCH_REPORT",
      },
    });

    const secondDraft = await app.inject({
      method: "POST",
      url: "/stories",
      cookies: secondUser.cookie,
      payload: {
        title: "Second Researcher's Draft",
        summary: "Another private research draft.",
        classification: "RESEARCH_REPORT",
      },
    });

    expect(firstDraft.statusCode).toBe(201);
    expect(secondDraft.statusCode).toBe(201);

    const res = await app.inject({
      method: "GET",
      url: "/stories/drafts",
      cookies: firstUser.cookie,
    });

    expect(res.statusCode).toBe(200);

    const body = res.json();

    expect(body.drafts).toHaveLength(1);
    expect(body.drafts[0].title).toBe(
      "First Researcher's Draft",
    );
    expect(body.drafts[0].status).toBe("DRAFT");
    expect(body.drafts[0].publishedAt).toBeNull();
    expect(body.drafts[0].researchQuestion).toBeNull();
    expect(JSON.stringify(body)).not.toContain("testuser2");
    expect(JSON.stringify(body)).not.toContain("testuser1@example.com");
  });

  it("excludes published, archived, retracted and deleted stories", async () => {
    const { cookie } = await registerAndLogin(app);

    const user = await prisma.user.findUniqueOrThrow({
      where: { username: "testuser1" },
    });

    await createStory(user.id, {
      title: "Valid Draft",
      slug: "valid-draft",
      status: "DRAFT",
      publishedAt: null,
    });

    await createStory(user.id, {
      title: "Published Story",
      slug: "published-story",
      status: "PUBLISHED",
    });

    await createStory(user.id, {
      title: "Archived Story",
      slug: "archived-story",
      status: "ARCHIVED",
    });

    await createStory(user.id, {
      title: "Retracted Story",
      slug: "retracted-story",
      status: "RETRACTED",
    });

    await createStory(user.id, {
      title: "Deleted Draft",
      slug: "deleted-draft",
      status: "DRAFT",
      publishedAt: null,
      deletedAt: new Date(),
    });

    await createStory(user.id, {
      title: "Draft With Publication Date",
      slug: "draft-with-publication-date",
      status: "DRAFT",
      publishedAt: new Date(),
    });

    const res = await app.inject({
      method: "GET",
      url: "/stories/drafts",
      cookies: cookie,
    });

    expect(res.statusCode).toBe(200);

    const body = res.json();

    expect(body.drafts).toHaveLength(1);
    expect(body.drafts[0].title).toBe("Valid Draft");
  });
});

describe("F-05.3 research story draft editing", () => {
  it("rejects editing without authentication", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/stories/00000000-0000-4000-8000-000000000001",
      payload: { title: "Updated title" },
    });

    expect(res.statusCode).toBe(401);
  });

  it("allows the owner to edit a draft and preserves its previous version", async () => {
    const { cookie } = await registerAndLogin(app);

    const created = await app.inject({
      method: "POST",
      url: "/stories",
      cookies: cookie,
      payload: {
        title: "Original Research Title",
        summary: "Original research summary.",
        classification: "RESEARCH_REPORT",
        methodology: "Original methodology.",
      },
    });

    expect(created.statusCode).toBe(201);

    const storyId = created.json().story.id;

    const updated = await app.inject({
      method: "PATCH",
      url: `/stories/${storyId}`,
      cookies: cookie,
      payload: {
        title: "Updated Research Title",
        summary: "Updated research summary.",
        changeNote: "Corrected the research title and summary.",
      },
    });

    expect(updated.statusCode).toBe(200);

    expect(updated.json().story).toMatchObject({
      id: storyId,
      title: "Updated Research Title",
      summary: "Updated research summary.",
      methodology: "Original methodology.",
      status: "DRAFT",
    });

    const versions = await prisma.storyVersion.findMany({
      where: { storyId },
    });

    expect(versions).toHaveLength(1);
    expect(versions[0]).toMatchObject({
      versionNumber: 1,
      title: "Original Research Title",
      summary: "Original research summary.",
      methodology: "Original methodology.",
      changeNote: "Corrected the research title and summary.",
    });
  });

  it("prevents another researcher from editing someone else's draft", async () => {
    const firstUser = await registerAndLogin(app, 1);
    const secondUser = await registerAndLogin(app, 2);

    const created = await app.inject({
      method: "POST",
      url: "/stories",
      cookies: firstUser.cookie,
      payload: {
        title: "Private Research Draft",
        summary: "This draft belongs to the first researcher.",
        classification: "RESEARCH_REPORT",
      },
    });

    expect(created.statusCode).toBe(201);

    const storyId = created.json().story.id;

    const updated = await app.inject({
      method: "PATCH",
      url: `/stories/${storyId}`,
      cookies: secondUser.cookie,
      payload: {
        title: "Unauthorized Change",
      },
    });

    expect(updated.statusCode).toBe(404);

    const stored = await prisma.researchStory.findUniqueOrThrow({
      where: { id: storyId },
    });

    expect(stored.title).toBe("Private Research Draft");
    expect(
      await prisma.storyVersion.count({ where: { storyId } }),
    ).toBe(0);
  });

  it("rejects edits to published, archived, retracted and deleted stories", async () => {
    const { cookie } = await registerAndLogin(app);

    const user = await prisma.user.findUniqueOrThrow({
      where: { username: "testuser1" },
    });

    const published = await createStory(user.id, {
      title: "Published Story",
      slug: "published-edit-test",
      status: "PUBLISHED",
    });

    const archived = await createStory(user.id, {
      title: "Archived Story",
      slug: "archived-edit-test",
      status: "ARCHIVED",
    });

    const retracted = await createStory(user.id, {
      title: "Retracted Story",
      slug: "retracted-edit-test",
      status: "RETRACTED",
    });

    const deleted = await createStory(user.id, {
      title: "Deleted Draft",
      slug: "deleted-edit-test",
      status: "DRAFT",
      publishedAt: null,
      deletedAt: new Date(),
    });

    for (const story of [published, archived, retracted, deleted]) {
      const res = await app.inject({
        method: "PATCH",
        url: `/stories/${story.id}`,
        cookies: cookie,
        payload: { title: "Attempted Edit" },
      });

      expect(res.statusCode).toBe(404);
    }

    expect(await prisma.storyVersion.count()).toBe(0);
  });

  it("supports partial updates without overwriting omitted fields", async () => {
    const { cookie } = await registerAndLogin(app);

    const created = await app.inject({
      method: "POST",
      url: "/stories",
      cookies: cookie,
      payload: {
        title: "Partial Update Test",
        summary: "Original summary.",
        classification: "RESEARCH_REPORT",
        researchQuestion: "Original research question?",
        methodology: "Original methodology.",
      },
    });

    const storyId = created.json().story.id;

    const updated = await app.inject({
      method: "PATCH",
      url: `/stories/${storyId}`,
      cookies: cookie,
      payload: {
        findings: "New findings.",
      },
    });

    expect(updated.statusCode).toBe(200);

    expect(updated.json().story).toMatchObject({
      title: "Partial Update Test",
      summary: "Original summary.",
      researchQuestion: "Original research question?",
      methodology: "Original methodology.",
      findings: "New findings.",
    });
  });
});


describe("F-05.4 research story publishing", () => {
  const validPublication = {
    attestation: true,
    authors: [
      {
        displayName: "Dr. Ada Researcher",
        affiliationText: "LAUTECH",
        role: "LEAD_AUTHOR",
        isCorresponding: true,
      },
      {
        displayName: "Francis Olaleke",
        affiliationText: "Independent Researcher",
        role: "CO_AUTHOR",
      },
    ],
  };

  async function createDraft(cookie: Record<string, string>) {
    return app.inject({
      method: "POST",
      url: "/stories",
      cookies: cookie,
      payload: {
        title: "Understanding Malaria Transmission",
        summary: "A study of malaria transmission patterns.",
        classification: "RESEARCH_REPORT",
      },
    });
  }

  async function attachMedia(
    storyId: string,
    processingStatus: "PROCESSING" | "FAILED" | "READY",
    type: "IMAGE" | "VIDEO" = "IMAGE",
  ) {
    const story = await prisma.researchStory.findUniqueOrThrow({
      where: { id: storyId },
      select: { creatorId: true },
    });

    const media = await prisma.mediaAsset.create({
      data: {
        uploadedById: story.creatorId,
        type,
        storageKey: "publish-readiness/" + storyId + "-" + processingStatus + "-" + type,
        storageProvider: "cloudinary",
        originalName: type === "VIDEO" ? "research-video.mp4" : "research-image.png",
        mimeType: type === "VIDEO" ? "video/mp4" : "image/png",
        sizeBytes: 1024n,
        processingStatus,
      },
    });

    await prisma.storyMedia.create({
      data: {
        storyId,
        mediaAssetId: media.id,
        sortOrder: 0,
      },
    });
  }

  async function createAttachableMedia(
    storyId: string,
    type: "IMAGE" | "VIDEO" | "DOCUMENT" = "IMAGE",
    processingStatus: "PROCESSING" | "READY" | "FAILED" | "UPLOADING" = "READY",
  ) {
    const story = await prisma.researchStory.findUniqueOrThrow({
      where: { id: storyId },
      select: { creatorId: true },
    });

    return prisma.mediaAsset.create({
      data: {
        uploadedById: story.creatorId,
        type,
        storageKey:
          "story-attachment/" +
          story.creatorId +
          "/" +
          Date.now() +
          "-" +
          Math.random(),
        storageProvider: "cloudinary",
        originalName: type === "VIDEO" ? "research-video.mp4" : "research-image.png",
        mimeType: type === "VIDEO" ? "video/mp4" : "image/png",
        sizeBytes: 1024n,
        processingStatus,
      },
    });
  }

  it("requires authentication to read draft media", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/stories/00000000-0000-4000-8000-000000000001/media",
    });

    expect(res.statusCode).toBe(401);
  });

  it("returns ordered draft media without exposing storage details", async () => {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;

    const firstMedia = await createAttachableMedia(storyId);
    const secondMedia = await createAttachableMedia(storyId);

    await prisma.storyMedia.create({
      data: {
        storyId,
        mediaAssetId: secondMedia.id,
        sortOrder: 1,
        caption: "Second slide",
      },
    });

    await prisma.storyMedia.create({
      data: {
        storyId,
        mediaAssetId: firstMedia.id,
        sortOrder: 0,
        caption: "First slide",
      },
    });

    const res = await app.inject({
      method: "GET",
      url: `/stories/${storyId}/media`,
      cookies: cookie,
    });

    expect(res.statusCode).toBe(200);

    const body = res.json();

    expect(body.attachments).toHaveLength(2);
    expect(body.attachments[0]).toMatchObject({
      sortOrder: 0,
      caption: "First slide",
      media: {
        id: firstMedia.id,
        type: "IMAGE",
        status: "READY",
      },
    });
    expect(body.attachments[1]).toMatchObject({
      sortOrder: 1,
      caption: "Second slide",
      media: {
        id: secondMedia.id,
        type: "IMAGE",
        status: "READY",
      },
    });

    const responseText = JSON.stringify(body);
    expect(responseText).not.toContain(firstMedia.storageKey);
    expect(responseText).not.toContain(secondMedia.storageKey);
    expect(responseText).not.toContain("storageProvider");
    expect(responseText).not.toContain("cloudinary");
  });

  it("does not expose another researcher's draft media", async () => {
    const owner = await registerAndLogin(app, 1);
    const other = await registerAndLogin(app, 2);
    const draft = await createDraft(owner.cookie);
    const storyId = draft.json().story.id;

    const res = await app.inject({
      method: "GET",
      url: `/stories/${storyId}/media`,
      cookies: other.cookie,
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe("Research draft not found");
  });

  it("excludes deleted media from draft attachments", async () => {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;
    const media = await createAttachableMedia(storyId);

    await prisma.storyMedia.create({
      data: {
        storyId,
        mediaAssetId: media.id,
        sortOrder: 0,
        caption: "Deleted asset",
      },
    });

    await prisma.mediaAsset.update({
      where: { id: media.id },
      data: { deletedAt: new Date() },
    });

    const res = await app.inject({
      method: "GET",
      url: `/stories/${storyId}/media`,
      cookies: cookie,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().attachments).toEqual([]);
  });
  it("attaches an owned ready image to a draft", async () => {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;
    const media = await createAttachableMedia(storyId);

    const res = await app.inject({
      method: "POST",
      url: "/stories/" + storyId + "/media",
      cookies: cookie,
      payload: {
        mediaAssetId: media.id,
        caption: "Graphical abstract",
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().attachment).toMatchObject({
      sortOrder: 0,
      caption: "Graphical abstract",
      media: {
        id: media.id,
        type: "IMAGE",
        processingStatus: "READY",
      },
    });
    expect(res.json().attachment.media).not.toHaveProperty("storageKey");
    expect(
      await prisma.storyMedia.count({ where: { storyId } }),
    ).toBe(1);
  });

  it("allows an owned image to be attached while processing", async () => {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;
    const media = await createAttachableMedia(storyId, "IMAGE", "PROCESSING");

    const res = await app.inject({
      method: "POST",
      url: "/stories/" + storyId + "/media",
      cookies: cookie,
      payload: { mediaAssetId: media.id },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().attachment.media.processingStatus).toBe("PROCESSING");
  });

  it("requires authentication to attach story media", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/stories/00000000-0000-4000-8000-000000000001/media",
      payload: {
        mediaAssetId: "00000000-0000-4000-8000-000000000002",
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it("rejects failed media assets", async () => {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;
    const media = await createAttachableMedia(storyId, "IMAGE", "FAILED");

    const res = await app.inject({
      method: "POST",
      url: "/stories/" + storyId + "/media",
      cookies: cookie,
      payload: { mediaAssetId: media.id },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("MEDIA_NOT_ATTACHABLE");
    expect(await prisma.storyMedia.count({ where: { storyId } })).toBe(0);
  });

  it("rejects media uploaded by another researcher", async () => {
    const { cookie } = await registerAndLogin(app);
    const { cookie: otherCookie } = await registerAndLogin(app, 2);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;
    const otherDraft = await createDraft(otherCookie);
    const otherStoryId = otherDraft.json().story.id;
    const media = await createAttachableMedia(otherStoryId);

    const res = await app.inject({
      method: "POST",
      url: "/stories/" + storyId + "/media",
      cookies: cookie,
      payload: { mediaAssetId: media.id },
    });

    expect(res.statusCode).toBe(404);
    expect(await prisma.storyMedia.count({ where: { storyId } })).toBe(0);
  });

  it("rejects duplicate media attachments", async () => {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;
    const media = await createAttachableMedia(storyId);

    const payload = { mediaAssetId: media.id };
    const first = await app.inject({
      method: "POST",
      url: "/stories/" + storyId + "/media",
      cookies: cookie,
      payload,
    });
    const second = await app.inject({
      method: "POST",
      url: "/stories/" + storyId + "/media",
      cookies: cookie,
      payload,
    });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(409);
    expect(second.json().code).toBe("STORY_MEDIA_ALREADY_ATTACHED");
    expect(await prisma.storyMedia.count({ where: { storyId } })).toBe(1);
  });

  it("assigns sequential sort orders to attached images", async () => {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;
    const firstMedia = await createAttachableMedia(storyId);
    const secondMedia = await createAttachableMedia(storyId);

    const first = await app.inject({
      method: "POST",
      url: "/stories/" + storyId + "/media",
      cookies: cookie,
      payload: { mediaAssetId: firstMedia.id },
    });
    const second = await app.inject({
      method: "POST",
      url: "/stories/" + storyId + "/media",
      cookies: cookie,
      payload: { mediaAssetId: secondMedia.id },
    });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(201);
    expect(first.json().attachment.sortOrder).toBe(0);
    expect(second.json().attachment.sortOrder).toBe(1);
  });

  it("prevents mixing a video with image slides", async () => {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;
    const image = await createAttachableMedia(storyId, "IMAGE");
    const video = await createAttachableMedia(storyId, "VIDEO");

    const first = await app.inject({
      method: "POST",
      url: "/stories/" + storyId + "/media",
      cookies: cookie,
      payload: { mediaAssetId: image.id },
    });
    const second = await app.inject({
      method: "POST",
      url: "/stories/" + storyId + "/media",
      cookies: cookie,
      payload: { mediaAssetId: video.id },
    });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(409);
    expect(second.json().code).toBe("INCOMPATIBLE_STORY_MEDIA");
  });

  it("rejects a video when the draft already contains a video", async () => {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;
    const firstVideo = await createAttachableMedia(storyId, "VIDEO");
    const secondVideo = await createAttachableMedia(storyId, "VIDEO");

    const first = await app.inject({
      method: "POST",
      url: "/stories/" + storyId + "/media",
      cookies: cookie,
      payload: { mediaAssetId: firstVideo.id },
    });
    const second = await app.inject({
      method: "POST",
      url: "/stories/" + storyId + "/media",
      cookies: cookie,
      payload: { mediaAssetId: secondVideo.id },
    });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(409);
    expect(second.json().code).toBe("INCOMPATIBLE_STORY_MEDIA");
  });

  it("rejects the eleventh image on a draft", async () => {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;

    for (let index = 0; index < 10; index += 1) {
      const media = await createAttachableMedia(storyId);
      const res = await app.inject({
        method: "POST",
        url: "/stories/" + storyId + "/media",
        cookies: cookie,
        payload: { mediaAssetId: media.id },
      });
      expect(res.statusCode).toBe(201);
    }

    const eleventhMedia = await createAttachableMedia(storyId);
    const eleventh = await app.inject({
      method: "POST",
      url: "/stories/" + storyId + "/media",
      cookies: cookie,
      payload: { mediaAssetId: eleventhMedia.id },
    });

    expect(eleventh.statusCode).toBe(409);
    expect(eleventh.json().code).toBe("STORY_IMAGE_LIMIT");
    expect(await prisma.storyMedia.count({ where: { storyId } })).toBe(10);
  });
  async function expectPublicationBlockedByMedia(
    processingStatus: "PROCESSING" | "FAILED",
  ) {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;

    await attachMedia(storyId, processingStatus);

    const res = await app.inject({
      method: "POST",
      url: "/stories/" + storyId + "/publish",
      cookies: cookie,
      payload: validPublication,
    });

    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({
      code: "STORY_MEDIA_NOT_READY",
    });

    const stored = await prisma.researchStory.findUniqueOrThrow({
      where: { id: storyId },
    });

    expect(stored.status).toBe("DRAFT");
    expect(stored.publishedAt).toBeNull();

    expect(
      await prisma.storyAuthor.count({
        where: { storyId },
      }),
    ).toBe(0);
  }
  it("blocks publication while attached media is processing", async () => {
    await expectPublicationBlockedByMedia("PROCESSING");
  });

  it("blocks publication when attached media has failed processing", async () => {
    await expectPublicationBlockedByMedia("FAILED");
  });

  it("publishes a draft when all attached media is ready", async () => {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;

    await attachMedia(storyId, "READY", "IMAGE");

    const res = await app.inject({
      method: "POST",
      url: "/stories/" + storyId + "/publish",
      cookies: cookie,
      payload: validPublication,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().story).toMatchObject({
      id: storyId,
      status: "PUBLISHED",
    });
  });
  it("rejects publishing without authentication", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/stories/00000000-0000-4000-8000-000000000001/publish",
      payload: validPublication,
    });

    expect(res.statusCode).toBe(401);
  });

  it("rejects publication without a valid attestation", async () => {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;

    const res = await app.inject({
      method: "POST",
      url: `/stories/${storyId}/publish`,
      cookies: cookie,
      payload: {
        ...validPublication,
        attestation: false,
      },
    });

    expect(res.statusCode).toBe(400);

    const stored = await prisma.researchStory.findUniqueOrThrow({
      where: { id: storyId },
    });

    expect(stored.status).toBe("DRAFT");
  });

  it("rejects publication without exactly one lead author", async () => {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;

    const res = await app.inject({
      method: "POST",
      url: `/stories/${storyId}/publish`,
      cookies: cookie,
      payload: {
        attestation: true,
        authors: [
          {
            displayName: "Researcher One",
            role: "CO_AUTHOR",
          },
        ],
      },
    });

    expect(res.statusCode).toBe(400);

    const stored = await prisma.researchStory.findUniqueOrThrow({
      where: { id: storyId },
    });

    expect(stored.status).toBe("DRAFT");
  });

  it("publishes an owner's draft and saves explicit author attribution", async () => {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;

    const res = await app.inject({
      method: "POST",
      url: `/stories/${storyId}/publish`,
      cookies: cookie,
      payload: validPublication,
    });

    expect(res.statusCode).toBe(200);

    expect(res.json().story).toMatchObject({
      id: storyId,
      status: "PUBLISHED",
      authors: [
        {
          displayName: "Dr. Ada Researcher",
          affiliationText: "LAUTECH",
          role: "LEAD_AUTHOR",
          sortOrder: 0,
          isCorresponding: true,
        },
        {
          displayName: "Francis Olaleke",
          affiliationText: "Independent Researcher",
          role: "CO_AUTHOR",
          sortOrder: 1,
          isCorresponding: false,
        },
      ],
    });

    expect(res.json().story.publishedAt).toBeTruthy();

    const stored = await prisma.researchStory.findUniqueOrThrow({
      where: { id: storyId },
    });

    expect(stored.status).toBe("PUBLISHED");
    expect(stored.publishedAt).not.toBeNull();

    expect(
      await prisma.storyAuthor.count({
        where: { storyId },
      }),
    ).toBe(2);
  });

  it("prevents another researcher from publishing someone else's draft", async () => {
    const firstUser = await registerAndLogin(app, 1);
    const secondUser = await registerAndLogin(app, 2);

    const draft = await createDraft(firstUser.cookie);
    const storyId = draft.json().story.id;

    const res = await app.inject({
      method: "POST",
      url: `/stories/${storyId}/publish`,
      cookies: secondUser.cookie,
      payload: validPublication,
    });

    expect(res.statusCode).toBe(404);

    const stored = await prisma.researchStory.findUniqueOrThrow({
      where: { id: storyId },
    });

    expect(stored.status).toBe("DRAFT");

    expect(
      await prisma.storyAuthor.count({
        where: { storyId },
      }),
    ).toBe(0);
  });

  it("rejects publishing already published, archived, retracted or deleted stories", async () => {
    const { cookie } = await registerAndLogin(app);

    const user = await prisma.user.findUniqueOrThrow({
      where: { username: "testuser1" },
    });

    const published = await createStory(user.id, {
      slug: "published-publish-test",
      status: "PUBLISHED",
    });

    const archived = await createStory(user.id, {
      slug: "archived-publish-test",
      status: "ARCHIVED",
    });

    const retracted = await createStory(user.id, {
      slug: "retracted-publish-test",
      status: "RETRACTED",
    });

    const deleted = await createStory(user.id, {
      slug: "deleted-publish-test",
      status: "DRAFT",
      publishedAt: null,
      deletedAt: new Date(),
    });

    for (const story of [published, archived, retracted, deleted]) {
      const res = await app.inject({
        method: "POST",
        url: `/stories/${story.id}/publish`,
        cookies: cookie,
        payload: validPublication,
      });

      expect(res.statusCode).toBe(404);
    }
  });

  it("makes a successfully published story available in the public feed", async () => {
    const { cookie } = await registerAndLogin(app);
    const draft = await createDraft(cookie);
    const storyId = draft.json().story.id;

    const published = await app.inject({
      method: "POST",
      url: `/stories/${storyId}/publish`,
      cookies: cookie,
      payload: validPublication,
    });

    expect(published.statusCode).toBe(200);

    // Deliberately make this request without authentication.
    const feed = await app.inject({
      method: "GET",
      url: "/stories/feed",
    });

    expect(feed.statusCode).toBe(200);

    const story = feed.json().stories.find(
      (item: { id: string }) => item.id === storyId,
    );

    expect(story).toBeDefined();
    expect(story.title).toBe("Understanding Malaria Transmission");
  });
});



// F-06: Public research story detail
describe("F-06 public research story detail", () => {
  it("returns a published story by slug without exposing private fields", async () => {
    const user = await createUser();

    await createStory(user.id, {
      title: "Public Detail Test",
      slug: "public-detail-test",
      researchQuestion: "What are the research implications?",
      methodology: "A descriptive methodology.",
      findings: "The findings are presented here.",
      significance: "This research has practical significance.",
      limitations: "The study has defined limitations.",
    });

    const res = await app.inject({
      method: "GET",
      url: "/stories/public-detail-test",
    });

    expect(res.statusCode).toBe(200);

    const story = res.json().story;

    expect(story).toMatchObject({
      slug: "public-detail-test",
      title: "Public Detail Test",
      researchQuestion: "What are the research implications?",
      methodology: "A descriptive methodology.",
      findings: "The findings are presented here.",
      significance: "This research has practical significance.",
      limitations: "The study has defined limitations.",
      creator: {
        username: "feeduser1",
        displayName: "Feed User 1",
      },
    });

    expect(story.creator).not.toHaveProperty("email");
    expect(story.creator).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(story)).not.toContain("storageKey");
    expect(JSON.stringify(story)).not.toContain("storageProvider");
    expect(JSON.stringify(story)).not.toContain("feeduser1@example.com");
  });

  it("returns 404 for drafts, unpublished, archived, retracted and deleted stories", async () => {
    const user = await createUser();

    const hiddenStories = [
      await createStory(user.id, {
        slug: "detail-draft",
        status: "DRAFT",
        publishedAt: null,
      }),
      await createStory(user.id, {
        slug: "detail-unpublished",
        status: "PUBLISHED",
        publishedAt: null,
      }),
      await createStory(user.id, {
        slug: "detail-archived",
        status: "ARCHIVED",
      }),
      await createStory(user.id, {
        slug: "detail-retracted",
        status: "RETRACTED",
      }),
      await createStory(user.id, {
        slug: "detail-deleted",
        deletedAt: new Date(),
      }),
    ];

    for (const story of hiddenStories) {
      const res = await app.inject({
        method: "GET",
        url: `/stories/${story.slug}`,
      });

      expect(res.statusCode).toBe(404);
    }
  });

  it("returns 404 when the story creator is suspended or deleted", async () => {
    const suspendedUser = await createUser(1, {
      status: "SUSPENDED",
    });

    const deletedUser = await createUser(2, {
      deletedAt: new Date(),
    });

    await createStory(suspendedUser.id, {
      slug: "detail-suspended-creator",
    });

    await createStory(deletedUser.id, {
      slug: "detail-deleted-creator",
    });

    for (const slug of [
      "detail-suspended-creator",
      "detail-deleted-creator",
    ]) {
      const res = await app.inject({
        method: "GET",
        url: `/stories/${slug}`,
      });

      expect(res.statusCode).toBe(404);
    }
  });

  it("returns 404 when a retraction record exists", async () => {
    const user = await createUser();

    const story = await createStory(user.id, {
      slug: "detail-with-retraction-record",
      status: "PUBLISHED",
    });

    await prisma.retraction.create({
      data: {
        storyId: story.id,
        initiatedById: user.id,
        reason: "Retraction test reason.",
        notice: "This story has been retracted.",
      },
    });

    const res = await app.inject({
      method: "GET",
      url: "/stories/detail-with-retraction-record",
    });

    expect(res.statusCode).toBe(404);
  });

  it("returns 404 for an unknown slug", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/stories/this-story-does-not-exist",
    });

    expect(res.statusCode).toBe(404);
  });
});

describe("F-05.5 published story owner actions", () => {
  it("allows the owner to edit within 15 minutes and preserves the previous version", async () => {
    const { cookie } = await registerAndLogin(app);
    const user = await prisma.user.findUniqueOrThrow({
      where: { username: "testuser1" },
    });

    const story = await createStory(user.id, {
      title: "Original published title",
      slug: "owner-edit-within-window",
      publishedAt: new Date(Date.now() - 5 * 60 * 1000),
    });

    const res = await app.inject({
      method: "PATCH",
      url: `/stories/${story.id}/published`,
      cookies: cookie,
      payload: {
        title: "Updated published title",
        changeNote: "Correcting the original title.",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().story.title).toBe("Updated published title");

    const version = await prisma.storyVersion.findFirstOrThrow({
      where: { storyId: story.id },
    });

    expect(version).toMatchObject({
      versionNumber: 1,
      title: "Original published title",
      changeNote: "Correcting the original title.",
      createdById: user.id,
    });

    const audit = await prisma.auditEvent.findFirst({
      where: {
        action: "STORY_PUBLISHED_EDITED",
        entityId: story.id,
      },
    });

    expect(audit).not.toBeNull();
  });

  it("rejects edits after the 15-minute window expires", async () => {
    const { cookie } = await registerAndLogin(app);
    const user = await prisma.user.findUniqueOrThrow({
      where: { username: "testuser1" },
    });

    const story = await createStory(user.id, {
      title: "Expired edit story",
      slug: "owner-edit-expired",
      publishedAt: new Date(Date.now() - 16 * 60 * 1000),
    });

    const res = await app.inject({
      method: "PATCH",
      url: `/stories/${story.id}/published`,
      cookies: cookie,
      payload: { title: "Should not be accepted" },
    });

    expect(res.statusCode).toBe(403);

    const unchanged = await prisma.researchStory.findUniqueOrThrow({
      where: { id: story.id },
    });
    expect(unchanged.title).toBe("Expired edit story");

    expect(
      await prisma.storyVersion.count({ where: { storyId: story.id } }),
    ).toBe(0);
  });

  it("prevents another researcher from editing the owner's published story", async () => {
    const owner = await registerAndLogin(app, 1);
    const other = await registerAndLogin(app, 2);

    const user = await prisma.user.findUniqueOrThrow({
      where: { username: "testuser1" },
    });

    const story = await createStory(user.id, {
      title: "Private owner edit target",
      slug: "non-owner-edit-target",
    });

    const res = await app.inject({
      method: "PATCH",
      url: `/stories/${story.id}/published`,
      cookies: other.cookie,
      payload: { title: "Unauthorized change" },
    });

    expect(res.statusCode).toBe(404);

    const unchanged = await prisma.researchStory.findUniqueOrThrow({
      where: { id: story.id },
    });
    expect(unchanged.title).toBe("Private owner edit target");

    expect(
      await prisma.storyVersion.count({ where: { storyId: story.id } }),
    ).toBe(0);
  });

  it("allows the owner to soft-delete a published story at any age and audits it", async () => {
    const { cookie } = await registerAndLogin(app);
    const user = await prisma.user.findUniqueOrThrow({
      where: { username: "testuser1" },
    });

    const story = await createStory(user.id, {
      title: "Story to soft delete",
      slug: "owner-soft-delete-target",
      publishedAt: new Date(Date.now() - 30 * 60 * 1000),
    });

    const res = await app.inject({
      method: "DELETE",
      url: `/stories/${story.id}`,
      cookies: cookie,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true });

    const deleted = await prisma.researchStory.findUniqueOrThrow({
      where: { id: story.id },
    });
    expect(deleted.deletedAt).toBeInstanceOf(Date);

    const audit = await prisma.auditEvent.findFirst({
      where: {
        action: "STORY_PUBLISHED_SOFT_DELETED",
        entityId: story.id,
      },
    });
    expect(audit).not.toBeNull();

    const detail = await app.inject({
      method: "GET",
      url: `/stories/${story.slug}`,
    });
    expect(detail.statusCode).toBe(404);

    const feed = await app.inject({
      method: "GET",
      url: "/stories/feed",
    });
    expect(
      feed.json().stories.some((item: { id: string }) => item.id === story.id),
    ).toBe(false);
  });

  it("prevents another researcher from deleting the owner's published story", async () => {
    const owner = await registerAndLogin(app, 1);
    const other = await registerAndLogin(app, 2);

    const user = await prisma.user.findUniqueOrThrow({
      where: { username: "testuser1" },
    });

    const story = await createStory(user.id, {
      title: "Protected published story",
      slug: "non-owner-delete-target",
    });

    const res = await app.inject({
      method: "DELETE",
      url: `/stories/${story.id}`,
      cookies: other.cookie,
    });

    expect(res.statusCode).toBe(404);

    const unchanged = await prisma.researchStory.findUniqueOrThrow({
      where: { id: story.id },
    });
    expect(unchanged.deletedAt).toBeNull();
  });

  it("requires authentication for published-story edits and deletion", async () => {
    const user = await createUser();
    const story = await createStory(user.id, {
      slug: "unauthenticated-owner-actions",
    });

    const edit = await app.inject({
      method: "PATCH",
      url: `/stories/${story.id}/published`,
      payload: { title: "Unauthenticated edit" },
    });

    const deletion = await app.inject({
      method: "DELETE",
      url: `/stories/${story.id}`,
    });

    expect(edit.statusCode).toBe(401);
    expect(deletion.statusCode).toBe(401);

    const unchanged = await prisma.researchStory.findUniqueOrThrow({
      where: { id: story.id },
    });
    expect(unchanged.deletedAt).toBeNull();
    expect(unchanged.title).toBe("Test Research Story");
  });
});