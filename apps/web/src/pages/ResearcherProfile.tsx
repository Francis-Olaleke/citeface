import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getResearcher,
  ResearcherServiceError,
  type ResearcherResponse,
} from "../services/researchers";

import "./researcher-profile.css";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
  }).format(date);
}

function safeExternalUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function ResearcherProfile() {
  const { username } = useParams<{ username: string }>();

  const [data, setData] = useState<ResearcherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!username) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const result = await getResearcher(username, page);

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (cancelled) return;

        if (
          err instanceof ResearcherServiceError &&
          err.status === 404
        ) {
          setNotFound(true);
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load this researcher profile.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [username, page]);

  const researcher = data?.researcher;
  const profile = researcher?.researcherProfile;
  const website = safeExternalUrl(profile?.websiteUrl);
  const coverImage = safeExternalUrl(profile?.coverImageUrl);
  const profileImage = safeExternalUrl(profile?.profileImageUrl);
  const orcid = profile?.orcidId
    ? `https://orcid.org/${encodeURIComponent(profile.orcidId)}`
    : null;

  return (
    <div className="researcher-page">
      <header className="researcher-topbar">
        <Link className="researcher-brand" to="/">
          <span>Citeface</span>
          <small>Research. Connect. Discover.</small>
        </Link>
        <Link className="researcher-discover-link" to="/">
          Discover research
        </Link>
      </header>

      <main className="researcher-main">
        {loading && (
          <section className="researcher-state" aria-live="polite">
            Loading researcher profile...
          </section>
        )}

        {!loading && notFound && (
          <section className="researcher-state">
            <h1>Researcher not found</h1>
            <p>This profile is unavailable or is no longer public.</p>
            <Link to="/">Return to discovery</Link>
          </section>
        )}

        {!loading && error && (
          <section className="researcher-state">
            <h1>Unable to load profile</h1>
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
            <Link to="/">Return to discovery</Link>
          </section>
        )}

        {!loading && researcher && (
          <>
            <section className="researcher-hero">
              <div
                className="researcher-cover"
                style={
                  coverImage
                    ? { backgroundImage: `url("${coverImage}")` }
                    : undefined
                }
              />

              <div className="researcher-identity">
                <div className="researcher-avatar">
                  {profileImage && (
                    <img
                      src={profileImage}
                      alt={`${researcher.displayName} profile`}
                      onError={(event) => event.currentTarget.remove()}
                    />
                  )}
                  <span>{getInitials(researcher.displayName)}</span>
                </div>

                <div className="researcher-heading">
                  <div className="researcher-name-line">
                    <h1>{researcher.displayName}</h1>
                    {profile?.isVerified && (
                      <span
                        className="researcher-verified"
                        title="Verified researcher"
                        aria-label="Verified researcher"
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="researcher-username">
                    @{researcher.username}
                  </p>
                  {profile?.headline && (
                    <p className="researcher-headline">
                      {profile.headline}
                    </p>
                  )}
                  {(profile?.city || profile?.country) && (
                    <p className="researcher-location">
                      {[profile.city, profile.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="researcher-links">
                {website && (
                  <a href={website} target="_blank" rel="noreferrer">
                    Website
                  </a>
                )}
                {orcid && (
                  <a href={orcid} target="_blank" rel="noreferrer">
                    ORCID
                  </a>
                )}
              </div>
            </section>

            <div className="researcher-content">
              <div className="researcher-primary">
                <section className="researcher-panel">
                  <h2>About</h2>
                  {profile?.biography?.trim() ? (
                    <p className="researcher-biography">
                      {profile.biography}
                    </p>
                  ) : (
                    <p className="researcher-muted">
                      This researcher has not added a biography yet.
                    </p>
                  )}
                </section>

                <section className="researcher-panel">
                  <div className="researcher-section-heading">
                    <h2>Published research</h2>
                    <span>{data.pagination.total}</span>
                  </div>

                  {data.stories.length === 0 ? (
                    <p className="researcher-muted">
                      No published research stories yet.
                    </p>
                  ) : (
                    <div className="researcher-stories">
                      {data.stories.map((story) => (
                        <article
                          className="researcher-story"
                          key={story.slug}
                        >
                          <span className="researcher-story-classification">
                            {formatLabel(story.classification)}
                          </span>
                          <h3>
                            <Link
                              to={`/stories/${encodeURIComponent(story.slug)}`}
                            >
                              {story.title}
                            </Link>
                          </h3>
                          {story.summary && (
                            <p>{story.summary}</p>
                          )}
                          <div className="researcher-story-footer">
                            <time dateTime={story.publishedAt}>
                              {formatDate(story.publishedAt)}
                            </time>
                            {story.authors.length > 0 && (
                              <span>
                                {story.authors
                                  .map((author) => author.displayName)
                                  .join(", ")}
                              </span>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {(data.pagination.hasPreviousPage ||
                    data.pagination.hasNextPage) && (
                    <div className="researcher-pagination">
                      <button
                        type="button"
                        disabled={!data.pagination.hasPreviousPage}
                        onClick={() => setPage((current) => current - 1)}
                      >
                        Previous
                      </button>
                      <span>
                        Page {data.pagination.page} of{" "}
                        {data.pagination.totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={!data.pagination.hasNextPage}
                        onClick={() => setPage((current) => current + 1)}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </section>
              </div>

              <aside className="researcher-sidebar">
                <section className="researcher-panel">
                  <h2>Affiliations</h2>
                  {researcher.affiliations.length === 0 ? (
                    <p className="researcher-muted">
                      No affiliations listed.
                    </p>
                  ) : (
                    <div className="researcher-affiliations">
                      {researcher.affiliations.map((item) => {
                        const affiliationUrl = safeExternalUrl(
                          item.affiliation.websiteUrl,
                        );

                        return (
                          <article
                            className="researcher-affiliation"
                            key={`${item.affiliation.slug}-${item.position ?? ""}`}
                          >
                            <strong>
                              {affiliationUrl ? (
                                <a
                                  href={affiliationUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {item.affiliation.name}
                                </a>
                              ) : (
                                item.affiliation.name
                              )}
                            </strong>
                            {item.position && <span>{item.position}</span>}
                            {item.department && (
                              <small>{item.department}</small>
                            )}
                            {item.affiliation.country && (
                              <small>{item.affiliation.country}</small>
                            )}
                            {(item.startDate || item.endDate) && (
                              <small>
                                {formatDate(item.startDate) ?? "Start unknown"}
                                {" – "}
                                {formatDate(item.endDate) ?? "Present"}
                              </small>
                            )}
                            {item.isPrimary && (
                              <small className="researcher-primary-label">
                                Primary affiliation
                              </small>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="researcher-panel researcher-joined">
                  <h2>On Citeface</h2>
                  <p>
                    Joined{" "}
                    {new Date(researcher.createdAt).toLocaleDateString(
                      undefined,
                      { month: "long", year: "numeric" },
                    )}
                  </p>
                </section>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default ResearcherProfile;