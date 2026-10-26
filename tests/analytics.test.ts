import { safePageview, usageField } from '../lib/analytics';
import { recordUsage, USAGE_SCRIPT } from '../lib/analytics-server';

it('strips search/hash and refuses unknown paths rather than leaking inputs',()=>{
 expect(safePageview('https://site.test/compare?address=private#notes')).toBe('https://site.test/compare');
 expect(safePageview('https://site.test/?prompt=private')).toBe('https://site.test/');
 expect(safePageview('https://site.test/private-address')).toBeNull();
 expect(safePageview('https://name:secret@site.test/')).toBe('https://site.test/');
 expect(safePageview('ftp://site.test/')).toBeNull();
 expect(usageField({event:'analysis_completed',workflow:'scout',mode:'sample'})).toBe('analysis_completed:scout:sample');
 expect(usageField({event:'analysis_completed',workflow:'scout',mode:'sample',prompt:'private'})).toBeNull();
 expect(usageField({event:'private',workflow:'scout',mode:'sample'})).toBeNull();
});
it('writes aggregate-only metrics separately from the quota with bounded retention',async()=>{
 process.env.SITEBRIEF_REDIS_REST_URL='https://analytics-test.upstash.io';process.env.SITEBRIEF_REDIS_REST_TOKEN='fixture-secret';process.env.VERCEL_ENV='preview';
 const mock=jest.fn().mockResolvedValue(Response.json({result:1}));global.fetch=mock;
 expect(await recordUsage({event:'analysis_started',workflow:'scout',mode:'custom'})).toBe(true);
 const command=JSON.parse(mock.mock.calls[0][1].body);
 expect(command).toEqual(['EVAL',USAGE_SCRIPT,'1','sitebrief:usage:v1:preview:'+new Date().toISOString().slice(0,10),'analysis_started:scout:custom']);
 expect(command.join(' ')).not.toContain('fixture-secret');
 mock.mockClear();expect(await recordUsage({event:'unknown',workflow:'scout',mode:'custom'})).toBe(false);expect(mock).not.toHaveBeenCalled();
 delete process.env.SITEBRIEF_REDIS_REST_URL;delete process.env.SITEBRIEF_REDIS_REST_TOKEN;delete process.env.VERCEL_ENV;
});

it('rejects foreign origins, oversized bodies and private fields before writing',async()=>{
 const {POST}=await import('../app/api/usage/route');
 const mock=jest.fn();global.fetch=mock;
 const request=(body:string,origin='https://site.test')=>new Request('https://site.test/api/usage',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','Content-Length':'1'},body});
 expect((await POST(request('{}','https://other.test'))).status).toBe(403);
 expect((await POST(request('a'.repeat(257)))).status).toBe(413);
 expect((await POST(request('bad json'))).status).toBe(400);
 expect((await POST(request(JSON.stringify({event:'analysis_started',workflow:'scout',mode:'custom',address:'private'})))).status).toBe(400);
 expect(mock).not.toHaveBeenCalled();
});
it('acknowledges only a stored counter and reports saturation or failure without details',async()=>{
 const {POST}=await import('../app/api/usage/route');
 process.env.SITEBRIEF_REDIS_REST_URL='https://analytics-test.upstash.io';process.env.SITEBRIEF_REDIS_REST_TOKEN='fixture-secret';
 const mock=jest.fn();global.fetch=mock;
 const request=()=>new Request('https://site.test/api/usage',{method:'POST',headers:{Origin:'https://site.test','Content-Type':'application/json'},body:JSON.stringify({event:'analysis_completed',workflow:'compare',mode:'sample'})});
 mock.mockResolvedValue(Response.json({result:1}));expect((await POST(request())).status).toBe(202);
 mock.mockResolvedValue(Response.json({result:0}));expect((await POST(request())).status).toBe(429);
 mock.mockRejectedValue(Error('fixture-secret'));const response=await POST(request());expect(response.status).toBe(503);expect(await response.text()).not.toContain('fixture-secret');
 delete process.env.SITEBRIEF_REDIS_REST_URL;delete process.env.SITEBRIEF_REDIS_REST_TOKEN;
});
