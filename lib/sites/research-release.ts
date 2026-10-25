import type {ResearchReport} from './research-report';
import type {ScoutRun} from './scout-agent';
import {RESEARCH_FIELDS} from './structured-research';
import {renderDecision} from './decision';
import {reportMatchesArea} from './visit-research';

export const LOCAL_EVIDENCE_NOTICE='Web source locations are not verified. Check each address and publication date before using a link. Local summaries are not available.';
/** Release boundary, not geographic validation. Never trust a saved/client "verified" flag. */
export function releaseResearch(report:ResearchReport):ResearchReport{
 const sources=report.sources.filter(source=>{try{const url=new URL(source.url);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}});
 return {
  target:report.target,createdAt:report.createdAt,sources,queries:report.queries,
  text:'',citations:[],searchSuggestionsHtml:'',status:'sources-only',
  fields:RESEARCH_FIELDS.map(([key,label])=>({key,label,status:'not-found',text:'',sourceIndices:[]})),
  notice:LOCAL_EVIDENCE_NOTICE,summaryPolicy:'withheld-locality-v1',
 };
}
/** Source-discovery acceptance only. This deliberately does not imply hasResearchQuality. */
export function hasInspectionSources(report:ResearchReport|undefined){
 return Boolean(report?.summaryPolicy==='withheld-locality-v1'&&report.status==='sources-only'&&!report.text&&!report.citations.length&&
  report.fields?.every(field=>field.status==='not-found'&&!field.text&&!field.sourceIndices.length)&&
  new Set(report.sources.filter(source=>{try{return new URL(source.url).protocol==='https:';}catch{return false;}}).map(source=>source.url)).size>=2);
}
/** Apply equally to fresh, warm-cache and dated reference runs. Preserve point identity and dates. */
export function releaseScoutRun(run:ScoutRun):ScoutRun{
 const research=Object.fromEntries(Object.entries(run.research).filter(([id,report])=>reportMatchesArea(report,run.exploration.areas.find(area=>area.id===id))).map(([id,report])=>[id,releaseResearch(report)]));
 const choice=run.assessment?{visitFirst:run.assessment.visitFirst,reasonCode:'taste-evidence' as const,checkFocus:'general' as const}:null;
 const assessment=choice?{...renderDecision(choice,run.exploration,run.decisionOrigin),nextAction:'Visit the shortlisted points. Check available units, access, rent and permission for your restaurant use.'}:null;
 return {...run,research,assessment,selection:run.selection?{visitFirst:run.selection.visitFirst,reasonCode:'taste-evidence',checkFocus:'general'}:undefined,
  decisionNotice:choice?.visitFirst&&research[choice.visitFirst]?.sources.length?'Visit order uses Qloo taste scores. Web links need an address and date check; they do not confirm that a property is suitable.':'Web research is unavailable for this point. The Qloo shortlist is still available. Visit to check the property, access and costs.',
  steps:run.steps.map(step=>step.tool==='research_area'?{...step,notice:[step.notice?.match(/^Research priorities: (?:SPACE|ACCESS|VENUES|ACTIVITY| → )+\. Focus: (?:premises|arrival|neighbours|activity)\./)?.[0],LOCAL_EVIDENCE_NOTICE].filter(Boolean).join(' ')}:step),
 };
}
