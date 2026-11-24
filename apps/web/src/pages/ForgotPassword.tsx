
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/auth";
import AuthLayout from "../components/AuthLayout";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(null);
    setError(null);
    setSubmitting(true);

    try {
      const result = await requestPasswordReset(email.trim());
      setMessage(result.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process your request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Forgot your password?"
      description="Enter the email address associated with your Citeface account. If an account exists, we will send you a reset link."
    >
      <form className="citeface-auth-form" onSubmit={handleSubmit}>
        <div className="citeface-auth-field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            maxLength={254}
            disabled={submitting}
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

        <button className="citeface-auth-submit" type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="citeface-auth-footer">
        Remembered your password? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPassword;
