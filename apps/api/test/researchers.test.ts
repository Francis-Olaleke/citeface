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
import { makeApp, registerAndLogin, resetDb } from "./helpers.js";

let app: FastifyInstance;

async function createResearcher(
  n = 1,
  options: {
    status?: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
    deletedAt?: Date | null;
  } = {},
) {
  return prisma.user.create({
    data: {
      email: `researcher${n}@example.com`,
      displayName: `Researcher ${n}`,
      username: `researcher${n}`,
      status: options.status ?? "ACTIVE",
      deletedAt: options.deletedAt ?? null,
    },
  });
}

async function createPublishedStory(
  creatorId: string,
  options: {
    slug: string;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "RETRACTED";
    retractedAt?: Date | null;
    deletedAt?: Date | null;
  },
) {
  return prisma.researchStory.create({
    data: {
      creatorId,
      title: `Story ${options.slug}`,
      slug: options.slug,
      summary: "A public research story for profile testing.",
      classification: "RESEARCH_REPORT",
      status: options.status ?? "PUBLISHED",
      publishedAt:
        options.status === "DRAFT" ? null : new Date(),
      retractedAt: options.retractedAt ?? null,
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

describe("F-08 researcher discovery and connections", () => {
  it("lists only active researchers with published work and supports search", async () => {
    const molecular = await createResearcher(1);
    const suspended = await createResearcher(2, { status: "SUSPENDED" });

    await prisma.researcherProfile.create({
      data: {
        userId: molecular.id,
        headline: "Molecular genomics researcher",
        country: "Nigeria",
      },
    });
    await createPublishedStory(molecular.id, { slug: "genomics-story" });
    await createPublishedStory(suspended.id, { slug: "suspended-story" });

    const response = await app.inject({
      method: "GET",
      url: "/researchers?q=genomics",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().researchers).toHaveLength(1);
    expect(response.json().researchers[0]).toMatchObject({
      username: "researcher1",
      displayName: "Researcher 1",
      publicationCount: 1,
      followerCount: 0,
    });
  });

  it("allows an authenticated researcher to follow and unfollow another researcher", async () => {
    const followerSession = await registerAndLogin(app, 1);
    const followed = await createResearcher();
    await createPublishedStory(followed.id, { slug: "followed-story" });

    const follow = await app.inject({
      method: "POST",
      url: "/researchers/researcher1/follow",
      cookies: followerSession.cookie,
    });
    expect(follow.statusCode).toBe(200);
    expect(follow.json()).toEqual({ following: true, followerCount: 1 });

    const unfollow = await app.inject({
      method: "DELETE",
      url: "/researchers/researcher1/follow",
      cookies: followerSession.cookie,
    });
    expect(unfollow.statusCode).toBe(200);
    expect(unfollow.json()).toEqual({ following: false, followerCount: 0 });
  });
});

describe("F-07 public researcher profiles", () => {
  it("returns public researcher details and published stories", async () => {
    const user = await createResearcher();

    await prisma.researcherProfile.create({
      data: {
        userId: user.id,
        headline: "Molecular Biology Researcher",
        biography: "Research interests in microbial genomics.",
        country: "Nigeria",
        city: "Ogbomoso",
        isVerified: false,
      },
    });

    await createPublishedStory(user.id, {
      slug: "researcher-public-story",
    });

    await createPublishedStory(user.id, {
      slug: "researcher-draft-story",
      status: "DRAFT",
    });

    await createPublishedStory(user.id, {
      slug: "researcher-deleted-story",
      deletedAt: new Date(),
    });

    const response = await app.inject({
      method: "GET",
      url: "/researchers/researcher1",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.researcher).toMatchObject({
      username: "researcher1",
      displayName: "Researcher 1",
      researcherProfile: {
        headline: "Molecular Biology Researcher",
        country: "Nigeria",
        city: "Ogbomoso",
      },
    });

    expect(body.researcher).not.toHaveProperty("email");
    expect(body.researcher).not.toHaveProperty("passwordHash");
    expect(body.stories).toHaveLength(1);
    expect(body.stories[0].slug).toBe("researcher-public-story");
    expect(body.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it("returns a public page when the researcher has no profile record", async () => {
    await createResearcher();

    const response = await app.inject({
      method: "GET",
      url: "/researchers/researcher1",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().researcher.researcherProfile).toBeNull();
    expect(response.json().stories).toEqual([]);
  });

  it("does not expose suspended or deleted researchers", async () => {
    await createResearcher(1, { status: "SUSPENDED" });
    await createResearcher(2, { deletedAt: new Date() });

    const suspended = await app.inject({
      method: "GET",
      url: "/researchers/researcher1",
    });

    const deleted = await app.inject({
      method: "GET",
      url: "/researchers/researcher2",
    });

    expect(suspended.statusCode).toBe(404);
    expect(deleted.statusCode).toBe(404);
  });

  it("supports bounded story pagination", async () => {
    const user = await createResearcher();

    await createPublishedStory(user.id, { slug: "story-one" });
    await createPublishedStory(user.id, { slug: "story-two" });

    const response = await app.inject({
      method: "GET",
      url: "/researchers/researcher1?page=1&limit=1",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().stories).toHaveLength(1);
    expect(response.json().pagination).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it("rejects invalid pagination values", async () => {
    await createResearcher();

    const response = await app.inject({
      method: "GET",
      url: "/researchers/researcher1?page=0&limit=100",
    });

    expect(response.statusCode).toBe(400);
  });
});