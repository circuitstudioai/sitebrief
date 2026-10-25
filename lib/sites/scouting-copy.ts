/** Approved user-facing wording shared by fresh and reused runs. */
export const MAPPED_BUSINESS_CHECK_TITLE='Checking mapped businesses within 1 km.';
export const MAPPED_BUSINESS_CHECK_NOTICE='Some businesses may be missing. This count does not affect visit order.';
export const SCOUT_STEP_TITLES:Record<string,string>={
 explore_areas:'Finding areas for your audience',
 audience_profile:'Looking at your audience references',
 compare_audiences:'Comparing nearby business audiences',
 research_area:'Looking for web sources',
 mapped_venues:MAPPED_BUSINESS_CHECK_TITLE,
};
const priorityNames:Record<string,string>={SPACE:'Property',ACCESS:'Getting there',VENUES:'Nearby businesses',ACTIVITY:'Local places'};
const focusNames:Record<string,string>={premises:'Property',arrival:'Getting there',neighbours:'Nearby businesses',activity:'Local places'};
export function researchPriorityCopy(priorities:readonly string[],focus:string){
 const names=priorities.map(key=>priorityNames[key]).filter(Boolean);
 return names.length&&focusNames[focus]?`Looking into: ${names.join(', ')}. Focus: ${focusNames[focus]}.`:'';
}
/** Preserve only known priority/focus labels from old or new reports, never legacy model prose. */
export function recordedPriorityCopy(notice?:string){
 const legacy=notice?.match(/^Research priorities: ((?:SPACE|ACCESS|VENUES|ACTIVITY)(?: → (?:SPACE|ACCESS|VENUES|ACTIVITY))*)\. Focus: (premises|arrival|neighbours|activity)\./);
 if(legacy)return researchPriorityCopy(legacy[1].split(' → '),legacy[2]);
 return notice?.match(/^Looking into: (?:Property|Getting there|Nearby businesses|Local places)(?:, (?:Property|Getting there|Nearby businesses|Local places))*\. Focus: (?:Property|Getting there|Nearby businesses|Local places)\./)?.[0]??'';
}
