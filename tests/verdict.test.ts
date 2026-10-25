import {areaVerdict} from '../lib/sites/verdict';
import {savedPlaygroundDemo} from '../lib/sites/saved-demo';
import type {ResearchReport} from '../lib/sites/research-report';
const run=savedPlaygroundDemo('live-incomplete');
const area=run.exploration.areas[0];
const report:ResearchReport={text:'A locally cited menu.',createdAt:'2026-10-23',target:{areaId:area.id,latitude:area.latitude,longitude:area.longitude},sources:[{title:'Local menu',url:'https://example.test/menu'},{title:'Unused elsewhere',url:'https://example.test/elsewhere'}],citations:[{end:21,sourceIndices:[0]}],queries:[],searchSuggestionsHtml:''};
it('separates first-visit priority from unverified legacy citations',()=>{
 const complete={...report,sources:[...report.sources,{title:'Transit',url:'https://city.test/transit'}],citations:[{end:21,sourceIndices:[0,2]}],fields:['SPACE','ACCESS','ACTIVITY'].map(key=>({key:key as 'SPACE'|'ACCESS'|'ACTIVITY',label:key,status:'found' as const,text:report.text,sourceIndices:[0,2]}))};
 const verdict=areaVerdict(run.exploration,area,{[area.id]:complete});
 expect(verdict.label).toMatch(/Visit first|Joint first/);expect(verdict.reasons.join(' ')).toMatch(/rank 1/i);
 expect(verdict.sources).toEqual([]);expect(verdict.reasons.join(' ')).not.toContain('cited local finding');expect(verdict.reasons).toHaveLength(3);
});

it('keeps first-visit priority without treating mismatched research as proof',()=>{expect(areaVerdict(run.exploration,area,{[area.id]:report}).label).toMatch(/Visit first|Joint first/);expect(areaVerdict(run.exploration,area,{[area.id]:{...report,target:{areaId:'elsewhere',latitude:0,longitude:0}}}).sources).toEqual([]);});
