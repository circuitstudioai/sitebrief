import {areaVerdict} from '../lib/sites/verdict';
import {visitPlan,visitNotes} from '../lib/sites/visit-plan';
import {savedBlueBottleDemo} from '../lib/sites/saved-blue-bottle';
const run=savedBlueBottleDemo('live-incomplete');
it('gives highest-ranked points a useful visit priority without pretending web evidence is verified',()=>{
 const plan=visitPlan(run.exploration,{},run);
 expect(plan.areas[0].priority).toMatch(/Visit first|Joint first/);
 expect(plan.areas[0].research).toBe('Not searched');
 expect(plan.areas.every(a=>!a.priority.includes('Maybe'))).toBe(true);
 expect(plan.checks.join(' ')).toMatch(/rent/i);
});
it('keeps tied points equal and does not use source availability to change rank',()=>{
 const areas=run.exploration.areas.map(a=>({...a,contrast:10}));
 const result={...run.exploration,areas};
 expect(areas.map(a=>areaVerdict(result,a,{}).label)).toEqual(areas.map(()=> 'Joint first'));
});
it('does not attach a wrong-point source or claim a map point is a property',()=>{
 const id=run.exploration.areas[0].id;
 const wrong={...Object.values(run.research)[0],target:{areaId:id,latitude:0,longitude:0}};
 const plan=visitPlan(run.exploration,{[id]:wrong},run);
 expect(plan.areas[0].sources).toEqual([]);
 expect(plan.areas[0].research).toBe('Not searched');
 expect(plan.limit).toMatch(/not available properties/i);
});
it('exports only saved points while retaining their original letters and full-shortlist ranks',()=>{
 const text=visitNotes(run.exploration,{},run,[run.exploration.areas[1].id]);
 expect(text).toContain('B / ALSO CONSIDER');expect(text).not.toContain('A / VISIT FIRST');expect(text).toMatch(/Rank 2 of 3/);
});
it('exports matching local notes with a low-confidence disclaimer and no verified claim',()=>{
 const id=run.assessment!.visitFirst!;
 const report=run.research[id];
 const plan=visitPlan(run.exploration,{[id]:report},run);
 const area=plan.areas.find(point=>point.id===id)!;
 expect(area.notes.length).toBeGreaterThan(0);expect(area.research).toMatch(/low-confidence/i);
 expect(area.confidence).toBe('low');expect(area.localityVerified).toBe(false);expect(area.disclaimer).toMatch(/not verified/i);
 expect(plan.limit).not.toMatch(/verified local/i);
 const notes=visitNotes(run.exploration,{[id]:report},run);
 expect(notes).toMatch(/low confidence; locality not verified/i);expect(notes).toContain(area.notes[0]);expect(notes).not.toMatch(/locality verified/i);
});
