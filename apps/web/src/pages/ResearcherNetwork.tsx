import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import CitefaceBrand from "../components/CitefaceBrand";
import {
  getResearchers,
  ResearcherServiceError,
  type ResearcherDirectoryItem,
} from "../services/researchers";
import "./researcher-network.css";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function ResearcherNetwork() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [researchers, setResearchers] = useState<ResearcherDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadResearchers() {
      setLoading(true);
      setError(null);
      try {
        const result = await getResearchers(page, 20, submittedSearch);
        if (!cancelled) {
          setResearchers(result.researchers);
          setTotal(result.pagination.total);
          setTotalPages(result.pagination.totalPages);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof ResearcherServiceError
              ? loadError.message
              : "Unable to load researchers.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadResearchers();
    return () => {
      cancelled = true;
    };
  }, [page, submittedSearch]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSubmittedSearch(search.trim());
  }

  return (
    <div className="network-page">
      <header className="network-topbar">
        <Link className="citeface-brand-link" to="/" aria-label="Citeface home">
          <CitefaceBrand />
        </Link>
        <Link className="network-discover-link" to="/">
          Discover research
        </Link>
      </header>

      <main className="network-main">
        <section className="network-heading">
          <div>
            <span className="network-kicker">CITEFACE NETWORK</span>
            <h1>Discover researchers</h1>
            <p>Explore researcher profiles and discover people in the Citeface community.</p>
          </div>
          <span className="network-total">
            {total} {total === 1 ? "researcher" : "researchers"}
          </span>
        </section>

        <form className="network-search" onSubmit={handleSubmit}>
          <label htmlFor="network-search-input">Search researchers</label>
          <div>
            <input
              id="network-search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or research headline"
            />
            <button type="submit">Search</button>
          </div>
        </form>

        {loading && (
          <section className="network-state" aria-live="polite">
            Loading researchers...
          </section>
        )}

        {!loading && error && (
          <section className="network-state" role="alert">
            <h2>Unable to load researchers</h2>
            <p>{error}</p>
          </section>
        )}

        {!loading && !error && researchers.length === 0 && (
          <section className="network-state">
            <h2>No researchers found</h2>
            <p>Try a broader name or headline.</p>
          </section>
        )}

        {!loading && !error && researchers.length > 0 && (
          <section className="network-grid" aria-label="Researchers">
            {researchers.map((researcher) => {
              const profile = researcher.researcherProfile;
              return (
                <article className="network-researcher" key={researcher.username}>
                  <Link
                    className="network-avatar-link"
                    to={`/researchers/${encodeURIComponent(researcher.username)}`}
                    aria-label={`View ${researcher.displayName}'s profile`}
                  >
                    <span className="network-avatar">
                      {profile?.profileImageUrl ? (
                        <img
                          src={profile.profileImageUrl}
                          alt=""
                          onError={(event) => event.currentTarget.remove()}
                        />
                      ) : (
                        getInitials(researcher.displayName)
                      )}
                    </span>
                  </Link>
                  <div className="network-researcher-body">
                    <div className="network-name">
                      <h2>
                        <Link to={`/researchers/${encodeURIComponent(researcher.username)}`}>
                          {researcher.displayName}
                        </Link>
                      </h2>
                      {profile?.isVerified && (
                        <span className="network-verified" aria-label="Verified researcher">✓</span>
                      )}
                    </div>
                    {profile?.headline && (
                      <p className="network-headline">{profile.headline}</p>
                    )}
                    {(profile?.city || profile?.country) && (
                      <p className="network-location">
                        {[profile.city, profile.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <div className="network-stats">
                      <span>{researcher.publicationCount} published</span>
                      <span>{researcher.followerCount} followers</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="network-pagination">
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
