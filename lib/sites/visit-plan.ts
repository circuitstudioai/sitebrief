import type {Exploration} from './explore';
import type {ResearchReport} from './research-report';
import type {ScoutRun} from './scout-agent';
import {areaVerdict} from './verdict';
import {reportMatchesArea,visibleResearchSources} from './visit-research';
import {releaseResearch} from './research-release';
export const VISIT_CHECKS=[
 'Visit during your planned opening hours. Count passersby and note access from nearby streets or transit.',
 'Find a vacant commercial unit. Ask the agent for current rent, service charges, size and lease terms.',
 'Check nearby menus and prices. Note what each business offers; this sample is not every competitor.',
 'Ask the City and landlord whether your restaurant use and layout are allowed. Confirm permits and fit-out costs.'
];
export function mapLink(latitude:number,longitude:number){return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;}
/** Shared facts for screen and exports; never promote provider prose to verified local evidence. */
export function visitPlan(result:Exploration,reports:Record<string,ResearchReport>,run:ScoutRun|null=null){
 const areas=result.areas.map((area,index)=>{
  const candidate=reports[area.id];const report=reportMatchesArea(candidate,area)?releaseResearch(candidate):undefined;
  const sources=report?visibleResearchSources(report).map(({source})=>source):[];
  return {id:area.id,letter:String.fromCharCode(65+index),name:area.name,address:area.address,latitude:area.latitude,longitude:area.longitude,
   priority:areaVerdict(result,area,reports).label,reasons:areaVerdict(result,area,reports).reasons,
   research:report?(sources.length?'Sources found · location not verified':'No usable sources found'):'Not searched',
   sources,retrievedAt:report?.createdAt,venues:area.venues,contextAvailable:area.contextAvailable,mapUrl:mapLink(area.latitude,area.longitude)};
 });
 return {title:`Scouting visit plan: ${result.brief.city}`,createdAt:result.createdAt,
  mode:run?.savedDemo?`Saved example recorded ${run.savedDemo.recordedAt}`:run?.cached?'Reused result, not a fresh search':'Live map evidence',
  summary:areas.length?`Start with ${areas.filter(a=>a.priority!=='Also consider').map(a=>`${a.letter}: ${a.name}`).join(' or ')}. Compare the shortlisted points in person before choosing a property.`:'No points passed your rules. Try another audience or search radius.',
  areas,checks:VISIT_CHECKS,limit:'These are map points, not available properties. Audience taste is not measured demand, foot traffic or expected sales. Web source locations and local summaries are not verified.'};
}
export function visitNotes(result:Exploration,reports:Record<string,ResearchReport>,run:ScoutRun|null=null,selectedIds:string[]=[]){
 const plan=visitPlan(result,reports,run);
 const areas=selectedIds.length?plan.areas.filter(area=>selectedIds.includes(area.id)):plan.areas;
 return [plan.title,`${plan.mode}\nMap retrieved: ${plan.createdAt}`,`YOUR BRIEF\n${result.brief.concept}\nAudience references: ${result.references.map(r=>r.name).join(', ')}\nRadius: ${result.brief.radiusKm} km`,
  `WHERE TO START\n${selectedIds.length?`Your saved points: ${areas.map(a=>`${a.letter}: ${a.name}`).join('; ')}. Visit priorities remain relative to the full shortlist.`:plan.summary}`,...areas.map(a=>`${a.letter} / ${a.priority.toUpperCase()} / ${a.name}\n${a.reasons[0]}\nNearby label: ${a.address??'Not available'}\nExact point: ${a.latitude}, ${a.longitude}\nMap: ${a.mapUrl}\nResearch: ${a.research}${a.retrievedAt?` (retrieved ${a.retrievedAt})`:''}\nNearby dining returned by Qloo (sample, not a census):\n${a.contextAvailable?a.venues.map(v=>`- ${v.name}${v.address?`: ${v.address}`:''}`).join('\n')||'No businesses returned.':'Unavailable.'}\nSources to inspect; check the address and publication date:\n${a.sources.map(s=>`- ${s.title}: ${s.url}`).join('\n')||'None.'}`),
  `ON YOUR VISIT\n${plan.checks.map((c,i)=>`${i+1}. ${c}\n   Notes: ______________________________`).join('\n')}`,
  `BEFORE YOU DECIDE\n${plan.limit}`,
  `METHOD / DETAILS\nRanking: ${result.rankingMethod}. Popularity floor: ${result.brief.minimumPopularityPercentile??20}th local percentile. Highlights spaced at least ${result.separationKm} km apart. Contrast is audience-affinity percentile minus popularity percentile, not success probability.\nOutlet buffer: ${result.brief.minimumOutletDistanceKm??0} km; ${result.rejectedCount} returned points excluded.\n${result.areas.map(a=>`${a.id}: affinity ${a.affinity}; popularity ${a.popularity??'unavailable'}; contrast ${a.contrast??'unavailable'}`).join('\n')}`
 ].join('\n\n');
}
