"""Reproducible European country, profile and time summaries."""
from collections import Counter
from time_series import csv_text, FIELDS

LEVELS = ['DPhil', "Master's level", 'Combined / doctoral pathway', 'Not stated']
LEVEL_KEYS = ['dphil', 'masters', 'pathway', 'unspecified']


def europe_outputs(rows, region_labels):
    europe = [r for r in rows if region_labels[r['country']]['region'] == 'Europe']
    total = len(europe)
    counts = Counter(r['country'] for r in europe)
    ranking = sorted(counts, key=lambda c: (-counts[c], c.casefold()))
    countries = []
    for rank, country in enumerate(ranking, 1):
        group = [r for r in europe if r['country'] == country]
        item = dict(country=country, rank=rank, entries=len(group), europe_entries=total,
                    share_of_europe_pct=f'{100*len(group)/total:.6f}',
                    display_group='Five largest country groups' if rank <= 5 else 'Remaining country groups')
        for label, key in zip(LEVELS, LEVEL_KEYS):
            value = sum(r['study_level'] == label for r in group)
            item[key+'_entries'] = value
            item[key+'_share_of_country_pct'] = f'{100*value/len(group):.6f}'
        countries.append(item)

    profiles = []
    for name, subset in [('United Kingdom', [r for r in europe if r['country'] == 'United Kingdom']),
                         ('Rest of Europe', [r for r in europe if r['country'] != 'United Kingdom'])]:
        for dimension, labels in [('study_level', LEVELS), ('broad_field', FIELDS)]:
            for label in labels:
                count = sum(r[dimension] == label for r in subset)
                profiles.append(dict(group=name, dimension=dimension, label=label, entries=count,
                                     group_entries=len(subset), share_of_group_pct=f'{100*count/len(subset):.6f}'))

    cohorts = sorted({r['cohort'] for r in rows})
    ranges = [('cohort', int(c[:4]), int(c[:4]), c) for c in cohorts]
    for start in range(2001, 2026, 5):
        ranges.append(('five-cohort block', start, start+4, f'{start}–{str(start+4)[-2:]} entry years'))
    ranges.append(('single-cohort reference', 2026, 2026, '2026–27'))
    periods = []
    for kind, start, end, label in ranges:
        selected = [r for r in europe if start <= int(r['cohort'][:4]) <= end]
        uk = sum(r['country'] == 'United Kingdom' for r in selected)
        n = len(selected)
        periods.append(dict(period_type=kind, start_year=start, end_year=end, period=label,
                            cohort_count=sum(start <= int(c[:4]) <= end for c in cohorts),
                            europe_entries=n, uk_entries=uk, rest_of_europe_entries=n-uk,
                            uk_share_of_europe_pct=f'{100*uk/n:.6f}' if n else '',
                            rest_share_of_europe_pct=f'{100*(n-uk)/n:.6f}' if n else '',
                            country_labels=len({r['country'] for r in selected})))
    return {
        'europe-countries.csv': csv_text(list(countries[0]), countries),
        'europe-profiles.csv': csv_text(list(profiles[0]), profiles),
        'europe-periods.csv': csv_text(list(periods[0]), periods),
    }
