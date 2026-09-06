import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useLogin } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/getErrorMessage";

function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [validationError, setValidationError] = useState("");
  const isLoggingIn = login.isPending;
  const error = validationError || (login.error
    ? getErrorMessage(login.error, "Unable to log in. Please try again.")
    : "");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoggingIn) return;

    setValidationError("");
    login.reset();

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setValidationError("Please enter your email and password.");
      return;
    }

    login.mutate(
      {
        email: email.trim(),
        password,
      },
      {
        onSuccess: (user) => {
          toast.success(`Welcome back, ${user.username}!`, {
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

export default LoginPage;
