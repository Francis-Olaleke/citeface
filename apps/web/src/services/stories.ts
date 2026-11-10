
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
      durationSeconds: number | null;
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

export async function getStoriesFeed(
  page = 1,
  limit = 20
): Promise<StoriesFeedResponse> {
  const response = await fetch(
    `${API_URL}/feed?page=${page}&limit=${limit}`,
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
