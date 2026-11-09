
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/auth";

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
    <main>
      <h1>Reset your password</h1>
      <p>Research. Connect. Discover.</p>

      <h2>Forgot your password?</h2>
      <p>
        Enter the email address associated with your Citeface
        account. If an account exists, we will send you a reset link.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
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
          <p role="status" aria-live="polite">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" aria-live="polite">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p>
        Remembered your password? <Link to="/login">Sign in</Link>
      </p>
    </main>
  );
}

export default ForgotPassword;
