/** Finite telemetry vocabulary. No names, prompts, locations, IDs or free text. */
export type UsageEvent='analysis_started'|'analysis_completed'|'analysis_failed'|'pdf_downloaded'|'notes_downloaded';
export type Workflow='scout'|'explore'|'compare';
export type UsageMode='sample'|'custom';
export function safePageview(raw:string):string|null {
 try {const url=new URL(raw);if(!['http:','https:'].includes(url.protocol)||!['/','/compare'].includes(url.pathname))return null;url.search='';url.hash='';url.username='';url.password='';return url.toString();}catch{return null;}
}
export function usageField(input:unknown):string|null {
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const v=input as Record<string,unknown>;
 if(Object.keys(v).sort().join(',')!=='event,mode,workflow')return null;
 if(!['analysis_started','analysis_completed','analysis_failed','pdf_downloaded','notes_downloaded'].includes(String(v.event))||!['scout','explore','compare'].includes(String(v.workflow))||!['sample','custom'].includes(String(v.mode)))return null;
 return `${v.event}:${v.workflow}:${v.mode}`;
}
declare global { interface Window {sitebriefUsageEnabled?:boolean;} }
export function trackUsage(event:UsageEvent,workflow:Workflow,mode:UsageMode){
 if(typeof window==='undefined'||!window.sitebriefUsageEnabled||navigator.doNotTrack==='1')return;
 try{void fetch('/api/usage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,workflow,mode}),keepalive:true,credentials:'omit'}).catch(()=>{});}catch{/* Analytics never blocks the application. */}
}
