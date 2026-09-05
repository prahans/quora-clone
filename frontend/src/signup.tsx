import axios from "axios";
import { api } from "./api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous error
    setError("");

    // Basic validation
    if (!email.trim() || !username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setIsSigningUp(true);

      await api.post("/api/auth/signup", {
        email: email.trim(),
        username: username.trim(),
        password,
      });

      // Signup successful
      toast.success("Logged in successfully!", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: true,
        theme: "light",
      });
      navigate("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.message || "Failed to create your account.",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <main>
      <h1>Create Account</h1>

      <form onSubmit={handleSubmit}>
        {/* Email */}
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
            disabled={isSigningUp}
          />
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username">Username</label>

          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            autoComplete="username"
            disabled={isSigningUp}
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password">Password</label>

          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
            disabled={isSigningUp}
          />
        </div>

        {/* Error */}
        {error && <p>{error}</p>}

        {/* Submit */}
        <button type="submit" disabled={isSigningUp}>
          {isSigningUp ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <br />

      <p>Already have an account?</p>

      <button
        type="button"
        onClick={() => navigate("/login")}
        disabled={isSigningUp}
      >
        Login
      </button>
      <ToastContainer />
    </main>
  );
}

export default Signup;
