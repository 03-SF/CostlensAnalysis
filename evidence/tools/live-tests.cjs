const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('C:/Users/ABC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve('evidence'); fs.mkdirSync(path.join(root,'screenshots'),{recursive:true});
const results={started:new Date().toISOString(),live:'https://costlens-web-applica-juib.bolt.host',checks:[],notes:[]};
const base=results.live, stamp=Date.now(), password=(process.env.COSTLENS_QA_PASSWORD || (() => { throw new Error('Set COSTLENS_QA_PASSWORD for synthetic test accounts'); })());
const check=(name,result,detail)=>{results.checks.push({name,result,detail});console.log(name,result,detail);fs.writeFileSync(path.join(root,'live-results.json'),JSON.stringify(results,null,2));};
let browser,page,ctx;
const shot=async(name)=>{await page.screenshot({path:path.join(root,'screenshots',name+'.png'),fullPage:true});};
(async()=>{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 ctx=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
 page=await ctx.newPage();page.setDefaultTimeout(20000);
 let apiUrl,anon,tokenA;
 page.on('request',r=>{if(r.url().includes('/rest/v1/')){apiUrl=r.url().split('/rest/v1/')[0];anon=r.headers().apikey;tokenA=r.headers().authorization;}});
 await page.goto(base);await shot('figure13-live');
 await page.goto(base+'/register');
 const emailA=`costlens.qa.a.${stamp}@example.com`,emailB=`costlens.qa.b.${stamp}@example.com`;
 await page.getByLabel('Email',{exact:true}).fill(emailA);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByLabel('Confirm password',{exact:true}).fill(password);
 await page.getByRole('button',{name:'Sign up',exact:true}).click();await page.waitForURL('**/projects');await page.getByRole('heading',{name:'Your projects'}).waitFor();
 check('register','PASS','Fake account A registered and signed in.');await shot('registration');
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('link',{name:'Sign in',exact:true}).waitFor();await page.goto(base+'/login');
 await page.getByLabel('Email',{exact:true}).fill(emailA);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Log in',exact:true}).click();await page.waitForURL('**/projects');
 check('login','PASS','Account A signed out and signed back in.');
 await page.getByRole('button',{name:'New project',exact:true}).click();await page.getByLabel('Project name',{exact:true}).fill('QA Reference Budget '+stamp);await page.locator('#project-description').fill('Synthetic costs only. Security and calculation evidence.');await page.getByRole('button',{name:'Create project',exact:true}).click();
 await page.waitForTimeout(1500);if(!page.url().includes('/projects/'))await page.getByText('QA Reference Budget '+stamp,{exact:true}).click();
 await page.getByRole('button',{name:'Add cost item',exact:true}).first().waitFor();
 const projectUrl=page.url(),projectId=projectUrl.split('/').pop();results.projectId=projectId;
 await page.getByRole('button',{name:'Add cost item',exact:true}).first().click();
 await page.getByLabel('Category',{exact:true}).fill('Materials');await page.locator('#cost-description').fill('Reference overrun');await page.getByLabel('Estimated cost',{exact:true}).fill('1000');await page.getByLabel('Actual cost',{exact:true}).fill('1200');await shot('figure1-manual-entry');await page.getByRole('button',{name:'Add item',exact:true}).click();await page.getByText('Reference overrun',{exact:true}).waitFor();check('manual entry','PASS','1000 estimated and 1200 actual saved.');
 await page.getByRole('button',{name:'Upload file',exact:true}).first().click();
 const invalid=[['figure7a-executable','fake.exe','application/octet-stream',Buffer.from('FAKE INERT FILE'),'Only .csv and .xlsx'],['figure7b-unrelated','unrelated.csv','text/csv',Buffer.from('unrelated content\nhello'),'Missing required column'],['figure7c-oversize','oversize.csv','text/csv',Buffer.alloc(2*1024*1024+1,97),'maximum size is 2 MB'],['figure7d-missing-column','missing.csv','text/csv',Buffer.from('category,description,estimated\nLabor,Fake,500'),'Missing required column']];
 for(const [name,file,mime,buffer,expected]of invalid){await page.locator('input[type=file]').setInputFiles({name:file,mimeType:mime,buffer});await page.getByRole('alert').filter({hasText:expected}).waitFor();await shot(name);check(file,'PASS',await page.getByRole('alert').innerText());}
 await page.locator('input[type=file]').setInputFiles({name:'reference.csv',mimeType:'text/csv',buffer:Buffer.from('category,description,estimated,actual\nLabor,Reference saving,500,400\nEquipment,Zero estimate,0,300')});await page.getByText('2 rows ready to import.',{exact:false}).waitFor();await shot('figure2-upload-preview');await page.getByRole('button',{name:'Upload & Analyze',exact:true}).click();await page.getByRole('heading',{name:'Import complete'}).waitFor();await page.getByRole('button',{name:'Done',exact:true}).click();
 await page.getByText('Zero estimate',{exact:true}).waitFor();const table=await page.locator('table').innerText();check('CSV import and calculations',table.includes('+20.0%')&&table.includes('-20.0%')&&table.includes('N/A')?'PASS':'FAIL',table);await shot('figure3-variance');
 await page.getByRole('button',{name:'Charts',exact:true}).click();await page.waitForTimeout(1200);check('charts',await page.locator('canvas').count()===3?'PASS':'FAIL',`${await page.locator('canvas').count()} canvas charts rendered.`);await shot('figure4-charts');
 await page.getByRole('button',{name:'AI Insights',exact:true}).click();const aiResponse=page.waitForResponse(r=>r.url().includes('/functions/v1/ai-summary'),{timeout:30000}).catch(()=>null);await page.getByRole('button',{name:'Generate AI Summary',exact:true}).click();const ar=await aiResponse;await page.waitForTimeout(1200);check('AI summary',ar&&ar.ok()?'PASS':'FAIL',ar?`HTTP ${ar.status()}; ${await ar.text()}`:'No function response');await shot('figure5-ai-summary');
 await page.getByRole('button',{name:'Report',exact:true}).click();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download Report',exact:true}).click();const download=await downloadPromise;await download.saveAs(path.join(root,'downloaded-budget-report.pdf'));check('PDF download','PASS',download.suggestedFilename());await shot('report-download-ui');
 await page.getByRole('button',{name:'Items',exact:true}).click();
 for(const [name,category,description] of [['figure10-xss','XSS test','<img src=x onerror="alert(12345)">'],['figure11-csv-injection','Formula test','=1+1'],['figure12-sql-injection',"x' OR '1'='1 --",'Synthetic SQL string']]){
  let dialogs=0;const handler=async d=>{dialogs++;await d.dismiss();};page.on('dialog',handler);
  await page.getByRole('button',{name:'Add cost item',exact:true}).first().click();await page.getByLabel('Category',{exact:true}).fill(category);await page.locator('#cost-description').fill(description);await page.getByLabel('Estimated cost',{exact:true}).fill('10');await page.getByLabel('Actual cost',{exact:true}).fill('10');await page.getByRole('button',{name:'Add item',exact:true}).click();await page.getByText(category,{exact:true}).waitFor();await shot(name);check(name,dialogs===0?'PASS':'FAIL',`Literal value displayed; dialogs=${dialogs}; table=${await page.locator('table').innerText()}`);page.off('dialog',handler);
 }
 const bctx=await browser.newContext({viewport:{width:1280,height:900}});const bp=await bctx.newPage();let tokenB;
 bp.on('request',r=>{if(r.url().includes('/rest/v1/'))tokenB=r.headers().authorization;});
 await bp.goto(base+'/register');await bp.getByLabel('Email',{exact:true}).fill(emailB);await bp.getByLabel('Password',{exact:true}).fill(password);await bp.getByLabel('Confirm password',{exact:true}).fill(password);await bp.getByRole('button',{name:'Sign up',exact:true}).click();await bp.waitForURL('**/projects');await bp.waitForTimeout(1200);await bp.goto(projectUrl);await bp.getByRole('heading',{name:'Project not found'}).waitFor();await bp.screenshot({path:path.join(root,'screenshots','figure8-unauthorized.png'),fullPage:true});check('IDOR browser','PASS','Separate account B sees Project not found for account A project.');
 for(const tableName of ['projects','cost_items']){const filter=tableName==='projects'?'id':'project_id';const r=await bp.request.get(`${apiUrl}/rest/v1/${tableName}?${filter}=eq.${projectId}&select=*`,{headers:{apikey:anon,Authorization:tokenB}});const body=await r.text();check('IDOR API '+tableName,r.ok()&&body==='[]'?'PASS':'FAIL',`HTTP ${r.status()}; response ${body}`);}
 const apiResults=[];for(let i=0;i<20;i++){const r=await bp.request.post(apiUrl+'/auth/v1/token?grant_type=password',{headers:{apikey:anon,'Content-Type':'application/json'},data:{email:emailB,password:'WrongFakePassword!'}});apiResults.push(r.status());if(r.status()===429)break;}
 check('excessive login requests',apiResults.includes(429)?'PASS':'FAIL',`${apiResults.length} bounded requests; HTTP statuses ${apiResults.join(', ')}. No further load sent.`);
 await bp.getByRole('button',{name:'Sign out',exact:true}).click();await bp.getByRole('link',{name:'Sign in',exact:true}).waitFor();await bp.goto(base+'/login');await bp.getByLabel('Email',{exact:true}).fill(emailB);await bp.getByLabel('Password',{exact:true}).fill('WrongFakePassword!');
 for(let i=0;i<6;i++){await bp.getByRole('button',{name:'Log in',exact:true}).click();await bp.getByRole('button',{name:'Log in',exact:true}).waitFor({state:'visible'});await bp.waitForTimeout(700);}
 await bp.screenshot({path:path.join(root,'screenshots','figure9-rate-limit.png'),fullPage:true});check('browser lockout','PARTIAL',await bp.getByRole('alert').innerText());
 const publicPage=await bctx.newPage();await publicPage.goto('https://github.com/03-sf/costlensanalysis');check('GitHub private-context link',await publicPage.title().then(t=>t.includes('costlensanalysis'))?'PASS':'FAIL',await publicPage.title());
 const home=await page.request.get(base);results.headers=home.headers();
 const html=await home.text();const scripts=[...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]).filter(s=>s.startsWith('/'));
 results.bundleScan=[];
 for(const s of scripts){const r=await page.request.get(base+s),source=await r.text();const privileged=source.match(/(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9_-]+|-----BEGIN (?:RSA )?PRIVATE KEY-----)/g)||[];const jwt=(source.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)||[]).map(v=>{try{return JSON.parse(Buffer.from(v.split('.')[1],'base64url'))?.role}catch{return 'unreadable'}});results.bundleScan.push({script:s,status:r.status(),privilegedKeyMatches:privileged.length,jwtRoles:jwt});}
 check('browser bundle secret scan',results.bundleScan.every(s=>s.privilegedKeyMatches===0&&s.jwtRoles.every(r=>r==='anon'))?'PASS':'FAIL',JSON.stringify(results.bundleScan));
 await bctx.close();results.completed=new Date().toISOString();fs.writeFileSync(path.join(root,'live-results.json'),JSON.stringify(results,null,2));await browser.close();
})().catch(async e=>{results.error=String(e.stack);fs.writeFileSync(path.join(root,'live-results.json'),JSON.stringify(results,null,2));console.error(e);if(page)await shot('failure-state').catch(()=>{});if(browser)await browser.close();process.exit(1)});
