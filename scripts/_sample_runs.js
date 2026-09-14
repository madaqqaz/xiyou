// _sample_runs.js — 真实浏览器多局自动游玩采样（回填 [PLACEHOLDER] 数值）
// 目的：V9.7 寿命天数制 / V9.9 心魔隐藏线 的数值均为 [PLACEHOLDER·待10局采样]，
//       本脚本用 CDP 直驱 Chromium + autoplay 注入器跑 N 局完整流程，采集：
//       推进深度(diff/act) · 寿命消耗(天) · 心魔峰值与镜战次数 · 劫印档位分布 · 终局结果。
// 加速：autoplay tick 300ms → 60ms，战斗倍速拉满（不改战斗结算逻辑，仅提速）。
// 运行：node scripts/_sample_runs.js [局数]  → 输出 scripts/_sample_result.json
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = globalThis.WebSocket;

const ROOT = path.join(__dirname, '..');

// Chrome 二进制自动探测：优先 CHROME_BIN，其次常见安装位与 agent-browser 缓存。
// 找不到时明确报错退出，避免硬编码旧路径静默失败。
function findChrome() {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  const cands = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.36/chrome.exe',
  ];
  for (const c of cands) if (fs.existsSync(c)) return c;
  const ab = 'C:/Users/Administrator/.agent-browser/browsers';
  if (fs.existsSync(ab)) {
    for (const d of fs.readdirSync(ab)) {
      const p = path.join(ab, d, 'chrome.exe');
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}
const CHROME = findChrome();
if (!CHROME) {
  console.log('NO CHROME BINARY — 安装 Chrome 后设置环境变量 CHROME_BIN，或放到 .agent-browser/browsers/ 下再运行本脚本。');
  process.exit(2);
}
const URL = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');
const INJECT = fs.readFileSync(path.join(ROOT, 'scripts/_autoplay_inject.js'), 'utf8');
const CWD = path.join(ROOT, 'scripts/_cdata');
const PORT = 9224;
const RUNS = parseInt(process.argv[2] || '10', 10);
fs.mkdirSync(CWD, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const child = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + PORT, '--user-data-dir=' + CWD,
  ], { detached: true, stdio: 'ignore' });

  let ver = null;
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch('http://127.0.0.1:' + PORT + '/json/version'); ver = await r.json(); if (ver.webSocketDebuggerUrl) break; } catch (e) {}
    await sleep(400);
  }
  if (!ver) { console.log('NO CDP'); try { child.kill('SIGKILL'); } catch (e) {} process.exit(1); }

  let pageWs = null;
  try { const tl = await (await fetch('http://127.0.0.1:' + PORT + '/json')).json(); const pt = tl.find((t) => t.type === 'page'); if (pt) pageWs = pt.webSocketDebuggerUrl; } catch (e) {}
  if (!pageWs) { const nw = await fetch('http://127.0.0.1:' + PORT + '/json/new?about:blank'); pageWs = (await nw.json()).webSocketDebuggerUrl; }

  const ws = new WebSocket(pageWs);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pend = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result); }
  };
  function cmd(method, params) { return new Promise((resolve, reject) => { const my = ++id; pend.set(my, { resolve, reject }); ws.send(JSON.stringify({ id: my, method, params: params || {} })); }); }
  const evalJS = async (expr) => {
    try { const r = await cmd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: false }); return r && r.result ? r.result.value : null; }
    catch (e) { return null; }
  };
  await cmd('Page.enable'); await cmd('Runtime.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 1, mobile: true });

  const results = [];
  for (let run = 1; run <= RUNS; run++) {
    console.log('=== RUN ' + run + '/' + RUNS + ' ===');
    await cmd('Page.navigate', { url: URL });
    await sleep(1200);
    // 清存档 → 全新一局
    await evalJS('try{localStorage.clear()}catch(e){}');
    await cmd('Page.navigate', { url: URL });
    let ok = false;
    for (let i = 0; i < 60; i++) { if (await evalJS('!!window.NDX')) { ok = true; break; } await sleep(400); }
    if (!ok) { console.log('  load fail'); continue; }

    // 注入并提速：tick 60ms
    await evalJS('(function(){try{if(window.NDX&&window.NDX.FIGHT_GATE)window.NDX.FIGHT_GATE.auto=1;if(window.NDX&&window.NDX.ui)window.NDX.ui.fightSpeed=3;}catch(e){}})()');
    await evalJS(INJECT);
    await evalJS('(function(){if(window.__ndxAutoTimer)clearInterval(window.__ndxAutoTimer);window.__ndxAutoTimer=setInterval(window.__ndxAuto.tick,60);})()');
    // 记录起始寿命与采样器（每 tick 记录心魔峰值）
    await evalJS('(function(){window.__S={life0:(window.NDX.LIFE&&window.NDX.LIFE.START)||0,xinmoMax:0,xmSamples:0};' +
      'if(window.__sampler)clearInterval(window.__sampler);' +
      'window.__sampler=setInterval(function(){var s=window.NDX&&window.NDX.game&&window.NDX.game.state;if(!s)return;' +
      'window.__S.xmSamples++;if((s.xinmo||0)>window.__S.xinmoMax)window.__S.xinmoMax=s.xinmo||0;},200);})()');

    const TICKS = 700;   // 每局上限 ~700×600ms ≈ 7 分钟
    let done = null;
    for (let i = 0; i < TICKS; i++) {
      await sleep(600);
      const st = await evalJS('JSON.stringify((function(){var A=window.__ndxAuto||{};var s=window.NDX&&window.NDX.game&&window.NDX.game.state;' +
        'if(!s)return{noState:1};' +
        'var tiers={};(s.seals||[]).forEach(function(x){tiers[x.tier]=(tiers[x.tier]||0)+1;});' +
        'return{running:A.running,steps:A.steps,last:A.last,result:A.result,over:s.over?1:0,act:s.act||1,diff:s.diff||1,' +
        'life:s.life,lifeMax:s.lifeMax,xinmo:s.xinmo||0,xinmoBattles:s.xinmoBattles||0,visited:(s.visited||[]).length,' +
        'seals:(s.seals||[]).length,tiers:tiers,gold:s.gold||0,mirrors:0};})())');
      let o = null; try { o = JSON.parse(st); } catch (e) {}
      if (!o || o.noState) continue;
      if (o.over || o.result) { done = o; break; }
    }
    const fin = await evalJS('JSON.stringify((function(){var A=window.__ndxAuto||{};var s=window.NDX&&window.NDX.game&&window.NDX.game.state;' +
      'if(!s)return{noState:1};var tiers={};(s.seals||[]).forEach(function(x){tiers[x.tier]=(tiers[x.tier]||0)+1;});' +
      'var S=window.__S||{};return{result:A.result,steps:A.steps,over:s.over||null,act:s.act||1,diff:s.diff||1,' +
      'life:s.life,lifeMax:s.lifeMax,life0:S.life0,xinmo:s.xinmo||0,xinmoMax:S.xinmoMax||0,xmSamples:S.xmSamples||0,' +
      'xinmoBattles:s.xinmoBattles||0,visited:(s.visited||[]).length,equips:(s.equips||[]).length,' +
      'seals:(s.seals||[]).length,tiers:tiers,gold:s.gold||0,errors:(A.errors||[]).slice(0,5)};})())');
    let f = null; try { f = JSON.parse(fin); } catch (e) {}
    await evalJS('(function(){if(window.__ndxAuto)window.__ndxAuto.running=false;if(window.__sampler)clearInterval(window.__sampler);if(window.__ndxAutoTimer)clearInterval(window.__ndxAutoTimer);})()');
    if (f && !f.noState) {
      const days = Math.round(((f.life0 || f.lifeMax) - (f.life || 0)) * 360);
      const rec = Object.assign({}, f, { daysSpent: days });
      results.push(rec);
      console.log('  diff=' + rec.diff + ' act=' + rec.act + ' steps=' + rec.steps +
        ' 寿命消耗=' + days + '天(' + (days / 360).toFixed(1) + '岁) 心魔峰值=' + Math.round(rec.xinmoMax) +
        ' 镜战=' + rec.xinmoBattles + ' 劫印=' + JSON.stringify(rec.tiers) + ' 终局=' + JSON.stringify(rec.over));
    } else {
      console.log('  no result');
    }
    fs.writeFileSync(path.join(ROOT, 'scripts/_sample_result.json'), JSON.stringify(results, null, 2));
  }

  // 汇总
  const n = results.length;
  const avg = (fn) => (n ? Math.round(results.reduce((a, b) => a + fn(b), 0) / n * 10) / 10 : 0);
  const summary = {
    runs: n,
    avgDiff: avg((r) => r.diff || 0),
    maxDiff: Math.max(...results.map((r) => r.diff || 0)),
    avgDays: avg((r) => r.daysSpent || 0),
    avgYears: Math.round(avg((r) => r.daysSpent || 0) / 360 * 100) / 100,
    avgXinmoMax: avg((r) => r.xinmoMax || 0),
    avgMirrorBattles: avg((r) => r.xinmoBattles || 0),
    tierTotal: results.reduce((acc, r) => { Object.keys(r.tiers || {}).forEach((t) => { acc[t] = (acc[t] || 0) + r.tiers[t]; }); return acc; }, {}),
    avgSeals: avg((r) => r.seals || 0),
    avgVisited: avg((r) => r.visited || 0),
    results,
  };
  fs.writeFileSync(path.join(ROOT, 'scripts/_sample_result.json'), JSON.stringify(summary, null, 2));
  console.log('\n=== 汇总 ===');
  console.log(JSON.stringify(summary, (k, v) => (k === 'results' ? undefined : v), 2));
  try { ws.close(); } catch (e) {}
  try { child.kill('SIGKILL'); } catch (e) {}
  process.exit(0);
})().catch((e) => { console.error('FATAL', e && e.message); try { } catch (x) {} process.exit(1); });
