import { useAuth } from "../auth/AuthContext";

const gradedItems = [
  {
    num: "1",
    title: "Registration and authentication",
    description:
      "Users create accounts with email and password through Supabase Auth. Password policy enforces 10+ characters with uppercase, lowercase, number, and symbol. Login and registration forms validate input client-side and display clear error messages. Protected routes redirect unauthenticated users to the login page.",
    evidence: ["/register", "/login", "src/auth/AuthContext.tsx", "src/auth/validation.ts"],
  },
  {
    num: "2",
    title: "Data entry (manual and file upload)",
    description:
      "Users add cost items manually via a modal form with category, description, estimated cost, and actual cost fields. Alternatively, they can upload CSV or Excel files — the parser extracts rows and inserts them as cost items. File uploads are validated for extension and size before parsing.",
    evidence: ["src/components/CostItemFormModal.tsx", "src/components/UploadModal.tsx", "src/services/fileParser.ts"],
  },
  {
    num: "3",
    title: "Calculations (variance, percentage, totals)",
    description:
      "The calculations module computes per-item variance (actual minus estimated), percentage variance, project totals, and category-level aggregates. All currency values are rounded to 2 decimal places using epsilon-based rounding to avoid floating-point drift. 15 unit tests cover edge cases including zero estimates and negative variances.",
    evidence: ["src/services/calculations.ts", "src/services/calculations.test.ts"],
  },
  {
    num: "4",
    title: "Two charts",
    description:
      "Chart 1 (ComparisonBarChart): grouped bar chart comparing estimated vs actual costs by category. Chart 2 (ActualShareChart): doughnut chart showing each category's share of total actual spending. Both use Chart.js with responsive sizing and color-coded categories.",
    evidence: ["src/components/ComparisonBarChart.tsx", "src/components/ActualShareChart.tsx"],
  },
  {
    num: "5",
    title: "AI plain-language summary",
    description:
      "A Supabase Edge Function sends aggregated project data (totals, category summaries, largest variances) to an AI provider and returns a 3-5 sentence plain-language budget summary. If no AI API key is configured, a deterministic rule-based summary is generated instead. Only aggregated data is sent — never individual line items — protecting financial data confidentiality.",
    evidence: ["supabase/functions/ai-summary/index.ts", "src/services/aiSummaryService.ts", "src/components/AISummaryPanel.tsx"],
  },
  {
    num: "6",
    title: "PDF report download",
    description:
      "Users download a formatted PDF report containing the project name, description, summary metrics table, full cost items table with totals row, and the AI summary. Generated client-side using jsPDF with autoTable for tabular data. The file is named after the project.",
    evidence: ["src/services/pdfReport.ts", "Download button on project detail page"],
  },
  {
    num: "7",
    title: "Threat model",
    description:
      "Six threats ranked by likelihood and impact: (T1) IDOR/broken access control, (T2) malicious file upload, (T3) brute force/account takeover, (T4) CSV injection, (T5) XSS, (T6) SQL injection. The top three by likelihood times impact are T1, T3, and T2. Full details on the Security page.",
    evidence: ["/security page", "src/pages/SecurityPage.tsx"],
  },
  {
    num: "8",
    title: "Mitigations implemented",
    description:
      "Row Level Security with auth.uid() ownership checks on all tables. File upload validation (extension allow-list, double-extension detection, size limit). CSV injection sanitization. Rate limiting (5 attempts / 15-minute lockout). Password policy. Security headers (CSP, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Generic error messages to prevent enumeration. AI calls use aggregated data only.",
    evidence: ["supabase/migrations/", "src/auth/rateLimit.ts", "src/services/sanitizers.ts", "index.html (meta tags)"],
  },
  {
    num: "9",
    title: "Security tests",
    description:
      "32 automated security tests across 8 categories (SEC-01 through SEC-08): CSV injection, file upload rejection, password policy, email validation, XSS handling, IDOR/access control, SQL injection resistance, and brute force rate limiting. All tests use fake data and run via Vitest. Full results on the Security page.",
    evidence: ["src/services/security.test.ts", "npm test (82 total tests, all passing)"],
  },
  {
    num: "10",
    title: "Deployment",
    description:
      "The app builds to a static dist/ folder via Vite. A _redirects file in public/ ensures SPA routing works on hosting platforms (all routes fall back to index.html). Security headers are set via meta tags in index.html. The Supabase backend (database, auth, edge functions) is hosted on Supabase's managed platform. The production build passes type-checking and produces optimized, code-split output.",
    evidence: ["npm run build", "public/_redirects", "index.html", "supabase/config.toml"],
  },
  {
    num: "11",
    title: "Technology stack",
    description:
      "Frontend: Vite + React 18 + TypeScript + Bootstrap 5. Charts: Chart.js + react-chartjs-2. PDF: jsPDF + jspdf-autotable. File parsing: PapaParse (CSV) + SheetJS (XLSX). Backend: Supabase (PostgreSQL, Auth, Edge Functions with Deno). Testing: Vitest + jsdom. The original plan specified Flask/Python, but the environment only supports Vite/React — this was documented and confirmed in Phase 0.",
    evidence: ["package.json", "vite.config.ts", "tsconfig.json"],
  },
  {
    num: "12",
    title: "Version control and project structure",
    description:
      "The project follows a phased delivery model (Phase 0 through Phase 10) with exit checks at each phase. Source code is organized by concern: auth/, components/, costs/, projects/, services/, pages/, lib/. Supabase migrations and edge functions live under supabase/. A .gitignore excludes secrets and build output.",
    evidence: [".gitignore", ".env.example", "Project file structure"],
  },
  {
    num: "13",
    title: "AI reflection",
    description:
      "AI was used in two ways: (1) as a feature — the edge function calls an AI provider to generate plain-language budget summaries, with a deterministic fallback when no API key is set; (2) as a development tool — AI assistance was used to scaffold code, write tests, and review security. The AI summary feature intentionally sends only aggregated data to protect user privacy. The summary is labeled with its source ('AI' or 'rules') so users know which generated it.",
    evidence: ["supabase/functions/ai-summary/index.ts", "src/components/AISummaryPanel.tsx (source badge)"],
  },
  {
    num: "14",
    title: "Security documentation",
    description:
      "A dedicated Security page (/security) documents the full threat model with likelihood/impact ratings, mitigations for each threat, security headers configuration, automated test results table, and additional controls (authentication, RLS, AI privacy, secrets management, session management). This page is accessible from the navbar without authentication.",
    evidence: ["/security", "src/pages/SecurityPage.tsx"],
  },
];

const techStack = [
  { layer: "Frontend framework", tech: "React 18 + TypeScript" },
  { layer: "Build tool", tech: "Vite 5" },
  { layer: "UI library", tech: "Bootstrap 5" },
  { layer: "Charts", tech: "Chart.js + react-chartjs-2" },
  { layer: "PDF generation", tech: "jsPDF + jspdf-autotable" },
  { layer: "File parsing", tech: "PapaParse (CSV) + SheetJS (XLSX)" },
  { layer: "Backend", tech: "Supabase (PostgreSQL + Auth + Edge Functions)" },
  { layer: "Edge runtime", tech: "Deno" },
  { layer: "Testing", tech: "Vitest + jsdom" },
];

export default function ReportPage() {
  const { user } = useAuth();

  return (
    <section className="cl-section cl-report-page">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 no-print">
          <div>
            <h1 className="h2 mb-1">Final project report</h1>
            <p className="text-secondary mb-0">
              Comprehensive documentation covering all 14 graded items for the CostLens
              cybersecurity course assignment.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => window.print()}
          >
            Save as PDF
          </button>
        </div>

        <div className="cl-report-header mb-5">
          <h1 className="h1 mb-1">CostLens</h1>
          <p className="lead mb-2">See where your budget really goes.</p>
          <p className="text-secondary mb-0">
            Secure budget and cost review web application — cybersecurity course project report.
            Prepared by {user?.email ?? "project owner"}. Generated on{" "}
            {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
          </p>
        </div>

        <h2 className="h4 mb-3">Executive summary</h2>
        <p className="mb-4">
          CostLens is a web application that helps managers and accountants compare planned
          budgets with actual spending. Users create projects, add cost items manually or by
          uploading spreadsheets, and review visual charts, variance calculations, and an
          AI-generated plain-language summary. Reports can be downloaded as PDF. The
          application was built with security as a primary concern: all data access is
          scoped to the authenticated user through database-level row level security, file
          uploads are validated, brute force attacks are mitigated with rate limiting, and
          32 automated security tests verify the controls.
        </p>

        <h2 className="h4 mb-3">Technology stack</h2>
        <div className="table-responsive mb-5">
          <table className="table table-sm table-bordered">
            <thead className="table-light">
              <tr>
                <th scope="col">Layer</th>
                <th scope="col">Technology</th>
              </tr>
            </thead>
            <tbody>
              {techStack.map((t) => (
                <tr key={t.layer}>
                  <td className="fw-semibold">{t.layer}</td>
                  <td>{t.tech}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="h4 mb-3">Graded items</h2>
        <p className="mb-4">
          The following sections map each of the 14 graded items to the implemented features,
          a description of what was built, and pointers to the evidence.
        </p>

        {gradedItems.map((item) => (
          <div key={item.num} className="cl-report-item mb-4">
            <div className="d-flex gap-3">
              <span className="cl-report-num">{item.num}</span>
              <div className="flex-grow-1">
                <h3 className="h5 mb-2">{item.title}</h3>
                <p className="mb-2">{item.description}</p>
                <div className="small text-secondary">
                  <strong>Evidence:</strong>{" "}
                  {item.evidence.map((e, i) => (
                    <span key={e}>
                      <code>{e}</code>
                      {i < item.evidence.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        <h2 className="h4 mb-3">Test summary</h2>
        <div className="table-responsive mb-5">
          <table className="table table-sm table-bordered">
            <thead className="table-light">
              <tr>
                <th scope="col">Test file</th>
                <th scope="col">Tests</th>
                <th scope="col" className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>security.test.ts</code></td>
                <td className="text-end">32</td>
                <td className="text-center"><span className="badge bg-success">Pass</span></td>
              </tr>
              <tr>
                <td><code>calculations.test.ts</code></td>
                <td className="text-end">15</td>
                <td className="text-center"><span className="badge bg-success">Pass</span></td>
              </tr>
              <tr>
                <td><code>rateLimit.test.ts</code></td>
                <td className="text-end">9</td>
                <td className="text-center"><span className="badge bg-success">Pass</span></td>
              </tr>
              <tr>
                <td><code>fileParser.test.ts</code></td>
                <td className="text-end">9</td>
                <td className="text-center"><span className="badge bg-success">Pass</span></td>
              </tr>
              <tr>
                <td><code>sanitizers.test.ts</code></td>
                <td className="text-end">9</td>
                <td className="text-center"><span className="badge bg-success">Pass</span></td>
              </tr>
              <tr>
                <td><code>validation.test.ts</code></td>
                <td className="text-end">8</td>
                <td className="text-center"><span className="badge bg-success">Pass</span></td>
              </tr>
              <tr className="fw-bold">
                <td>Total</td>
                <td className="text-end">82</td>
                <td className="text-center"><span className="badge bg-success">All pass</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="h4 mb-3">AI reflection</h2>
        <div className="cl-report-item mb-4">
          <p className="mb-2">
            <strong>AI as a feature:</strong> The AI summary edge function calls an external
            AI provider (OpenAI GPT-4o-mini) to generate a 3-5 sentence plain-language budget
            summary. To protect user privacy, only aggregated data is sent — project totals,
            category-level summaries, and the largest variances. Individual cost line items
            are never sent to the AI provider. If no API key is configured, a deterministic
            rule-based summary is generated instead, and the output is labeled with its source
            ("AI" or "rules") so the user knows which produced it.
          </p>
          <p className="mb-2">
            <strong>AI as a development tool:</strong> AI assistance was used throughout
            development to scaffold components, write test suites, review security controls,
            and identify potential vulnerabilities. All AI-suggested code was reviewed and
            tested before inclusion. The security test suite (32 tests) was designed to verify
            that the mitigations work correctly with fake data.
          </p>
          <p className="mb-0">
            <strong>Limitations:</strong> The AI summary depends on an external API key that
            must be configured as an edge function secret. Without it, the rule-based fallback
            provides a useful but less nuanced summary. Rate limits and API costs may apply to
            the AI provider. The summary should be treated as advisory, not as financial advice.
          </p>
        </div>

        <h2 className="h4 mb-3">Deployment notes</h2>
        <div className="cl-report-item mb-4">
          <p className="mb-2">
            <strong>Frontend:</strong> Run <code>npm run build</code> to produce an optimized
            static build in the <code>dist/</code> folder. Deploy this folder to any static
            hosting provider (Netlify, Vercel, Cloudflare Pages, GitHub Pages). The{" "}
            <code>_redirects</code> file ensures all client-side routes resolve to index.html.
          </p>
          <p className="mb-2">
            <strong>Backend:</strong> Supabase provides the PostgreSQL database, authentication,
            and edge function hosting. Migrations are applied via the Supabase MCP tools. The
            AI summary edge function is deployed via the Supabase deploy tool. The{" "}
            <code>AI_API_KEY</code> secret must be configured for AI summaries to work.
          </p>
          <p className="mb-0">
            <strong>Security headers:</strong> Meta tags in index.html provide baseline
            Content-Security-Policy and other security headers. For production, configure
            equivalent HTTP response headers at the CDN or hosting platform level for full
            browser enforcement.
          </p>
        </div>

        <div className="cl-report-footer text-center text-secondary mt-5 pt-4 border-top">
          <p className="mb-0">CostLens — Cybersecurity Course Project Report — Generated {new Date().toLocaleDateString("en-US")}</p>
        </div>
      </div>
    </section>
  );
}
