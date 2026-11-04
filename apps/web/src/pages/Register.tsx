import { registerUser } from "../services/auth";
import { useState } from "react";

function Register() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  
async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  try {
    const response = await registerUser({
      displayName,
      username,
      email,
      password,
    });

    alert(`Welcome to Citeface, ${response.user.displayName}!`);
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    } else {
      alert("Registration failed. Please try again.");
    }
  }
}

  return (
    <main>
      <h1>Join Citeface</h1>
      <p>Research. Connect. Discover.</p>

      <h2>Create your account</h2>
      <p>Join a community where research meets connection.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="displayName">Full name</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Enter your full name"
            required
            minLength={2}
          />
        </div>

        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Choose a username"
            required
            minLength={3}
            pattern="[a-zA-Z0-9_]+"
          />
        </div>

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
            placeholder="Create a password"
            required
            minLength={8}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter your password again"
            required
          />
        </div>

        <button type="submit">Create account</button>
      </form>

      <p>
        Already have an account? <a href="/login">Sign in</a>
      </p>
    </main>
  );
}

export default Register;
