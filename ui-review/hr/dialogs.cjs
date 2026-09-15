const fs=require('fs');
const WebSocket=require('ws');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const target=await (await fetch('http://127.0.0.1:9224/json/new?about:blank',{method:'PUT'})).json();
  const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.once('open',r));
  let id=0;const pending=new Map();
  ws.on('message',raw=>{const m=JSON.parse(raw);if(m.method==='Runtime.exceptionThrown')console.error(m.params.exceptionDetails.exception?.description);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
  const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
  await send('Page.enable');await send('Runtime.enable');

  const results=[];
  const cases=[['HrAttendancePage','وردية جديدة'],['HrAttendancePage','إعداد الورديات'],['HrContractsPage','تنبيهات العقود'],['HrDepartmentsPage','إضافة قسم'],['HrJobTitlesPage','مسمى جديد'],['HrPermissionsPage','إذن جديد'],['leaves','طلب إجازة جديد']];
  for(const [page,label] of cases)for(const width of [1366,390]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});
    await send('Page.navigate',{url:'http://127.0.0.1:3102/?page='+page});await wait(900);
    const clicked=await evaluate('(()=>{const b=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==='+JSON.stringify(label)+');if(!b)return false;b.click();return true})()');await wait(500);
    const result=await evaluate('(()=>{const d=document.querySelector("[role=dialog]");if(!d)return {dialog:false};const r=d.getBoundingClientRect();return {dialog:true,width:r.width,left:r.left,right:r.right,viewport:innerWidth,fields:d.querySelectorAll("input").length}})()');
    results.push({page,label,width,clicked,...result});
    if(result.dialog){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('ui-review/hr/screenshots/dialog-'+page+'-'+cases.findIndex(x=>x[0]===page&&x[1]===label)+'-'+width+'.png',Buffer.from(shot.data,'base64'));}
  }
  fs.writeFileSync('ui-review/hr/dialog-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));ws.close();
})().catch(e=>{console.error(e);process.exit(1);});
