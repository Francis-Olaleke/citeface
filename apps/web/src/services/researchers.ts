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
    linkedinUrl: string | null;
    googleScholarUrl: string | null;
    citationCount: number;
    specializations: string[];
    education: Array<{ institution?: string; degree?: string; year?: string }>;
    institutionAffiliations: Array<{ institution?: string; role?: string; startYear?: string; endYear?: string }>;
    careerStage: string | null;
    professionalRanks: string[];
    researchInterests: string[];
    researchGoal: string | null;
    grants: Array<{ title?: string; funder?: string; year?: string }>;
    fellowships: Array<{ title?: string; organization?: string; year?: string }>;
    professionalBodies: Array<{ name?: string; role?: string }>;
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
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
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

export interface ResearcherDirectoryItem {
  username: string;
  displayName: string;
  createdAt: string;
  publicationCount: number;
  followerCount: number;
  researcherProfile: {
    headline: string | null;
    profileImageUrl: string | null;
    country: string | null;
    city: string | null;
    isVerified: boolean;
  } | null;
}

export interface ResearcherDirectoryResponse {
  researchers: ResearcherDirectoryItem[];
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

export async function getResearchers(
  page = 1,
  limit = 20,
  q = "",
): Promise<ResearcherDirectoryResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (q.trim()) params.set("q", q.trim());

  const response = await fetch(
    `/api/researchers/?${params.toString()}`,
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
          : "Unable to load researchers.";
    throw new ResearcherServiceError(message, response.status);
  }

  return data as unknown as ResearcherDirectoryResponse;
}

export async function setResearcherFollowing(
  username: string,
  following: boolean,
): Promise<{ following: boolean; followerCount: number }> {
  const response = await fetch(
    `/api/researchers/${encodeURIComponent(username)}/follow`,
    {
      method: following ? "POST" : "DELETE",
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
          : "Unable to update this connection.";
    throw new ResearcherServiceError(message, response.status);
  }

  return data as unknown as { following: boolean; followerCount: number };
}

export interface CredibilityProfilePayload {
  headline?: string;
  biography?: string;
  country?: string;
  city?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  googleScholarUrl?: string;
  orcidId?: string;
  citationCount?: number;
  specializations?: string[];
  education?: Array<{ institution?: string; degree?: string; year?: string }>;
  institutionAffiliations?: Array<{ institution?: string; role?: string; startYear?: string; endYear?: string }>;
  careerStage?: string;
  professionalRanks?: string[];
  researchInterests?: string[];
  researchGoal?: string;
  grants?: Array<{ title?: string; funder?: string; year?: string }>;
  fellowships?: Array<{ title?: string; organization?: string; year?: string }>;
  professionalBodies?: Array<{ name?: string; role?: string }>;
}

export async function getMyCredibilityProfile(): Promise<{
  profile: (CredibilityProfilePayload & { citationCount: number }) | null;
  affiliations: unknown[];
}> {
  const response = await fetch("/api/researchers/me/profile", {
    method: "GET",
    credentials: "include",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ResearcherServiceError(
    typeof data.error === "string" ? data.error : "Unable to load profile.",
    response.status,
  );
  return data as { profile: (CredibilityProfilePayload & { citationCount: number }) | null; affiliations: unknown[] };
}

export async function updateMyCredibilityProfile(payload: CredibilityProfilePayload) {
  const response = await fetch("/api/researchers/me/profile", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ResearcherServiceError(
    typeof data.error === "string" ? data.error : "Unable to save profile.",
    response.status,
  );
  return data.profile as CredibilityProfilePayload;
}