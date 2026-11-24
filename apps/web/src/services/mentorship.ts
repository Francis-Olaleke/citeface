export interface MentorOffering {
  id: string;
  serviceType: "MENTORSHIP" | "TUTORING" | "TEACHING" | "CONSULTING" | "RESEARCH_ADVICE";
  expertise: string;
  description: string;
  priceMinor: number;
  currency: string;
  durationMinutes: number;
  isActive: boolean;
  mentor: {
    id: string;
    username: string;
    displayName: string;
    researcherProfile: {
      headline: string | null;
      profileImageUrl: string | null;
      isVerified: boolean;
      country: string | null;
    } | null;
  };
}

async function payload(response: Response) {
  let data: Record<string, unknown> = {};
  try {
    const result: unknown = await response.json();
    if (typeof result === "object" && result !== null) data = result as Record<string, unknown>;
  } catch {}
  return data;
}

function message(data: Record<string, unknown>, fallback: string) {
  return typeof data.message === "string"
    ? data.message
    : typeof data.error === "string"
      ? data.error
      : fallback;
}

export async function getMentorOfferings(): Promise<MentorOffering[]> {
  const response = await fetch("/api/mentorship", { credentials: "include" });
  const data = await payload(response);
  if (!response.ok) throw new Error(message(data, "Unable to load mentorship offerings."));
  return (data.offerings as MentorOffering[]) ?? [];
}

export async function createMentorOffering(
  expertise: string,
  description: string,
  serviceType: "MENTORSHIP" | "TUTORING" | "TEACHING" | "CONSULTING" | "RESEARCH_ADVICE",
  priceMinor: number,
  currency: string,
  durationMinutes: number,
) {
  const response = await fetch("/api/mentorship/offerings", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expertise, description, serviceType, priceMinor, currency, durationMinutes }),
  });
  const data = await payload(response);
  if (!response.ok) throw new Error(message(data, "Unable to publish your mentoring offer."));
  return data;
}

export async function requestMentorship(offeringId: string, requestMessage: string) {
  const response = await fetch(`/api/mentorship/offerings/${encodeURIComponent(offeringId)}/request`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: requestMessage }),
  });
  const data = await payload(response);
  if (!response.ok) throw new Error(message(data, "Unable to request mentorship."));
  return data;
}

export async function startStripeOnboarding(): Promise<string> {
  const response = await fetch("/api/mentorship/stripe/onboarding", {
    method: "POST",
    credentials: "include",
  });
  const data = await payload(response);
  if (!response.ok) throw new Error(message(data, "Unable to start Stripe onboarding."));
  return data.url as string;
}

export async function startMentorshipCheckout(requestId: string): Promise<string> {
  const response = await fetch(`/api/mentorship/requests/${encodeURIComponent(requestId)}/checkout`, {
    method: "POST",
    credentials: "include",
  });
  const data = await payload(response);
  if (!response.ok) throw new Error(message(data, "Unable to start checkout."));
  return data.url as string;
}
