// 冷启动性能测试 —— CDP headless chrome，移动端视口 390x844
// 用法: node scripts/_perf_coldstart.js [runs=3]
// 测量: navigationStart -> DOMContentLoaded / load / NDX.game / loadingScreen 遮罩消失(可交互)
//       + 资源加载数量/大小(JS/CSS/img)
'use strict';
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = 'C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.36/chrome.exe';
const URL = 'http://127.0.0.1:8090/index.html';
const PORT = 9333;
const RUNS = parseInt(process.argv[2] || '3', 10);
const PROFILE = path.join(os.tmpdir(), 'ndx_perf_profile_' + Date.now());

function getJSON(p) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path: p }, (res) => {
      let d = ''; res.on('data', (c) => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function waitForChrome() {
  for (let i = 0; i < 60; i++) {
    try { const tabs = (await getJSON('/json/list')).filter(t => t.type === 'page' && t.url !== 'chrome://newtab/'); if (tabs && tabs.length) return tabs; } catch (e) {}
    await wait(250);
  }
  throw new Error('chrome devtools 未就绪');
}

class CDP {
  constructor(wsUrl) { this.ws = new WebSocket(wsUrl); this.id = 0; this.pending = new Map(); this.events = []; this.ready = new Promise((res) => { this.ws.onopen = res; }); this.ws.onmessage = (ev) => this._onmsg(ev.data); }
  _onmsg(data) {
    const m = JSON.parse(data);
    if (m.id && this.pending.has(m.id)) { const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id); if (m.error) reject(new Error(JSON.stringify(m.error))); else resolve(m.result); }
    else if (m.method) this.events.push(m);
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  close() { try { this.ws.close(); } catch (e) {} }
}

async function evalJs(cdp, expr) {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: false });
  if (r.exceptionDetails) return { __err: r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text };
  return r.result.value;
}

async function measureRun(cdp, idx) {
  // 每次全新导航 + 禁用缓存，模拟冷启动
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  // 拦截 sw.js：避免 Service Worker 首次 install→activate→controllerchange 触发自动 reload 干扰冷启动测量
  await cdp.send('Network.setBlockedURLs', { urls: ['*sw.js*'] });
  await cdp.send('Page.enable');
  await cdp.send('Performance.enable');
  // 移动设备模拟
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, mobile: true, deviceScaleFactor: 2 });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });

  const navStartWall = Date.now();
  await cdp.send('Page.navigate', { url: URL });

  // 轮询里程碑
  const milestones = { domContentLoaded: null, load: null, gameReady: null, interactive: null };
  const deadline = navStartWall + 20000;
  let lastGame = false, seenLoading = false;
  while (Date.now() < deadline) {
    await wait(80);
    const s = await evalJs(cdp, `(function(){
      var t = performance.timing || {};
      var ns = t.navigationStart || performance.timeOrigin;
      function rel(x){ return x ? Math.round(x - ns) : null; }
      var gameReady = !!(window.NDX && window.NDX.game);
      var showing = !!(window.NDX && window.NDX.loadingScreen && typeof window.NDX.loadingScreen.isShowing==='function' && window.NDX.loadingScreen.isShowing());
      var screenGone = !document.getElementById('ndx-loading-screen');
      return {
        now: Math.round(performance.now()),
        dcl: rel(t.domContentLoadedEventEnd),
        load: rel(t.loadEventEnd),
        gameReady: gameReady,
        showing: showing,
        screenGone: screenGone
      };
    })()`);
    if (s && s.__err) { console.error('  eval err:', s.__err); break; }
    if (s.dcl != null && milestones.domContentLoaded == null) milestones.domContentLoaded = s.dcl;
    if (s.load != null && milestones.load == null) milestones.load = s.load;
    if (s.gameReady && !lastGame) { milestones.gameReady = s.now; lastGame = true; }
    if (s.showing) seenLoading = true;
    // 可交互 = 加载屏曾显示过、现已消失且 DOM 首屏已渲染
    if (seenLoading && !s.showing && s.screenGone && lastGame && milestones.interactive == null) {
      milestones.interactive = s.now;
    }
    if (milestones.interactive != null) break;
  }

  // 收集资源加载统计
  await wait(300);
  const res = await evalJs(cdp, `(function(){
    var e = performance.getEntriesByType('resource');
    var js=0,css=0,img=0,other=0,jsSize=0,cssSize=0,imgSize=0,count=0;
    e.forEach(function(x){
      var t=x.initiatorType||''; count++;
      var sz=x.transferSize||x.encodedBodySize||0;
      if(t==='script'){js++;jsSize+=sz;}
      else if(t==='css'){css++;cssSize+=sz;}
      else if(t==='img'){img++;imgSize+=sz;}
      else other++;
    });
    var nav = performance.getEntriesByType('navigation')[0]||{};
    return {count:count, js:js, css:css, img:img, other:other,
      jsKB:Math.round(jsSize/1024), cssKB:Math.round(cssSize/1024), imgKB:Math.round(imgSize/1024),
      domNodes: document.getElementsByTagName('*').length,
      fcp: nav.firstContentfulPaint? Math.round(nav.firstContentfulPaint):null,
      domContentLoadedEventEnd: nav.domContentLoadedEventEnd? Math.round(nav.domContentLoadedEventEnd):null,
      loadEventEnd: nav.loadEventEnd? Math.round(nav.loadEventEnd):null
    };
  })()`);
  return { milestones, res };
}

(async () => {
  const args = [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + PROFILE,
    '--hide-scrollbars', '--mute-audio', '--no-first-run', '--no-default-browser-check',
    '--enable-features=NetworkService',
    'about:blank'
  ];
  const chrome = spawn(CHROME, args, { stdio: 'ignore' });
  try {
    const tabs = await waitForChrome();
    const cdp = new CDP(tabs[0].webSocketDebuggerUrl);
    await cdp.ready;

    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      process.stdout.write(`run ${i + 1}/${RUNS} ... `);
      const m = await measureRun(cdp, i);
      console.log(`dcl=${m.milestones.domContentLoaded}ms load=${m.milestones.load}ms game=${m.milestones.gameReady}ms interact=${m.milestones.interactive}ms | res count=${m.res.count} js=${m.res.js} css=${m.res.css} img=${m.res.img} domNodes=${m.res.domNodes}`);
      runs.push(m);
    }
    // 汇总
    const avg = (k) => { const v = runs.map(r => r.milestones[k]).filter(x => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
    const avgRes = (k) => { const v = runs.map(r => r.res[k]).filter(x => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
    const summary = {
      runs: runs.length,
      avgDOMContentLoaded: avg('domContentLoaded'),
      avgLoad: avg('load'),
      avgGameReady: avg('gameReady'),
      avgInteractive: avg('interactive'),
      avgResCount: avgRes('count'),
      avgJSFiles: avgRes('js'),
      avgCSSFiles: avgRes('css'),
      avgImgFiles: avgRes('img'),
      avgJSSizeKB: avgRes('jsKB'),
      avgCSSSizeKB: avgRes('cssKB'),
      avgImgSizeKB: avgRes('imgKB'),
      avgDomNodes: avgRes('domNodes'),
      detail: runs.map(r => ({ m: r.milestones, res: r.res }))
    };
    fs.writeFileSync(path.join(__dirname, '_perf_coldstart_out.json'), JSON.stringify(summary, null, 2));
    console.log('\n=== 冷启动平均 (移动端 390x844, 禁用缓存) ===');
    console.log('DOMContentLoaded :', summary.avgDOMContentLoaded, 'ms');
    console.log('load             :', summary.avgLoad, 'ms');
    console.log('NDX.game 就绪    :', summary.avgGameReady, 'ms');
    console.log('可交互(遮罩消失) :', summary.avgInteractive, 'ms');
    console.log('资源总数/JS/CSS/IMG:', summary.avgResCount, '/', summary.avgJSFiles, '/', summary.avgCSSFiles, '/', summary.avgImgFiles);
    console.log('JS/CSS/IMG 大小 KB:', summary.avgJSSizeKB, '/', summary.avgCSSSizeKB, '/', summary.avgImgSizeKB);
    console.log('DOM 节点数       :', summary.avgDomNodes);
    console.log('\n目标 ≤3000ms:', summary.avgInteractive != null && summary.avgInteractive <= 3000 ? '达标' : '未达标');
    cdp.close();
  } finally {
    try { chrome.kill(); } catch (e) {}
    // 清理 profile
    setTimeout(() => { try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) {} }, 500);
  }
})().catch((e) => { console.error('FATAL', e); try { chrome && chrome.kill(); } catch (e2) {} process.exit(1); });
