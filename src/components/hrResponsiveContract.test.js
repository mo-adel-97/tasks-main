const fs = require('fs');
const path = require('path');

const SRC_ROOT = path.resolve(__dirname, '..');

const read = (relativePath) =>
  fs.readFileSync(path.join(SRC_ROOT, relativePath), 'utf8');

const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return absolute;
  });

const isHrSource = (absolutePath) => {
  const relative = path.relative(SRC_ROOT, absolutePath).replace(/\\/g, '/');
  const fileName = path.basename(relative);

  if (!/\.(?:js|jsx|ts|tsx)$/.test(fileName)) return false;
  if (!/^(?:hr|employee|trainer)/i.test(fileName) &&
      !/(?:attendance|vacation|leave|department|jobtitle)/i.test(fileName)) {
    return false;
  }

  return relative.startsWith('pages/') || relative.startsWith('components/');
};

const hrSources = walk(SRC_ROOT).filter(isHrSource);

const legacyBreakpointPatterns = [
  /max-width\s*:\s*1599(?:\.95)?px/i,
  /min-width\s*:\s*600px[^)\n]*max-width\s*:\s*1599(?:\.95)?px/i,
  /\b(?:innerWidth|screenWidth|viewportWidth|width)\s*(?:<=|<)\s*(?:1599|1600)\b/i,
  /\b(?:1599|1600)\s*(?:>=|>)\s*(?:innerWidth|screenWidth|viewportWidth|width)\b/i,
];

describe('HR responsive contract', () => {
  test('desktop navigation breakpoint stays at 1200px', () => {
    const source = read('config/sidebarLayout.js');
    expect(source).toMatch(/DESKTOP_BREAKPOINT\s*=\s*1200\b/);
  });

  test('HR sources do not reintroduce the legacy 1599/1600 responsive breakpoint', () => {
    const violations = [];

    hrSources.forEach((absolutePath) => {
      const source = fs.readFileSync(absolutePath, 'utf8');
      legacyBreakpointPatterns.forEach((pattern) => {
        if (pattern.test(source)) {
          violations.push(path.relative(SRC_ROOT, absolutePath).replace(/\\/g, '/'));
        }
      });
    });

    expect([...new Set(violations)]).toEqual([]);
  });

  test('legacy HR compatibility CSS cannot leak MUI or SweetAlert rules globally', () => {
    const css = read('pages/rtl-forms-fix.css');
    const unscopedPortalOrMuiSelectors = css
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^\.(?:Mui|swal2)/.test(line));

    expect(unscopedPortalOrMuiSelectors).toEqual([]);
    expect(css).toContain('body.hr-ui-active');
  });
});
