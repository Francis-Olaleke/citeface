export interface ResearcherProfileData {
  username: string;
  displayName: string;
  createdAt: string;
  researcherProfile: {
    headline: string | null;
    biography: string | null;
    profileImageUrl: string | null;
    coverImageUrl: string | null;
    country: string | null;
    city: string | null;
    websiteUrl: string | null;
    orcidId: string | null;
    isVerified: boolean;
  } | null;
  affiliations: {
    position: string | null;
    department: string | null;
    isPrimary: boolean;
    startDate: string | null;
    endDate: string | null;
    affiliation: {
      name: string;
      slug: string;
      type: string;
      websiteUrl: string | null;
      country: string | null;
    };
  }[];
}

export interface ResearcherStory {
  slug: string;
  title: string;
  summary: string;
  classification: string;
  publishedAt: string;
  authors: {
    displayName: string;
    affiliationText: string | null;
    role: string;
  }[];
}

export interface ResearcherResponse {
  researcher: ResearcherProfileData;
  stories: ResearcherStory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export class ResearcherServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ResearcherServiceError";
    this.status = status;
  }
}

export async function getResearcher(
  username: string,
  page = 1,
  limit = 20,
): Promise<ResearcherResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(
    `/api/researchers/${encodeURIComponent(username)}?${params.toString()}`,
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
    // The service will return a safe fallback error below.
  }

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : "Unable to load this researcher profile.";

    throw new ResearcherServiceError(message, response.status);
  }

  return data as unknown as ResearcherResponse;
}