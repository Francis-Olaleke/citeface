import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import CitefaceBrand from "../components/CitefaceBrand";
import {
  createCommunityPost,
  getCommunity,
  joinCommunity,
} from "../services/communities";
import "./community-detail.css";

export default function CommunityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [community, setCommunity] = useState<Awaited<ReturnType<typeof getCommunity>>["community"] | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getCommunity(slug);
      setCommunity(result.community);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load this community.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [slug]);

  async function handleJoin() {
    if (!slug) return;
    try {
      await joinCommunity(slug);
      await load();
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Unable to join this community.");
    }
  }

  async function handlePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slug || !body.trim()) return;
    setPosting(true);
    setError(null);
    try {
      await createCommunityPost(slug, body);
      setBody("");
      await load();
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : "Unable to publish this post.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="community-detail-page">
      <header className="community-detail-topbar">
        <Link className="citeface-brand-link" to="/dashboard" aria-label="Citeface dashboard"><CitefaceBrand /></Link>
        <Link className="community-detail-back" to="/communities">All communities</Link>
      </header>
      <main className="community-detail-main">
        {loading && <section className="community-detail-state">Loading community...</section>}
        {!loading && error && <section className="community-detail-state" role="alert">{error}</section>}
        {!loading && !error && community && (
          <>
            <section className="community-detail-heading">
              <span>CITEFACE COMMUNITY</span>
              <h1>{community.name}</h1>
              <p>{community.description}</p>
              <div className="community-detail-meta">
                <span>{community._count.members} members</span>
                <span>{community._count.posts} discussions</span>
              </div>
              <button type="button" onClick={() => void handleJoin()}>Join community</button>
            </section>

            <form className="community-post-form" onSubmit={handlePost}>
              <label htmlFor="community-post">Share with the community</label>
              <textarea
                id="community-post"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={4}
                maxLength={5000}
                placeholder="Ask a question, share an insight or start a research discussion."
              />
              <button type="submit" disabled={posting || !body.trim()}>
                {posting ? "Publishing..." : "Publish"}
              </button>
            </form>

            <section className="community-post-list" aria-label="Community discussions">
              {community.posts.length === 0 ? (
                <div className="community-detail-state">
                  <h2>No discussions yet</h2>
                  <p>Be the first to start a conversation.</p>
                </div>
              ) : community.posts.map((post) => (
                <article className="community-post" key={post.id}>
                  <strong>{post.author.displayName}</strong>
                  <p>{post.body}</p>
                  <time dateTime={post.createdAt}>
                    {new Date(post.createdAt).toLocaleString()}
                  </time>
                </article>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
