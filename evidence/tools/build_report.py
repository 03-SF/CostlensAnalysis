"""Rebuild the evidence report. Run with the bundled Python runtime."""
from pathlib import Path
import json, re
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon
from PIL import Image as PILImage

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/pdf'; OUT.mkdir(parents=True,exist_ok=True)
E=ROOT/'evidence'; S=E/'screenshots'
LIVE='https://costlens-web-applica-juib.bolt.host'
GIT='https://github.com/03-SF/CostlensAnalysis'
meta=json.loads((E/'report-metadata.json').read_text()) if (E/'report-metadata.json').exists() else {}
NAME=meta.get('name','Student name not supplied')
COURSE=meta.get('course','Course name not supplied')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyCL',fontName='Helvetica',fontSize=9.5,leading=14,spaceAfter=8,textColor=colors.HexColor('#25313d')))
styles.add(ParagraphStyle(name='SmallCL',parent=styles['BodyCL'],fontSize=8,leading=11,spaceAfter=5))
styles.add(ParagraphStyle(name='CaptionCL',parent=styles['SmallCL'],fontName='Helvetica-Bold',spaceBefore=5,spaceAfter=12))
styles.add(ParagraphStyle(name='TitleCL',fontName='Helvetica-Bold',fontSize=30,leading=36,textColor=colors.HexColor('#102a43'),spaceAfter=20))
styles['Heading1'].textColor=colors.HexColor('#102a43'); styles['Heading1'].fontSize=19;styles['Heading1'].leading=24
styles['Heading2'].fontSize=12;styles['Heading2'].leading=16;styles['Heading2'].textColor=colors.HexColor('#9b4209')
story=[]
def p(t,style='BodyCL'): return Paragraph(t,styles[style])
def text(t): story.append(p(t))
def h(t): story.append(Paragraph(t,styles['Heading1']))
def sub(t): story.append(Paragraph(t,styles['Heading2']))
def page(title):
    if story: story.append(PageBreak())
    h(title)
def table(headers,rows,widths):
    content=[[p(escape(str(v)),'SmallCL') for v in row] for row in [headers]+rows]
    t=Table(content,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e7edf2')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,0),0.8,colors.HexColor('#9eacba')),('LINEBELOW',(0,1),(-1,-1),0.35,colors.HexColor('#d7dfe5')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f7f9fa')])]))
    story.extend([t,Spacer(1,10)])
def figure(file,caption,maxh=295):
    path=S/file
    if not path.exists(): raise FileNotFoundError(path)
    # Crop only the surrounding browser whitespace; the original captures remain unchanged.
    if file.startswith(('figure1-manual','figure2-upload','figure7')):
        with PILImage.open(path) as source:
            im=source.convert('RGB'); white=[y for y in range(100,min(im.height,820)) if min(im.getpixel((400,y)))>245]
            if white:
                top,bottom=min(white),max(white)+1
                if file.startswith('figure7'):bottom=min(bottom,top+220)
                im=im.crop((390,max(0,top-3),890,min(im.height,bottom+3)))
                cropped=ROOT/'tmp/pdfs'/('crop-'+file);cropped.parent.mkdir(parents=True,exist_ok=True);im.save(cropped);path=cropped
    regions={
        'figure3-variance.png':(80,398,1200,904),
        'figure4-charts.png':(80,492,1200,1255),
        'figure5-ai-summary.png':(80,400,1200,926),
        'figure9-rate-limit.png':(420,95,860,310),
        'figure11b-formula-import.png':(80,275,1200,715),
        'direct-test-evidence.png':(55,150,1225,480),
    }
    if file in regions:
        with PILImage.open(path) as im:
            im=im.crop(regions[file]);cropped=ROOT/'tmp/pdfs'/('crop-'+file);cropped.parent.mkdir(parents=True,exist_ok=True);im.save(cropped);path=cropped
    with PILImage.open(path) as im: w,h=im.size
    scale=min(475/w,maxh/h)
    story.append(KeepTogether([Image(str(path),width=w*scale,height=h*scale),p(caption,'CaptionCL')]))
def link(url,label=None): return f'<link href="{escape(url)}" color="#1f5d89">{escape(label or url)}</link>'
def architecture():
    d=Drawing(475,210)
    def box(x,y,w,hh,title,lines):
        d.add(Rect(x,y,w,hh,rx=6,fillColor=colors.HexColor('#eef3f6'),strokeColor=colors.HexColor('#a9bbc8')))
        d.add(String(x+10,y+hh-20,title,fontName='Helvetica-Bold',fontSize=10,fillColor=colors.HexColor('#102a43')))
        for i,line in enumerate(lines): d.add(String(x+10,y+hh-36-i*13,line,fontSize=8,fillColor=colors.HexColor('#25313d')))
    def arrow(x1,y1,x2,y2):
        d.add(Line(x1,y1,x2,y2,strokeColor=colors.HexColor('#bb560b'),strokeWidth=1.4))
        d.add(Polygon([x2,y2,x2-5,y2+3,x2-5,y2-3],fillColor=colors.HexColor('#bb560b'),strokeColor=None))
    box(0,115,210,85,'Browser / React application',['CSV + XLSX parse and validation','Variance, 3 charts, PDF generation','Supabase bearer session token'])
    box(265,115,210,85,'Supabase',['Auth: email and password','PostgreSQL: projects + cost_items','RLS: ownership enforced in database'])
    box(0,5,210,75,'bolt.host / HTTPS',['Serves Vite static build','Public anon key is bundled','HSTS observed in live response'])
    box(265,5,210,75,'Summary Edge Function',['Receives totals + names/categories','Live result: source = rules','Optional external LLM via server secret'])
    arrow(210,160,265,160);arrow(105,80,105,115);arrow(210,130,265,50)
    d.add(String(214,173,'HTTPS',fontSize=7));d.add(String(214,87,'POST + JWT',fontSize=7))
    return d

story.extend([Spacer(1,50),p('CostLens','TitleCL'),p('See where your budget really goes.','Heading2'),Spacer(1,20),p('Cost Analysis Web Application<br/>with Cybersecurity Analysis','TitleCL'),p('Development, security testing, deployment and reflection','BodyCL'),Spacer(1,25)])
table(['Submission detail','Value'],[['Submitted by',NAME],['Roll number','FA23-BSE-091'],['Course',COURSE],['Date','14 November 2026'],['Edition','Evidence verified against the live prototype; unresolved controls disclosed']],[130,345])
text('Live prototype: '+link(LIVE));text('Source code: '+link(GIT))
text('This edition records real test observations. It does not claim that every security control passed. Student identity, course title and instructor-specific submission details still require confirmation.' if not meta.get('name') or not meta.get('course') else 'This edition records real test observations and separates implemented controls from unresolved work.')

page('1. Introduction and system design')
text('Author: '+escape(NAME)+' | Course: '+escape(COURSE))
text('CostLens helps a manager compare estimated and actual spending without repeatedly rebuilding spreadsheet formulas, charts and narrative reports. Users create private projects, enter costs manually or import CSV/XLSX data, review variance and charts, generate a budget summary, and download a PDF.')
text('The report covers development, cybersecurity analysis, deployment and reflection. Evidence was collected from the student-supplied public prototype on 14 November 2026 in Pakistan time. All test records and accounts used synthetic data. Local automated checks are identified separately from live browser and API tests.')
sub('2.1 Architecture and trust boundaries')
story.append(architecture());story.append(Spacer(1,12))
text('The browser performs parsing, calculations, chart rendering and PDF creation. Files are parsed locally; the application inserts validated rows into PostgreSQL rather than storing the uploaded workbook as a public file. Supabase provides authentication and database APIs. Database row level security (RLS) is the principal ownership boundary.')
text('The browser sends project totals and category aggregates to an Edge Function using its authenticated session. The function can call an external LLM if a server-side AI_API_KEY is configured; otherwise it uses a deterministic rules summary. The live response used the rules path. No statistical anomaly detector was found in this checkout.')

page('2.2 Technology stack and data model')
table(['Layer','Verified implementation'],[['UI','React 18, TypeScript, Vite 5, Bootstrap 5 and custom CSS. No Tailwind dependency.'],['Charts','Chart.js and react-chartjs-2: grouped bar, actual-spend doughnut, and percentage-variance chart.'],['Auth and database','Supabase Auth and PostgreSQL; owner-scoped RLS migrations for projects and cost_items.'],['Import','Papa Parse for CSV; SheetJS xlsx 0.18.5 for XLSX. Browser-side parsing.'],['PDF export','jsPDF and jsPDF-AutoTable; summary metrics, cost table and optional generated summary. Charts are not embedded.'],['Summary','Supabase Edge Function; optional gpt-4o-mini call, with rules fallback. Live test returned source = rules.'],['Hosting','Public static app on bolt.host; HTTPS and HSTS observed.']],[108,367])
sub('2.3 Stored entities')
table(['Entity','Fields and ownership'],[['User','Supabase-managed id, email and authentication credentials. Password hashing is delegated to Auth; server configuration was not inspected.'],['Project','id, owner_id, name, description, created_at. Owner must match auth.uid().'],['Cost item','id, project_id, category, description, estimated_cost, actual_cost, created_at. Access derives from parent ownership.']],[108,367])
text('Cost fields are numeric(14,2) with non-negative database constraints. The migrations also constrain text lengths, revoke anonymous table access, and define SELECT, INSERT, UPDATE and DELETE ownership policies. Variances are calculated when displayed rather than stored.')

page('2.4 Calculation rules and feature coverage')
text('<b>Variance = actual - estimated.</b> Percentage variance = (actual - estimated) / estimated x 100; a zero estimate displays N/A. Positive variance is an overrun and negative variance is a saving. Totals use total actual and total estimated, rather than averaging row percentages.')
table(['Estimated','Actual','Expected variance','Expected %','Live result'],[['1,000','1,200','+200','+20.0%','Matched'],['500','400','-100','-20.0%','Matched'],['0','300','+300','N/A','Matched'],['1,500 total','1,900 total','+400','+26.7%','Matched']],[75,85,115,100,100])
text('Figure 3 contains these exact three rows and totals. Local calculation tests also passed. The live comparison preceded the optional security payload rows, so the reference totals remain reproducible.')
sub('3. Features - assignment items 1 to 5')
table(['Item','Actual behavior','Evidence'],[['1','Manual add/edit/delete, CSV import and a successful real XLSX import.','Figures 1-2; supplemental log; demo'],['2','Per-item, category and overall variance; zero-estimate handling.','Figure 3'],['3','Three charts, including the two required comparisons.','Figure 4'],['4','Generated budget-rules summary verified. External LLM path exists but was not observed; statistical outliers are future work.','Figure 5'],['5','Downloadable PDF with totals, cost items and the summary generated in that page session.','Figure 6']],[35,340,100])

page('3. Data entry and import evidence')
figure('figure1-manual-entry.png','Figure 1. Live manual entry form with the 1,000 / 1,200 reference case.',240)
figure('figure2-upload-preview.png','Figure 2. Live CSV preview of the saving and zero-estimate reference rows.',240)
text('Import requires category, description, estimated and actual columns. The UI applies a 2 MiB size cap, a 5,000-row limit, an extension allow-list, limited signature checks, and row-level numeric/text validation. These are browser checks; database constraints and RLS remain necessary when clients bypass the UI.')

page('3. Calculation and chart evidence')
figure('figure3-variance.png','Figure 3. Live reference calculations, including +200 / +20.0%, -100 / -20.0%, and +300 / N/A.',260)
figure('figure4-charts.png','Figure 4. Live grouped bar, actual-share doughnut and percentage-variance charts.',335)

page('3.1 Summary feature and AI honesty')
figure('figure5-ai-summary.png','Figure 5. The live summary explicitly identifies its output as generated from budget rules.',330)
text('The live Edge Function returned HTTP 200 with source = rules. Its narrative correctly reported estimated 1,500.00, actual 1,900.00 and an overrun of 400.00 (+26.7%). It identified Equipment as the largest overage and Labor as the largest saving.')
text('This observation establishes deterministic summary generation, not successful use of an external LLM. The source contains an optional OpenAI request and rules fallback, but a rules result cannot distinguish an absent key from a provider error. The presence or value of server-side secrets was not inspected.')
text('The draft claim of z-score/IQR anomaly detection was removed: no such detector is implemented. Category names and the project name are sent along with aggregated figures; descriptions and emails are omitted by the current payload builder. Names can still carry sensitive information or prompt-like text, so aggregation alone does not remove privacy or prompt-injection risk.')
text('Future work: implement and test outlier detection, label its method and small-sample limits, add timeouts and quotas to the summary endpoint, validate the complete input schema, and require human review of generated recommendations.')

page('3.2 Downloaded report and interface')
figure('figure6-downloaded-report.png','Figure 6. First page rendered from the PDF downloaded from the live application.',465)
text('The download succeeded and was reopened for content inspection. It contains project totals, the three cost rows and the generated summary. The current exporter does not embed chart images or anomaly findings. These omissions are listed as future work rather than claimed as completed features.')
text('The responsive UI uses white and dark surfaces with accent actions. Variance uses direction symbols and numeric text. The demo additionally exercises editing and deleting a temporary cost item. Automated chart detection confirms canvas rendering; Figure 4 provides the visual check.')

page('4. Cybersecurity analysis')
sub('4.1 Assets, actors and attack surface')
text('Primary assets are financial records and account sessions; availability and possible LLM credits also matter. Relevant attackers include a registered user seeking another owner\'s project, a bot attempting account takeover, and an uploader trying to exploit a parser. Entry points include Auth, project/item APIs, imported text and workbooks, summary input and rendered output.')
sub('4.2 Threats, scenarios and mitigations - part 1')
table(['Threat','Scenario','Mitigation and actual status'],[['1. Malicious upload','An attacker supplies an executable, invalid workbook or resource-heavy file to compromise the parser or freeze the browser.','Partial. Extension/size/row checks and parse-only handling exist. Four invalid-file tests passed. ZIP magic is not full validation; the SheetJS audit has high findings.'],['2. Formula injection','A formula-like description is later opened as a spreadsheet formula.','Partial. Import sanitization prefixes dangerous formula starts. Manual entry keeps =1+1 literally; current PDF is not a spreadsheet. A future CSV/XLSX exporter must escape formulas independently.'],['3. IDOR / broken access control','Account B changes a URL or API filter to request account A\'s budget.','Verified for read isolation. RLS policies exist; B saw Project not found and both project/item API reads returned an empty array. Write policies were inspected but not comprehensively attack-tested.'],['4. SQL injection','An attacker submits SQL syntax in a category or numeric input to alter database queries.','Observed text safety. Supabase client query methods avoid constructing raw SQL. SQL text was saved literally and the project remained readable; this is a limited test, not proof of every query.'],['5. XSS','An imported or manually entered HTML event handler executes when a user views a row.','Partial defense. React text rendering showed the payload literally with no alert. Meta CSP exists, but framing directives in meta are ignored and required HTTP headers were absent.']],[92,155,228])

page('4. Threat analysis and prioritisation')
table(['Threat','Scenario','Mitigation and actual status'],[['6. Brute force / account takeover','A bot tries leaked passwords until it obtains the owner\'s session.','Partial. UI password rules and a sessionStorage lockout exist. Direct Auth requests bypassed the UI; 20 attempts were not rate-limited. Configure Auth/server enforcement and MFA.'],['7. Excessive requests','Repeated login, database or summary requests exhaust resources or LLM credits.','Failed bounded login check. Browser locks after five failed attempts, but 20 direct requests returned 400 rather than 429. Upload and summary server quotas were not verified.'],['8. Session theft / CSRF','Malicious script steals the browser token; a hostile page attempts state changes.','Partial. HTTPS and explicit bearer authentication reduce classic ambient-cookie CSRF exposure. Supabase persists the browser session; HttpOnly cookie protection must not be claimed. XSS can expose the token.'],['9. Prompt injection / disclosure','A project or category name includes instructions, or confidential names leave the app through an optional LLM call.','Partial. Payload excludes cost descriptions and email but includes names and aggregates. AI key is read from a server variable. Deployed provider configuration and prompt defenses are unverified.']],[92,155,228])
sub('4.3 Top three threats and justification')
table(['Priority','Likelihood x impact','Reason'],[['1. IDOR','4 x 5 = 20','A cheap identifier change could expose confidential financial records across accounts. Database ownership is therefore a critical boundary; live read isolation passed.'],['2. Account takeover','4 x 5 = 20','A valid stolen session grants access to the victim\'s projects. The failed direct-request test leaves a concrete gap despite the UI lockout.'],['3. Malicious upload','4 x 4 = 16','The app deliberately parses untrusted files and the XLSX dependency has known advisories. Local parsing lowers server execution risk but leaves browser and data-integrity risks.']],[112,95,268])
text('Scores are qualitative judgments on a 1-5 scale. The tie places IDOR first because it crosses account boundaries directly. Threat ranking is updated from the original draft to reflect the observed request-limiting failure and the dependency audit.')

page('5. Security checklist - verified and partial')
text('Status is based on the evidence named below. Partial means some protection exists but the complete checklist claim is not supported. No deployment-only setting is marked verified from source code alone.')
table(['Control','Status','Evidence and qualification'],[['Friendly errors; production debug disabled','Partial','Production bundle built; Auth and project pages use friendly errors. Edge Function can return caught error messages; all error paths were not tested.'],['Secrets absent from source and history','Verified scope','Pattern scan: two locally reachable revisions, 118 file versions, no matches and no committed env files. Live bundle had only anon-role JWT matches.'],['HTTPS and redirect','Partial','HTTPS and HSTS observed. HTTP probe returned 200 with no Location header; a redirect was not established. No second device was used.'],['Secure session storage / cookies','Partial','Supabase bearer session. Browser persistence is configured; HttpOnly/SameSite cookie claims are not applicable to this design.'],['Password handling and policy','Partial','UI requires length 10 plus upper/lower/number/symbol; Auth handles credentials. Server-side password policy and hashing configuration not independently inspected.'],['CSRF protection','Partial','API mutations require explicitly attached bearer tokens. No dedicated CSRF middleware or full cross-origin attack test was verified.'],['Authorization on project and item operations','Partial','Live two-account read isolation passed; all four CRUD policies exist in migrations. Mutation matrix and report cross-account behavior require broader tests.'],['Upload checks','Verified UI scope','Executable, unrelated CSV, oversize CSV and missing-column CSV rejected with messages. Signature checks are limited; browser checks can be bypassed.']],[140,73,262])

page('5. Security checklist - remaining controls')
table(['Control','Status','Evidence and qualification'],[['Login, upload and summary rate limits','Failed / unverified','20 direct invalid login requests produced no 429. UI lockout passed. Upload and summary endpoint quotas were not established.'],['Security response headers','Partial','HSTS present. The captured response lacked CSP, X-Frame-Options, X-Content-Type-Options and Referrer-Policy headers. Meta-only framing directives do not work.'],['Dependencies updated and scanned','Scanned; unresolved','npm audit reported 7 affected packages: 2 critical, 2 high, 3 moderate. Findings include development tooling and production xlsx; no audit-clean claim is made.'],['Server validation and output escaping','Partial','PostgreSQL numeric/text constraints and RLS; React text rendering verified with XSS payload. Edge Function validates only part of the submitted schema.'],['Safe logging and monitoring','Not verified','No production audit-log review, retention policy or alert test was available.'],['Database privacy and backups','Partial','Anonymous access revoked in migrations and cross-user reads blocked live. Backup configuration and restore drills were not inspected.'],['No privileged demo accounts','Not fully verified','QA accounts contain synthetic data only. Global account inventory and removal of test accounts require project-owner administration.']],[140,73,262])
sub('Local assurance')
text('All 82 tests across six suites passed. TypeScript type checking passed and Vite produced a production build. These checks support calculations, validation, sanitization and UI lockout logic. They do not replace the separate live tests or prove that local changes have been deployed.')
text('Repository hygiene changes in this checkout add setup/run/deployment instructions and broaden env-file exclusions while keeping the blank example file. The original history contains an import commit; it was not rewritten to imply a longer development history. No push or redeployment is claimed.')

page('6. Security test 1 - invalid upload')
text('<b>Objective:</b> reject invalid cost files without importing data. <b>Scope:</b> live upload dialog, synthetic project, four inert files. Each input produced the expected error; no import was confirmed.')
for file,cap in [('figure7a-executable.png','Figure 7a. fake.exe rejected: only CSV and XLSX are accepted.'),('figure7b-unrelated.png','Figure 7b. Unrelated text renamed CSV rejected for missing category.'),('figure7c-oversize.png','Figure 7c. A 2 MiB + 1 byte CSV rejected by the size cap.'),('figure7d-missing-column.png','Figure 7d. CSV missing actual rejected with a column-specific error.')]:figure(file,cap,122)
text('<b>Outcome: PASS for these four cases.</b> No fix was required for them. This does not establish full workbook validation, malware scanning or protection against all parser resource-exhaustion inputs.')

page('6. Security test 2 - unauthorized access')
text('<b>Method:</b> register separate fake accounts A and B in separate browser contexts. A creates the reference project. B navigates directly to A\'s project URL, then sends authenticated REST reads filtering that project id on both tables.')
figure('figure8-unauthorized.png','Figure 8. Account B cannot open the project owned by account A.',330)
table(['Request as B','Actual result','Assessment'],[['Project URL','Project not found; no owner data displayed','PASS'],['REST projects filtered by A\'s id','HTTP 200; empty JSON array','PASS'],['REST cost_items filtered by A\'s project id','HTTP 200; empty JSON array','PASS']],[240,155,80])
text('A policy-filtered collection may legitimately return HTTP 200 and an empty array rather than 403/404. The security property is that another owner\'s records are absent. UUID validation alone would not establish this property; the live two-account API checks do.')
text('<b>Outcome: PASS for cross-account reads.</b> No fix was required for these requests. Full unauthorized insert/update/delete and relationship reassignment tests remain future assurance work.')

page('6. Security test 3 - excessive requests')
text('<b>Method:</b> send at most 20 wrong-password requests for fake account B directly to the deployed Auth token endpoint. Stop early on HTTP 429. Separately submit six failed login attempts through the UI.')
table(['Path','Expected','Actual','Outcome'],[['Direct Auth API','Rate rejection such as HTTP 429','All 20 returned HTTP 400; no 429','FAIL within this test budget'],['Browser login form','Lockout after five failures','About 15 minutes wait message; sixth submission blocked by UI','PASS for UI only']],[103,113,164,95])
figure('figure9-rate-limit.png','Figure 9a. Browser lockout works, but does not enforce a server-side request limit.',155)
figure('direct-test-evidence.png','Figure 9b. Captured API results displayed as an evidence sheet, not an app error screen.',155)
text('<b>Unresolved failure:</b> the report must not equate a local lockout with server-side abuse prevention. The bounded result does not prove the service has no higher threshold; it shows that the tested 20-request expectation was not met.')
text('<b>Required fix and retest:</b> configure Supabase Auth/server rate limits and CAPTCHA as appropriate, add independently enforced database/summary quotas, then repeat the bounded direct test in fresh contexts. Administrative deployment access was not available, so no server fix or successful retest is claimed. The failure evidence is retained in evidence/live-results.json.')

page('6. Optional injection tests')
figure('figure10-xss.png','Figure 10. An HTML event-handler payload is displayed as literal text; no alert executed.',225)
figure('figure11b-formula-import.png','Figure 11. Live CSV import stores a formula-like string with a leading apostrophe.',225)
text('<b>XSS:</b> the payload was rendered as text with zero browser dialogs observed. This supports the tested React text path only. A broader stored/reflected XSS review remains necessary.')
text('<b>Formula injection:</b> a supplemental live CSV import converted =1+1 to a string with a leading apostrophe, as Figure 11 shows. The downloaded supplemental PDF also preserves this as text. Manual entry retained =1+1 literally. Any future spreadsheet exporter must independently escape cells at export; browser display and PDF safety do not establish CSV/XLSX export safety.')

page('6. SQL injection and evidence limits')
figure('figure12-sql-injection.png','Figure 12. SQL-like category text is stored and displayed literally; the cost table remains available.',300)
text('<b>Method:</b> save a category containing x\' OR \'1\'=\'1 -- with numeric costs of 10 and 10. <b>Actual:</b> the row was stored as ordinary text, no dialog executed, and the existing project rows remained readable. The validation tests also reject SQL text in numeric fields.')
text('<b>Outcome:</b> PASS for the tested text path. Neither literal display nor a client validation unit test proves every database query is injection-safe. The source uses Supabase query methods rather than concatenated SQL; RLS and database constraints provide separate boundaries.')
sub('Dependency and secrets findings')
text('The dependency audit reported seven affected packages, including high-severity SheetJS xlsx findings for prototype pollution and regular-expression denial of service, and critical development-tool findings involving Vitest/tinypool. These are advisory findings, not evidence that this deployment was exploited. Dependency remediation and a rebuilt/retested deployment are future work.')
text('A pattern scan of all locally reachable Git revisions found no private-key, OpenAI-key, Supabase-secret, GitHub-token or non-anon JWT matches and no committed .env files. The deployed script was also fetched and searched: only an anon-role Supabase JWT was detected. This is a scoped scan, not a guarantee that every possible secret format is absent. Test account passwords and sessions are not presented as production secrets.')

page('7. Deployment and live smoke testing')
figure('figure13-live.png','Figure 13. The public live prototype served successfully over HTTPS.',290)
text('The source uses npm run build (TypeScript plus Vite), publishes dist, and requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at build time. SQL migrations provide the database schema and RLS; the ai-summary Edge Function is separately deployed with JWT verification requested by config. The historical deployment workflow and dashboard settings were not independently inspected.')
text('Live smoke tests passed for registration, sign-out/sign-in, project creation, manual entry, CSV preview/import, reference calculations, three charts, rules summary and PDF download. The 3-minute-10-second silent demo additionally exercises temporary item editing and deletion. A supplemental live XLSX import passed with estimated 100 and actual 120.')
text('A fresh browser context accessed the public GitHub repository without a signed-in GitHub session and received HTTP 200. The initial script classified its mixed-case title incorrectly; the supplemental assertion corrected that test error. The HTTP-only probe returned 200 without a Location header, so HTTP-to-HTTPS redirection was not established. No second physical device was available.')
text('The captured response includes HSTS. Framing and content-security headers cannot be established by HTML meta directives. Administrative access is needed to configure server headers, quotas, backups and monitoring and to redeploy changes from this checkout.')

page('8. Implemented controls and future work')
table(['Area','Implemented / observed','Future work'],[['Authentication','Supabase email/password flow; UI password rules and sessionStorage lockout.','Enforce server password/abuse policy; MFA; account alerts; remove QA accounts administratively.'],['Authorization','Owner-scoped migrations; cross-account URL and API reads blocked live.','Full CRUD attack matrix; sharing roles and audit trail.'],['Upload','Browser type/size/content/row checks; import sanitization; four rejection tests passed.','Patch/replace XLSX parser, validate malformed archives robustly, resource limits and fuzzing.'],['Abuse prevention','UI lockout; bounded direct login test recorded honestly as failed.','Server-enforced Auth and API quotas; CAPTCHA; summary spend caps and timeout.'],['Transport / browser','HTTPS and HSTS observed; React text escaping on tested path.','Effective HTTP CSP, framing, nosniff, referrer and permissions policies.'],['Secrets / data','No detected secrets in reachable history; anon key in browser; RLS read isolation.','Automated secret scan/rotation, tested backups, restore drills and retention policy.'],['Monitoring / assurance','82 local tests pass; live screenshot/API evidence captured.','Audit logs, alerts, dependency remediation, CI and independent security review.'],['Analysis / export','Variance, three charts, rules summary, table-based PDF.','Real anomaly detection; verified external LLM path if required; chart images in exports.']],[88,183,204])
text('Future work entries are not implemented-control claims. No changes in this checkout have been represented as already deployed to bolt.host.')

page('9. Reflection, limitations and conclusion')
text('CostLens reduces repeated spreadsheet work by computing variance consistently, updating category charts from stored rows and exporting a report. The live rules summary is reproducible and readable, but does not infer causes, detect fraud or demonstrate a trained model. Item 4 of the supplied assignment requires an AI feature. The code includes an optional external LLM path, but only the rules fallback was observed live; this requirement is therefore partially verified rather than claimed as fully demonstrated.')
text('An external LLM could help describe complex patterns but introduces privacy, prompt-injection, latency and cost risks. Aggregates and names still need review before transmission; generated advice needs human verification. A statistical outlier detector would add a different capability and should explain its thresholds and small-sample limits.')
sub('10. Limitations')
text('The prototype accepts at most 2 MiB and 5,000 rows through its UI, treats amounts as a single unlabeled currency, and has no verified team sharing, audit trail, backup drill or full server abuse controls. The report export omits charts, and the summary must be generated in the current page session to be included. Statistical anomaly detection is future work.')
text('Security evidence covers a bounded set of fake-data tests. Cross-account mutations, higher-volume denial-of-service testing, server administrative settings and every XSS/injection path were not tested. No unauthorized or real customer records were used. This report was checked against the complete 14-item assignment brief supplied by the student. Items 1-3 and 5-14 have supporting evidence; item 4 remains partially verified. Item 11 requires tests to be demonstrated, and a failed security control is documented honestly rather than marked as passing.')
sub('11. Conclusion')
text('The prototype successfully demonstrated cost input/import, the required calculations, multiple charts, a rules-based narrative and PDF download. Invalid upload rejection and two-account read isolation passed. Direct login rate limiting failed the bounded 20-request test, while browser lockout worked. These results support a useful working prototype with clearly documented security and AI limitations, rather than an unsupported claim of production readiness.')

page('Appendix A. Evidence and assignment mapping')
table(['Figures','Evidence'],[['1-2','Manual entry and CSV upload preview.'],['3-4','Reference variance figures and three charts.'],['5-6','Rules summary and rendered downloaded application PDF.'],['7a-7d','Executable, unrelated CSV, oversize CSV and missing-column rejection.'],['8-9','Two-account unauthorized read and browser lockout. Direct-request failure is in the test log.'],['10-12','Literal XSS, formula and SQL payload observations.'],['13','Live prototype over HTTPS. Deployment dashboard was not available.']],[85,390])
table(['Assignment items','Coverage and qualification'],[['1-3 and 5: development','Covered: entry and CSV/XLSX upload, calculations, three charts and PDF results. Section 3; Figures 1-4 and 6.'],['4: AI feature','Partially verified: optional LLM code exists but the live summary used rules. Figure 5. A successful external-AI response or a demonstrated anomaly detector is still needed for strong evidence.'],['6-8: threats/scenarios/mitigations','Covered: section 4 gives nine threats with realistic scenarios, mitigations and evidence-qualified status.'],['9: top three','Covered: section 4.3 ranks IDOR, account takeover and malicious upload with scores and justification.'],['10: security checklist','Covered: section 5 distinguishes verified, partial, failed and unverified controls.'],['11: three security tests','Covered as a demonstration: all three tests are documented, including the request-limiting failure. The brief does not require all tests to pass.'],['12-14: deployment, controls, reflection','Covered: sections 7-10 address live hosting, implemented/future controls and AI workflow benefits and limitations.'],['Expected submission','Source code, live prototype and 3:10 demo, screenshots, standalone threat table and this report are included in the submission ZIP. The deadline was not supplied.']],[145,330])

page('Appendix B. Links and handover')
text('Live prototype: '+link(LIVE));text('Source code: '+link(GIT))
text('Backup demo: '+link('../demo/CostLens_Demo.webm','CostLens_Demo.webm (local companion file)'))
text('The 3-minute-10-second demo is a silent live browser recording supplied as a companion file. In the submission package, keep the report and demo folders together so the relative video link can resolve. The supplied brief accepts a working prototype or demonstration; it does not require a public video-hosting link.')
text('Evidence: original screenshots are in evidence/screenshots; live checks and HTTP statuses are in evidence/live-results.json; the reachable-history scan is in evidence/secret-scan.json; the application export is evidence/downloaded-budget-report.pdf. Supplemental results are in evidence/supplemental-results.json when available. These companion files preserve the basis for the report\'s claims.')
text('Some screenshot margins are cropped for legibility. The original captures are retained unchanged alongside the report.')
text('Author: '+escape(NAME)+'. Course: '+escape(COURSE)+'. The student supplied the author and course details. Roll number FA23-BSE-091 was copied from the supplied cover.')
sub('Remaining submission actions')
text('Demonstrate the AI feature live before claiming every requirement is fully verified. Configure and retest server abuse controls and resolve dependency advisories before marking those controls complete. Confirm the portal deadline and any upload-size restrictions, and retain the submission ZIP as a backup.')
text('The package follows the expected submission list in the supplied assignment. No deadline or portal size limit was supplied. Fresh private browser contexts were used for link checks; a different physical device was not available. The PDF was reopened, checked for unresolved square-bracket placeholders and rendered for visual review before delivery.')

def footer(c,doc):
    if doc.page==1:return
    c.saveState();c.setStrokeColor(colors.HexColor('#dce4eb'));c.line(42,40,553,40);c.setFont('Helvetica',7);c.setFillColor(colors.HexColor('#586b7a'));c.drawString(42,28,'CostLens | Security evidence report | 14 November 2026');c.drawRightString(553,28,str(doc.page));c.restoreState()
doc=SimpleDocTemplate(str(OUT/'CostLens_Report_Final.pdf'),pagesize=(595.276,841.89),rightMargin=60,leftMargin=60,topMargin=48,bottomMargin=55,title='CostLens - Development and Cybersecurity Evidence Report',author=NAME)
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT/'CostLens_Report_Final.pdf')
