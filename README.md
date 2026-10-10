# Clarendon Atlas · v0.4a

An independent, interactive exploration of the published Clarendon scholar lists. A static website with no build step, analytics, external fonts or runtime dependencies.

Both default views use **all 2,577 published entries across 26 cohorts, from 2001–02 to 2026–27**. The full archive has **113 country/territory labels, 44 historical college/hall labels, and 1,999 DPhil entries (77.6%)**. These are published entries, not a complete register of awards or a deduplicated count of people.

## Open locally

Open `index.html` directly, or run this from the project directory:

    python3 -m http.server 8000 --bind 127.0.0.1

Then visit <http://localhost:8000>. Everything needed by the dashboard is bundled locally, including the dataset and map. Download links and chart navigation work without a server. The external source links require internet access.

## Two ways to read the data

**Read the story** (`index.html`) is the default: one continuous scrolling page with 28 questions. All chart headlines, graphics, 84 key figures and interpretations are visible without choosing parameters, switching tabs or opening tooltips. Exact-value tables are optional additions. Questions 1–18 pool the complete archive, including five regional stories; questions 19–28 examine annual differences, continuity and explicitly labeled five-cohort blocks. Larger published lists contribute more to pooled percentages; the aggregate is not an equally weighted average of cohort percentages.

**Explore the data** (`explore.html`) retains the original advanced interface. Use its five filters, four views, searchable directory and selection export to investigate a particular question. It contains the original ten interactive charts. Its starting scope and Reset action both select all cohorts; individual years remain available in the cohort filter. Clicking a selected country again removes it. A clear-country button beside the map and removable active-filter chips provide explicit alternatives; clearing one filter preserves the others.

Both modes display **Developed by YIN Renlong · 2026** beside the logo. The story’s sticky chapter bar spans the full viewport and repeats the logo and linked author credit on its left. The author’s name links to https://www.yin.roma.it/ in the header and footer. The visual style uses warm ivory, deep blue and gold, serif headings and system sans-serif labels. Dense charts have readable HTML alternatives on narrow screens; print includes the entire story.

| Story chapter | Questions and graphics |
| --- | --- |
| Geography | 1. Regional-color map. 2. Concentration curve. 3. Single-entry country labels. |
| Regions | 4–8. Europe, Asia, Americas, Africa and Oceania. |
| Study | 9. Award pathways. 10. Master’s-level award labels. 11. Country degree profiles. 12. Subject families. 13. Broad fields: all entries versus master’s. 14. Subject degree profiles. |
| Colleges | 15. Group size. 16. Degree profiles. 17. Country–college connections. 18. College size and geographic breadth. |
| Over time | 19. One coverage bar chart with all annual denominators. 20. Country shares. 21. Regional shares. 22. DPhil continuity. 23. Master’s counts and shares. 24. Country/college concentration. 25. Subject families. 26. Broad fields. 27. Field mix within master’s. 28. Country recurrence. |
| Sources | Snapshot, seven method cards, geographic exceptions and ten described downloads. |

A full-width sticky chapter menu highlights the current section during scrolling and displays reading progress. Chapter links stay horizontally scrollable on narrow screens. All story insights are visible without operating filters.

The story separates the observation from its interpretation. For example, 113 country labels indicate broad reach while five groups contain 54.6% of entries. Lincoln has 151 entries and Wolfson 105, but their DPhil counts are much closer: 96 and 94. Historical changes are explicitly limited to published records because completeness is unknown.

In Explore mode, chart marks can focus the filters. URL fragments retain the active view and five principal filters. The directory is paged at 15 entries. Directory search changes the table only; Selected CSV exports all entries matching the five dashboard filters.

**Explore's Cohorts view is a comparison view:** its cohort filter highlights a year, and its country filter selects one comparison series. Degree, college and subject-family filters define each year's denominator. Other Explore charts use the ordinary intersection of all five filters.

## Temporal analysis

All annual charts cover entry years **2001–2026**, corresponding to cohorts **2001–02 through 2026–27**. The Over time chapter consolidates the former Archive section and the temporal stories. The list-length bar chart now opens this chapter, with counts on the bars and an exact table; the duplicate denominator-card grid is removed. The original #archive anchor still resolves here. Explore filters are preserved. Hollow markers and pale shading flag lists shorter than 50 entries as a reading aid only; completeness is unknown for every cohort. Lines connect observed annual shares, with no fitted trend or forecast.

- Regional panels use the same 0–100% scale and retain a separate Mixed / unresolved category. Asia rises from 115/668 (17.2%) in entry years 2016–20 to 253/1,052 (24.0%) in 2021–25.
- DPhil shares are 521/668 (78.0%) and 829/1,052 (78.8%) in those blocks. Annual DPhil shares from 2013–14 onwards range from 161/222 (72.5%) to 178/212 (84.0%). This describes the lists, not statistical equivalence.
- The five largest country groups account for 108/222 (48.6%) in 2026–27, the first list below half. Top-five college shares range from 28.8% to 35.3% across entry years 2014–26. Each year's largest groups are selected afresh, with all list entries in the denominator. Missing country labels are excluded from rankings, but retained in the denominator. Historical college names stay separate.
- Health & medicine leads all 16 annual lists from 2011–12 onwards. Its annual plot uses a labeled 0–40% scale. The heatmap includes every one of the 17 editorial families, in non-overlapping five-cohort blocks, followed by 2026 alone. Blocks pool counts before division; they do not average cohort percentages.
- The recurrence matrix shows the twelve largest country groups by full-archive count. The US appears in 25 cohorts; Canada, China and India in 23 each. Every cohort contributes at most one presence mark, irrespective of list length. An empty marker does not establish an absence of scholars or a first-ever award.

The annual CSVs use `entry_year` for the cohort's start year, `entries` for published records, and percentage fields on a 0–100 scale. `cohort-summary.csv` stores list sizes, distinct stated country/college labels, degree counts, annual top-five counts/shares and counts/shares for all six regional categories, master’s and combined/pathway levels, and the four broad fields. `cohort-composition.csv` has `dimension` (region, subject_family, country, college, study_level, broad_field), `label`, group `entries`, the full `cohort_entries` denominator, and `share_pct`; absent groups are explicitly zero-filled. Sum within **one dimension and one cohort** only, because the same entry appears in each of the six dimensions. The missing country is labeled `Not stated`.

These measures cannot distinguish changes in the underlying scholarship community from changes in who appears in the published lists. There are no significance tests, policy explanations or causal claims. The first five cohorts contain just 25 entries combined.

## Master’s-level study and broad fields

The v0.4a release adds five stories, bringing the page to 28 questions. **The original 2,577 records, source degree labels, subject families and geographic assignments are unchanged.** New `study_level` and `broad_field` fields are derived separately for the browser dataset.

The level counts reconcile to all records: **1,999 DPhil; 555 master’s level; 18 combined / doctoral pathways; 5 without a stated award**. Master’s level includes MSc, MSt, MPhil, BPhil, BCL, MPP, MSc by Research, MFA, MBA, MJur and MLitt. Oxford describes [BCL and BPhil as master’s-level degrees](https://www.ox.ac.uk/admissions/graduate/courses/taught-courses). Research master’s are included. The nine explicitly combined MSc + DPhil labels plus nine additional entries marked 1+3, 2+2 or 2+3 are kept outside the master’s-only series. Oxford describes these [master’s-plus-doctoral pathways](https://www.futureoffood.ox.ac.uk/doctoral-training-partnerships). Original `degree_type` values are preserved. A CDT/DTP label alone does not establish a level; these classifications do not establish completed degrees, programme stage or later progression.

`degree-levels.csv` contains all 485 distinct full degree labels, original degree type, derived level, rationale and an explanatory source URL. New or changed labels must be reviewed there before regenerating data. The five unspecified entries correspond to four distinct programme labels.

`subject-fields.csv` assigns all 352 subject labels to **four editorial broad fields**, with the original family and an assignment note. These are not official Oxford divisions, historical departmental affiliations, or a uniquely correct disciplinary taxonomy. Geography and environmental policy are generally grouped with social sciences; Earth and explicitly natural environmental science subjects have documented Science & technology overrides. Contemporary/regional area-studies subjects and Social Data Science have Social sciences assignments; Digital Scholarship is assigned to Humanities & arts. Interdisciplinary boundary choices are visible in the CSV, and existing subject-family assignments remain untouched.

| Broad field | All entries | Master’s-level entries | Master’s share within field |
| --- | ---: | ---: | ---: |
| Humanities & arts | 765 | 242 | 31.6% |
| Social sciences | 576 | 215 | 37.3% |
| Science & technology | 649 | 7 | 1.1% |
| Health & medicine | 587 | 91 | 15.5% |

Humanities and social sciences together account for **1,341/2,577 (52.0%) of all entries** and **457/555 (82.3%) of master’s-level entries**. Of the 555 master’s entries, MSc has 201, MSt 175 and MPhil 134; those three labels account for 510 (91.9%).

The master’s time story uses separate count and percentage charts, not two overlaid axes. Entry years 2016–20 contain 143 master’s entries out of 668 (21.4%); 2021–25 contain 207 out of 1,052 (19.7%); 2026–27 has 49 out of 222 (22.1%). Higher counts can coexist with a lower share.

Among **all entries**, Humanities & arts moves from 193/668 (28.9%) to 331/1,052 (31.5%) across the two latest complete five-cohort blocks; Social sciences moves from 155/668 (23.2%) to 206/1,052 (19.6%). Among **master’s-level entries only**, Humanities & arts moves from 59/143 (41.3%) to 104/207 (50.2%). These are separate denominators. Master’s field blocks show every field and keep 2026 separate; the first block has only six master’s entries.

`masters-by-field.csv` supplies all 104 cohort–field cells. Its denominator is `masters_entries`, with `entries` the field count and `share_pct` a 0–100 percentage. The 2003–04 list has no master’s-only entries under this classification: its four percentages are blank, not zero. The story table displays these undefined shares as dashes.

The concentration story now spells out its headline: in 2026–27, the US (39), UK (27), China (15), Canada (14) and Germany (13) total **108/222 (48.6%)**; the other 50 country labels contain **114/222 (51.4%)**. A labeled split bar makes this visible before the annual series.

## Files

- `index.html`: the default scrolling story, with 28 visible questions and source notes.
- `explore.html`: the advanced dashboard, filters and searchable directory.
- `assets/css/styles.css`: shared palette and Explore layout.
- `assets/css/story.css`: scrolling layout, narrow-screen chart alternatives and full-story print styles.
- `assets/js/core.js`: calculation, filtering and CSV helpers.
- `assets/js/main.js`: shared chart rendering and advanced navigation.
- `assets/js/story.js`: story charts, derived key figures, interpretations and small-screen alternatives.
- `assets/js/story-regions.js`: regional stories, geographic exceptions and scrolling chapter navigation.
- `assets/js/story-time.js`: annual and block-based temporal stories, master’s analysis, broad-field trends and country recurrence.
- `assets/js/story-academics.js`: master’s award counts and all-entry versus master’s broad-field composition.
- `assets/js/classifications.js`: browser metadata for study levels and editorial broad fields.
- `assets/js/regions.js`: browser-ready geographic assignments generated from the region mapping CSV.
- `assets/js/data.js`: compact dataset generated from the cleaned CSV and subject mapping.
- `assets/js/geography.js`: bundled map paths and approximate country label positions.
- `assets/data/clarendon-scholars-clean.csv`: canonical 18-column cleaned dataset with original cells and source-line references.
- `assets/data/clarendon-cleaning-log.csv`: recorded cleaning decisions.
- `assets/data/clarendon-data-dictionary.csv`: field definitions.
- `assets/data/subject-families.csv`: explicit assignment of all 352 programme subject labels.
- `assets/data/country-regions.csv`: all 113 country labels plus the missing label, with regions, subregions and assignment notes.
- `assets/data/natural-earth-countries.geojson`: geographic source for reproducible map preparation.
- `assets/data/cohort-summary.csv`: 26 cohort rows with counts, six-decimal percentage shares and explicit denominators.
- `assets/data/cohort-composition.csv`: a zero-filled annual panel for all regions, subject families, countries, college labels, study levels and broad fields.
- `assets/data/degree-levels.csv`: 485 full degree-label assignments, rationales and reference URLs.
- `assets/data/subject-fields.csv`: 352 explicit broad-field assignments with boundary decisions.
- `assets/data/masters-by-field.csv`: 104 annual field counts within master’s-level entries, retaining undefined shares.
- `scripts/time_series.py`: deterministic annual CSV generation, called by data preparation.
- `scripts/prepare_data.py`: standard-library Python data preparation; changed generated outputs are backed up.
- `scripts/validate.py`: integrity checks for the CSV, generated data, geographic coverage and local links.
- `scripts/install-macos.sh`: safe local installation, GitHub publication and preview workflow.
- `scripts/install_files.py`: validates the package, backs up changed files, and copies only package files.

## Sources and interpretation

Scholar records come from a user-supplied text snapshot of [Oxford's Clarendon scholar class lists](https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/scholar-class-lists), dated 9 October 2026. The source invites omitted scholars to request inclusion. Coverage is unknown and varies across cohorts, so these counts cannot establish annual awards, admission rates, scholarship growth, funding amounts or college quality.

Every CSV record is one published entry. Repeated names across years are retained. Two entries for the same name in 2011–12 have different degrees and colleges and are retained with a flag.

Two split records were rejoined. The 2026–27 row with `Same format can be maintained` in the name column keeps its country, degree and college; its cleaned name is blank and its original cell is preserved. There is one missing country and five programme titles without an explicit award abbreviation. Twelve records carry review flags; some flags concern unresolved geographic mapping rather than an error in the source.

Country aliases are documented in the cleaning log. England and Scotland aggregate to the United Kingdom; Hong Kong, Macau and Taiwan remain separate categories. `Japan/France` remains one joint category. Country labels are source categories and are not inferred from names or treated as verified citizenship. The map has no marker for four unresolved labels: Japan/France, Palestine, Palestinian Territories and St Vincent. These entries remain in totals and other charts. The full archive maps 2,571 of 2,577 entries; six entries have missing or unresolved geographic labels.

Regional grouping follows Natural Earth’s `REGION_UN` and `SUBREGION`, with documented assignments for smaller territories and source aliases, using the [UN M49 geographic framework](https://unstats.un.org/unsd/methodology/m49/). Russia is assigned to Europe; Turkey, Cyprus, Armenia, Azerbaijan, Georgia and Kazakhstan to Asia. Kosovo and Taiwan remain separate source labels with Natural Earth geographic assignments. Geographic groupings do not imply political status.

The region totals are Europe **1,016**, Asia **563**, Americas **711**, Africa **97** and Oceania **186**. A separate **4-entry Mixed / unresolved** category contains Japan/France (2), St Vincent (1) and the missing country (1). The five regions plus this category reconcile to all 2,577 records. Regional shares use the region total; shares of the whole archive use 2,577. Palestine and Palestinian Territories are classified in Asia while retaining their unmapped status.

Subject families are reviewed editorial groupings, not official Oxford divisions. Each programme has exactly one documented family. Interdisciplinary choices can be changed in the mapping CSV without editing JavaScript.

The base map comes from [Natural Earth 1:110m](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson), which is [public domain](https://www.naturalearthdata.com/about/terms-of-use/). Symbols use approximate country label positions, supplemented for small territories, and do not show personal locations. The background is a cropped equirectangular projection. Map symbol **area**, not radius, is proportional to entry counts; symbol sizes use all countries after the other filters, so changing only the country filter preserves the size scale. Color encodes geographic region; the selected country has a separate outline.

## Update data

Keep the canonical CSV field names and original-source columns. Review any new programme labels and add their assignments to `subject-families.csv`. Add each new country label to `country-regions.csv`, documenting the regional decision. Review every new degree label in `degree-levels.csv` and every new subject in `subject-fields.csv`. Then run:

    python3 scripts/prepare_data.py
    python3 scripts/validate.py

Preparation does not download or scrape live class lists. Update the snapshot metadata and page copy when changing the source snapshot. The `--initial-mapping` option is only a keyword-assisted starting point for a missing mapping file; review its assignments before use.

## GitHub and macOS installation

The supplied installation workflow defaults to:

- Owner: `YIN-Renlong`
- Repository: `clarendon-atlas`
- Project: `/Users/Renlong/Projects/GitHub/YIN-Renlong/clarendon-atlas`
- Repository URL: <https://github.com/YIN-Renlong/clarendon-atlas>
- Expected Pages URL: <https://yin-renlong.github.io/clarendon-atlas/>
- Pages source: `main`, `/`

The installer requires Python 3, Git and an authenticated GitHub CLI. It checks repository state, verifies the package before copying, creates timestamped backups of files it changes, commits only package paths, and pushes without force. An existing remote is cloned when the local project does not yet exist. An existing local repository must be clean and on `main`. A remote mismatch or diverged branch stops with an explanation.

New repositories are public. Existing repository visibility is preserved. Pages setup is attempted after a successful push. The script opens a local preview on an available loopback port starting at 8000; its process information is stored in the ignored `.preview.json`. It reuses the preview on a repeat run when that process can be verified.

Backups live outside the repository under the workspace's `_project_backups` folder. No tokens or credentials are written into project files.

## Validation and limits of v0.4a

The package includes repeatable Python integrity checks for the full archive, generated assets, local links, all 28 story sections and regional reconciliation. The canonical records, cleaning log, data dictionary, subject mapping and geographic source are unchanged from the previous release. The regional mapping is also unchanged. Annual summary and composition CSVs now include the new, separately documented degree levels and broad fields; no canonical source records were added, removed or edited.

DOM interaction checks cover country selection and deselection, clear controls, keyboard activation, preservation of other filters, URL state and chapter tracking. Temporal checks reconcile the annual plot marks, subject and master’s block cells, and recurrence markers with independently generated CSV fixtures. Additional checks cover master’s classification, undefined shares, a single coverage section, branded navigation and the relocated historical anchor. All annual CSV cells are checked against the canonical records. Chart SVGs are rendered separately for visual inspection; the site has no test or browser dependencies.

Full browser rendering and Safari/mobile interaction have not been visually verified in this environment. Review the page in the local preview, especially the narrow-screen chart alternatives and print layout. The dashboard supports current browsers; it does not include legacy browser polyfills.

This is an independent project, not an official University of Oxford or Clarendon Fund website. The original scholar-list content remains attributable to its source; this repository does not assert a new licence over that content.
