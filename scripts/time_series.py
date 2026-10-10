"""Auditable annual summaries, using counts of published entries only."""
from collections import Counter
import csv
import io

REGIONS = ['Europe', 'Asia', 'Americas', 'Africa', 'Oceania', 'Mixed / unresolved']
REGION_KEYS = ['europe', 'asia', 'americas', 'africa', 'oceania', 'unresolved']


def csv_text(headers, records):
    stream = io.StringIO(newline='')
    writer = csv.DictWriter(stream, fieldnames=headers, lineterminator='\n')
    writer.writeheader()
    writer.writerows(records)
    return '\ufeff' + stream.getvalue()


def temporal_outputs(rows, region_labels):
    """Zero-filled composition panels use each year's full list as denominator.

    Country and college concentration rank stated labels afresh each year.
    Percentages use all entries, including missing or unspecified values.
    """
    enriched = [dict(r, region=region_labels[r['country']]['region']) for r in rows]
    dimensions = ['region', 'subject_family', 'country', 'college']
    labels = {key: sorted({r[key] or 'Not stated' for r in enriched}) for key in dimensions}
    labels['region'] = REGIONS
    summary, composition = [], []
    for cohort in sorted({r['cohort'] for r in rows}):
        group = [r for r in enriched if r['cohort'] == cohort]
        total = len(group)
        count = {key: Counter(r[key] or 'Not stated' for r in group) for key in dimensions}
        doctoral = sum(r['degree_type'] == 'DPhil' for r in group)
        unspecified = sum(r['degree_type'] == 'Not stated' for r in group)
        top_country = sum(sorted(Counter(r['country'] for r in group if r['country']).values(), reverse=True)[:5])
        top_college = sum(sorted(Counter(r['college'] for r in group if r['college']).values(), reverse=True)[:5])
        annual = dict(entry_year=int(cohort[:4]), cohort=cohort, entries=total,
                      country_labels=len({r['country'] for r in group if r['country']}),
                      missing_country_entries=sum(not r['country'] for r in group),
                      college_labels=len({r['college'] for r in group if r['college']}),
                      dphil_entries=doctoral, other_combined_entries=total-doctoral-unspecified,
                      unspecified_award_entries=unspecified, dphil_share_pct=f'{100*doctoral/total:.6f}',
                      top5_country_entries=top_country, top5_country_share_pct=f'{100*top_country/total:.6f}',
                      top5_college_entries=top_college, top5_college_share_pct=f'{100*top_college/total:.6f}')
        for region, key in zip(REGIONS, REGION_KEYS):
            annual[key+'_entries'] = count['region'][region]
            annual[key+'_share_pct'] = f"{100*count['region'][region]/total:.6f}"
        summary.append(annual)
        for dimension in dimensions:
            for label in labels[dimension]:
                value = count[dimension][label]
                composition.append(dict(entry_year=int(cohort[:4]), cohort=cohort,
                                        dimension=dimension, label=label, entries=value,
                                        cohort_entries=total, share_pct=f'{100*value/total:.6f}'))
    return {
        'cohort-summary.csv': csv_text(list(summary[0]), summary),
        'cohort-composition.csv': csv_text(list(composition[0]), composition),
    }
