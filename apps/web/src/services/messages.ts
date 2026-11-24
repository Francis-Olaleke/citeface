export interface MessageParticipant {
  id: string;
  username: string;
  displayName: string;
  researcherProfile: {
    profileImageUrl: string | null;
    isVerified: boolean;
  } | null;
}

export interface ConversationSummary {
  id: string;
  updatedAt: string;
  participants: MessageParticipant[];
  lastMessage: {
    id: string;
    body: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
}

export interface DirectMessage {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  readAt: string | null;
  editedAt: string | null;
}

export class MessagesServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MessagesServiceError";
    this.status = status;
  }
}

async function readResponse(response: Response) {
  let data: Record<string, unknown> = {};
  try {
    const result: unknown = await response.json();
    if (typeof result === "object" && result !== null) data = result as Record<string, unknown>;
  } catch {
    // A non-JSON response will use the safe fallback below.
  }
  return data;
}

function errorMessage(data: Record<string, unknown>, fallback: string) {
  return typeof data.message === "string"
    ? data.message
    : typeof data.error === "string"
      ? data.error
      : fallback;
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const response = await fetch("/api/messages/conversations", {
    method: "GET",
    credentials: "include",
  });
  const data = await readResponse(response);
  if (!response.ok) throw new MessagesServiceError(errorMessage(data, "Unable to load conversations."), response.status);
  return (data.conversations as ConversationSummary[]) ?? [];
}

export async function startConversation(username: string): Promise<string> {
  const response = await fetch("/api/messages/conversations", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new MessagesServiceError(errorMessage(data, "Unable to start the conversation."), response.status);
  return data.conversationId as string;
}

export async function getConversationMessages(conversationId: string): Promise<{
  conversation: { id: string; participants: MessageParticipant[] };
  messages: DirectMessage[];
}> {
  const response = await fetch(`/api/messages/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "GET",
    credentials: "include",
  });
  const data = await readResponse(response);
  if (!response.ok) throw new MessagesServiceError(errorMessage(data, "Unable to load messages."), response.status);
  return data as unknown as {
    conversation: { id: string; participants: MessageParticipant[] };
    messages: DirectMessage[];
  };
}

export async function sendMessage(conversationId: string, body: string): Promise<DirectMessage> {
  const response = await fetch(`/api/messages/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  const data = await readResponse(response);
  if (!response.ok) throw new MessagesServiceError(errorMessage(data, "Unable to send the message."), response.status);
  return (data.message as DirectMessage);
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const response = await fetch(`/api/messages/conversations/${encodeURIComponent(conversationId)}/read`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!response.ok) {
    const data = await readResponse(response);
    throw new MessagesServiceError(errorMessage(data, "Unable to mark messages read."), response.status);
  }
}
