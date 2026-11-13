# Project memory

## Product intent & audience

- **CostLens**: secure budget/cost review web app for managers and accountants.
- Core features: registration/auth, data entry, CSV/Excel upload, calculations, two charts, AI plain-language summary, PDF report download.
- Built for a cybersecurity course assignment: must implement features *and* document threats, mitigations, security tests, deployment, and AI reflection (14 graded items).
- Key asset to protect: confidentiality of financial data.

## Brand personality & voice

- Practical, security-conscious, trustworthy.
- Plain-language explanations for non-technical reviewers (e.g., AI summaries, anomaly detection).

## Visual design & UX direction

- Responsive navbar; home page with three-feature section, "how it works" list, footer.
- Stack: **Vite + React + Supabase** (environment constraint), not the Flask/Python stack in the original plan.
- Production build must pass `npm run build` (type-check + Vite build).
- Screenshots required as evidence throughout phases; name and organise them.

## Decisions, constraints & rationale

- **Stack change**: plan specified Flask; environment only supports Vite/React + Supabase. Assistant built Phase 0 on Vite/React and flagged for user confirmation before continuing.
- `.gitignore` added to exclude secrets and build output; example env file added.
- Git repository **not yet initialized** — tagging (`phase-0`) and secret-history checks pending.
- Phased delivery: Phase 0 (setup) → Phase 10 (report). Exit checks and screenshots per phase before moving on.
- Threat model (top 3 by likelihood × impact): 1) IDOR/broken access control, 2) malicious file upload, 3) brute force/account takeover.
- Planned mitigations: ownership checks on every route, file upload validation (extension allow-list, magic-byte, size limit, parse-only no execution), rate limiting + lockout, CSRF tokens, security headers (CSP, HSTS), HttpOnly/Secure/SameSite cookies, password hashing, secrets in env vars only, aggregated-data-only for AI calls.
- Security tests to run with fake data: invalid uploads, unauthorized project access (expect 403/404), rate-limit (expect 429), XSS, CSV injection, SQL injection.

## Open questions & assumptions

- **Confirm stack**: keep Vite/React/Supabase or force Flask? (Assistant recommends keeping Vite/React.)
- **Git setup**: user must decide whether to initialize a repo for tagging and history checks.
- Deployment target (public HTTPS URL or Docker local demo) not yet chosen.
- Supabase assumed as data/auth layer from environment; schema and RLS policies not yet defined.
- AI provider and API key management for summaries still to be decided.