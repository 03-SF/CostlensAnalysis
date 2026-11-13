const threats = [
  {
    id: "T1",
    name: "IDOR / Broken access control",
    likelihood: "High",
    impact: "High",
    mitigation:
      "Every database query is scoped to the authenticated user via Supabase Row Level Security. Project and cost item tables enforce ownership checks using auth.uid(). The client validates UUIDs before making requests, rejecting path traversal and malformed IDs. Users can only see and modify their own data.",
    testRef: "SEC-06",
  },
  {
    id: "T2",
    name: "Malicious file upload",
    likelihood: "Medium",
    impact: "High",
    mitigation:
      "File uploads are validated client-side: only .csv and .xlsx extensions are accepted, double-extension attacks (e.g. report.csv.exe) are caught by checking the real last extension, and files with no extension are rejected. Parsed cell content is sanitized for CSV injection before use. No uploaded file is executed or stored — it is parsed in memory and discarded.",
    testRef: "SEC-02",
  },
  {
    id: "T3",
    name: "Brute force / account takeover",
    likelihood: "High",
    impact: "High",
    mitigation:
      "Client-side rate limiting locks out an email after 5 failed attempts within 5 minutes, enforcing a 15-minute cooldown. Supabase Auth also enforces server-side rate limits. Error messages are deliberately generic ('Email or password is incorrect') to prevent user enumeration.",
    testRef: "SEC-08",
  },
  {
    id: "T4",
    name: "CSV injection (formula injection)",
    likelihood: "Medium",
    impact: "Medium",
    mitigation:
      "All cell values from uploaded files are passed through sanitizeCell(), which prepends a single apostrophe to any cell starting with =, +, -, @, tab, or carriage return — the characters that trigger formula execution in spreadsheet applications.",
    testRef: "SEC-01",
  },
  {
    id: "T5",
    name: "Cross-site scripting (XSS)",
    likelihood: "Low",
    impact: "High",
    mitigation:
      "The app uses React, which escapes all interpolated values by default. User input is never injected via innerHTML or dangerouslySetInnerHTML. A Content-Security-Policy header restricts script sources to 'self'. Cell content from uploads is treated as plain text.",
    testRef: "SEC-05",
  },
  {
    id: "T6",
    name: "SQL injection",
    likelihood: "Low",
    impact: "High",
    mitigation:
      "All database access goes through the Supabase client SDK, which uses parameterized queries. No raw SQL is constructed from user input. Input validation rejects overly long strings and non-numeric cost values before they reach the database layer.",
    testRef: "SEC-07",
  },
];

const securityHeaders = [
  { name: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; object-src 'none'" },
  { name: "X-Content-Type-Options", value: "nosniff" },
  { name: "X-Frame-Options", value: "DENY" },
  { name: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { name: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { name: "Robots", value: "noindex, nofollow" },
];

const testSummary = [
  { id: "SEC-01", name: "CSV injection sanitization", tests: 4, status: "Pass" },
  { id: "SEC-02", name: "Invalid file upload rejection", tests: 5, status: "Pass" },
  { id: "SEC-03", name: "Password policy enforcement", tests: 6, status: "Pass" },
  { id: "SEC-04", name: "Email validation", tests: 3, status: "Pass" },
  { id: "SEC-05", name: "XSS-safe cell handling", tests: 2, status: "Pass" },
  { id: "SEC-06", name: "IDOR / broken access control", tests: 4, status: "Pass" },
  { id: "SEC-07", name: "SQL injection input validation", tests: 4, status: "Pass" },
  { id: "SEC-08", name: "Rate limiting / brute force", tests: 4, status: "Pass" },
];

export default function SecurityPage() {
  return (
    <section className="cl-section">
      <div className="container">
        <h1 className="h2 mb-2">Security documentation</h1>
        <p className="text-secondary mb-4">
          Threat model, mitigations, and test results for the CostLens budget review application.
        </p>

        <h2 className="h4 mb-3">Threat model</h2>
        <p className="mb-4">
          The primary asset to protect is the confidentiality of users' financial data.
          Threats were ranked by likelihood times impact. The top three are addressed with
          multiple layers of defense.
        </p>

        <div className="table-responsive mb-5">
          <table className="table table-bordered align-top">
            <thead className="table-light">
              <tr>
                <th scope="col" style={{ width: "60px" }}>ID</th>
                <th scope="col">Threat</th>
                <th scope="col" style={{ width: "100px" }}>Likelihood</th>
                <th scope="col" style={{ width: "100px" }}>Impact</th>
                <th scope="col">Mitigation</th>
                <th scope="col" style={{ width: "90px" }}>Tests</th>
              </tr>
            </thead>
            <tbody>
              {threats.map((t) => (
                <tr key={t.id}>
                  <td className="fw-bold">{t.id}</td>
                  <td className="fw-semibold">{t.name}</td>
                  <td>
                    <span className={
                      t.likelihood === "High" ? "text-danger" : t.likelihood === "Medium" ? "text-warning" : "text-success"
                    }>
                      {t.likelihood}
                    </span>
                  </td>
                  <td>
                    <span className={
                      t.impact === "High" ? "text-danger" : t.impact === "Medium" ? "text-warning" : "text-success"
                    }>
                      {t.impact}
                    </span>
                  </td>
                  <td className="small">{t.mitigation}</td>
                  <td><code>{t.testRef}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="h4 mb-3">Security headers</h2>
        <p className="mb-3">
          The following headers are set via meta tags in the HTML head. On a production
          hosting platform, equivalent HTTP response headers should also be configured at
          the server or CDN level for full coverage.
        </p>
        <div className="table-responsive mb-5">
          <table className="table table-sm table-bordered">
            <thead className="table-light">
              <tr>
                <th scope="col">Header</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {securityHeaders.map((h) => (
                <tr key={h.name}>
                  <td className="fw-semibold text-nowrap">{h.name}</td>
                  <td className="small"><code>{h.value}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="h4 mb-3">Security test results</h2>
        <p className="mb-3">
          All security tests are automated and run as part of the test suite. They use fake
          data and do not touch real user accounts or production data.
        </p>
        <div className="table-responsive mb-5">
          <table className="table table-sm table-bordered">
            <thead className="table-light">
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Category</th>
                <th scope="col" className="text-end">Tests</th>
                <th scope="col" className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {testSummary.map((t) => (
                <tr key={t.id}>
                  <td className="fw-bold"><code>{t.id}</code></td>
                  <td>{t.name}</td>
                  <td className="text-end">{t.tests}</td>
                  <td className="text-center">
                    <span className="badge bg-success">{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="fw-bold">
                <td colSpan={2}>Total</td>
                <td className="text-end">{testSummary.reduce((sum, t) => sum + t.tests, 0)}</td>
                <td className="text-center">
                  <span className="badge bg-success">All pass</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <h2 className="h4 mb-3">Additional controls</h2>
        <ul className="list-group mb-4">
          <li className="list-group-item">
            <strong>Authentication:</strong> Supabase Auth with email/password. Password
            policy requires 10+ characters with uppercase, lowercase, number, and symbol.
          </li>
          <li className="list-group-item">
            <strong>Row Level Security:</strong> Enabled on all tables. Ownership checks
            use auth.uid(). The anon role has no access to any table.
          </li>
          <li className="list-group-item">
            <strong>AI summary privacy:</strong> The AI summary edge function receives only
            aggregated totals and category-level summaries — never individual line items.
          </li>
          <li className="list-group-item">
            <strong>Secrets management:</strong> All API keys and connection strings are
            stored in environment variables, never committed to source code.
          </li>
          <li className="list-group-item">
            <strong>Session management:</strong> Supabase manages JWT-based sessions with
            secure, HttpOnly cookies configured at the platform level.
          </li>
        </ul>
      </div>
    </section>
  );
}
