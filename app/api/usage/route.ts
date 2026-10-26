import {recordUsage} from '@/lib/analytics-server';
import {usageField} from '@/lib/analytics';
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(request.headers.get('origin')!==new URL(request.url).origin)return new Response(null,{status:403,headers});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return new Response(null,{status:415,headers});
 const reader=request.body?.getReader();if(!reader)return new Response(null,{status:400,headers});
 let size=0;const chunks:Uint8Array[]=[];
 try{
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>256){await reader.cancel();return new Response(null,{status:413,headers});}chunks.push(value);}
  let input:unknown;try{input=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return new Response(null,{status:400,headers});}if(!usageField(input))return new Response(null,{status:400,headers});
  const recorded=await recordUsage(input);return new Response(null,{status:recorded?202:429,headers});
 }catch{return new Response(null,{status:503,headers});}
}
