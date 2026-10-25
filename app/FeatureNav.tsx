import Link from 'next/link';
export default function FeatureNav({active}:{active:'find'|'compare'}){
 return <nav className="feature-nav" aria-label="Sitebrief features">
  <Link href="/" aria-current={active==='find'?'page':undefined}>Find areas</Link>
  <Link href="/compare" aria-current={active==='compare'?'page':undefined}>Compare locations</Link>
 </nav>;
}
