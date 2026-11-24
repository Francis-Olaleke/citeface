import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CitefaceBrand from "../components/CitefaceBrand";
import { useAuth } from "../context/AuthContext";
import {
  getConversationMessages,
  getConversations,
  markConversationRead,
  sendMessage,
  startConversation,
  type ConversationSummary,
  type DirectMessage,
  type MessageParticipant,
} from "../services/messages";
import "./messages.css";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function otherParticipant(participants: MessageParticipant[], currentUserId: string) {
  return participants.find((participant) => participant.id !== currentUserId) ?? participants[0];
}

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [activeParticipants, setActiveParticipants] = useState<MessageParticipant[]>([]);
  const [recipient, setRecipient] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadConversations() {
      setLoading(true);
      setError(null);
      try {
        const result = await getConversations();
        if (!cancelled) setConversations(result);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load messages.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadConversations();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!conversationId) {
      setMessages([]);
      setActiveParticipants([]);
      return;
    }

    async function loadThread() {
      setError(null);
      try {
        const result = await getConversationMessages(conversationId!);
        if (cancelled) return;
        setActiveParticipants(result.conversation.participants);
        setMessages(result.messages);
        await markConversationRead(conversationId!);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load messages.");
      }
    }
    void loadThread();
    return () => { cancelled = true; };
  }, [conversationId]);

  useEffect(() => {
    messageEnd.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recipient.trim()) return;
    setSending(true);
    setError(null);
    try {
      const id = await startConversation(recipient.trim().replace(/^@/, ""));
      setRecipient("");
      const result = await getConversationMessages(id);
      setActiveParticipants(result.conversation.participants);
      setMessages(result.messages);
      navigate(`/messages/${id}`);
      setConversations(await getConversations());
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start the conversation.");
    } finally {
      setSending(false);
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conversationId || !draft.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const message = await sendMessage(conversationId, draft);
      setMessages((current) => [...current, message]);
      setDraft("");
      setConversations(await getConversations());
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send the message.");
    } finally {
      setSending(false);
    }
  }

  const active = conversationId
    ? otherParticipant(activeParticipants, user?.id ?? "")
    : undefined;

  return (
    <div className="messages-page">
      <header className="messages-topbar">
        <Link className="citeface-brand-link" to="/dashboard" aria-label="Citeface dashboard">
          <CitefaceBrand />
        </Link>
        <Link className="messages-back" to="/dashboard">Back to research</Link>
      </header>

      <main className="messages-shell">
        <aside className="messages-sidebar">
          <div className="messages-sidebar-heading">
            <h1>Messages</h1>
            <span>{conversations.reduce((total, item) => total + item.unreadCount, 0)} unread</span>
          </div>

          <form className="messages-new" onSubmit={handleStart}>
            <label htmlFor="message-recipient">Start a conversation</label>
            <div>
              <input
                id="message-recipient"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="@username"
              />
              <button type="submit" disabled={sending}>Start</button>
            </div>
          </form>

          <div className="conversation-list">
            {loading && <p className="messages-state">Loading conversations...</p>}
            {!loading && conversations.length === 0 && (
              <p className="messages-state">No conversations yet.</p>
            )}
            {conversations.map((conversation) => {
              const participant = otherParticipant(conversation.participants, user?.id ?? "");
              return (
                <Link
                  className={`conversation-item${conversation.id === conversationId ? " active" : ""}`}
                  key={conversation.id}
                  to={`/messages/${conversation.id}`}
                >
                  <span className="conversation-avatar">
                    {participant?.researcherProfile?.profileImageUrl ? (
                      <img src={participant.researcherProfile.profileImageUrl} alt="" />
                    ) : initials(participant?.displayName ?? "Citeface")}
                  </span>
                  <span className="conversation-copy">
                    <strong>{participant?.displayName ?? "Researcher"}</strong>
                    <span>{conversation.lastMessage?.body ?? "Start the conversation"}</span>
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="conversation-unread">{conversation.unreadCount}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </aside>

        <section className="messages-thread" aria-label="Conversation">
          {!conversationId ? (
            <div className="thread-empty">
              <h2>Your research conversations</h2>
              <p>Select a conversation or start one with a researcher.</p>
            </div>
          ) : (
            <>
              <header className="thread-header">
                <span className="thread-avatar">
                  {active?.researcherProfile?.profileImageUrl ? (
                    <img src={active.researcherProfile.profileImageUrl} alt="" />
                  ) : initials(active?.displayName ?? "Researcher")}
                </span>
                <div>
                  <h2>{active?.displayName ?? "Researcher"}</h2>
                  {active && <span>@{active.username}</span>}
                </div>
              </header>

              {error && <p className="thread-error" role="alert">{error}</p>}

              <div className="thread-messages" aria-live="polite">
                {messages.map((message) => (
                  <div
                    className={`message-row${message.senderId === user?.id ? " own" : ""}`}
                    key={message.id}
                  >
                    <div className="message-bubble">{message.body}</div>
                  </div>
                ))}
                <div ref={messageEnd} />
              </div>

              <form className="thread-compose" onSubmit={handleSend}>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Write a message..."
                  maxLength={5000}
                  aria-label="Message"
                />
                <button type="submit" disabled={sending || !draft.trim()}>
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
