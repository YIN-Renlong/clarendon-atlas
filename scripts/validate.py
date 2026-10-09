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
    require(len(rows) == 2577, 'v0.1c must contain 2,577 source entries.')
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
    generated = load_js(ROOT / 'assets/js/data.js', 'window.CLARENDON_DATA = ')
    require(generated['meta']['sourceSha256'] == hashlib.sha256(source.read_bytes()).hexdigest(),
            'CSV changed: run scripts/prepare_data.py.')
    require(len(generated['rows']) == len(rows), 'Generated row count differs from CSV.')
    for source_row, values in zip(rows, generated['rows']):
        derived = dict(zip(generated['fields'], values))
        for field in generated['fields']:
            expected = (mapping[source_row['subject']] if field == 'subject_family' else
                        source_row[field] == 'true' if field == 'needs_review' else source_row[field])
            require(derived[field] == expected, 'Generated value differs: ' + source_row['record_id'] + ' / ' + field)
    geography = load_js(ROOT / 'assets/js/geography.js', 'window.CLARENDON_GEO = ')
    require(sum(r['country'] in geography['points'] for r in current) == 221, 'Expected 221 current map markers by entry count.')
    require(set(geography['unmapped']) == {'Japan/France', 'Palestine', 'Palestinian Territories', 'St Vincent'},
            'Unresolved map labels changed; review the map notes.')

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
    require(story.count('class="story-question ') == 13, 'Expected 13 scrolling story questions.')
    require('data-mode="story"' in story, 'Story must be the default page.')
    print('PASS: 2,577 entries; 26 cohorts; 352 subject labels; generated data matches CSV; local links exist.')
    print('Default scope: all 26 cohorts · 2,577 entries · 113 country labels · 44 college/hall labels · 1,999 DPhils (77.6%).')


if __name__ == '__main__':
    main()
