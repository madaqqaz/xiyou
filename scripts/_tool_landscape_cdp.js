#!/usr/bin/env node
'use strict';
/*
 * _tool_landscape_cdp.js — 零依赖横屏 UI 渲染审计（CDP 真机渲染）
 * ---------------------------------------------------------------
 * 工具链：本机 Microsoft Edge（全局二进制）+ Node v22+ 全局 WebSocket（无需 puppeteer）。
 * 用法：node scripts/_tool_landscape_cdp.js [file|http] [--hotzone-only]
 *   环境变量 NDX_CDP_PORT（默认 9222）：并行取证时用独立端口隔离门禁循环
 *   - 默认 file：直接加载 file:///d:/xiyou/demo/index.html
 *   - 传 http：加载 http://127.0.0.1:8080/（需先 npm run serve）
 *   - --hotzone-only：仅跑 phone-landscape-844x390 最严视口，跳过截图只采热区；
 *     违规 >0 时退出码 1（供 scripts/_verify_landscape_hotzone.js 门禁消费）
 * 输出：scripts/_audit_shots/<视口名>__<屏名>.png + hotzone_summary.json
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
// 端口可用 NDX_CDP_PORT 环境变量覆盖：CodeBuddy 自动化门禁循环会间歇抢占默认 9222/profile，
// 并行取证时用独立端口（如 9224）隔离；非默认端口时 profile/汇总产物/截图加后缀，不互踢。
// 非法值回落 9222 并告警（避免拼错时被门禁 envBad 正则洗成 SKIP 假绿灯）。
const _rawPort = parseInt(process.env.NDX_CDP_PORT || '9222', 10);
const DBG_PORT = (Number.isInteger(_rawPort) && _rawPort > 0 && _rawPort < 65536) ? _rawPort : 9222;
if (DBG_PORT === 9222 && process.env.NDX_CDP_PORT && String(process.env.NDX_CDP_PORT) !== '9222') {
  console.warn('[警告] NDX_CDP_PORT 非法（' + process.env.NDX_CDP_PORT + '），回落默认 9222');
}
const PORT_SUFFIX = DBG_PORT === 9222 ? '' : '.' + DBG_PORT;
const HOTZONE_ONLY = process.argv.includes('--hotzone-only');

// 视口矩阵：spec《横屏UI逐屏重排设计与验收方案_V1.0》§3.1；首项为热区门禁基准视口，勿调序
const VIEWPORTS = [
  { name: 'phone-landscape-844x390', width: 844, height: 390, mobile: true },
  { name: 'real-landscape-900x420', width: 900, height: 420, mobile: true },
  { name: 'tall-phone-800x360', width: 800, height: 360, mobile: true },
  { name: 'tablet-1280x800', width: 1280, height: 800, mobile: true },
  { name: 'wide-desktop-1920x1080', width: 1920, height: 1080, mobile: false },
  { name: 'rotated-portrait-420x900', width: 420, height: 900, mobile: true },
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
  // V2 重排新增屏（横屏重排计划 Task 1）：prep = PREPS 键名状态驱动跳屏；query = 导航附加查询串
  { screen: 'shop', prep: 'shop' },
  { screen: 'fight', prep: 'fight' },
  { screen: 'event', prep: 'event' },
  { screen: 'buyout', query: '?buyout=0' },
];

// 状态驱动跳屏：在当前 run 地图上逐节点 enterNode，直到目标 pending 形态出现；
// 未命中时 shop 用纯 UI 状态兜底（真 API 造数据，非假数据；遇 craft 节点清空 pending 继续搜索，不记为命中），其余报 NO_HIT 由人工复核地图构成。
// 注：enterNode 会真实消耗该审计 run 的去程寿命并写入日志/转职判定点，属预期副作用；每轮视口前 localStorage.clear()，不污染存档。
const PREPS = {
  shop: `(function(){var s=NDX.game.state;var els=Array.prototype.slice.call(document.querySelectorAll('[data-action="node"]'));
    for(var i=0;i<els.length;i++){try{NDX.game.enterNode(+els[i].dataset.layer,+els[i].dataset.col);}catch(e){}
      var k=s.pending&&s.pending.kind;if(k==='shop'){doRender();return 'shop';}if(k==='craft'){s.pending=null;}}
    s.pending={kind:'shop',tier:2,items:NDX.rollEquips(3,s).map(function(e){return Object.assign({},e,{price:NDX.shopPrice(2,s.act)});})};
    doRender();return 'shop-fallback';})()`,
  fight: `(function(){var s=NDX.game.state;var els=Array.prototype.slice.call(document.querySelectorAll('[data-action="node"]'));
    for(var i=0;i<els.length;i++){try{NDX.game.enterNode(+els[i].dataset.layer,+els[i].dataset.col);}catch(e){}
      if(s.pending&&s.pending.kind==='fight'){doRender();return 'fight';}}s.pending=null;doRender();return 'NO_HIT';})()`,
  event: `(function(){var s=NDX.game.state;var els=Array.prototype.slice.call(document.querySelectorAll('[data-action="node"]'));
    for(var i=0;i<els.length;i++){try{NDX.game.enterNode(+els[i].dataset.layer,+els[i].dataset.col);}catch(e){}
      var k=s.pending&&s.pending.kind;if(k==='event'||k==='trial'||k==='choices'){doRender();return k;}}s.pending=null;doRender();return 'NO_HIT';})()`,
};

// 热区采集（spec §四.2 红线 ≥36px）：仅统计视口内可见、可点元素
// 注：.rub-sutra 为纯展示 span（可点的是外层 .rub-overlay[data-action=close-modal]），不列入可点选择器
const HOTZONE_EXPR = `(function(){var min=36;var sel='a,button,[data-action],.opt-btn,.node,.cell,.bag-cell,.dock-chip,.jing-pick,.shop-reroll,.treasure-btn,.skill-btn,.fab-btn';var out=[];
  document.querySelectorAll(sel).forEach(function(el){var st=getComputedStyle(el);
    if(st.display==='none'||st.visibility==='hidden'||parseFloat(st.opacity)<0.05)return;
    var r=el.getBoundingClientRect();if(r.width<=0||r.height<=0)return;
    if(r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)return;
    var rw=Math.floor(r.width),rh=Math.floor(r.height);
    if(rh<min||rw<min)out.push({t:el.tagName,c:String(el.className).slice(0,60),a:el.getAttribute('data-action')||'',w:rw,h:rh});});
  return JSON.stringify(out);})()`;

// 收尾按钮可见性断言（L-P2-01 门禁化，Task 5 评审 R-4）：热区红线对「被裁切/藏进滚动区」结构性盲
// （出屏元素被 HOTZONE_EXPR 直接跳过）。此处对每个 .scene-modal 取最后一个直接子 button，
// rect 超出视口底/顶或超出 modal 自身可视底缘（overflow 滚动区外）即记 clipped。
const FOOTER_EXPR = `(function(){var out=[];document.querySelectorAll('.scene-modal').forEach(function(m){var mr=m.getBoundingClientRect();var kids=Array.prototype.filter.call(m.children,function(b){return b.tagName==='BUTTON';});if(!kids.length)return;var f=kids[kids.length-1];var st=getComputedStyle(f);if(st.display==='none'||st.visibility==='hidden'||parseFloat(st.opacity)<0.05)return;var r=f.getBoundingClientRect();if(r.width<=0&&r.height<=0)return;var clipped=r.bottom>innerHeight+1||r.top<-1||r.bottom>mr.bottom+1;if(clipped)out.push({t:f.tagName,c:String(f.className).slice(0,40),txt:f.textContent.trim().slice(0,12),w:Math.floor(r.width),h:Math.floor(r.height),bottom:Math.round(r.bottom),mBottom:Math.round(mr.bottom),vh:Math.round(innerHeight)});});return JSON.stringify(out);})()`;

// 字号分布采集（spec §四.1 阶梯定档，Task 3 L-PENDING-01）：统计视口内可见文本元素的 computed fontSize 频次
// 同时输出 <11px 的「选择器级 offenders」（Task 4 全站字号治理真源，穿透继承/内联/动态类噪声）
const FONTSIZE_EXPR = `(function(){var freq={};var off={};
  document.querySelectorAll('body *').forEach(function(el){var st=getComputedStyle(el);
    if(st.display==='none'||st.visibility==='hidden'||parseFloat(st.opacity)<0.05)return;
    if(!el.textContent||!el.textContent.trim())return;
    var r=el.getBoundingClientRect();if(r.width<=0||r.height<=0)return;
    if(r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)return;
    var px=Math.round(parseFloat(st.fontSize));freq[px]=(freq[px]||0)+1;
    if(px<11){var cls=(typeof el.className==='string'&&el.className.trim())?'.'+el.className.trim().split(/\\s+/).join('.'):'';
      var da=el.getAttribute('data-action');var sig=el.tagName.toLowerCase()+cls+(da?'[data-action='+da+']':'')+'@'+px+'px';
      off[sig]=(off[sig]||0)+1;}});
  return JSON.stringify({freq:freq,offenders:off});})()`;

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

async function waitForReady(cdp, timeoutMs = 15000) {
  for (let i = 0; i < timeoutMs / 200; i++) {
    const r = await cdp.send('Runtime.evaluate', {
      expression: `document.readyState`,
      returnByValue: true,
    });
    if (r && r.result && r.result.value === 'complete') return true;
    await sleep(200);
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
  const vps = HOTZONE_ONLY ? VIEWPORTS.slice(0, 1) : VIEWPORTS; // 仅基准视口 844×390（首项，勿调序）；不可就地截断 VIEWPORTS，避免模块级副作用
  const summary = {};
  const fontSummary = {};
  const footerSummary = {};
  console.log('启动 Edge (headless, remote-debugging=' + DBG_PORT + (HOTZONE_ONLY ? ', hotzone-only' : '') + ')');
  const edge = spawn(EDGE, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + DBG_PORT, '--user-data-dir=' + path.join(OUT, '.edge-profile' + PORT_SUFFIX),
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

  for (const vp of vps) {
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
      const resetFlags = `${JSON.stringify(ALL_FLAGS)}.forEach(function(k){try{NDX.ui[k]=false;}catch(e){}});`;
      let expr;
      if (sc.prep) expr = `try{${cleanExpr}${resetFlags}${PREPS[sc.prep]}}catch(e){'ERR:'+e.message}`;
      else if (sc.flag) expr = `try{${cleanExpr}${resetFlags}NDX.ui[${JSON.stringify(sc.flag)}]=true;doRender();'ok'}catch(e){'ERR:'+e.message}`;
      else expr = `try{${cleanExpr}${resetFlags}doRender();'ok'}catch(e){'ERR:'+e.message}`;
      // query 屏（buyout）：带查询串重新导航，门禁弹窗自行渲染
      if (sc.query) {
        await cdp.send('Page.navigate', { url: ROOT_URL + sc.query });
        if (!await waitForReady(cdp)) console.log('  [警告] ' + sc.screen + ' readyState 15s 内未 complete，继续降级采集');
        await sleep(1500); // 等待内联脚本完成旋转伪横屏门控/门禁弹窗渲染
        await waitForLoading(cdp);
      } else {
        const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
        const val = r && r.result ? String(r.result.value) : '';
        if (/ERR:/.test(val)) console.log('  [跳过] ' + sc.screen + ' 渲染失败: ' + val);
        else if (sc.prep) console.log('  [prep] ' + sc.screen + ' -> ' + val);
      }
      await sleep(sc.prep === 'fight' ? 1900 : 700); // 战斗演出多推一拍
      // 热区采集（每屏都采，无论是否截图）
      const hz = await cdp.send('Runtime.evaluate', { expression: HOTZONE_EXPR, returnByValue: true });
      let viol = [];
      const hzRaw = hz && hz.result && hz.result.value;
      try { viol = JSON.parse(hzRaw || '[]'); } catch (e) {
        console.log('  [热区采集失败] ' + sc.screen + ': ' + e.message + '（不计入违规总数，需人工复核）');
        viol = [];
      }
      (summary[vp.name] = summary[vp.name] || {})[sc.screen] = viol;
      if (viol.length) console.log('  [热区] ' + sc.screen + ': ' + viol.length + ' 处 <36px');
      // 收尾按钮可见性断言（与热区同轮遍历，零额外渲染轮次）
      const fw = await cdp.send('Runtime.evaluate', { expression: FOOTER_EXPR, returnByValue: true });
      let clips = [];
      try { clips = JSON.parse((fw && fw.result && fw.result.value) || '[]'); } catch (e) {
        console.log('  [footer断言失败] ' + sc.screen + ': ' + e.message + '（需人工复核）');
        clips = [];
      }
      (footerSummary[vp.name] = footerSummary[vp.name] || {})[sc.screen] = clips;
      if (clips.length) console.log('  [footer裁切] ' + sc.screen + ': ' + clips.length + ' 处收尾按钮超出可视区');
      // 字号频次采集（与热区同轮遍历，不影响 HOTZONE_ONLY 短路逻辑）
      const fz = await cdp.send('Runtime.evaluate', { expression: FONTSIZE_EXPR, returnByValue: true });
      let fzobj = {};
      try { fzobj = JSON.parse((fz && fz.result && fz.result.value) || '{}'); } catch (e) {
        console.log('  [字号采集失败] ' + sc.screen + ': ' + e.message + '（不计入 offenders，需人工复核）');
        fzobj = {};
      }
      (fontSummary[vp.name] = fontSummary[vp.name] || {})[sc.screen] = fzobj;
      const off = fzobj.offenders || {};
      const offSum = Object.keys(off).reduce((a, k) => a + off[k], 0);
      if (offSum) console.log('  [字号<11px] ' + sc.screen + ': ' + offSum + ' 处 · ' + Object.keys(off).length + ' 类');
      if (HOTZONE_ONLY) continue;
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const file = path.join(OUT, vp.name + '__' + sc.screen + PORT_SUFFIX + '.png');
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      console.log('  截图 ' + sc.screen + ' -> ' + file);
    }
  }

  fs.writeFileSync(path.join(OUT, 'hotzone_summary' + PORT_SUFFIX + '.json'), JSON.stringify(summary, null, 1));
  fs.writeFileSync(path.join(OUT, 'fontsize_summary' + PORT_SUFFIX + '.json'), JSON.stringify(fontSummary, null, 1));
  fs.writeFileSync(path.join(OUT, 'footer_summary' + PORT_SUFFIX + '.json'), JSON.stringify(footerSummary, null, 1));
  let total = 0;
  for (const vp of Object.keys(summary)) for (const sc of Object.keys(summary[vp])) total += summary[vp][sc].length;
  let clipTotal = 0;
  for (const vp of Object.keys(footerSummary)) for (const sc of Object.keys(footerSummary[vp])) clipTotal += footerSummary[vp][sc].length;
  console.log('\n热区违规总计: ' + total + '（明细见 hotzone_summary' + PORT_SUFFIX + '.json）');
  console.log('footer 裁切总计: ' + clipTotal + '（明细见 footer_summary' + PORT_SUFFIX + '.json）');

  cdp.close();
  try { browser.close(); } catch (e) {}
  try { edge.kill('SIGKILL'); } catch (e) {}
  if (!HOTZONE_ONLY) console.log('\n完成。截图目录：' + OUT);
  process.exit(HOTZONE_ONLY && (total > 0 || clipTotal > 0) ? 1 : 0);
}

main().catch((e) => { console.error('审计失败：', e.message); process.exit(1); });
