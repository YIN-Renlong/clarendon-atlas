(function () {
  'use strict';
  if (document.body.dataset.mode !== 'story') return;
  const C = window.ClarendonCore, A = window.CLARENDON_CLASSIFICATIONS;
  const E = C.escape, pct = C.pct, fmt = C.format, $ = id => document.getElementById(id);
  const rows = C.decode(window.CLARENDON_DATA);
  const definitions = [
    { id: 'inside-humanities', field: 'Humanities & arts' },
    { id: 'inside-social', field: 'Social sciences' },
    { id: 'inside-science', field: 'Science & technology' },
    { id: 'inside-health', field: 'Health & medicine' }
  ];
  const profiles = definitions.map(item => {
    const all = rows.filter(r => r.broad_field === item.field);
    const masters = all.filter(r => r.study_level === "Master's level");
    return { ...item, all, masters, subjects: C.tally(all, 'subject'), masterSubjects: C.tally(masters, 'subject') };
  });
  // Every panel uses the same zero-based percentage scale. Ties at fifth place stay visible.
  const largestShare = Math.max(...profiles.flatMap(p => [
    p.subjects[0].n / p.all.length, p.masterSubjects.length ? p.masterSubjects[0].n / p.masters.length : 0
  ])) * 100;
  const axisMax = Math.max(30, Math.ceil(largestShare / 10) * 10);
  function leaders(groups) {
    const cutoff = groups[Math.min(4, groups.length - 1)];
    return cutoff ? groups.filter(g => g.n >= cutoff.n) : [];
  }
  function panel(profile, masterOnly) {
    const groups = masterOnly ? profile.masterSubjects : profile.subjects;
    const total = masterOnly ? profile.masters.length : profile.all.length;
    const shown = leaders(groups), displayed = shown.reduce((sum, g) => sum + g.n, 0);
    const heading = masterOnly ? 'Within master’s-level entries' : 'Across all degree levels';
    const scope = masterOnly ? 'masters' : 'all';
    return '<section class="field-subject-panel" data-field="' + E(profile.field) + '" data-scope="' + scope + '">' +
      '<h4>' + heading + '</h4><p class="mini-chart-note">' + E(profile.field) + ' · n = <b>' + fmt(total) + '</b> · share of this panel’s entries</p>' +
      '<div class="subject-share-axis" aria-hidden="true"><span>0%</span><span>' + axisMax / 2 + '%</span><span>' + axisMax + '%</span></div>' +
      (total ? '<ol class="subject-ranks">' + shown.map(g => '<li class="subject-rank" data-subject="' + E(g.key) + '" data-count="' + g.n + '" data-total="' + total + '" data-share="' + (100 * g.n / total) + '">' +
        '<div class="subject-rank-label"><span>' + E(g.key) + '</span><strong>' + fmt(g.n) + ' <small>' + pct(g.n, total) + '</small></strong></div>' +
        '<div class="subject-rank-track" aria-hidden="true"><i style="width:' + (100 * g.n / total / axisMax * 100) + '%"></i></div></li>').join('') + '</ol>' : '<p>No master’s-level entries are listed in this field.</p>') +
      '<p class="subject-remainder" data-count="' + (total - displayed) + '" data-total="' + total + '">' +
      (groups.length > shown.length ? '<b>' + fmt(total - displayed) + ' entries</b> across the remaining ' + (groups.length - shown.length) + ' subject labels (' + pct(total - displayed, total) + ').' : 'All ' + groups.length + ' subject labels in this panel are shown.') + '</p></section>';
  }
  function degreeMix(profile) {
    const total = profile.all.length;
    const groups = A.levels.order.map(label => ({ label, n: profile.all.filter(r => r.study_level === label).length })).filter(g => g.n);
    return '<section class="field-degree-profile"><h4>Degree levels within ' + E(profile.field.toLowerCase()) + '</h4>' +
      '<div class="field-degree-stack" role="img" aria-label="' + E(groups.map(g => g.label + ': ' + g.n + ' of ' + total + ' (' + pct(g.n, total) + ')').join('; ')) + '">' +
      groups.map(g => '<span aria-hidden="true" data-level="' + E(g.label) + '" data-count="' + g.n + '" data-total="' + total + '" style="width:' + (100 * g.n / total) + '%;background:' + A.levels.colours[g.label] + '"></span>').join('') + '</div><ul class="field-degree-key">' +
      groups.map(g => '<li><i style="background:' + A.levels.colours[g.label] + '" aria-hidden="true"></i><span>' + E(g.label) + '</span><strong>' + fmt(g.n) + ' <small>' + pct(g.n, total) + '</small></strong></li>').join('') + '</ul></section>';
  }
  for (const p of profiles) {
    const id = p.id, n = p.all.length, m = p.masters.length;
    const count = (subject, masterOnly = false) => (masterOnly ? p.masters : p.all).filter(r => r.subject === subject).length;
    const dphil = p.all.filter(r => r.study_level === 'DPhil').length;
    let title, conclusion;
    if (id === 'inside-humanities') {
      title = 'Humanities master’s entries span ' + p.masterSubjects.length + ' subject labels';
      conclusion = '<strong>The humanities contain many distinct subject groups.</strong> History is the largest exact subject label across all degree levels (' + count('History') + '/' + n + ', ' + pct(count('History'), n) + '). Within the ' + m + ' master’s entries, Modern Languages leads with ' + count('Modern Languages', true) + ' (' + pct(count('Modern Languages', true), m) + '), followed by Theology with ' + count('Theology', true) + '. The largest master’s label accounts for less than one in ten entries.';
    } else if (id === 'inside-social') {
      title = 'Economics leads both social-science rankings, with ' + count('Economics', true) + ' master’s entries';
      conclusion = '<strong>Economics is the largest exact label in both panels.</strong> It contains ' + count('Economics') + ' of ' + n + ' social-science entries (' + pct(count('Economics'), n) + '), including ' + count('Economics', true) + ' of the field’s ' + m + ' master’s entries (' + pct(count('Economics', true), m) + '). Development Studies follows in the master’s panel with ' + count('Development Studies', true) + '; International Relations and Public Policy each have ' + count('International Relations', true) + '. The master’s subset spans ' + p.masterSubjects.length + ' exact subject labels.';
    } else if (id === 'inside-science') {
      title = 'Science and technology lists ' + dphil + ' DPhils and ' + m + ' master’s-level entries';
      conclusion = '<strong>The published profile is overwhelmingly doctoral.</strong> DPhil entries account for ' + dphil + '/' + n + ' (' + pct(dphil, n) + '), and Engineering Science is the largest exact subject label (' + count('Engineering Science') + '). The ' + m + ' master’s entries cover ' + p.masterSubjects.length + ' labels: Applied Statistics has ' + count('Applied Statistics', true) + ', while each of the other labels has one. With this small denominator, one entry changes a master’s-panel share by ' + pct(1, m).replace('%', '') + ' percentage points. This does not measure the availability of master’s courses or awards.';
    } else {
      const pair = count('Neuroscience', true) + count('Integrated Immunology', true);
      title = 'Neuroscience and Integrated Immunology contain ' + pct(pair, m) + ' of health master’s entries';
      conclusion = '<strong>The leading subject changes with the degree-level scope.</strong> Clinical Medicine leads all health & medicine entries with ' + count('Clinical Medicine') + '/' + n + ' (' + pct(count('Clinical Medicine'), n) + '). Within the ' + m + ' master’s entries, Neuroscience (' + count('Neuroscience', true) + ') and Integrated Immunology (' + count('Integrated Immunology', true) + ') together account for ' + pair + ' (' + pct(pair, m) + '). The other ' + (p.masterSubjects.length - 2) + ' labels contain ' + (m - pair) + ' master’s entries. Explicit combined and doctoral pathways stay outside the master’s panel.';
    }
    $(id + '-title').textContent = title;
    $(id + '-meta').textContent = 'All 26 cohorts · ' + fmt(n) + ' ' + p.field.toLowerCase() + ' entries · ' + m + ' at master’s level · exact subject labels, not broader subject families';
    $('question-' + id).style.setProperty('--field-color', A.fields.colours[p.field]);
    $('chart-' + id).innerHTML = '<p class="mini-chart-note subject-scale-note">Both panels use the same 0–' + axisMax + '% scale. Each shows the five largest subject labels, including ties; counts appear beside every bar.</p>' +
      '<div class="field-subject-grid">' + panel(p, false) + panel(p, true) + '</div>' + degreeMix(p) +
      '<p class="figure-note">Subject subdivisions and historical wording remain separate. These charts count exact labels and do not rank unified academic departments. ' +
      (id === 'inside-science' ? 'This editorial science & technology group covers the science, technology, engineering and mathematics subjects assigned to it; health & medicine is analysed separately. ' : '') +
      '<a href="assets/data/subjects-by-field.csv" download>Download every subject count ↓</a></p>';
    $('facts-' + id).innerHTML = [[fmt(n), 'All entries in this field'], [m + ' / ' + fmt(n), 'Master’s level · ' + pct(m, n) + ' of this field'], [p.masterSubjects.length, 'Subject labels within master’s entries']].map(([value, label]) => '<div><dt>' + E(label) + '</dt><dd>' + E(value) + '</dd></div>').join('');
    $(id + '-takeaway').innerHTML = conclusion;
    $('table-' + id).innerHTML = '<table><thead><tr>' + ['Exact subject label', 'All entries', 'Share of field', 'Master’s entries', 'Share of field’s master’s entries', 'DPhil', 'Combined / pathway', 'Not stated'].map(h => '<th scope="col">' + E(h) + '</th>').join('') + '</tr></thead><tbody>' +
      p.subjects.map(g => {
        const subset = p.all.filter(r => r.subject === g.key), levels = level => subset.filter(r => r.study_level === level).length;
        return '<tr data-subject="' + E(g.key) + '"><th scope="row">' + E(g.key) + '</th>' + [g.n, pct(g.n, n), levels("Master's level"), m ? pct(levels("Master's level"), m) : '—', levels('DPhil'), levels('Combined / doctoral pathway'), levels('Not stated')].map(v => '<td>' + E(v) + '</td>').join('') + '</tr>';
      }).join('') + '</tbody></table>';
  }
})();
