'use client';
import {hasLocalNotes,releaseResearch} from '@/lib/sites/research-release';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import type {Area,Exploration} from '@/lib/sites/explore';
import {reportMatchesArea,visibleResearchSources} from '@/lib/sites/visit-research';
import {VISIT_CHECKS,mapLink} from '@/lib/sites/visit-plan';
import type {ResearchReport} from '@/lib/sites/research';
function CitedText({report}:{report:ResearchReport}){
 const clean=(text:string)=>text.replace(/\*\*|__/g,'');
 function renderRange(start:number,end:number){
  let cursor=start;const parts:ReactNode[]=[];
  for(const [index,citation] of report.citations.entries()){
   if(citation.end<=start||citation.end>end||citation.end<cursor)continue;
   parts.push(<span key={`text-${index}`}>{clean(report.text.slice(cursor,citation.end))}</span>);
   parts.push(<sup key={`cite-${index}`}>{citation.sourceIndices.map(i=>report.sources[i]?.url?<a key={i} href={report.sources[i].url} target="_blank" rel="noreferrer" aria-label={`Source ${i+1}: ${report.sources[i].title}`}>[{i+1}]</a>:null)}</sup>);
   cursor=citation.end;
  }
  parts.push(<span key="end">{clean(report.text.slice(cursor,end))}</span>);return parts;
 }
 const blocks:ReactNode[]=[];let cursor=0;
 for(const [index,block] of report.text.split(/\n\s*\n/).entries()){
  const start=report.text.indexOf(block,cursor);cursor=start+block.length;
  blocks.push(<p key={index}>{renderRange(start,cursor)}</p>);
 }
 return <div className="atlas-research-text">{blocks}</div>;
}
function LocalNotes({report}:{report:ResearchReport}){
 const found=report.fields?.filter(field=>field.status==='found'&&field.text.trim())??[];
 if(!found.length&&!report.text.trim())return null;
 return <div className="atlas-local-notes">
  <h3>Local notes</h3>
  <p className="atlas-research-confidence" role="status">Low confidence · locality not verified</p>
  {report.notice&&<p className="atlas-help">{report.notice}</p>}
  {found.length?<div className="atlas-research-fields">{found.map(field=><section key={field.key}><h3>{field.label}</h3><p>{field.text} <sup>{field.sourceIndices.slice(0,2).map(i=>report.sources[i]?.url?<a key={i} href={report.sources[i].url} target="_blank" rel="noreferrer" aria-label={`Source: ${report.sources[i].title}`}>[{i+1}]</a>:null)}</sup></p></section>)}</div>:report.text?<CitedText report={report}/>:null}
 </div>;
}
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
 {report&&hasLocalNotes(report)&&<LocalNotes report={report}/>}
 <h3>Web sources to check</h3>
 <p className="atlas-help">Sitebrief cannot verify that each source describes this exact area. Check its address and date. These links are not confirmed local findings.</p>
 {report?<><p className="atlas-research-date">Links retrieved {new Date(report.createdAt).toLocaleString()} · not the source publication date</p>
 {sources.length?<><p>{sources.length} source links found. Showing the first {Math.min(5,sources.length)}; these are search results, not verified findings.</p><ol>{sources.slice(0,5).map(({source,index})=><li key={index}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ol>{sources.length>5&&<details className="atlas-source-log"><summary>Show {sources.length-5} more source links</summary><ol start={6}>{sources.slice(5).map(({source,index})=><li key={index}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ol></details>}</>:<p>No usable links were found. The Qloo shortlist is still available.</p>}
 {report.queries.length>0&&<details className="atlas-source-log"><summary>Searches used to find these links</summary><ul>{report.queries.map((query,index)=><li key={index}>{query}</li>)}</ul></details>}</>:!busy&&<p>No web search has been completed for this point.</p>}
 <div className="atlas-city-questions"><h3>Take these checks on your visit</h3><ol>{VISIT_CHECKS.map(question=><li key={question}>{question}</li>)}</ol></div>
 </section>;
}
