#!/usr/bin/env python3
"""Verify the canonical data, generated assets and local references (no packages)."""
import csv
import hashlib
import json
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'assets' / 'data'


def require(condition, message):
    if not condition:
        raise SystemExit('ERROR: ' + message)


def load_csv(path):
    with path.open(encoding='utf-8-sig', newline='') as stream:
        reader = csv.DictReader(stream)
        rows = list(reader)
    require(all(None not in row and None not in row.values() for row in rows),
            'Malformed CSV row in ' + path.name)
    return rows


def load_js(path, prefix):
    text = path.read_text(encoding='utf-8')
    require(text.startswith(prefix) and text.rstrip().endswith(';'),
            'Unexpected wrapper in ' + path.name)
    return json.loads(text[len(prefix):].strip().removesuffix(';'))


def main():
    source = DATA / 'clarendon-scholars-clean.csv'
    rows = load_csv(source)
    ids = [row['record_id'] for row in rows]
    require(len(ids) == len(set(ids)) and all(ids), 'Record IDs must be unique and nonempty.')
    require(len(rows) == 2577, 'v0.4a must contain 2,577 source entries.')
    require(len({r['cohort'] for r in rows}) == 26, 'Expected 26 cohorts.')
    require(len({r['country'] for r in rows if r['country']}) == 113, 'Expected 113 archive country labels.')
    require(len({r['college'] for r in rows if r['college']}) == 44, 'Expected 44 historical college/hall labels.')
    require(sum(r['degree_type'] == 'DPhil' for r in rows) == 1999, 'Expected 1,999 archive DPhil entries.')
    current = [r for r in rows if r['cohort'] == '2026-27']
    require(len(current) == 222, 'The 2026–27 cohort must contain 222 entries.')
    require(len([r for r in rows if r['cohort'] == '2022-23']) == 222,
            'The repaired 2022–23 cohort must contain 222 entries.')
    require(len({r['country'] for r in current if r['country']}) == 55, 'Expected 55 current country labels.')
    require(len({r['college'] for r in current}) == 38, 'Expected 38 current colleges/halls.')
    require(sum(r['degree_type'] == 'DPhil' for r in current) == 173, 'Expected 173 current DPhil entries.')
    require(sum(not r['country'] for r in rows) == 1, 'Expected one missing country.')
    require(sum(not r['name'] for r in rows) == 1, 'Expected one placeholder name.')
    require(sum(r['needs_review'] == 'true' for r in rows) == 12, 'Expected 12 review-flagged entries.')
    placeholder = next(r for r in rows if not r['name'])
    require(placeholder['name_source'].strip() == 'Same format can be maintained', 'Placeholder source cell changed.')
    country_counts = Counter(r['country'] for r in current)
    require(sum(n for _, n in country_counts.most_common(5)) == 108, 'Top-five country count must be 108.')
    mapping_rows = load_csv(DATA / 'subject-families.csv')
    mapping = {r['subject']: r['subject_family'] for r in mapping_rows}
    require(len(mapping) == len(mapping_rows) == 352, 'Subject mapping must contain 352 unique labels.')
    require(all(r['subject'] in mapping for r in rows), 'A source subject has no family assignment.')
    degree_rows=load_csv(DATA / 'degree-levels.csv')
    field_rows=load_csv(DATA / 'subject-fields.csv')
    degree_mapping={r['degree']:r['study_level'] for r in degree_rows}
    field_mapping={r['subject']:r['broad_field'] for r in field_rows}
    require(len(degree_mapping)==len(degree_rows)==485, 'Expected 485 unique degree-label assignments.')
    require(len(field_mapping)==len(field_rows)==352, 'Expected 352 subject-field assignments.')
    require(set(degree_mapping)=={r['degree'] for r in rows}, 'Degree mapping coverage differs.')
    require(set(field_mapping)==set(mapping), 'Field mapping coverage differs.')
    require(all(r['subject_family']==mapping[r['subject']] for r in field_rows), 'Broad-field mapping changed an existing family.')
    level_totals=Counter(degree_mapping[r['degree']] for r in rows)
    require(level_totals=={'DPhil':1999,"Master's level":555,'Combined / doctoral pathway':18,'Not stated':5}, 'Degree levels do not reconcile.')
    require(Counter(field_mapping[r['subject']] for r in rows)=={'Humanities & arts':765,'Social sciences':576,'Science & technology':649,'Health & medicine':587}, 'Broad fields do not reconcile.')
    for r in rows:
        if r['degree_type'] in {'BCL','BPhil','MSc (Research)','MLitt'}:
            require(degree_mapping[r['degree']]=="Master's level", 'Master-level qualification misclassified.')
        if r['degree_type']=='MSc + DPhil' or any(label in r['degree'] for label in ['(1+3','(2+2','(2+3']):
            require(degree_mapping[r['degree']]=='Combined / doctoral pathway', 'Combined pathway counted as master-only.')
    classifications=load_js(ROOT / 'assets/js/classifications.js','window.CLARENDON_CLASSIFICATIONS = ')
    require(set(classifications['fields']['order'])==set(field_mapping.values()), 'Generated field labels differ.')
    require(set(classifications['levels']['order'])==set(degree_mapping.values()), 'Generated degree levels differ.')
    generated = load_js(ROOT / 'assets/js/data.js', 'window.CLARENDON_DATA = ')
    require(generated['meta']['sourceSha256'] == hashlib.sha256(source.read_bytes()).hexdigest(),
            'CSV changed: run scripts/prepare_data.py.')
    require(len(generated['rows']) == len(rows), 'Generated row count differs from CSV.')
    for source_row, values in zip(rows, generated['rows']):
        derived = dict(zip(generated['fields'], values))
        for field in generated['fields']:
            expected = (mapping[source_row['subject']] if field == 'subject_family' else
                        degree_mapping[source_row['degree']] if field == 'study_level' else
                        field_mapping[source_row['subject']] if field == 'broad_field' else
                        source_row[field] == 'true' if field == 'needs_review' else source_row[field])
            require(derived[field] == expected, 'Generated value differs: ' + source_row['record_id'] + ' / ' + field)
    geography = load_js(ROOT / 'assets/js/geography.js', 'window.CLARENDON_GEO = ')
    require(sum(r['country'] in geography['points'] for r in current) == 221, 'Expected 221 current map markers by entry count.')
    require(set(geography['unmapped']) == {'Japan/France', 'Palestine', 'Palestinian Territories', 'St Vincent'},
            'Unresolved map labels changed; review the map notes.')
    region_rows = load_csv(DATA / 'country-regions.csv')
    regions = load_js(ROOT / 'assets/js/regions.js', 'window.CLARENDON_REGIONS = ')
    require(len({r['country'] for r in region_rows}) == len(region_rows) == 114,
            'Region mapping must include every country label and the missing label exactly once.')
    require(set(regions['labels']) == {r['country'] for r in rows}, 'Regional mapping coverage differs from source labels.')
    for r in region_rows:
        require(regions['labels'][r['country']] == {'region': r['region'], 'subregion': r['subregion'], 'note': r['assignment_note']},
                'Generated regional mapping differs from CSV: ' + r['country'])
    region_totals = Counter(regions['labels'][r['country']]['region'] for r in rows)
    require(region_totals == {'Europe': 1016, 'Asia': 563, 'Americas': 711, 'Africa': 97, 'Oceania': 186, 'Mixed / unresolved': 4},
            'Regional totals changed; review story headlines and mapping.')
    require(sum(region_totals.values()) == len(rows), 'Regions must count every entry once.')
    require(regions['labels']['Japan/France']['region'] == 'Mixed / unresolved', 'Do not split a joint source label.')

    # Annual CSV panel: reconcile every row with the canonical source.
    annual = load_csv(DATA / 'cohort-summary.csv')
    require(len(annual) == 26, 'Expected one summary row per cohort.')
    require([r['cohort'] for r in annual] == sorted({r['cohort'] for r in rows}), 'Annual cohorts differ.')
    for item in annual:
        group = [r for r in rows if r['cohort'] == item['cohort']]
        n = len(group)
        require(int(item['entries']) == n, 'Annual denominator differs.')
        require(int(item['entry_year']) == int(item['cohort'][:4]), 'Wrong entry year.')
        degrees = Counter(r['degree_type'] for r in group)
        require(int(item['dphil_entries']) == degrees['DPhil'], 'Annual DPhil count differs.')
        require(int(item['unspecified_award_entries']) == degrees['Not stated'], 'Annual unspecified count differs.')
        require(int(item['other_combined_entries']) == n-degrees['DPhil']-degrees['Not stated'], 'Annual other count differs.')
        require(abs(float(item['dphil_share_pct'])-100*degrees['DPhil']/n)<0.000001, 'Annual DPhil share differs.')
        require(int(item['missing_country_entries']) == sum(not r['country'] for r in group), 'Annual missing count differs.')
        for key in ['country', 'college']:
            counts = Counter(r[key] for r in group if r[key])
            five = sum(sorted(counts.values(), reverse=True)[:5])
            require(int(item[key+'_labels']) == len(counts), 'Annual distinct label count differs.')
            require(int(item['top5_'+key+'_entries']) == five, 'Annual concentration count differs.')
            require(abs(float(item['top5_'+key+'_share_pct'])-100*five/n)<0.000001, 'Annual concentration share differs.')
        for label, key in zip(regions['order']+['Mixed / unresolved'], ['europe','asia','americas','africa','oceania','unresolved']):
            value = sum(regions['labels'][r['country']]['region']==label for r in group)
            require(int(item[key+'_entries']) == value, 'Annual region count differs.')
            require(abs(float(item[key+'_share_pct'])-100*value/n)<0.000001, 'Annual region share differs.')
        for label, key in [("Master's level",'masters'),('Combined / doctoral pathway','combined_pathway')]:
            value=sum(degree_mapping[r['degree']]==label for r in group)
            require(int(item[key+'_entries'])==value, 'Annual degree-level count differs.')
            require(abs(float(item[key+'_share_pct'])-100*value/n)<0.000001, 'Annual level share differs.')
        for label, key in zip(['Humanities & arts','Social sciences','Science & technology','Health & medicine'],['humanities','social_sciences','science_technology','health_medicine']):
            value=sum(field_mapping[r['subject']]==label for r in group)
            require(int(item[key+'_entries'])==value, 'Annual broad-field count differs.')
            require(abs(float(item[key+'_share_pct'])-100*value/n)<0.000001, 'Annual broad-field share differs.')
    panels = load_csv(DATA / 'cohort-composition.csv')
    dimensions = {
        'region': lambda r: regions['labels'][r['country']]['region'],
        'subject_family': lambda r: mapping[r['subject']],
        'country': lambda r: r['country'] or 'Not stated',
        'college': lambda r: r['college'] or 'Not stated',
        'study_level': lambda r: degree_mapping[r['degree']],
        'broad_field': lambda r: field_mapping[r['subject']],
    }
    expected = {}
    for cohort in sorted({r['cohort'] for r in rows}):
        group = [r for r in rows if r['cohort']==cohort]
        for dimension, labeler in dimensions.items():
            counts = Counter(labeler(r) for r in group)
            for label in {labeler(r) for r in rows}:
                expected[(cohort,dimension,label)] = (counts[label],len(group))
    require(len(panels)==len(expected), 'Annual panel size differs; no missing or duplicate cells allowed.')
    seen=set()
    for item in panels:
        key=(item['cohort'],item['dimension'],item['label'])
        require(key in expected and key not in seen, 'Unexpected/duplicate annual panel cell.')
        seen.add(key)
        value,total=expected[key]
        require(int(item['entries'])==value and int(item['cohort_entries'])==total, 'Annual panel count differs.')
        require(abs(float(item['share_pct'])-100*value/total)<0.000001, 'Annual panel share differs.')

    master_fields=load_csv(DATA / 'masters-by-field.csv')
    require(len(master_fields)==104, 'Expected 26 by 4 master-field cells.')
    master_keys=set()
    for cell in master_fields:
        key=(cell['cohort'],cell['broad_field'])
        require(key not in master_keys and cell['cohort'] in {r['cohort'] for r in rows} and cell['broad_field'] in set(field_mapping.values()), 'Unexpected/duplicate master-field cell.')
        master_keys.add(key)
        group=[r for r in rows if r['cohort']==cell['cohort'] and degree_mapping[r['degree']]=="Master's level"]
        value=sum(field_mapping[r['subject']]==cell['broad_field'] for r in group)
        require(int(cell['entries'])==value and int(cell['masters_entries'])==len(group), 'Master-field numerator or denominator differs.')
        require((abs(float(cell['share_pct'])-100*value/len(group))<0.000001 if group else cell['share_pct']==''), 'Zero master denominator must have a blank percentage.')

    class Links(HTMLParser):
        def handle_starttag(self, tag, attrs):
            for key, value in attrs:
                if key in {'href', 'src'} and value and not value.startswith(('https:', 'http:', '#', 'data:')):
                    require((ROOT / value.split('#')[0]).exists(), 'Missing local reference: ' + value)

    for page in ['index.html', 'explore.html']:
        text = (ROOT / page).read_text(encoding='utf-8')
        Links().feed(text)
        require('Developed by' in text and 'YIN Renlong' in text, 'Missing authorship in ' + page)
    story = (ROOT / 'index.html').read_text(encoding='utf-8')
    require(story.count('class="story-question ') == 28, 'Expected 28 scrolling story questions.')
    require('id="story-navigation"' in story and 'id="reading-chapter"' in story, 'Missing chapter navigation.')
    for region in regions['order']:
        require('id="question-' + region.lower() + '"' in story, 'Missing regional story: ' + region)
    for key in ['region-time','degree-time','concentration-time','subject-time','country-continuity','masters','fields','masters-time','field-time','masters-field-time']:
        require('id="question-' + key + '"' in story, 'Missing temporal story: ' + key)
    require('Read the denominator before the trend.' not in story and 'id="cohort-ledger"' not in story, 'Duplicate coverage block returned.')
    require(story.index('id="over-time"') < story.index('id="question-coverage"') < story.index('id="question-history"'), 'Coverage must open the temporal chapter.')
    require('class="wordmark chapter-brand"' in story, 'Missing sticky logo and author credit.')
    require('data-mode="story"' in story, 'Story must be the default page.')
    print('PASS: 2,577 entries; 26 cohorts; 28 stories; regional totals reconcile; generated data matches CSV; local links exist.')
    print('Default scope: all 26 cohorts · 2,577 entries · 113 country labels · 44 college/hall labels · 1,999 DPhils (77.6%).')


if __name__ == '__main__':
    main()
