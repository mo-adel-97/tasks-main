const fs=require('fs'),parser=require('@babel/parser'),traverse=require('@babel/traverse').default,assert=require('assert');
const baseline=JSON.parse(fs.readFileSync('ui-review/responsive/baseline.json','utf8'));
const strip=value=>JSON.parse(JSON.stringify(value,(k,v)=>['start','end','loc','extra','leadingComments','trailingComments','innerComments'].includes(k)?undefined:v));
function contract(source){const calls=[];const ast=parser.parse(source,{sourceType:'unambiguous',plugins:['jsx']});traverse(ast,{CallExpression(p){const n=p.node,name=n.callee.name;if(name==='fetch'||name==='useState'||name==='useReducer'||(n.callee.object?.name==='axios'))calls.push(strip(n));}});return calls;}
const changed=[],failures=[];
for(const [file,source] of Object.entries(baseline)) {
  const current=fs.readFileSync(file,'utf8');
  if(/\.jsx?$/.test(file)) {
    try {const after=contract(current);if(source!==current)assert.deepStrictEqual(after,contract(source));}
    catch(e){failures.push({file,error:e.message.slice(0,200)});}
  }
  if(source!==current)changed.push(file);
}
const result={scanned:Object.keys(baseline).length,changed:changed.length,files:changed,apiAndStateFailures:failures};
fs.writeFileSync('ui-review/responsive/verification.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({scanned:result.scanned,changed:result.changed,failures},null,2));if(failures.length)process.exitCode=1;
