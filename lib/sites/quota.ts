/** Shared Redis admission. Redis owns the UTC day and atomic increment; never use local counters. */
export class QuotaError extends Error {
 constructor(message:string, public status=503, public retryAfter?:number){super(message);}
}
export const DEFAULT_DAILY_LIMIT=50;
// One environment-specific hash keeps all script keys declared (also valid on clustered Redis).
// TIME avoids trusting application clock skew; old-day state resets without a scheduled job.
export const QUOTA_SCRIPT=`
local limit=tonumber(ARGV[1])
if not limit or limit<1 or limit~=math.floor(limit) then return redis.error_reply('invalid limit') end
local now=tonumber(redis.call('TIME')[1])
local day=math.floor(now/86400)
local reset=(day+1)*86400
local state=redis.call('HMGET',KEYS[1],'day','used')
local used=0
if state[1] or state[2] then
 local storedDay=tonumber(state[1])
 local storedUsed=tonumber(state[2])
 if not storedDay or not storedUsed or storedDay~=math.floor(storedDay) or storedUsed~=math.floor(storedUsed) or storedDay>day or storedUsed<0 then
  return redis.error_reply('invalid quota state')
 end
 if storedDay==day then used=storedUsed end
end
if used>=limit then return {0,used,reset,now} end
used=used+1
redis.call('HSET',KEYS[1],'day',day,'used',used)
redis.call('EXPIREAT',KEYS[1],reset)
return {1,used,reset,now}
`;

export function redisConfiguration(){
 // A partially supplied alias must fail closed, not silently select a different database.
 const pairs=[['SITEBRIEF_REDIS_REST_URL','SITEBRIEF_REDIS_REST_TOKEN'],['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'],['KV_REST_API_URL','KV_REST_API_TOKEN']];
 const pair=pairs.find(([url,token])=>process.env[url]?.trim()||process.env[token]?.trim());
 const rawUrl=pair?process.env[pair[0]]?.trim():undefined;
 const token=pair?process.env[pair[1]]?.trim():undefined;
 let origin='';try{
  const url=new URL(rawUrl??'');
  if(url.protocol==='https:'&&/^[a-z0-9-]+\.upstash\.io$/.test(url.hostname)&&!url.username&&!url.password&&url.pathname==='/'&&!url.search&&!url.hash&&!url.port)origin=url.origin;
 }catch{}
 if(!origin||!token||/\s/.test(token))throw new QuotaError('Live analysis is unavailable until shared usage protection is configured. Recorded examples remain available.');
 return {origin,token};
}
export async function reserveLiveAnalysis(){
 const {origin,token}=redisConfiguration();
 const limit=DEFAULT_DAILY_LIMIT;
 const key=`sitebrief:budget:v2:${process.env.VERCEL_ENV==='production'?'production':'preview'}`;
 let result:unknown;
 try{
  const response=await fetch(origin,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',QUOTA_SCRIPT,'1',key,String(limit)]),signal:AbortSignal.timeout(4000),redirect:'error',cache:'no-store'});
  if(!response.ok)throw Error();const data=await response.json();if(data?.error)throw Error();result=data?.result;
 }catch{throw new QuotaError('Usage protection is unavailable. No new live analysis was started. Please try later.');}
 if(!Array.isArray(result)||result.length!==4||![0,1].includes(result[0])||!result.slice(1).every(Number.isSafeInteger))throw new QuotaError('Usage protection returned an invalid allowance. No live analysis was started.');
 const [admitted,used,reset,now]=result as number[];
 if(used<0||used>limit||(admitted?used<1:used!==limit)||now<0||reset!== (Math.floor(now/86400)+1)*86400||reset>8640000000000)throw new QuotaError('Usage protection returned an invalid allowance. No live analysis was started.');
 if(!admitted)throw new QuotaError('The shared daily live-analysis allowance is used. It resets at 00:00 UTC. Recorded examples remain available.',429,reset-now);
 return {limit,remaining:limit-used,resetsAt:new Date(reset*1000).toISOString()};
}
export function quotaResponse(error:unknown){return error instanceof QuotaError?Response.json({error:error.message},{status:error.status,headers:{'Cache-Control':'no-store',...(error.retryAfter?{'Retry-After':String(error.retryAfter)}:{})}}):null;}
