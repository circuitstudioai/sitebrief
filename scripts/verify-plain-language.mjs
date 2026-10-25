import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright-core');
const [base,fixture]=process.argv.slice(2);assert(base&&fixture,'Pass URL and a recorded scouting run');
const original=JSON.parse(fs.readFileSync(fixture,'utf8'));const run=structuredClone(original);
// Explicit synthetic variants exercise display branches, not provider or demographic acceptance.
run.exploration.areas=run.exploration.areas.map((a,i)=>({...a,contrast:60-i*.2}));run.exploration.allTied=false;
run.exploration.screeningExamples=[{reason:'popularity',point:{...run.exploration.areas[0],popularityPercentile:10}},{reason:'taste',point:{...run.exploration.areas[1],popularityPercentile:55,audiencePercentile:60}}];
run.exploration.popularityRejectedCount=2;
run.profile={tags:[{name:'Coffee',affinity:.4}],ageSignals:[{referenceId:'test-reference',referenceName:'Example reference',bands:[{name:'25_34',score:1.25},{name:'45_54',score:-.25}]}],relatedBrands:[],trace:[],unavailable:[]};
run.steps=[{id:'research-copy-fixture',tool:'research_area',title:'Researching the selected area’s practical trade-offs',status:'unavailable',failureCode:'provider-timeout',areaId:run.exploration.areas[0].id,notice:'Research priorities: SPACE → ACCESS. Focus: arrival. Distant Centre is nearby.'}];
let current=run;const out=process.env.VERIFY_OUTPUT_DIR||'/tmp/sitebrief-plain-language';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.route('**/api/scout',r=>r.fulfill({contentType:'text/event-stream',body:`data: ${JSON.stringify({type:'complete',value:current})}\n\n`}));
 await page.goto(base,{waitUntil:'networkidle'});await page.getByRole('button',{name:'Try Blue Bottle in Toronto'}).click();await page.locator('.atlas-area-card').first().waitFor();
 assert(await page.getByText('AUDIENCE PATTERNS / FROM QLOO',{exact:true}).isVisible());
 assert(await page.getByText('These areas score very similarly. Compare properties, access and costs in person.',{exact:true}).isVisible());
 const age=page.locator('details').filter({has:page.getByText('Example reference: how to read the age signals',{exact:true})}).first();await age.locator('summary').click();
 assert.match(await age.innerText(),/not percentages of nearby residents/);assert.match(await age.innerText(),/\+1\.25/);assert.match(await age.innerText(),/-0\.25/);
 const skipped=page.locator('.atlas-skip-card').filter({hasText:'Lower Qloo popularity than your selected setting allows.'});await skipped.locator('summary').click();assert.match(await skipped.innerText(),/20th percentile/);
 const log=await page.locator('.atlas-agent-log').innerText();assert.match(log,/Looking for web sources/);assert.match(log,/Property, Getting there/);assert.doesNotMatch(log,/SPACE|ACCESS|Distant Centre/);
 // The unavailable step must still be unavailable, not relabelled as a completed success.
 assert.equal(await page.locator('.atlas-agent-log li.unavailable').count(),1);
 const states=[];
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1100});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(!overflow);
  await page.locator('.atlas-dna').screenshot({path:`${out}/audience-${width}.png`});await page.locator('.atlas-agent-log').screenshot({path:`${out}/activity-${width}.png`});
  await page.addScriptTag({path:process.env.AXE_MODULE_PATH||require.resolve('axe-core/axe.min.js')});const axe=await page.evaluate(()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));assert.equal(axe.violations.length,0);states.push({width,overflow,axeViolations:axe.violations.length});
 }
 const emptyStates=[];
 for(const [coverage,eligible,expected] of [[.2,3,'Not enough popularity data to compare these areas.'],[1,3,'No returned map points match all your settings.'],[1,0,'Every returned map point is too close to an existing outlet.']]){
  current={...structuredClone(run),assessment:null,research:{},steps:[],exploration:{...structuredClone(run.exploration),areas:[],popularityCoverage:coverage,eligibleCount:eligible}};
  await page.getByRole('button',{name:'Try Blue Bottle in Toronto'}).click();await page.getByText(expected,{exact:false}).waitFor();emptyStates.push(expected);
 }
 assert.deepEqual(errors,[]);const result={base,mode:'historical-run replay plus synthetic age/near-tie/empty-state variants; no provider calls',states,emptyStates,legacyPrioritySafety:true,unavailableStatusPreserved:true,errors};fs.writeFileSync(out+'/summary.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
