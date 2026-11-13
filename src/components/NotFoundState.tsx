import { Link } from "react-router-dom";

type NotFoundStateProps = {
  title: string;
  message: string;
};

export default function NotFoundState({ title, message }: NotFoundStateProps) {
  return (
    <section className="cl-section">
      <div className="container">
        <div className="cl-empty-state text-center">
          <h1 className="h4 mb-2">{title}</h1>
          <p className="text-secondary mb-4">{message}</p>
          <Link className="btn btn-dark" to="/projects">
            Back to your projects
          </Link>
        </div>
      </div>
    </section>
  );
}
