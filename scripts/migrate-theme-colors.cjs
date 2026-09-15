// One-time, syntax-aware migration of legacy inline colors. Leaves business code intact.
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { walk(file); continue; }
    if (!/\.jsx?$/.test(file) || /\.test\./.test(file)) continue;
    let source = fs.readFileSync(file, 'utf8');
    if (source.includes('adaptiveInlineStyle') || source.includes('@react-pdf/renderer')) continue;
    const edits = [];
    traverse(parser.parse(source, { sourceType: 'module', plugins: ['jsx'] }), {
      JSXAttribute(p) {
        const expression = p.node.value?.expression;
        if (p.node.name.name !== 'style' || !expression || expression.type === 'JSXEmptyExpression') return;
        if (expression.type === 'Identifier' && expression.name === 'sidebarPositionStyle') return;
        const original = source.slice(expression.start, expression.end);
        if (expression.type === 'ObjectExpression' && !expression.properties.some((property) =>
          property.type === 'SpreadElement' || /^(color|background|border|outline|fill|stroke)/.test(property.key?.name || property.key?.value || '')
        )) return;
        edits.push({ start: expression.start, end: expression.end, text: `adaptiveInlineStyle(${original})` });
      },
    });
    if (!edits.length) continue;
    for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
    let relative = path.relative(path.dirname(file), 'src/config/themeColors').replace(/\\/g, '/');
    if (!relative.startsWith('.')) relative = './' + relative;
    fs.writeFileSync(file, `import { adaptiveInlineStyle } from '${relative}';\n` + source);
    console.log(file);
  }
}
walk('src/pages');
walk('src/components');
for (const [file, local] of [['AttendancePage.js', 'theme'], ['BranchReportsPage.jsx', 'customTheme'], ['Complaiments.jsx', 'theme'], ['DailyFollowUpReport.jsx', 'theme']]) {
  const target = path.join('src/pages', file);
  const source = fs.readFileSync(target, 'utf8');
  fs.writeFileSync(target, source.replace(`<ThemeProvider theme={${local}}>`, `<ThemeProvider theme={(outerTheme) => ({ ...${local}, palette: outerTheme.palette })}>`));
}

const Module = require('module');
const colorModule = new Module('themeColors');
colorModule._compile(require('@babel/core').transformFileSync('src/config/themeColors.js', {
  presets: ['@babel/preset-env'],
}).code, 'themeColors.js');
const postcss = require('postcss');
for (const file of ['src/components/Header.css', 'src/pages/SharedCoursesManager.css', 'src/pages/create-exam.css', 'src/pages/rtl-forms-fix.css']) {
  const css = postcss.parse(fs.readFileSync(file, 'utf8'));
  css.walkDecls((decl) => {
    for (let parent = decl.parent; parent; parent = parent.parent) {
      if (parent.type === 'atrule' && /print/.test(parent.params)) return;
    }
    decl.value = colorModule.exports.adaptiveColor(decl.value, decl.prop);
  });
  fs.writeFileSync(file, css.toString());
}
