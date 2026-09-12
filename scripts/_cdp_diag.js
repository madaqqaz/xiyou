// 诊断：横屏 844x390 跑自动器，连续 N 次 idle 时 dump 完整卡死现场
const { spawn } = require('child_process');
const fs = require('fs');
const WebSocket = globalThis.WebSocket;

const CHROME = 'C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.36/chrome.exe';
const URL = 'file:///D:/xiyou/demo/index.html';
const SHOTS = 'D:/xiyou/demo/scripts/_shots';
const INJECT = fs.readFileSync('D:/xiyou/demo/scripts/_autoplay_inject.js', 'utf8');
const CWD = 'D:/xiyou/demo/scripts/_cdata2';
const PORT = 9224;
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(CWD, { recursive: true });
const log = [];
function L() { const s = Array.prototype.join.call(arguments, ' '); log.push(s); console.log(s); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DUMP = 'JSON.stringify((function(){var A=window.__ndxAuto||{},N=window.NDX,g=N&&N.game,s=g&&g.state,p=s&&s.pending;'
  + 'var bs=[].slice.call(document.querySelectorAll("[data-action]")).map(function(b){var r=b.getBoundingClientRect();return {a:b.getAttribute("data-action"),k:b.getAttribute("data-kind"),o:b.getAttribute("data-opt"),dis:!!b.disabled,w:Math.round(r.width),h:Math.round(r.height),t:(b.textContent||"").replace(/\\s+/g,"").slice(0,14)};});'
  + 'var pd="",pcyc=false;try{pd=p?JSON.stringify(p):"null";}catch(e){pcyc=true;pd="<cyclic:"+e.message+">";}'
  + 'var ch=[];var q=p,guard=0;while(q&&guard<12){ch.push(q.kind+"["+((q.text||"").length)+"]");q=q.then;guard++;}'
  + 'return {last:A.last,over:s&&s.over,act:s&&s.act,diff:s&&s.diff,layer:s&&s.layer,hp:s&&s.hp,gold:s&&s.gold,'
  + 'pk:p&&p.kind,phase:p&&p.phase,autoFight:p&&p.autoFight,win:p&&p.win,hasRes:!!(p&&p.res),'
  + 'pkeys:p?Object.keys(p):null,pcyc:pcyc,pdump:pd.slice(0,700),thenChain:ch.join(" -> "),btn:bs};})())';

(async () => {
  const child = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-debugging-port=' + PORT, '--user-data-dir=' + CWD], { detached: true, stdio: 'ignore' });
  let ver = null;
  for (let i = 0; i < 50; i++) { try { const r = await fetch('http://127.0.0.1:' + PORT + '/json/version'); ver = await r.json(); if (ver.webSocketDebuggerUrl) break; } catch (e) {} await sleep(400); }
  if (!ver) { L('NO PORT'); process.exit(1); }
  const tl = await (await fetch('http://127.0.0.1:' + PORT + '/json')).json();
  const pt = tl.find((t) => t.type === 'page');
  const ws = new WebSocket(pt.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } };
  function cmd(method, params) { return new Promise((resolve, reject) => { const my = ++id; pend.set(my, { resolve, reject }); ws.send(JSON.stringify({ id: my, method, params: params || {} })); }); }
  const evalJS = (expr) => cmd('Runtime.evaluate', { expression: expr, returnByValue: true }).then((r) => (r && r.result ? r.result.value : null));
  const shot = (path) => cmd('Page.captureScreenshot', { format: 'png' }).then((r) => fs.writeFileSync(path, Buffer.from(r.data, 'base64')));
  await cmd('Page.enable'); await cmd('Runtime.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: URL });
  for (let i = 0; i < 50; i++) { if (await evalJS('!!window.NDX')) break; await sleep(400); }
  await evalJS(INJECT);
  L('injected');

  let idleRun = 0, sameRun = 0, lastSeen = '', dumped = false;
  for (let i = 0; i < 400; i++) {
    await sleep(1000);
    let st = null; try { st = await evalJS(DUMP); } catch (e) {}
    let o = null; try { o = JSON.parse(st); } catch (e) {}
    if (!o) continue;
    if (i % 10 === 0) L('t', i, 'last=' + o.last, 'act=' + o.act, 'diff=' + o.diff, 'pk=' + o.pk, 'hp=' + o.hp);
    if (o.last === 'idle') idleRun++; else idleRun = 0;
    if (o.last === lastSeen) sameRun++; else { sameRun = 0; lastSeen = o.last; }
    if (!dumped && (idleRun >= 6 || sameRun >= 10)) {
      dumped = true;
      L('===== 卡死现场 dump（idleRun=' + idleRun + ' sameRun=' + sameRun + '）=====');
      L('state:', JSON.stringify({ act: o.act, diff: o.diff, layer: o.layer, hp: o.hp, gold: o.gold, over: o.over, pk: o.pk, phase: o.phase, autoFight: o.autoFight, win: o.win, hasRes: o.hasRes, pcyc: o.pcyc, pkeys: o.pkeys }));
      L('thenChain:', o.thenChain || '(none)');
      L('pdump:', o.pdump || '(null)');
      L('buttons(' + o.btn.length + '):');
      o.btn.forEach((b) => L('  [' + b.a + '|k=' + b.k + '|o=' + b.o + '] dis=' + b.dis + ' ' + b.w + 'x' + b.h + ' "' + b.t + '"'));
      await shot(SHOTS + '/DIAG_stuck.png');
      break;
    }
  }
  try { ws.close(); } catch (e) {}
  try { child.kill('SIGKILL'); } catch (e) {}
  fs.writeFileSync(SHOTS + '/diag_log.txt', log.join('\n'));
  L('DONE');
  process.exit(0);
})().catch((e) => { console.error('FATAL', e); try { fs.writeFileSync(SHOTS + '/diag_log.txt', log.join('\n')); } catch (x) {} process.exit(1); });
