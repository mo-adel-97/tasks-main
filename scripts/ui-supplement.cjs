const fs=require('fs'),path=require('path'),traverse=require('@babel/traverse').default;
const { files,parse }=require('./ui-audit.cjs');
const updates={};
for(const file of files('src').filter(f=>/\.jsx?$/.test(f)&&!f.includes('.test.')&&!f.endsWith('uiLayout.js'))) {
  const text=fs.readFileSync(file,'utf8'),ast=parse(text),edits=[];
  let helper=false;
  const map={StyledTextField:'formFieldSx',StyledDialog:'dialogLayoutSx',StyledTableContainer:'tableContainerSx',TablePagination:'tablePaginationSx',StyledTablePagination:'tablePaginationSx'};
  traverse(ast,{
    JSXOpeningElement(p) {
      const n=p.node, h=map[n.name.name];
      if(!h)return;
      helper=true;
      const sx=n.attributes.find(a=>a.name?.name==='sx');
      if(sx?.value?.expression) edits.push({start:sx.value.expression.start,end:sx.value.expression.end,text:`uiLayout.withUiSx(${text.slice(sx.value.expression.start,sx.value.expression.end)}, uiLayout.${h})`});
      else edits.push({start:n.name.end,end:n.name.end,text:` sx={uiLayout.${h}}`});
      if(n.name.name==='StyledTextField'&&!n.attributes.some(a=>a.name?.name==='InputLabelProps')) edits.push({start:n.name.end,end:n.name.end,text:' InputLabelProps={{shrink:true}}'});
    },
    JSXAttribute(p) {
      if(p.node.name.name!=='InputLabelProps')return;
      const expr=p.node.value?.expression;
      if(expr?.type!=='ObjectExpression')return;
      for(const prop of expr.properties) if(prop.key?.name==='style' && prop.value.type==='ObjectExpression') {
        // Inline label transforms override CSS; reset only their geometry.
        const kept=prop.value.properties.filter(x=>!['transform','transformOrigin','position','top','right','left','bottom','fontSize','lineHeight','marginTop'].includes(x.key?.name));
        if(kept.length!==prop.value.properties.length) edits.push({start:prop.value.start,end:prop.value.end,text:'{'+kept.map(x=>text.slice(x.start,x.end)).join(', ')+'}'});
      }
    }
  });
  if(!edits.length)continue;
  let next=text;
  for(const e of edits.sort((a,b)=>b.start-a.start))next=next.slice(0,e.start)+e.text+next.slice(e.end);
  if(helper&&!text.includes('import * as uiLayout')) {
    let rel=path.relative(path.dirname(file),'src/components/common/uiLayout').replaceAll('\\','/');
    next=`import * as uiLayout from '${rel.startsWith('.')?rel:'./'+rel}';\n`+next;
  }
  parse(next);
  for(let i=0;;i++){try{fs.writeFileSync(file,next);break;}catch(e){if(i>=5)throw e;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,200);}}
  updates[file.replaceAll('\\','/')]=edits.length;
}
fs.writeFileSync('ui-review/supplement-checklist.json',JSON.stringify(updates,null,2));
console.log(updates);
