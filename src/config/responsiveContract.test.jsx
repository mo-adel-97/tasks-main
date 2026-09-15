import fs from 'fs';
import path from 'path';
import { DESKTOP_BREAKPOINT } from './sidebarLayout';
import theme from '../theme';
import { formSectionSx } from '../components/common/uiLayout';

function sourceFiles(dir) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry => {
    const file=path.join(dir,entry.name);
    return entry.isDirectory()?sourceFiles(file):/\.(jsx?|css)$/.test(file)&&!file.includes('.test.')?[file]:[];
  });
}

test('all source files are free from legacy 1599/1600 responsive cutoffs',()=>{
  const failures=sourceFiles(path.join(process.cwd(),'src')).filter(file=>
    /(?:max-width:\s*1599|min-width:\s*1600|(?:innerWidth|width)\s*(?:<|<=)\s*(?:1599|1600))/.test(fs.readFileSync(file,'utf8')));
  expect(failures).toEqual([]);
});

test.each([1200,1280,1366,1440,1536,1600,1920])('%ipx belongs to desktop and the MUI lg contract',width=>{
  expect(width>=DESKTOP_BREAKPOINT).toBe(true);
  expect(width>=theme.breakpoints.values.lg).toBe(true);
  expect(width<DESKTOP_BREAKPOINT).toBe(false);
});

test('section sizing does not replace Stack or explicit grid layout',()=>{
  expect(formSectionSx.display).toBeUndefined();
  expect(formSectionSx.gridTemplateColumns).toBeUndefined();
});
