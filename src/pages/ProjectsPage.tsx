import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import ProjectFormModal from "../components/ProjectFormModal";
import { listProjects, type Project } from "../projects/projectService";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [showCreate, setShowCreate] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    listProjects()
      .then((result) => {
        if (!active) return;
        setProjects(result);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return (
    <section className="cl-section">
      <div className="container">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
          <div>
            <h1 className="h2 mb-1">Your projects</h1>
            <p className="text-secondary mb-0">Only you can see the projects you create here.</p>
          </div>
          <button type="button" className="btn btn-dark" onClick={() => setShowCreate(true)}>
            New project
          </button>
        </div>

        {status === "loading" && <LoadingSpinner />}

        {status === "error" && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
            <span>We could not load your projects.</span>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </button>
          </div>
        )}

        {status === "ready" && projects.length === 0 && (
          <div className="cl-empty-state text-center">
            <h2 className="h5 mb-2">No projects yet</h2>
            <p className="text-secondary mb-4">Create your first project to start tracking a budget.</p>
            <button type="button" className="btn btn-dark" onClick={() => setShowCreate(true)}>
              Create your first project
            </button>
          </div>
        )}

        {status === "ready" && projects.length > 0 && (
          <div className="row g-4">
            {projects.map((project) => (
              <div className="col-12 col-md-6 col-lg-4" key={project.id}>
                <Link className="cl-project-card" to={`/projects/${project.id}`}>
                  <h2 className="h5 mb-2">{project.name}</h2>
                  <p className="cl-project-description text-secondary mb-3">
                    {project.description || "No description"}
                  </p>
                  <span className="small text-secondary">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <ProjectFormModal
          project={null}
          onClose={() => setShowCreate(false)}
          onSaved={(project) => navigate(`/projects/${project.id}`)}
        />
      )}
    </section>
  );
}
