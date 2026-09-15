const fs=require('fs'),parser=require('@babel/parser'),traverse=require('@babel/traverse').default;
const baseline=JSON.parse(fs.readFileSync('ui-review/responsive/baseline.json','utf8'));
const audit=[];
const numeric=new Set(['code','nationalid','mobile','date','debit','credit','balance','billcode','day1code']);
const text=new Set(['studentname','notes','description','coursename','branchname','costcenter']);
for(const file of Object.keys(baseline).filter(f=>/\.jsx?$/.test(f))) {
  const source=fs.readFileSync(file,'utf8'),edits=[];
  const ast=parser.parse(source,{sourceType:'unambiguous',plugins:['jsx']});
  traverse(ast,{ObjectExpression(p){
    const props=p.node.properties;
    const field=props.find(x=>x.key?.name==='field')?.value;
    if(field?.type!=='StringLiteral'||!props.some(x=>x.key?.name==='headerName'))return;
    const name=field.value.toLowerCase();
    // Only standard scalar columns, never custom action/rendered controls.
    if(props.some(x=>['renderCell','renderEditCell'].includes(x.key?.name)))return;
    for(const prop of props) {
      if(prop.value?.type!=='NumericLiteral')continue;
      const key=prop.key?.name,prev=prop.value.value;
      let cap;
      if(numeric.has(name)&&['width','minWidth'].includes(key))cap=110;
      if(text.has(name)&&key==='minWidth'&&props.some(x=>x.key?.name==='flex'))cap=140;
      if(cap&&prev>cap){edits.push({start:prop.value.start,end:prop.value.end,text:String(cap)});audit.push({file,field:field.value,key,before:prev,after:cap});}
    }
  }});
  let next=source;for(const e of edits.sort((a,b)=>b.start-a.start))next=next.slice(0,e.start)+e.text+next.slice(e.end);
  if(next!==source)fs.writeFileSync(file,next);
}
fs.writeFileSync('ui-review/responsive/columns.json',JSON.stringify(audit,null,2));console.log(JSON.stringify({columns:audit.length,files:new Set(audit.map(a=>a.file)).size}));
