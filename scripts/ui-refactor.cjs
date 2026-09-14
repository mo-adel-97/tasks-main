const fs = require('fs');
const path = require('path');
const traverse = require('@babel/traverse').default;
const { baseline, parse } = require('./ui-audit.cjs');
const originals = JSON.parse(fs.readFileSync(baseline, 'utf8'));
const report = [];
const fields = new Set(['TextField','FormControl','Autocomplete','DatePicker','DateTimePicker','DesktopDatePicker']);
const buttons = new Set(['Button','LoadingButton','HeaderButton','GradientButton','SuccessButton','ErrorButton','NewTaskButton','AddNewStudentButton']);
function children(node) {
  const result = [];
  function collect(n) {
    if (!n) return;
    if (n.type === 'JSXElement') result.push(n);
    else if (n.type === 'JSXFragment') n.children.forEach(collect);
    else if (n.type === 'JSXExpressionContainer') collect(n.expression);
    else if (n.type === 'ConditionalExpression') { collect(n.consequent); collect(n.alternate); }
    else if (n.type === 'LogicalExpression') collect(n.right);
  }
  node.children.forEach(collect);
  return result;
}
for (const [file, text] of Object.entries(originals)) {
  if ((!/^src\/(pages|components)\//.test(file) && file !== 'src/MyRequests.jsx') || !/\.jsx?$/.test(file)) continue;
  if (process.argv[2] && file !== process.argv[2]) continue;
  const ast = parse(text); // Complete file, including all business logic, is parsed before any edit.
  const edits = [], used = new Set(), notes = {};
  const attr = (n,k) => n.attributes.find(a => a.name?.name === k);
  const name = n => n.openingElement.name.name;
  const mui = new Set();
  traverse(ast, { ImportDeclaration(p) {
    if (/^@mui\//.test(p.node.source.value)) p.node.specifiers.forEach(s => mui.add(s.local.name));
  }});
  const mark = (n, helpers) => {
    if (!helpers.length) return;
    helpers.forEach(h => { used.add(h); notes[h] = (notes[h] || 0) + 1; });
    const sx = attr(n, 'sx');
    if (sx?.value?.type === 'JSXExpressionContainer') {
      used.add('withUiSx');
      edits.push({ start: sx.value.expression.start, end: sx.value.expression.end,
        text: `uiLayout.withUiSx(${text.slice(sx.value.expression.start,sx.value.expression.end)}, ${helpers.map(h => 'uiLayout.'+h).join(', ')})` });
    } else if (!sx) edits.push({ start: n.name.end, end: n.name.end, text: ` sx={${helpers.length === 1 ? 'uiLayout.'+helpers[0] : '['+helpers.map(h => 'uiLayout.'+h).join(', ')+']'}}` });
  };
  traverse(ast, { JSXElement(p) {
    const el = p.node, opening = el.openingElement, tag = name(el);
    if (!mui.has(tag)) return;
    // Printable exam geometry and canvas/PDF dimensions must stay language-specific.
    if (file.endsWith('PrintExamPage.jsx')) return;
    const helpers = [];
    if (['TextField','FormControl'].includes(tag)) helpers.push('formFieldSx');
    if (tag === 'TextField') {
      const labelProps = attr(opening, 'InputLabelProps');
      if (!labelProps) edits.push({start: opening.name.end, end: opening.name.end, text: ' InputLabelProps={{ shrink: true }}'});
      else if (labelProps.value?.expression?.type === 'ObjectExpression') {
        const expr = labelProps.value.expression;
        const shrink = expr.properties.find(x => x.key?.name === 'shrink');
        if (shrink) edits.push({ start: shrink.value.start, end: shrink.value.end, text: 'true' });
        else edits.push({ start: expr.end-1, end: expr.end-1, text: `${expr.properties.length && text.slice(expr.properties.at(-1).end,expr.end-1).trim() !== ',' ? ',' : ''} shrink: true ` });
      }
    }
    if (tag === 'Dialog') helpers.push('dialogLayoutSx');
    if (tag === 'DialogActions') helpers.push('dialogActionsSx');
    if (tag === 'RadioGroup') helpers.push('radioGroupSx');
    if (tag === 'Button') helpers.push('buttonSx');
    if (tag === 'TableContainer') helpers.push('tableContainerSx');
    if (tag === 'DataGrid') helpers.push('dataGridSx');
    const kids = children(el), fieldCount = kids.filter(n => fields.has(name(n))).length;
    const actionCount = kids.filter(n => buttons.has(name(n))).length;
    if (['Box','Stack','Paper','Toolbar'].includes(tag)) {
      if (fieldCount && actionCount) helpers.push('filterBarSx');
      else if (fieldCount >= 2) helpers.push('formGridSx');
      else if (actionCount >= 2) helpers.push('actionBarSx');
      else if (kids.some(n => name(n) === 'Typography') && kids.some(n => ['Stack','Box'].includes(name(n)) && children(n).some(c => buttons.has(name(c))))) helpers.push('pageHeaderSx');
      if (kids.some(n => ['Table','DataGrid'].includes(name(n)))) helpers.push('tableContainerSx');
    }
    if (tag === 'FormControlLabel' && p.parentPath.isJSXElement()) {
      const siblings = children(p.parentPath.node);
      if (siblings.some(n => fields.has(name(n)))) helpers.push('checkboxFieldSx');
    }
    if (tag === 'Grid' && attr(opening,'item') && kids.some(n => fields.has(name(n)))) {
      const xs = attr(opening,'xs');
      if (xs?.value?.expression?.type === 'NumericLiteral' && xs.value.expression.value < 12) {
        edits.push({ start: xs.value.expression.start, end: xs.value.expression.end, text: '12' });
        if (!attr(opening,'sm')) edits.push({ start: opening.name.end, end: opening.name.end, text: ' sm={6}' });
        notes.mobileGrid = (notes.mobileGrid || 0) + 1;
      }
    }
    mark(opening, helpers);
  }});
  if (edits.length) {
    // Existing sx subtrees are retained verbatim; only the outer expression changes.
    const filtered = edits.filter(e => !edits.some(o => o !== e && o.start < e.start && o.end > e.end));
    filtered.sort((a,b) => b.start-a.start || b.end-a.end);
    let updated = text;
    for (const e of filtered) updated = updated.slice(0,e.start)+e.text+updated.slice(e.end);
    const rel = path.relative(path.dirname(file),'src/components/common/uiLayout').replaceAll('\\','/');
    updated = `import * as uiLayout from '${rel.startsWith('.') ? rel : './'+rel}';\n`+updated;
    parse(updated);
    if (fs.readFileSync(file, 'utf8') !== updated) {
      // Windows indexing/antivirus can briefly hold a source file open.
      for (let attempt = 0; ; attempt++) {
        try { fs.writeFileSync(file, updated); break; }
        catch (error) {
          if (attempt >= 5) throw error;
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
        }
      }
    }
  }
  report.push({file, status: edits.length ? 'presentation adjusted' : 'source reviewed; no matching layout change needed', notes,
    visual: 'pending runtime review' });
}
const previous = process.argv[2] ? JSON.parse(fs.readFileSync('ui-review/source-checklist.json','utf8')).filter(r=>r.file!==process.argv[2]) : [];
fs.writeFileSync('ui-review/source-checklist.json', JSON.stringify([...previous,...report],null,2));
console.log(JSON.stringify({ reviewed: report.length, changed: report.filter(r => Object.keys(r.notes).length).length,
  changes: report.reduce((all,r) => { for(const [k,v] of Object.entries(r.notes)) all[k]=(all[k]||0)+v; return all; },{}) }));
