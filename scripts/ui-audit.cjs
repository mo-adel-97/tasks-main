/* Read complete source files before editing; preserve a baseline of the user's
 * working tree (which may already contain edits). No network or app execution. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const baseline = path.join(os.tmpdir(), 'tasks-ui-baseline-' + crypto.createHash('sha256').update(process.cwd()).digest('hex').slice(0, 12) + '.json');
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
const sources = files('src').filter(f => /\.(jsx?|css)$/.test(f) && !f.includes('.test.'));
const parse = text => parser.parse(text, { sourceType: 'module', plugins: ['jsx'] });
function inspect(text) {
  const ast = parse(text), counts = {}, layouts = [];
  traverse(ast, {
    JSXOpeningElement(p) {
      const name = p.node.name.name;
      counts[name] = (counts[name] || 0) + 1;
      if (['Box','Stack','Grid','Paper','Dialog','TextField','FormControl','DataGrid','TableContainer'].includes(name)) {
        const attrs = p.node.attributes.filter(a => ['sx','style','direction','spacing','width','xs','sm','md','lg','maxWidth'].includes(a.name?.name));
        layouts.push({ line: p.node.loc.start.line, name, ui: attrs.map(a => text.slice(a.start, a.end)).join(' ') });
      }
    }
  });
  return { counts, layouts };
}
if (process.argv[2] === 'snapshot') {
  if (fs.existsSync(baseline)) throw new Error('Baseline exists: do not overwrite the original working tree snapshot.');
  const data = Object.fromEntries(sources.map(f => [f.replaceAll('\\','/'), fs.readFileSync(f, 'utf8')]));
  fs.writeFileSync(baseline, JSON.stringify(data));
  const inventory = Object.fromEntries(Object.entries(data).filter(([f]) => /\.jsx?$/.test(f)).map(([f,s]) => [f, inspect(s)]));
  fs.mkdirSync('ui-review', { recursive: true });
  fs.writeFileSync('ui-review/layout-inventory.json', JSON.stringify(inventory, null, 2));
  console.log(JSON.stringify({ baseline, files: sources.length, lines: Object.values(data).reduce((n,s) => n+s.split('\n').length,0) }));
}
module.exports = { baseline, files, parse, inspect };
