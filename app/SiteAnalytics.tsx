'use client';
import {useEffect,useSyncExternalStore} from 'react';
import {Analytics} from '@vercel/analytics/next';
import {safePageview} from '@/lib/analytics';
export default function SiteAnalytics({enabled}:{enabled:boolean}){
 const allowed=useSyncExternalStore(()=>()=>{},()=>enabled&&navigator.doNotTrack!=='1',()=>false);
 useEffect(()=>{const active=enabled&&navigator.doNotTrack!=='1';window.sitebriefUsageEnabled=active;return()=>{window.sitebriefUsageEnabled=false;};},[enabled]);
 if(!allowed)return null;
 return <Analytics beforeSend={event=>{const url=safePageview(event.url);return url?{...event,url}:null;}}/>;
}
