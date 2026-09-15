const fs = require('fs');
const assert = require('assert');
const WebSocket = require('ws');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
(async () => {
  const target = await (await fetch('http://127.0.0.1:9226/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.once('open', resolve));
  let id = 0;
  const pending = new Map();
  ws.on('message', (raw) => {
    const message = JSON.parse(raw);
    if (message.id) { const request = pending.get(message.id); pending.delete(message.id); message.error ? request.reject(message.error) : request.resolve(message.result); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); ws.send(JSON.stringify({ id: next, method, params })); });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const click = async (selector) => { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await wait(350); };
  const measure = () => evaluate(`(() => {const r = document.querySelector('#content').getBoundingClientRect(); const f = document.querySelector('#fixed').getBoundingClientRect(); return {x:r.x,width:r.width,fixed:f.x,scroll:scrollY};})()`);
  await send('Page.enable');
  const results = [];
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://127.0.0.1:3102' });
    for (let attempt = 0; attempt < 100; attempt++) { if (await evaluate('!!document.querySelector("#open")')) break; await wait(100); }
    for (const mode of ['light', 'dark']) {
      if (await evaluate('document.documentElement.dataset.colorMode') !== mode) await click('.app-color-mode-toggle');
      await evaluate('window.scrollTo(0, 150)');
      const before = await measure();
      await click('#open');
      const opened = await measure();
      assert.deepStrictEqual(opened, before, 'Dialog moved the page');
      await click('#nested');
      assert.deepStrictEqual(await measure(), before, 'Nested dialog moved the page');
      await click('#close-nested');
      assert.deepStrictEqual(await measure(), before, 'Nested close moved the page');
      const colors = await evaluate(`(() => {const s=getComputedStyle(document.querySelector('#legacy'));return {background:s.backgroundColor,text:s.color}})()`);
      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`ui-review/theme/${mode}-${width}.png`, Buffer.from(screenshot.data, 'base64'));
      await click('#close');
      assert.deepStrictEqual(await measure(), before, 'Closing dialog moved the page');
      results.push({ width, mode, before, opened, colors });
    }
  }
  fs.writeFileSync('ui-review/theme/results.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
  ws.close();
})().catch((error) => { console.error(error); process.exit(1); });
