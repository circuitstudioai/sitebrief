import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright-core');
const [base,fixture]=process.argv.slice(2);assert(base&&fixture,'Pass URL and a recorded scouting run. Scout rendering is replay, not provider acceptance.');
const run=JSON.parse(fs.readFileSync(fixture,'utf8'));const out=process.env.VERIFY_OUTPUT_DIR||'/tmp/sitebrief-feature-navigation';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));let scoutCalls=0,comparisonCalls=0;
try{
 await page.route('**/api/scout',r=>{scoutCalls++;return r.fulfill({contentType:'text/event-stream',body:`data: ${JSON.stringify({type:'complete',value:run})}\n\n`});});
 // Permit the real free sample workflow only. This verifier must not send live-provider comparison requests.
 await page.route('**/api/sites',async route=>{assert.equal(route.request().postDataJSON().mode,'sample');comparisonCalls++;await route.continue();});
 await page.goto(base,{waitUntil:'networkidle'});let nav=page.getByRole('navigation',{name:'Sitebrief features'});
 assert.equal(await nav.getByRole('link',{name:'Find areas',exact:true}).getAttribute('aria-current'),'page');
 assert.equal(await nav.getByRole('link',{name:'Compare locations',exact:true}).getAttribute('href'),'/compare');
 assert.equal(await page.getByRole('group',{name:'Map view',exact:true}).count(),0);
 await page.getByRole('button',{name:'Try Blue Bottle in Toronto'}).click();await page.locator('.atlas-area-card').first().waitFor();
 const modes=page.getByRole('group',{name:'Map view',exact:true}),shortlist=modes.getByRole('button',{name:'Shortlist only',exact:true}),scoring=modes.getByRole('button',{name:'Shortlist + scoring points',exact:true});
 assert.equal(await shortlist.getAttribute('aria-pressed'),'true');await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===3);
 await scoring.click();assert.equal(await scoring.getAttribute('aria-pressed'),'true');
 await page.waitForFunction(expected=>document.querySelectorAll('.leaflet-overlay-pane path').length===expected,3+Math.min(4000,run.exploration.cells.length));
 assert.match(await page.locator('.atlas-map-receipt').innerText(),new RegExp(`${Math.min(4000,run.exploration.cells.length).toLocaleString()} of ${run.exploration.cells.length.toLocaleString()}`));
 await scoring.click();assert.equal(await scoring.getAttribute('aria-pressed'),'true');
 await shortlist.focus();await page.keyboard.press('Space');assert.equal(await shortlist.getAttribute('aria-pressed'),'true');
 assert.equal(scoutCalls,1,'Map controls must not submit another scouting request');
 const states=[];
 async function audit(state,width){
  await page.setViewportSize({width,height:1100});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(!overflow,`${state} ${width}`);
  await page.addScriptTag({path:process.env.AXE_MODULE_PATH||require.resolve('axe-core/axe.min.js')});const axe=await page.evaluate(()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));assert.equal(axe.violations.length,0,JSON.stringify(axe.violations.map(v=>v.id)));
  await page.locator('header:visible').screenshot({path:`${out}/${state}-nav-${width}.png`});states.push({state,width,overflow,axeViolations:axe.violations.length});
 }
 for(const width of [1440,1024,768,390]){await audit('find',width);if(width===390||width===1440)await page.locator('.atlas-map-stage').screenshot({path:`${out}/map-${width}.png`});}
 await nav.getByRole('link',{name:'Compare locations',exact:true}).focus();await page.keyboard.press('Enter');await page.waitForURL('**/compare');
 nav=page.getByRole('navigation',{name:'Sitebrief features'});assert.equal(await nav.getByRole('link',{name:'Compare locations',exact:true}).getAttribute('aria-current'),'page');
 const sampleWait=page.waitForResponse(r=>r.url().endsWith('/api/sites')&&r.request().method()==='POST');await page.getByRole('button',{name:'Compare sample locations'}).click();const response=await sampleWait;assert.equal(response.status(),200);const sample=await response.json();assert.equal(sample.mode,'sample');await page.locator('.comparison-grid article').first().waitFor();assert.equal(await page.locator('.comparison-grid article').count(),sample.sites.length);
 for(const width of [1440,1024,768,390])await audit('compare-sample',width);
 await nav.getByRole('link',{name:'Find areas',exact:true}).click();await page.waitForURL(new RegExp('/$'));assert.equal(await page.getByRole('navigation',{name:'Sitebrief features'}).getByRole('link',{name:'Find areas',exact:true}).getAttribute('aria-current'),'page');
 await page.getByRole('button',{name:'Try Blue Bottle in Toronto'}).click();await shortlist.waitFor();assert.equal(await shortlist.getAttribute('aria-pressed'),'true');
 assert.equal(comparisonCalls,1);assert.deepEqual(errors,[]);
 const result={base,mode:'recorded scout replay plus real free sample comparison; no paid provider calls',states,defaultShortlist:true,renderedScoringCap:4000,noScoutingCallsForModeChange:true,comparisonCalls,errors};fs.writeFileSync(out+'/summary.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
