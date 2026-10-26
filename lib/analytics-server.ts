import {usageField} from './analytics';
import {redisConfiguration} from './sites/quota';
export const USAGE_SCRIPT=`
local total=tonumber(redis.call('HGET',KEYS[1],'_total') or '0')
if total>=1000 then return 0 end
redis.call('HINCRBY',KEYS[1],ARGV[1],1)
redis.call('HINCRBY',KEYS[1],'_total',1)
redis.call('EXPIRE',KEYS[1],3024000)
return 1
`;
export async function recordUsage(input:unknown):Promise<boolean>{
 const field=usageField(input);if(!field)return false;
 const {origin,token}=redisConfiguration();
 const day=new Date().toISOString().slice(0,10);
 const env=process.env.VERCEL_ENV==='production'?'production':'preview';
 const response=await fetch(origin,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',USAGE_SCRIPT,'1',`sitebrief:usage:v1:${env}:${day}`,field]),signal:AbortSignal.timeout(2000),redirect:'error',cache:'no-store'});
 if(!response.ok)throw Error('Analytics unavailable');
 const data=await response.json();if(data?.error||![0,1].includes(data?.result))throw Error('Analytics unavailable');
 return data.result===1;
}
