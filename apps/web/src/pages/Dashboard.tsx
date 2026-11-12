
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import MyDrafts from "../components/MyDrafts";
import ResearchDraftEditor from "../components/ResearchDraftEditor";
import ResearchStoryComposer from "../components/ResearchStoryComposer";

import { useAuth } from "../context/AuthContext";

import {
  getStoriesFeed,
  type FeedStory,
  type DraftStory,
} from "../services/stories";

import "./dashboard.css";

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
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPublishedDate(value: string | null) {
  if (!value) return "Recently published";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently published";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

function StoryCard({ story }: { story: FeedStory }) {
  const creator = story.creator;
  const profile = creator.researcherProfile;

  const description =
    story.summary || story.researchQuestion || "No summary provided.";

  const mediaTypes = [
    ...new Set(story.media.map((item) => item.media.type)),
  ];

  return (
    <article className="panel story-card">
      <div className="story-card-header">
        <div className="profile-avatar">
          {getInitials(creator.displayName || "Citeface")}
        </div>

        <div className="story-author">
          <div className="story-author-name">
            <strong>{creator.displayName}</strong>
            {profile?.isVerified && (
              <span className="verified-mark" title="Verified researcher">
                ✓
              </span>
            )}
          </div>

          <span className="story-author-username">
            @{creator.username}
          </span>

          {profile?.headline && (
            <span className="story-author-headline">
              {profile.headline}
            </span>
          )}
        </div>

        <span className="story-date">
          {formatPublishedDate(story.publishedAt)}
        </span>
      </div>

      <div className="story-meta">
        <span className="story-classification">
          {formatLabel(story.classification)}
        </span>
      </div>

      <h3 className="story-title">{story.title}</h3>

      <p className="story-summary">{description}</p>

      {story.authors.length > 0 && (
        <p className="story-coauthors">
          Authors:{" "}
          {story.authors
            .map((author) => author.displayName)
            .join(", ")}
        </p>
      )}

      {story.topics.length > 0 && (
        <div className="story-topics">
          {story.topics.map(({ topic }) => (
            <span className="story-topic" key={topic.id}>
              {topic.name}
            </span>
          ))}
        </div>
      )}

      {mediaTypes.length > 0 && (
        <div className="story-media-types">
          {mediaTypes.map((type) => (
            <span className="story-media-type" key={type}>
              {formatLabel(type)}
            </span>
          ))}
        </div>
      )}

      <div className="story-footer">
        <span>
          ♡ {formatCount(story._count.reactions)} appreciations
        </span>
        <span>
          ◯ {formatCount(story._count.comments)} questions and comments
        </span>
      </div>
    </article>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedDraft, setSelectedDraft] =
  useState<DraftStory | null>(null);
  const [showStoryComposer, setShowStoryComposer] = useState(false);
 
  useState<DraftStory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const [stories, setStories] = useState<FeedStory[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [refreshFeed, setRefreshFeed] = useState(0);
  const [draftsRefreshKey, setDraftsRefreshKey] = useState(0);
  
  const initials = getInitials(user?.displayName ?? "C");

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      setLoadingStories(true);
      setFeedError(null);

      try {
        const result = await getStoriesFeed(1, 20);

        if (cancelled) return;

        setStories(result.stories);
        setPage(result.pagination.page);
        setHasNextPage(result.pagination.hasNextPage);
      } catch (err) {
        if (cancelled) return;

        setFeedError(
          err instanceof Error
            ? err.message
            : "Unable to load research stories. Please try again."
        );
      } finally {
        if (!cancelled) {
          setLoadingStories(false);
        }
      }
    }

    void loadFeed();

    return () => {
      cancelled = true;
    };
  }, [refreshFeed]);

  async function handleLoadMore() {
    if (loadingMore || !hasNextPage) return;

    setLoadingMore(true);
    setFeedError(null);

    try {
      const nextPage = page + 1;
      const result = await getStoriesFeed(nextPage, 20);

      setStories((currentStories) => [
        ...currentStories,
        ...result.stories,
      ]);

      setPage(result.pagination.page);
      setHasNextPage(result.pagination.hasNextPage);
    } catch (err) {
      setFeedError(
        err instanceof Error
          ? err.message
          : "Unable to load more stories. Please try again."
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleLogout() {
    setError(null);
    setSigningOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign out. Please try again."
      );
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="citeface-app">
      <header className="topbar">
        <div>
          <div className="brand">
            Cite<span>face</span>
          </div>
          <div className="brand-tagline">
            Research. Connect. Discover.
          </div>
        </div>

        <div className="topbar-search">
          <input
            type="search"
            placeholder="Search research, people and topics..."
            aria-label="Search Citeface"
            disabled
          />
        </div>

        <div className="topbar-actions">
          <div className="profile-avatar" title={user?.displayName}>
            {initials}
          </div>

          <button
            className="signout-button"
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </header>

      {error && (
        <div className="dashboard-error" role="alert">
          {error}
        </div>
      )}

      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="panel">
            <h2 className="sidebar-heading">Workspace</h2>

            <nav className="nav-list" aria-label="Main navigation">
              <button
                className="nav-item active"
                type="button"
                aria-current="page"
              >
                <span className="nav-symbol">⌂</span>
                Home
              </button>

              <button className="nav-item" type="button" disabled>
                <span className="nav-symbol">⌕</span>
                Discover
              </button>

              <button className="nav-item" type="button" disabled>
                <span className="nav-symbol">♧</span>
                My Network
              </button>

              <button className="nav-item" type="button" disabled>
                <span className="nav-symbol">▤</span>
                Messages
              </button>

              <button className="nav-item" type="button" disabled>
                <span className="nav-symbol">♡</span>
                Saved
              </button>

              <button className="nav-item" type="button" disabled>
                <span className="nav-symbol">▣</span>
                My Research
              </button>

              <button className="nav-item" type="button" disabled>
                <span className="nav-symbol">◎</span>
                Communities
              </button>

              <button className="nav-item" type="button" disabled>
                <span className="nav-symbol">✦</span>
                Opportunities
              </button>
            </nav>

            <div className="sidebar-note">
              Your research journey starts here. Discover new ideas,
              learn from others and build meaningful connections.
            </div>
          </div>
        </aside>

        <main className="main-feed">
          <section className="welcome-section">
            <h1>Welcome back, {user?.displayName}!</h1>
            <p>
              Discover ideas, explore research and connect with
              people shaping the future.
            </p>
          </section>
                  <MyDrafts
  onOpenDraft={(draft) => setSelectedDraft(draft)}
  refreshKey={draftsRefreshKey}
/>
          {selectedDraft && (
  <ResearchDraftEditor
    draft={selectedDraft}
    onClose={() => setSelectedDraft(null)}
    onSaved={(story) => setSelectedDraft(story)}
    onPublished={() => {
      setSelectedDraft(null);
      setRefreshFeed((current) => current + 1);
      setDraftsRefreshKey((current) => current + 1);
    }}
  />
)}

{showStoryComposer ? (
  <ResearchStoryComposer
    onCreated={(draft) => {
      setShowStoryComposer(false);
      setSelectedDraft(draft);
    }}
    onCancel={() => setShowStoryComposer(false)}
  />
) : (
  <section className="panel composer">
    <div className="composer-top">
      <div className="profile-avatar">{initials}</div>
      <div
        className="composer-placeholder"
        onClick={() => setShowStoryComposer(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            setShowStoryComposer(true);
          }
        }}
      >
        What research or idea would you like to share?
      </div>
    </div>

    <div className="composer-actions">
      <button
        className="composer-action"
        type="button"
        disabled
      >
        ▷ Video
      </button>

      <button
        className="composer-action"
        type="button"
        disabled
      >
        ▧ Image / Slides
      </button>

      <button
        className="composer-action"
        type="button"
        onClick={() => setShowStoryComposer(true)}
      >
        ▤ Research Story
      </button>
    </div>
  </section>
)}


          <div className="feed-heading">
            <h2>Discover research</h2>
            <span className="feed-preview-label">Latest stories</span>
          </div>

          {loadingStories && (
            <section className="panel feed-state" aria-live="polite">
              <p>Loading research stories...</p>
            </section>
          )}

          {!loadingStories && feedError && (
            <section className="panel feed-state" role="alert">
              <h3>We couldn't load the discovery feed</h3>
              <p>{feedError}</p>
              <button
                className="feed-retry-button"
                type="button"
                onClick={() => setRefreshFeed((current) => current + 1)}
              >
                Try again
              </button>
            </section>
          )}

          {!loadingStories && !feedError && stories.length === 0 && (
            <section className="panel feed-empty">
              <div className="empty-icon">✧</div>
              <h3>Your discovery feed starts here</h3>
              <p>
                There are no published research stories to show yet.
                As researchers publish stories, videos and graphical
                abstracts, they will appear here.
              </p>
            </section>
          )}

          {!loadingStories && stories.length > 0 && (
            <div className="story-list">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}

          {!loadingStories && !feedError && hasNextPage && (
            <div className="feed-load-more">
              <button
                className="feed-retry-button"
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load more stories"}
              </button>
            </div>
          )}
        </main>

        <aside className="right-sidebar">
          <section className="panel">
            <h2 className="panel-heading">Your profile</h2>

            <div className="sidebar-profile">
              <div className="profile-avatar">{initials}</div>

              <div>
                <strong>{user?.displayName}</strong>
                <small>@{user?.username}</small>
              </div>
            </div>

            <div className="profile-email">{user?.email}</div>

            <div className="sidebar-divider" />

            <p className="sidebar-description">
              Your Citeface profile is ready. Build your research
              identity and connect with the research community.
            </p>
          </section>

          <section className="panel" style={{ marginTop: "16px" }}>
            <h2 className="panel-heading">Explore research areas</h2>

            <div className="topic-list">
              <span className="topic-tag">HealthTech</span>
              <span className="topic-tag">AI & Technology</span>
              <span className="topic-tag">Life Sciences</span>
              <span className="topic-tag">Climate Science</span>
              <span className="topic-tag">Agriculture</span>
              <span className="topic-tag">Education</span>
            </div>

            <div className="sidebar-divider" />

            <p className="sidebar-description">
              Topic discovery and researcher recommendations
              will become available as we build the feed.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Dashboard;
