const fs = require('fs');
const traverse = require('@babel/traverse').default;
const { files, parse } = require('./ui-audit.cjs');
const summary = {};
for (const file of files('src').filter(f => /\.(js|jsx)$/.test(f) && !f.includes('.test.') && /(?:pages|components)[\\/]/.test(f) && !f.endsWith('PrintExamPage.jsx'))) {
  const text = fs.readFileSync(file,'utf8'), ast = parse(text), edits = [];
  function add(node, value) { edits.push({start:node.start,end:node.end,text:value}); }
  function readable(n) {
    if (n.type === 'NumericLiteral' && n.value > 0 && n.value < 12) add(n,'12');
    else if (n.type === 'StringLiteral' && /^(\d*\.)?\d+(rem|px)$/.test(n.value)) {
      const unit = n.value.endsWith('rem') ? 'rem' : 'px', min = unit === 'rem' ? .75 : 12;
      if (parseFloat(n.value) < min) add(n,JSON.stringify(min+unit));
    } else if (n.type === 'ConditionalExpression') { readable(n.consequent); readable(n.alternate); }
    else if (n.type === 'ObjectExpression') n.properties.forEach(p => { if(p.value) readable(p.value); });
  }
  traverse(ast, {
    ObjectProperty(p) {
      const styling = p.findParent(a => a.isJSXAttribute() && ['sx','style','InputLabelProps','inputProps','InputProps'].includes(a.node.name.name));
      if (!styling) return;
      const key = p.node.key.name || p.node.key.value;
      if (key === 'fontSize') readable(p.node.value);
      if (key === 'overflowX' && p.findParent(a => a.isObjectProperty() && /MuiDataGrid-virtualScroller/.test(a.node.key.value))) add(p.node.value, '"auto"');
      if (key === 'display' && p.findParent(a => a.isObjectProperty() && /MuiDataGrid-scrollbar--horizontal/.test(a.node.key.value))) add(p.node.value, '"block"');
    },
    JSXElement(p) {
      const n=p.node, tag=n.openingElement.name.name, kids=n.children.filter(c=>c.type==='JSXElement');
      if (file.endsWith('ReceptionOffice.jsx') && tag==='Stack' && kids.some(c=>c.openingElement.name.name==='HeaderButton')) {
        const sx=n.openingElement.attributes.find(a=>a.name?.name==='sx');
        add(sx.value.expression, `{ ...uiLayout.actionBarSx, width: { xs: '100%', md: 'auto' },
          '& > .MuiButton-root': { flex: { xs: '1 1 120px', md: '0 0 auto' }, width: 'auto', minHeight: 44, px: 2, fontSize: '0.875rem' } }`);
      }
    }
  });
  const selected=edits.filter(e=>!edits.some(o=>o!==e && o.start<e.start && o.end>e.end)).sort((a,b)=>b.start-a.start);
  let next=text;
  for(const e of selected) next=next.slice(0,e.start)+e.text+next.slice(e.end);
  if(next!==text) {
    parse(next);
    for(let attempt=0;;attempt++) {try { fs.writeFileSync(file,next);break; } catch(e) {if(attempt>=5)throw e;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,200);} }
    summary[file.replaceAll('\\','/')]=selected.length;
  }
}
fs.writeFileSync('ui-review/readability-checklist.json',JSON.stringify(summary,null,2));
console.log(JSON.stringify({files:Object.keys(summary).length,adjustments:Object.values(summary).reduce((a,b)=>a+b,0)}));
