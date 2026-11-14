
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


