(function (root) {
  'use strict';
  const collator = new Intl.Collator('en', {sensitivity:'base', numeric:true});
  const number = new Intl.NumberFormat('en-GB');
  function decode(dataset) { return dataset.rows.map(function(row){const item={};dataset.fields.forEach(function(k,i){item[k]=row[i];});return item;}); }
  function tally(rows,key) { const counts=new Map();rows.forEach(function(r){const value=r[key]||'Not stated';counts.set(value,(counts.get(value)||0)+1);});return Array.from(counts,function(pair){return {key:pair[0],n:pair[1]};}).sort(function(a,b){return b.n-a.n||collator.compare(a.key,b.key);}); }
  function filterRows(rows,filters) { return rows.filter(function(r){return (!filters.cohort||filters.cohort==='all'||r.cohort===filters.cohort)&&(!filters.country||(filters.country==='__missing__'?!r.country:r.country===filters.country))&&(!filters.degree||r.degree_type===filters.degree)&&(!filters.college||r.college===filters.college)&&(!filters.family||r.subject_family===filters.family);}); }
  function summary(rows) { return {n:rows.length,countries:new Set(rows.map(function(r){return r.country;}).filter(Boolean)).size,colleges:new Set(rows.map(function(r){return r.college;}).filter(Boolean)).size,dphil:rows.filter(function(r){return r.degree_type==='DPhil';}).length,missingCountry:rows.filter(function(r){return !r.country;}).length,missingName:rows.filter(function(r){return !r.name;}).length,review:rows.filter(function(r){return r.needs_review;}).length}; }
  function rateGroups(rows,key,min) { return tally(rows,key).filter(function(g){return g.n>=min;}).map(function(g){const group=rows.filter(function(r){return (r[key]||'Not stated')===g.key;});const dphil=group.filter(function(r){return r.degree_type==='DPhil';}).length;const unknown=group.filter(function(r){return r.degree_type==='Not stated';}).length;return {key:g.key,n:g.n,dphil:dphil,unknown:unknown,rate:dphil/g.n,countries:new Set(group.map(function(r){return r.country;}).filter(Boolean)).size};}); }
  function pct(value,denominator,digits) { if(!denominator)return '—';return (value/denominator*100).toFixed(digits===undefined?1:digits)+'%'; }
  function format(value) { return number.format(value); }
  function escape(value) { return String(value===null||value===undefined?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function csv(rows,fields) { const quote=function(v){let s=String(v===null||v===undefined?'':v);if(/^[=+@\t\r]/.test(s)||/^-\D/.test(s))s="'"+s;return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};return '\uFEFF'+[fields].concat(rows.map(function(r){return fields.map(function(k){return r[k];});})).map(function(r){return r.map(quote).join(',');}).join('\r\n')+'\r\n'; }
  function programmeRows(rows) { const out=new Map();rows.forEach(function(r){const key=r.subject_family+'\u0000'+r.subject;const item=out.get(key)||{family:r.subject_family,subject:r.subject,n:0};item.n++;out.set(key,item);});return Array.from(out.values()).sort(function(a,b){return collator.compare(a.family,b.family)||b.n-a.n||collator.compare(a.subject,b.subject);}); }
  const api={decode:decode,tally:tally,filterRows:filterRows,summary:summary,rateGroups:rateGroups,pct:pct,format:format,escape:escape,csv:csv,programmeRows:programmeRows,collator:collator};
  root.ClarendonCore=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
