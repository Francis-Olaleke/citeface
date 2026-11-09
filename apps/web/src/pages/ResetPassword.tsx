
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { resetPassword } from "../services/auth";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(null);
    setError(null);

    if (!token) {
      setError("This password reset link is missing its token.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await resetPassword(token, password);
      setMessage(result.message);

      setPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset your password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Create a new password</h1>
      <p>Research. Connect. Discover.</p>

      <h2>Reset your Citeface password</h2>
      <p>Choose a new password for your account.</p>

      {!token && (
        <p role="alert">
          No reset token was found. Please request a new reset link.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your new password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            disabled={submitting || !token || Boolean(message)}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter your new password again"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            disabled={submitting || !token || Boolean(message)}
          />
        </div>

        {message && (
          <p role="status" aria-live="polite">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" aria-live="polite">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !token || Boolean(message)}
        >
          {submitting ? "Resetting password..." : "Reset password"}
        </button>
      </form>

      <p>
        <Link to="/forgot-password">Request another reset link</Link>
      </p>

      <p>
        <Link to="/login">Return to sign in</Link>
      </p>
    </main>
  );
}

export default ResetPassword;
