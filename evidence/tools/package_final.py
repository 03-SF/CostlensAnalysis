"""Create a curated submission folder and matching ZIP, excluding secrets and scratch files."""
from pathlib import Path
import subprocess, shutil, zipfile, json, hashlib

root=Path(__file__).resolve().parents[2]
name='Sumrun_Fatima_CostLens_Submission'
dest=root/'output'/name
dest.mkdir(parents=True,exist_ok=True)
for directory in ['source','report','demo','evidence/screenshots']:
    (dest/directory).mkdir(parents=True,exist_ok=True)

tracked=subprocess.check_output(['git','ls-files'],cwd=root,text=True).splitlines()
source_paths=[p for p in tracked if p and not p.startswith('.bolt/') and p not in ['.gitkeep','supabase/functions-deploy-state.json']]
if 'README.md' not in source_paths:source_paths.append('README.md')
for relative in source_paths:
    path=Path(relative)
    if path.name.startswith('.env') and path.name!='.env.example':continue
    target=dest/'source'/relative;target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(root/relative,target)

old_report=dest/'report/CostLens_Report_Completed.pdf'
if old_report.exists():old_report.unlink()
shutil.copy2(root/'output/pdf/CostLens_Report_Final.pdf',dest/'report/CostLens_Report_Final.pdf')
shutil.copy2(root/'output/demo/CostLens_Demo.webm',dest/'demo/CostLens_Demo.webm')

evidence_files=['live-results.json','supplemental-results.json','secret-scan.json','dependency-audit-summary.json','local-checks.json','pdf-validation.json','video-validation.json','downloaded-budget-report.pdf','supplemental-import-report.pdf','assignment-brief.md']
for relative in evidence_files:shutil.copy2(root/'evidence'/relative,dest/'evidence'/relative)
for path in (root/'evidence/screenshots').glob('*.png'):
    if path.name not in ['failure-state.png','figure4-initial-animation.png']:
        shutil.copy2(path,dest/'evidence/screenshots'/path.name)

(dest/'README_START_HERE.md').write_text('''# CostLens - Submission

**Student:** Sumrun Fatima<br>
**Roll number:** FA23-BSE-091<br>
**Course:** Software Quality Engineering

## Open these first

- [Report with screenshots, architecture, threats and tests](report/CostLens_Report_Final.pdf)
- [Requirement-by-requirement assessment](REQUIREMENTS_CHECKLIST.md)
- [Standalone threat-and-mitigation table](THREAT_AND_MITIGATION_TABLE.md)
- [Live prototype](https://costlens-web-applica-juib.bolt.host)
- [Silent demonstration video, 3 minutes 10 seconds](demo/CostLens_Demo.webm)
- [Application source and setup instructions](source/README.md)
- [Original screenshot captures](evidence/screenshots/)
- [Assignment brief](evidence/assignment-brief.md)

## Assessment

Items 1-3 and 5-14 are supported by the collected evidence. **Item 4 is partially verified:** an external LLM path is implemented in the Edge Function, but the observed live response came from budget rules. A successful live AI-provider response or demonstrated anomaly detector is still needed to make this claim unambiguous. The report discloses this limitation.

Three security tests were demonstrated with synthetic data. Invalid uploads and cross-account reads passed. The bounded direct-login request test did not produce a rate-limiting response; this failure is documented rather than presented as a successful control. The assignment requests demonstration of tests, not a claim that all controls pass.

Unresolved security work includes server rate limiting, dependency remediation, effective security response headers and broader administrative assurance. The package is a tested prototype submission, not a production-security certification.

## Running and reviewing

Use the live link or play the WebM demo. To run your own deployment, follow the source README and configure your own Supabase project using the blank environment example. No environment secrets or database credentials are included.

The report is 22 pages including screenshots and appendices; the supplied brief gives no page limit. Keep the report and demo folders together to preserve the report's relative video link. If the PDF viewer blocks local video links, open the WebM file directly in Chrome, Edge or another compatible player.

The public repository is https://github.com/03-SF/CostlensAnalysis. Source in this package also includes the local README and ignore-file updates; these were not pushed or redeployed. The demo and live tests use fake records only.

No deadline or upload-size limit was provided. Confirm those portal details before uploading the ZIP. The package contains all five expected submission categories, with the AI qualification above.
''',encoding='utf-8')

(dest/'REQUIREMENTS_CHECKLIST.md').write_text('''# Requirement assessment

Assessment against the complete brief supplied by the student. "Covered" means the requested implementation or documentation has supporting evidence; it is not a grading guarantee.

| Item | Requirement | Assessment | Evidence |
| --- | --- | --- | --- |
| 1 | Cost entry or Excel/CSV upload | Covered | Manual entry, CSV and XLSX imports; Figures 1-2; supplemental results; demo. |
| 2 | Automatic cost and variance calculations | Covered | All three reference cases and totals matched; Figure 3; calculation tests. |
| 3 | At least two charts | Covered | Three plotted charts; Figure 4; demo. |
| 4 | One AI feature | **Partially verified** | Edge Function can invoke an external LLM, but the live result was `source: rules`. No anomaly detector is implemented. Figure 5 and report section 3.1 explain the gap. |
| 5 | Downloadable results report | Covered | PDF downloaded and reopened; Figure 6; exported PDFs in evidence. Charts need not be embedded under this brief. |
| 6 | At least five threats | Covered | Nine threats in report section 4 and the standalone table. |
| 7 | Realistic attack scenario for each | Covered | A scenario accompanies every threat. |
| 8 | Mitigation for each | Covered | Proposed mitigations and actual implementation status are distinguished. The brief does not require every proposed control to be implemented. |
| 9 | Top three threats with justification | Covered | Ranked IDOR, account takeover and malicious upload with impact/likelihood justification. |
| 10 | Pre-deployment checklist | Covered | Report section 5 records verified, partial, failed and unverified controls. |
| 11 | Demonstrate three safe-data security tests | Covered as a demonstration | Four invalid files rejected; separate-account URL/API reads blocked; 20 direct login requests and browser lockout documented. The direct-request control failed, and that failure is explicitly reported. |
| 12 | Deploy or demonstrate locally | Covered | Public HTTPS prototype plus a local 3:10 demo. |
| 13 | Implemented controls versus future work | Covered | Report section 8 and security checklist. |
| 14 | AI workflow benefits and limitations | Covered as reflection | Report sections 3.1 and 9-10 distinguish observed rules, optional LLM behavior and future anomaly detection. |

## Expected submission contents

| Expected category | Included location |
| --- | --- |
| Source code | `source/`, including migrations, Edge Function, tests and setup instructions. |
| Working prototype or demonstration | Live URL in README and `demo/CostLens_Demo.webm`. |
| Screenshots | Embedded in report and originals under `evidence/screenshots/`. |
| Threat-and-mitigation table | `THREAT_AND_MITIGATION_TABLE.md` and report section 4. |
| Design, tests and limitations report | `report/CostLens_Report_Final.pdf`. |

## Before claiming all 14 items are fulfilled

Demonstrate the external-AI response on the prototype, or implement and demonstrate an actual anomaly-detection feature. Do not relabel the existing deterministic budget summary as verified LLM output. Server abuse prevention and the dependency findings also remain security improvements, even though their honest documentation meets the analysis requirements.

The prompt mentions desktop and web but explicitly specifies a web application in item 1; the delivered browser-based application is assessed against that wording. No separate native desktop executable is claimed.
''',encoding='utf-8')

(dest/'THREAT_AND_MITIGATION_TABLE.md').write_text('''# Cybersecurity threats and mitigations

Primary asset: confidentiality and integrity of project financial records. Status describes evidence, not a promise that every proposed control is deployed.

| Threat | Realistic attack scenario | Suitable prevention or mitigation | Implemented status and evidence |
| --- | --- | --- | --- |
| Malicious upload | An attacker submits a disguised executable or resource-heavy workbook to exploit the parser or freeze the browser. | Allow-list formats; cap size/rows; validate content; parse without execution; use maintained parsers and resource limits. | Partial: browser checks and four invalid-upload tests passed. XLSX dependency advisories and stronger archive validation remain unresolved. |
| Formula injection | Formula-like cell text is executed when later exported to a spreadsheet. | Neutralize formula prefixes on import and independently at spreadsheet export. | Partial: live CSV import prefixed `=1+1` with an apostrophe; manual input stays literal. Current export is PDF. Future spreadsheet export needs its own escaping. |
| Broken access control / IDOR | Account B changes the project id to obtain account A's costs. | Enforce owner checks at the database for all CRUD operations; revoke anonymous access. | RLS migrations exist; separate-account URL and direct project/item API reads returned no owner records. Cross-account mutation matrix remains future testing. |
| SQL injection | A category containing SQL syntax changes the structure of a query. | Use structured database client queries, avoid concatenated SQL and enforce database input constraints. | Tested SQL-like category remained literal and existing rows stayed readable. This is limited evidence, not proof of every query path. |
| Cross-site scripting | A saved HTML event handler executes and steals the browser session. | Framework text escaping; avoid raw HTML; deploy an effective HTTP CSP. | React displayed the tested payload literally with no alert. Several response-header defenses remain partial or absent. |
| Brute force / account takeover | A bot repeatedly tries leaked passwords to enter the victim's account. | Server-enforced Auth limits, strong password policy, CAPTCHA where appropriate, MFA and alerts. | Browser lockout and UI policy exist. Twenty direct wrong-password requests returned 400 without 429; server control remains unverified/failed within the test budget. |
| Excessive requests / denial of service | Repeated API or summary calls consume resources or LLM credits. | Enforce server-side quotas, request timeouts, upload resource limits and spending caps. | Browser file caps exist; independently enforced upload/summary quotas were not verified. The bounded login test did not produce rate rejection. |
| Session theft / CSRF | Hostile script steals a persisted bearer token or a third-party page attempts a state-changing call. | HTTPS, careful token storage, strict origin/CSP rules and explicit authenticated requests. | HTTPS, HSTS and explicit bearer authentication observed. HttpOnly cookie protection is not claimed for this persisted browser-token design. |
| Prompt injection / AI disclosure | A category or project name contains instructions, or confidential labels reach an external model. | Minimize fields, treat names as untrusted data, validate the complete schema, keep AI keys on the server, and require human review. | Payload excludes emails and descriptions but contains names and aggregates. Live response used rules; external-provider execution and prompt defenses were not demonstrated. |

## Three greatest potential harms

1. **IDOR (4 x 5 = 20):** an inexpensive identifier change could expose records across owners; database ownership is a critical boundary.
2. **Account takeover (4 x 5 = 20):** an attacker with the victim's valid session obtains that user's projects. Direct-request testing revealed an abuse-control gap.
3. **Malicious upload (4 x 4 = 16):** the application deliberately parses untrusted files and the production XLSX dependency has known advisories. Browser parsing reduces server execution risk but does not remove client-resource or data-integrity risks.

Scores use a qualitative 1-5 likelihood and impact scale. Full detail, the checklist and screenshots are in the report.
''',encoding='utf-8')

(dest/'evidence/README.md').write_text('''# Evidence notes

Live observations were collected on 14 November 2026 in Pakistan time using fake data. JSON timestamps use UTC and can therefore show 13 November.

- `live-results.json`: required live checks, observed HTTP statuses and deployed bundle scan. Its initial GitHub check used a case-sensitive title comparison and incorrectly recorded FAIL; `supplemental-results.json` corrects this harness error with a successful HTTP 200 fresh-context check. It is not an application defect.
- `supplemental-results.json`: real XLSX import, formula-neutralizing CSV import, public GitHub access and HTTP redirect probe.
- `local-checks.json`: 82 tests, type checking and production build.
- `dependency-audit-summary.json`: unresolved npm audit findings, including production and development dependencies.
- `secret-scan.json`: scoped scan of locally reachable historical source. No privileged-key matches or committed environment files were detected.
- `downloaded-budget-report.pdf` and `supplemental-import-report.pdf`: actual exported prototype reports.
- `screenshots/`: original captures. Some report images are cropped for readability; content was not fabricated. Figure 9b is explicitly a display of captured API test results rather than an app error screen.
- `video-validation.json`: the demo's measured media duration and resolution.

No real financial data, service-role keys or LLM keys are included. The tests do not constitute a full penetration test or a security certification.
''',encoding='utf-8')

archive=root/'output'/(name+'.zip')
files=sorted(p for p in dest.rglob('*') if p.is_file())
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in files:z.write(p,p.relative_to(dest.parent).as_posix())
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    entries=z.namelist()
    assert not any('/node_modules/' in p or '/.git/' in p or '/dist/' in p for p in entries)
    assert not any(Path(p).name.startswith('.env') and Path(p).name!='.env.example' for p in entries)
    assert (dest/'report/../demo/CostLens_Demo.webm').resolve().is_file()
    assert any('/source/src/App.tsx' in p for p in entries)
validation={'archive':str(archive),'folder':str(dest),'files':len(files),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'archive_integrity':'PASS','secret_env_exclusion':'PASS','expected_categories_present':True}
(root/'output/final-package-validation.json').write_text(json.dumps(validation,indent=2))
print(json.dumps(validation,indent=2))
