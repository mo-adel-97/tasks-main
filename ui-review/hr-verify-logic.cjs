const fs=require('fs'),cp=require('child_process'),assert=require('assert'),parser=require('@babel/parser');
const files=cp.execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/^src\/pages\/.*\.(js|jsx)$/.test(f));
const omit=new Set(['start','end','loc','extra','leadingComments','trailingComments','innerComments']);
function clean(n){if(Array.isArray(n))return n.map(clean).filter(x=>x!==undefined);if(!n||typeof n!=='object')return n;
if(n.type==='ImportDeclaration' && /(?:hrLayout|common\/uiLayout)$/.test(n.source.value))return;
if(n.type==='JSXAttribute'&&['sx','style','flexWrap','className'].includes(n.name.name))return;
return Object.fromEntries(Object.entries(n).filter(([k])=>!omit.has(k)).map(([k,v])=>[k,clean(v)]));}
const parse=s=>parser.parse(s,{sourceType:'module',plugins:['jsx']});
for(const f of files){assert.deepStrictEqual(clean(parse(fs.readFileSync(f,'utf8'))),clean(parse(cp.execFileSync('git',['show','HEAD:'+f],{encoding:'utf8',maxBuffer:10e6}))));}
console.log('PASS: '+files.length+' HR sources differ only in presentation attributes and HR style imports.');
