import fs from 'node:fs';import assert from 'node:assert/strict';
const base=process.argv[2];assert(base,'Pass exact deployment URL');
const out=process.env.VERIFY_OUTPUT_DIR||'/tmp/sitebrief-release-research';fs.mkdirSync(out,{recursive:true});
const brief={city:'Toronto, Ontario, Canada',center:{latitude:43.6534817,longitude:-79.3839347},radiusKm:10,minimumPopularityPercentile:20,concept:'Scout Toronto areas for a proposed Blue Bottle specialty coffee café.',references:['Blue Bottle Coffee'],restaurant:{brandName:'Blue Bottle Coffee',format:'cafe',servicePeriod:'unspecified',pricePosition:'unspecified'},existingOutlets:[],minimumOutletDistanceKm:0};
const rows=[];
for(let index=0;index<Number(process.env.VERIFY_RUNS||5);index++){
 const response=await fetch(base+'/api/scout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(brief),signal:AbortSignal.timeout(175000)});
 const raw=await response.text();const frames=raw.split('\n\n').filter(frame=>frame.startsWith('data: ')).map(frame=>JSON.parse(frame.slice(6)));const run=frames.find(frame=>frame.type==='complete')?.value;
 fs.writeFileSync(`${out}/run-${index+1}.json`,JSON.stringify(run||{status:response.status,raw},null,2));
 const point=run?.exploration.areas.find(area=>area.id===run.assessment?.visitFirst),report=run?.research[point?.id];
 const reports=frames.filter(frame=>frame.type==='research').map(frame=>frame.value).concat(Object.values(run?.research||{}));
 const honest=reports.length>0&&reports.every(report=>report.summaryPolicy==='unverified-locality-v1'&&report.confidence==='low'&&report.localityVerified===false&&Boolean(report.notice)&&!report.searchSuggestionsHtml);
 const matched=Boolean(point&&report?.target?.areaId===point.id&&report.target.latitude===point.latitude&&report.target.longitude===point.longitude);
 const top=run&&point&&run.exploration.areas.every(area=>(run.exploration.rankingMethod==='contrast'?area.contrast:area.affinity)<=(run.exploration.rankingMethod==='contrast'?point.contrast:point.affinity)+1e-9);
 const sources=new Set(report?.sources.map(source=>source.url)||[]).size;
 const row={run:index+1,checkedAt:new Date().toISOString(),status:response.status,honest,matched,rankPreserved:Boolean(top),sourceLinks:sources,cached:Boolean(run?.cached),saved:Boolean(run?.savedDemo),error:frames.find(frame=>frame.type==='error')?.error};
 row.releasePass=Boolean(response.ok&&honest&&matched&&top&&sources>=2&&!row.cached&&!row.saved&&!run.assessment.practicalEvidence);rows.push(row);console.log(JSON.stringify(row));
 fs.writeFileSync(out+'/summary.json',JSON.stringify({url:base,rows,passed:rows.filter(row=>row.releasePass).length,total:rows.length,scope:'unverified-notes honesty/identity/ranking acceptance; NOT geographic accuracy or complete local research'},null,2));
}
assert(rows.every(row=>row.releasePass),'Every fresh run must preserve identity/rank and stamp local notes as unverified, with source inspection links');
