/** Operator-only CLI. Never expose the Redis credential in a browser or URL. */
import {redisConfiguration} from '../lib/sites/quota';
async function main(){
 const days=Number(process.env.ANALYTICS_REPORT_DAYS??7);
 if(!Number.isInteger(days)||days<1||days>31)throw Error('Use 1–31 days');
 const {origin,token}=redisConfiguration();
 const env=process.env.VERCEL_ENV==='production'?'production':'preview';
 const dates=Array.from({length:days},(_,i)=>new Date(Date.now()-i*86400000).toISOString().slice(0,10));
 const response=await fetch(`${origin}/pipeline`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(dates.map(day=>['HGETALL',`sitebrief:usage:v1:${env}:${day}`])),redirect:'error',signal:AbortSignal.timeout(5000),cache:'no-store'});
 if(!response.ok)throw Error('Report unavailable');
 const rows=await response.json();
 if(!Array.isArray(rows)||rows.length!==days||rows.some(row=>row.error||!Array.isArray(row.result)))throw Error('Report unavailable');
 console.log(JSON.stringify({environment:env,timezone:'UTC',capPerDay:1000,days:dates.map((day,i)=>({day,counts:Object.fromEntries(Array.from({length:rows[i].result.length/2},(_,j)=>[rows[i].result[j*2],Number(rows[i].result[j*2+1])]))}))},null,2));
}
main().catch(()=>{console.error('Analytics report unavailable. Check server-side Redis configuration and day range.');process.exitCode=1;});
