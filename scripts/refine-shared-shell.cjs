// Focused migration of legacy header/notification presentation only.
const fs=require('fs'),path=require('path');
const parse=require('@babel/parser').parse,traverse=require('@babel/traverse').default;
const candidates=fs.readFileSync('ui-review/header-candidates.txt','utf8').trim().split(/\r?\n/).filter(f=>/\.jsx?$/.test(f)&&!f.includes('.test.'));
const results={};
for(const file of candidates){
  const source=fs.readFileSync(file,'utf8'),ast=parse(source,{sourceType:'module',plugins:['jsx']}),edits=[];
  const push=(node,text)=>edits.push({start:node.start,end:node.end,text});
  const patchSx=(opening,helper)=>{
    const sx=opening.attributes.find(a=>a.name?.name==='sx');
    if(sx && source.slice(sx.start,sx.end).includes(`uiLayout.${helper}`)) return;
    if(sx?.value?.expression)push(sx.value.expression,`uiLayout.withUiSx(${source.slice(sx.value.expression.start,sx.value.expression.end)}, uiLayout.${helper})`);
    else edits.push({start:opening.name.end,end:opening.name.end,text:` sx={uiLayout.${helper}}`});
  };
  let needsHelper=false;
  const marked=new Set();
  traverse(ast,{
    JSXElement(p){
      const n=p.node,tag=n.openingElement.name.name;
      const a=k=>n.openingElement.attributes.find(x=>x.name?.name===k);
      if(file.endsWith('Sidebar.jsx')&&tag==='Tooltip'&&/notificationUnreadCount/.test(source.slice(n.start,n.openingElement.end))){push(n,'<></>');p.skip();return;}
      if(tag==='Badge'&&a('badgeContent')&&/notification|unread|unseenPosts|followUpCount|followUpCalls/i.test(source.slice(a('badgeContent').start,a('badgeContent').end))){
        if(n.closingElement){push(n.openingElement,'<>');push(n.closingElement,'</>');}
        else push(n,'<></>');
      }
      if(file.endsWith('Sidebar.jsx')&&tag==='Box'&&a('style')&&source.slice(a('style').start,a('style').end).includes('sidebarPositionStyle')){
        patchSx(n.openingElement,'sidebarSurfaceSx');needsHelper=true;
      }
      if(file.endsWith('Sidebar.jsx')&&tag==='Drawer'){
        const modal=a('ModalProps');
        if(modal?.value?.expression.type==='ObjectExpression' && !source.slice(modal.start,modal.end).includes('disableScrollLock')){
          const expr=modal.value.expression;
          push(expr,`{ ...${source.slice(expr.start,expr.end)}, disableScrollLock: true }`);
        }
      }
      if(['MenuRoundedIcon','MenuIcon','MenuRounded'].includes(tag)){
        const box=p.findParent(x=>x.isJSXElement()&&['Box','AppBar','Toolbar'].includes(x.node.openingElement.name.name));
        if(box&&box.node.openingElement.name.name==='Box'&&!marked.has(box.node.start)){
          const chunk=source.slice(box.node.start,box.node.end);
          if(chunk.includes('<Typography')&&chunk.length<16000){patchSx(box.node.openingElement,'mobileHeaderSx');needsHelper=true;marked.add(box.node.start);}
        }
      }
    },
    StringLiteral(p){
      // Remove only old header min-height !important declarations.
      if(/px !important$/.test(p.node.value)&&p.findParent(x=>x.isJSXElement()&&x.node.openingElement.name.name==='AppBar')&&p.parent.key?.name==='minHeight')push(p.node,JSON.stringify('56px'));
      if(/^(4[8-9]|[5-6]\d|7[0-6])px(?: !important)?$/.test(p.node.value)){
        const style=p.findParent(x=>x.isJSXAttribute()&&x.node.name.name==='sx');
        const height=p.findParent(x=>x.isObjectProperty()&&['mt','pt','paddingTop','marginTop','minHeight'].includes(x.node.key?.name));
        if(style&&height&&(/navigationContentSx/.test(source.slice(style.node.start,style.node.end))||p.findParent(x=>x.isJSXElement()&&x.node.openingElement.name.name==='AppBar')))
          push(p.node,JSON.stringify('var(--app-header-height, 56px)'));
      }
    },
    ImportDeclaration(p){
      if(/@mui\/icons-material\/Notifications/.test(p.node.source.value))push(p.node.source,JSON.stringify('@mui/icons-material/InfoOutlined'));
      if(p.node.source.value==='@mui/icons-material')for(const spec of p.node.specifiers){
        if(spec.imported?.name?.startsWith('Notifications'))push(spec,`InfoOutlined as ${spec.local.name}`);
      }
    }
  });
  if(!edits.length)continue;
  const unique=[...new Map(edits.map(e=>[e.start+':'+e.end,e])).values()];
  const selected=unique.filter(e=>!unique.some(o=>o!==e&&o.start<=e.start&&o.end>=e.end&&(o.start<e.start||o.end>e.end))).sort((a,b)=>b.start-a.start);
  let next=source;for(const e of selected)next=next.slice(0,e.start)+e.text+next.slice(e.end);
  if(needsHelper&&!source.includes('import * as uiLayout')){let rel=path.relative(path.dirname(file),'src/components/common/uiLayout').replaceAll('\\','/');next=`import * as uiLayout from '${rel.startsWith('.')?rel:'./'+rel}';\n`+next;}
  parse(next,{sourceType:'module',plugins:['jsx']});
  for(let i=0;;i++){try{fs.writeFileSync(file,next);break;}catch(e){if(i>=5)throw e;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,200);}}
  results[file.replaceAll('\\','/')]=selected.length;
}
fs.writeFileSync('ui-review/shared-shell-migration.json',JSON.stringify(results,null,2));
console.log(results);
