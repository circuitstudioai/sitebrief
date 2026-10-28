/** Narrow official-source location retrieval primitive. Not wired into research yet:
 * provider redirects, every-subject coverage, uncertainty and radius policy still need review.
 * Never accepts a model-authored coordinate or an arbitrary fetch URL.
 */
export type OfficialFacilityLocation = {
  sourceUrl:string; dataUrl:string; id:number; name:string; address:string;
  latitude:number; longitude:number; observedAt:string;
};
const locationPath='/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/';
const normalize=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
export function torontoFacilityId(sourceUrl:string):number|undefined {
  try {
    const u=new URL(sourceUrl);
    if(u.protocol!=='https:'||u.hostname!=='www.toronto.ca'||u.port||u.username||u.password||u.pathname!==locationPath||u.searchParams.getAll('id').length!==1)return;
    const id=u.searchParams.get('id');
    if(!id||!/^\d{1,6}$/.test(id)||Number(id)<1)return;
    return Number(id);
  }catch{return;}
}
export function parseTorontoFacilityLocation(sourceUrl:string,subject:string,raw:unknown):OfficialFacilityLocation|undefined {
  const id=torontoFacilityId(sourceUrl);
  if(!id||!raw||typeof raw!=='object'||!subject.trim())return;
  const r=raw as Record<string,unknown>;
  if(r.id!==id||typeof r.title!=='string'||normalize(r.title)!==normalize(subject)||typeof r.address!=='string'||!r.address.trim())return;
  // Do not coerce empty/null/boolean values to zero or accept a related park's point.
  const coordinate=(v:unknown)=>typeof v==='number'?v:typeof v==='string'&&/^-?\d+(?:\.\d+)?$/.test(v)?Number(v):NaN;
  const latitude=coordinate(r.lat),longitude=coordinate(r.lng);
  if(!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180)return;
  return {sourceUrl,dataUrl:`https://www.toronto.ca/data/parks/live/locations/${id}/info.json`,id,name:r.title,address:r.address,latitude,longitude,observedAt:new Date().toISOString()};
}
/** One allowlisted HTTPS request, no redirects/retries, <=8 KiB and <=3 seconds.
 * The caller must supply the independently resolved cited page, not a search guess.
 * Return undefined for unsupported or unavailable evidence; propagate caller cancellation.
 */
export async function fetchTorontoFacilityLocation(sourceUrl:string,subject:string,signal?:AbortSignal):Promise<OfficialFacilityLocation|undefined> {
  signal?.throwIfAborted();
  const id=torontoFacilityId(sourceUrl);
  if(!id||!subject.trim())return;
  const bounded=signal?AbortSignal.any([signal,AbortSignal.timeout(3000)]):AbortSignal.timeout(3000);
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  try {
    const response=await fetch(`https://www.toronto.ca/data/parks/live/locations/${id}/info.json`,{signal:bounded,redirect:'error',headers:{Accept:'application/json'}});
    if(!response.ok||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')??'')||!response.body){await response.body?.cancel();return;}
    reader=response.body.getReader();
    const chunks:Uint8Array[]=[];let size=0;
    for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192)return;chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    return parseTorontoFacilityLocation(sourceUrl,subject,JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
  }catch{signal?.throwIfAborted();return;}
  finally{try{await reader?.cancel();}catch{/* Transport already closed. */}}
}
