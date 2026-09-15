const fs=require('fs');
const WebSocket=require('ws');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const target=await (await fetch('http://127.0.0.1:9223/json/new?about:blank',{method:'PUT'})).json();
  const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.once('open',r));
  let id=0;const pending=new Map();
  ws.on('message',raw=>{const m=JSON.parse(raw);if(m.method==='Runtime.exceptionThrown')console.error(m.params.exceptionDetails.exception?.description);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
  const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
  await send('Page.enable');await send('Runtime.enable');
  const sizes=[[1920,1080],[1600,900],[1536,864],[1440,900],[1366,768],[1280,720],[1200,800],[1024,768],[430,932],[390,844],[375,812]];
  const results=[];fs.mkdirSync('ui-review/responsive/screenshots',{recursive:true});
  for(const page of ['branches','leaves','employees','admissions','refund']) {
    for(const [width,height] of sizes) {
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
      await send('Page.navigate',{url:`http://127.0.0.1:3101/?page=${page}`});
      for(let i=0;i<50;i++){await wait(200);if(await evaluate('!!document.querySelector(".MuiPaper-root")'))break;}
      await evaluate('document.fonts.ready');await wait(500);
      if(page==='employees') {
        await evaluate(`document.querySelector('[aria-label="بطاقة الموظف"]')?.click()`);await wait(350);
        await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('تعديل البيانات'))?.click()`);await wait(200);
      }
      if(page==='admissions') {await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='عرض')?.click()`);await wait(350);}
      const metrics=await evaluate(`(()=>{const els=[...document.querySelectorAll('*')];return {text:document.body.innerText.slice(0,220),documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,desktop:matchMedia('(min-width:1200px)').matches,dialog:!!document.querySelector('[role=dialog]'),overflow:els.filter(e=>{const s=getComputedStyle(e);return e.clientWidth>0&&e.scrollWidth>e.clientWidth+2&&['auto','scroll'].includes(s.overflowX)}).map(e=>({tag:e.tagName,cls:e.className,width:e.clientWidth,scroll:e.scrollWidth})),headers:[...document.querySelectorAll('[role=columnheader]')].map(e=>e.innerText)}})()`);
      const shot=await send('Page.captureScreenshot',{format:'png'});
      fs.writeFileSync(`ui-review/responsive/screenshots/${page}-${width}.png`,Buffer.from(shot.data,'base64'));
      results.push({page,width,height,...metrics});console.log(page,width,metrics.documentWidth,metrics.overflow.length,metrics.headers.length);
      fs.writeFileSync('ui-review/responsive/visual-results.json',JSON.stringify(results,null,2));
    }
  }
  ws.close();
})().catch(e=>{console.error(e);process.exit(1);});
