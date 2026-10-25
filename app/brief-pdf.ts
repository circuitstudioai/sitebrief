import type {Exploration} from '@/lib/sites/explore';
import type {ScoutRun} from '@/lib/sites/scout-agent';
import type {ResearchReport} from '@/lib/sites/research';
import {visitPlan} from '@/lib/sites/visit-plan';
/** Printable visit plan. Flow across pages rather than cutting off useful checks or sources. */
export async function downloadExpansionPdf(result:Exploration,run:ScoutRun|null,reports:Record<string,ResearchReport>){
 const plan=visitPlan(result,reports,run);
 const {jsPDF}=await import('jspdf');const pdf=new jsPDF({unit:'mm',format:'a4'});let y=20;
 const clean=(text:string)=>text.replace(/[–—]/g,'-').replace(/[“”]/g,'"').replace(/[’]/g,"'").replace(/↗/g,'');
 function line(text:string,size=10){
  pdf.setFontSize(size);
  for(const row of pdf.splitTextToSize(clean(text),170)){
   if(y>269){pdf.addPage();y=20;}
   pdf.text(row,20,y);y+=Math.max(4.5,size*.45);
  }
  y+=3;
 }
 function link(title:string,url:string){
  pdf.setFontSize(9);pdf.setTextColor(32,75,56);
  for(const row of pdf.splitTextToSize(clean(title),170)){
   if(y>269){pdf.addPage();y=20;}
   pdf.textWithLink(row,20,y,{url});y+=4.5;
  }
  y+=3;pdf.setTextColor(32,60,54);
 }
 pdf.setTextColor(32,60,54);line('SITEBRIEF / SCOUTING VISIT PLAN',12);line(result.brief.city,20);
 line(`${plan.mode}. Map retrieved ${plan.createdAt}`,9);
 line(`Your brief: ${result.brief.concept}`);line(`Audience references: ${result.references.map(r=>r.name).join(', ')}`,9);
 line('WHERE TO START',12);line(plan.summary);line(plan.limit,9);
 for(const area of plan.areas){
  line(`${area.letter} / ${area.priority.toUpperCase()} / ${area.name}`,12);
  line(area.reasons[0]);line(`Nearby place label: ${area.address??'Not available'}`,9);
  link(`Open exact map point: ${area.latitude}, ${area.longitude}`,area.mapUrl);
  line(`Web research: ${area.research}${area.retrievedAt?`. Links retrieved ${area.retrievedAt}`:''}`,9);
  if(area.notes.length){line('Local notes (low confidence; locality not verified):',9);for(const note of area.notes)line(`- ${note}`,9);if(area.disclaimer)line(area.disclaimer,9);}
  line('Nearby dining returned by Qloo (sample requested within 1 km, not every competitor):',9);
  if(!area.contextAvailable)line('Nearby-business data unavailable.',9);
  else if(!area.venues.length)line('No businesses returned. Check other sources.',9);
  else for(const venue of area.venues)line(`- ${venue.name}${venue.address?`: ${venue.address}`:' (address not supplied)'}`,9);
  if(area.sources.length){line('Sources to inspect - check the address and publication date:',9);for(const source of area.sources)link(source.title,source.url);}
 }
 line('ON YOUR VISIT',12);for(const [i,check] of plan.checks.entries()){line(`${i+1}. ${check}`);line('Notes: __________________________________________________',9);}
 line('HOW THE SHORTLIST WAS MADE',12);
 line(`Qloo ranks returned audience-taste points. The popularity floor is ${result.brief.minimumPopularityPercentile??20}th local percentile. Shortlisted points are at least ${result.separationKm} km apart. ${result.rejectedCount} points were excluded by your outlet-distance rule. Rank contrast means audience-affinity percentile minus popularity percentile; it is not measured foot traffic or expected sales.`,9);
 for(let i=1;i<=pdf.getNumberOfPages();i++){pdf.setPage(i);pdf.setFontSize(8);pdf.setTextColor(80);pdf.text(`SITEBRIEF | Visit plan, not a lease recommendation | ${i} / ${pdf.getNumberOfPages()}`,20,286);}
 pdf.save('sitebrief-visit-plan.pdf');
}
