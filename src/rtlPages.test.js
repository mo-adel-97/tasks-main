import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

const sourceRoot = path.join(process.cwd(), 'src');
const sources = [];
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(file);
    else if (/\.jsx?$/.test(file) && !file.includes('.test.')) {
      sources.push({ file, ast: parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }) });
    }
  }
}
collect(sourceRoot);

test('page roots inside NavigationShell do not restore the old LTR workaround', () => {
  const regressions = [];
  for (const { file, ast } of sources) traverse(ast, {
    JSXElement(p) {
      if (p.node.openingElement.name.name !== 'NavigationShell') return;
      for (const child of p.node.children.filter(x => x.type === 'JSXElement')) {
        for (const attr of child.openingElement.attributes) {
          if (attr.name?.name === 'dir' && attr.value?.value === 'ltr') regressions.push(file);
          if (['sx', 'style'].includes(attr.name?.name)) {
            const props = attr.value?.expression?.properties || [];
            if (props.some(x => x.key?.name === 'direction' && x.value?.value === 'ltr')) regressions.push(file);
          }
        }
      }
    },
  });
  expect(regressions).toEqual([]);
});

test('intentional LTR technical input values are not overridden by RTL inline styles', () => {
  const conflicts = [];
  for (const { file, ast } of sources) traverse(ast, {
    JSXAttribute(p) {
      if (p.node.name.name !== 'inputProps') return;
      const props = p.node.value?.expression?.properties || [];
      if (!props.some(x => x.key?.name === 'dir' && x.value?.value === 'ltr')) return;
      const style = props.find(x => x.key?.name === 'style')?.value;
      if (style?.properties?.some(x => x.key?.name === 'direction' && x.value?.value === 'rtl')) conflicts.push(file);
    },
  });
  expect(conflicts).toEqual([]);
});

test('exam paper selects true RTL for Arabic and preserves English LTR', () => {
  const { ast } = sources.find(x => x.file.endsWith('PrintExamPage.jsx'));
  let direction;
  traverse(ast, { JSXElement(p) {
    if (!p.node.openingElement.attributes.some(a => a.name?.name === 'className' && a.value?.value === 'exam-paper')) return;
    direction = p.node.openingElement.attributes.find(a => a.name?.name === 'sx').value.expression.properties.find(x => x.key?.name === 'direction').value;
  } });
  expect(direction.type).toBe('ConditionalExpression');
  expect(direction.consequent.value).toBe('ltr');
  expect(direction.alternate.value).toBe('rtl');
});

test('local page themes merge the RTL control defaults before theme creation', () => {
  for (const name of ['AttendancePage.js', 'BranchReportsPage.jsx', 'Complaiments.jsx', 'DailyFollowUpReport.jsx']) {
    const { ast } = sources.find(x => x.file.endsWith(name));
    let options;
    traverse(ast, { CallExpression(p) { if (p.node.callee.name === 'createTheme') options = p.node.arguments[0]; } });
    expect(options.callee.name).toBe('deepmerge');
    expect(options.arguments[0].properties.find(x => x.key.name === 'direction').value.value).toBe('rtl');
  }
});

test('HR home Arabic sections and dialogs use RTL while dates stay LTR', () => {
  const { ast } = sources.find(x => x.file.endsWith('HrEmployeeHomePage.jsx'));
  const constants = {};
  traverse(ast, { VariableDeclarator(p) {
    if (p.node.init?.type === 'StringLiteral') constants[p.node.id.name] = p.node.init.value;
  } });
  for (const name of ['PAGE_DIRECTION', 'DETAIL_DIALOG_DIRECTION', 'LEAVE_DIALOG_DIRECTION']) {
    expect(constants[name]).toBe('rtl');
  }
  for (const name of ['PAGE_TEXT_ALIGN', 'DETAIL_DIALOG_TEXT_ALIGN', 'LEAVE_DIALOG_TEXT_ALIGN']) {
    expect(constants[name]).toBe('start');
  }
  expect(constants.DATE_DIRECTION).toBe('ltr');
});

test('exam question sections follow their language without compensating reversal', () => {
  const { ast } = sources.find(x => x.file.endsWith('PrintExamPage.jsx'));
  let checked = 0;
  traverse(ast, { ObjectProperty(p) {
    if (p.node.key.name !== 'direction' || p.node.value.type !== 'ConditionalExpression') return;
    expect(p.node.value.consequent.value).toBe('ltr');
    expect(p.node.value.alternate.value).toBe('rtl');
    checked += 1;
  } });
  expect(checked).toBeGreaterThan(5);
});
