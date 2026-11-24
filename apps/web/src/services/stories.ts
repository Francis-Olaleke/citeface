
const API_URL = "/api/stories";

export interface FeedStory {
  id: string;
  title: string;
  slug: string;
  summary: string;
  researchQuestion: string | null;
  classification: string;
  publishedAt: string | null;

  creator: {
    id: string;
    displayName: string;
    username: string;
    researcherProfile: {
      headline: string | null;
      profileImageUrl: string | null;
      isVerified: boolean;
    } | null;
  };

  authors: {
    id: string;
    displayName: string;
    affiliationText: string | null;
    role: string;
  }[];

  topics: {
    topic: {
      id: string;
      name: string;
      slug: string;
    };
  }[];

  media: {
    id: string;
    caption: string | null;
    media: {
      id: string;
      type: string;
      mimeType: string;
      width: number | null;
      height: number | null;
      durationSeconds: number | null;
      deliveryUrl: string | null;
    };
  }[];

  sources: {
    id: string;
    type: string;
    title: string | null;
    doi: string | null;
    url: string | null;
    journal: string | null;
  }[];

  _count: {
    reactions: number;
    comments: number;
  };
}

export interface StoriesFeedResponse {
  stories: FeedStory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export class StoriesServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "StoriesServiceError";
    this.status = status;
  }
}

export type ResearchClassification =
  | "PEER_REVIEWED_ARTICLE"
  | "PREPRINT"
  | "THESIS_DISSERTATION"
  | "CONFERENCE_PAPER"
  | "RESEARCH_REPORT"
  | "AUTHOR_DESCRIBED_PROJECT"
  | "PRELIMINARY_UNPUBLISHED";

export interface StoriesFeedFilters {
  q?: string;
  classification?: ResearchClassification | "";
  topic?: string;
}

export async function getStoriesFeed(
  page = 1,
  limit = 20,
  filters: StoriesFeedFilters = {}
): Promise<StoriesFeedResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (filters.q?.trim()) {
    params.set("q", filters.q.trim());
  }

  if (filters.classification) {
    params.set("classification", filters.classification);
  }

  if (filters.topic?.trim()) {
    params.set("topic", filters.topic.trim());
  }

  const response = await fetch(
    `${API_URL}/feed?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  let data: Record<string, unknown> = {};

  try {
    const result: unknown = await response.json();

    if (typeof result === "object" && result !== null) {
      data = result as Record<string, unknown>;
    }
  } catch {
    // Handle empty or non-JSON responses.
  }

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : "Unable to load research stories. Please try again.";

    throw new StoriesServiceError(message, response.status);
  }

  return data as unknown as StoriesFeedResponse;
}

export interface DraftStory {
  id: string;
  slug: string;
  title: string;
  summary: string;
  classification: string;
  researchQuestion: string | null;
  methodology: string | null;
  findings: string | null;
  significance: string | null;
  limitations: string | null;
  status: "DRAFT";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MyDraftsResponse {
  drafts: DraftStory[];
}

export async function getMyDrafts(): Promise<MyDraftsResponse> {
  const response = await fetch(`${API_URL}/drafts`, {
    method: "GET",
    credentials: "include",
  });

  let data: Record<string, unknown> = {};

  try {
    const result: unknown = await response.json();

    if (typeof result === "object" && result !== null) {
      data = result as Record<string, unknown>;
    }
  } catch {
    // Handle empty or non-JSON responses.
  }

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : "Unable to load your saved drafts. Please try again.";

    throw new StoriesServiceError(message, response.status);
  }

  return data as unknown as MyDraftsResponse;
}

export async function deleteStoryDraft(id: string): Promise<void> {
  const response = await fetch(
    `${API_URL}/drafts/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    let data: Record<string, unknown> = {};

    try {
      const result: unknown = await response.json();

      if (typeof result === "object" && result !== null) {
        data = result as Record<string, unknown>;
      }
    } catch {
      // Handle empty or non-JSON responses.
    }

    const message =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : "Unable to delete your research draft. Please try again.";

    throw new StoriesServiceError(message, response.status);
  }
}

export interface UpdateDraftPayload {
  title?: string;
  summary?: string;
  classification?: string;
  researchQuestion?: string | null;
  methodology?: string | null;
  findings?: string | null;
  significance?: string | null;
  limitations?: string | null;
  changeNote?: string;
}

export async function updateStoryDraft(
  id: string,
  payload: UpdateDraftPayload,
): Promise<{ story: DraftStory }> {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  let data: Record<string, unknown> = {};

  try {
    const result: unknown = await response.json();

    if (typeof result === "object" && result !== null) {
      data = result as Record<string, unknown>;
    }
  } catch {
    // Handle responses that do not contain JSON.
  }

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : "Unable to save your research draft. Please try again.";

    throw new StoriesServiceError(message, response.status);
  }

  return data as unknown as { story: DraftStory };
}

export interface CreateDraftPayload {
  title: string;
  summary: string;
  classification:
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
}

export async function createStoryDraft(
  payload: CreateDraftPayload,
): Promise<{ story: DraftStory }> {
  const response = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data: Record<string, unknown> = {};

  try {
    const result: unknown = await response.json();

    if (typeof result === "object" && result !== null) {
      data = result as Record<string, unknown>;
    }
  } catch {
    // Handle responses that do not contain JSON.
  }

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : "Unable to create your research draft. Please try again.";

    throw new StoriesServiceError(message, response.status);
  }

  return data as unknown as { story: DraftStory };
}

export type StoryAuthorRole =
  | "LEAD_AUTHOR"
  | "CO_AUTHOR"
  | "CONTRIBUTOR"
  | "SUPERVISOR"
  | "ADVISER"
  | "OTHER";

export interface PublishStoryAuthor {
  displayName: string;
  affiliationText?: string;
  role: StoryAuthorRole;
  isCorresponding?: boolean;
}

export interface PublishStoryPayload {
  attestation: true;
  authors: PublishStoryAuthor[];
}

export interface PublishedStory {
  id: string;
  slug: string;
  title: string;
  summary: string;
  classification: string;
  status: "PUBLISHED";
  publishedAt: string;
}

export async function publishStory(
  id: string,
  payload: PublishStoryPayload,
): Promise<{ story: PublishedStory }> {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(id)}/publish`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  let data: Record<string, unknown> = {};

  try {
    const result: unknown = await response.json();

    if (typeof result === "object" && result !== null) {
      data = result as Record<string, unknown>;
    }
  } catch {
    // Handle responses that do not contain JSON.
  }

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : "Unable to publish your research story. Please try again.";

    throw new StoriesServiceError(message, response.status);
  }

  return data as unknown as { story: PublishedStory };
}

// F-06: Public research story detail

export interface PublicStory {
  id: string;
  slug: string;
  title: string;
  summary: string;
  classification: string;
  researchQuestion: string | null;
  methodology: string | null;
  findings: string | null;
  significance: string | null;
  limitations: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;

  creator: {
    id: string;
    username: string;
    displayName: string;
  };

  authors: {
    id: string;
    displayName: string;
    affiliationText: string | null;
    role: string;
    sortOrder: number;
    isCorresponding: boolean;
  }[];

  topics: {
    topic: {
      id: string;
      name: string;
      slug: string;
    };
  }[];

  media: {
    id: string;
    sortOrder: number;
    caption: string | null;
    media: {
      id: string;
      type: string;
      mimeType: string;
      width: number | null;
      height: number | null;
      durationSeconds: number | null;
      createdAt: string;
      deliveryUrl: string | null;
    };
  }[];

  sources: {
    id: string;
    type: string;
    title: string | null;
    doi: string | null;
    url: string | null;
    journal: string | null;
    publisher: string | null;
    publicationDate: string | null;
    authorsText: string | null;
  }[];

  _count: {
    reactions: number;
    comments: number;
    questions: number;
  };
}

export async function getPublicStory(
  slug: string,
): Promise<{ story: PublicStory }> {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(slug)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  let data: Record<string, unknown> = {};

  try {
    const result: unknown = await response.json();

    if (typeof result === "object" && result !== null) {
      data = result as Record<string, unknown>;
    }
  } catch {
    // Handle empty or non-JSON responses.
  }

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : "Unable to load this research story. Please try again.";

    throw new StoriesServiceError(message, response.status);
  }

  return data as unknown as { story: PublicStory };
}
export interface PublishedStoryUpdatePayload {
  title?: string;
  summary?: string;
  researchQuestion?: string | null;
  methodology?: string | null;
  findings?: string | null;
  significance?: string | null;
  limitations?: string | null;
  changeNote?: string;
}

export async function updatePublishedStory(
  id: string,
  payload: PublishedStoryUpdatePayload,
): Promise<void> {
  const response = await fetch(`${API_URL}/${id}/published`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new StoriesServiceError(
      result?.message ?? "Unable to update the published story.",
      response.status,
    );
  }
}

export async function deletePublishedStory(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new StoriesServiceError(
      result?.message ?? "Unable to delete the published story.",
      response.status,
    );
  }
}

export async function getSavedStories(): Promise<{ stories: FeedStory[] }> {
  const response = await fetch(`${API_URL}/saved`, {
    method: "GET",
    credentials: "include",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new StoriesServiceError(
      typeof data.message === "string" ? data.message : "Unable to load saved research.",
      response.status,
    );
  }
  return data as unknown as { stories: FeedStory[] };
}

export async function setStorySaved(storyId: string, saved: boolean): Promise<void> {
  const response = await fetch(`${API_URL}/${encodeURIComponent(storyId)}/save`, {
    method: saved ? "POST" : "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new StoriesServiceError(
      typeof data.message === "string" ? data.message : "Unable to update saved research.",
      response.status,
    );
  }
}