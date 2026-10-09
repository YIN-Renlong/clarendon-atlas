# Clarendon Atlas · v0.1a

An independent, interactive exploration of the published Clarendon scholar lists. A static website with no build step, analytics, external fonts or runtime dependencies.

The default view is **2026–27: 222 published entries, 55 country/territory labels, 38 colleges and halls, and 173 DPhil entries (77.9%)**. The archive contains 2,577 entries across 26 cohorts. These are published entries, not a complete register of awards or a deduplicated count of people.

## Open locally

Open `index.html` directly, or run this from the project directory:

    python3 -m http.server 8000 --bind 127.0.0.1

Then visit <http://localhost:8000>. Everything needed by the dashboard is bundled locally, including the dataset and map. Download links and chart navigation work without a server. The external source links require internet access.

## Design and interaction

Warm ivory, deep blue and gold; serif headings with system sans-serif labels. Four views keep ten charts manageable on one page:

| View | Charts |
| --- | --- |
| Overview | Proportional-symbol map; cumulative country concentration; award composition |
| Studies | Country-group DPhil shares; reviewed subject families |
| Colleges | College entry counts; award mix; country–college matrix; geographic breadth against group size |
| Cohorts | Country-share small multiples with each cohort's denominator |

Each chart has a question, a calculated takeaway title, a graphic, an interpretation and an expandable exact-value table. Filters apply to the directory and selected CSV. Chart marks are keyboard-focusable and selectable where filtering is meaningful. URL fragments retain the active view and the five principal filters.

**Cohorts is a comparison view:** its cohort filter highlights a year, and its country filter selects one comparison series. Degree, college and subject-family filters define each year's denominator. All other charts use the ordinary intersection of all five filters.

The searchable directory is paged at 15 entries. Directory search changes the table only; Selected CSV exports all entries matching the five dashboard filters.

## Files

- `index.html`: semantic page structure, chart containers and methodology.
- `assets/css/styles.css`: responsive layout, palette and print styles.
- `assets/js/core.js`: calculation, filtering and CSV helpers.
- `assets/js/main.js`: interactive chart rendering and navigation.
- `assets/js/data.js`: compact dataset generated from the cleaned CSV and subject mapping.
- `assets/js/geography.js`: bundled map paths and approximate country label positions.
- `assets/data/clarendon-scholars-clean.csv`: canonical 18-column cleaned dataset with original cells and source-line references.
- `assets/data/clarendon-cleaning-log.csv`: recorded cleaning decisions.
- `assets/data/clarendon-data-dictionary.csv`: field definitions.
- `assets/data/subject-families.csv`: explicit assignment of all 352 programme subject labels.
- `assets/data/natural-earth-countries.geojson`: geographic source for reproducible map preparation.
- `scripts/prepare_data.py`: standard-library Python data preparation; changed generated outputs are backed up.
- `scripts/validate.py`: integrity checks for the CSV, generated data, geographic coverage and local links.
- `scripts/install-macos.sh`: safe local installation, GitHub publication and preview workflow.
- `scripts/install_files.py`: validates the package, backs up changed files, and copies only package files.

## Sources and interpretation

Scholar records come from a user-supplied text snapshot of [Oxford's Clarendon scholar class lists](https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/scholar-class-lists), dated 9 October 2026. The source invites omitted scholars to request inclusion. Coverage is unknown and varies across cohorts, so these counts cannot establish annual awards, admission rates, scholarship growth, funding amounts or college quality.

Every CSV record is one published entry. Repeated names across years are retained. Two entries for the same name in 2011–12 have different degrees and colleges and are retained with a flag.

Two split records were rejoined. The 2026–27 row with `Same format can be maintained` in the name column keeps its country, degree and college; its cleaned name is blank and its original cell is preserved. There is one missing country and five programme titles without an explicit award abbreviation. Twelve records carry review flags; some flags concern unresolved geographic mapping rather than an error in the source.

Country aliases are documented in the cleaning log. England and Scotland aggregate to the United Kingdom; Hong Kong, Macau and Taiwan remain separate categories. `Japan/France` remains one joint category. Country labels are source categories and are not inferred from names or treated as verified citizenship. The map has no marker for four unresolved labels: Japan/France, Palestine, Palestinian Territories and St Vincent. These entries remain in totals and other charts. The default cohort maps 221 of 222 entries.

Subject families are reviewed editorial groupings, not official Oxford divisions. Each programme has exactly one documented family. Interdisciplinary choices can be changed in the mapping CSV without editing JavaScript.

The base map comes from [Natural Earth 1:110m](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson), which is [public domain](https://www.naturalearthdata.com/about/terms-of-use/). Symbols use approximate country label positions, supplemented for small territories, and do not show personal locations. The background is a cropped equirectangular projection. Map symbol **area**, not radius, is proportional to entry counts; symbol sizes are rescaled for each selection.

## Update data

Keep the canonical CSV field names and original-source columns. Review any new programme labels and add their assignments to `subject-families.csv`. Then run:

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

## Validation and limits of v0.1a

Source totals, derived percentages, every chart's generated SVG, missing/empty selections, chart-driven filters, directory search/paging, CSV escaping and the methods dialog were checked using a DOM harness. The package also includes repeatable Python integrity checks.

Full browser rendering and Safari/mobile interaction have not been visually verified in this environment. In particular, dense country symbols and long labels should be reviewed on the intended display. The dashboard supports current browsers; it does not include legacy browser polyfills.

This is an independent project, not an official University of Oxford or Clarendon Fund website. The original scholar-list content remains attributable to its source; this repository does not assert a new licence over that content.
