import {MAPPED_BUSINESS_CHECK_TITLE,MAPPED_BUSINESS_CHECK_NOTICE,SCOUT_STEP_TITLES,recordedPriorityCopy} from './scouting-copy';
import type {ResearchReport} from './research-report';
import type {ScoutRun} from './scout-agent';
import {RESEARCH_FIELDS} from './structured-research';
import {renderDecision} from './decision';
import {reportMatchesArea} from './visit-research';

export const RESEARCH_SUMMARY_POLICY='unverified-locality-v1' as const;
export const LOCAL_SUMMARY_DISCLAIMER='These local notes are low-confidence and unverified. Web source locations are not verified. Review the linked sources yourself — claims may not match this exact pin. They are not demand, rent or proof that a site is suitable.';
export const LOCAL_EVIDENCE_NOTICE=LOCAL_SUMMARY_DISCLAIMER;
function safeSource(source:{title:string;url:string}){
 try{const url=new URL(source.url);return url.protocol==='https:'&&!url.username&&!url.password?source:{title:source.title,url:''};}catch{return {title:source.title,url:''};}
}
function keepFields(report:ResearchReport){
 return report.fields?.length?report.fields.map(field=>({...field})):RESEARCH_FIELDS.map(([key,label])=>({key,label,status:'not-found' as const,text:'',sourceIndices:[]}));
}
export function hasLocalNotes(report:ResearchReport|undefined){
 return Boolean(report&&((report.text&&report.text.trim())||report.fields?.some(field=>field.status==='found'&&field.text.trim())));
}
/** Honesty stamp only. Never trust a saved/client "verified" flag. */
export function releaseResearch(report:ResearchReport):ResearchReport{
 const sources=report.sources.map(safeSource);
 const fields=keepFields({...report,sources});
 const text=report.text.trim();
 const citations=text?report.citations.filter(citation=>citation.end>0&&citation.end<=text.length&&citation.sourceIndices.some(index=>Boolean(sources[index]?.url))):[];
 const notes=Boolean(text)||fields.some(field=>field.status==='found'&&field.text.trim());
 return {
  target:report.target,createdAt:report.createdAt,sources,queries:report.queries,
  text:notes?text:'',citations:notes?citations:[],searchSuggestionsHtml:'',
  status:notes?(report.status&&report.status!=='sources-only'?report.status:citations.length?'cited':'partial'):'sources-only',
  fields,notice:LOCAL_SUMMARY_DISCLAIMER,summaryPolicy:RESEARCH_SUMMARY_POLICY,
  confidence:'low',localityVerified:false,
 };
}
/** Source-inspection acceptance. Unverified notes do not count as locality verification. */
export function hasInspectionSources(report:ResearchReport|undefined){
 return Boolean(report?.summaryPolicy===RESEARCH_SUMMARY_POLICY&&report.confidence==='low'&&report.localityVerified===false&&
  new Set(report.sources.filter(source=>{try{return new URL(source.url).protocol==='https:';}catch{return false;}}).map(source=>source.url)).size>=2);
}
/** Apply equally to fresh, warm-cache and dated reference runs. Preserve point identity and dates. */
export function releaseScoutRun(run:ScoutRun):ScoutRun{
 const research=Object.fromEntries(Object.entries(run.research).filter(([id,report])=>reportMatchesArea(report,run.exploration.areas.find(area=>area.id===id))).map(([id,report])=>[id,releaseResearch(report)]));
 const choice=run.assessment?{visitFirst:run.assessment.visitFirst,reasonCode:'taste-evidence' as const,checkFocus:'general' as const}:null;
 const assessment=choice?{...renderDecision(choice,run.exploration,run.decisionOrigin),nextAction:'Visit the shortlisted points. Check available units, access, rent and permission for your restaurant use.'}:null;
 const visitReport=choice?.visitFirst?research[choice.visitFirst]:undefined;
 return {...run,research,assessment,selection:run.selection?{visitFirst:run.selection.visitFirst,reasonCode:'taste-evidence',checkFocus:'general'}:undefined,
  decisionNotice:choice?.visitFirst&&visitReport?.sources.some(source=>source.url)?'Visit order uses Qloo taste scores. Local notes are unverified; check each source address and date before relying on it.':'Web research is unavailable for this point. The Qloo shortlist is still available. Visit to check the property, access and costs.',
  steps:run.steps.map(step=>{
   const displayed={...step,title:SCOUT_STEP_TITLES[step.tool]??step.title};
   if(step.tool==='mapped_venues')return {...displayed,title:MAPPED_BUSINESS_CHECK_TITLE,notice:MAPPED_BUSINESS_CHECK_NOTICE};
   if(step.tool==='research_area')return {...displayed,notice:[recordedPriorityCopy(step.notice),LOCAL_SUMMARY_DISCLAIMER].filter(Boolean).join(' ')};
   return displayed;
  }),
 };
}
