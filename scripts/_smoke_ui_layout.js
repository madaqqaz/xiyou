// _smoke_ui_layout.js — 真实浏览器 UI 布局 + 战斗流程冒烟门禁（V9.47 固化）
//
// 背景：V9.46 用 Playwright 真机实测抓到并修复 2 个布局 bug（开始界面标题遮挡、
// 剧情抉择页选项不可达）。本门禁把那次的一次性脚本固化为可持续回归的资产。
//
// 断言：
//   A1 开始界面标题与右上按钮组不重叠（Range 文字 bbox 级；等加载屏结束且开始按钮可见才测）
//   A2 全流程零 pageerror
//   A3 剧情抉择卡（非翻页钮）全部在视口内（可达性；未出现则降级跳过）
//   A4 成功进入战斗界面
//   A5 攻击生效（ATB 结算推进）：3 轮「点 2x 加速 + ⚔攻击 → 轮询 HP/回合计数变化」，≥2 轮通过
//
// ⚠ SKIP 策略（重要，避免误判 FAIL）：
//   - in-process vm 沙箱（_run_all_gates.js 兜底模式，手搓 process 无 memoryUsage）→ SKIP
//   - playwright 模块不可用 → SKIP
//   - chromium 可执行文件不存在 → SKIP
//   SKIP 一律 exit 0 并打印 SKIP 原因；只有真实运行且断言失败才 exit 1。
// 产物：截图与 JSON 报告落 D:/WorkBuddyData/_ai_tmp/gates_ui/（诊断目录，不入项目仓）。

'use strict';

// ---------- 环境检测（必须在任何重依赖之前） ----------
(function envGate() {
  const inVm = typeof process.memoryUsage !== 'function'; // vm 沙箱手搓的 process 无此 API
  if (inVm) {
    console.log('SKIP _smoke_ui_layout.js：in-process vm 沙箱无法启动真实浏览器，视为通过');
    process.exit(0);
  }
})();

const fs = require('fs');
const path = require('path');
const http = require('http');

// ---------- playwright 探测 ----------
function loadPlaywright() {
  const tries = ['playwright',
    'C:/Users/马达/.workbuddy/binaries/node/workspace/node_modules/playwright'];
  for (const t of tries) { try { return require(t); } catch (e) { /* next */ } }
  return null;
}
const pw = loadPlaywright();
if (!pw) {
  console.log('SKIP _smoke_ui_layout.js：playwright 模块不可用，视为通过');
  process.exit(0);
}

// ---------- chromium 可执行探测 ----------
function findChromium() {
  const base = 'C:/Users/马达/AppData/Local/ms-playwright';
  if (!fs.existsSync(base)) return null;
  const dirs = fs.readdirSync(base).filter((d) => d.startsWith('chromium-')).sort().reverse();
  for (const d of dirs) {
    for (const sub of ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe']) {
      const p = path.join(base, d, sub);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}
const EXE = findChromium();
if (!EXE) {
  console.log('SKIP _smoke_ui_layout.js：未找到 chromium 可执行文件，视为通过');
  process.exit(0);
}

// ---------- 常量 ----------
const ROOT = path.resolve(__dirname, '..');
const OUT = 'D:/WorkBuddyData/_ai_tmp/gates_ui/';
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

const VIEWPORTS = [
  { name: 'L812', w: 812, h: 375 },   // 主测：小屏横屏手机（历史 bug 高发区）
  { name: 'Rot360', w: 360, h: 640 }, // 旋转对照：竖屏
];

// ---------- watchdog（runner 无 per-gate 超时，自保） ----------
const WATCHDOG_MS = 320000;
const watchdog = setTimeout(() => {
  console.log('FAIL _smoke_ui_layout.js：整体超时 ' + WATCHDOG_MS + 'ms');
  process.exit(1);
}, WATCHDOG_MS);
watchdog.unref && watchdog.unref();

// ---------- 静态 http 服务（防路径穿越） ----------
function serve() {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const f = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
      const rp = path.resolve(ROOT, f);
      if (!rp.startsWith(ROOT) || !fs.existsSync(rp) || fs.statSync(rp).isDirectory()) {
        res.writeHead(404); return res.end('nf');
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(rp).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(rp).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => resolve({ s, port: s.address().port }));
  });
}

// ---------- 主流程 ----------
(async () => {
  const { s, port } = await serve();
  const browser = await pw.chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--mute-audio'] });
  const results = [];
  const ck = (id, ok, detail) => { results.push({ id, ok: !!ok, detail: detail || '' }); };

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    await ctx.addInitScript(() => {
      try { Object.defineProperty(navigator, 'serviceWorker', { value: { register: () => Promise.reject(new Error('sw off')), addEventListener() {}, getRegistration: () => Promise.resolve(null) }, configurable: true }); } catch (e) {}
    });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e && e.message || e).slice(0, 120)));

    try {
      await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'domcontentloaded' });
      try { await page.waitForSelector('.intro-skip-btn', { timeout: 8000 }); await page.click('.intro-skip-btn'); } catch (e) { /* 无开场也 OK */ }
      // 等加载屏彻底移除（V9.47 修正：此前只等 1.2s，加载屏未撤时 A1 测到的是被遮层）
      try {
        await page.waitForFunction(() => !document.getElementById('ndx-loading-screen'), { timeout: 30000 });
      } catch (e) { /* 30s 仍在则继续，A1 会如实反映 */ }
      try {
        await page.waitForFunction(() => { const a = document.getElementById('app'); return a && !a.querySelector('.skeleton-frame'); }, { timeout: 20000 });
      } catch (e) { /* 兜底继续 */ }
      await page.waitForTimeout(1500);

      // —— A1：开始界面标题 vs 按钮组（仅当 #startscreen 真正可见才测；
      //    竖屏主城等其他界面会复用 .start-btn 类，单看按钮会误报 V9.47 实测踩坑） ——
      const a1 = await page.evaluate(() => {
        const ss = document.querySelector('#startscreen');
        if (!ss || getComputedStyle(ss).display === 'none' || getComputedStyle(ss).visibility === 'hidden') return { skip: true };
        const h = document.querySelector('.start-top-title h1');
        const btns = document.querySelector('.start-top-btns');
        if (!h || !btns) return { skip: true };
        const csH = getComputedStyle(h), csB = getComputedStyle(btns);
        if (csH.display === 'none' || csB.display === 'none') return { skip: true };
        const r = document.createRange(); r.selectNodeContents(h);
        const b = r.getBoundingClientRect();
        const bb = btns.getBoundingClientRect();
        if (!b.width || !bb.width) return { skip: true };
        // 顶层命中测试：标题中心被其他界面（主城等）盖住时用户看不到，重叠无意义
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        if (!hit || !(h === hit || h.contains(hit) || (hit && h.contains(hit.parentNode)))) return { skip: true, covered: true };
        // 2D 矩形相交：竖屏下标题列与按钮组常横向投影重叠但垂直错开（V9.47 实测踩坑），必须双向判定
        const oX = b.right > bb.left && b.left < bb.right;
        const oY = b.bottom > bb.top && b.top < bb.bottom;
        return { overlap: oX && oY, gap: Math.round(Math.max(bb.left - b.right, bb.top - b.bottom)) };
      });
      if (a1.skip) results.push({ id: vp.name + '.A1', ok: true, detail: a1.covered ? '标题被上层界面遮住（不可见层），跳过' : '开始界面元素缺失/隐藏，跳过' });
      else ck(vp.name + '.A1 标题不压按钮', !a1.overlap, '间隔 ' + a1.gap + 'px');
      await page.screenshot({ path: OUT + vp.name + '_start.png' });

      // —— A6：设置面板可见可关（V9.48：.modal-plate 家族曾无底座样式，背景全透明 +
      //    无定位，面板打开后视觉上「不存在」。断言：渲染出 .settings-plate、有 gradient
      //    底座、几何在视口内、中心与关闭钮均可命中，最后点关闭还原现场） ——
      const a6open = await page.evaluate(() => {
        const btn = document.querySelector('.status-settings-btn');
        if (!btn || getComputedStyle(btn).display === 'none') return false;
        btn.click(); return true;
      });
      if (!a6open) results.push({ id: vp.name + '.A6', ok: true, detail: '无设置按钮入口，跳过' });
      else {
        await page.waitForTimeout(900);
        const a6 = await page.evaluate(() => {
          const plate = document.querySelector('#settings-modal .settings-plate');
          if (!plate) return { fail: '面板未渲染' };
          const cs = getComputedStyle(plate);
          const r = plate.getBoundingClientRect();
          if (r.width < 40 || r.height < 40) return { fail: '尺寸异常 ' + Math.round(r.width) + 'x' + Math.round(r.height) };
          if (!/gradient/.test(cs.backgroundImage)) return { fail: '无底座背景（modal-plate 底座缺失）' };
          if (r.left < -4 || r.top < -4 || r.right > innerWidth + 4 || r.bottom > innerHeight + 4) return { fail: '超出视口 ' + JSON.stringify([Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]) };
          const cx = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1);
          const cy = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1);
          const hit = document.elementFromPoint(cx, cy);
          if (!hit || !(plate === hit || plate.contains(hit))) return { fail: '面板中心被遮挡' };
          const close = plate.querySelector('.modal-close');
          if (!close) return { fail: '无关闭钮' };
          const cr = close.getBoundingClientRect();
          const ch = document.elementFromPoint(Math.min(Math.max(cr.left + cr.width / 2, 1), innerWidth - 1), Math.min(Math.max(cr.top + cr.height / 2, 1), innerHeight - 1));
          if (!ch || !(ch === close || close.contains(ch))) return { fail: '关闭钮被遮挡' };
          close.click();
          return { ok: true, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] };
        });
        ck(vp.name + '.A6 设置面板可见可关', !!a6.ok, a6.fail || ('rect=' + a6.rect));
        // 失败现场也必须关掉面板，否则挡住后续 start-btn 点击造成连锁误报
        await page.evaluate(() => {
          const c = document.querySelector('#settings-modal .modal-close');
          if (c) c.click();
        });
        await page.waitForTimeout(400);
      }

      // —— 开始 → 地图 → 剧情翻页 → 抉择 → 战斗 ——
      try { await page.click('.start-btn'); } catch (e) { /* 兜底靠下面循环 */ }
      await page.waitForTimeout(1800);
      await page.evaluate(() => {
        const cand = document.querySelectorAll('.map-node.next, .map-node.current, [class*=map-node]');
        for (const el of cand) if (getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 2) { el.click(); return; }
      });
      await page.waitForTimeout(1500);

      // —— A3：真抉择卡可达性（排除 scene-flip 翻页钮；出现真卡才测，否则降级跳过） ——
      const a3 = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.opt-cards .opt-btn:not(.scene-flip)'))
          .filter((c) => getComputedStyle(c).display !== 'none' && c.getBoundingClientRect().width > 2);
        if (!cards.length) return { skip: true };
        const vh = window.innerHeight;
        const bad = cards.filter((c) => c.getBoundingClientRect().bottom > vh + 4).length;
        return { skip: false, total: cards.length, bad };
      });
      if (a3.skip) results.push({ id: vp.name + '.A3', ok: true, detail: '未出现抉择卡（剧情分支差异），跳过' });
      else ck(vp.name + '.A3 抉择卡全部可达', a3.bad === 0, a3.total + ' 卡中 ' + a3.bad + ' 张超出视口');
      await page.screenshot({ path: OUT + vp.name + '_choice.png' });

      // 推进循环（复刻实测脚本：文本按钮 → 抉择卡 → 翻页钮，最多 12 轮，直至战斗）
      for (let i = 0; i < 12; i++) {
        const hasCombat = await page.evaluate(() => !!document.querySelector('.combat-frame, .fb-avatar, [class*=combat-ui], .fb-skill-btn'));
        if (hasCombat) break;
        const clicked = await page.evaluate(() => {
          const pats = /(继续|进入战斗|出战|开始战斗|下一页|翻页|确认|确定|前行|启程|继续前行)/;
          const btns = Array.from(document.querySelectorAll('button, [onclick], .btn, .opt-btn'));
          for (const b of btns) {
            const cs = getComputedStyle(b);
            if (cs.display === 'none' || cs.visibility === 'hidden') continue;
            if (pats.test(b.textContent || '')) { b.click(); return (b.textContent || '').trim().slice(0, 14); }
          }
          const opt = document.querySelector('.opt-cards .opt-btn:not(.disabled)');
          if (opt && getComputedStyle(opt).display !== 'none' && opt.getBoundingClientRect().width > 2) { opt.click(); return 'opt-card:' + (opt.textContent || '').trim().slice(0, 8); }
          const flip = document.querySelector('.opt-btn.scene-flip');
          if (flip && getComputedStyle(flip).display !== 'none') { flip.click(); return 'scene-flip'; }
          return null;
        });
        if (!clicked) break;
        await page.waitForTimeout(1200);
      }
      await page.waitForTimeout(1000);

      // —— A4：进入战斗 ——
      const a4 = await page.evaluate(() => !!document.querySelector('.combat-frame, .fb-avatar, [class*=combat-ui], .fb-skill-btn'));
      ck(vp.name + '.A4 进入战斗', a4, a4 ? '' : '未检测到战斗界面元素');

      // —— A5/A6：攻击生效压测（战斗为 ATB 制：点 ⚔攻击 后须等行动条充能才结算；
      //    右侧stance按钮「攻·势疾」是姿态页签勿点；先点 2x 加速缩短等待） ——
      // 每轮：点攻击 → 轮询最多 14s 看战斗帧 innerText 是否变化
      // （战斗日志逐回合追加、HP/回合计数都会落入 innerText，比抓单一数字稳）
      const readState = () => page.evaluate(() => {
        const frame = document.querySelector('.combat-frame, .fb-frame, [class*=combat]');
        if (!frame) return null;
        const t = frame.innerText || '';
        return t.length + '|' + t.replace(/\s+/g, '').slice(-60);
      });
      let roundsOk = 0;
      const ROUNDS = 3;
      for (let i = 0; i < ROUNDS && a4; i++) {
        await page.evaluate(() => {
          const sp = Array.from(document.querySelectorAll('.speed-btn, .atb-speed-btn'))
            .find((x) => (x.textContent || '').trim() === '2x' && !/locked/.test(String(x.className)));
          if (sp) sp.click();
        });
        const before = await readState();
        await page.evaluate(() => {
          // ⚠ 必须限定 BUTTON.active-btn[data-action=active-skill]：宽泛的 [class*=skill]
          //   会先命中文本含「攻击」的容器 DIV.active-skill-bar，click() 落空（V9.47 实测踩坑）
          const b = Array.from(document.querySelectorAll('button.active-btn'))
            .find((x) => /攻击/.test(x.textContent || '') && !x.disabled && !/locked/.test(String(x.className)) && getComputedStyle(x).display !== 'none');
          if (b) b.click();
        });
        let changed = false;
        for (let t = 0; t < 16; t++) {
          await page.waitForTimeout(500);
          const now = await readState();
          if (now !== null && now !== before) { changed = true; break; }
        }
        if (changed) roundsOk++;
      }
      if (a4) {
        ck(vp.name + '.A5 攻击生效（ATB 结算推进）', roundsOk >= 2, roundsOk + '/' + ROUNDS + ' 轮状态变化');
        if (roundsOk === 0) {
          const diag = await page.evaluate(() => {
            const frame = document.querySelector('.combat-frame, .fb-frame, [class*=combat]');
            return frame ? (frame.innerText || '').replace(/\s+/g, ' ').slice(0, 220) : 'no frame';
          });
          results.push({ id: vp.name + '.A5.diag', ok: true, detail: '诊断: ' + diag });
        }
        await page.screenshot({ path: OUT + vp.name + '_combat.png' });
      }

      // —— A2：pageerror ——
      ck(vp.name + '.A2 零页面错误', errs.length === 0, errs.slice(0, 3).join(' / '));
    } catch (e) {
      ck(vp.name + '.FLOW 流程异常', false, String(e && e.message || e).slice(0, 140));
    }
    await ctx.close();
  }

  await browser.close();
  s.close();

  fs.writeFileSync(OUT + 'report.json', JSON.stringify(results, null, 1), 'utf8');
  const fails = results.filter((r) => !r.ok);
  for (const r of results) console.log((r.ok ? '  ✓ ' : '  ✗ ') + r.id + (r.detail ? ' — ' + r.detail : ''));
  console.log('=== _smoke_ui_layout: ' + (results.length - fails.length) + '/' + results.length + ' 断言通过 ===');
  process.exit(fails.length ? 1 : 0);
})().catch((e) => {
  console.log('FAIL _smoke_ui_layout.js：' + String(e && e.message || e).slice(0, 160));
  process.exit(1);
});
