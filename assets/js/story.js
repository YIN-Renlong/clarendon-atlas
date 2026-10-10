(function () {
  'use strict';
  if (document.body.dataset.mode !== 'story') return;
  const C=window.ClarendonCore,E=C.escape;
  const all=C.decode(window.CLARENDON_DATA),rows=all;
  const n=rows.length,blue='#17374b',gold='#b28a43';
  const $=function(id){return document.getElementById(id);};
  const fmt=C.format,pct=C.pct;
  const countries=C.tally(rows.filter(function(r){return r.country;}),'country'),colleges=C.tally(rows,'college'),families=C.tally(rows,'subject_family');
  const degrees=C.tally(rows,'degree_type'),dphil=rows.filter(function(r){return r.degree_type==='DPhil';}).length;
  function facts(id,items){$('facts-'+id).innerHTML=items.map(function(item){return '<div><dt>'+E(item[1])+'</dt><dd>'+E(item[0])+'</dd></div>';}).join('');}
  function takeaway(id,html){$(id+'-takeaway').innerHTML=html;}
  function text(x,y,value,css,anchor,extra){return '<text x="'+x+'" y="'+y+'" class="'+(css||'')+'" text-anchor="'+(anchor||'start')+'" '+(extra||'')+'>'+E(value)+'</text>';}
  function line(x1,y1,x2,y2){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="gridline"/>';}
  function tip(label){return 'role="img" data-tip="'+E(label)+'" aria-label="'+E(label)+'"';}
  function svg(id,w,h,body,label){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" role="group" aria-labelledby="'+id+'-svg-title"><title id="'+id+'-svg-title">'+E(label)+'</title>'+body+'</svg>';}
  function table(id,headers,values){$('table-'+id).innerHTML='<table><thead><tr>'+headers.map(function(v){return '<th scope="col">'+E(v)+'</th>';}).join('')+'</tr></thead><tbody>'+values.map(function(row){return '<tr>'+row.map(function(v){return '<td>'+E(v)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table>';}
  function meta(id,value){$(id+'-meta').textContent=value;}
  function title(id,value){$(id+'-title').textContent=value;}
  function shortCollege(s){return s.replace(/^The /,'').replace(/ College$/,'');}

  const summary=C.summary(rows);
  summary.missingAward=rows.filter(function(r){return r.degree_type==='Not stated';}).length;
  $('hero-total').textContent=fmt(n);$('story-n').textContent=fmt(n);
  $('story-countries').textContent=fmt(summary.countries);$('story-colleges').textContent=fmt(summary.colleges);
  $('story-dphil').textContent=pct(dphil,n);$('story-dphil-note').textContent=fmt(dphil)+' of '+fmt(n)+' entries';

  // 01 — Reach: a distinction between geographic coverage and group size.
  const mapped=rows.filter(function(r){return window.CLARENDON_GEO.points[r.country];}).length;
  facts('map',[[summary.countries,'Country / territory labels'],[countries[0].n,countries[0].key+' entries'],[mapped+'/'+n,'Entries with a map marker']]);
  takeaway('map','<strong>The complete archive reaches across many geographic groups.</strong> That breadth does not mean each group is equally large. '+(n-mapped)+' '+(n-mapped===1?'entry has':'entries have')+' a missing or unresolved geographic label: '+(n-mapped===1?'it remains':'they remain')+' in the totals, without a map marker.');

  // 02 — Concentration: five groups versus all other groups.
  const top5=countries.slice(0,5).reduce(function(sum,g){return sum+g.n;},0);
  const missingCountry=rows.filter(function(r){return !r.country;}).length;
  $('concentration-intro').textContent='Together, the five country groups below contain '+fmt(top5)+' of the archive’s '+fmt(n)+' published entries. The curve adds country groups from largest to smallest.';
  $('concentration-countries').innerHTML=countries.slice(0,5).map(function(g){return '<li data-country="'+E(g.key)+'" data-count="'+g.n+'"><span>'+E(g.key)+'</span><strong>'+fmt(g.n)+'</strong></li>';}).join('');
  facts('concentration',[[fmt(top5),'Entries in these five country groups'],[pct(top5,n),'Share of all '+fmt(n)+' entries'],[countries.length-5,'Other stated country labels']]);
  takeaway('concentration','<strong>These five groups contain more than half of the full archive.</strong> The other '+(countries.length-5)+' country groups contain '+fmt(n-top5-missingCountry)+' entries. '+(missingCountry?fmt(missingCountry)+(missingCountry===1?' further entry has':' further entries have')+' no stated country. ':'')+'All '+fmt(n)+' entries remain in the percentage denominator.');

  // 03 — Compare denominators directly, then name all singleton labels.
  const single=countries.filter(function(g){return g.n===1;}).sort(function(a,b){return C.collator.compare(a.key,b.key);});
  let body='';
  const tailMetrics=[{label:'Share of country labels',denominator:countries.length},{label:'Share of all entries',denominator:n}];
  const tailBars=tailMetrics.map(function(metric){return '<div class="tail-bar-row"><div><span>'+metric.label+'</span><strong>'+pct(single.length,metric.denominator)+'</strong></div><div class="tail-track" aria-hidden="true"><span style="width:'+(single.length/metric.denominator*100).toFixed(4)+'%"></span></div><p>'+single.length+' of '+fmt(metric.denominator)+(metric.denominator===n?' published entries':' distinct country labels')+'</p></div>';}).join('');
  $('chart-long-tail').innerHTML='<div class="tail-comparison"><p class="mini-chart-note">Both bars run from 0% to 100%.</p>'+tailBars+'</div><div class="single-label-directory"><h4>The '+single.length+' single-entry labels</h4><p class="mini-chart-note">Alphabetical · one published entry each across all 26 cohorts</p><ul>'+single.map(function(g){return '<li>'+E(g.key)+'</li>';}).join('')+'</ul></div>';
  title('long-tail',single.length+' of '+countries.length+' country labels have one entry');
  meta('long-tail','All 26 cohorts · the same '+single.length+' records, compared with two different totals');
  facts('long-tail',[[single.length,'Single-entry country labels'],[pct(single.length,countries.length),'Share of country labels'],[pct(single.length,n),'Share of all published entries']]);
  takeaway('long-tail','<strong>'+pct(single.length,countries.length)+' of the labels account for '+pct(single.length,n)+' of the entries.</strong> These small groups broaden the geographic picture. A single published entry does not establish a reliable pattern for a country, especially when list completeness is unknown.');
  const bins=[['1 entry',function(v){return v===1;}],['2–4 entries',function(v){return v>=2&&v<=4;}],['5–9 entries',function(v){return v>=5&&v<=9;}],['10+ entries',function(v){return v>=10;}]];
  table('long-tail',['Group size','Country labels','Share of labels','Entries','Share of entries'],bins.map(function(bin){const groups=countries.filter(function(g){return bin[1](g.n);}),count=groups.reduce(function(s,g){return s+g.n;},0);return [bin[0],groups.length,pct(groups.length,countries.length),count,pct(count,n)];}));

  // 04 — Degree structure, with every award in the visible legend.
  facts('degree',[[fmt(dphil),'DPhil entries'],[fmt(n-dphil-summary.missingAward),'Other / combined award entries'],[summary.missingAward,'Award type not stated']]);
  takeaway('degree','<strong>The pooled archive is predominantly doctoral.</strong> It contains '+fmt(dphil)+' DPhil entries, '+fmt(n-dphil-summary.missingAward)+' other or combined awards, and '+summary.missingAward+' entries without a stated award type. The '+pct(dphil,n)+' share is calculated across all records, so cohorts with longer published lists contribute more.');

  // 05 — Country comparison with a visible minimum group size.
  const countryRates=C.rateGroups(rows.filter(function(r){return r.country;}),'country',5).slice(0,12);
  const low=countryRates.slice().sort(function(a,b){return a.rate-b.rate||b.n-a.n;})[0];
  const high=countryRates.slice().sort(function(a,b){return b.rate-a.rate||b.n-a.n;})[0];
  facts('country-degree',[[low.dphil+'/'+low.n,low.key+' DPhil entries'],[high.dphil+'/'+high.n,high.key+' DPhil entries'],[countryRates.length,'Largest country groups shown']]);
  takeaway('country-degree','<strong>Country totals contain different academic profiles.</strong> '+E(low.key)+' has '+low.dphil+' DPhil entries among '+low.n+' listed entries, compared with '+high.dphil+' of '+high.n+' for '+E(high.key)+'. The groups combine different cohorts; they do not show differences in scholarship selection chances.');

  // 06 — Subject families, preserving the editorial status of the grouping.
  const leadingFamily=families[0],top3=families.slice(0,3).reduce(function(s,g){return s+g.n;},0);
  facts('subject',[[leadingFamily.n,leadingFamily.key+' entries'],[pct(leadingFamily.n,n),'Share of the complete archive'],[families.length,'Reviewed subject families']]);
  takeaway('subject','<strong>'+E(leadingFamily.key)+' is the largest family, but the academic picture extends well beyond it.</strong> The remaining '+(families.length-1)+' families contain '+pct(n-leadingFamily.n,n)+' of entries. This grouping helps reveal breadth while preserving exact programme titles in the data.');

  // 07 — Common-denominator stacked bars for the largest subject families.
  const subjectRates=C.rateGroups(rows,'subject_family',1).slice(0,8);
  const sx=244,ex=814,sh=subjectRates.length*39+58;
  body='';
  subjectRates.forEach(function(g,i){const y=12+i*39,dw=g.rate*(ex-sx),ow=(g.n-g.dphil-g.unknown)/g.n*(ex-sx),uw=g.unknown/g.n*(ex-sx);body+=text(sx-15,y+20,g.key,'','end');body+='<g '+tip(g.key+': '+g.dphil+' of '+g.n+' DPhil entries; '+pct(g.dphil,g.n))+'><rect x="'+sx+'" y="'+y+'" width="'+dw+'" height="27" rx="2" fill="'+blue+'"/><rect x="'+(sx+dw)+'" y="'+y+'" width="'+ow+'" height="27" fill="'+gold+'"/><rect x="'+(sx+dw+ow)+'" y="'+y+'" width="'+uw+'" height="27" fill="#c9cbc5"/></g>';if(dw>85)body+=text(sx+dw/2,y+18,pct(g.dphil,g.n,0),'light-label','middle');body+=text(ex+14,y+19,g.dphil+'/'+g.n,'data-label');});
  [0,.25,.5,.75,1].forEach(function(v){body+=text(sx+v*(ex-sx),sh-9,Math.round(v*100)+'%','axis-text','middle');});
  $('chart-subject-mix').innerHTML=svg('subject-mix',915,sh,body,'DPhil proportions in the eight largest subject families');
  const subjectLow=subjectRates.slice().sort(function(a,b){return a.rate-b.rate;})[0],subjectHigh=subjectRates.slice().sort(function(a,b){return b.rate-a.rate;})[0];
  title('subject-mix','DPhil shares range from '+pct(subjectLow.dphil,subjectLow.n)+' to '+pct(subjectHigh.dphil,subjectHigh.n));
  meta('subject-mix','All 26 cohorts · eight largest subject families · shares of each family; counts at right are DPhil / all entries');
  facts('subject-mix',[[subjectLow.dphil+'/'+subjectLow.n,subjectLow.key+' DPhil entries'],[subjectHigh.dphil+'/'+subjectHigh.n,subjectHigh.key+' DPhil entries'],[pct(dphil,n),'DPhil share of the whole archive']]);
  takeaway('subject-mix','<strong>The overall doctoral share conceals differences between subject families.</strong> '+E(subjectLow.key)+' has '+subjectLow.dphil+' DPhil entries among '+subjectLow.n+' records, compared with '+subjectHigh.dphil+' of '+subjectHigh.n+' in '+E(subjectHigh.key)+'. Separating degree level from total records shows different academic profiles across the archive.');
  table('subject-mix',['Subject family','Entries','DPhil','Other / combined awards','Unspecified','DPhil share'],subjectRates.map(function(g){return [g.key,g.n,g.dphil,g.n-g.dphil-g.unknown,g.unknown,pct(g.dphil,g.n)];}));

  // 08 — College concentration, with the whole network as the denominator.
  const collegeTop5=colleges.slice(0,5).reduce(function(s,g){return s+g.n;},0);
  facts('college-rank',[[colleges[0].n,colleges[0].key+' entries'],[collegeTop5,'Entries in the five largest groups'],[pct(n-collegeTop5,n),'Share in all other colleges']]);
  takeaway('college-rank','<strong>The community is distributed across a sizeable college network.</strong> Even the five largest groups together contain only '+pct(collegeTop5,n)+' of entries; the other '+(colleges.length-5)+' college/hall labels contain '+(n-collegeTop5)+'. The largest groups are only part of the collegiate picture.');

  // 09 — Similar doctoral volumes can sit behind different all-year totals.
  const collegeRates=C.rateGroups(rows,'college',1);
  const lincoln=collegeRates.find(function(g){return g.key==='Lincoln College';});
  const wolfson=collegeRates.find(function(g){return g.key==='Wolfson College';});
  const balliol=collegeRates.find(function(g){return g.key==='Balliol College';});
  title('college-degree','Lincoln and Wolfson have similar DPhil counts, despite different totals');
  facts('college-degree',[[lincoln.dphil+'/'+lincoln.n,'Lincoln: DPhil / all entries'],[wolfson.dphil+'/'+wolfson.n,'Wolfson: DPhil / all entries'],[balliol.dphil+'/'+balliol.n,'Balliol: DPhil / all entries']]);
  takeaway('college-degree','<strong>Overall record counts can reflect degree mix as well as doctoral volume.</strong> Lincoln has '+lincoln.n+' entries and Wolfson '+wolfson.n+', but their DPhil counts are '+lincoln.dphil+' and '+wolfson.dphil+'. Most of the difference in their total counts therefore lies in other or unspecified awards. These totals pool all cohorts; they do not describe one year’s intake.');

  // 10 — Connections. All colleges are included in the country denominator.
  const china=rows.filter(function(r){return r.country==='China';}),chinaColleges=new Set(china.map(function(r){return r.college;})).size;
  const leadCountry=countries[0],leadRows=rows.filter(function(r){return r.country===leadCountry.key;}),leadColleges=new Set(leadRows.map(function(r){return r.college;})).size;
  facts('connections',[[leadCountry.n+'/'+leadColleges,leadCountry.key+': entries / colleges'],[china.length+'/'+chinaColleges,'China: entries / colleges'],[colleges.length,'College / hall labels in the archive']]);
  takeaway('connections','<strong>Country groups are distributed across multiple colleges.</strong> China’s '+china.length+' entries span '+chinaColleges+' colleges, while '+E(leadCountry.key)+' entries span '+leadColleges+'. The dark “Other colleges” cells combine many institutions; they do not indicate a single large college.');

  // 11 — Highlight the comparison behind the geographic-breadth headline.
  const johns=collegeRates.find(function(g){return g.key==="St John's College";});
  title('breadth','St John’s has more country labels than Balliol, with fewer entries');
  const comparisons=[{group:johns,label:'St John’s',colour:'#237b70'},{group:balliol,label:'Balliol',colour:'#a97522'}];
  $('breadth-comparison').innerHTML=comparisons.map(function(item){return '<div style="--comparison-color:'+item.colour+'"><strong>'+item.label+'</strong><p><b>'+item.group.n+'</b> entries <span>·</span> <b>'+item.group.countries+'</b> country labels</p></div>';}).join('');
  const bw=880,bh=435,bx0=60,bx1=842,by0=35,by1=365;
  const BX=function(v){return bx0+v/200*(bx1-bx0);},BY=function(v){return by1-v/55*(by1-by0);};
  body='';
  [0,50,100,150,200].forEach(function(v){body+=line(BX(v),by0,BX(v),by1)+text(BX(v),by1+23,v,'axis-text','middle');});
  [0,10,20,30,40,50].forEach(function(v){body+=line(bx0,BY(v),bx1,BY(v))+text(bx0-12,BY(v)+4,v,'axis-text','end');});
  body+=text(bx0,16,'Distinct country / territory labels','axis-text')+text((bx0+bx1)/2,bh-12,'Published entries in a college group','axis-text','middle');
  const clusters=new Map();
  collegeRates.filter(function(g){return !comparisons.some(function(item){return item.group.key===g.key;});}).forEach(function(g){const key=g.n+':'+g.countries;if(!clusters.has(key))clusters.set(key,[]);clusters.get(key).push(g);});
  clusters.forEach(function(items){const g=items[0],x=BX(g.n),y=BY(g.countries),multi=items.length>1;body+='<circle cx="'+x+'" cy="'+y+'" r="'+(multi?9:6)+'" fill="#a8b5bd" stroke="#fffefa" stroke-width="1.2" '+tip(items.map(function(i){return i.key;}).join(', ')+': '+g.n+' entries, '+g.countries+' country labels')+'/>';if(multi)body+=text(x,y+4,items.length,'','middle','style="font-size:10px"');});
  comparisons.forEach(function(item){const g=item.group,x=BX(g.n),y=BY(g.countries);body+=line(bx0,y,x,y)+'<circle cx="'+x+'" cy="'+y+'" r="8" fill="'+item.colour+'" stroke="#fffefa" stroke-width="2" '+tip(item.label+': '+g.n+' entries, '+g.countries+' country labels')+'/>'+text(x-14,y-14,item.label,'annotation','end','fill="'+item.colour+'"')+text(x-14,y+3,g.n+' entries · '+g.countries+' labels','axis-text','end');});
  $('chart-breadth').innerHTML=svg('breadth',bw,bh,body,'St John’s: 140 entries and 49 country labels; Balliol: 167 entries and 38 labels, among 44 historical college groups');
  meta('breadth','All 26 cohorts · all '+collegeRates.length+' college / hall labels · point size does not encode entry counts');
  facts('breadth',[[balliol.n-johns.n,'Fewer entries at St John’s than Balliol'],[johns.countries-balliol.countries,'More country labels at St John’s'],[collegeRates.length,'Historical college / hall labels']]);
  takeaway('breadth','<strong>Record count and geographic breadth do not give the same ordering.</strong> St John’s has '+johns.n+' entries spanning '+johns.countries+' country labels; Balliol has '+balliol.n+' entries spanning '+balliol.countries+'. These are raw archive counts. They do not adjust for historical coverage or establish an inclusiveness or diversity ranking.');

  // 12 — Archive coverage; publication length is not an award total.
  const cohorts=C.tally(all,'cohort').sort(function(a,b){return a.key.localeCompare(b.key);});
  const max=Math.ceil(Math.max.apply(null,cohorts.map(function(g){return g.n;}))/50)*50;
  const cw=1100,x0=46,x1=1084,y0=27,y1=291,step=(x1-x0)/cohorts.length;
  body='';
  for(let tick=0;tick<=max;tick+=50){const y=y1-tick/max*(y1-y0);body+=line(x0,y,x1,y)+text(x0-10,y+4,tick,'axis-text','end');}
  cohorts.forEach(function(g,i){const x=x0+i*step+5,h=g.n/max*(y1-y0),current=g.key==='2026-27';body+='<rect x="'+x+'" y="'+(y1-h)+'" width="'+(step-10)+'" height="'+h+'" fill="'+(current?gold:Number(g.key.slice(0,4))>=2020?blue:'#b8c8cd')+'" rx="1" '+tip(g.key+': '+g.n+' published entries')+'/>';body+=text(x+(step-10)/2,y1-h-7,g.n,'axis-text','middle');body+=text(x+(step-10)/2,y1+20,g.key.slice(0,4),'axis-text','middle','style="font-size:10px"');});
  body+=text((x0+x1)/2,337,'Entry year · each bar is a published class list','axis-text','middle');
  $('chart-coverage').innerHTML=svg('coverage',cw,350,body,'Published entries by cohort from 2001–02 to 2026–27');
  title('coverage','List lengths vary; completeness is unknown');
  meta('coverage','2001–02 to 2026–27 · published entries, not annual scholarship awards');
  facts('coverage',[[all.filter(function(r){return Number(r.cohort.slice(0,4))<=2005;}).length,'Entries in the first five cohorts combined'],[cohorts.length,'Entry cohorts'],[Math.min.apply(null,cohorts.map(function(g){return g.n;}))+'–'+Math.max.apply(null,cohorts.map(function(g){return g.n;})),'Range of published-list lengths']]);
  takeaway('coverage','<strong>The archive records what was published.</strong> The source invites omitted scholars to request inclusion, so differences in list length may reflect differences in coverage. Changes in these bars cannot establish scholarship growth, decline or award totals. The first five cohorts contain only 25 entries altogether, so their percentages are especially sensitive to single records.');
  table('coverage',['Entry cohort','Published entries'],cohorts.map(function(g){return [g.key,g.n];}));

  // 13 — Every cohort is shown; endpoints illustrate counts versus shares.
  const first=all.filter(function(r){return r.cohort==='2001-02';}),last=all.filter(function(r){return r.cohort==='2026-27';});
  const firstCanada=first.filter(function(r){return r.country==='Canada';}).length,lastCanada=last.filter(function(r){return r.country==='Canada';}).length;
  title('history','Canada: more entries in the latest list, but a smaller share');
  meta('history','All 26 cohorts · 2001–02 to 2026–27 · three largest country groups in the full archive · same percentage scale');
  facts('history',[[firstCanada+'/'+first.length,'Canada-labelled entries in 2001–02'],[lastCanada+'/'+last.length,'Canada-labelled entries in 2026–27'],[cohorts.length,'Cohorts shown in every series']]);
  takeaway('history','<strong>Counts and shares answer different questions.</strong> Canada has '+firstCanada+' of '+first.length+' entries ('+pct(firstCanada,first.length)+') in the first list and '+lastCanada+' of '+last.length+' ('+pct(lastCanada,last.length)+') in the latest. A larger listed count can coexist with a smaller share when the denominator changes. All 26 cohorts are shown above; the very small early lists make percentage swings particularly sensitive to individual records.');

  $('story-conclusions').innerHTML='<p><strong>Reach and concentration belong together across the full archive.</strong> '+countries.length+' country labels show breadth; '+pct(top5,n)+' of entries in five groups shows how unevenly that breadth is populated.</p><p><strong>There are different academic communities within the whole.</strong> A '+pct(dphil,n)+' DPhil share is a useful starting point, but subject and college profiles reveal differences the overall figure hides.</p><p><strong>The archive is a record of published entries.</strong> Historical comparisons should keep coverage and denominators visible, and leave questions about scholarship totals or selection chances open.</p>';

  // Narrow screens use readable HTML bar charts instead of shrinking long SVG labels.
  function smallBars(id,groups,kind){
    const max=kind==='rate'?1:Math.max.apply(null,groups.map(function(g){return g.n;}));
    const bars=groups.map(function(g){
      const proportion=kind==='rate'?g.rate:g.n/max,label=kind==='rate'?pct(g.dphil,g.n)+' · '+g.dphil+'/'+g.n:fmt(g.n);
      const unknown=kind==='rate'&&g.unknown?'<i class="unspecified-part" style="width:'+(g.unknown/g.n*100).toFixed(4)+'%"></i>':'';
      return '<div class="small-bar-row"><div><span>'+E(g.key)+'</span><strong>'+E(label)+'</strong></div><div class="small-bar-track '+(kind==='rate'?'rate-track':'')+'" aria-hidden="true"><i style="width:'+(proportion*100).toFixed(4)+'%"></i>'+unknown+'</div></div>';
    }).join('');
    $('chart-'+id).insertAdjacentHTML('beforeend','<div class="small-screen-chart" role="group" aria-label="'+E($(id+'-title').textContent)+'"><p class="small-chart-unit">'+(kind==='rate'?'DPhil percentage · DPhil / all entries':'Published entries · bars share the same scale')+'</p>'+bars+'</div>');
    $('chart-'+id).classList.add('has-small-chart');
  }
  smallBars('country-degree',countryRates,'rate');smallBars('subject',families,'count');
  smallBars('subject-mix',subjectRates,'rate');smallBars('college-rank',colleges.slice(0,12),'count');
  smallBars('college-degree',collegeRates.slice(0,12),'rate');
  smallBars('coverage',cohorts,'count');
  const topCountries=countries.slice(0,6),topColleges=colleges.slice(0,8),topCollegeSet=new Set(topColleges.map(function(g){return g.key;}));
  const abbreviations={'United States':'US','United Kingdom':'UK','China':'China','Canada':'Canada','Australia':'Aus.','Germany':'Germany','India':'India'};
  const mobileMatrix='<div class="small-screen-chart small-matrix"><p class="small-chart-unit">Entries · countries across columns; colleges down rows</p><table><thead><tr><th scope="col">College</th>'+topCountries.map(function(g){return '<th scope="col"><abbr title="'+E(g.key)+'">'+E(abbreviations[g.key]||g.key)+'</abbr></th>';}).join('')+'</tr></thead><tbody>'+topColleges.concat([{key:'Other colleges'}]).map(function(college){return '<tr><th scope="row">'+E(shortCollege(college.key))+'</th>'+topCountries.map(function(country){const value=rows.filter(function(r){return r.country===country.key&&(college.key==='Other colleges'?!topCollegeSet.has(r.college):r.college===college.key);}).length;const intensity=value/Math.max.apply(null,topCountries.map(function(g){return g.n;}));return '<td style="background:rgba(23,55,75,'+(intensity*.3).toFixed(3)+')">'+value+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>';
  $('chart-connections').insertAdjacentHTML('beforeend',mobileMatrix);$('chart-connections').classList.add('has-small-chart');

  // Story numbers and explanations stay visible; exact tables remain optional.
  document.querySelectorAll('.story-facts > div').forEach(function(el){el.style.display='flex';el.style.flexDirection='column';el.querySelector('dd').style.order='-1';});
})();
