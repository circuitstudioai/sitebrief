jest.mock('../lib/sites/store-counts',()=>({retrieveStoreCounts:jest.fn(async()=>({}))}));
import {runScout} from '../lib/sites/scout-agent';
import {exploreCity,type Exploration} from '../lib/sites/explore';
import {profileAudience,compareAreaAudience} from '../lib/sites/profile';
import {researchArea} from '../lib/sites/research';
import type {GenerateContentResponse} from '@google/genai';
jest.mock('../lib/sites/explore',()=>({exploreCity:jest.fn()}));
jest.mock('../lib/sites/profile',()=>({profileAudience:jest.fn(),compareAreaAudience:jest.fn()}));
jest.mock('../lib/sites/research',()=>({researchArea:jest.fn()}));
const brief={city:'Toronto',center:{latitude:43.65,longitude:-79.38},radiusKm:10 as const,concept:'Cafe',references:['Local cafe']};
const top={id:'area-1',name:'Near Spadina',affinity:.9,contrast:50,latitude:43.65,longitude:-79.4,address:null,venues:[]};
const lower={...top,id:'area-3',name:'Near Don Mills',contrast:40,latitude:43.73,longitude:-79.34};
const evidence={brief,rankingMethod:'contrast',areas:[top,lower]} as unknown as Exploration;
beforeEach(()=>{
 jest.clearAllMocks();jest.mocked(exploreCity).mockResolvedValue(evidence);
 jest.mocked(profileAudience).mockResolvedValue({tags:[],ageSignals:[],relatedBrands:[],trace:[],unavailable:[]});
 jest.mocked(compareAreaAudience).mockResolvedValue({areaId:top.id,venue:'Cafe',shared:[],referenceTags:[],venueTags:[],trace:[]});
 jest.mocked(researchArea).mockImplementation(async input=>({text:'Published menu.',createdAt:'2026-10-23',sources:[{title:'Menu',url:'https://example.test/menu'}],citations:[{end:15,sourceIndices:[0]}],queries:[],searchSuggestionsHtml:'',target:{areaId:input.area.id,latitude:input.area.latitude,longitude:input.area.longitude}}));
});
function generator(finalId='area-1'){
 let turn=0;return async()=>{const tools=['explore_areas','audience_profile','compare_audiences','research_area'];
  if(turn<tools.length){const name=tools[turn++];const args=turn>2?{areaId:'area-3',...(name==='research_area'?{priorities:['ACCESS','VENUES'],focus:'arrival'}:{})}:{};return {functionCalls:[{name,args}],candidates:[{content:{role:'model',parts:[{functionCall:{name,args}}]}}]} as GenerateContentResponse;}
  return {text:JSON.stringify({visitFirst:finalId,reasonCode:'taste-evidence',checkFocus:'general'})} as GenerateContentResponse;
 };
}
it('researches the locked highest-ranked visit even when the model requests a lower area',async()=>{
 const run=await runScout(brief,()=>{},generator());
 expect(researchArea).toHaveBeenCalledWith(expect.objectContaining({area:expect.objectContaining({latitude:top.latitude,longitude:top.longitude})}),undefined,['ACCESS','VENUES']);
 expect(Object.keys(run.research)).toEqual([top.id]);expect(run.assessment?.visitFirst).toBe(top.id);expect(run.steps.find(s=>s.tool==='research_area')?.notice).toMatch(/ACCESS → VENUES.*arrival/);
});
it('cannot leak a legacy local summary through agent streaming or completion',async()=>{
 const events:unknown[]=[];const run=await runScout(brief,event=>events.push(event),generator());
 const researchEvents=events.filter(event=>(event as {type:string}).type==='research');
 expect(researchEvents).toHaveLength(1);expect(JSON.stringify(researchEvents)).not.toContain('Published menu.');
 expect(run.research[top.id].text).toBe('');expect(run.research[top.id].citations).toEqual([]);
 expect(run.decisionNotice).toMatch(/Qloo taste scores/);
});
it('cannot switch the final visit after researching the locked point',async()=>{
 const run=await runScout(brief,()=>{},generator('area-3'));
 expect(run.assessment?.visitFirst).toBe(top.id);expect(Object.keys(run.research)).toEqual([top.id]);
 expect(run.research[top.id].target).toEqual({areaId:top.id,latitude:top.latitude,longitude:top.longitude});
 expect(run.decisionIssues?.length).toBeGreaterThan(0);
});
it('rejects a report whose returned coordinates belong to a different map point',async()=>{
 jest.mocked(researchArea).mockResolvedValue({text:'Menu.',createdAt:'2026-10-23',sources:[{title:'Menu',url:'https://example.test/menu'}],citations:[{end:5,sourceIndices:[0]}],queries:[],searchSuggestionsHtml:'',target:{areaId:top.id,latitude:lower.latitude,longitude:lower.longitude}});
 const run=await runScout(brief,()=>{},generator());
 expect(run.research).toEqual({});expect(run.assessment?.visitFirst).toBe(top.id);
 expect(run.steps.find(s=>s.tool==='research_area')).toMatchObject({status:'unavailable',failureCode:'area-mismatch'});
 expect(run.decisionNotice).toMatch(/research is unavailable/);
});
it('does not silently invent research priorities when the model omits its required choice',async()=>{
 let turn=0;const generate=async()=>{const names=['explore_areas','audience_profile','compare_audiences','research_area'];if(turn<4){const name=names[turn++];const args=turn>2?{areaId:top.id}:{};return {functionCalls:[{name,args}],candidates:[{content:{role:'model',parts:[{functionCall:{name,args}}]}}]} as GenerateContentResponse;}return {text:JSON.stringify({visitFirst:top.id,reasonCode:'taste-evidence',checkFocus:'general'})} as GenerateContentResponse;};
 const run=await runScout(brief,()=>{},generate);expect(researchArea).not.toHaveBeenCalled();expect(run.steps.find(s=>s.tool==='research_area')?.status).toBe('unavailable');
});
