import {visitPlan} from '@/lib/sites/visit-plan';
import {areaVerdict} from '@/lib/sites/verdict';
import type {Area,Exploration} from '@/lib/sites/explore';
import type {ResearchReport} from '@/lib/sites/research-report';
export function VerdictSummary({result,area,reports}:{result:Exploration;area:Area;reports:Record<string,ResearchReport>}){
 const verdict=areaVerdict(result,area,reports);
 const research=visitPlan(result,reports).areas.find(point=>point.id===area.id)?.research;
 return <div className="atlas-verdict"><span className={`atlas-verdict-label ${verdict.label==='Also consider'?'maybe':'scout'}`}>{verdict.label}</span><span className="atlas-help">Visit priority, not a property rating</span><ul>{verdict.reasons.slice(0,1).map(reason=><li key={reason}>{reason}</li>)}</ul><p className="atlas-help">Web research: {research}</p>{verdict.sources.length>0&&<div className="atlas-citation-chips" aria-label="Cited local sources">{verdict.sources.slice(0,3).map((source,i)=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">[{i+1}] {source.title} ↗</a>)}</div>}</div>;
}
export function SkipCards({result}:{result:Exploration}){
 const floor=result.brief.minimumPopularityPercentile??20;
 const popularity=result.screeningExamples?result.screeningExamples.filter(e=>e.reason==='popularity').map(e=>e.point):result.cells.filter(c=>c.popularityPercentile!==undefined&&c.popularityPercentile<floor).slice(0,2);
 const weak=result.screeningExamples?result.screeningExamples.filter(e=>e.reason==='taste').map(e=>e.point):result.cells.filter(c=>c.popularityPercentile!==undefined&&c.popularityPercentile>=floor&&c.audiencePercentile!==undefined&&c.audiencePercentile<70).slice(0,1);
 const rejected=[...result.rejected.slice(0,1).map(p=>({point:p,reason:`Inside the ${result.brief.minimumOutletDistanceKm??0} km outlet buffer for ${p.outletName}.`})),...popularity.map(p=>({point:p,reason:`Below the ${floor}th-percentile popularity floor (${p.popularityPercentile!.toFixed(0)}th percentile).`})),...weak.map(p=>({point:p,reason:`Below the top-30% audience affinity screen (${p.audiencePercentile!.toFixed(0)}th percentile).`}))];
 if(!rejected.length)return null;
 return <section className="atlas-skip-section" aria-label="Why not here"><h3>Why not here?</h3><p className="atlas-help">Examples of rejected map points. Source: this run’s Qloo grid and your stated rules.</p><div className="atlas-skip-grid">{rejected.map(({point,reason},i)=><article className="atlas-skip-card" key={i}><span className="atlas-verdict-label skip">Skip</span><h4>Map point {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}</h4><p>{reason}</p></article>)}</div></section>;
}
