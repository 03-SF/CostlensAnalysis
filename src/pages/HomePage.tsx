import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { APP_NAME, APP_TAGLINE } from "../config";

const features = [
  {
    icon: "1",
    title: "Compare estimates with actuals",
    text: "Enter planned and real costs by hand or upload a spreadsheet. Variance is calculated for you.",
  },
  {
    icon: "2",
    title: "Spot unusual expenses",
    text: "Items that drift far from their estimate are flagged, with a plain-language summary to review.",
  },
  {
    icon: "3",
    title: "Share a clear report",
    text: "Download a tidy PDF with your totals, charts and flagged items, ready for your team.",
  },
];

const steps = [
  "Create a project for your budget.",
  "Add cost items or upload your file.",
  "Review the charts, flags and summary.",
  "Download the report.",
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <>
      <section className="cl-hero" id="top">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <span className="cl-hero-eyebrow fade-up">Budget analysis, simplified</span>
              <h1 className="fade-up">{APP_TAGLINE}</h1>
              <p className="cl-hero-lead fade-up-delay">
                {APP_NAME} replaces the manual spreadsheet routine. Compare what you planned
                with what you spent, and see the surprises at a glance.
              </p>
              <div className="d-flex flex-wrap gap-2 mt-4 fade-up-delay">
                {user ? (
                  <Link className="btn btn-dark btn-lg" to="/projects">
                    Go to my projects
                  </Link>
                ) : (
                  <>
                    <Link className="btn btn-primary btn-lg" to="/register">
                      Sign up
                    </Link>
                    <Link className="btn btn-outline-dark btn-lg" to="/login">
                      Log in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cl-section" id="features">
        <div className="container">
          <h2 className="h3 mb-4">What you can do</h2>
          <div className="row g-4">
            {features.map((feature) => (
              <div className="col-12 col-md-6 col-lg-4" key={feature.title}>
                <article className="cl-feature-card">
                  <span className="cl-feature-icon" aria-hidden="true">
                    {feature.icon}
                  </span>
                  <h3 className="h5 mb-2">{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cl-section pt-0" id="how-it-works">
        <div className="container">
          <h2 className="h3 mb-4">How it works</h2>
          <ol className="list-group list-group-numbered col-lg-8">
            {steps.map((step) => (
              <li className="list-group-item py-3" key={step}>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="cl-footer">
        <div className="container d-flex flex-column flex-sm-row justify-content-between gap-2">
          <span>
            {APP_NAME} · {APP_TAGLINE}
          </span>
          <span className="text-secondary">Prototype</span>
        </div>
      </footer>
    </>
  );
}
