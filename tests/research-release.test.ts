import {releaseResearch,releaseScoutRun,hasInspectionSources,LOCAL_EVIDENCE_NOTICE} from '../lib/sites/research-release';
import {hasResearchQuality} from '../lib/sites/structured-research';
import {savedBlueBottleDemo} from '../lib/sites/saved-blue-bottle';
import type {ResearchReport} from '../lib/sites/research-report';
const report:ResearchReport={text:'Distant Centre is nearby.',target:{areaId:'area-1',latitude:43.65,longitude:-79.4},createdAt:'2026-10-23T10:00:00Z',sources:[{title:'City',url:'https://city.test/centre'},{title:'Operator',url:'https://operator.test/menu'},{title:'Unsafe',url:'javascript:alert(1)'}],citations:[{end:25,sourceIndices:[0]}],fields:[{key:'ACTIVITY',label:'Local activity',status:'found',text:'Distant Centre is nearby.',sourceIndices:[0]}],queries:['centre Toronto'],searchSuggestionsHtml:'<div>Distant Centre is nearby.</div>'};
it('withholds the whole local summary, including legacy prose and provider HTML, without altering the input',()=>{
 const released=releaseResearch(report);
 expect(released.text).toBe('');expect(released.citations).toEqual([]);expect(released.searchSuggestionsHtml).toBe('');
 expect(released.fields).toHaveLength(4);expect(released.fields?.every(field=>field.status==='not-found'&&!field.text&&!field.sourceIndices.length)).toBe(true);
 expect(released.sources).toEqual(report.sources.slice(0,2));expect(released.target).toEqual(report.target);expect(released.createdAt).toBe(report.createdAt);
 expect(released.notice).toBe(LOCAL_EVIDENCE_NOTICE);expect(hasInspectionSources(released)).toBe(true);expect(hasResearchQuality(released)).toBe(false);
 expect(report.text).toBe('Distant Centre is nearby.');expect(releaseResearch(released)).toEqual(released);
});
it('does not accept a policy marker as proof or count duplicate source links',()=>{
 expect(releaseResearch({...report,summaryPolicy:'withheld-locality-v1'}).text).toBe('');
 expect(hasInspectionSources({...report,summaryPolicy:'withheld-locality-v1'})).toBe(false);
 expect(hasInspectionSources(releaseResearch({...report,sources:[report.sources[0],report.sources[0]]}))).toBe(false);
});
it('rechecks legacy cached decisions and rejects wrong-point reports while preserving ranks and provenance',()=>{
 const saved=savedBlueBottleDemo('live-incomplete');const point=saved.exploration.areas.find(area=>area.id===saved.assessment!.visitFirst)!;
 const legacy={...saved,cached:true,assessment:{...saved.assessment!,reason:'Distant Centre is nearby.',practicalEvidence:{quote:'Distant Centre is nearby.',title:'City',url:'https://city.test/centre'}},research:{[point.id]:{...report,target:{areaId:point.id,latitude:point.latitude,longitude:point.longitude}},wrong:{...report}}};
 const released=releaseScoutRun(legacy);
 expect(Object.keys(released.research)).toEqual([point.id]);expect(released.research[point.id].text).toBe('');
 expect(released.assessment?.reason).not.toContain('Distant Centre');expect(released.assessment?.practicalEvidence).toBeUndefined();
 expect(released.assessment?.visitFirst).toBe(point.id);expect(released.cached).toBe(true);expect(released.savedDemo).toEqual(saved.savedDemo);
});
it('translates legacy progress without changing tool identity, status or evidence boundaries',()=>{
 const run=savedBlueBottleDemo('live-incomplete');
 run.steps=[{id:'legacy-research',tool:'research_area',title:'Old research title',status:'unavailable',areaId:run.assessment!.visitFirst!,durationMs:123,failureCode:'provider-timeout',notice:'Research priorities: SPACE → ACCESS. Focus: arrival. Distant Centre is nearby.'}];
 const step=releaseScoutRun(run).steps[0];
 expect(step).toMatchObject({id:'legacy-research',tool:'research_area',status:'unavailable',durationMs:123,failureCode:'provider-timeout',areaId:run.assessment!.visitFirst});
 expect(step.notice).toContain('Property');expect(step.notice).toContain('Getting there');
 expect(step.notice).not.toContain('Distant Centre');expect(step.notice).not.toContain('SPACE');
 expect(releaseScoutRun(releaseScoutRun(run)).steps).toEqual([step]);
});
