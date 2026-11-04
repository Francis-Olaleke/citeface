
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await loginUser({
        email,
        password,
      });

      alert("Login successful! Welcome to Citeface.");

      navigate("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Login failed. Please try again.");
      }
    }
  }

  return (
    <main>
      <h1>Welcome back to Citeface</h1>
      <p>Research. Connect. Discover.</p>

      <h2>Sign in to your account</h2>
      <p>Continue discovering and connecting with research.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        <button type="submit">Sign in</button>
      </form>

      <p>
        Don't have an account? <a href="/register">Create an account</a>
      </p>
    </main>
  );
}

export default Login;
