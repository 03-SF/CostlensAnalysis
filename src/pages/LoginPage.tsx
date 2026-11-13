import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { isValidEmail } from "../auth/validation";
import { checkRateLimit, recordFailedAttempt, clearRateLimit, formatLockMessage } from "../auth/rateLimit";
import { APP_NAME } from "../config";

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/projects";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    const limitCheck = checkRateLimit(trimmedEmail.toLowerCase());
    if (!limitCheck.allowed) {
      if (limitCheck.locked) {
        setError(formatLockMessage(limitCheck.secondsRemaining));
      } else {
        setError(limitCheck.message);
      }
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await signIn(trimmedEmail, password);
    setSubmitting(false);

    if (result.error) {
      const failResult = recordFailedAttempt(trimmedEmail.toLowerCase());
      if (failResult.locked) {
        setError(formatLockMessage(failResult.secondsRemaining));
      } else if (!failResult.allowed) {
        setError(`${result.error} ${failResult.message}`);
      } else {
        setError(result.error);
      }
    } else {
      clearRateLimit(trimmedEmail.toLowerCase());
    }
  }

  return (
    <section className="cl-section">
      <div className="container">
        <div className="cl-auth-card mx-auto">
          <h1 className="h3 mb-1">Sign in to {APP_NAME}</h1>
          <p className="text-secondary mb-4">Welcome back. Pick up where you left off.</p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="login-email" className="form-label fw-semibold">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                className="form-control form-control-lg"
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="login-password" className="form-label fw-semibold">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                className="form-control form-control-lg"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-100" disabled={submitting}>
              {submitting ? "Signing in..." : "Log in"}
            </button>
          </form>

          <p className="text-center text-secondary mt-4 mb-0">
            New to {APP_NAME}? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
