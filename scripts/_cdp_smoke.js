// CDP 最小冒烟：验证心魔系统 P0 落地后 RiskVisual 接线在真浏览器无副作用。
// 步骤：横屏加载 → 无 JS 报错 → 手动触发 RiskVisual.update（低魔/高魔/满魔）→
//       验证 overlay 创建/撤销、立绘 filter 应用、window.onerror 计数。
const { spawn } = require('child_process');
const fs = require('fs');
const WebSocket = globalThis.WebSocket;

const CHROME = 'C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.36/chrome.exe';
const URL = 'file:///D:/xiyou/demo/index.html';
const SHOTS = 'D:/xiyou/demo/scripts/_shots';
const CWD = 'D:/xiyou/demo/scripts/_cdata';
const PORT = 9227;
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

  let ver = null;
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch('http://127.0.0.1:' + PORT + '/json/version'); ver = await r.json(); if (ver.webSocketDebuggerUrl) break; } catch (e) {}
    await sleep(400);
  }
  if (!ver) { L('NO CDP PORT'); process.exit(1); }
  let pageWs = null;
  try { const tl = await (await fetch('http://127.0.0.1:' + PORT + '/json')).json(); const pt = tl.find((t) => t.type === 'page'); if (pt) pageWs = pt.webSocketDebuggerUrl; } catch (e) {}
  if (!pageWs) { L('NO PAGE TARGET'); process.exit(1); }

  const ws = new WebSocket(pageWs);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result); }
  };
  function cmd(method, params) { return new Promise((resolve, reject) => { const my = ++id; pend.set(my, { resolve, reject }); ws.send(JSON.stringify({ id: my, method, params: params || {} })); }); }
  const evalJS = (expr) => cmd('Runtime.evaluate', { expression: expr, returnByValue: true }).then((r) => (r && r.result ? r.result.value : null));
  const shot = (p) => cmd('Page.captureScreenshot', { format: 'png' }).then((r) => { fs.writeFileSync(p, Buffer.from(r.data, 'base64')); return p; });
  await cmd('Page.enable'); await cmd('Runtime.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 1, mobile: true });
  await cmd('Page.navigate', { url: URL });
  for (let i = 0; i < 50; i++) { try { if (await evalJS('!!window.NDX && !!window.NDX.RiskVisual')) break; } catch (e) {} await sleep(400); }
  await sleep(1500);

  const errors = await evalJS('window.__errCount || 0');
  L('JS 报错数(加载后):', errors);

  // 1) 低魔 + 正常寿数：不应产生任何 overlay
  await evalJS('NDX.RiskVisual.update({ xinmo: 10, life: 40, maxLife: 55, heroElement: null })');
  const clean = await evalJS('!document.getElementById("life-warning-overlay") || document.getElementById("life-warning-overlay").style.opacity === "0"');
  L('低魔态无寿数预警:', clean);

  // 2) 低寿数：寿数预警 overlay 出现
  await evalJS('NDX.RiskVisual.update({ xinmo: 10, life: 5, maxLife: 55, heroElement: null })');
  const lifeWarn = await evalJS('!!document.getElementById("life-warning-overlay") && document.getElementById("life-warning-overlay").style.opacity === "1"');
  L('寿数预警出现:', lifeWarn);

  // 3) 高魔 + 立绘挂点：filter 被应用（用 HUD 立绘或兜底 body）
  const filt = await evalJS('(function(){var el=document.querySelector(".hud-portrait")||document.body;NDX.RiskVisual.update({xinmo:80,life:40,maxLife:55,heroElement:el});return el.style.filter||"(none)";})()');
  L('高魔立绘 filter:', filt);

  // 4) 满魔：climax overlay 出现 → 撤销后消失
  await evalJS('NDX.RiskVisual.update({ xinmo: 100, life: 40, maxLife: 55, heroElement: null })');
  await sleep(300);
  const climax = await evalJS('!!document.getElementById("xinmo-climax-overlay")');
  L('满魔 climax overlay 出现:', climax);
  await shot(SHOTS + '/SMOKE_xinmo_climax.png');
  await evalJS('NDX.RiskVisual.removeXinmoClimax()');
  await sleep(700);
  const gone = await evalJS('!document.getElementById("xinmo-climax-overlay")');
  L('撤销后 overlay 移除:', gone);

  // 5) update 异常不冒泡（heroElement 传非法对象）
  await evalJS('try { NDX.RiskVisual.update({ xinmo: 50, life: 40, maxLife: 55, heroElement: undefined }); window.__smokeTolerant = true; } catch (e) { window.__smokeTolerant = "threw:" + e.message; }');
  const tol = await evalJS('window.__smokeTolerant');
  L('非法入参容错:', tol);

  const errors2 = await evalJS('window.__errCount || 0');
  L('JS 报错数(全程):', errors2);
  L('SMOKE', (clean && lifeWarn && climax && gone && errors2 === 0) ? 'PASS' : 'CHECK');

  try { child.kill('SIGKILL'); } catch (e) {}
  fs.writeFileSync('D:/xiyou/demo/scripts/_shots/smoke_log.txt', log.join('\n'));
  process.exit(0);
})().catch((e) => { console.log('SMOKE ERR', e.message); try { fs.writeFileSync('D:/xiyou/demo/scripts/_shots/smoke_log.txt', log.join('\n') + '\nERR ' + e.message); } catch (e2) {} process.exit(1); });
