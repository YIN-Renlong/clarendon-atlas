#!/usr/bin/env python3
"""Regenerate browser data from the included CSVs; Python standard library only."""
from pathlib import Path
from datetime import datetime
import csv, json, shutil, hashlib, argparse, re
from time_series import temporal_outputs
from subject_detail import subject_outputs
from europe_detail import europe_outputs

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'assets' / 'data'
JS = ROOT / 'assets' / 'js'

def backup(path):
    if path.exists():
        folder = ROOT / '_patch_backups' / datetime.now().strftime('%Y%m%d-%H%M%S-%f')
        target = folder / path.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)

def write_if_changed(path, text):
    if path.exists() and path.read_text(encoding='utf-8') == text:
        print('Unchanged:', path.relative_to(ROOT))
        return
    backup(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')
    print('Updated:', path.relative_to(ROOT))

def suggest_family(subject):
    """Transparent editorial grouping. It is not Oxford's division taxonomy."""
    s = subject.casefold()
    rules = [
        ('Theology & religion', r'theolog|religio|christian|judaism|jewish|islamic'),
        ('Philosophy', r'philosoph'),
        ('Arts, music & film', r'fine art|history of art|music|film'),
        ('History & archaeology', r'histor|archaeolog|egyptolog|byzantine|medieval studies|cuneiform'),
        ('Languages & area studies', r'language|literat|linguist|philolog|english|oriental|asian|middle east|african studies|japanese|chinese|slavonic|russian|latin american|celtic|classical|greek|contemporary india|global and area|modern south asian'),
        ('Law', r'\blaw\b|juris|legal|criminolog'),
        ('Economics & business', r'econom|finance|financial|business|management'),
        ('Politics & public affairs', r'politic|public policy|international relations|diploma|governance|global governance'),
        ('Education & social sciences', r'education|anthropolog|sociolog|social|migration|refugee|development studies|international development|women.?s.*gender|demograph'),
        ('Computing & data', r'computer|cyber|digital|information|intelligent earth|autonomous'),
        ('Mathematics & statistics', r'mathemat|statistics|statistical|differential|numerical'),
        ('Geography & environment', r'geograph|environment|earth science|biodiversity|water science|sustainable urban|nature.*society'),
        ('Engineering & materials', r'engineering|materials|nanotechnology|superconduct|industrially|oil and gas'),
        ('Physics & astronomy', r'physics|astrophys|atomic|laser|condensed matter|astronom|atmospheric|particle'),
        ('Chemistry', r'chemistry|chemical|synthesis|theory and modelling'),
        ('Health & medicine', r'medic|clinical|health|cancer|oncolog|neuro|psychiatr|psycholog|therap|surg|pharm|immunolog|epidemiolog|embryolog|radiobiolog|radiation biolog|musculoskeletal|cardiovascular|ophthalm|reproductive|obstetric|patholog|infection|paediatric|molecular and cellular'),
        ('Biology & biosciences', r'biolog|bioscien|biochem|genetic|genom|physiolog|zoolog|plant|cell|chromosome|life science|structural|biomedical'),
    ]
    for family, pattern in rules:
        if re.search(pattern, s):
            return family
    return 'Other / interdisciplinary'

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--initial-mapping', action='store_true', help='Create a subject mapping only if none exists.')
    args=parser.parse_args()
    source=DATA/'clarendon-scholars-clean.csv'
    if not source.is_file():
        raise SystemExit(f'Missing source CSV: {source}')
    with source.open(encoding='utf-8-sig',newline='') as f:
        rows=list(csv.DictReader(f))
    mapping_path=DATA/'subject-families.csv'
    if not mapping_path.exists():
        if not args.initial_mapping:
            raise SystemExit('Missing subject-families.csv; use --initial-mapping to create the initial editorial mapping.')
        with mapping_path.open('w',encoding='utf-8-sig',newline='') as f:
            w=csv.writer(f);w.writerow(['subject','subject_family','mapping_note'])
            for subject in sorted({r['subject'] for r in rows}):
                w.writerow([subject,suggest_family(subject),'Editorial grouping for exploration; not an official Oxford classification.'])
    with mapping_path.open(encoding='utf-8-sig',newline='') as f:
        mappings=list(csv.DictReader(f))
    mapping={r['subject']:r['subject_family'] for r in mappings}
    if len(mapping)!=len(mappings):
        raise SystemExit('Duplicate subject labels in subject-families.csv.')
    missing=sorted({r['subject'] for r in rows}-set(mapping))
    if missing:
        raise SystemExit('Add mappings for these subject labels: '+', '.join(missing))
    with (DATA/'degree-levels.csv').open(encoding='utf-8-sig', newline='') as stream:
        degree_rows=list(csv.DictReader(stream))
    with (DATA/'subject-fields.csv').open(encoding='utf-8-sig', newline='') as stream:
        field_rows=list(csv.DictReader(stream))
    degree_labels={r['degree']:r for r in degree_rows}
    field_labels={r['subject']:r for r in field_rows}
    if len(degree_labels)!=len(degree_rows) or set(degree_labels)!={r['degree'] for r in rows}:
        raise SystemExit('degree-levels.csv must map each full degree label exactly once.')
    if len(field_labels)!=len(field_rows) or set(field_labels)!=set(mapping):
        raise SystemExit('subject-fields.csv must map each subject exactly once.')
    level_order=['DPhil', "Master's level", 'Combined / doctoral pathway', 'Not stated']
    field_order=['Humanities & arts','Social sciences','Science & technology','Health & medicine']
    for row in rows:
        assignment=degree_labels[row['degree']]
        if assignment['degree_type']!=row['degree_type'] or assignment['study_level'] not in level_order:
            raise SystemExit('Invalid degree mapping: '+row['degree'])
        field=field_labels[row['subject']]
        if field['subject_family']!=mapping[row['subject']] or field['broad_field'] not in field_order:
            raise SystemExit('Invalid field mapping: '+row['subject'])
        row['study_level']=assignment['study_level']
        row['broad_field']=field['broad_field']
    classifications={
        'levels':{'order':level_order,'colours':{'DPhil':'#17374b',"Master's level":'#b28a43','Combined / doctoral pathway':'#237b70','Not stated':'#c9cbc5'}},
        'fields':{'order':field_order,'colours':{'Humanities & arts':'#756294','Social sciences':'#365f86','Science & technology':'#237b70','Health & medicine':'#946515'},'basis':'Editorial broad fields, with documented subject-level boundary choices; not official Oxford divisions.'}
    }
    write_if_changed(JS/'classifications.js','window.CLARENDON_CLASSIFICATIONS = '+json.dumps(classifications,ensure_ascii=False,separators=(',',':'))+';\n')
    fields=['record_id' ,'cohort','name','country','degree','college','degree_type','subject','subject_family','study_level','broad_field','needs_review','quality_flags']
    compact=[]
    for r in rows:
        r['subject_family']=mapping[r['subject']]
        r['needs_review']=r['needs_review']=='true'
        compact.append([r[k] for k in fields])
    meta={
        'version':'0.6a','snapshot':'9 October 2026','recordCount':len(rows),
        'sourceUrl':'https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/scholar-class-lists',
        'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'scope':'Published list entries; not a complete register of awards or a count of unique people.'
    }
    write_if_changed(JS/'data.js','window.CLARENDON_DATA = '+json.dumps({'meta':meta,'fields':fields,'rows':compact},ensure_ascii=False,separators=(',',':'))+';\n')

    geographic_path=DATA/'natural-earth-countries.geojson'
    if not geographic_path.is_file():
        raise SystemExit(f'Missing geographic source: {geographic_path}')
    geo=json.loads(geographic_path.read_text())
    aliases={'United States':'United States of America','Congo (Democratic Republic)':'Democratic Republic of the Congo','Congo (Republic of)':'Republic of the Congo','South Korea':'South Korea','Czech Republic':'Czechia'}
    feature_index={}
    paths=[]
    for feature in geo['features']:
        p=feature['properties']
        for k in ['NAME','ADMIN','NAME_LONG','NAME_EN','NAME_SORT']:
            feature_index[p[k]]=p
        if p['ADMIN']=='Antarctica':
            continue
        geom=feature['geometry'];polys=geom['coordinates'] if geom['type']=='MultiPolygon' else [geom['coordinates']]
        for poly in polys:
            ring=poly[0]
            # Equirectangular background, with polar clipping and wrapped-edge splits.
            path='';previous=None
            for lon,lat in ring:
                x=round((lon+180)/360*900,1); y=round((83-max(-60,min(83,lat)))/143*360,1)
                command='M' if previous is None or abs(x-previous)>450 else 'L'
                path+=f'{command}{x},{y}';previous=x
            paths.append(path+'Z')
    supplements={
        'Singapore':[103.82,1.35],'Hong Kong':[114.17,22.3],'Macau':[113.55,22.2],
        'Malta':[14.38,35.94],'Maldives':[73.22,3.2],'Barbados':[-59.55,13.18],
        'Guernsey':[-2.59,49.46],
    }
    points={};unmapped=[]
    for country in sorted({r['country'] for r in rows if r['country']}):
        if country in ['Japan/France','St Vincent','Palestine','Palestinian Territories']:
            unmapped.append(country);continue
        if country in supplements:
            points[country]=supplements[country];continue
        p=feature_index.get(aliases.get(country,country))
        if p:
            points[country]=[p['LABEL_X'],p['LABEL_Y']]
        else:
            unmapped.append(country)
    write_if_changed(JS/'geography.js','window.CLARENDON_GEO = '+json.dumps({'paths':paths,'points':points,'unmapped':unmapped,'attribution':'Natural Earth 1:110m, public domain. Symbols use approximate country label positions, not individual locations.','source':'https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson'},separators=(',',':'))+';\n')
    with (DATA/'country-regions.csv').open(encoding='utf-8-sig', newline='') as stream:
        region_rows=list(csv.DictReader(stream))
    region_labels={r['country']:{'region':r['region'],'subregion':r['subregion'],'note':r['assignment_note']} for r in region_rows}
    if len(region_labels)!=len(region_rows) or set(region_labels)!={r['country'] for r in rows}:
        raise SystemExit('country-regions.csv must map every source country label exactly once, including the missing label.')
    region_order=['Europe','Asia','Americas','Africa','Oceania']
    region_colours={'Europe':'#365f86','Asia':'#237b70','Americas':'#a05b75','Africa':'#a97522','Oceania':'#7662a4','Mixed / unresolved':'#858b8c'}
    if any(r['region'] not in region_colours for r in region_rows):
        raise SystemExit('Unexpected geographic region in country-regions.csv.')
    region_data={'order':region_order,'colours':region_colours,'labels':region_labels,'basis':'Natural Earth REGION_UN; UN-style geographic regions with documented local assignments.','source':'https://unstats.un.org/unsd/methodology/m49/'}
    write_if_changed(JS/'regions.js','window.CLARENDON_REGIONS = '+json.dumps(region_data,ensure_ascii=False,separators=(',',':'))+';\n')
    for filename, text in {**temporal_outputs(rows, region_labels), **subject_outputs(rows), **europe_outputs(rows, region_labels)}.items():
        write_if_changed(DATA/filename, text)
    print(f'Ready: {len(rows):,} entries; {len(mapping)} subject labels; {len(points)} mapped country labels.')
    print('Unmapped labels (retained in every non-map chart):', ', '.join(unmapped))

if __name__=='__main__':
    main()
