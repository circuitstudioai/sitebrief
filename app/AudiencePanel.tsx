import type {AudienceProfile,AudienceComparison} from '@/lib/sites/profile';
export default function AudiencePanel({profile,comparisons}:{profile:AudienceProfile;comparisons:AudienceComparison[]}){
 return <section className="atlas-dna" aria-labelledby="audience-dna-title">
  <div><p className="atlas-eyebrow">AUDIENCE PATTERNS / FROM QLOO</p><h2 id="audience-dna-title">What do your chosen brands and places have in common?</h2><p>These signals describe the references you chose, not the people living near a map point.</p></div>
  <div className="atlas-dna-grid">
   <div><h3>Linked interests</h3><div className="atlas-tag-list">{profile.tags.map(t=><span key={t.name}>{t.name}</span>)}</div>{!profile.tags.length&&<p>No audience interests were returned.</p>}</div>
   <div><h3>Age-related patterns</h3><p className="atlas-help">Qloo returns age-related signals for your chosen brands and places. These are not local population figures.</p>
    {profile.ageSignals.map(group=><details key={group.referenceId} className="atlas-source-log"><summary>{group.referenceName}: how to read the age signals</summary><p>A positive value indicates a positive association with this reference. These scores are not percentages of nearby residents.</p><ul>{[...group.bands].sort((a,b)=>b.score-a.score).slice(0,3).map(b=><li key={b.name}>{b.name.replaceAll('_',' ')} <strong>{b.score>0?'+':''}{b.score.toFixed(2)}</strong></li>)}</ul>{!group.bands.length&&<p>No age signals were returned for this reference.</p>}</details>)}
   </div>
   <div><h3>Related brands</h3><p>{profile.relatedBrands.map(b=>b.name).join(' · ')||'No brands returned.'}</p><p className="atlas-help">Cross-brand connections, not confirmed local businesses or partners.</p></div>
  </div>
  {profile.unavailable.length>0&&<p className="atlas-help">Unavailable: {profile.unavailable.join(', ')}.</p>}
  {comparisons.map(c=><details key={c.areaId} className="atlas-source-log"><summary>Audience comparison with {c.venue}</summary><p>Shared returned tags: {c.shared.join(', ')||'None returned'}.</p><p>Reference tags: {c.referenceTags.join(', ')||'Unavailable'}. Venue tags: {c.venueTags.join(', ')||'Unavailable'}.</p><p className="atlas-help">Different tag taxonomies or missing shared tags do not establish an unmet commercial need.</p></details>)}
 </section>;
}
