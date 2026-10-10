(function () {
  'use strict';
  if (document.body.dataset.mode !== 'story') return;
  const C=window.ClarendonCore,R=window.CLARENDON_REGIONS,E=C.escape;
  const rows=C.decode(window.CLARENDON_DATA),n=rows.length;
  const $=function(id){return document.getElementById(id);};
  const fmt=C.format,pct=C.pct;
  const regionRows=function(region){return rows.filter(function(row){return R.labels[row.country].region===region;});};
  function table(headers,values){return '<table><thead><tr>'+headers.map(function(h){return '<th scope="col">'+E(h)+'</th>';}).join('')+'</tr></thead><tbody>'+values.map(function(row){return '<tr>'+row.map(function(v,i){return '<'+(i===0?'th scope="row"':'td')+'>'+E(v)+'</'+(i===0?'th':'td')+'>';}).join('')+'</tr>';}).join('')+'</tbody></table>';}
  function facts(id,values){$('facts-'+id).innerHTML=values.map(function(v){return '<div><dt>'+E(v[1])+'</dt><dd>'+E(v[0])+'</dd></div>';}).join('');}

  $('region-overview').innerHTML=R.order.map(function(region){const count=regionRows(region).length;return '<a href="#question-'+region.toLowerCase()+'" style="--region-color:'+R.colours[region]+'"><span>'+E(region)+'</span><strong>'+fmt(count)+'</strong><small>'+pct(count,n)+' of all entries</small></a>';}).join('');
  const unresolved=regionRows('Mixed / unresolved');
  $('region-unresolved').innerHTML='<strong>'+unresolved.length+' entries remain separate:</strong> Japan/France (2), St Vincent (1) and country not stated (1). They are included in the archive total and are not split or guessed into a region. <a href="#source-geography">How regions are defined ↓</a>';

  R.order.forEach(function(region){
    const id=region.toLowerCase(),list=regionRows(region),count=list.length,colour=R.colours[region];
    const countries=C.tally(list,'country'),families=C.tally(list,'subject_family');
    const doctoral=list.filter(function(r){return r.degree_type==='DPhil';}).length;
    const unspecified=list.filter(function(r){return r.degree_type==='Not stated';}).length;
    const other=count-doctoral-unspecified,largest=countries[0];
    const collegeCount=new Set(list.map(function(r){return r.college;})).size;
    const top=countries.slice(0,5),remainder=countries.slice(5).reduce(function(s,g){return s+g.n;},0);
    const shown=remainder?top.concat([{key:'Other '+(countries.length-5)+(region==='Europe'?' groups (combined)':' labels'),n:remainder,other:true}]):top;
    let title='',conclusion='';
    if(region==='Europe'){
      title='The UK accounts for '+pct(largest.n,count)+' of Europe’s entries';
      conclusion='<strong>Europe extends well beyond its largest group.</strong> The other '+(countries.length-1)+' labels contain '+fmt(count-largest.n)+' entries ('+pct(count-largest.n,count)+'). Germany and Italy are the next largest groups. The UK total is below half of the region’s published entries.';
    }else if(region==='Asia'){
      const pair=countries.filter(function(g){return g.key==='China'||g.key==='India';}).reduce(function(s,g){return s+g.n;},0);
      title='China and India together account for '+pct(pair,count)+' of Asia’s entries';
      conclusion='<strong>Two large groups sit within a much wider regional picture.</strong> China and India contribute '+pair+' of '+count+' entries; the remaining '+(countries.length-2)+' labels contribute '+(count-pair)+'. Asia’s DPhil share is '+pct(doctoral,count)+', compared with '+pct(rows.filter(function(r){return r.degree_type==='DPhil';}).length,n)+' across the archive.';
    }else if(region==='Americas'){
      const pair=countries.filter(function(g){return g.key==='United States'||g.key==='Canada';}).reduce(function(s,g){return s+g.n;},0);
      title='The US and Canada account for '+pct(pair,count)+' of entries in the Americas';
      conclusion='<strong>The regional total is heavily concentrated in two groups.</strong> The other '+(countries.length-2)+' labels contribute '+(count-pair)+' entries ('+pct(count-pair,count)+'), including '+countries.find(function(g){return g.key==='Brazil';}).n+' from Brazil. A single regional total would hide that difference in group sizes.';
    }else if(region==='Africa'){
      title=(count-largest.n)+' of Africa’s '+count+' entries are outside South Africa';
      const singles=countries.filter(function(g){return g.n===1;}).length;
      conclusion='<strong>The largest group is just under half of the regional total.</strong> South Africa contributes '+largest.n+' entries, while the other '+(countries.length-1)+' labels contribute '+(count-largest.n)+'. '+singles+' labels have a single entry, so the individual counts matter alongside percentages.';
    }else{
      title='Australia and New Zealand account for all '+count+' listed entries in Oceania';
      conclusion='<strong>This archive shows two country groups for Oceania.</strong> Australia contributes '+largest.n+' entries ('+pct(largest.n,count)+'), and New Zealand '+countries[1].n+' ('+pct(countries[1].n,count)+'). These entries span '+collegeCount+' college and hall labels; the country-group count alone does not describe that collegiate spread.';
    }
    $(id+'-title').textContent=title;
    $(id+'-meta').textContent='All 26 cohorts · '+fmt(count)+' entries · '+countries.length+' country / territory labels · percentages below use '+region+'’s '+fmt(count)+' entries';
    $('question-'+id).style.setProperty('--region-color',colour);
    const bars='<div class="region-country-chart"><h4>Where the entries are concentrated</h4><p class="mini-chart-note">Country / territory · count and share of this region</p><div class="region-axis" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>'+shown.map(function(g){return '<div class="region-bar-row'+(g.other?' is-remainder':'')+'"><div class="region-bar-label"><span>'+E(g.key)+'</span><strong>'+fmt(g.n)+' <small>'+pct(g.n,count)+'</small></strong></div><div class="region-bar-track" aria-hidden="true"><span style="width:'+(100*g.n/count).toFixed(4)+'%"></span></div></div>';}).join('')+(remainder?(region==='Europe'?'<p class="mini-chart-note europe-remainder-note">This combined group contains '+fmt(remainder)+' entries ('+pct(remainder,count)+') across '+(countries.length-5)+' country / territory labels. It is not an individual country. <a href="#question-europe-beyond-five">See all '+(countries.length-5)+' groups in the next story ↓</a></p>':'<p class="mini-chart-note">“Other” combines '+(countries.length-5)+' labels. Every label is listed in the exact table below.</p>'):'')+'</div>';
    const segments=[['DPhil',doctoral,'#17374b'],['Other / combined awards',other,'#b28a43'],['Unspecified',unspecified,'#c9cbc5']];
    const degree='<div class="region-academics"><h4>The academic profile</h4><p class="mini-chart-note">Share of all '+fmt(count)+' entries in '+region+'</p><div class="region-degree-bar" role="img" aria-label="'+E(segments.map(function(s){return s[0]+': '+s[1]+' entries, '+pct(s[1],count);}).join('; '))+'">'+segments.filter(function(s){return s[1];}).map(function(s){return '<span style="width:'+(100*s[1]/count).toFixed(4)+'%;background:'+s[2]+';color:'+(s[0]==='DPhil'?'#fffefa':'#213540')+'" aria-hidden="true">'+(s[1]/count>.15?pct(s[1],count,0):'')+'</span>';}).join('')+'</div><ul class="region-degree-key">'+segments.filter(function(s){return s[1];}).map(function(s){return '<li><i style="--swatch:'+s[2]+'" aria-hidden="true"></i><span>'+s[0]+'</span><strong>'+fmt(s[1])+' <small>'+pct(s[1],count)+'</small></strong></li>';}).join('')+'</ul><h4 class="region-subject-heading">Leading subject families</h4><ul class="region-subjects">'+families.slice(0,3).map(function(g){return '<li><span>'+E(g.key)+'</span><strong>'+fmt(g.n)+' <small>'+pct(g.n,count)+'</small></strong></li>';}).join('')+'</ul><p class="mini-chart-note">Editorial subject families; remaining families are included in the regional total.</p></div>';
    $('chart-'+id).innerHTML=bars+degree;
    facts(id,[[fmt(count),'Published entries · '+pct(count,n)+' of archive'],[countries.length,'Country / territory labels'],[collegeCount,'College / hall labels represented']]);
    $(id+'-takeaway').innerHTML=conclusion;
    $('table-'+id).innerHTML=table(['Country / territory','Entries','Share of region','DPhil','DPhil share of country group'],countries.map(function(g){const group=list.filter(function(r){return r.country===g.key;}),d=group.filter(function(r){return r.degree_type==='DPhil';}).length;return [g.key,g.n,pct(g.n,count),d,pct(d,g.n)];}));
  });

  const exceptions=C.tally(rows.filter(function(r){return !window.CLARENDON_GEO.points[r.country];}),'country');
  $('geographic-exceptions').innerHTML=table(['No map marker','Entries','Regional treatment'],exceptions.map(function(g){const key=g.key==='Not stated'?'':g.key;return [g.key,g.n,R.labels[key].region];}));
})();
