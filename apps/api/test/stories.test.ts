
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
      classification: "RESEARCH_REPORT",
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

