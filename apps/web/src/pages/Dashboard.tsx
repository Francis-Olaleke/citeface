
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MyDrafts from "../components/MyDrafts";
import CitefaceBrand from "../components/CitefaceBrand";
import ResearchDraftEditor from "../components/ResearchDraftEditor";
import ResearchStoryComposer from "../components/ResearchStoryComposer";

import { useAuth } from "../context/AuthContext";
import { removeProfileImage, uploadProfileImage } from "../services/profile-images";

import {
  getMyDrafts,
  getStoriesFeed,
  type FeedStory,
  type DraftStory,
  type ResearchClassification,
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

function getTopicSuggestions(stories: FeedStory[]) {
  const topics = new Map<
    string,
    { id: string; name: string; slug: string; storyCount: number }
  >();

  for (const story of stories) {
    for (const { topic } of story.topics) {
      const current = topics.get(topic.slug);
      topics.set(topic.slug, {
        ...topic,
        storyCount: (current?.storyCount ?? 0) + 1,
      });
    }
  }

  return Array.from(topics.values())
    .sort(
      (a, b) =>
        b.storyCount - a.storyCount || a.name.localeCompare(b.name)
    )
    .slice(0, 8);
}

function getResearcherSpotlights(stories: FeedStory[]) {
  const researchers = new Map<
    string,
    {
      username: string;
      displayName: string;
      headline: string | null;
      profileImageUrl: string | null;
      isVerified: boolean;
      publicationCount: number;
    }
  >();

  for (const story of stories) {
    const creator = story.creator;
    const current = researchers.get(creator.username);
    researchers.set(creator.username, {
      username: creator.username,
      displayName: creator.displayName,
      headline: creator.researcherProfile?.headline ?? null,
      profileImageUrl: creator.researcherProfile?.profileImageUrl ?? null,
      isVerified: creator.researcherProfile?.isVerified ?? false,
      publicationCount: (current?.publicationCount ?? 0) + 1,
    });
  }

  return Array.from(researchers.values()).slice(0, 8);
}

type NavIconName =
  | "home"
  | "discover"
  | "network"
  | "messages"
  | "saved"
  | "research"
  | "communities"
  | "opportunities";

function NavIcon({ name }: { name: NavIconName }) {
  const paths: Record<NavIconName, string> = {
    home: "m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z",
    discover: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm3.5 5.5L13 13l-4.5 2.5L11 11z",
    network: "M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-7 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm14 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9.5 7 6.5 17m8-10 3 10M8 19h8",
    messages: "M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5h-7L5 20v-4.5a2.5 2.5 0 0 1-1-2z",
    saved: "M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4z",
    research: "M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm8 0v5h5M8 12h8m-8 4h8",
    communities: "M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8-1a2.5 2.5 0 1 0 0-5M3 20v-1a6 6 0 0 1 12 0v1zm13-6a5 5 0 0 1 5 5v1h-4",
    opportunities: "M4 7h16a2 2 0 0 1 2 2v10H2V9a2 2 0 0 1 2-2zm5 0V4h6v3m-13 5h20m-12 0v2h4v-2",
  };

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
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
        <Link
          className="story-researcher-avatar-link"
          to={`/researchers/${encodeURIComponent(creator.username)}`}
          aria-label={`View ${creator.displayName}'s researcher profile`}
        >
          <div className="profile-avatar story-researcher-avatar">
            {profile?.profileImageUrl && (
              <img
                src={profile.profileImageUrl}
                alt=""
                onError={(event) => event.currentTarget.remove()}
              />
            )}
            <span>{getInitials(creator.displayName || "Citeface")}</span>
          </div>
        </Link>

        <div className="story-author">
          <Link
            className="story-researcher-link"
            to={`/researchers/${encodeURIComponent(creator.username)}`}
          >
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
          </Link>

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

      <h3 className="story-title">
        <Link to={`/stories/${encodeURIComponent(story.slug)}`}>
          {story.title}
        </Link>
      </h3>

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

      {story.media.some((item) => item.media.deliveryUrl) && (
        <div className="story-card-media">
          {story.media.map((item) => {
            const { deliveryUrl, type } = item.media;

            if (!deliveryUrl) return null;

            return type === "VIDEO" ? (
              <video
                key={item.id}
                src={deliveryUrl}
                controls
                preload="metadata"
                aria-label={item.caption || "Research video"}
              />
            ) : (
              <img
                key={item.id}
                src={deliveryUrl}
                alt={item.caption || "Research image"}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            );
          })}
        </div>
      )}

      <div className="story-footer">
        <span>
          ♡ {formatCount(story._count.reactions)} appreciations
        </span>
        <span>
          ○ {formatCount(story._count.comments)} questions and comments
        </span>
        <Link
          className="story-open-link"
          to={`/stories/${encodeURIComponent(story.slug)}`}
        >
          Read research <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

interface DashboardProps {
  publicView?: boolean;
}

function Dashboard({ publicView = false }: DashboardProps) {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { draftId } = useParams<{ draftId: string }>();
  const [selectedDraft, setSelectedDraft] =
  useState<DraftStory | null>(null);

const [showStoryComposer, setShowStoryComposer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [profileImageBusy, setProfileImageBusy] = useState(false);
  const [profileImageMessage, setProfileImageMessage] = useState<string | null>(null);
  const profileImageInput = useRef<HTMLInputElement>(null);

  const [stories, setStories] = useState<FeedStory[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [classificationFilter, setClassificationFilter] =
    useState<ResearchClassification | "">("");
  const feedRequestVersion = useRef(0);
  const [refreshFeed, setRefreshFeed] = useState(0);
  const [draftsRefreshKey, setDraftsRefreshKey] = useState(0);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftLoadError, setDraftLoadError] = useState<string | null>(null);
  const [draftLoadAttempt, setDraftLoadAttempt] = useState(0);
  
  const initials = getInitials(user?.displayName ?? "C");
  const topicSuggestions = getTopicSuggestions(stories);
  const researcherSpotlights = getResearcherSpotlights(stories);

  useEffect(() => {
    if (publicView || !draftId) {
      if (!draftId) {
        setSelectedDraft(null);
        setDraftLoadError(null);
        setDraftLoading(false);
      }
      return;
    }

    let cancelled = false;

    async function loadDraftFromUrl() {
      setDraftLoading(true);
      setDraftLoadError(null);
      setSelectedDraft(null);

      try {
        const result = await getMyDrafts();
        const matchingDraft = result.drafts.find(
          (draft) => draft.id === draftId
        );

        if (!matchingDraft) {
          throw new Error(
            "This draft could not be found in your account. It may have been published, deleted, or may not belong to you."
          );
        }

        if (!cancelled) {
          setSelectedDraft(matchingDraft);
        }
      } catch (err) {
        if (!cancelled) {
          setDraftLoadError(
            err instanceof Error
              ? err.message
              : "Unable to open this draft. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setDraftLoading(false);
        }
      }
    }

    void loadDraftFromUrl();

    return () => {
      cancelled = true;
    };
  }, [draftId, publicView, draftLoadAttempt]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const requestVersion = ++feedRequestVersion.current;

    async function loadFeed() {
      setLoadingStories(true);
      setLoadingMore(false);
      setFeedError(null);
      setStories([]);
      setPage(1);
      setHasNextPage(false);

      try {
        const result = await getStoriesFeed(1, 20, {
          q: debouncedSearch,
          classification: classificationFilter,
          topic: selectedTopic,
        });

        if (cancelled || requestVersion !== feedRequestVersion.current) {
          return;
        }

        setStories(result.stories);
        setPage(result.pagination.page);
        setHasNextPage(result.pagination.hasNextPage);
      } catch (err) {
        if (cancelled || requestVersion !== feedRequestVersion.current) {
          return;
        }

        setFeedError(
          err instanceof Error
            ? err.message
            : "Unable to load research stories. Please try again."
        );
      } finally {
        if (!cancelled && requestVersion === feedRequestVersion.current) {
          setLoadingStories(false);
        }
      }
    }

    void loadFeed();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, classificationFilter, selectedTopic, refreshFeed]);

  async function handleLoadMore() {
    if (loadingStories || loadingMore || !hasNextPage) return;

    const requestVersion = feedRequestVersion.current;
    const nextPage = page + 1;

    setLoadingMore(true);
    setFeedError(null);

    try {
      const result = await getStoriesFeed(nextPage, 20, {
        q: debouncedSearch,
        classification: classificationFilter,
        topic: selectedTopic,
      });

      if (requestVersion !== feedRequestVersion.current) return;

      setStories((currentStories) => [
        ...currentStories,
        ...result.stories,
      ]);

      setPage(result.pagination.page);
      setHasNextPage(result.pagination.hasNextPage);
    } catch (err) {
      if (requestVersion !== feedRequestVersion.current) return;

      setFeedError(
        err instanceof Error
          ? err.message
          : "Unable to load more stories. Please try again."
      );
    } finally {
      if (requestVersion === feedRequestVersion.current) {
        setLoadingMore(false);
      }
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
  async function handleProfileImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.currentTarget.files?.[0];

    if (!file) return;

    setProfileImageMessage(null);
    setProfileImageBusy(true);

    try {
      await uploadProfileImage(file);
      await refreshUser();
      setProfileImageMessage("Profile photo updated successfully.");
    } catch (err) {
      setProfileImageMessage(
        err instanceof Error
          ? err.message
          : "Unable to upload your profile photo. Please try again."
      );
    } finally {
      setProfileImageBusy(false);

      if (profileImageInput.current) {
        profileImageInput.current.value = "";
      }
    }
  }

  async function handleRemoveProfileImage() {
    setProfileImageMessage(null);
    setProfileImageBusy(true);

    try {
      await removeProfileImage();
      await refreshUser();
      setProfileImageMessage("Profile photo removed.");
    } catch (err) {
      setProfileImageMessage(
        err instanceof Error
          ? err.message
          : "Unable to remove your profile photo. Please try again."
      );
    } finally {
      setProfileImageBusy(false);
    }
  }

  return (
    <div className="citeface-app">
<header className="topbar">
  <Link className="citeface-brand-link" to="/" aria-label="Citeface home">
    <CitefaceBrand />
  </Link>

  <div className="topbar-search">
    <input
      type="search"
      placeholder="Search research stories..."
      aria-label="Search research stories"
      value={searchInput}
      onChange={(event) => setSearchInput(event.target.value)}
    />
  </div>

  <div className="topbar-actions">
    {publicView ? (
      user ? (
        <Link className="signout-button" to="/dashboard">
          Go to workspace
        </Link>
      ) : (
        <>
          <Link className="signout-button" to="/login">
            Sign in
          </Link>

          <Link className="signout-button" to="/register">
            Create account
          </Link>
        </>
      )
    ) : (
      <>
        <div className="profile-avatar" title={user?.displayName}>
              {user?.profileImageUrl ? (
                <img
                  className="profile-avatar-image"
                  src={user.profileImageUrl}
                  alt=""
                />
              ) : initials}
            </div>

        <button
          className="signout-button"
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </>
    )}
  </div>
</header>

      {error && (
        <div className="dashboard-error" role="alert">
          {error}
        </div>
      )}

      <div className={`dashboard-layout ${publicView ? "public-layout" : ""}`}>
        <aside className="sidebar">
          <div className="panel">
            <h2 className="sidebar-heading">Workspace</h2>

            <nav className="nav-list" aria-label="Main navigation">
              <button
                className="nav-item active"
                type="button"
                aria-current="page"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <span className="nav-symbol"><NavIcon name="home" /></span>
                Home
              </button>

              <button
                className="nav-item"
                type="button"
                onClick={() =>
                  document
                    .getElementById("discovery-feed")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <span className="nav-symbol"><NavIcon name="discover" /></span>
                Discover
              </button>

              <button className="nav-item" type="button" disabled>
                <span className="nav-symbol"><NavIcon name="network" /></span>
                My Network
              </button>

              <button className="nav-item" type="button" disabled>
                <span className="nav-symbol"><NavIcon name="messages" /></span>
                Messages
              </button>

              <button className="nav-item" type="button" disabled>
                <span className="nav-symbol"><NavIcon name="saved" /></span>
                Saved
              </button>

              <button
                className="nav-item"
                type="button"
                onClick={() =>
                  document
                    .getElementById("my-research-drafts")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <span className="nav-symbol"><NavIcon name="research" /></span>
                My Research
              </button>

              <button className="nav-item" type="button" disabled>
                <span className="nav-symbol"><NavIcon name="communities" /></span>
                Communities
              </button>

              <button className="nav-item" type="button" disabled>
                <span className="nav-symbol"><NavIcon name="opportunities" /></span>
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
  <span className="welcome-eyebrow">A COMMUNITY FOR IDEAS IN MOTION</span>
  {publicView ? (
    <>
      <h1>Discover research. Connect with ideas.</h1>
      <p>
        Explore research stories, discover new perspectives
        and learn from researchers shaping the future.
      </p>
    </>
  ) : (
    <>
      <h1>Welcome back, {user?.displayName}!</h1>
      <p>
        Discover ideas, explore research and connect with
        people shaping the future.
      </p>
    </>
  )}
</section>

{!publicView && (
  <>
          {draftId && draftLoading && !selectedDraft && (
            <p role="status">Opening your draft...</p>
          )}

          {draftId && draftLoadError && !selectedDraft && (
            <div role="alert" className="draft-state">
              <p>{draftLoadError}</p>
              <button
                type="button"
                onClick={() =>
                  setDraftLoadAttempt((attempt) => attempt + 1)
                }
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard", { replace: true })}
              >
                Return to dashboard
              </button>
            </div>
          )}

          {selectedDraft && (
  <ResearchDraftEditor
    draft={selectedDraft}
    onClose={() => navigate("/dashboard", { replace: true })}
    onSaved={(story) => setSelectedDraft(story)}
    onPublished={() => {
      navigate("/dashboard", { replace: true });
      setRefreshFeed((current) => current + 1);
      setDraftsRefreshKey((current) => current + 1);
    }}
  />
)}

{showStoryComposer ? (
  <ResearchStoryComposer
    onCreated={(draft) => {
      setShowStoryComposer(false);
      navigate(`/dashboard/drafts/${draft.id}`);
    }}
    onCancel={() => setShowStoryComposer(false)}
  />
) : (
  <section className="panel composer">
    <div className="composer-top">
      <div className="profile-avatar">
        {user?.profileImageUrl ? (
          <img
            className="profile-avatar-image"
            src={user.profileImageUrl}
            alt=""
          />
        ) : initials}
      </div>
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
        Video
      </button>

      <button
        className="composer-action"
        type="button"
        disabled
      >
        Image / Slides
      </button>

      <button
        className="composer-action"
        type="button"
        onClick={() => setShowStoryComposer(true)}
      >
        Research Story
      </button>
    </div>
  </section>
)}
  </>
)}

          <div className="feed-heading" id="discovery-feed">
            <h2>Discover research</h2>
            <span className="feed-preview-label">
              {debouncedSearch || classificationFilter || selectedTopic
                ? "Filtered stories"
                : "Latest stories"}
            </span>
          </div>

          {!publicView && researcherSpotlights.length > 0 && (
            <section
              className="researcher-spotlights"
              aria-labelledby="researcher-spotlights-heading"
            >
              <div className="researcher-spotlights-header">
                <div>
                  <span className="researcher-spotlights-kicker">
                    PEOPLE BEHIND THE IDEAS
                  </span>
                  <h3 id="researcher-spotlights-heading">
                    Researchers in the conversation
                  </h3>
                </div>
                <span className="researcher-spotlights-count">
                  {researcherSpotlights.length} in this feed
                </span>
              </div>
              <div className="researcher-spotlights-list">
                {researcherSpotlights.map((researcher) => (
                  <Link
                    className="researcher-spotlight"
                    key={researcher.username}
                    to={`/researchers/${encodeURIComponent(researcher.username)}`}
                  >
                    <span className="researcher-spotlight-avatar-ring">
                      <span className="profile-avatar researcher-spotlight-avatar">
                        {researcher.profileImageUrl ? (
                          <img
                            src={researcher.profileImageUrl}
                            alt=""
                            onError={(event) => event.currentTarget.remove()}
                          />
                        ) : (
                          getInitials(researcher.displayName)
                        )}
                      </span>
                    </span>
                    <strong>
                      {researcher.displayName}
                      {researcher.isVerified && (
                        <span
                          className="verified-mark"
                          aria-label="Verified researcher"
                        >
                          ✓
                        </span>
                      )}
                    </strong>
                    <span className="researcher-spotlight-detail">
                      {researcher.headline || `@${researcher.username}`}
                    </span>
                    <span className="researcher-spotlight-count">
                      {researcher.publicationCount}{" "}
                      {researcher.publicationCount === 1
                        ? "story shown"
                        : "stories shown"}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="discovery-filters">
            <label htmlFor="research-classification-filter">
              Research type
            </label>
            <select
              id="research-classification-filter"
              value={classificationFilter}
              onChange={(event) =>
                setClassificationFilter(
                  event.target.value as ResearchClassification | ""
                )
              }
            >
              <option value="">All research types</option>
              <option value="PEER_REVIEWED_ARTICLE">Peer-reviewed article</option>
              <option value="PREPRINT">Preprint</option>
              <option value="THESIS_DISSERTATION">Thesis / dissertation</option>
              <option value="CONFERENCE_PAPER">Conference paper</option>
              <option value="RESEARCH_REPORT">Research report</option>
              <option value="AUTHOR_DESCRIBED_PROJECT">Author-described project</option>
              <option value="PRELIMINARY_UNPUBLISHED">Preliminary unpublished</option>
            </select>
          </div>

          <section className="panel explore-topics" aria-labelledby="explore-topic-heading">
            <div className="explore-topics-heading">
              <h3 id="explore-topic-heading">Explore by topic</h3>
              {selectedTopic && (
                <button
                  type="button"
                  className="clear-topic-filter"
                  onClick={() => setSelectedTopic("")}
                >
                  Clear topic
                </button>
              )}
            </div>

            {topicSuggestions.length > 0 ? (
              <div className="topic-list" role="group" aria-label="Research topics">
                {topicSuggestions.map((topic) => (
                  <button
                    key={topic.slug}
                    type="button"
                    className={`topic-tag${selectedTopic === topic.slug ? " topic-tag-active" : ""}`}
                    aria-pressed={selectedTopic === topic.slug}
                    onClick={() =>
                      setSelectedTopic((current) =>
                        current === topic.slug ? "" : topic.slug
                      )
                    }
                  >
                    {topic.name}
                    <span className="topic-tag-count">{topic.storyCount}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="topic-discovery-empty">
                {loadingStories
                  ? "Finding topics in published research..."
                  : feedError
                    ? "Topics are unavailable because the research feed could not be loaded."
                    : selectedTopic
                      ? "Clear the topic filter to explore other research areas."
                      : "Topics will appear here as researchers publish stories."}
              </p>
            )}
          </section>

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
              <div className="empty-icon">*</div>
              <h3>
                {debouncedSearch || classificationFilter || selectedTopic
                  ? "No matching research stories"
                  : "Your discovery feed starts here"}
              </h3>
              <p>
                {debouncedSearch || classificationFilter || selectedTopic
                  ? "No published stories match your current search and filters. Try another search or research type."
                  : "There are no published research stories to show yet. As researchers publish stories, videos and graphical abstracts, they will appear here."}
              </p>
              {(searchInput || classificationFilter || selectedTopic) && (
                <button
                  className="feed-retry-button"
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setClassificationFilter("");
                    setSelectedTopic("");
                  }}
                >
                  Clear filters
                </button>
              )}
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

          {!publicView && (
            <div id="my-research-drafts" className="my-research-drafts-anchor">
              <MyDrafts
                onOpenDraft={(draft) => navigate(`/dashboard/drafts/${draft.id}`)}
                onDraftDeleted={(deletedDraftId) => {
                  if (selectedDraft?.id === deletedDraftId) {
                    setSelectedDraft(null);
                    navigate("/dashboard", { replace: true });
                  }
                }}
                refreshKey={draftsRefreshKey}
              />
            </div>
          )}
        </main>
        
        {!publicView && (
          <aside className="right-sidebar">
            <section className="panel">
              <h2 className="panel-heading">Your profile</h2>

              <div className="sidebar-profile">
                <Link
                  className="sidebar-profile-link"
                  to={`/researchers/${encodeURIComponent(user?.username ?? "")}`}
                >
                  <div className="profile-avatar">
                    {user?.profileImageUrl ? (
                      <img
                        className="profile-avatar-image"
                        src={user.profileImageUrl}
                        alt=""
                      />
                    ) : initials}
                  </div>

                  <div>
                    <strong>{user?.displayName}</strong>
                    <small>@{user?.username}</small>
                  </div>
                </Link>
              </div>

              <div className="profile-email">{user?.email}</div>

              <div className="profile-image-controls">
                <input
                  ref={profileImageInput}
                  className="profile-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleProfileImageChange}
                  disabled={profileImageBusy}
                />

                <button
                  type="button"
                  className="profile-image-button"
                  onClick={() => profileImageInput.current?.click()}
                  disabled={profileImageBusy}
                >
                  {profileImageBusy
                    ? "Please wait..."
                    : user?.profileImageUrl
                      ? "Change photo"
                      : "Upload photo"}
                </button>

                {user?.profileImageUrl && (
                  <button
                    type="button"
                    className="profile-image-remove"
                    onClick={handleRemoveProfileImage}
                    disabled={profileImageBusy}
                  >
                    Remove photo
                  </button>
                )}

                <small className="profile-image-help">
                  JPEG, PNG or WebP. Maximum size: 10 MB.
                </small>

                {profileImageMessage && (
                  <p className="profile-image-message" role="status">
                    {profileImageMessage}
                  </p>
                )}
              </div>

              <div className="sidebar-divider" />

              <p className="sidebar-description">
                Your Citeface profile is ready. Build your research
                identity and connect with the research community.
              </p>
            </section>

          </aside>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
