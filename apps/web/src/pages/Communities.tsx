import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import CitefaceBrand from "../components/CitefaceBrand";
import {
  createCommunity,
  getCommunities,
  joinCommunity,
  type CommunitySummary,
} from "../services/communities";
import "./communities.css";

export default function Communities() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setCommunities(await getCommunities(submittedSearch));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load communities.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [submittedSearch]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !description.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createCommunity(name, description);
      setName("");
      setDescription("");
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create the community.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(slug: string) {
    setBusy(true);
    setError(null);
    try {
      await joinCommunity(slug);
      await load();
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Unable to join the community.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="communities-page">
      <header className="communities-topbar">
        <Link className="citeface-brand-link" to="/dashboard" aria-label="Citeface dashboard"><CitefaceBrand /></Link>
        <Link className="communities-back" to="/dashboard">Back to research</Link>
      </header>

      <main className="communities-main">
        <section className="communities-heading">
          <span>CITEFACE COMMUNITIES</span>
          <h1>Research groups and discussions</h1>
          <p>Build communities around disciplines, institutions or shared research questions.</p>
        </section>

        {error && <p className="communities-error" role="alert">{error}</p>}

        <section className="communities-create">
          <h2>Create a community</h2>
          <form onSubmit={handleCreate}>
            <label htmlFor="community-name">Community name</label>
            <input id="community-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} />
            <label htmlFor="community-description">Description</label>
            <textarea id="community-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={3000} />
            <button type="submit" disabled={busy || !name.trim() || !description.trim()}>Create community</button>
          </form>
        </section>

        <form
          className="communities-search"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedSearch(search.trim());
          }}
        >
          <label htmlFor="communities-search-input">Find communities</label>
          <div>
            <input id="communities-search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or topic" />
            <button type="submit">Search</button>
          </div>
        </form>

        {loading && <section className="communities-state">Loading communities...</section>}
        {!loading && communities.length === 0 && (
          <section className="communities-state">
            <h2>No communities found</h2>
            <p>Create the first community or try a broader search.</p>
          </section>
        )}
        {!loading && communities.length > 0 && (
          <section className="community-grid" aria-label="Communities">
            {communities.map((community) => (
              <article className="community-card" key={community.id}>
                <span className="community-kicker">Research community</span>
                <h2>{community.name}</h2>
                <p>{community.description}</p>
                <div className="community-stats">
                  <span>{community._count.members} members</span>
                  <span>{community._count.posts} discussions</span>
                </div>
                <div className="community-actions">
                  <button type="button" disabled={busy} onClick={() => void handleJoin(community.slug)}>Join</button>
                  <Link className="community-open" to={`/communities/${encodeURIComponent(community.slug)}`}>Open</Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
