import type {GroundingMetadata} from '@google/genai';
import {assertNarrativeEvidence} from './evidence-guards';

export type ResearchTarget={areaId?:string;latitude:number;longitude:number};
export type ResearchReport={summaryPolicy?:'withheld-locality-v1'|'unverified-locality-v1';confidence?:'low';localityVerified?:boolean;fields?:import("./structured-research").ResearchField[];text:string;createdAt:string;sources:{title:string;url:string}[];citations:{end:number;sourceIndices:number[]}[];queries:string[];searchSuggestionsHtml:string;status?:'cited'|'partial'|'sources-only';notice?:string;omittedSentences?:number;validationRules?:string[];target?:ResearchTarget};
export type ResearchFailureCode='not-configured'|'provider-timeout'|'provider-rate-limit'|'provider-error'|'missing-grounding'|'validation-rejected'|'area-mismatch'|'cancelled';
const messages:Record<ResearchFailureCode,string>={
 'not-configured':'Web research is not configured. Your Qloo map is unchanged.',
 'provider-timeout':'Web research timed out. Your Qloo map is unchanged; try research again.',
 'provider-rate-limit':'The research provider is busy. Your Qloo map is unchanged; try later.',
 'provider-error':'The research provider could not complete this request. Your Qloo map is unchanged.',
 'missing-grounding':'The research returned no usable cited sources. Your Qloo map is unchanged.',
 'validation-rejected':'The research summary did not pass evidence checks. Your Qloo map is unchanged.',
 'area-mismatch':'The research did not match the requested map point and was not used. Your Qloo map is unchanged.',
 cancelled:'Research was cancelled. Your Qloo map is unchanged.',
};
export class ResearchError extends Error{
 constructor(public readonly code:ResearchFailureCode){super(messages[code]);this.name='ResearchError';}
}
export function researchFailure(error:unknown):ResearchError{
 if(error instanceof ResearchError)return error;
 const e=error as {name?:string;status?:number;code?:number;message?:string}|null;
 if(e?.status===429||e?.code===429)return new ResearchError('provider-rate-limit');
 if(e?.name==='TimeoutError'||e?.status===504||/timeout|timed out/i.test(e?.message??''))return new ResearchError('provider-timeout');
 if(e?.name==='AbortError')return new ResearchError('cancelled');
 return new ResearchError('provider-error');
}
function safeUrl(value:string|undefined){try{return value&&new URL(value).protocol==='https:'?value:'';}catch{return '';}}
function guardRule(error:unknown){
 const message=error instanceof Error?error.message:'';
 return /numeric/.test(message)?'numeric-claim':/regulatory/.test(message)?'regulatory-claim':/demographic/.test(message)?'demographic-claim':'unsupported-market-claim';
}
/** Keep whole grounded sentences. Never edit words inside a claim or reuse stale citation offsets. */
export function buildResearchReport(response:{text?:string;metadata?:GroundingMetadata},verifiedLabels:string[]=[],localAnchors?:string[]):ResearchReport{
 const raw=response.text?.trim()??'';
 const metadata=response.metadata;
 const sources=(metadata?.groundingChunks??[]).map(chunk=>({title:chunk.web?.title??'Web source',url:safeUrl(chunk.web?.uri)}));
 if(!sources.some(s=>s.url))throw new ResearchError('missing-grounding');
 const spans=(metadata?.groundingSupports??[]).flatMap(support=>{
  const segment=support.segment?.text;if(!segment)return [];
  // Exact text is authoritative; provider byte offsets must not be mistaken for JS character offsets.
  const hint=support.segment?.startIndex;
  let start=raw.indexOf(segment);
  if(hint!==undefined&&raw.slice(hint,hint+segment.length)===segment)start=hint;
  else if(start>=0&&raw.indexOf(segment,start+1)!==-1)return [];
  const indices=[...new Set((support.groundingChunkIndices??[]).filter(i=>Number.isInteger(i)&&Boolean(sources[i]?.url)))];
  return start>=0&&indices.length?[{start,end:start+segment.length,indices}]:[];
 });
 const normalize=(value:string)=>value.normalize('NFKC').replace(/[’‘]/g,"'").toLocaleLowerCase();
 const anchors=localAnchors?.map(normalize).filter(Boolean);
 let text='';let omitted=0;const rules=new Set<string>();const citations:ResearchReport['citations']=[];
 const segmenter=new Intl.Segmenter('en',{granularity:'sentence'});
 const sentences=[...raw.matchAll(/[^\r\n]+/g)].flatMap(line=>[...segmenter.segment(line[0])].map(part=>({segment:part.segment,index:line.index!+part.index})));
 for(const part of sentences){
  const sentence=part.segment.trim();if(!sentence)continue;
  const start=part.index+part.segment.indexOf(sentence);
  const end=start+sentence.replace(/[.!?]+$/,'').length;
  try{assertNarrativeEvidence(sentence,verifiedLabels);}catch(error){omitted++;rules.add(guardRule(error));continue;}
  if(anchors&&!anchors.some(label=>normalize(sentence).includes(label))){omitted++;rules.add('unverified-local-context');continue;}
  const sourceIndices=[...new Set(spans.filter(s=>s.start<=start&&s.end>=end).flatMap(s=>s.indices))];
  if(!sourceIndices.length){omitted++;rules.add('ungrounded-sentence');continue;}
  text+=(text?'\n\n':'')+sentence;
  citations.push({end:text.length,sourceIndices});
 }
 const status=!citations.length?'sources-only':omitted?'partial':'cited';
 const notice=status==='sources-only'?'Sources to inspect; summary unavailable. These provider-returned links are not validated findings.':status==='partial'?'Some sentences were omitted because evidence checks or citation alignment failed. Only retained cited passages are shown.':undefined;
 return {text,createdAt:new Date().toISOString(),sources,citations,queries:metadata?.webSearchQueries??[],searchSuggestionsHtml:metadata?.searchEntryPoint?.renderedContent??'',status,notice,omittedSentences:omitted,validationRules:[...rules]};
}
/** Recheck an existing cited artifact under current guards; this is not new provider retrieval. */
export function recheckRecordedReport(report:ResearchReport,target:ResearchTarget,verifiedLabels:string[]=[]):ResearchReport{
 let start=0;
 const supports=report.citations.map(citation=>{const segment={text:report.text.slice(start,citation.end),startIndex:start};start=citation.end;return {segment,groundingChunkIndices:citation.sourceIndices};});
 const checked=buildResearchReport({text:report.text,metadata:{groundingChunks:report.sources.map(s=>({web:{title:s.title,uri:s.url}})),groundingSupports:supports,webSearchQueries:report.queries,searchEntryPoint:{renderedContent:report.searchSuggestionsHtml}}},verifiedLabels,verifiedLabels);
 return {...checked,createdAt:report.createdAt,target};
}
