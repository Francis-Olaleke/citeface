
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "./dashboard.css";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

 const initials = (user?.displayName ?? "C")
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part.charAt(0).toUpperCase())
  .join("");

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

          <section className="panel composer">
            <div className="composer-top">
              <div className="profile-avatar">{initials}</div>
              <div className="composer-placeholder">
                What research or idea would you like to share?
              </div>
            </div>

            <div className="composer-actions">
              <button className="composer-action" type="button" disabled>
                ▷ Video
              </button>
              <button className="composer-action" type="button" disabled>
                ▧ Image / Slides
              </button>
              <button className="composer-action" type="button" disabled>
                ▤ Research Story
              </button>
            </div>

            <span className="coming-soon-label">
              Research publishing is coming soon.
            </span>
          </section>

          <div className="feed-heading">
            <h2>Discover research</h2>
            <span className="feed-preview-label">Feed preview</span>
          </div>

          <section className="panel feed-empty">
            <div className="empty-icon">✧</div>

            <h3>Your discovery feed starts here</h3>

            <p>
              This is where research stories, short videos,
              graphical abstracts and new discoveries will appear.
              We're preparing the discovery experience.
            </p>
          </section>
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
