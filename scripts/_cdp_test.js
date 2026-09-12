// CDP 直驱测试：spawn Chromium(headless) + DevTools Protocol 控制
// 阶段 A：手机横屏 844x390 自动游玩（注入 _autoplay_inject.js），
//         每遇新「界面类型(pending.kind)」或新「章节(act)」即截图，记录推进深度/死亡结果。
// 阶段 B：竖屏 390x844 验证 CSS 旋转伪横屏 UI 完整性。
const { spawn } = require('child_process');
const fs = require('fs');
const WebSocket = globalThis.WebSocket;

const CHROME = 'C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.36/chrome.exe';
const URL = 'file:///D:/xiyou/demo/index.html';
const SHOTS = 'D:/xiyou/demo/scripts/_shots';
const INJECT = fs.readFileSync('D:/xiyou/demo/scripts/_autoplay_inject.js', 'utf8');
const CWD = 'D:/xiyou/demo/scripts/_cdata';
const PORT = 9223;
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(CWD, { recursive: true });

const log = [];
function L() { const s = Array.prototype.join.call(arguments, ' '); log.push(s); console.log(s); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const child = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + PORT, '--user-data-dir=' + CWD,
  ], { detached: true, stdio: 'ignore' });
  L('chrome spawned pid', child.pid);

  let ver = null;
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch('http://127.0.0.1:' + PORT + '/json/version'); ver = await r.json(); if (ver.webSocketDebuggerUrl) break; } catch (e) {}
    await sleep(400);
  }
  if (!ver) { L('NO CDP PORT'); try { child.kill('SIGKILL'); } catch (e) {} process.exit(1); }
  L('CDP ready');

  let pageWs = null;
  try { const tl = await (await fetch('http://127.0.0.1:' + PORT + '/json')).json(); const pt = tl.find((t) => t.type === 'page'); if (pt) pageWs = pt.webSocketDebuggerUrl; } catch (e) {}
  if (!pageWs) { try { const nw = await fetch('http://127.0.0.1:' + PORT + '/json/new?about:blank'); pageWs = (await nw.json()).webSocketDebuggerUrl; } catch (e) {} }
  if (!pageWs) { L('NO PAGE TARGET'); try { child.kill('SIGKILL'); } catch (e) {} process.exit(1); }
  L('page target ws ready');

  const ws = new WebSocket(pageWs);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result); }
  };
  function cmd(method, params) { return new Promise((resolve, reject) => { const my = ++id; pend.set(my, { resolve, reject }); ws.send(JSON.stringify({ id: my, method, params: params || {} })); }); }
  const evalJS = (expr) => cmd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: false }).then((r) => (r && r.result ? r.result.value : null));
  const shot = (path) => cmd('Page.captureScreenshot', { format: 'png' }).then((r) => { fs.writeFileSync(path, Buffer.from(r.data, 'base64')); return path; });
  const setVP = (w, h) => cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.enable'); await cmd('Runtime.enable');

  // ===== 阶段 A：横屏 844x390 =====
  L('=== 阶段A 横屏 844x390 自动游玩 ===');
  await setVP(844, 390);
  await cmd('Page.navigate', { url: URL });
  let ok = false;
  for (let i = 0; i < 50; i++) { try { if (await evalJS('!!window.NDX')) { ok = true; break; } } catch (e) {} await sleep(400); }
  L('NDX loaded =', ok);
  await setVP(844, 390);
  await sleep(1500);
  await shot(SHOTS + '/A00_start.png');
  L('shot A00_start');

  await evalJS(INJECT);
  L('autoplay injected');

  const shotKinds = {};
  let prevAct = 1, maxAct = 1, maxDiff = 1, finalResult = null, finalOver = null, idleRun = 0;
  const TICKS = 420;
  for (let i = 0; i < TICKS; i++) {
    await sleep(1200);
    let st = null;
    try {
      st = await evalJS('JSON.stringify((function(){var A=window.__ndxAuto||{};var s=window.NDX&&window.NDX.game&&window.NDX.game.state;return {running:A.running,maxAct:A.maxAct,maxDiff:A.maxDiff,steps:A.steps,last:A.last,result:A.result,over:s?s.over:null,act:s?s.act:null,diff:s?s.diff:null,hp:s?s.hp:null,kinds:Object.keys(A.seen||{}),errs:(A.errors||[]).length};})())');
    } catch (e) { st = 'ERR:' + e.message; }
    if (i % 5 === 0 || i < 8) L('TICK', i, st);
    let o = null; try { o = JSON.parse(st); } catch (e) {}
    if (o) {
      maxAct = Math.max(maxAct, o.maxAct || 1); maxDiff = Math.max(maxDiff, o.maxDiff || 1);
      if (o.act && o.act !== prevAct) { try { await shot(SHOTS + '/A_act' + o.act + '.png'); } catch (e) {} L('shot A_act' + o.act); prevAct = o.act; }
      (o.kinds || []).forEach(async (k) => {
        if (!shotKinds[k]) { shotKinds[k] = 1; try { await shot(SHOTS + '/A_kind_' + k + '.png'); } catch (e) {} L('shot kind ' + k); }
      });
      if (o.last === 'idle') idleRun++; else idleRun = 0;
      if (idleRun >= 40) { L('长时间 idle（' + idleRun + '）自动早停'); break; }
      if (o.result) { finalResult = o.result; finalOver = o.over; break; }
    }
  }
  try { await shot(SHOTS + '/A_final.png'); } catch (e) {}
  let summary = null;
  try { summary = await evalJS('JSON.stringify((function(){var A=window.__ndxAuto||{};return {maxAct:A.maxAct,maxDiff:A.maxDiff,steps:A.steps,result:A.result,flow:A.flow,errors:A.errors.slice(0,10),seen:Object.keys(A.seen||{})};})())'); } catch (e) {}
  try { await evalJS('if(window.__ndxAuto)window.__ndxAuto.running=false;'); } catch (e) {}
  L('阶段A 结束 maxAct=' + maxAct + ' maxDiff=' + maxDiff + ' result=' + finalResult + ' over=' + JSON.stringify(finalOver));
  L('阶段A 汇总 ' + summary);

  // ===== 阶段 B：竖屏 390x844 验证伪横屏旋转 =====
  L('=== 阶段B 竖屏 390x844（伪横屏） ===');
  await setVP(390, 844);
  await cmd('Page.reload');
  await sleep(2200);
  await shot(SHOTS + '/B01_start_portrait.png');
  L('shot B01_start_portrait');
  try {
    await evalJS('(function(){var b=[].slice.call(document.querySelectorAll("button,[data-action]")).find(function(x){return (x.getAttribute("data-action")==="start");});if(b)b.click();})()');
  } catch (e) {}
  await sleep(2600);
  await shot(SHOTS + '/B02_after_start_portrait.png');
  L('shot B02_after_start_portrait');

  try { ws.close(); } catch (e) {}
  try { child.kill('SIGKILL'); } catch (e) {}
  fs.writeFileSync(SHOTS + '/cdp_log.txt', log.join('\n'));
  L('DONE');
  process.exit(0);
})().catch((e) => { console.error('FATAL', e); try { fs.writeFileSync(SHOTS + '/cdp_log.txt', log.join('\n')); } catch (x) {} process.exit(1); });
