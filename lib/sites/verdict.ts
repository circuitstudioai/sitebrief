import type {Area, Exploration} from './explore';
import type {ResearchReport} from './research-report';
import {rankingFact} from './decision';
export type Verdict = {label:'Visit first'|'Joint first'|'Also consider'; reasons:string[]; sources:{title:string;url:string}[]};
/** Visit priority comes from ranking, not from unavailable web summaries. Never a viability rating. */
export function areaVerdict(result:Exploration,area:Area,_reports:Record<string,ResearchReport>):Verdict {
 void _reports; // Web-research confidence is shown separately from visit order.
 const rank=rankingFact(result,area.id);
 return {label:rank.rank===1?(rank.tied>1?'Joint first':'Visit first'):'Also consider',reasons:[
  `${rank.tied>1?'Joint rank':'Rank'} ${rank.rank} of ${rank.total} shortlisted points${rank.tied>1?'; tied scores, not a clear winner':''}.`,
  `Passed your audience, popularity and outlet-distance rules.`,
  'Visit to check the property, access and costs. Web sources do not confirm suitability.'
 ],sources:[]};
}
