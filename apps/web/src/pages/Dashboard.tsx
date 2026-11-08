
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

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
    <main>
      <header>
        <h1>Citeface</h1>
        <p>Research. Connect. Discover.</p>

        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </header>

      <section>
        <h2>Welcome, {user?.displayName}!</h2>
        <p>
          Discover research, connect with researchers,
          and share knowledge with the community.
        </p>

        <p>Username: @{user?.username}</p>
        <p>Email: {user?.email}</p>
      </section>

      {error && (
        <p role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <section>
        <h3>Coming soon</h3>
        <ul>
          <li>Discover research stories</li>
          <li>Connect with researchers</li>
          <li>Explore research videos</li>
          <li>Share your research</li>
        </ul>
      </section>
    </main>
  );
}

export default Dashboard;
