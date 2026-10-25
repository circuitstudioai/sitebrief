import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const load=createRequire(import.meta.url);
const {chromium}=load(process.env.PLAYWRIGHT_MODULE_PATH||'playwright-core');
const {PDFDocument}=load(process.env.PDF_LIB_MODULE_PATH||'pdf-lib');
const base=process.argv[2],fixture=process.argv[3];
assert(base,'Pass URL and optional historical run JSON; no fixture means actual browser retrieval.');
const out=process.env.VERIFY_OUTPUT_DIR||'/tmp/sitebrief-release-ui';fs.mkdirSync(out,{recursive:true});
const recorded=fixture?JSON.parse(fs.readFileSync(fixture,'utf8')):null;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 if(recorded)await page.route('**/api/scout',route=>route.fulfill({status:200,contentType:'text/event-stream',body:`data: ${JSON.stringify({type:'complete',value:recorded})}\n\n`}));
 await page.addInitScript(()=>{
  const original=window.fetch;
  window.fetch=async(...args)=>{
   const response=await original(...args);
   if(String(args[0]).endsWith('/api/scout'))window.__releaseScoutBody=response.clone().text();
   return response;
  };
 });
 await page.goto(base,{waitUntil:'networkidle'});
 assert(await page.getByRole('button',{name:'Or try the playground café'}).isVisible());
 const responseWait=page.waitForResponse(response=>response.url().endsWith('/api/scout')&&response.request().method()==='POST',{timeout:175000});
 await page.getByRole('button',{name:'Try Blue Bottle in Toronto'}).click();
 const response=await responseWait;assert.equal(response.status(),200);await page.waitForFunction(()=>Boolean(window.__releaseScoutBody));const raw=await page.evaluate(()=>window.__releaseScoutBody);
 const frames=raw.split('\n\n').filter(frame=>frame.startsWith('data: ')).map(frame=>JSON.parse(frame.slice(6)));
 const run=frames.find(frame=>frame.type==='complete')?.value;assert(run,'Expected completed scenario, not just progress');
 fs.writeFileSync(out+'/run.json',JSON.stringify(run,null,2));
 await page.locator('.atlas-decision').waitFor({timeout:15000});
 const area=run.exploration.areas.find(area=>area.id===run.assessment?.visitFirst);assert(area);
 assert.equal(await page.locator('.atlas-area-card').count(),run.exploration.areas.length);
 assert(await page.getByText('Low confidence · locality not verified').isVisible());
 assert.equal(await page.getByText(/locality verified/i).count(),0);
 assert.equal(await page.locator('.atlas-verdict-label').filter({hasText:/^Scout$/}).count(),0);
 assert(await page.getByRole('heading',{name:'Take these checks on your visit'}).isVisible());
 assert.equal(await page.locator('.atlas-search-suggestions').count(),0);
 const originalTexts=Object.values(run.research).flatMap(report=>[report.text,...(report.fields||[]).filter(field=>field.status==='found').map(field=>field.text)]).filter(Boolean);
 if(originalTexts.length){assert(await page.locator('.atlas-local-notes').isVisible());const notesText=await page.locator('.atlas-local-notes').innerText();for(const text of originalTexts.slice(0,2))assert(notesText.includes(text.slice(0,40)));}
 const pdfWait=page.waitForEvent('download');await page.getByRole('button',{name:'Download one-page expansion brief'}).click();const pdf=await pdfWait;
 const bytes=fs.readFileSync(await pdf.path());assert.equal((await PDFDocument.load(bytes)).getPageCount(),1);
 assert(bytes.includes(Buffer.from(`${area.latitude}, ${area.longitude}`)));
 if(originalTexts.length)assert(bytes.includes(Buffer.from('low confidence')));
 fs.writeFileSync(out+'/brief.pdf',bytes);
 const notesWait=page.waitForEvent('download');await page.getByRole('button',{name:/Download scouting notes/}).click();const notesDownload=await notesWait;
 const notes=fs.readFileSync(await notesDownload.path(),'utf8');assert(notes.includes('ON YOUR VISIT'));assert(notes.match(/low confidence|not verified/i));
 assert(!notes.includes('"practicalEvidence"'));fs.writeFileSync(out+'/notes.txt',notes);
 if(run.savedDemo)assert(await page.getByText(/Saved demo, recorded/).isVisible());
 await page.addScriptTag({path:process.env.AXE_SCRIPT_PATH||load.resolve('axe-core/axe.min.js')});
 const audit=()=>page.evaluate(async()=>{const result=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return result.violations.map(v=>({id:v.id,nodes:v.nodes.map(node=>node.target)}));});
 assert.deepEqual(await audit(),[]);await page.screenshot({path:out+'/desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(await audit(),[]);await page.screenshot({path:out+'/mobile.png',fullPage:true});
 await page.getByLabel('Area popularity').selectOption('50');assert.equal(await page.locator('.atlas-verdict-label').count(),0);assert.deepEqual(errors,[]);
 const receipt={url:base,checkedAt:new Date().toISOString(),mode:recorded?'historical-run replay (not fresh retrieval)':'actual browser request (no response substitution)',saved:Boolean(run.savedDemo),cached:Boolean(run.cached),point:area.id,checks:['Blue Bottle lead and secondary example','unverified local notes with low-confidence label','source inspection and visit checks','PDF and notes keep disclaimer','desktop/mobile accessibility and no overflow','input changes invalidate old result'],pageErrors:errors};
 fs.writeFileSync(out+'/summary.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
}catch(error){await page.screenshot({path:out+'/failure.png',fullPage:true});console.log(JSON.stringify({error:error.message,body:(await page.locator('body').innerText()).slice(-2000)}));throw error;}finally{await browser.close();}
