export interface CommunitySummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  owner: { id: string; username: string; displayName: string };
  _count: { members: number; posts: number };
}

async function read(response: Response) {
  let data: Record<string, unknown> = {};
  try {
    const result: unknown = await response.json();
    if (typeof result === "object" && result !== null) data = result as Record<string, unknown>;
  } catch {}
  return data;
}

function message(data: Record<string, unknown>, fallback: string) {
  return typeof data.message === "string" ? data.message : typeof data.error === "string" ? data.error : fallback;
}

export async function getCommunities(q = ""): Promise<CommunitySummary[]> {
  const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  const response = await fetch(`/api/communities${params}`, { credentials: "include" });
  const data = await read(response);
  if (!response.ok) throw new Error(message(data, "Unable to load communities."));
  return (data.communities as CommunitySummary[]) ?? [];
}

export async function createCommunity(name: string, description: string) {
  const response = await fetch("/api/communities", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  const data = await read(response);
  if (!response.ok) throw new Error(message(data, "Unable to create the community."));
  return data.community as CommunitySummary;
}

export async function joinCommunity(slug: string) {
  const response = await fetch(`/api/communities/${encodeURIComponent(slug)}/join`, {
    method: "POST",
    credentials: "include",
  });
  const data = await read(response);
  if (!response.ok) throw new Error(message(data, "Unable to join this community."));
  return data;
}
