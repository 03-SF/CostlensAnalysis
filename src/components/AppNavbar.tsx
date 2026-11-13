import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { APP_NAME } from "../config";

export default function AppNavbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  async function handleSignOut() {
    closeMenu();
    await signOut();
    navigate("/");
  }

  return (
    <nav className="cl-navbar" aria-label="Main navigation">
      <div className="container d-flex align-items-center justify-content-between">
        <Link className="cl-brand" to="/" onClick={closeMenu}>
          <span className="cl-brand-mark" aria-hidden="true" />
          {APP_NAME}
        </Link>

        <button
          className="btn btn-outline-secondary d-md-none"
          type="button"
          aria-expanded={isOpen}
          aria-controls="cl-nav-links"
          aria-label="Toggle navigation"
          onClick={() => setIsOpen((open) => !open)}
        >
          Menu
        </button>

        <div
          id="cl-nav-links"
          className={`d-md-flex align-items-center gap-2 ${isOpen ? "d-flex" : "d-none"} flex-column flex-md-row position-absolute position-md-static start-0 end-0 top-100 bg-white px-3 pb-3 pb-md-0 px-md-0 border-bottom border-md-0`}
        >
          {user ? (
            <>
              <Link className="cl-nav-link" to="/projects" onClick={closeMenu}>
                My projects
              </Link>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link className="cl-nav-link" to="/security" onClick={closeMenu}>
                Security
              </Link>
              <Link className="cl-nav-link" to="/report" onClick={closeMenu}>
                Report
              </Link>
              <Link className="cl-nav-link" to="/login" onClick={closeMenu}>
                Sign in
              </Link>
              <Link className="btn btn-primary btn-sm" to="/register" onClick={closeMenu}>
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
