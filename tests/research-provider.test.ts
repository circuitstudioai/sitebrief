import {researchArea} from '../lib/sites/research';
import {ResearchError} from '../lib/sites/research-report';
import type {ResearchInput} from '../lib/sites/research';
const generate=jest.fn();
jest.mock('@google/genai',()=>({GoogleGenAI:jest.fn(()=>({models:{generateContent:(...args:unknown[])=>generate(...args)}}))}));
const input={brief:{city:'Toronto',center:{latitude:43.65,longitude:-79.38},radiusKm:10,concept:'Cafe',references:['Cafe']},area:{name:'Area',address:null,latitude:43.65,longitude:-79.38,venues:[]}} as ResearchInput;
beforeEach(()=>{generate.mockReset();process.env.GEMINI_API_KEY='private-test-key';jest.spyOn(console,'info').mockImplementation(()=>{});jest.spyOn(console,'warn').mockImplementation(()=>{});});
afterEach(()=>{delete process.env.GEMINI_API_KEY;jest.restoreAllMocks();});
it('returns source discovery, not even apparently grounded local claims, at the live boundary',async()=>{
 const fact='Area has a distant community centre.';
 generate.mockResolvedValue({text:`[ACTIVITY]\n${fact}`,candidates:[{groundingMetadata:{groundingChunks:[{web:{uri:'https://city.test/centre'}}],groundingSupports:[{segment:{text:fact},groundingChunkIndices:[0]}]}}]});
 const report=await researchArea(input);
 expect(report.text).toBe('');expect(report.citations).toEqual([]);expect(report.status).toBe('sources-only');
 expect(report.fields?.every(field=>field.status==='not-found'&&!field.text)).toBe(true);
 expect(report.sources).toEqual([{title:'Web source',url:'https://city.test/centre'}]);expect(report.notice).toMatch(/source locations are not verified/i);
});
it('reports rate limits without leaking provider details into the UI or logs',async()=>{
 generate.mockRejectedValue({status:429,message:'private-test-key in provider request'});
 await expect(researchArea(input)).rejects.toMatchObject({code:'provider-rate-limit',message:expect.not.stringContaining('private-test-key')});
 expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('"providerStatus":429'));
 expect(JSON.stringify(jest.mocked(console.warn).mock.calls)).not.toContain('private-test-key');
});
it('retries missing grounding within the existing two-attempt budget',async()=>{
 generate.mockResolvedValue({text:'A model claim with no search grounding.'});
 await expect(researchArea(input)).rejects.toMatchObject({code:'missing-grounding'});
 expect(generate).toHaveBeenCalledTimes(2);
});
it('does not retry a usable source discovery to fill summaries that the release withholds',async()=>{
 generate.mockResolvedValueOnce({text:'Two units are required.',candidates:[{groundingMetadata:{groundingChunks:[{web:{uri:'https://example.com/city'}}]}}]}).mockRejectedValueOnce({name:'TimeoutError'});
 const report=await researchArea(input);expect(report.status).toBe('sources-only');expect(report.text).toBe('');
 expect(report.sources[0].url).toBe('https://example.com/city');expect(generate).toHaveBeenCalledTimes(1);
 expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"localityVerified":false'));
});
it('does not run a later model call after cancellation',async()=>{
 const controller=new AbortController();controller.abort();
 await expect(researchArea(input,controller.signal)).rejects.toBeDefined();expect(generate).not.toHaveBeenCalled();
});
it('classifies a provider timeout as a timeout, not invalid research',async()=>{
 generate.mockRejectedValue({name:'TimeoutError',message:'timed out'});
 await expect(researchArea(input)).rejects.toBeInstanceOf(ResearchError);
 expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('provider-timeout'));
});
it('cancels research at the total deadline without starting a second attempt',async()=>{
 const deadline=new AbortController();
 const timeout=jest.spyOn(AbortSignal,'timeout').mockReturnValue(deadline.signal);
 generate.mockImplementation(({config})=>new Promise((_,reject)=>config.abortSignal.addEventListener('abort',()=>reject(config.abortSignal.reason),{once:true})));
 const pending=researchArea(input);
 // Allow the asynchronous SDK import to complete, then trip the actual signal boundary.
 await new Promise(resolve=>setImmediate(resolve));
 deadline.abort(new DOMException('Timed out','TimeoutError'));
 await expect(pending).rejects.toMatchObject({code:'provider-timeout'});
 expect(timeout).toHaveBeenCalledWith(40000);expect(generate).toHaveBeenCalledTimes(1);
});
it('marks an unanchored structured field not found while retaining venue evidence',async()=>{
 const generic='Parkdale encompasses the supplied coordinates.';const local="Mildred’s Temple Kitchen publishes a brunch menu.";
 generate.mockResolvedValue({text:`[ACCESS]\n${generic}\n[VENUES]\n${local}`,candidates:[{groundingMetadata:{groundingChunks:[{web:{uri:'https://example.com/menu'}}],groundingSupports:[generic,local].map(text=>({segment:{text},groundingChunkIndices:[0]}))}}]});
 const report=await researchArea({...input,area:{...input.area,venues:[{name:"Mildred's Temple Kitchen"}]}});
 expect(report.text).toBe('');expect(report.summaryPolicy).toBe('withheld-locality-v1');expect(report.fields?.find(f=>f.key==='ACCESS')?.status).toBe('not-found');
});
it('drops unsafe and duplicate source URLs without trusting model-written links',async()=>{
 generate.mockResolvedValue({text:'Use https://invented.test',candidates:[{groundingMetadata:{groundingChunks:[{web:{uri:'https://city.test/transit'}},{web:{uri:'https://city.test/transit'}},{web:{uri:'http://unsafe.test'}},{web:{uri:'javascript:alert(1)'}}]}}]});
 const report=await researchArea(input);expect(report.sources).toEqual([{title:'Web source',url:'https://city.test/transit'}]);expect(generate).toHaveBeenCalledTimes(1);expect(report.text).toBe('');
});
