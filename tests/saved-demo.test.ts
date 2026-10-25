jest.mock('../lib/sites/quota',()=>({reserveLiveAnalysis:jest.fn(async()=>({remaining:49})),quotaResponse:jest.fn()}));
import {savedPlaygroundDemo} from '../lib/sites/saved-demo';
import {POST} from '../app/api/scout/route';
import {buildDemoBrief} from '../lib/sites/demo-server';
import {runScout} from '../lib/sites/scout-agent';
import {researchForVisit,hasCitedVisitResearch} from '../lib/sites/visit-research';
jest.mock('../lib/sites/demo-server',()=>({buildDemoBrief:jest.fn()}));
jest.mock('../lib/sites/scout-agent',()=>({runScout:jest.fn()}));
let clock=Date.now();
beforeEach(()=>{jest.clearAllMocks();clock+=16*60*1000;jest.spyOn(Date,'now').mockReturnValue(clock);});
afterEach(()=>jest.restoreAllMocks());
it('keeps recorded provenance and only the saved highlights, not a fabricated full heatmap',()=>{
 const first=savedPlaygroundDemo('live-unavailable');const second=savedPlaygroundDemo('live-incomplete');
 expect(first.cached).toBe(true);expect(first.savedDemo?.recordedAt).toBe(first.createdAt);expect(first.savedDemo!.originalPointCount).toBeGreaterThan(first.exploration.cells.length);expect(first.exploration.cells).toHaveLength(3);expect(first.assessment?.visitFirst).toBeTruthy();
 first.exploration.areas.length=0;expect(second.exploration.areas).toHaveLength(3);
 expect(researchForVisit(second)?.notice).toMatch(/source locations are not verified/i);expect(researchForVisit(second)?.localityVerified).toBe(false);expect(researchForVisit(second)?.confidence).toBe('low');expect(researchForVisit(second)?.target?.areaId).toBe(second.assessment?.visitFirst);
});
it('recovers a failed canonical run only as a dated sources-only reference',async()=>{
 jest.mocked(buildDemoBrief).mockRejectedValue(new Error('Provider unavailable'));
 const response=await POST(new Request('http://local/api/scout',{method:'POST',body:JSON.stringify({demo:true})}));const events=(await response.text()).split('\n\n').filter(Boolean).map(f=>JSON.parse(f.slice(6)));const run=events.find(e=>e.type==='complete').value;expect(run.savedDemo.reason).toBe('live-unavailable');expect(researchForVisit(run)?.localityVerified).toBe(false);expect(researchForVisit(run)?.notice).toMatch(/unverified/i);expect(runScout).not.toHaveBeenCalled();
});
it('does not replace a custom request failure with the unrelated saved café',async()=>{
 jest.mocked(runScout).mockRejectedValue(new Error('Provider unavailable'));const brief=savedPlaygroundDemo('live-unavailable').exploration.brief;
 const response=await POST(new Request('http://local/api/scout',{method:'POST',body:JSON.stringify(brief)}));expect(await response.text()).toContain('"type":"error"');
});
it('rejects extra custom constraints on a canonical demo request',async()=>{
 const response=await POST(new Request('http://local/api/scout',{method:'POST',body:JSON.stringify({demo:true,radiusKm:20})}));expect(response.status).toBe(400);
});
it('switches an incomplete canonical research run to the dated reference instead of caching it as live',async()=>{
 const prior=savedPlaygroundDemo('live-unavailable');jest.mocked(buildDemoBrief).mockResolvedValue({brief:prior.exploration.brief,evidence:{references:prior.exploration.references,trace:[]}});jest.mocked(runScout).mockResolvedValue({...prior,research:{},cached:false,savedDemo:undefined});
 const response=await POST(new Request('http://local/api/scout',{method:'POST',body:JSON.stringify({demo:true})}));const events=(await response.text()).split('\n\n').filter(Boolean).map(f=>JSON.parse(f.slice(6)));expect(events.find(e=>e.type==='complete').value.savedDemo.reason).toBe('live-incomplete');expect(researchForVisit(events.find(e=>e.type==='complete').value)?.localityVerified).toBe(false);
});
it('does not replace a genuine empty live shortlist with old eligible points',async()=>{
 const prior=savedPlaygroundDemo('live-unavailable');jest.mocked(buildDemoBrief).mockResolvedValue({brief:prior.exploration.brief,evidence:{references:prior.exploration.references,trace:[]}});jest.mocked(runScout).mockResolvedValue({...prior,exploration:{...prior.exploration,areas:[]},assessment:null,savedDemo:undefined,cached:false,research:{}});
 const response=await POST(new Request('http://local/api/scout',{method:'POST',body:JSON.stringify({demo:true})}));const events=(await response.text()).split('\n\n').filter(Boolean).map(f=>JSON.parse(f.slice(6)));const run=events.find(e=>e.type==='complete').value;expect(run.savedDemo).toBeUndefined();expect(run.exploration.areas).toEqual([]);
});
it('reuses source discovery without claiming it is successful cited local research',async()=>{
 const prior=savedPlaygroundDemo('live-unavailable');
 const sourcesOnly=Object.fromEntries(Object.entries(prior.research).map(([id,r])=>[id,{...r,text:'',citations:[],status:'sources-only' as const,notice:'Sources to inspect; summary unavailable.'}]));
 jest.mocked(buildDemoBrief).mockResolvedValue({brief:prior.exploration.brief,evidence:{references:prior.exploration.references,trace:[]}});
 jest.mocked(runScout).mockResolvedValue({...prior,research:sourcesOnly,cached:false,savedDemo:undefined});
 for(let i=0;i<2;i++){
  const response=await POST(new Request('http://local/api/scout',{method:'POST',body:JSON.stringify({demo:true})}));
  const events=(await response.text()).split('\n\n').filter(Boolean).map(f=>JSON.parse(f.slice(6)));
  const run=events.find(e=>e.type==='complete').value;expect(run.savedDemo).toBeUndefined();expect(Boolean(run.cached)).toBe(i===1);expect(hasCitedVisitResearch(run)).toBe(false);expect(researchForVisit(run)?.notice).toMatch(/source locations are not verified/i);
 }
 expect(runScout).toHaveBeenCalledTimes(1);
});
it('does not treat another area report as a complete canonical run or cache it',async()=>{
 const prior=savedPlaygroundDemo('live-unavailable');const report=researchForVisit(prior)!;
 jest.mocked(buildDemoBrief).mockResolvedValue({brief:prior.exploration.brief,evidence:{references:prior.exploration.references,trace:[]}});
 jest.mocked(runScout).mockResolvedValue({...prior,research:{'area-3':{...report,target:{...report.target!,areaId:'area-3'}}},savedDemo:undefined,cached:false});
 for(let i=0;i<2;i++){
  const response=await POST(new Request('http://local/api/scout',{method:'POST',body:JSON.stringify({demo:true})}));
  const events=(await response.text()).split('\n\n').filter(Boolean).map(f=>JSON.parse(f.slice(6)));
  const run=events.find(e=>e.type==='complete').value;expect(run.savedDemo.reason).toBe('live-incomplete');expect(researchForVisit(run)?.target?.areaId).toBe(run.assessment.visitFirst);expect(researchForVisit(run)?.localityVerified).toBe(false);
 }
 expect(runScout).toHaveBeenCalledTimes(2);
});
