(function () {
  'use strict';
  const storyMode=document.body.dataset.mode==='story';
  const C=window.ClarendonCore;
  const all=C.decode(window.CLARENDON_DATA);
  const geo=window.CLARENDON_GEO;
  const E=C.escape;
  const blue='#17374b',gold='#b28a43',grey='#c9cbc5';
  const colours={'DPhil':blue,'MSc':gold,'MSt':'#ac6d59','MPhil':'#577b76','BCL':'#827290','MBA':'#899964','MPP':'#628aa3','MSc (Research)':'#7e9398','MSc + DPhil':'#c49c5a','MFA':'#9c8494','BPhil':'#7a6856','MJur':'#7d8b98','MLitt':'#a58576','Not stated':grey};
  const state={cohort:'all',country:'',degree:'',college:'',family:'',view:'overview',heat:'count',history:'all',small:false,search:'',sort:'name',page:0};
  const views=['overview','studies','colleges','cohorts'];
  const pageSize=15;
  let selected=[];
  const $=function(id){return document.getElementById(id);};
  const shortCollege=function(name){return name.replace(/^The /,'').replace(/ College$/,'');};
  const countryValue=function(key){return key==='Not stated'?'__missing__':key;};
  const countryLabel=function(key){return key==='__missing__'?'Country not stated':key;};
  const fmt=function(n){return C.format(n);};
  const percent=function(n,d,digits){return C.pct(n,d,digits);};
  const fraction=function(x,digits){return (x*100).toFixed(digits===undefined?1:digits)+'%';};
  function svg(id,w,h,content,label){
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" role="group" aria-labelledby="'+id+'-svg-title '+id+'-svg-desc"><title id="'+id+'-svg-title">'+E(label)+'</title><desc id="'+id+'-svg-desc">Data chart. A text explanation and an exact-value table follow the graphic.</desc>'+content+'</svg>';
  }
  function text(x,y,value,css,anchor,extra){return '<text x="'+x+'" y="'+y+'" class="'+(css||'')+'" text-anchor="'+(anchor||'start')+'" '+(extra||'')+'>'+E(value)+'</text>';}
  function line(x1,y1,x2,y2,css,extra){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="'+(css||'')+'" '+(extra||'')+'/>';}
  function interactive(action,value,tip,extra){
    if(storyMode)action='';
    return (action?'data-action="'+action+'" data-value="'+E(value)+'" role="button" ':'role="img" ')+(tip?'data-tip="'+E(tip)+'" aria-label="'+E(tip.replace(/\n/g,', '))+'" '+(storyMode?'':'tabindex="0" '):'')+(extra||'');
  }
  function nice(max){if(max<=5)return 5;if(max<=10)return 10;const step=Math.pow(10,Math.floor(Math.log10(max)));return Math.ceil(max/step*2)/2*step;}
  function countTicks(max){const raw=max/4,base=Math.pow(10,Math.floor(Math.log10(raw))),step=[1,2,5,10].map(function(n){return n*base;}).find(function(n){return n>=raw;});const out=[];for(let v=0;v<=max;v+=Math.max(1,step))out.push(v);if(out[out.length-1]!==max)out.push(max);return out;}
  function contrastLabel(hex){const rgb=[1,3,5].map(function(i){let n=parseInt(hex.slice(i,i+2),16)/255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4);});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.18?'dark-label':'light-label';}
  function empty(message){return '<div class="empty-state"><strong>No comparable entries</strong><span>'+E(message||'Try a broader selection using the filters above.')+'</span></div>';}
  function table(headers,rows){
    return '<table><thead><tr>'+headers.map(function(h){return '<th scope="col">'+E(h)+'</th>';}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(v,i){return '<td'+(typeof v==='number'?' class="num"':'')+'>'+E(v)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table>';
  }
  function card(id,title,meta,graphic,takeaway,headers,rows){
    $(id+'-title').textContent=title;
    $(id+'-meta').textContent=meta;
    $('chart-'+id).innerHTML=graphic;
    $(id+'-takeaway').innerHTML=takeaway;
    $('table-'+id).innerHTML=table(headers||[],rows||[]);
  }
  function context(rows){return (state.cohort==='all'?'All published cohorts':state.cohort)+' · '+fmt(rows.length)+(storyMode?' listed ':' selected ')+(rows.length===1?'entry':'entries');}
  function mapChart(rows){
    const regions=window.CLARENDON_REGIONS;
    const groups=C.tally(rows.filter(function(r){return r.country;}),'country');
    const mapped=groups.filter(function(g){return geo.points[g.key];});
    const mappedN=mapped.reduce(function(s,g){return s+g.n;},0);
    // Keep circle size stable when only the country selection changes.
    const scaleRows=C.filterRows(all,Object.assign({},state,{country:''}));
    const scaleGroups=C.tally(scaleRows.filter(function(r){return geo.points[r.country];}),'country');
    const scaleMax=nice(Math.max.apply(null,scaleGroups.map(function(g){return g.n;}).concat([1])));
    const R=function(n){return 27*Math.sqrt(n/scaleMax);};
    let body='<rect x="0" y="0" width="900" height="360" fill="#fffefa"/>';
    [-30,0,30,60].forEach(function(lat){const y=(83-lat)/143*360;body+=line(0,y,900,y,'gridline','stroke-dasharray="2 5"');});
    body+='<g aria-hidden="true">'+geo.paths.map(function(path){return '<path d="'+path+'" class="land"/>';}).join('')+'</g>';
    mapped.forEach(function(g){
      const p=geo.points[g.key],x=(p[0]+180)/360*900,y=(83-p[1])/143*360;
      const region=regions.labels[g.key].region,colour=regions.colours[region],active=!storyMode&&state.country===g.key;
      const tip=g.key+' · '+region+'\n'+fmt(g.n)+' entries · '+percent(g.n,rows.length)+(storyMode?' of the archive':' of selection')+(!storyMode?'\n'+(active?'Click again to clear this country':'Click to select this country'):'');
      body+='<g class="map-country'+(active?' is-selected':'')+'" '+interactive('country',g.key,tip,storyMode?'':'aria-pressed="'+String(active)+'"')+'>';
      body+='<circle cx="'+x.toFixed(2)+'" cy="'+y.toFixed(2)+'" r="'+Math.max(9,R(g.n)+3).toFixed(2)+'" fill="transparent"/>';
      if(active)body+='<circle cx="'+x.toFixed(2)+'" cy="'+y.toFixed(2)+'" r="'+(R(g.n)+4).toFixed(2)+'" fill="none" stroke="'+blue+'" stroke-width="1.6" stroke-dasharray="3 2"/>';
      body+='<circle class="region-marker" cx="'+x.toFixed(2)+'" cy="'+y.toFixed(2)+'" r="'+R(g.n).toFixed(2)+'" fill="'+colour+'" fill-opacity=".76" stroke="#fffefa" stroke-width=".8"/></g>';
    });
    // Direct labels give a useful reading without a hover or click.
    const labelled=mapped.slice(0,3);
    if(storyMode)['China','Australia','South Africa'].forEach(function(key){const group=mapped.find(function(g){return g.key===key;});if(group&&!labelled.includes(group))labelled.push(group);});
    labelled.forEach(function(g){
      const p=geo.points[g.key],x=(p[0]+180)/360*900,y=(83-p[1])/143*360;
      const label=g.key==='United States'?'US':g.key==='United Kingdom'?'UK':g.key;
      const right=x>760,lx=x+(right?-1:1)*(R(g.n)+8),ly=Math.max(17,y-R(g.n)-7);
      body+=line(x,y-R(g.n)*.5,lx+(right?5:-5),ly+2,'','stroke="'+blue+'" stroke-width=".8" pointer-events="none"');
      body+=text(lx,ly,label+' '+fmt(g.n),'map-label',right?'end':'start','pointer-events="none"');
    });
    const title=groups.length?fmt(groups.length)+' country and territory '+(groups.length===1?'label is':'labels are')+' represented':'No entries in this selection';
    const legendValues=Array.from(new Set([1,Math.max(2,Math.round(scaleMax/10)),scaleMax])).sort(function(a,b){return a-b;});
    let legendBody='';
    legendValues.forEach(function(value,i){const x=30+i*91;legendBody+='<circle cx="'+x+'" cy="'+(58-R(value))+'" r="'+R(value)+'" fill="'+blue+'" fill-opacity=".7"/>'+text(x,78,fmt(value),'axis-text','middle');});
    const legend='<div class="map-legend"><div class="map-size-key"><strong>Circle area = entries</strong><svg viewBox="0 0 270 85" role="img" aria-label="Circle size examples: '+E(legendValues.join(', '))+' entries">'+legendBody+'</svg></div><div class="map-region-key"><strong>Circle color = geographic region</strong><ul>'+regions.order.map(function(region){return '<li><i style="--region-color:'+regions.colours[region]+'" aria-hidden="true"></i>'+E(region)+'</li>';}).join('')+'</ul><p>Positions are approximate country labels. Overlapping circles remain separate groups.'+(!storyMode?' Circle sizes stay comparable when changing only the country filter.':'')+'</p></div></div>';
    const help=storyMode?'':'<div class="map-controls"><p>Click a circle to select a country. Click it again to deselect.</p>'+(state.country?'<button type="button" class="clear-country" data-clear-filter="country" aria-label="Clear country filter: '+E(countryLabel(state.country))+'">Clear '+E(countryLabel(state.country))+' <span aria-hidden="true">×</span></button>':'')+'</div>';
    const unmapped=rows.length-mappedN;
    const takeaway=rows.length?'<strong>'+fmt(mappedN)+' of '+fmt(rows.length)+' entries have a map marker.</strong> '+(unmapped?fmt(unmapped)+' '+(unmapped===1?'entry has':'entries have')+' a missing or unresolved map label; their counts remain included. ':'')+'The exact table includes every country label.':'Choose a broader selection to explore the geographic picture.';
    // An aria-label avoids a second browser-native title tooltip over custom tips.
    const mapSVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 360" role="group" aria-label="'+E(title)+'">'+body+'</svg>';
    card('map',title,context(rows)+' · color identifies region; circle area represents entries',help+(rows.length?mapSVG+legend:empty()),takeaway,['Country / territory','Region','Entries','Share of selection','Map status'],groups.map(function(g){return [g.key,regions.labels[g.key].region,g.n,percent(g.n,rows.length),geo.points[g.key]?'Mapped':'No marker'];}).concat(rows.some(function(r){return !r.country;})?[['Not stated','Mixed / unresolved',rows.filter(function(r){return !r.country;}).length,percent(rows.filter(function(r){return !r.country;}).length,rows.length),'No marker']]:[]));
    $('map-key').innerHTML=groups.slice(0,5).map(function(g){return '<button type="button" class="country-pill" data-action="country" data-value="'+E(g.key)+'" aria-pressed="'+String(state.country===g.key)+'">'+E(g.key)+'<strong>'+fmt(g.n)+'</strong></button>';}).join('');
  }
  function concentrationChart(rows){
    const groups=C.tally(rows.filter(function(r){return r.country;}),'country'),count=Math.min(5,groups.length);
    const top=groups.slice(0,count).reduce(function(s,g){return s+g.n;},0),title=count?'The largest '+count+' groups account for '+percent(top,rows.length):'No country groups to compare';
    const w=450,h=335,x0=48,x1=426,y0=24,y1=250;let body='',total=0,points=[[x0,y1]],values=[];
    [0,.25,.5,.75,1].forEach(function(v){const y=y1-v*(y1-y0);body+=line(x0,y,x1,y,'gridline');body+=text(x0-9,y+4,Math.round(v*100)+'%','axis-text','end');});
    groups.forEach(function(g,i){total+=g.n;const x=x0+(i+1)/groups.length*(x1-x0),y=y1-total/rows.length*(y1-y0);points.push([x,y]);values.push([g.key,g.n,total,percent(total,rows.length)]);});
    if(groups.length){
      const coords=points.map(function(p){return p.join(',');}).join(' ');
      body+='<polygon points="'+x0+','+y1+' '+coords+' '+x1+','+y1+'" fill="#e9eef0"/><polyline points="'+coords+'" fill="none" stroke="'+blue+'" stroke-width="2.5"/>';
      const x=x0+count/groups.length*(x1-x0),y=y1-top/rows.length*(y1-y0);
      body+=line(x,y,x,y1,'','stroke="'+gold+'" stroke-width="1" stroke-dasharray="4 4"');
      body+=line(x0,y,x,y,'','stroke="'+gold+'" stroke-width="1" stroke-dasharray="4 4"');
      body+='<circle cx="'+x+'" cy="'+y+'" r="5" fill="'+gold+'"/>';
      const lx=x>300?x-12:x+12,anchor=x>300?'end':'start';
      body+=text(lx,Math.max(18,y-15),percent(top,rows.length),'annotation',anchor);
      body+=text(lx,Math.max(32,y+3),fmt(top)+' of '+fmt(rows.length)+' entries','axis-text',anchor);
      const xticks=Array.from(new Set([0,count,Math.round(groups.length/2),groups.length])).sort(function(a,b){return a-b;});
      xticks.forEach(function(t,i){if(i>0&&t-xticks[i-1]<groups.length/15)return;const xx=x0+t/groups.length*(x1-x0);body+=text(xx,y1+21,t,'axis-text','middle');});
      body+=text((x0+x1)/2,299,'Country groups, largest first','axis-text','middle');
    }
    card('concentration',title,'Cumulative share of all selected entries · '+context(rows),groups.length?svg('concentration',w,h,body,title):empty('No country labels are available in this selection.'),groups.length?'<strong>'+E(groups.slice(0,count).map(function(g){return g.key;}).join(', '))+'</strong> '+(count===1?'accounts':'account')+' for '+fmt(top)+' entries. '+(groups.length>count?'The remaining '+(groups.length-count)+' groups make up '+percent(rows.filter(function(r){return r.country;}).length-top,rows.length)+'.':'This selection contains no other country groups.'):'Missing country labels are not assigned to a country group.',['Country, ranked','Entries','Cumulative entries','Cumulative share'],values);
  }
  function degreeChart(rows){
    const groups=C.tally(rows,'degree_type'),dphil=rows.filter(function(r){return r.degree_type==='DPhil';}).length;
    const title=rows.length?(dphil/rows.length>.5?'DPhils account for '+percent(dphil,rows.length)+' of listed entries':groups[0].key+' is the largest listed award group'):'No degree entries selected';
    let body='',x=1;
    groups.forEach(function(g){const width=g.n/rows.length*718,colour=colours[g.key]||grey;body+='<g '+interactive('degree',g.key,g.key+'\n'+fmt(g.n)+' entries · '+percent(g.n,rows.length))+'><rect x="'+x+'" y="22" width="'+width+'" height="39" fill="'+colour+'"/>';if(width>70)body+=text(x+width/2,47,percent(g.n,rows.length),contrastLabel(colour),'middle');body+='</g>';x+=width;});
    body+=text(1,11,'Share of selected entries','axis-text');body+=text(719,83,'n = '+fmt(rows.length),'axis-text','end');
    card('degree',title,context(rows)+' · explicit award type',rows.length?svg('degree',720,90,body,title):empty(),rows.length?'<strong>'+fmt(dphil)+' DPhil entries; '+fmt(rows.length-dphil)+' other, combined or unspecified awards.</strong> Award categories follow the source wording. Select a segment to explore its entries.':'No awards match the current filters.',['Award','Entries','Share'],groups.map(function(g){return [g.key,g.n,percent(g.n,rows.length)];}));
    $('degree-key').innerHTML=groups.map(function(g){return '<button type="button" data-action="degree" data-value="'+E(g.key)+'"><i style="--swatch:'+(colours[g.key]||grey)+'"></i>'+E(g.key)+' <b>'+fmt(g.n)+'</b></button>';}).join('');
  }
  function countryDegreeChart(rows){
    const minimum=state.small?1:5,groups=C.rateGroups(rows,'country',minimum).slice(0,12);
    const overall=rows.length?rows.filter(function(r){return r.degree_type==='DPhil';}).length/rows.length:0;
    const high=groups.slice().sort(function(a,b){return b.rate-a.rate||b.n-a.n;})[0],low=groups.slice().sort(function(a,b){return a.rate-b.rate||b.n-a.n;})[0];
    const title=groups.length>1?'DPhil shares range from '+fraction(low.rate,0)+' to '+fraction(high.rate,0):groups.length?groups[0].key+': '+groups[0].dphil+' of '+groups[0].n+' entries list a DPhil':'No groups meet the size threshold';
    const w=620,x0=180,x1=514,y0=35,h=Math.max(220,groups.length*33+100);let body='';
    [0,.25,.5,.75,1].forEach(function(v){const x=x0+v*(x1-x0);body+=line(x,y0-5,x,h-48,'gridline');body+=text(x,h-29,Math.round(v*100)+'%','axis-text','middle');});
    body+=line(x0+overall*(x1-x0),y0-8,x0+overall*(x1-x0),h-48,'','stroke="'+gold+'" stroke-width="1.4" stroke-dasharray="4 4"');
    body+=text(x0+overall*(x1-x0),17,(storyMode?'Archive ':'Selection ')+fraction(overall,0),'annotation','middle');
    groups.forEach(function(g,i){const y=y0+i*33+13,x=x0+g.rate*(x1-x0);body+=text(x0-14,y+4,g.key,'','end');body+=line(x0,y,x,y,'','stroke="#cbd6d8" stroke-width="2"');body+='<circle cx="'+x+'" cy="'+y+'" r="5.5" fill="'+blue+'" '+interactive('country',countryValue(g.key),g.key+'\nDPhil: '+g.dphil+' / '+g.n+' · '+fraction(g.rate))+'/>';body+=text(x1+14,y+4,g.dphil+' / '+g.n,'data-label');});
    card('country-degree',title,context(rows)+' · up to 12 largest groups with n ≥ '+minimum,groups.length?svg('country-degree',w,h,body,title):empty('No country group has at least '+minimum+' entries. Enable smaller groups or broaden the filters.'),groups.length?'<strong>'+E(high.key)+': '+high.dphil+'/'+high.n+' DPhil.</strong> '+(groups.length>1?E(low.key)+': '+low.dphil+'/'+low.n+'. ':'')+'Percentages describe these entries; small groups can produce large percentage differences.':'The size threshold makes very small groups explicit rather than treating them as stable patterns.',['Country group','Entries','DPhil','DPhil share'],groups.map(function(g){return [g.key,g.n,g.dphil,fraction(g.rate)];}));
  }
  function subjectChart(rows){
    const groups=C.tally(rows,'subject_family'),title=groups.length?groups[0].key+' is the largest subject family':'No subject families selected';
    const w=620,x0=223,x1=558,y0=10,h=Math.max(170,groups.length*27+45),max=nice(groups[0]?groups[0].n:1);let body='';
    countTicks(max).forEach(function(v){const x=x0+v/max*(x1-x0);body+=line(x,y0,x,h-34,'gridline');body+=text(x,h-12,v,'axis-text','middle');});
    groups.forEach(function(g,i){const y=y0+i*27,width=g.n/max*(x1-x0);body+=text(x0-13,y+15,g.key,'','end');body+='<rect x="'+x0+'" y="'+(y+2)+'" width="'+width+'" height="18" rx="2" fill="'+(i===0?gold:blue)+'" '+interactive('family',g.key,g.key+'\n'+g.n+' entries · '+percent(g.n,rows.length))+'/>';body+=text(x0+width+7,y+16,g.n,'data-label');});
    const top=groups.slice(0,3).reduce(function(s,g){return s+g.n;},0);
    card('subject',title,context(rows)+' · reviewed editorial families, not official Oxford divisions',groups.length?svg('subject',w,h,body,title):empty(),groups.length?'<strong>The largest '+Math.min(3,groups.length)+' families account for '+percent(top,rows.length)+'.</strong> Interdisciplinary programmes have one documented assignment. Select a family or open its exact programme titles below.':'Subject families are documented in the downloadable mapping.',['Subject family','Programme label','Entries'],C.programmeRows(rows).map(function(r){return [r.family,r.subject,r.n];}));
  }
  function collegeRankChart(rows){
    const groups=C.tally(rows,'college'),shown=groups.slice(0,12),top=groups.slice(0,5).reduce(function(s,g){return s+g.n;},0),k=Math.min(5,groups.length);
    const title=groups.length?'The largest '+k+' college groups hold '+percent(top,rows.length)+' of entries':'No colleges selected';
    const w=620,x0=183,x1=542,y0=22,h=Math.max(220,shown.length*28+66),max=nice(shown[0]?shown[0].n:1);let body='';
    countTicks(max).forEach(function(v){const x=x0+v/max*(x1-x0);body+=line(x,y0-7,x,h-36,'gridline');body+=text(x,h-14,v,'axis-text','middle');});
    shown.forEach(function(g,i){const y=y0+i*28+5,x=x0+g.n/max*(x1-x0);body+=text(x0-14,y+4,shortCollege(g.key),'','end');body+=line(x0,y,x,y,'','stroke="#ccd7d9" stroke-width="2"');body+='<circle cx="'+x+'" cy="'+y+'" r="5" fill="'+(i<5?gold:blue)+'" '+interactive('college',g.key,g.key+'\n'+g.n+' entries · '+percent(g.n,rows.length))+'/>';body+=text(x+10,y+4,g.n,'data-label');});
    card('college-rank',title,context(rows)+' · '+shown.length+' of '+groups.length+' college/hall groups shown',shown.length?svg('college-rank',w,h,body,title):empty(),groups.length?'<strong>'+E(groups[0].key)+' has '+groups[0].n+' entries.</strong> The list spans '+groups.length+' colleges and halls. These counts are not a comparison of funding or college quality.':'Choose a broader selection to compare colleges.',['College / hall','Entries','Share'],groups.map(function(g){return [g.key,g.n,percent(g.n,rows.length)];}));
  }
  function collegeDegreeChart(rows){
    const groups=C.rateGroups(rows,'college',1).slice(0,12);
    const high=groups.slice().sort(function(a,b){return b.rate-a.rate||b.n-a.n;})[0],low=groups.slice().sort(function(a,b){return a.rate-b.rate||b.n-a.n;})[0];
    const title=groups.length>1?'DPhil shares span '+fraction(low.rate,0)+'–'+fraction(high.rate,0)+' across these colleges':groups.length?shortCollege(groups[0].key)+': '+groups[0].dphil+' of '+groups[0].n+' entries list a DPhil':'No college groups selected';
    const w=620,x0=183,x1=520,y0=15,h=Math.max(200,groups.length*28+65);let body='';
    groups.forEach(function(g,i){const y=y0+i*28,wD=g.rate*(x1-x0),wO=(g.n-g.dphil-g.unknown)/g.n*(x1-x0),wU=g.unknown/g.n*(x1-x0);body+=text(x0-14,y+15,shortCollege(g.key),'','end');body+='<g '+interactive('college',g.key,g.key+'\n'+g.dphil+' / '+g.n+' DPhil · '+fraction(g.rate))+'><rect x="'+x0+'" y="'+y+'" width="'+wD+'" height="20" fill="'+blue+'"/><rect x="'+(x0+wD)+'" y="'+y+'" width="'+wO+'" height="20" fill="'+gold+'"/><rect x="'+(x0+wD+wO)+'" y="'+y+'" width="'+wU+'" height="20" fill="'+grey+'"/></g>';if(wD>65)body+=text(x0+wD/2,y+14,fraction(g.rate,0),'light-label','middle');body+=text(x1+11,y+15,'n='+g.n,'axis-text');});
    [0,.5,1].forEach(function(v){body+=text(x0+v*(x1-x0),h-13,Math.round(v*100)+'%','axis-text','middle');});
    card('college-degree',title,context(rows)+' · 12 largest groups at most; shares include all selected awards',groups.length?svg('college-degree',w,h,body,title):empty(),groups.length?'<strong>'+E(shortCollege(low.key))+': '+low.dphil+'/'+low.n+' DPhil.</strong> '+(groups.length>1?E(shortCollege(high.key))+': '+high.dphil+'/'+high.n+'. ':'')+'The denominator matters, particularly for smaller college groups.':'All award types remain part of the denominator.',['College / hall','Entries','DPhil','Other stated / combined','Unspecified','DPhil share'],groups.map(function(g){return [g.key,g.n,g.dphil,g.n-g.dphil-g.unknown,g.unknown,fraction(g.rate)];}));
  }
  function connectionsChart(rows){
    const countries=C.tally(rows,'country'),colleges=C.tally(rows,'college'),shownCountries=countries.slice(0,6),topColleges=colleges.slice(0,8);
    const columnKeys=topColleges.map(function(g){return g.key;});if(colleges.length>8)columnKeys.push('__other__');
    const cSet=new Set(topColleges.map(function(g){return g.key;}));
    const values=shownCountries.map(function(country){return columnKeys.map(function(college){return rows.filter(function(r){return (r.country||'Not stated')===country.key&&(college==='__other__'?!cSet.has(r.college):r.college===college);}).length;});});
    const maximum=state.heat==='count'?Math.max.apply(null,values.flat().concat([1])):1;
    const w=650,left=147,top=118,cw=49,ch=36,h=Math.max(250,top+shownCountries.length*ch+53);let body='';
    columnKeys.forEach(function(k,i){const label=k==='__other__'?'Other colleges':shortCollege(k);body+=text(left+i*cw+cw/2,top-13,label,'axis-text','start','transform="rotate(-48 '+(left+i*cw+cw/2)+' '+(top-13)+')"');});
    shownCountries.forEach(function(c,i){
      body+=text(left-11,top+i*ch+23,c.key,'','end');
      columnKeys.forEach(function(col,j){
        const n=values[i][j],v=state.heat==='count'?n:n/c.n,t=v/maximum,colour=n?'rgb('+[23,55,75].map(function(target){return Math.round(250+(target-250)*(.12+.88*t));}).join(',')+')':'#f0f1eb';
        const x=left+j*cw,y=top+i*ch,tip=c.key+' · '+(col==='__other__'?'Other colleges':col)+'\n'+n+' entries · '+percent(n,c.n)+' of this country group';
        body+='<rect x="'+x+'" y="'+y+'" width="'+(cw-3)+'" height="'+(ch-3)+'" rx="3" fill="'+colour+'" '+interactive(n&&col!=='__other__'?'pair':'',countryValue(c.key),tip,col!=='__other__'?'data-college="'+E(col)+'"':'')+'/>';
        body+=text(x+(cw-3)/2,y+22,state.heat==='count'?n:percent(n,c.n,0),n&&t>.66?'light-label':'dark-label','middle','pointer-events="none"');
      });
    });
    body+=text(left,h-13,state.heat==='count'?'Darker cells = more listed entries':'Darker cells = a larger share within that country','axis-text');
    const lead=countries[0],leadRows=lead?rows.filter(function(r){return (r.country||'Not stated')===lead.key;}):[],breadth=new Set(leadRows.map(function(r){return r.college;})).size;
    const title=lead?lead.key+' entries span '+breadth+' '+(breadth===1?'college':'colleges'):'No connections selected';
    const pairs=new Map();rows.forEach(function(r){const key=(r.country||'Not stated')+'\u0000'+r.college;pairs.set(key,(pairs.get(key)||0)+1);});
    const countryCounts=new Map(countries.map(function(g){return [g.key,g.n];}));
    const pairRows=Array.from(pairs,function(p){const split=p[0].split('\u0000');return [split[0],split[1],p[1],percent(p[1],countryCounts.get(split[0]))];}).sort(function(a,b){return C.collator.compare(a[0],b[0])||b[2]-a[2];});
    card('connections',title,context(rows)+' · '+shownCountries.length+' largest country groups × '+topColleges.length+' largest colleges'+(colleges.length>8?' + other colleges':''),rows.length?svg('connections',w,h,body,title):empty(),rows.length?'<strong>Read across a row to see dispersion.</strong> Percentage mode uses the complete country group as its denominator, including the “Other colleges” column. Select a non-zero cell to inspect a country–college pair.':'Every count represents a published association, not a movement between institutions.',['Country / territory','College / hall','Entries','Within-country share'],pairRows);
  }
  function breadthChart(rows){
    const groups=C.rateGroups(rows,'college',1),maxX=nice(Math.max.apply(null,groups.map(function(g){return g.n;}).concat([1]))),maxY=nice(Math.max.apply(null,groups.map(function(g){return g.countries;}).concat([1])));
    const w=620,h=405,x0=54,x1=592,y0=28,y1=340;
    const X=function(n){return x0+n/maxX*(x1-x0);},Y=function(n){return y1-n/maxY*(y1-y0);};let body='';
    countTicks(maxX).forEach(function(v){const x=X(v);body+=line(x,y0,x,y1,'gridline');body+=text(x,y1+22,v,'axis-text','middle');});
    countTicks(maxY).forEach(function(v){const y=Y(v);body+=line(x0,y,x1,y,'gridline');body+=text(x0-10,y+4,v,'axis-text','end');});
    const d=Math.min(maxX,maxY);body+=line(X(0),Y(0),X(d),Y(d),'','stroke="'+gold+'" stroke-width="1" stroke-dasharray="4 5"');
    body+=text(x0,y0-12,'Country / territory labels','axis-text');body+=text((x0+x1)/2,h-12,'Listed entries in a college group','axis-text','middle');
    const clusters=new Map();groups.forEach(function(g){const k=g.n+':'+g.countries;if(!clusters.has(k))clusters.set(k,[]);clusters.get(k).push(g);});
    clusters.forEach(function(items){
      const first=items[0],x=X(first.n),y=Y(first.countries),multiple=items.length>1,tip=(multiple?items.length+' colleges share this position\n':'')+items.map(function(g){return g.key;}).join(', ')+'\n'+first.n+' entries · '+first.countries+' country labels';
      body+='<circle cx="'+x+'" cy="'+y+'" r="'+(multiple?8:6)+'" fill="'+(multiple?gold:blue)+'" fill-opacity=".8" stroke="#fffefa" stroke-width="1.4" '+interactive(multiple?'':'college',first.key,tip)+'/>';
      if(multiple)body+=text(x,y+3,items.length,'dark-label','middle','style="font-size:9px" pointer-events="none"');
    });
    const labelled=groups.slice(0,3),widest=groups.slice().sort(function(a,b){return b.countries-a.countries||b.n-a.n;})[0];if(widest&&!labelled.some(function(g){return g.key===widest.key;}))labelled.push(widest);
    labelled.forEach(function(g,i){const x=X(g.n),y=Y(g.countries),left=i===2||x>545;body+=text(x+(left?-10:10),Math.max(16,Math.min(y1-10,y+(i===1?18:-10))),shortCollege(g.key),'axis-text',left?'end':'start');});
    const lead=groups[0],title=lead?shortCollege(lead.key)+': '+lead.n+' entries, '+lead.countries+' country labels':'No college groups selected';
    card('breadth',title,context(rows)+' · one point per college; numbered points contain overlapping colleges',groups.length?svg('breadth',w,h,body,title):empty(),'<strong>Compare breadth alongside group size.</strong> Larger groups have more opportunity to contain more country labels. These raw counts are not an inclusiveness or diversity ranking. The dashed line marks one label per entry.',['College / hall','Entries','Country / territory labels'],groups.map(function(g){return [g.key,g.n,g.countries];}));
  }
  function historyChart(){
    const base=C.filterRows(all,{degree:state.degree,college:state.college,family:state.family,cohort:'all'});
    const years=Array.from(new Set(all.map(function(r){return r.cohort;}))).sort().filter(function(y){return state.history==='all'||Number(y.slice(0,4))>=2020;});
    const within=base.filter(function(r){return years.indexOf(r.cohort)>=0;});
    const groups=C.tally(within,'country'),top=groups.map(function(g){return g.key;});
    if(state.country)top.unshift(state.country==='__missing__'?'Not stated':state.country);
    const shown=Array.from(new Set(top)).slice(0,3);
    const bins=years.map(function(y){return {cohort:y,rows:base.filter(function(r){return r.cohort===y;})};});
    const series=shown.map(function(country){return {country:country,points:bins.map(function(bin){const n=bin.rows.filter(function(r){return (r.country||'Not stated')===country;}).length;return {cohort:bin.cohort,n:n,total:bin.rows.length,share:bin.rows.length?n/bin.rows.length:null};})};});
    const maximum=Math.max.apply(null,series.flatMap(function(s){return s.points.map(function(p){return p.share===null?0:p.share;});}).concat([.1]));
    const maxY=Math.min(1,Math.ceil(maximum*10)/10),w=380,h=245,x0=40,x1=354,y0=15,y1=193;
    let title='Compare the country mix across published cohorts',biggest=null;
    series.forEach(function(s){const usable=s.points.filter(function(p){return p.share!==null;});if(usable.length>1){const first=usable[0],last=usable[usable.length-1],delta=last.share-first.share;if(!biggest||Math.abs(delta)>Math.abs(biggest.delta))biggest={country:s.country,first:first,last:last,delta:delta};}});
    if(biggest)title=biggest.country+': '+fraction(biggest.first.share)+' of '+biggest.first.cohort+' entries, '+fraction(biggest.last.share)+' of '+biggest.last.cohort;
    const graphics=series.map(function(s,index){
      const colour=[blue,gold,'#577b76'][index];let body='';
      [0,.5,1].forEach(function(v){const y=y1-v*(y1-y0);body+=line(x0,y,x1,y,'gridline');body+=text(x0-7,y+4,Math.round(v*maxY*100)+'%','axis-text','end');});
      let path='',gap=true;
      s.points.forEach(function(p,i){
        const x=x0+(years.length>1?i/(years.length-1):.5)*(x1-x0);
        if(p.share===null){gap=true;return;}
        const y=y1-p.share/maxY*(y1-y0);path+=(gap?'M':'L')+x+','+y;gap=false;
      });
      body+='<path d="'+path+'" class="series-line" stroke="'+colour+'"/>';
      s.points.forEach(function(p,i){
        if(p.share===null)return;
        const x=x0+(years.length>1?i/(years.length-1):.5)*(x1-x0),y=y1-p.share/maxY*(y1-y0),active=p.cohort===state.cohort;
        body+='<circle cx="'+x+'" cy="'+y+'" r="'+(active?5:3.3)+'" fill="'+(active?gold:colour)+'" stroke="#fffefa" stroke-width="1.2" '+interactive('cohort',p.cohort,p.cohort+' · '+s.country+'\n'+p.n+' / '+p.total+' entries · '+fraction(p.share))+'/>';
      });
      [0,Math.floor((years.length-1)/2),years.length-1].filter(function(v,i,a){return a.indexOf(v)===i;}).forEach(function(i){const x=x0+(years.length>1?i/(years.length-1):.5)*(x1-x0);body+=text(x,y1+25,years[i],'axis-text','middle');});
      const last=s.points.filter(function(p){return p.share!==null;}).pop();
      return '<div class="history-mini"><h4>'+E(s.country)+'</h4><p>'+(last?E(last.cohort)+' · '+last.n+'/'+last.total+' entries · '+fraction(last.share):'No entries within the selected scope')+'</p>'+svg('history-'+index,w,h,body,s.country+' share across cohorts')+'</div>';
    }).join('');
    const tableRows=bins.map(function(bin,i){const row=[bin.cohort,bin.rows.length];series.forEach(function(s){row.push(s.points[i].n,s.points[i].share===null?'Not available':fraction(s.points[i].share));});return row;});
    const headers=['Cohort','All entries in this scope'];shown.forEach(function(country){headers.push(country+' entries',country+' share');});
    const takeaway='<strong>Apparent changes may reflect coverage as well as cohort composition.</strong> The denominator is the published list for each year after degree, college and subject filters. A zero-sized group has no percentage and is shown as a gap. No selection probabilities or award growth can be inferred.';
    card('history',title,'Country shares of each cohort · degree, college and subject filters apply · same scale in every panel',within.length?graphics:empty('No entries match these filters in the selected year range.'),takeaway,headers,tableRows);
    const denominatorTarget=$('history-denominators');
    if(denominatorTarget)denominatorTarget.innerHTML=bins.map(function(bin){return '<span class="'+(bin.cohort===state.cohort?'selected-year':'')+'">'+E(bin.cohort)+' <b>n='+fmt(bin.rows.length)+'</b></span>';}).join('');
  }
  function initialiseSelect(id,values,emptyLabel){
    $(id).innerHTML=(emptyLabel?'<option value="">'+E(emptyLabel)+'</option>':'')+values.map(function(item){const value=typeof item==='string'?item:item.value,label=typeof item==='string'?item:item.label;return '<option value="'+E(value)+'">'+E(label)+'</option>';}).join('');
  }
  function setupFilters(){
    initialiseSelect('filter-cohort',[{value:'all',label:'All cohorts · 2001–2027'}].concat(Array.from(new Set(all.map(function(r){return r.cohort;}))).sort().reverse()),'');
    const countries=Array.from(new Set(all.map(function(r){return r.country;}).filter(Boolean))).sort(C.collator.compare);
    if(all.some(function(r){return !r.country;}))countries.push({value:'__missing__',label:'Country not stated'});
    initialiseSelect('filter-country',countries,'All countries / territories');
    initialiseSelect('filter-degree',C.tally(all,'degree_type').map(function(g){return g.key;}),'All awards');
    initialiseSelect('filter-college',Array.from(new Set(all.map(function(r){return r.college;}))).sort(C.collator.compare),'All colleges / halls');
    initialiseSelect('filter-family',Array.from(new Set(all.map(function(r){return r.subject_family;}))).sort(C.collator.compare),'All subject families');
  }
  function loadHash(){
    const params=new URLSearchParams(location.hash.replace(/^#/,''));
    ['cohort','country','degree','college','family'].forEach(function(k){const value=params.get(k);if(value!==null&&Array.from($('filter-'+k).options).some(function(o){return o.value===value;}))state[k]=value;});
    if(views.indexOf(params.get('view'))>=0)state.view=params.get('view');
    if(state.cohort!=='all'&&Number(state.cohort.slice(0,4))<2020)state.history='all';
  }
  function saveHash(){
    const p=new URLSearchParams();p.set('view',state.view);p.set('cohort',state.cohort);['country','degree','college','family'].forEach(function(k){if(state[k])p.set(k,state[k]);});
    try{history.replaceState(null,'','#'+p.toString());}catch(ignore){}
  }
  function updateHeader(){
    const s=C.summary(selected);
    $('kpi-records').textContent=fmt(s.n);
    $('kpi-countries').textContent=fmt(s.countries);
    $('kpi-colleges').textContent=fmt(s.colleges);
    $('kpi-dphil').textContent=percent(s.dphil,s.n);
    $('kpi-records-note').textContent=s.missingName?s.missingName+' placeholder name retained':'Published entries in this selection';
    $('kpi-countries-note').textContent=s.missingCountry?s.missingCountry+' entry without a country label':'Labels follow the published source';
    $('kpi-colleges-note').textContent='College and hall names standardised';
    $('kpi-dphil-note').textContent=s.n?s.dphil+' of '+fmt(s.n)+' entries':'No entries match these filters';
    const description=[state.cohort==='all'?'All 26 entry cohorts':state.cohort,state.country?countryLabel(state.country):'All countries',state.degree,state.college,state.family].filter(Boolean);
    $('selection').textContent=description.join(' · ')+' · '+fmt(s.n)+' '+(s.n===1?'entry':'entries');
    $('directory-summary').textContent=fmt(s.n)+' entries';
    const filterNames={cohort:'Cohort',country:'Country',degree:'Degree',college:'College',family:'Subject'};
    const activeKeys=['cohort','country','degree','college','family'].filter(function(k){return state[k]&&!(k==='cohort'&&state[k]==='all');});
    $('active-filters').hidden=activeKeys.length===0;
    $('active-filters').innerHTML=activeKeys.map(function(k){const label=k==='country'?countryLabel(state[k]):state[k];return '<button type="button" class="filter-chip" data-clear-filter="'+k+'" aria-label="Remove '+filterNames[k].toLowerCase()+' filter: '+E(label)+'"><span>'+filterNames[k]+': <strong>'+E(label)+'</strong></span><span aria-hidden="true">×</span></button>';}).join('');
    ['cohort','country','degree','college','family'].forEach(function(k){$('filter-'+k).value=state[k];});
    $('download-filtered').disabled=s.n===0;
    document.querySelectorAll('[data-heat]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.heat===state.heat));});
    document.querySelectorAll('[data-history]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.history===state.history));});
  }
  function renderActive(){
    if(state.view==='overview'){mapChart(selected);concentrationChart(selected);degreeChart(selected);}
    else if(state.view==='studies'){countryDegreeChart(selected);subjectChart(selected);}
    else if(state.view==='colleges'){collegeRankChart(selected);collegeDegreeChart(selected);connectionsChart(selected);breadthChart(selected);}
    else historyChart();
  }
  function render(){
    selected=C.filterRows(all,state);
    updateHeader();renderActive();renderDirectory();saveHash();
    $('tooltip').hidden=true;
  }
  function setView(view,focus){
    state.view=view;
    views.forEach(function(v){$('tab-'+v).setAttribute('aria-selected',String(v===view));$('tab-'+v).tabIndex=v===view?0:-1;$('panel-'+v).hidden=v!==view;});
    render();if(focus)$('tab-'+view).focus();
  }
  function searchText(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('en');}
  function directoryRows(){
    const query=searchText(state.search.trim());
    return selected.filter(function(r){return !query||searchText([r.name||'Name not available',r.country,r.degree,r.college,r.cohort,r.subject_family].join(' ')).includes(query);}).sort(function(a,b){
      const key=state.sort;
      if(key==='cohort')return b.cohort.localeCompare(a.cohort)||C.collator.compare(a.name||'\uffff',b.name||'\uffff');
      return C.collator.compare(a[key]||'\uffff',b[key]||'\uffff')||C.collator.compare(a.name||'\uffff',b.name||'\uffff');
    });
  }
  function renderDirectory(){
    const rows=directoryRows(),pages=Math.max(1,Math.ceil(rows.length/pageSize));state.page=Math.min(state.page,pages-1);
    const chunk=rows.slice(state.page*pageSize,(state.page+1)*pageSize);
    $('directory-table').innerHTML='<table><thead><tr><th scope="col">Name</th><th scope="col">Cohort</th><th scope="col">Country / territory</th><th scope="col">Degree / programme</th><th scope="col">College / hall</th></tr></thead><tbody>'+chunk.map(function(r){return '<tr><td>'+E(r.name||'Name not available')+(r.needs_review?'<span class="source-note" title="'+E(r.quality_flags.split(';').join(', '))+'">Source note</span>':'')+'</td><td>'+E(r.cohort)+'</td><td>'+E(r.country||'Not stated')+'</td><td>'+E(r.degree)+'</td><td>'+E(r.college)+'</td></tr>';}).join('')+(chunk.length?'':'<tr><td colspan="5">No entries match this search and the current filters.</td></tr>')+'</tbody></table>';
    $('directory-count').textContent=rows.length?(state.page*pageSize+1)+'–'+Math.min((state.page+1)*pageSize,rows.length)+' of '+fmt(rows.length)+' matching entries · page '+(state.page+1)+'/'+pages:'No matching entries';
    $('previous-page').disabled=state.page===0;$('next-page').disabled=state.page>=pages-1;
  }
  function focusAction(action,value){
    const target=Array.from(document.querySelectorAll('[data-action]')).find(function(el){return el.dataset.action===action&&el.dataset.value===value;});
    if(target&&target.focus)target.focus({preventScroll:true});
  }
  function clearFilter(key){
    if(['cohort','country','degree','college','family'].indexOf(key)<0)return;
    const previous=state[key];state[key]=key==='cohort'?'all':'';state.page=0;
    render();
    const select=$('filter-'+key);if(select)select.focus({preventScroll:true});
    if(key==='country')focusAction(key,previous);
  }
  function applyAction(element){
    const action=element.dataset.action,value=element.dataset.value;
    if(action==='pair'){
      const same=state.country===value&&state.college===element.dataset.college;
      state.country=same?'':value;state.college=same?'':element.dataset.college;
    }else if(['country','degree','college','family','cohort'].indexOf(action)>=0){
      state[action]=state[action]===value?(action==='cohort'?'all':''):value;
    }else return;
    state.page=0;state.search='';$('search').value='';
    if(state.cohort!=='all'&&Number(state.cohort.slice(0,4))<2020)state.history='all';
    render();focusAction(action,value);
  }
  function tooltipFor(element,event){
    const box=$('tooltip');box.textContent=element.dataset.tip;box.hidden=false;
    const rect=element.getBoundingClientRect?element.getBoundingClientRect():{left:20,top:20};
    const x=event&&event.clientX?event.clientX:rect.left+12,y=event&&event.clientY?event.clientY:rect.top+15;
    const width=box.offsetWidth||245,height=box.offsetHeight||80;
    box.style.left=Math.max(8,Math.min(x+13,window.innerWidth-width-12))+'px';
    box.style.top=Math.max(8,Math.min(y+15,window.innerHeight-height-12))+'px';
  }
  function download(){
    const fields=['record_id','cohort','name','country','degree','college','degree_type','subject','subject_family','needs_review','quality_flags'];
    const blob=new Blob([C.csv(selected,fields)],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='clarendon-selection-'+state.cohort+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);
  }
  let opener=null;
  function openMethods(button){opener=button;const d=$('methods');if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');}
  function closeMethods(){const d=$('methods');if(typeof d.close==='function')d.close();else d.removeAttribute('open');if(opener)opener.focus();}
  function setupEvents(){
    $('filters').addEventListener('submit',function(e){e.preventDefault();});
    ['cohort','country','degree','college','family'].forEach(function(k){$('filter-'+k).addEventListener('change',function(e){state[k]=e.target.value;state.page=0;if(k==='cohort'&&state.cohort!=='all'&&Number(state.cohort.slice(0,4))<2020)state.history='all';render();});});
    $('reset').addEventListener('click',function(){state.cohort='all';state.country='';state.degree='';state.college='';state.family='';state.search='';state.page=0;state.history='all';$('search').value='';render();});
    document.querySelectorAll('[data-tab]').forEach(function(button){button.addEventListener('click',function(){setView(button.dataset.tab,false);});button.addEventListener('keydown',function(e){let index=views.indexOf(state.view);if(e.key==='ArrowRight')index=(index+1)%views.length;else if(e.key==='ArrowLeft')index=(index+views.length-1)%views.length;else if(e.key==='Home')index=0;else if(e.key==='End')index=views.length-1;else return;e.preventDefault();setView(views[index],true);});});
    document.addEventListener('click',function(e){const clear=e.target.closest&&e.target.closest('[data-clear-filter]');if(clear){clearFilter(clear.dataset.clearFilter);return;}const target=e.target.closest&&e.target.closest('[data-action]');if(target)applyAction(target);});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')$('tooltip').hidden=true;const target=e.target.closest&&e.target.closest('svg [data-action]');if(target&&(e.key==='Enter'||e.key===' ')){e.preventDefault();applyAction(target);}});
    document.addEventListener('pointerover',function(e){const target=e.target.closest&&e.target.closest('[data-tip]');if(target)tooltipFor(target,e);});
    document.addEventListener('pointermove',function(e){const target=e.target.closest&&e.target.closest('[data-tip]');if(target&&!$('tooltip').hidden)tooltipFor(target,e);});
    document.addEventListener('pointerout',function(e){if(e.target.closest&&e.target.closest('[data-tip]'))$('tooltip').hidden=true;});
    document.addEventListener('focusin',function(e){if(e.target.dataset&&e.target.dataset.tip)tooltipFor(e.target,null);});
    document.addEventListener('focusout',function(){$('tooltip').hidden=true;});
    document.querySelectorAll('[data-open-methods]').forEach(function(b){b.addEventListener('click',function(){openMethods(b);});});
    $('close-methods').addEventListener('click',closeMethods);
    $('methods').addEventListener('click',function(e){if(e.target===$('methods')){const rect=e.target.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closeMethods();}});
    $('small-groups').addEventListener('change',function(e){state.small=e.target.checked;render();});
    document.querySelectorAll('[data-heat]').forEach(function(b){b.addEventListener('click',function(){state.heat=b.dataset.heat;render();});});
    document.querySelectorAll('[data-history]').forEach(function(b){b.addEventListener('click',function(){state.history=b.dataset.history;render();});});
    $('search').addEventListener('input',function(e){state.search=e.target.value;state.page=0;renderDirectory();});
    $('sort').addEventListener('change',function(e){state.sort=e.target.value;state.page=0;renderDirectory();});
    $('previous-page').addEventListener('click',function(){state.page=Math.max(0,state.page-1);renderDirectory();});
    $('next-page').addEventListener('click',function(){state.page++;renderDirectory();});
    $('browse-button').addEventListener('click',function(){$('directory').open=true;if($('directory').scrollIntoView)$('directory').scrollIntoView({behavior:'smooth',block:'start'});$('search').focus({preventScroll:true});});
    $('download-filtered').addEventListener('click',download);
  }
  if(storyMode){
    selected=C.filterRows(all,state);
    mapChart(selected);concentrationChart(selected);degreeChart(selected);
    countryDegreeChart(selected);subjectChart(selected);collegeRankChart(selected);
    collegeDegreeChart(selected);connectionsChart(selected);breadthChart(selected);historyChart();
    ['map-key','degree-key'].forEach(function(id){$(id).querySelectorAll('button').forEach(function(button){const span=document.createElement('span');span.className=button.className;span.innerHTML=button.innerHTML;button.replaceWith(span);});});
    document.addEventListener('pointerover',function(e){const target=e.target.closest&&e.target.closest('[data-tip]');if(target)tooltipFor(target,e);});
    document.addEventListener('pointermove',function(e){const target=e.target.closest&&e.target.closest('[data-tip]');if(target&&!$('tooltip').hidden)tooltipFor(target,e);});
    document.addEventListener('pointerout',function(){$('tooltip').hidden=true;});
    document.addEventListener('focusin',function(e){if(e.target.dataset&&e.target.dataset.tip)tooltipFor(e.target,null);});
    document.addEventListener('focusout',function(){$('tooltip').hidden=true;});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')$('tooltip').hidden=true;});
    window.addEventListener('blur',function(){$('tooltip').hidden=true;});
  }else{
    setupFilters();loadHash();setupEvents();setView(state.view,false);
  }
})();
