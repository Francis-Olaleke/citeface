
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { resetPassword } from "../services/auth";
import AuthLayout from "../components/AuthLayout";

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
    <AuthLayout
      eyebrow="Secure your account"
      title="Choose a new password"
      description="Set a new password to get back to your Citeface research community."
    >
      {!token && (
        <p className="citeface-auth-message citeface-auth-message--error" role="alert">
          No reset token was found. Please request a new reset link.
        </p>
      )}

      <form className="citeface-auth-form" onSubmit={handleSubmit}>
        <div className="citeface-auth-field">
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

        <div className="citeface-auth-field">
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
          <p className="citeface-auth-message citeface-auth-message--success" role="status" aria-live="polite">
            {message}
          </p>
        )}

        {error && (
          <p className="citeface-auth-message citeface-auth-message--error" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        <button
          className="citeface-auth-submit"
          type="submit"
          disabled={submitting || !token || Boolean(message)}
        >
          {submitting ? "Resetting password..." : "Reset password"}
        </button>
      </form>

      <p className="citeface-auth-footer">
        <Link to="/forgot-password">Request another reset link</Link>
      </p>

      <p className="citeface-auth-footer">
        <Link to="/login">Return to sign in</Link>
      </p>
    </AuthLayout>
  );
}

export default ResetPassword;
