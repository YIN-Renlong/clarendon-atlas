"""Exact subject counts inside each editorial broad field; all cohorts pooled."""
from collections import Counter, defaultdict
from time_series import FIELDS, csv_text


def subject_outputs(rows):
    groups = defaultdict(list)
    for row in rows:
        groups[(row['broad_field'], row['subject'])].append(row)
    totals = Counter(r['broad_field'] for r in rows)
    master_totals = Counter(r['broad_field'] for r in rows if r['study_level'] == "Master's level")
    records = []
    for field in FIELDS:
        subjects = sorted((s for f, s in groups if f == field), key=str.casefold)
        for subject in subjects:
            group = groups[(field, subject)]
            levels = Counter(r['study_level'] for r in group)
            masters = levels["Master's level"]
            records.append(dict(
                broad_field=field, subject=subject, entries=len(group),
                field_entries=totals[field], share_of_field_pct=f'{100 * len(group) / totals[field]:.6f}',
                masters_entries=masters, field_masters_entries=master_totals[field],
                share_of_field_masters_pct=f'{100 * masters / master_totals[field]:.6f}' if master_totals[field] else '',
                dphil_entries=levels['DPhil'], pathway_entries=levels['Combined / doctoral pathway'],
                unspecified_entries=levels['Not stated']))
    headers = ['broad_field', 'subject', 'entries', 'field_entries', 'share_of_field_pct',
               'masters_entries', 'field_masters_entries', 'share_of_field_masters_pct',
               'dphil_entries', 'pathway_entries', 'unspecified_entries']
    return {'subjects-by-field.csv': csv_text(headers, records)}
