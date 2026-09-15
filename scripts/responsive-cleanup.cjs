const fs = require('fs'), path = require('path');
const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
const files = [];
function walk(dir) { for (const e of fs.readdirSync(dir, {withFileTypes:true})) e.isDirectory() ? walk(path.join(dir,e.name)) : /\.(jsx?|css)$/.test(e.name) && files.push(path.join(dir,e.name)); }
walk('src');
fs.mkdirSync('ui-review/responsive', {recursive:true});
const baselinePath='ui-review/responsive/baseline.json';
if (!fs.existsSync(baselinePath)) fs.writeFileSync(baselinePath, JSON.stringify(Object.fromEntries(files.map(f=>[f,fs.readFileSync(f,'utf8')]))));
const audit=[];
for (const file of files.filter(f=>/\.jsx?$/.test(f))) {
  const source=fs.readFileSync(file,'utf8');
  const ast=parser.parse(source,{sourceType:'unambiguous',plugins:['jsx']});
  traverse(ast,{
    JSXElement(p) {
      const opening=p.node.openingElement;
      const sx=opening.attributes.find(a=>a.name?.name==='sx');
      if (!sx || !source.slice(sx.start,sx.end).includes('uiLayout.formGridSx')) return;
      audit.push({file,line:opening.loc.start.line,tag:opening.name.name,children:p.node.children.filter(c=>c.type==='JSXElement').map(c=>c.openingElement.name.name),sx:source.slice(sx.start,sx.end)});
    }
  });
}
fs.writeFileSync('ui-review/responsive/form-context.json',JSON.stringify(audit,null,2));
console.log(JSON.stringify({files:files.length,forms:audit.length}));

if (process.argv.includes('--apply')) {
  const changes=[];
  // Reviewed nested-section wrappers: preserve their original Stack/flex layout.
  const sectionLines = {
    'src/components/CallHistory.jsx':[545],
    'src/components/HrPermissionWorkflowManager.jsx':[220],
    'src/pages/components/HrPermissionWorkflowManager.jsx':[221],
    'src/pages/CourseStudentsPage.jsx':[1695],
    'src/pages/DiscountRequestsReport.jsx':[2587],
    'src/pages/HrAttendancePage.js':[4478,4695,4893],
    'src/pages/HrEmployeesPage.jsx':[9661],
    'src/pages/HrLeavesPage.jsx':[3516,3852,4020],
    'src/pages/JournalEntry.jsx':[1227],
  };
  for (const file of files.filter(f=>/\.jsx?$/.test(f))) {
    let source=fs.readFileSync(file,'utf8'), next=source;
    const sections=audit.filter(a=>a.file===file && sectionLines[file.replaceAll('\\','/')]?.includes(a.line));
    for(const s of sections) next=next.replace(s.sx,s.sx.replace('uiLayout.formGridSx','uiLayout.formSectionSx'));
    // Literal query matches only: unrelated years, z-indices and document IDs stay intact.
    let count=0;
    next=next.replace(/(["'])([^"'\r\n]*max-width:\s*1599px[^"'\r\n]*)\1(\s*:)?/g,(all,q,value,colon)=>{
      count++;
      const query=value.replace(/1599px/g,'${DESKTOP_BREAKPOINT - 0.05}px');
      return colon ? '[`'+query+'`]'+colon : '`'+query+'`';
    });
    // These raw CSS templates style SweetAlert only; compact density is valid
    // on desktop too, with the existing phone override following it.
    next=next.replace(/@media \(max-width:\s*1599px\)/g,()=>{count++;return '@media screen';});
    if (/\/(DiscountOrderDialog|RefundRequestDialog)\.jsx$/.test(file.replaceAll('\\','/'))) {
      next=next.replace(/:\s*1600;/,': DESKTOP_BREAKPOINT;');
      next=next.replace(/  const isTabletView =\s*width >= 600 && width < 1600;\s*if \(!isPhoneView && !isTabletView\)\s*(?:\{\s*return \{\};\s*\}|return \{\};)/,'');
      count+=(source.match(/\b1600\b/g)||[]).length;
    }
    if (count && !/import\s*\{[^}]*\bDESKTOP_BREAKPOINT\b[^}]*\}\s*from/.test(next)) {
      const rel=path.relative(path.dirname(file),'src/config/sidebarLayout').replaceAll('\\','/');
      next=`import { DESKTOP_BREAKPOINT } from '${rel.startsWith('.')?rel:'./'+rel}';\n`+next;
    }
    // Only page-level shell wrappers with a plain maxWidth; viewport-relative
    // modal/overlay and mobile calc() widths are intentionally retained.
    if(source.includes('NavigationShell')) next=next.replace(/maxWidth:\s*(["'])100vw\1/g,'maxWidth: "100%"');
    if(next!==source) {
      parser.parse(next,{sourceType:'unambiguous',plugins:['jsx']});
      fs.writeFileSync(file,next);
      changes.push({file,legacy:count,sections:sections.length});
    }
  }
  fs.writeFileSync('ui-review/responsive/migration.json',JSON.stringify(changes,null,2));
  console.log(JSON.stringify({changed:changes.length,legacy:changes.reduce((n,c)=>n+c.legacy,0),sections:changes.reduce((n,c)=>n+c.sections,0)}));
}
