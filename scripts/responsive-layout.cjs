const fs=require('fs'),parser=require('@babel/parser'),traverse=require('@babel/traverse').default;
const baseline=JSON.parse(fs.readFileSync('ui-review/responsive/baseline.json','utf8'));
const changes=[];
for(const file of Object.keys(baseline).filter(f=>/\.jsx?$/.test(f))) {
  const source=fs.readFileSync(file,'utf8'), edits=[];
  const ast=parser.parse(source,{sourceType:'unambiguous',plugins:['jsx']});
  traverse(ast,{JSXAttribute(p){
    if(p.node.name.name!=='sx')return;
    const raw=source.slice(p.node.start,p.node.end);
    // Explicit per-row grids already define their responsive columns and gaps.
    // The generic auto-fit addition must not replace those definitions.
    if(raw.includes('uiLayout.formGridSx')&&raw.includes('gridTemplateColumns')) edits.push({start:p.node.start,end:p.node.end,text:raw.replaceAll('uiLayout.formGridSx','uiLayout.formSectionSx')});
  }});
  if(!edits.length)continue;
  let next=source;
  for(const e of edits.sort((a,b)=>b.start-a.start))next=next.slice(0,e.start)+e.text+next.slice(e.end);
  fs.writeFileSync(file,next);changes.push({file,explicitRows:edits.length});
}
fs.writeFileSync('ui-review/responsive/explicit-grid-migration.json',JSON.stringify(changes,null,2));
console.log(changes);
