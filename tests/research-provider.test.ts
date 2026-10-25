import {researchArea} from '../lib/sites/research';
import {ResearchError} from '../lib/sites/research-report';
import type {ResearchInput} from '../lib/sites/research';
const generate=jest.fn();
jest.mock('@google/genai',()=>({GoogleGenAI:jest.fn(()=>({models:{generateContent:(...args:unknown[])=>generate(...args)}}))}));
const input={brief:{city:'Toronto',center:{latitude:43.65,longitude:-79.38},radiusKm:10,concept:'Cafe',references:['Cafe']},area:{name:'Area',address:null,latitude:43.65,longitude:-79.38,venues:[]}} as ResearchInput;
beforeEach(()=>{generate.mockReset();process.env.GEMINI_API_KEY='private-test-key';jest.spyOn(console,'info').mockImplementation(()=>{});jest.spyOn(console,'warn').mockImplementation(()=>{});});
afterEach(()=>{delete process.env.GEMINI_API_KEY;jest.restoreAllMocks();});
it('keeps grounded local notes as low-confidence unverified findings',async()=>{
 const fact='Area has a distant community centre.';
 generate.mockResolvedValue({text:`[ACTIVITY]\n${fact}`,candidates:[{groundingMetadata:{groundingChunks:[{web:{uri:'https://city.test/centre'}}],groundingSupports:[{segment:{text:fact},groundingChunkIndices:[0]}]}}]});
 const report=await researchArea(input);
 expect(report.text).toContain(fact);expect(report.fields?.find(field=>field.key==='ACTIVITY')).toMatchObject({status:'found',text:fact});
 expect(report.confidence).toBe('low');expect(report.localityVerified).toBe(false);expect(report.notice).toMatch(/low-confidence and unverified/i);
 expect(report.sources).toEqual([{title:'Web source',url:'https://city.test/centre'}]);
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
it('does not add a second model call once sources exist, even when notes stay thin',async()=>{
 generate.mockResolvedValueOnce({text:'Two units are required.',candidates:[{groundingMetadata:{groundingChunks:[{web:{uri:'https://example.com/city'}}]}}]}).mockRejectedValueOnce({name:'TimeoutError'});
 const report=await researchArea(input);expect(report.sources[0].url).toBe('https://example.com/city');expect(generate).toHaveBeenCalledTimes(1);
 expect(report.localityVerified).toBe(false);expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"localityVerified":false'));
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
 await new Promise(resolve=>setImmediate(resolve));
 deadline.abort(new DOMException('Timed out','TimeoutError'));
 await expect(pending).rejects.toMatchObject({code:'provider-timeout'});
 expect(timeout).toHaveBeenCalledWith(40000);expect(generate).toHaveBeenCalledTimes(1);
});
it('marks an unanchored structured field not found while retaining venue evidence',async()=>{
 const generic='Parkdale encompasses the supplied coordinates.';const local="Mildred’s Temple Kitchen publishes a brunch menu.";
 generate.mockResolvedValue({text:`[ACCESS]\n${generic}\n[VENUES]\n${local}`,candidates:[{groundingMetadata:{groundingChunks:[{web:{uri:'https://example.com/menu'}}],groundingSupports:[generic,local].map(text=>({segment:{text},groundingChunkIndices:[0]}))}}]});
 const report=await researchArea({...input,area:{...input.area,venues:[{name:"Mildred's Temple Kitchen"}]}});
 expect(report.fields?.find(f=>f.key==='ACCESS')?.status).toBe('not-found');
 expect(report.fields?.find(f=>f.key==='VENUES')).toMatchObject({status:'found',text:local});
 expect(report.text).toContain(local);expect(report.localityVerified).toBe(false);expect(report.confidence).toBe('low');
});
it('drops unsafe and duplicate source URLs without trusting model-written links',async()=>{
 generate.mockResolvedValue({text:'Use https://invented.test',candidates:[{groundingMetadata:{groundingChunks:[{web:{uri:'https://city.test/transit'}},{web:{uri:'https://city.test/transit'}},{web:{uri:'http://unsafe.test'}},{web:{uri:'javascript:alert(1)'}}]}}]});
 const report=await researchArea(input);expect(report.sources.some(source=>source.url==='https://city.test/transit')).toBe(true);
 expect(report.sources.every(source=>!source.url||source.url==='https://city.test/transit')).toBe(true);expect(generate).toHaveBeenCalledTimes(1);expect(report.localityVerified).toBe(false);
});
