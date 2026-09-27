// _smoke_sutra_panel.js — 经文面板渲染冒烟（V9.35）
// 目的：确认「残片总览 + 逆藏进度清单」在面板中真能渲染出 X/N（非仅语法通过）。
// 手法：vm 载入 data_sutra.js（提供 34 部目录 + sutraFragOverview/经位 API）→ 载入 ui_panel_2.js
//       → 以最小 state 调 NDX.ui.panelHtml(s, g, hero)，断言输出含关键标记。
// 由 scripts/_run_all_gates.js 的 /^(_smoke_|test_|_verify_).*\.js$/ 正则自动收录。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const win = {};
const sandbox = { NDX: {}, window: win, console: console, Math: Math, JSON: JSON };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const R = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
vm.runInContext(R('js/data_sutra.js'), sandbox);
const NDX = win.NDX;
sandbox.NDX = NDX;
// 依赖桩：整局播种随机（真源 data_seed.js 不加载）
NDX.runRandom = function () { return 0.5; };
if (!NDX.getCycle) NDX.getCycle = function () { return 1; };

// 最小全局桩（面板模板可能引用的通用工具）
sandbox.esc = (x) => String(x == null ? '' : x);
sandbox.document = { createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, classList: { add() {}, remove() {} } }) };

vm.runInContext(R('js/ui/ui_panel_2.js'), sandbox);
const panelHtml = NDX.ui && NDX.ui.panelHtml;
if (typeof panelHtml !== 'function') { console.log('FAIL 未导出 NDX.ui.panelHtml'); process.exit(1); }

let fail = 0;
const ok = (c, m) => { if (!c) { console.log('FAIL ' + m); fail++; } };

function mkState(over) {
  const s = {
    pending: { kind: 'sutra' },
    sutraFrags: {}, niSutraFrags: {},
    sutras: [], niSutras: [], sutraBackpack: [],
    jingSlots: { atk: null, chant: null },
    over: null, fate: {},
  };
  return Object.assign(s, over || {});
}

// 🔴 V9.54：面板上的「X/N」随定价表走，**一律从真源算**，不写死（旧 203/76 已过期红过一轮）
const F_TOTAL = (NDX.sutraFragOverview({}, 'ferry') || {}).total;
const N_TOTAL = (NDX.sutraFragOverview({}, 'rebel') || {}).total;

// 1) 未启逆道：残片总览 + 渡 0/N + 逆藏「未启」
{
  let html = '';
  try { html = panelHtml(mkState(), { state: mkState() }, {}); }
  catch (e) { console.log('FAIL 渲染抛错: ' + e.message); process.exit(1); }
  ok(html.indexOf('残片总览') >= 0, '面板应含「残片总览」');
  ok(html.indexOf('渡藏') >= 0 && html.indexOf('0/' + F_TOTAL) >= 0, `面板应含 渡藏 残片 0/${F_TOTAL}`);
  ok(html.indexOf('逆藏') >= 0 && html.indexOf('未启') >= 0, '未启逆道应显示 逆藏·未启');
  ok(html.indexOf('逆藏 · 逆行所得') >= 0, '应含逆藏进度清单区块');
  ok(html.indexOf('ni-sutra-block') >= 0, '应含 ni-sutra-block 容器');
  ok(html.indexOf('frag-overview') >= 0, '应含 frag-overview 容器');
  // 12 部逆藏均应出现（只读清单）
  const niN = (NDX.NI_SUTRA_FULLS || []).length;
  let hit = 0;
  (NDX.NI_SUTRA_FULLS || []).forEach((f) => { if (html.indexOf(f.name) >= 0) hit++; });
  ok(hit === niN, `逆藏清单应列出全部 ${niN} 部，实际命中 ${hit}`);
}

// 2) 有残片 + 已启逆道：数字随状态变化
{
  const s = mkState({ fate: { 逆: 1 } });
  const fGot = NDX.grantSutraHalf(s, 'su_full_xinjing', 2);   // 渡 +⌈cost/2⌉
  const nGot = NDX.grantSutraHalf(s, 'ni_full_pojie', 1);     // 逆 +⌈cost/2⌉
  let html = '';
  try { html = panelHtml(s, { state: s }, {}); }
  catch (e) { console.log('FAIL 渲染抛错(2): ' + e.message); process.exit(1); }
  ok(html.indexOf(fGot.prog.have + '/' + F_TOTAL) >= 0,
    `渡藏残片应显示 ${fGot.prog.have}/${F_TOTAL}，实际未命中`);
  ok(html.indexOf(nGot.prog.have + '/' + N_TOTAL) >= 0,
    `逆藏残片应显示 ${nGot.prog.have}/${N_TOTAL}，实际未命中`);
  ok(html.indexOf('未启') < 0, '已启逆道不应再显示「未启」');
}

if (fail === 0) console.log('ok / 经文面板渲染冒烟（残片总览 X/N · 逆藏清单）通过');
else console.log(`${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
