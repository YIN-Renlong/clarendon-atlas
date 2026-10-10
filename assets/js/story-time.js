(function () {
  'use strict';
  if (document.body.dataset.mode !== 'story') return;
  const C=window.ClarendonCore, R=window.CLARENDON_REGIONS, E=C.escape;
  const rows=C.decode(window.CLARENDON_DATA), $=id=>document.getElementById(id);
  const fmt=C.format, pct=C.pct, blue='#17374b', gold='#a97522';
  const regionNames=R.order.concat(['Mixed / unresolved']);
  const years=Array.from(new Set(rows.map(r=>r.cohort))).sort();
  const annual=years.map(cohort=>{
    const list=rows.filter(r=>r.cohort===cohort);
    return {cohort,year:Number(cohort.slice(0,4)),n:list.length,list,
      dphil:list.filter(r=>r.degree_type==='DPhil').length,
      countries:C.tally(list.filter(r=>r.country),'country'),
      colleges:C.tally(list.filter(r=>r.college),'college'),
      families:C.tally(list,'subject_family'),
      regions:Object.fromEntries(regionNames.map(region=>[region,list.filter(r=>R.labels[r.country].region===region).length]))};
  });
  const latest=annual[annual.length-1];
  const top5=groups=>groups.slice(0,5).reduce((sum,g)=>sum+g.n,0);
  const blocks=[[2001,2005],[2006,2010],[2011,2015],[2016,2020],[2021,2025],[2026,2026]].map(([start,end])=>{
    const list=rows.filter(r=>Number(r.cohort.slice(0,4))>=start&&Number(r.cohort.slice(0,4))<=end);
    return {start,end,list,n:list.length,label:start===end?String(start):start+'–'+String(end).slice(-2)};
  });
  const count=(list,key,value)=>list.filter(r=>r[key]===value).length;
  function facts(id,values){$('facts-'+id).innerHTML=values.map(([value,label])=>'<div><dt>'+E(label)+'</dt><dd>'+E(value)+'</dd></div>').join('');}
  function table(id,headers,values){$('table-'+id).innerHTML='<table><thead><tr>'+headers.map(v=>'<th scope="col">'+E(v)+'</th>').join('')+'</tr></thead><tbody>'+values.map(row=>'<tr>'+row.map((v,i)=>i?'<td>'+E(v)+'</td>':'<th scope="row">'+E(v)+'</th>').join('')+'</tr>').join('')+'</tbody></table>';}
  function title(id,value){$(id+'-title').textContent=value;}
  function meta(id,value){$(id+'-meta').textContent=value;}
  function takeaway(id,value){$(id+'-takeaway').innerHTML=value;}
  function text(x,y,value,anchor='start',size=12,fill='#627078'){
    return '<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" style="font-size:'+size+'px;fill:'+fill+'">'+E(value)+'</text>';
  }
  function svgPlot(id,series,{mobile=false,maximum=100,reference=null}={}){
    const w=mobile?360:1000,h=mobile?245:285,x0=mobile?48:52,x1=w-(mobile?62:86),y0=24,y1=h-42;
    const X=year=>x0+(year-2001)/25*(x1-x0),Y=value=>y1-value/maximum*(y1-y0);
    let body='';
    annual.filter(a=>a.n<50).forEach(a=>{
      const left=Math.max(x0,X(a.year-.5)),right=Math.min(x1,X(a.year+.5));
      body+='<rect x="'+left+'" y="'+y0+'" width="'+(right-left)+'" height="'+(y1-y0)+'" fill="#f2eee2"/>';
    });
    [0,maximum/2,maximum].forEach(v=>{body+='<line x1="'+x0+'" x2="'+x1+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="#dedfd7"/>'+text(x0-8,Y(v)+4,v+'%','end',mobile?13:12);});
    if(reference!==null)body+='<line x1="'+x0+'" x2="'+x1+'" y1="'+Y(reference)+'" y2="'+Y(reference)+'" stroke="#a4aba9" stroke-dasharray="4 5"/>'+text(x0,13,'Dashed reference: '+reference+'%','start',mobile?11:12);
    (mobile?[2001,2011,2021,2026]:[2001,2006,2011,2016,2021,2026]).forEach(y=>{body+=text(X(y),y1+24,y,'middle',mobile?13:12);});
    series.forEach(s=>{
      const points=annual.map(a=>({a,count:s.value(a),share:100*s.value(a)/a.n}));
      body+='<path d="'+points.map((p,i)=>(i?'L':'M')+X(p.a.year)+','+Y(p.share)).join(' ')+'" fill="none" stroke="'+s.colour+'" stroke-width="2.2"'+(s.dashed?' stroke-dasharray="6 4"':'')+'/>';
      points.forEach(p=>{
        const label=s.name+', '+p.a.cohort+': '+p.count+' / '+p.a.n+' entries ('+pct(p.count,p.a.n)+')';
        body+='<circle class="temporal-point" data-series="'+E(s.key)+'" data-year="'+p.a.year+'" data-count="'+p.count+'" data-total="'+p.a.n+'" data-share="'+p.share+'" cx="'+X(p.a.year)+'" cy="'+Y(p.share)+'" r="'+(mobile?2.8:3.5)+'" fill="'+(p.a.n<50?'#fffefa':s.colour)+'" stroke="'+s.colour+'" stroke-width="1.5" role="img" aria-label="'+E(label)+'"><title>'+E(label)+'</title></circle>';
      });
      const last=points[points.length-1];
      body+=text(x1+9,Math.max(y0+7,Math.min(y1,Y(last.share)))+4,pct(last.count,last.a.n),'start',mobile?13:15,s.colour);
    });
    const label=series.map(s=>s.name).join(' and ')+': share of each published cohort, 2001–02 to 2026–27';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" class="'+(mobile?'temporal-mobile':'temporal-desktop')+'" role="img" aria-labelledby="'+id+(mobile?'-m':'-d')+'-svg-title"><title id="'+id+(mobile?'-m':'-d')+'-svg-title">'+E(label)+'</title>'+body+'</svg>';
  }
  function plots(id,series,options={}){
    const key='<ul class="temporal-key">'+series.map(s=>'<li><i style="--swatch:'+s.colour+'" class="'+(s.dashed?'is-dashed':'')+'" aria-hidden="true"></i><span>'+E(s.name)+'</span><strong>'+s.value(latest)+' / '+latest.n+' <small>in 2026–27</small></strong></li>').join('')+'</ul>';
    return key+svgPlot(id,series,options)+svgPlot(id,series,Object.assign({},options,{mobile:true}));
  }
  const smallKey='<p class="temporal-note"><span class="hollow-marker" aria-hidden="true"></span>Hollow markers and pale shading: fewer than 50 published entries. This is a reading aid, not a completeness threshold. Lines connect observed cohorts; they are not fitted trends.</p>';
  $('cohort-ledger').innerHTML=annual.map(a=>'<div class="'+(a.n<50?'is-small':'')+'"><dt>'+E(a.cohort.replace('-','–'))+'</dt><dd>'+a.n+' <span>entries</span></dd></div>').join('');
  $('early-total').textContent=fmt(blocks[0].n);

  // 19 — Every region, on the same scale, including unresolved entries.
  const regionId='region-time',before=blocks[3],after=blocks[4];
  const regionCount=(b,region)=>b.list.filter(r=>R.labels[r.country].region===region).length;
  const asiaBefore=regionCount(before,'Asia'),asiaAfter=regionCount(after,'Asia');
  const asiaChange=100*asiaAfter/after.n-100*asiaBefore/before.n;
  title(regionId,'Asia’s share rises between the last two five-cohort blocks');
  meta(regionId,'Every cohort, 2001–02 to 2026–27 · six panels share a 0–100% scale · denominator: all entries in that cohort');
  $('chart-'+regionId).innerHTML='<div class="temporal-region-grid">'+regionNames.map(region=>{
    const series=[{key:'region:'+region,name:region,colour:R.colours[region],value:a=>a.regions[region]}];
    return '<section class="temporal-region-panel" style="--region-color:'+R.colours[region]+'"><h4>'+E(region)+'</h4>'+svgPlot('region-time-'+region.toLowerCase().replace(/[^a-z]+/g,'-'),series,{mobile:true})+'<p>'+latest.regions[region]+' / '+latest.n+' entries in 2026–27 <strong>'+pct(latest.regions[region],latest.n)+'</strong></p></section>';
  }).join('')+'</div>'+smallKey;
  facts(regionId,[[pct(asiaBefore,before.n),'Asia · '+asiaBefore+'/'+before.n+' · entry years 2016–20'],[pct(asiaAfter,after.n),'Asia · '+asiaAfter+'/'+after.n+' · entry years 2021–25'],['+'+asiaChange.toFixed(1)+' pp','Difference in pooled share · percentage points']]);
  takeaway(regionId,'<strong>The regional mix changes, but not in a straight line.</strong> Asia’s pooled share rises from '+pct(asiaBefore,before.n)+' in entry years 2016–20 to '+pct(asiaAfter,after.n)+' in 2021–25. The separate 2026–27 list has '+pct(latest.regions.Asia,latest.n)+' in Asia and '+pct(latest.regions.Americas,latest.n)+' in the Americas. Every panel uses the same scale; unresolved entries stay in the denominator. These are patterns in the published archive, not evidence of regional award rates.');
  table(regionId,['Cohort','All entries'].concat(regionNames.map(r=>r+' · count / share')),annual.map(a=>[a.cohort,a.n].concat(regionNames.map(r=>a.regions[r]+' / '+pct(a.regions[r],a.n)))));

  // 20 — Stable structure can coexist with annual variation.
  const degreeId='degree-time',recent=annual.filter(a=>a.year>=2013);
  const low=recent.reduce((a,b)=>a.dphil/a.n<b.dphil/b.n?a:b),high=recent.reduce((a,b)=>a.dphil/a.n>b.dphil/b.n?a:b);
  title(degreeId,'Since 2013, DPhil shares stay between '+pct(low.dphil,low.n)+' and '+pct(high.dphil,high.n));
  meta(degreeId,'All 26 cohorts · 0–100% scale · denominator includes other, combined and unspecified awards');
  $('chart-'+degreeId).innerHTML=plots(degreeId,[{key:'dphil',name:'DPhil',colour:blue,value:a=>a.dphil}],{reference:75})+smallKey;
  const dBefore=count(before.list,'degree_type','DPhil'),dAfter=count(after.list,'degree_type','DPhil');
  facts(degreeId,[[pct(dBefore,before.n),'DPhil · '+dBefore+'/'+before.n+' · entry years 2016–20'],[pct(dAfter,after.n),'DPhil · '+dAfter+'/'+after.n+' · entry years 2021–25'],[pct(latest.dphil,latest.n),'DPhil · '+latest.dphil+'/'+latest.n+' · 2026–27']]);
  takeaway(degreeId,'<strong>The recent degree mix is broadly steady at around four DPhils per five entries.</strong> The two latest five-cohort blocks have pooled shares of '+pct(dBefore,before.n)+' and '+pct(dAfter,after.n)+'. Individual lists still vary: the '+recent.length+' cohorts beginning in 2013 range from '+low.dphil+'/'+low.n+' in '+low.cohort.replace('-','–')+' to '+high.dphil+'/'+high.n+' in '+high.cohort.replace('-','–')+'. This is descriptive stability, not a statistical equivalence test.');
  table(degreeId,['Cohort','All entries','DPhil','Other / combined','Unspecified','DPhil share'],annual.map(a=>{const u=a.list.filter(r=>r.degree_type==='Not stated').length;return [a.cohort,a.n,a.dphil,a.n-a.dphil-u,u,pct(a.dphil,a.n)];}));

  // 21 — Re-rank within each cohort; never mistake these for fixed groups.
  const concentrationId='concentration-time';
  const countryLatest=top5(latest.countries),collegeLatest=top5(latest.colleges);
  const modern=annual.filter(a=>a.year>=2014),collegeShares=modern.map(a=>100*top5(a.colleges)/a.n);
  title(concentrationId,'The top five country groups fall below half of the 2026–27 list');
  meta(concentrationId,'All 26 cohorts · top five stated labels recalculated separately each year · both shares use the full cohort total');
  $('chart-'+concentrationId).innerHTML=plots(concentrationId,[{key:'country_top5',name:'Five largest country groups',colour:blue,value:a=>top5(a.countries)},{key:'college_top5',name:'Five largest college / hall groups',colour:gold,dashed:true,value:a=>top5(a.colleges)}],{reference:50})+smallKey;
  facts(concentrationId,[[pct(countryLatest,latest.n),'Top five countries · '+countryLatest+'/'+latest.n+' · 2026–27'],[pct(collegeLatest,latest.n),'Top five colleges · '+collegeLatest+'/'+latest.n+' · 2026–27'],[Math.min(...collegeShares).toFixed(1)+'–'+Math.max(...collegeShares).toFixed(1)+'%','Annual top-five college share · entry years 2014–26']]);
  takeaway(concentrationId,'<strong>Country concentration falls in the latest lists, while college concentration is comparatively steady.</strong> The five largest country groups account for '+countryLatest+'/'+latest.n+' entries ('+pct(countryLatest,latest.n)+') in 2026–27, the first published list below 50%. The top-five college share has stayed between '+Math.min(...collegeShares).toFixed(1)+'% and '+Math.max(...collegeShares).toFixed(1)+'% since 2014. Group membership changes each year; early lists with at most five labels mechanically reach 100%. Historical college names remain separate.');
  table(concentrationId,['Cohort','All entries','Top five countries','Their entries','Their share','Top five colleges / halls','Their entries','Their share'],annual.map(a=>[a.cohort,a.n,a.countries.slice(0,5).map(g=>g.key).join('; '),top5(a.countries),pct(top5(a.countries),a.n),a.colleges.slice(0,5).map(g=>g.key).join('; '),top5(a.colleges),pct(top5(a.colleges),a.n)]));

  // 22 — Annual leader plus every editorial family, pooled into explicit blocks.
  const subjectId='subject-time',leading=C.tally(rows,'subject_family')[0].key;
  const familyCount=a=>count(a.list,'subject_family',leading);
  let leadRun=0;
  for(let i=annual.length-1;i>=0&&annual[i].families[0].key===leading&&annual[i].families[0].n>(annual[i].families[1]?.n||0);i--)leadRun++;
  title(subjectId,'Health & medicine leads every annual list from '+annual[annual.length-leadRun].year+' onwards');
  meta(subjectId,'Annual leading-family share: 0–40% scale · below: all 17 editorial families in five-cohort blocks, plus 2026 alone');
  const families=C.tally(rows,'subject_family');
  const colour=share=>{const t=Math.min(1,share/30);return 'rgb('+[238,242,237].map((v,i)=>Math.round(v+( [23,55,75][i]-v)*t)).join(',')+')';};
  const matrix='<div class="subject-periods"><h4>How the complete subject mix compares</h4><p class="temporal-note">Entry years, grouped in five-cohort blocks. A block’s share is its family count divided by all entries in that block; it is not an average of yearly percentages. The latest cohort stands alone.</p><div class="heat-scale"><span>0%</span><i aria-hidden="true"></i><span>30%</span><small>Darker = larger share of the block</small></div><table class="period-matrix"><caption>Every family, ordered by its full-archive count. Percentages are printed in each cell.</caption><thead><tr><th scope="col">Subject family</th>'+blocks.map(b=>'<th scope="col" class="'+(b.start===2026?'latest-period':'')+'">'+b.label+'<small>n = '+fmt(b.n)+'</small></th>').join('')+'</tr></thead><tbody>'+families.map(f=>'<tr><th scope="row">'+E(f.key)+'</th>'+blocks.map(b=>{
    const n=count(b.list,'subject_family',f.key),share=100*n/b.n;
    return '<td data-family="'+E(f.key)+'" data-start="'+b.start+'" data-end="'+b.end+'" data-count="'+n+'" data-total="'+b.n+'" data-period="'+b.label+'" class="'+(b.start===2026?'latest-period':'')+'" style="background:'+colour(share)+';color:'+(share>=18?'#fffefa':blue)+'" aria-label="'+E(f.key+', '+b.label+': '+n+' of '+b.n+' entries, '+pct(n,b.n))+'">'+pct(n,b.n)+'</td>';
  }).join('')+'</tr>').join('')+'</tbody></table></div>';
  $('chart-'+subjectId).innerHTML=plots(subjectId,[{key:'family:'+leading,name:leading,colour:'#237b70',value:familyCount}],{maximum:40})+smallKey+matrix;
  facts(subjectId,[[leadRun,'Consecutive annual lists led by Health & medicine'],[pct(count(before.list,'subject_family',leading),before.n),'Health & medicine · entry years 2016–20'],[pct(count(after.list,'subject_family',leading),after.n),'Health & medicine · entry years 2021–25']]);
  takeaway(subjectId,'<strong>A persistent leading family coexists with a broad academic mix.</strong> Health & medicine ranks first in every list from 2011–12 to 2026–27. Its pooled share is almost unchanged between 2016–20 ('+pct(count(before.list,'subject_family',leading),before.n)+') and 2021–25 ('+pct(count(after.list,'subject_family',leading),after.n)+'). Other families change differently: engineering & materials moves from '+pct(count(before.list,'subject_family','Engineering & materials'),before.n)+' to '+pct(count(after.list,'subject_family','Engineering & materials'),after.n)+'. These are editorial groupings of published programme labels, not official Oxford divisions or evidence of a funding shift.');
  table(subjectId,['Cohort','Family','Family entries','All cohort entries','Share'],annual.flatMap(a=>families.map(f=>{const n=count(a.list,'subject_family',f.key);return [a.cohort,f.key,n,a.n,pct(n,a.n)];})));

  // 23 — Presence counts cohorts once, irrespective of the size of a list.
  const recurrenceId='country-continuity',leaders=C.tally(rows.filter(r=>r.country),'country').slice(0,12);
  const presence=country=>annual.filter(a=>a.list.some(r=>r.country===country)).length;
  title(recurrenceId,'The US appears in 25 lists; Canada, China and India in 23 each');
  meta(recurrenceId,'Twelve largest country groups across the full archive · all 26 cohorts · a filled marker means at least one published entry');
  $('chart-'+recurrenceId).innerHTML='<p class="temporal-note presence-key"><span class="solid-marker" aria-hidden="true"></span>At least one entry <span class="empty-marker" aria-hidden="true"></span>No entry in this snapshot. Marker size does not encode count.</p><p class="temporal-note">Entry-year labels run from 01 (2001–02) to 26 (2026–27).</p><div class="presence-matrix">'+leaders.map(g=>'<div class="presence-row"><h4>'+E(g.key)+'<small>'+presence(g.key)+' / 26 cohorts <span>· '+fmt(g.n)+' entries</span></small></h4><div class="presence-years">'+annual.map(a=>{const n=count(a.list,'country',g.key);return '<span class="presence-cell '+(n?'is-present':'is-absent')+'" data-country="'+E(g.key)+'" data-year="'+a.year+'" data-count="'+n+'" role="img" aria-label="'+E(g.key+', '+a.cohort+': '+n+' published entries')+'"><i aria-hidden="true"></i><small aria-hidden="true">'+String(a.year).slice(-2)+'</small></span>';}).join('')+'</div></div>').join('')+'</div>';
  facts(recurrenceId,[[presence('United States')+'/26','Lists containing United States entries'],[presence('Canada')+'/26','Lists containing Canada entries'],[presence('China')+'/26','Lists containing China entries · India also 23/26']]);
  takeaway(recurrenceId,'<strong>Recurrence answers a different question from total size.</strong> The UK has the largest pooled total ('+fmt(leaders.find(g=>g.key==='United Kingdom').n)+' entries), appearing in '+presence('United Kingdom')+' lists; the US appears in '+presence('United States')+' lists with '+fmt(leaders.find(g=>g.key==='United States').n)+' entries. Each cohort contributes at most one presence mark. An empty marker means no entry in this snapshot; it does not establish an absence of scholars, eligibility or a first-ever award.');
  table(recurrenceId,['Country / territory','Archive entries','Cohorts with an entry'].concat(years),leaders.map(g=>[g.key,g.n,presence(g.key)].concat(annual.map(a=>count(a.list,'country',g.key)))));

  $('story-conclusions').insertAdjacentHTML('beforeend','<p><strong>Change and continuity can be read together.</strong> Regional shares and country concentration shift, while the recent DPhil mix and leading subject family remain comparatively steady. Keeping every cohort, its denominator and its coverage limits in view makes those comparisons interpretable.</p>');
})();
