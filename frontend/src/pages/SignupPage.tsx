import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSignup } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/getErrorMessage";

function SignupPage() {
  const navigate = useNavigate();
  const signup = useSignup();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [validationError, setValidationError] = useState("");
  const isSigningUp = signup.isPending;
  const error = validationError || (signup.error
    ? getErrorMessage(signup.error, "Failed to create your account.")
    : "");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSigningUp) return;

    setValidationError("");
    signup.reset();

    // Basic validation
    if (!email.trim() || !username.trim() || !password.trim()) {
      setValidationError("Please fill in all fields.");
      return;
    }

    signup.mutate(
      {
        email: email.trim(),
        username: username.trim(),
        password,
      },
      {
        onSuccess: () => {
          toast.success("Account created successfully!", {
            position: "top-right",
            autoClose: 2500,
            hideProgressBar: true,
            theme: "light",
          });
          navigate("/");
        },
      },
    );
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
    </main>
  );
}

export default SignupPage;
