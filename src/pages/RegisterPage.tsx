import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { isValidEmail, unmetPasswordRules, PASSWORD_RULES } from "../auth/validation";
import { checkRateLimit, recordFailedAttempt, clearRateLimit, formatLockMessage } from "../auth/rateLimit";
import { APP_NAME } from "../config";

export default function RegisterPage() {
  const { user, signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdWithoutSession, setCreatedWithoutSession] = useState(false);

  if (user) return <Navigate to="/projects" replace />;

  const unmetRules = unmetPasswordRules(password);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (unmetRules.length > 0) {
      setError("Your password does not meet all the requirements yet.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const limitCheck = checkRateLimit(`register:${trimmedEmail.toLowerCase()}`);
    if (!limitCheck.allowed) {
      setSubmitting(false);
      if (limitCheck.locked) {
        setError(formatLockMessage(limitCheck.secondsRemaining));
      } else {
        setError(limitCheck.message);
      }
      return;
    }

    const result = await signUp(trimmedEmail, password);
    setSubmitting(false);
    if (result.error) {
      const failResult = recordFailedAttempt(`register:${trimmedEmail.toLowerCase()}`);
      if (failResult.locked) {
        setError(formatLockMessage(failResult.secondsRemaining));
      } else if (!failResult.allowed) {
        setError(`${result.error} ${failResult.message}`);
      } else {
        setError(result.error);
      }
      return;
    }
    clearRateLimit(`register:${trimmedEmail.toLowerCase()}`);
    if (!result.signedIn) setCreatedWithoutSession(true);
  }

  if (createdWithoutSession) {
    return (
      <section className="cl-section">
        <div className="container">
          <div className="cl-auth-card mx-auto text-center">
            <h1 className="h3 mb-2">Account created</h1>
            <p className="text-secondary mb-4">You can now sign in with your new account.</p>
            <Link className="btn btn-dark btn-lg w-100" to="/login">
              Go to sign in
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="cl-section">
      <div className="container">
        <div className="cl-auth-card mx-auto">
          <h1 className="h3 mb-1">Create your {APP_NAME} account</h1>
          <p className="text-secondary mb-4">Your projects stay private to you.</p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="register-email" className="form-label fw-semibold">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                className="form-control form-control-lg"
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="register-password" className="form-label fw-semibold">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                className="form-control form-control-lg"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby="password-requirements"
                required
              />
              <ul id="password-requirements" className="cl-password-rules list-unstyled mt-2 mb-0">
                {PASSWORD_RULES.map((rule) => {
                  const met = !unmetRules.includes(rule.label);
                  return (
                    <li key={rule.label} className={met ? "text-success" : "text-secondary"}>
                      <span aria-hidden="true">{met ? "\u2713" : "\u2022"}</span> {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mb-4">
              <label htmlFor="register-confirm" className="form-label fw-semibold">
                Confirm password
              </label>
              <input
                id="register-confirm"
                type="password"
                className="form-control form-control-lg"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-100" disabled={submitting}>
              {submitting ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p className="text-center text-secondary mt-4 mb-0">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
