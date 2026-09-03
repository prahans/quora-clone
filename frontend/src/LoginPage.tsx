import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous error
    setError("");

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setIsLoggingIn(true);

      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email: email.trim(),
          password,
        },
        {
          withCredentials: true,
        },
      );

      console.log(response.data);

      // Login successful
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);

      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Invalid email or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <main>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>

          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            disabled={isLoggingIn}
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>

          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isLoggingIn}
          />
        </div>

        {error && <p>{error}</p>}

        <button type="submit" disabled={isLoggingIn}>
          {isLoggingIn ? "Logging in..." : "Login"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => navigate("/signup")}
        disabled={isLoggingIn}
      >
        signup instead
      </button>
    </main>
  );
}

export default Login;
