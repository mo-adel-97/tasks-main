const fs=require('fs'),path=require('path'),parser=require('@babel/parser'),traverse=require('@babel/traverse').default;
const baseline=JSON.parse(fs.readFileSync('ui-review/responsive/baseline.json','utf8'));
const changes=[];
for(const file of Object.keys(baseline).filter(f=>/\.jsx?$/.test(f))) {
  const source=fs.readFileSync(file,'utf8'), edits=[];
  const ast=parser.parse(source,{sourceType:'unambiguous',plugins:['jsx']});
  traverse(ast,{TemplateLiteral(p){
    const raw=source.slice(p.node.start,p.node.end);
    if(!raw.includes('</head>') || !raw.includes('window.print()'))return;
    let next=raw.replaceAll('window.print()','printWhenReady()').replace('</head>','${PRINT_READY_SCRIPT}</head>');
    if(!/@page\s*\{/.test(raw)) next=next.replace('<style>','<style>@page { size: A4 portrait; margin: 10mm; }');
    edits.push({start:p.node.start,end:p.node.end,text:next});
    p.skip();
  }});
  if(!edits.length)continue;
  let next=source;
  for(const e of edits.sort((a,b)=>b.start-a.start))next=next.slice(0,e.start)+e.text+next.slice(e.end);
  const rel=path.relative(path.dirname(file),'src/utils/printReady').replaceAll('\\','/');
  next=`import { PRINT_READY_SCRIPT } from '${rel.startsWith('.')?rel:'./'+rel}';\n`+next;
  parser.parse(next,{sourceType:'unambiguous',plugins:['jsx']});
  fs.writeFileSync(file,next);changes.push({file,documents:edits.length});
}
fs.writeFileSync('ui-review/responsive/print-migration.json',JSON.stringify(changes,null,2));
console.log(changes);
