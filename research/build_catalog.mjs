import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Workbook, SpreadsheetFile, FileBlob } from '@oai/artifact-tool';

const here = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(here, '../outputs/cac-research-20261009');
const previewDir = path.resolve(here, 'previews');
await fs.mkdir(previewDir, { recursive: true });
const research = JSON.parse(await fs.readFile(path.join(here, 'curated.json'), 'utf8'));

// Follow-up research extends the existing tables. Keeping the workbook preserves
// the original archive, filters, and first-pass shortlist exactly as delivered.
if (process.argv.includes('--expand')) {
  const expansion = JSON.parse(await fs.readFile(path.join(here, 'niche-expansion.json'), 'utf8'));
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(path.join(outputDir, 'winning-app-research.xlsx')));
  console.log((await workbook.inspect({ kind: 'sheet', include: 'id,name', maxChars: 1400 })).ndjson);

  function appendRecords(sheetName, columns, records, height) {
    const sheet = workbook.worksheets.getItem(sheetName);
    const table = sheet.tables.items[0];
    const oldRows = table.getDataRows();
    const oldKeys = new Set(oldRows.map(row => JSON.stringify(row.slice(0, 3))));
    // Refresh a previously added record if its description has been clarified.
    records.forEach(record => {
      const row = columns.map(key => record[key] ?? '');
      const existingIndex = oldRows.findIndex(old => JSON.stringify(old.slice(0, 3)) === JSON.stringify(row.slice(0, 3)));
      if (existingIndex >= 0) {
        sheet.getRange(`A${existingIndex + 6}:${columnName(columns.length - 1)}${existingIndex + 6}`).values = [row];
      }
    });
    const newRows = records.map(record => columns.map(key => record[key] ?? ''))
      .filter(row => !oldKeys.has(JSON.stringify(row.slice(0, 3))));
    if (newRows.length) {
      table.rows.add(null, newRows);
      const start = oldRows.length + 6;
      const last = columnName(columns.length - 1);
      const added = sheet.getRange(`A${start}:${last}${start + newRows.length - 1}`);
      added.format.font = { name: 'Arial', size: 10, color: '#253048' };
      added.format.wrapText = true;
      added.format.verticalAlignment = 'center';
      added.format.rowHeight = height;
      const yearColumn = columns.indexOf('year');
      if (yearColumn >= 0) sheet.getRange(`${columnName(yearColumn)}${start}:${columnName(yearColumn)}${start + newRows.length - 1}`).setNumberFormat('0');
    }
    return { sheet, count: oldRows.length + newRows.length, start: oldRows.length + 6 };
  }

  const global = appendRecords('GlobalProjects', ['project','year','event','region','recognition','award','summary','limitation','award_source','project_url','repository_url'], expansion.projects, 80);
  const archives = appendRecords('ArchiveLinks', ['name','region','kind','useful_for','limitation','url'], expansion.archives, 74);
  global.sheet.getRange('A3').values = [[`${global.count} international project records. Overall, local, track, peer-voted and cash awards are identified separately.`]];
  archives.sheet.getRange('A3').values = [[`${archives.count} research links. Some are searchable databases; others are result pages, code, or non-winner idea archives.`]];
  const concepts = workbook.worksheets.getItem('Concepts5');
  concepts.getRange('A6:G10').values = research.concepts.map(c => ['name','audience','pitch','technical','mvp','cac_change','validation'].map(key => c[key]));
  concepts.getRange('A3').values = [['Current five ideas. See strong-winner-shortlist-and-apps.md for winner sources, build plans and first versions.']];
  workbook.worksheets.getItem('Shortlist30').getRange('A3').values = [['Original first-pass selection: 12 metro/suburban CAC winners and 18 hackathon prize winners. Current ideas are on Concepts5.']];
  const coverage = workbook.worksheets.getItem('Coverage');
  coverage.getRange('K29:L29').values = [['Research expansion', `${expansion.projects.length} additional prize-winning project records and ${expansion.archives.length} additional research links. Award-level distinctions are preserved.`]];
  coverage.getRange('K29:L29').format.font = { name: 'Arial', size: 10, color: '#253048' };
  coverage.getRange('K29:L29').format.wrapText = true;
  coverage.getRange('K29:L29').format.rowHeight = 65;

  workbook.recalculate();
  console.log((await workbook.inspect({ kind: 'table', range: 'Concepts5!A6:C10', tableMaxRows: 5, tableMaxCols: 3, maxChars: 2300 })).ndjson);
  console.log((await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#NULL!|#SPILL!|#CALC!', options: { useRegex: true, maxResults: 20 }, maxChars: 1000 })).ndjson);
  const views = [
    ['Concepts5', 'A5:D10', 'Concepts5-revised'],
    ['Concepts5', 'E5:G10', 'Concepts5-builds'],
    ['GlobalProjects', `A${global.start}:G${Math.min(global.start + 4, global.count + 5)}`, 'GlobalProjects-added'],
    ['ArchiveLinks', `A${archives.start}:F${Math.min(archives.start + 4, archives.count + 5)}`, 'ArchiveLinks-added'],
    ['Coverage', 'K27:L29', 'Coverage-expansion'],
    ['Shortlist30', 'A2:F6', 'Shortlist30-context'],
  ];
  for (const [sheetName, range, label] of views) {
    const png = await workbook.render({ sheetName, range, scale: 1.2, format: 'png' });
    await fs.writeFile(path.join(previewDir, `${label}.png`), new Uint8Array(await png.arrayBuffer()));
  }
  await (await SpreadsheetFile.exportXlsx(workbook)).save(path.join(outputDir, 'winning-app-research.xlsx'));
  console.log(JSON.stringify({ globalProjects: global.count, archiveLinks: archives.count, concepts: research.concepts.length }));
  process.exit(0);
}
const workbook = Workbook.create();

function columnName(index) {
  let value = index + 1;
  let result = '';
  while (value > 0) {
    value--;
    result = String.fromCharCode(65 + value % 26) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

// Each sheet is a different browsing task. The complete CAC catalog has a metro filter.
// We do not maintain a second copy of it merely to display that subset.
const layouts = [];
function tableSheet(name, columns, records, widths, rowHeight, subtitle) {
  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  sheet.getRange('A2').values = [[name.replace(/([a-z])([A-Z])/g, '$1 $2')]];
  sheet.getRange('A2').format.font = { name: 'Arial', size: 14, bold: true, color: '#17223B' };
  sheet.getRange('A3').values = [[subtitle]];
  sheet.getRange('A3').format.font = { name: 'Arial', size: 10, italic: true, color: '#526078' };
  const headers = columns.map(c => c[0]);
  const values = records.map(record => columns.map(([, key]) => record[key] ?? ''));
  const last = columnName(columns.length - 1);
  const end = values.length + 5;
  const range = sheet.getRange(`A5:${last}${end}`);
  range.values = [headers, ...values];
  range.format.font = { name: 'Arial', size: 10, color: '#253048' };
  range.format.verticalAlignment = 'center';
  range.format.rowHeight = rowHeight;
  range.format.wrapText = true;
  columns.forEach(([, key], i) => {
    const col = columnName(i);
    sheet.getRange(`${col}5:${col}${end}`).format.columnWidth = widths[i] ?? 25;
    sheet.getRange(`${col}6:${col}${end}`).format.horizontalAlignment = ['year','published_rows','unique_district_entries','named_apps','announcements_retrieved','demo_links','metro_focus_entries','shortlisted'].includes(key) ? 'right' : 'left';
    if (key === 'year') sheet.getRange(`${col}6:${col}${end}`).setNumberFormat('0');
    if (key.endsWith('url')) {
      sheet.getRange(`${col}6:${col}${end}`).format.font = { name: 'Arial', size: 10, color: '#285C9E' };
    }
  });
  const table = sheet.tables.add(`A5:${last}${end}`, true, name.replace(/[^a-zA-Z0-9]/g, '') + 'Table');
  table.showFilterButton = true;
  table.style = 'TableStyleMedium2';
  sheet.getRange(`A5:${last}5`).format = {
    fill: '#263956', font: { name: 'Arial', size: 10, bold: true, color: '#FFFFFF' },
    horizontalAlignment: 'center', verticalAlignment: 'center', wrapText: true,
    rowHeight: 34,
  };
  sheet.freezePanes.freezeRows(5);
  sheet.freezePanes.freezeColumns(name === 'CACCatalog' ? 3 : 1);
  layouts.push({ sheet, last, end });
  return sheet;
}

tableSheet('Shortlist30', [
  ['Project','project'], ['Origin','origin'], ['Edition','year'], ['Event / district','event'],
  ['Award','award'], ['What it does','summary'], ['Useful mechanism','useful_mechanism'],
  ['Proposed apps','proposed_ideas'], ['Evidence limit','limitation'], ['Award source','source_url'],
], research.shortlist, [30,12,10,32,29,48,43,25,49,62], 72,
  '12 metro/suburban CAC winners and 18 hackathon prize winners. Selection is editorial.');

tableSheet('Concepts5', [
  ['App','name'], ['Users','audience'], ['Purpose','pitch'], ['Technical work','technical'],
  ['Minimum viable app','mvp'], ['Substantial CAC change','cac_change'], ['Validation','validation'],
], research.concepts, [18,33,45,45,66,70,65], 155,
  'Original proposed implementations. The report includes demos, data plans, and main difficulties.');

tableSheet('ArchiveLinks', [
  ['Archive / database','name'], ['Coverage','region'], ['Source type','kind'],
  ['Useful for','useful_for'], ['Limitations','limitation'], ['Link','url'],
], research.archives, [37,29,33,62,68,78], 74,
  'Searchable databases, official result tables, event galleries, and research datasets are distinguished.');

tableSheet('GlobalProjects', [
  ['Project','project'], ['Edition','year'], ['Event','event'], ['Geography','region'],
  ['Recognition','recognition'], ['Exact award / level','award'], ['Description','summary'],
  ['Evidence limit','limitation'], ['Award source','award_source'], ['Project page','project_url'],
  ['Repository','repository_url'],
], research.global_projects, [34,10,42,34,20,47,58,64,75,75,67], 80,
  'International sample. Descriptions are organizer/team accounts; finalist and HM records are separate.');

const catalog = tableSheet('CACCatalog', [
  ['Edition','year'], ['District','district'], ['App','app_name'], ['Metro comparison','metro_focus'],
  ['Authors','creators'], ['Representative','representative'], ['Detail retrieval','detail_status'],
  ['Review depth','review_depth'], ['Keyword hints','keyword_hints'], ['Editorial summary','editorial_summary'],
  ['Record notes','notes'], ['Winner page','winner_url'], ['Demo link','demo_url'], ['Archive','archive_url'],
], research.cac, [10,11,41,46,48,25,44,49,35,62,42,70,75,60], 52,
  '1,052 unique district-year entries. Filter Metro comparison for the selected focus; keyword hints are automatic.');
catalog.getRange(`G6:G${research.cac.length + 5}`).conditionalFormats.add('containsText', {
  text: 'failed', format: { fill: '#FCE8E6', font: { color: '#A32822', bold: true } },
});
catalog.getRange(`G6:G${research.cac.length + 5}`).conditionalFormats.add('containsText', {
  text: 'Missing', format: { fill: '#FFF2CC', font: { color: '#885600' } },
});

const method = tableSheet('Coverage', [
  ['Edition','year'], ['Published rows','published_rows'], ['Unique entries','unique_district_entries'],
  ['Named apps','named_apps'], ['Announcements retrieved','announcements_retrieved'],
  ['Demo links','demo_links'], ['Metro entries','metro_focus_entries'], ['Shortlisted','shortlisted'], ['Archive','source_url'],
], research.coverage, [13,18,18,18,27,17,18,18,78], 30,
  'Research date: October 9, 2026. Counts describe published archive coverage, not all contest submissions.');
method.getRange('K11').values = [['Method and boundaries']];
method.getRange('K11').format.font = { name: 'Arial', size: 14, bold: true, color: '#17223B' };
research.notes.forEach(([label, description], index) => {
  const row = index + 13;
  method.getRange(`K${row}:L${row}`).values = [[label, description]];
  method.getRange(`K${row}:L${row}`).format.font = { name: 'Arial', size: 10, color: '#253048' };
  method.getRange(`K${row}:L${row}`).format.wrapText = true;
  method.getRange(`K${row}:L${row}`).format.verticalAlignment = 'center';
  method.getRange(`K${row}:L${row}`).format.rowHeight = 78;
  method.getRange(`K${row}`).format.font.bold = true;
});
// The methodology descriptions use a wide single column beside the compact coverage table.
// A separate text area avoids stretching all the numeric columns.
method.getRange('L13:L25').format.columnWidth = 84;
method.getRange('K13:K25').format.columnWidth = 24;
method.getRange('K27:L27').values = [['2026 rulebook', 'https://www.congressionalappchallenge.us/wp-content/uploads/2026/05/2026-CAC-Rules.pdf']];
method.getRange('K27:L27').format.font = { name: 'Arial', size: 10, color: '#285C9E' };
method.getRange('K27:L27').format.wrapText = true;
method.getRange('K27:L27').format.rowHeight = 45;

workbook.recalculate();
const inspection = await workbook.inspect({
  kind: 'table', range: 'Shortlist30!A5:F9', include: 'values,formulas', tableMaxRows: 5, tableMaxCols: 6,
});
console.log(inspection.ndjson);
const errors = await workbook.inspect({
  kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',
  options: { useRegex: true, maxResults: 30 }, summary: 'Final workbook error scan',
});
console.log(errors.ndjson);
for (const { sheet } of layouts) {
  const range = sheet.name === 'Coverage' ? 'A5:H9' : sheet.name === 'Concepts5' ? 'A5:D8' : 'A5:F10';
  const preview = await workbook.render({ sheetName: sheet.name, range, scale: 1.4, format: 'png' });
  await fs.writeFile(path.join(previewDir, `${sheet.name}.png`), new Uint8Array(await preview.arrayBuffer()));
  if (sheet.name === 'Coverage') {
    const notesPreview = await workbook.render({ sheetName: sheet.name, range: 'K11:L17', scale: 1.4, format: 'png' });
    await fs.writeFile(path.join(previewDir, 'CoverageNotes.png'), new Uint8Array(await notesPreview.arrayBuffer()));
  }
}
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(path.join(outputDir, 'winning-app-research.xlsx'));
console.log(JSON.stringify({ saved: path.join(outputDir, 'winning-app-research.xlsx'), sheets: layouts.length }));
