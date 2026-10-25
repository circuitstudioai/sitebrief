import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright-core');
const {PDFDocument}=require(process.env.PDF_LIB_MODULE_PATH||'pdf-lib');
const base=process.argv[2],fixture=process.argv[3];
assert(base,'Pass URL and optional historical run fixture');
const out=process.env.VERIFY_OUTPUT_DIR||'/tmp/sitebrief-urgent-clarity';fs.mkdirSync(out,{recursive:true});
const baseline=process.env.VERIFY_BASELINE==='1';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 if(fixture){const run=JSON.parse(fs.readFileSync(fixture,'utf8'));await page.route('**/api/scout',r=>r.fulfill({contentType:'text/event-stream',body:`data: ${JSON.stringify({type:'complete',value:run})}\n\n`}));}
 await page.goto(base,{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Try Blue Bottle in Toronto'}).click();
 await page.locator('.atlas-area-card').first().waitFor({timeout:180000});
 await page.locator('.atlas-decision').waitFor({timeout:180000});
 if(!baseline){
  assert.equal(await page.locator('.atlas-verdict-label').filter({hasText:/^Maybe$/}).count(),0);
  assert((await page.locator('.atlas-verdict-label').filter({hasText:/Visit first|Joint first/}).count())>=1);
  assert.equal(await page.getByText('Local evidence unavailable; summary withheld.',{exact:true}).count(),0);
  await page.waitForFunction(()=>document.querySelectorAll('[data-site-id]').length===3);
  assert.deepEqual((await page.locator('.leaflet-tooltip').allTextContents()).sort(),['A','B','C']);
  const cards=page.locator('.atlas-area-card');
  await cards.nth(1).getByRole('button',{name:/Show this area/}).click();
  await page.waitForFunction(()=>document.querySelector('[data-site-id="area-2"]')?.getAttribute('aria-pressed')==='true');
  await page.locator('[data-site-id="area-1"]').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('[data-site-id="area-1"]')?.getAttribute('aria-pressed')==='true');
  const toggle=page.getByRole('button',{name:'Show background scoring points'});await toggle.click();assert.equal(await toggle.getAttribute('aria-pressed'),'true');await toggle.click();
  const pdfWait=page.waitForEvent('download');await page.getByRole('button',{name:'Download visit checklist PDF'}).click();const pdf=await pdfWait;await pdf.saveAs(out+'/visit-plan.pdf');
  const document=await PDFDocument.load(fs.readFileSync(out+'/visit-plan.pdf'));assert(document.getPageCount()>=1);
  const notesWait=page.waitForEvent('download');await page.getByRole('button',{name:/Download.*notes/}).first().click();const notes=await notesWait;await notes.saveAs(out+'/notes.txt');
  const text=fs.readFileSync(out+'/notes.txt','utf8');assert.match(text,/ON YOUR VISIT/);assert.match(text,/not available properties/);assert.match(text,/openstreetmap.org/);assert.doesNotMatch(text,/AGENT VISIT ORDER WITH VERIFIED RANKS|Local evidence unavailable; summary withheld/);
 }
 const states=[];
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1100});await page.locator('.atlas-map-stage').scrollIntoViewIfNeeded();await page.waitForTimeout(350);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(!overflow,`overflow at ${width}`);
  await page.locator('.atlas-map-stage').screenshot({path:`${out}/map-${width}.png`});await page.locator('.atlas-area-grid').screenshot({path:`${out}/cards-${width}.png`});
  await page.addScriptTag({path:process.env.AXE_MODULE_PATH||require.resolve('axe-core/axe.min.js')});
  const axe=await page.evaluate(()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  states.push({width,overflow,violations:axe.violations.map(v=>({id:v.id,nodes:v.nodes.length}))});
  if(!baseline)assert.equal(axe.violations.length,0,JSON.stringify(states.at(-1)));
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/summary.json',JSON.stringify({base,mode:fixture?'historical-run intercepted rendering test':'actual browser provider run',baseline,states,errors},null,2));
 console.log(JSON.stringify({base,mode:fixture?'historical replay':'live',baseline,states,errors}));
}finally{await browser.close();}
