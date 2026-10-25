'use client';
import {releaseResearch} from '@/lib/sites/research-release';
import {useEffect,useRef,useState} from 'react';
import type {Area,Exploration} from '@/lib/sites/explore';
import {reportMatchesArea,visibleResearchSources} from '@/lib/sites/visit-research';
import {VISIT_CHECKS,mapLink} from '@/lib/sites/visit-plan';
import type {ResearchReport} from '@/lib/sites/research';
export default function AreaResearch({result,area,reports,onReport,headingId="research-title"}:{result:Exploration;area:Area;reports:Record<string,ResearchReport>;onReport:(id:string,report:ResearchReport)=>void;headingId?:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');const controller=useRef<AbortController|null>(null);
 const candidate=reports[area.id];const report=reportMatchesArea(candidate,area)?releaseResearch(candidate):undefined;
 const sources=report?visibleResearchSources(report):[];
 useEffect(()=>()=>{controller.current?.abort();controller.current=null;},[]);
 async function research(){
  controller.current?.abort();const request=new AbortController();controller.current=request;setBusy(true);setError('');
  const timer=setTimeout(()=>request.abort(),48000);
  try{
   const response=await fetch('/api/research',{method:'POST',headers:{'Content-Type':'application/json'},signal:request.signal,body:JSON.stringify({brief:result.brief,mapEvidence:{affinity:area.affinity,popularity:area.popularity,audiencePercentile:area.audiencePercentile,popularityPercentile:area.popularityPercentile,contrast:area.contrast},area:{id:area.id,name:area.name,address:area.address,latitude:area.latitude,longitude:area.longitude,venues:area.venues.map(v=>({name:v.name,address:v.address}))}})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Research could not finish.');
   if(!reportMatchesArea(data,area))throw new Error('Research did not match this map point and was not used.');
   if(!request.signal.aborted)onReport(area.id,releaseResearch(data));
  }catch(e){if(!request.signal.aborted)setError(e instanceof Error?e.message:'Research could not finish.');else if(controller.current===request)setError('Research took too long. Your map is unchanged. Try again.');}
  finally{clearTimeout(timer);if(controller.current===request)setBusy(false);}
 }
 return <section className="atlas-research" aria-labelledby={headingId}>
 <div className="atlas-research-heading"><div><p className="atlas-eyebrow">LOCAL CHECKS</p><h2 id={headingId}>Plan your visit near {area.name.replace(/^Near /,'')}</h2><p>Check the businesses, property and access before choosing a site.</p></div>{!report&&<button type="button" className="atlas-go" disabled={busy} onClick={research}>{busy?'Finding web links…':'Find web sources ↗'}</button>}</div>
 <p><a href={mapLink(area.latitude,area.longitude)} target="_blank" rel="noreferrer">Open this exact point in OpenStreetMap ↗</a></p>
 <h3>Nearby businesses returned by Qloo</h3><p className="atlas-help">A ranked dining sample requested within 1 km. Check each address; this is not a complete competitor list.</p>
 {area.contextAvailable&&area.venues.length?<ul>{area.venues.map(venue=><li key={venue.id}><strong>{venue.name}</strong>{venue.address?` — ${venue.address}`:' — address not supplied'}</li>)}</ul>:<p>No nearby-business details are available. Check the area on your visit.</p>}
 {candidate&&!report&&<p role="status" className="atlas-help">A report for a different map point was not used.</p>}
 {busy&&<p role="status" className="atlas-working">Finding source links. Your map and visit order will not change.</p>}
 {error&&<p role="alert" className="atlas-error">{error}</p>}
 <h3>Web sources to check</h3>
 <p className="atlas-help">Sitebrief cannot yet verify that each source describes this exact area. Check its address and date. These links are not confirmed local findings.</p>
 {report?<><p className="atlas-research-date">Links retrieved {new Date(report.createdAt).toLocaleString()} · not the source publication date</p>
 {sources.length?<><p>{sources.length} source links found. Showing the first {Math.min(5,sources.length)}; these are search results, not verified findings.</p><ol>{sources.slice(0,5).map(({source,index})=><li key={index}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ol>{sources.length>5&&<details className="atlas-source-log"><summary>Show {sources.length-5} more source links</summary><ol start={6}>{sources.slice(5).map(({source,index})=><li key={index}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ol></details>}</>:<p>No usable links were found. The Qloo shortlist is still available.</p>}
 {report.queries.length>0&&<details className="atlas-source-log"><summary>Searches used to find these links</summary><ul>{report.queries.map((query,index)=><li key={index}>{query}</li>)}</ul></details>}</>:!busy&&<p>No web search has been completed for this point.</p>}
 <div className="atlas-city-questions"><h3>Take these checks on your visit</h3><ol>{VISIT_CHECKS.map(question=><li key={question}>{question}</li>)}</ol></div>
 </section>;
}
