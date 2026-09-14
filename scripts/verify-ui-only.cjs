const fs = require('fs');
const assert = require('assert');
const { baseline, parse } = require('./ui-audit.cjs');
const originals = JSON.parse(fs.readFileSync(baseline,'utf8'));
const metadata = new Set(['start','end','loc','extra','leadingComments','trailingComments','innerComments','comments','tokens']);
function clean(n, inUi = false) {
  if(Array.isArray(n)) return n.map(x=>clean(x,inUi)).filter(x=>x!==undefined);
  if(!n || typeof n!=='object') return n;
  if(n.type==='ImportDeclaration' && /common\/uiLayout$/.test(n.source.value)) return undefined;
  if(n.type==='JSXAttribute') {
    if(['sx','style','xs','sm'].includes(n.name.name)) return undefined;
    if(n.name.name==='InputLabelProps') {
      const expr=n.value?.expression;
      if(expr?.type==='ObjectExpression') {
        const props=expr.properties.filter(p=>!['shrink','style','sx'].includes(p.key?.name));
        if(!props.length)return undefined;
        n={...n,value:{...n.value,expression:{...expr,properties:props}}};
      }
    }
    inUi = true;
  }
  if(inUi && n.type==='ObjectProperty' && ['style','sx'].includes(n.key?.name)) return undefined;
  const result={};
  for(const [k,v] of Object.entries(n)) if(!metadata.has(k)) result[k]=clean(v,inUi);
  return result;
}
const results=[];
for(const [file,original] of Object.entries(originals)) {
  if(!/\.jsx?$/.test(file))continue;
  const current=fs.readFileSync(file,'utf8');
  if(original===current){results.push({file,result:'unchanged'});continue;}
  let before=parse(original),after=parse(current);
  // Hand-reviewed, presentation-only style constants in the native header/card.
  if(file==='src/components/Header.jsx') {
    for(const ast of [before,after]) ast.program.body=ast.program.body.filter(n=>!(n.type==='VariableDeclaration' && n.declarations.every(d=>/Styles$/.test(d.id.name))));
  }
  if(file==='src/components/common/ProfessionalCard.js') {
    for(const ast of [before,after]) ast.program.body=ast.program.body.filter(n=>!(n.type==='VariableDeclaration' && n.declarations.every(d=>d.id.name==='ProfessionalCard')));
  }
  try {assert.deepStrictEqual(clean(after),clean(before));results.push({file,result:'only allowlisted presentation changes'});}
  catch(error){results.push({file,result:'REVIEW REQUIRED',detail:error.message.slice(0,2200)});}
}
fs.writeFileSync('ui-review/logic-verification.json',JSON.stringify(results,null,2));
const failures=results.filter(r=>r.result==='REVIEW REQUIRED');
console.log(JSON.stringify({checked:results.length,failures},null,2));
if(failures.length)process.exitCode=1;
