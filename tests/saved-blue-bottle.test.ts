import {savedBlueBottleDemo} from '../lib/sites/saved-blue-bottle';
import {hasInspectionSources} from '../lib/sites/research-release';
import {hasResearchQuality} from '../lib/sites/structured-research';
import {researchForVisit} from '../lib/sites/visit-research';
import {POST} from '../app/api/scout/route';
it('shows recorded local notes as low-confidence, never as verified locality',()=>{
 const run=savedBlueBottleDemo('live-unavailable');const report=researchForVisit(run)!;
 expect(report.text.length).toBeGreaterThan(0);expect(report.fields?.some(field=>field.status==='found'&&field.text)).toBe(true);
 expect(report.confidence).toBe('low');expect(report.localityVerified).toBe(false);
 expect(report.notice).toMatch(/source locations are not verified/i);expect(report.notice).toMatch(/low-confidence/i);
 expect(report.sources.length).toBeGreaterThan(1);expect(run.assessment?.visitFirst).toBe(report.target?.areaId);
 expect(run.savedDemo?.recordedAt).toBe(run.createdAt);expect(run.exploration.areas.length).toBeGreaterThan(0);
 expect(run.assessment?.practicalEvidence).toBeUndefined();
});
it('keeps a compact, qualified Blue Bottle artifact with original date and coordinates',()=>{const run=savedBlueBottleDemo('live-incomplete');expect(hasResearchQuality(researchForVisit(run))).toBe(true);expect(hasInspectionSources(researchForVisit(run))).toBe(true);expect(researchForVisit(run)?.localityVerified).toBe(false);expect(run.savedDemo?.recordedAt).toBe(run.createdAt);expect(run.exploration.cells).toHaveLength(3);expect(run.savedDemo!.originalPointCount).toBeGreaterThan(3);expect(run.exploration.brief.references).toEqual(['Blue Bottle Coffee']);});
it('returns only a labelled saved example when shared live admission is unconfigured',async()=>{for(const key of ['SITEBRIEF_REDIS_REST_URL','SITEBRIEF_REDIS_REST_TOKEN','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','KV_REST_API_URL','KV_REST_API_TOKEN'])delete process.env[key];const response=await POST(new Request('https://local.test/api/scout',{method:'POST',body:JSON.stringify({demo:'blue-bottle'})}));expect(response.status).toBe(200);const frames=(await response.text()).split('\n\n').filter(f=>f.startsWith('data: ')).map(f=>JSON.parse(f.slice(6)));expect(frames[0].value.savedDemo.reason).toBe('live-unavailable');expect(frames[0].value.cached).toBe(true);});
