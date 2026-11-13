# CostLens

A responsive budget analysis prototype for entering or importing estimated and actual costs, calculating variance, viewing three charts, generating a budget summary, and downloading a PDF.

- Live app: https://costlens-web-applica-juib.bolt.host
- Source: https://github.com/03-sf/costlensanalysis

## Stack and actual features

React 18, TypeScript, Vite 5, Bootstrap 5, Chart.js, Supabase Auth/PostgreSQL with row level security, Papa Parse, SheetJS, and jsPDF with AutoTable.

The summary calls the Supabase `ai-summary` Edge Function. It optionally uses an external OpenAI model when the server has `AI_API_KEY`, and otherwise returns a deterministic budget-rules summary. Statistical z-score/IQR anomaly detection is **future work**. The current PDF export contains totals, the cost table, and a summary if generated in the current page session; it does not embed charts.

## Setup

Use Node.js 24 LTS (24.15 or later) or Node.js 22.22.2 or later; older Node versions do not satisfy all development dependencies.

```sh
npm ci
```

Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for your own Supabase project. The anon key is public and must be protected by database policies. Never put a service-role key or LLM secret in a `VITE_` variable.

Apply the SQL migrations in `supabase/migrations` in filename order. Configure email authentication in Supabase. Deploy `supabase/functions/ai-summary` using the Supabase CLI or dashboard with JWT verification enabled. Optionally configure `AI_API_KEY` in the Edge Function's server-side secrets.

```sh
npm run dev
npm test
npm run build
npm run preview
```

## Deployment

Build command: `npm run build`. Publish directory: `dist`. Set the two public Vite variables before the build and configure the host to route SPA paths to `index.html` (a redirects file is provided). The existing public prototype is hosted on bolt.host; changes in this checkout require a separate redeployment.

## Data format and calculations

Upload CSV or XLSX with `category,description,estimated,actual` columns, at most 2 MiB and 5,000 data rows. Costs must be non-negative with up to two decimal places. Variance is actual minus estimated; percentage variance is variance divided by estimate times 100, or N/A when the estimate is zero.

## Security and evidence

Database migrations restrict project and cost-item CRUD to their owner and revoke anonymous access. Browser validation and the sessionStorage login lockout are supplemental controls, not server-side abuse prevention. Hosting headers, endpoint quotas, backups, and MFA require deployment configuration and verification.

The `evidence` directory contains live test results and screenshots using synthetic data. The browser test scripts are environment-specific and require Playwright plus installed Chrome and a `COSTLENS_QA_PASSWORD` environment variable for synthetic accounts; do not run them against systems you do not own. Demo and supplemental scripts expect accounts created by the live test run. No real financial data should be used for these tests. Generated submission packages under `output/` are excluded from Git.

## Submission

The report is generated under `output/pdf`. Author: Sumrun Fatima. Course: Software Quality Engineering. The submission package is mapped to the supplied 14-item brief; the AI feature remains partially verified because only the rules fallback was observed live. Confirm the portal deadline and size limits before upload. Keep the source, PDF, screenshots, and demo together as a backup.
