import {fetchTorontoFacilityLocation,parseTorontoFacilityLocation,torontoFacilityId} from '../lib/sites/toronto-facility-location';
const url='https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-and-recreation-facilities/location/?id=234&title=Matty-Eckler-Recreation-Centre';
// Independently fetched official facility record, not the related playground's Photon point.
const record={id:234,title:'Matty Eckler Recreation Centre',address:'953 Gerrard St E',lat:'43.6679040188',lng:'-79.3395835221',related:[{id:'384',title:'Matty Eckler Playground'}]};
const originalFetch=global.fetch;
afterEach(()=>{global.fetch=originalFetch;});
test('official identity, address and point stay bound to the exact source facility',()=>{
 const found=parseTorontoFacilityLocation(url,record.title,record)!;
 expect(found).toMatchObject({sourceUrl:url,id:234,address:record.address,latitude:43.6679040188,longitude:-79.3395835221});
 expect(found.dataUrl).toBe('https://www.toronto.ca/data/parks/live/locations/234/info.json');
 expect(parseTorontoFacilityLocation(url,'Matty Eckler Playground',record)).toBeUndefined();
 expect(parseTorontoFacilityLocation(url,record.title,{...record,id:384})).toBeUndefined();
});
test('unsupported, ambiguous and attacker-controlled URLs cannot become request targets',async()=>{
 const fetch=jest.fn();global.fetch=fetch;
 for(const u of [url.replace('https:','http:'),url.replace('www.toronto.ca','www.toronto.ca.evil.test'),url.replace('www.toronto.ca','user@www.toronto.ca'),url.replace('www.toronto.ca','www.toronto.ca:444'),url+'&id=58',url.replace('id=234','id=0'),url.replace('/location/','/other/'),'https://127.0.0.1/?id=234']){
  expect(torontoFacilityId(u)).toBeUndefined();expect(await fetchTorontoFacilityLocation(u,record.title)).toBeUndefined();
 }
 expect(fetch).not.toHaveBeenCalled();
});
test('missing, nonfinite and coerced coordinates fail closed',()=>{
 for(const value of ['',null,undefined,true,'NaN','Infinity','43.2junk',Infinity,91])expect(parseTorontoFacilityLocation(url,record.title,{...record,lat:value})).toBeUndefined();
 expect(parseTorontoFacilityLocation(url,record.title,{...record,lng:181})).toBeUndefined();
 expect(parseTorontoFacilityLocation(url,record.title,{...record,address:''})).toBeUndefined();
});
test('retrieval uses a single derived official endpoint with redirects refused',async()=>{
 const fetch=jest.fn().mockResolvedValue(new Response(JSON.stringify(record),{headers:{'Content-Type':'application/json; charset=utf-8'}}));global.fetch=fetch;
 expect((await fetchTorontoFacilityLocation(url,record.title))?.latitude).toBe(43.6679040188);
 expect(fetch).toHaveBeenCalledTimes(1);
 expect(fetch.mock.calls[0][0]).toBe('https://www.toronto.ca/data/parks/live/locations/234/info.json');
 expect(fetch.mock.calls[0][1]).toMatchObject({redirect:'error'});
 expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
});
test('HTML, outage, invalid JSON and oversized body yield unavailable evidence without retry',async()=>{
 for(const response of [new Response('<html/>',{headers:{'Content-Type':'text/html'}}),new Response('',{status:503}),new Response('{',{headers:{'Content-Type':'application/json'}}),new Response(' '.repeat(8193),{headers:{'Content-Type':'application/json'}})]){
  const fetch=jest.fn().mockResolvedValue(response);global.fetch=fetch;
  expect(await fetchTorontoFacilityLocation(url,record.title)).toBeUndefined();expect(fetch).toHaveBeenCalledTimes(1);
 }
 const fetch=jest.fn().mockRejectedValue(new Error('redirect or network failure'));global.fetch=fetch;
 expect(await fetchTorontoFacilityLocation(url,record.title)).toBeUndefined();expect(fetch).toHaveBeenCalledTimes(1);
});
test('caller cancellation is not swallowed as evidence absence',async()=>{
 const controller=new AbortController();controller.abort(new Error('cancelled'));
 global.fetch=jest.fn();await expect(fetchTorontoFacilityLocation(url,record.title,controller.signal)).rejects.toThrow('cancelled');expect(global.fetch).not.toHaveBeenCalled();
 const active=new AbortController();global.fetch=jest.fn().mockImplementation(async()=>{active.abort(new Error('cancel during request'));throw new Error('transport');});
 await expect(fetchTorontoFacilityLocation(url,record.title,active.signal)).rejects.toThrow('cancel during request');
});
