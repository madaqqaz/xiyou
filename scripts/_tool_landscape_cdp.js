#!/usr/bin/env node
'use strict';
/*
 * _audit_landscape_cdp.js — 零依赖横屏 UI 渲染审计（CDP 真机渲染）
 * ---------------------------------------------------------------
 * 工具链：本机 Microsoft Edge（全局二进制）+ Node v22+ 全局 WebSocket（无需 puppeteer）。
 * 用法：node scripts/_audit_landscape_cdp.js [file|http]
 *   - 默认 file：直接加载 file:///d:/xiyou/demo/index.html
 *   - 传 http：加载 http://127.0.0.1:8080/（需先 npm run serve）
 * 输出：scripts/_audit_shots/<视口名>__<屏名>.png
 *
 * 设计：仅依赖 Node 内置 WebSocket 驱动 Edge 的 Chrome DevTools Protocol。
 *   - 启动 headless Edge 并开 --remote-debugging-port
 *   - 轮询 /json/version 拿 webSocketDebuggerUrl
 *   - 逐视口 setDeviceMetricsOverride → navigate → 等待 → captureScreenshot
 *   - 支持通过 clicks 数组（CSS 选择器序列）驱动游戏到达目标屏再截图
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DEMO = path.join(__dirname, '..');
const ROOT_URL = (process.argv[2] === 'http')
  ? 'http://127.0.0.1:8080/'
  : 'file:///' + path.join(DEMO, 'index.html').replace(/\\/g, '/');
const OUT = path.join(__dirname, '_audit_shots');
const DBG_PORT = 9222;

const VIEWPORTS = [
  { name: 'real-landscape-900x420', width: 900, height: 420, mobile: true },
  { name: 'rotated-portrait-420x900', width: 420, height: 900, mobile: true },
  { name: 'desktop-1280x800', width: 1280, height: 800, mobile: false },
  { name: 'wide-desktop-1920x1080', width: 1920, height: 1080, mobile: false },
];

// 审计场景：每个场景 = 屏名 + 要置位的 NDX.ui.show* 标志（null=基础地图/标题屏）
// doRender() 为全局函数、NDX.ui.show* 已暴露，故 CDP 内直接置位 + doRender() 跳屏，零游戏代码改动。
// 顺序无关：每个场景前先清空所有 show* 标志，仅置位当前屏对应标志。
const ALL_FLAGS = ['showHeroDetail', 'showBagDetail', 'showDockModal', 'showLampDetail', 'showXinmoDetail', 'showMomentumHelp', 'showAchBook', 'showCollection', 'showRubbing', 'showSettings', 'showMetaOverview', 'showCompliance', 'showYezanglu', 'showCyclePalace', 'showMonuments', 'showRanking', 'showDynasty', 'showAsh', 'showChangan', 'showPetAtlas', 'showFollowerAtlas'];
const SCENES = [
  { screen: 'base', flag: null },
  { screen: 'hero', flag: 'showHeroDetail' },
  { screen: 'bag', flag: 'showBagDetail' },
  { screen: 'dock', flag: 'showDockModal' },
  { screen: 'lamp', flag: 'showLampDetail' },
  { screen: 'xinmo', flag: 'showXinmoDetail' },
  { screen: 'momentum', flag: 'showMomentumHelp' },
  { screen: 'ach', flag: 'showAchBook' },
  { screen: 'collection', flag: 'showCollection' },
  { screen: 'rubbing', flag: 'showRubbing' },
  { screen: 'settings', flag: 'showSettings' },
  { screen: 'meta', flag: 'showMetaOverview' },
  { screen: 'compliance', flag: 'showCompliance' },
  { screen: 'yezanglu', flag: 'showYezanglu' },
  { screen: 'cycle', flag: 'showCyclePalace' },
  { screen: 'monuments', flag: 'showMonuments' },
  { screen: 'ranking', flag: 'showRanking' },
  { screen: 'dynasty', flag: 'showDynasty' },
  { screen: 'ash', flag: 'showAsh' },
  { screen: 'changan', flag: 'showChangan' },
  { screen: 'petAtlas', flag: 'showPetAtlas' },
  { screen: 'followerAtlas', flag: 'showFollowerAtlas' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForLoading(cdp, timeoutMs = 30000) {
  for (let i = 0; i < timeoutMs / 300; i++) {
    const r = await cdp.send('Runtime.evaluate', {
      expression: `(function(){var el=document.getElementById('ndx-loading-screen'); return !el || el.classList.contains('hidden') || getComputedStyle(el).display==='none';})()`,
      returnByValue: true,
    });
    if (r && r.result && r.result.value) return true;
    await sleep(300);
  }
  return false;
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

function connectCdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const pending = new Map();
    let idc = 0;
    let onEvent = () => {};
    ws.onmessage = (ev) => {
      const text = typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString('utf8');
      let msg; try { msg = JSON.parse(text); } catch (e) { return; }
      if (msg.id != null && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message)); else res(msg.result);
      } else if (msg.method) {
        onEvent(msg.method, msg.params);
      }
    };
    ws.onerror = () => reject(new Error('Edge CDP WebSocket error'));
    ws.onopen = () => resolve({
      send(method, params) {
        return new Promise((res, rej) => {
          const id = ++idc;
          pending.set(id, { res, rej });
          ws.send(JSON.stringify({ id, method, params: params || {} }));
        });
      },
      on(type, cb) { onEvent = (t, p) => { if (t === type) cb(p); }; },
      close() { try { ws.close(); } catch (e) {} },
    });
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  console.log('启动 Edge (headless, remote-debugging=' + DBG_PORT + ')');
  const edge = spawn(EDGE, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + DBG_PORT, '--user-data-dir=' + path.join(OUT, '.edge-profile'),
    'about:blank',
  ], { stdio: 'ignore', detached: false });

  let ver;
  for (let i = 0; i < 40; i++) {
    try { ver = await getJson('http://127.0.0.1:' + DBG_PORT + '/json/version'); if (ver && ver.webSocketDebuggerUrl) break; } catch (e) {}
    await sleep(300);
  }
  if (!ver || !ver.webSocketDebuggerUrl) { console.error('无法连接 Edge CDP'); edge.kill('SIGKILL'); process.exit(1); }

  const browser = await connectCdp(ver.webSocketDebuggerUrl);
  const { targetId } = await browser.send('Target.createTarget', { url: ROOT_URL });
  const list = await getJson('http://127.0.0.1:' + DBG_PORT + '/json/list');
  const target = (list || []).find((t) => t.id === targetId);
  if (!target || !target.webSocketDebuggerUrl) {
    console.error('无法获取页面目标 WebSocket'); browser.close(); edge.kill('SIGKILL'); process.exit(1);
  }
  const cdp = await connectCdp(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  for (const vp of VIEWPORTS) {
    console.log('\n=== 视口 ' + vp.name + ' (' + vp.width + 'x' + vp.height + ') ===');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile,
      screenWidth: vp.width, screenHeight: vp.height,
      screenOrientation: { type: vp.width >= vp.height ? 'landscapePrimary' : 'portraitPrimary', angle: vp.width >= vp.height ? 90 : 0 },
    });
    // 每个视口只加载一次游戏：跳过开场动画、startGame() 创建 NDX.game，再 start() 进入一局 run
    await cdp.send('Runtime.evaluate', { expression: 'try{localStorage.clear();}catch(e){}' });
    await cdp.send('Page.navigate', { url: ROOT_URL });
    await sleep(2500); // 等待脚本加载
    const init = await cdp.send('Runtime.evaluate', {
      expression: `try{NDX._introPlayed=true; startGame(); 'inited'}catch(e){'ERR:'+e.message}`,
      returnByValue: true,
    });
    console.log('  init结果:', init && init.result ? init.result.value : 'no-result');
    await sleep(2000); // 等待 startGame 完成、NDX.game 创建
    const started = await cdp.send('Runtime.evaluate', {
      expression: `try{var hero=(NDX.HERO_ORDER&&NDX.HERO_ORDER[0])||'tangseng'; NDX.game.start(hero); doRender(); 'started'}catch(e){'ERR:'+e.message}`,
      returnByValue: true,
    });
    console.log('  开始 run 结果:', started && started.result ? started.result.value : 'no-result');
    if (started && started.result && started.result.value === 'started') { await sleep(4000); }
    await waitForLoading(cdp);
    for (const sc of SCENES) {
      // 强制移除加载层 + 清空弹窗宿主与所有 -modal 包装（_appendModal 外层是 #xxx-modal，内层才是 .scene-overlay）
      const cleanExpr = `var _ls=document.getElementById('ndx-loading-screen');if(_ls&&_ls.parentNode)_ls.parentNode.removeChild(_ls);var _h=window.__ndxOverlay;if(_h)_h.innerHTML='';document.querySelectorAll('[id$="-modal"],.modal-error-tip,#first-evil-overlay').forEach(function(el){el.parentNode&&el.parentNode.removeChild(el);});`;
      const expr = sc.flag
        ? `try{${cleanExpr}${JSON.stringify(ALL_FLAGS)}.forEach(function(k){NDX.ui[k]=false;});NDX.ui[${JSON.stringify(sc.flag)}]=true;doRender();'ok'}catch(e){'ERR:'+e.message}`
        : `try{${cleanExpr}${JSON.stringify(ALL_FLAGS)}.forEach(function(k){NDX.ui[k]=false;});doRender();'ok'}catch(e){'ERR:'+e.message}`;
      const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (r && r.result && /ERR:/.test(String(r.result.value))) {
        console.log('  [跳过] ' + sc.screen + ' 渲染失败: ' + r.result.value);
      }
      await sleep(700);
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const file = path.join(OUT, vp.name + '__' + sc.screen + '.png');
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      console.log('  截图 ' + sc.screen + ' -> ' + file);
    }
  }

  cdp.close();
  try { browser.close(); } catch (e) {}
  try { edge.kill('SIGKILL'); } catch (e) {}
  console.log('\n完成。截图目录：' + OUT);
  process.exit(0);
}

main().catch((e) => { console.error('审计失败：', e.message); process.exit(1); });
