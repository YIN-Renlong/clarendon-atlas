(function () {
  'use strict';
  if (document.body.dataset.mode !== 'story') return;
  const C = window.ClarendonCore, R = window.CLARENDON_REGIONS, A = window.CLARENDON_CLASSIFICATIONS;
  const E = C.escape, pct = C.pct, fmt = C.format, $ = id => document.getElementById(id);
  const rows = C.decode(window.CLARENDON_DATA);
  const europe = rows.filter(r => R.labels[r.country].region === 'Europe');
  const uk = europe.filter(r => r.country === 'United Kingdom');
  const rest = europe.filter(r => r.country !== 'United Kingdom');
  const groups = [{ name: 'United Kingdom', rows: uk, colour: '#365f86' }, { name: 'Rest of Europe', rows: rest, colour: '#237b70' }];
  const countries = C.tally(europe, 'country'), smaller = countries.slice(5);
  const otherCount = smaller.reduce((sum, g) => sum + g.n, 0);
  const masters = subset => subset.filter(r => r.study_level === "Master's level");
  const countLevel = (subset, level) => subset.filter(r => r.study_level === level).length;
  function table(headers, data) {
    return '<table><thead><tr>' + headers.map(h => '<th scope="col">' + E(h) + '</th>').join('') + '</tr></thead><tbody>' + data.map(row => '<tr>' + row.map((v, i) => (i ? '<td>' : '<th scope="row">') + E(v) + (i ? '</td>' : '</th>')).join('') + '</tr>').join('') + '</tbody></table>';
  }
  function fill(id, title, meta, chart, facts, takeaway, headers, values) {
    $(id + '-title').textContent = title;
    $(id + '-meta').textContent = meta;
    $('chart-' + id).innerHTML = chart;
    $('facts-' + id).innerHTML = facts.map(([value, label]) => '<div><dt>' + E(label) + '</dt><dd>' + E(value) + '</dd></div>').join('');
    $(id + '-takeaway').innerHTML = takeaway;
    $('table-' + id).innerHTML = table(headers, values);
  }
  function split(label, segments, total, attributes = '') {
    return '<div class="europe-split-row" ' + attributes + '><div class="europe-split-heading"><strong>' + E(label) + '</strong><span>n = ' + fmt(total) + ' entries</span></div>' +
      '<div class="europe-split-track" aria-hidden="true">' + segments.map(s => '<span data-count="' + s.n + '" data-total="' + total + '" data-group="' + E(s.label) + '" style="width:' + (total ? 100 * s.n / total : 0) + '%;background:' + s.colour + '">' + (total && s.n / total >= .1 ? pct(s.n, total) : '') + '</span>').join('') + '</div>' +
      '<ul class="europe-split-key">' + segments.map(s => '<li><i style="--swatch:' + s.colour + '" aria-hidden="true"></i><span>' + E(s.label) + '</span><b>' + fmt(s.n) + ' · ' + pct(s.n, total) + '</b></li>').join('') + '</ul></div>';
  }
  const countryValues = list => list.map(g => {
    const subset = europe.filter(r => r.country === g.key), d = countLevel(subset, 'DPhil'), m = masters(subset).length;
    return [g.key, g.n, pct(g.n, europe.length), d, pct(d, g.n), m, pct(m, g.n)];
  });

  // The overview's combined remainder is now unpacked into every original label.
  const axisMax = Math.max(5, Math.ceil(smaller[0].n / 5) * 5);
  const midpoint = Math.ceil(smaller.length / 2);
  const rankPanels = [smaller.slice(0, midpoint), smaller.slice(midpoint)].map((panel, index) =>
    '<section class="europe-rank-panel"><h4>' + (index ? 'Continued · ' : '') + 'Groups ' + (index ? midpoint + 1 : 1) + '–' + (index ? smaller.length : midpoint) + ' of ' + smaller.length + ' below the top five</h4>' +
    '<div class="europe-count-axis" aria-hidden="true"><span>0</span><span>' + axisMax / 2 + '</span><span>' + axisMax + ' entries</span></div><ol class="europe-ranks">' + panel.map(g =>
      '<li class="europe-country-row" data-country="' + E(g.key) + '" data-count="' + g.n + '" data-total="' + europe.length + '"><div class="europe-country-label"><span>' + E(g.key) + '</span><strong>' + g.n + ' <small>' + pct(g.n, europe.length) + '</small></strong></div><div class="europe-count-track" aria-hidden="true"><span style="width:' + 100 * g.n / axisMax + '%"></span></div></li>').join('') + '</ol></section>').join('');
  const leadThree = smaller.slice(0, 3), leadCount = leadThree.reduce((sum, g) => sum + g.n, 0);
  fill('europe-beyond-five',
    'Europe’s ' + smaller.length + ' smaller country groups contain ' + pct(otherCount, europe.length) + ' of its entries',
    'All 26 cohorts · ' + fmt(europe.length) + ' European entries · every percentage below uses this regional total',
    split('The five largest groups and everyone else', [{ label: 'Five largest groups combined', n: europe.length - otherCount, colour: '#365f86' }, { label: 'Remaining ' + smaller.length + ' groups combined', n: otherCount, colour: '#237b70' }], europe.length) +
      '<p class="mini-chart-note">Every group behind “Other” is shown below. Bar length measures entries on the same 0–' + axisMax + ' scale in both columns; the percentage beside each count is its share of all ' + fmt(europe.length) + ' European entries. Read down the first column, then the second.</p><div class="europe-rank-grid">' + rankPanels + '</div>',
    [[otherCount, 'Entries outside Europe’s five largest groups'], [smaller.length, 'Country / territory groups in that remainder'], [pct(otherCount, europe.length), 'Share of all European entries']],
    '<strong>The combined remainder is substantial, but it is not a single country group.</strong> Its ' + otherCount + ' entries exceed Germany and Italy combined (' + (countries.find(g => g.key === 'Germany').n + countries.find(g => g.key === 'Italy').n) + '). ' + leadThree.map(g => E(g.key) + ' (' + g.n + ')').join(', ') + ' are the largest groups inside the remainder; together they contain ' + leadCount + ' of its ' + otherCount + ' entries (' + pct(leadCount, otherCount) + '). Separately, all ' + (countries.length - 1) + ' groups outside the UK contain ' + rest.length + ' entries (' + pct(rest.length, europe.length) + ' of Europe).',
    ['Country / territory', 'Entries', 'Share of Europe', 'DPhil', 'DPhil share of group', 'Master’s level', 'Master’s share of group'], countryValues(smaller));

  const allMasters = masters(europe).length, ukMasters = masters(uk).length, restMasters = masters(rest).length;
  const ukDphil = countLevel(uk, 'DPhil'), restDphil = countLevel(rest, 'DPhil');
  fill('europe-degrees',
    'The UK contains ' + pct(ukMasters, allMasters) + ' of Europe’s master’s-level entries',
    'All 26 cohorts · all European entries: n = ' + fmt(europe.length) + ' · European master’s-level entries: n = ' + allMasters,
    split('All European entries', groups.map(g => ({ label: g.name, n: g.rows.length, colour: g.colour })), europe.length, 'data-scope="all"') +
      split('Europe’s master’s-level entries', groups.map(g => ({ label: g.name, n: masters(g.rows).length, colour: g.colour })), allMasters, 'data-scope="masters"') +
      '<p class="europe-comparison-note"><strong>Within each country grouping:</strong> master’s entries are ' + ukMasters + '/' + uk.length + ' (' + pct(ukMasters, uk.length) + ') of the UK group and ' + restMasters + '/' + rest.length + ' (' + pct(restMasters, rest.length) + ') elsewhere in Europe. DPhils account for ' + ukDphil + '/' + uk.length + ' (' + pct(ukDphil, uk.length) + ') and ' + restDphil + '/' + rest.length + ' (' + pct(restDphil, rest.length) + '), respectively. Combined pathways and unspecified awards remain separate in the exact table.</p>',
    [[ukMasters + ' / ' + allMasters, 'UK entries within Europe’s master’s group'], [pct(ukMasters, uk.length), 'Master’s share within the UK group'], [pct(restMasters, rest.length), 'Master’s share within the rest of Europe']],
    '<strong>The UK has a larger share of Europe’s master’s entries than of Europe’s entries overall.</strong> The difference is ' + (100 * ukMasters / allMasters - 100 * uk.length / europe.length).toFixed(1) + ' percentage points. Conversely, DPhils form a larger part of the rest-of-Europe group (' + pct(restDphil, rest.length) + ') than of the UK group (' + pct(ukDphil, uk.length) + '). These are pooled published degree profiles, not estimates of scholarship selection or course availability.',
    ['Group', 'Degree level', 'Entries', 'Group total', 'Share of group'], groups.flatMap(g => A.levels.order.map(level => [g.name, level, countLevel(g.rows, level), g.rows.length, pct(countLevel(g.rows, level), g.rows.length)])));

  const fields = A.fields.order;
  const fieldCount = (subset, field) => subset.filter(r => r.broad_field === field).length;
  const fieldMax = Math.max(60, Math.ceil(Math.max(...groups.flatMap(g => fields.map(f => 100 * fieldCount(g.rows, f) / g.rows.length))) / 10) * 10);
  const fieldPanels = fields.map(field => '<section class="europe-field-panel"><h4>' + E(field) + '</h4><div class="europe-count-axis" aria-hidden="true"><span>0%</span><span>' + fieldMax / 2 + '%</span><span>' + fieldMax + '%</span></div>' + groups.map(g => {
    const count = fieldCount(g.rows, field);
    return '<div class="europe-field-row" data-group="' + E(g.name) + '" data-field="' + E(field) + '" data-count="' + count + '" data-total="' + g.rows.length + '"><div class="europe-country-label"><span>' + E(g.name) + '</span><strong>' + count + ' <small>' + pct(count, g.rows.length) + '</small></strong></div><div class="europe-count-track" aria-hidden="true"><span style="background:' + g.colour + ';width:' + 100 * (100 * count / g.rows.length) / fieldMax + '%"></span></div></div>';
  }).join('') + '</section>').join('');
  const ukHum = fieldCount(uk, 'Humanities & arts'), restHum = fieldCount(rest, 'Humanities & arts');
  const restScience = fieldCount(rest, 'Science & technology');
  fill('europe-fields',
    'Humanities and arts account for ' + pct(ukHum, uk.length) + ' of UK entries and ' + pct(restHum, rest.length) + ' elsewhere in Europe',
    'All 26 cohorts · UK: n = ' + uk.length + ' · rest of Europe: n = ' + rest.length + ' · shares use each group’s own total',
    '<p class="mini-chart-note">All four panels share a zero-based 0–' + fieldMax + '% scale. Blue is the UK; green is the rest of Europe. Counts and percentages are printed beside every bar.</p><div class="europe-field-grid">' + fieldPanels + '</div><p class="figure-note">Broad fields are editorial groupings, not official Oxford divisions. Health &amp; medicine is separate from science &amp; technology. Different cohort and degree mixes can contribute to these pooled differences.</p>',
    [[ukHum + ' / ' + uk.length, 'UK humanities & arts · ' + pct(ukHum, uk.length)], [restHum + ' / ' + rest.length, 'Elsewhere in Europe: humanities & arts · ' + pct(restHum, rest.length)], [restScience + ' / ' + rest.length, 'Elsewhere in Europe: science & technology · ' + pct(restScience, rest.length)]],
    '<strong>The pooled academic balance differs within Europe.</strong> Humanities &amp; arts account for just over half of the UK group. Elsewhere in Europe, science &amp; technology (' + restScience + ') and humanities &amp; arts (' + restHum + ') are nearly equal in size. Social sciences and health &amp; medicine remain visible separately. This comparison does not isolate geography from cohort composition or degree level.',
    ['Broad field', 'UK entries', 'Share of UK group', 'Rest-of-Europe entries', 'Share of rest-of-Europe group'], fields.map(f => [f, fieldCount(uk, f), pct(fieldCount(uk, f), uk.length), fieldCount(rest, f), pct(fieldCount(rest, f), rest.length)]));

  const cohorts = [...new Set(rows.map(r => r.cohort))].sort();
  function period(start, end, kind, label) {
    const subset = europe.filter(r => Number(r.cohort.slice(0, 4)) >= start && Number(r.cohort.slice(0, 4)) <= end);
    return { start, end, kind, label, n: subset.length, uk: subset.filter(r => r.country === 'United Kingdom').length, countries: new Set(subset.map(r => r.country)).size };
  }
  const blocks = [2001, 2006, 2011, 2016, 2021].map(start => period(start, start + 4, 'Five cohorts', start + '–' + String(start + 4).slice(-2) + ' entry years'));
  const latestYear = Number(cohorts[cohorts.length - 1].slice(0, 4));
  const reference = period(latestYear, latestYear, 'One cohort', cohorts[cohorts.length - 1]);
  const periods = blocks.concat([reference]), previous = blocks[blocks.length - 2], recent = blocks[blocks.length - 1];
  const difference = 100 * previous.uk / previous.n - 100 * recent.uk / recent.n;
  fill('europe-time',
    'The UK’s share stays near half in the last two five-cohort blocks',
    'All 26 cohorts · five non-overlapping five-cohort blocks, plus ' + reference.label + ' separately · denominator: European entries within each period',
    '<p class="mini-chart-note">Each bar totals 100% of its period’s European entries. Equal bar lengths compare composition; the printed totals show how much the list sizes differ. The final row is a single cohort.</p><div class="europe-periods">' + periods.map(p =>
      '<section class="europe-period-row' + (p.n < 50 ? ' is-sparse' : '') + (p.start === p.end ? ' is-reference' : '') + '" data-start="' + p.start + '" data-end="' + p.end + '" data-count="' + p.uk + '" data-total="' + p.n + '">' + split(p.label + ' · ' + p.kind.toLowerCase(), [{ label: 'United Kingdom', n: p.uk, colour: '#365f86' }, { label: 'Rest of Europe', n: p.n - p.uk, colour: '#237b70' }], p.n) +
      '<p class="europe-period-caption">' + (p.n < 50 ? 'Sparse published coverage: only ' + p.n + ' European entries. Zero UK entries here does not establish absence of UK awards or eligibility.' : p.start === p.end ? 'One cohort shown separately; its ' + pct(p.uk, p.n) + ' UK share is not a five-cohort trend.' : p.countries + ' country / territory labels are present in this pooled block.') + '</p></section>').join('') + '</div>',
    [[pct(previous.uk, previous.n), 'UK share · ' + previous.label + ' · n = ' + previous.n], [pct(recent.uk, recent.n), 'UK share · ' + recent.label + ' · n = ' + recent.n], [Math.abs(difference).toFixed(1) + ' pp', (difference >= 0 ? 'Decrease' : 'Increase') + ' between those blocks · percentage points']],
    '<strong>The last two five-cohort shares are close: ' + previous.uk + '/' + previous.n + ' (' + pct(previous.uk, previous.n) + ') and ' + recent.uk + '/' + recent.n + ' (' + pct(recent.uk, recent.n) + ').</strong> The rest of Europe therefore contributes about half in both periods. ' + reference.label + ' has ' + reference.uk + '/' + reference.n + ' UK entries (' + pct(reference.uk, reference.n) + '), but that is one cohort. Early European totals are very small and completeness is unknown throughout; the chart describes the published archive and does not establish stable award rates or explain the changes.',
    ['Period', 'Scope', 'European entries', 'UK entries', 'UK share', 'Rest-of-Europe entries', 'Rest-of-Europe share', 'Country labels'], periods.concat(cohorts.map(c => period(Number(c.slice(0, 4)), Number(c.slice(0, 4)), 'Annual detail', c))).map(p => [p.label, p.kind, p.n, p.uk, pct(p.uk, p.n), p.n - p.uk, pct(p.n - p.uk, p.n), p.countries]));
})();
