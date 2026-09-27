// _verify_diff_reward_loop.js — V9.68 · R5「难度↔回报闭环」落地门禁
//   难度表 `rewardMult / sealMult / startGold` 三字段自 V8.40 建表起**全仓零消费**，
//   S18 两份文档（审计 #5 / 深度分析 O4）均判 P0，本脚本守护其接线不再回退。
//
//   接线：
//     ① rewardMult → 战后碎金（game_combat_2.js 胜利结算，与 curseRewardMul 连乘成单一乘子链）
//     ② sealMult   → 劫印属性值（combat_part1.js computeStats 的 bonus.seals 聚合，单点乘区全链路生效）
//     ③ startGold  → 开局金币（game_event_1.js newRun 的 state.gold，轮回赐福在其后叠加）
//
// ⚠ 纪律：不只查「符号存在」，还查「走没走对通道」+ 真调一次。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };

const _noop = () => {};
function loadGame() {
  const sb = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, Date, JSON, Math,
    navigator: { userAgent: 'node' },
    localStorage: { getItem: () => null, setItem: _noop, removeItem: _noop },
    document: {
      getElementById: () => null,
      createElement: () => ({ style: {}, setAttribute: _noop, appendChild: _noop, addEventListener: _noop, classList: { add: _noop, remove: _noop }, querySelector: () => null, remove: _noop }),
      querySelector: () => null, querySelectorAll: () => [], addEventListener: _noop, body: { appendChild: _noop }, documentElement: { style: {} },
    },
    requestAnimationFrame: (cb) => setTimeout(cb, 0), addEventListener: _noop, removeEventListener: _noop,
  };
  sb.window = sb; sb.global = sb; sb.self = sb;
  const ctx = vm.createContext(sb);
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].forEach((m) => {
    const f = m[1]; if (/^https?:/.test(f)) return;
    const fp = path.join(ROOT, f.split('?')[0]);
    if (!fs.existsSync(fp)) return;
    try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: f }); } catch (e) { /* 单文件失败不中断 */ }
  });
  return sb.NDX;
}
const NDX = loadGame();
const readSrc = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

console.log('=== _verify_diff_reward_loop：V9.68 难度↔回报闭环（R5）===');

// —— A 组：真源完整性（4 档 × 3 字段）——
const F = ['rewardMult', 'sealMult', 'startGold'];
const DIFF = NDX.DIFFICULTY || {};
['easy', 'normal', 'hard', 'hell'].forEach((k) => {
  const c = DIFF[k] || {};
  const miss = F.filter((f) => !Number.isFinite(+c[f]));
  ok(miss.length === 0, `A· ${k} 档三字段齐全${miss.length ? '（缺 ' + miss.join('/') + '）' : ''}`);
});

// —— B 组：单一入口（禁止各消费点裸写 DIFFICULTY[x].rewardMult 等）——
['diffCfgOf', 'rewardMulOf', 'sealMultOf', 'startGoldOf'].forEach((fn) => {
  ok(typeof NDX[fn] === 'function', `B· 访问器 ${fn} 已定义（单一真源入口）`);
});
// 允许裸读 DIFFICULTY 的文件：定义处 + 只取展示字段（name/icon）与 scoreMult 的既有消费点
const ALLOW = ['js/data_config.js', 'js/data_rank.js', 'js/main.js', 'js/ui/ui_misc_2.js', 'js/ui/ui_modals_1.js'];
const jsFiles = [];
(function walk(d) {
  fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== '_retired') walk(p); return; }
    if (e.name.endsWith('.js') && !/^_/.test(e.name)) jsFiles.push(path.relative(ROOT, p).replace(/\\/g, '/'));
  });
})(path.join(ROOT, 'js'));
const bare = [];
jsFiles.forEach((f) => {
  if (ALLOW.indexOf(f) >= 0) return;
  const txt = readSrc(f);
  // 命中「直接按字段取值」的裸写（DIFFICULTY[...].rewardMult / cfg.sealMult 等），注释行不计
  txt.split(/\r?\n/).forEach((ln) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(ln)) return;
    if (/DIFFICULTY\s*\[[^\]]*\]\s*\.\s*(rewardMult|sealMult|startGold)/.test(ln)) bare.push(f + ' → ' + ln.trim().slice(0, 60));
  });
});
ok(bare.length === 0, 'B· 无文件裸写 DIFFICULTY[x].(rewardMult|sealMult|startGold)：' + (bare.join(' | ') || '无'));

// —— C 组：三个消费点接线（静态）——
const C1 = readSrc('js/combat_part1.js');
const CB2 = readSrc('js/game/game_combat_2.js');
const E1 = readSrc('js/game/game_event_1.js');
// ② sealMult → 劫印主属性
ok(/sealMultOf/.test(C1) && /_sealMul/.test(C1), 'C1 combat_part1.js 已取 sealMult 乘区');
ok(/\(sl\.val \|\| 0\) \* _sealMul/.test(C1), 'C2 劫印主轴 sl.val 乘了 _sealMul');
['maxhp', 'atk', 'matk', 'mdef', 'lifesteal', 'crit'].forEach((k) => {
  // 只认**代码行**（跳过注释行），且必须命中「if (sl.X) … × _sealMul」这一具体形态
  //   ⚠ 不能用宽松的 `\b${k}\b` 找首现行：会先撞上 `sl.stat === 'maxhp'` 那行而假红
  const hit = C1.split(/\r?\n/).some((ln) => !/^\s*(\/\/|\*|\/\*)/.test(ln)
    && new RegExp(`if \\(sl\\.${k}\\b`).test(ln) && /\*\s*_sealMul/.test(ln));
  ok(hit, `C3· sl.${k} 附加副属性同样吃 _sealMul（否则主/副口径撕裂）`);
});
// ① rewardMult → 战后碎金
ok(/rewardMulOf/.test(CB2), 'C4 game_combat_2.js 已接 rewardMult');
{
  const i = CB2.indexOf('rewardMulOf');
  const seg = i >= 0 ? CB2.slice(i - 220, i + 400) : '';
  ok(i >= 0 && /p\.win/.test(seg), 'C5 rewardMult 消费点在「本场胜利」分支内（失败不白给）');
  // ⚠ 逐行找**代码行**的首现下标：注释里若提到 curseRewardMul 会被 indexOf 骗到（本文件就踩过这个坑）
  const codeIdx = (txt, kw) => {
    const ls = txt.split(/\r?\n/);
    for (let i = 0; i < ls.length; i++) if (ls[i].indexOf(kw) >= 0 && !/^\s*(\/\/|\*|\/\*)/.test(ls[i])) return i;
    return -1;
  };
  const a = codeIdx(CB2, 'NDX.rewardMulOf'), b = codeIdx(CB2, 'NDX.curseRewardMul');
  ok(a >= 0 && b >= 0 && a < b, `C6 乘子链顺序：先 rewardMult(行${a + 1}) 再 curseRewardMul(行${b + 1})（连乘，乘法可交换）`);
}
// ③ startGold → 开局金币
{
  const m = E1.match(/gold:\s*\(\s*typeof NDX\.startGoldOf === 'function'\s*\?\s*NDX\.startGoldOf\([^)]*\)\s*:\s*0\s*\)/);
  ok(!!m, 'C7 game_event_1.js 的 state.gold 取的是难度表 startGold（非恒 0）');
  ok(/difficulty:\s*_startDiff/.test(E1) && /_startDiff/.test(E1), 'C8 difficulty 与 startGold 同源取 _startDiff（难度档与启动金必须一致）');
}

// —— D 组：真调一次（构造 state，四档取值）——
const st = (d) => ({ difficulty: d });
const EXP = { easy: [0.8, 0.8, 200], normal: [1, 1, 100], hard: [1.3, 1.2, 50], hell: [1.6, 1.4, 0] };
let dBad = [];
['easy', 'normal', 'hard', 'hell'].forEach((k) => {
  const [rm, sm, g] = EXP[k];
  const got = [NDX.rewardMulOf(st(k)), NDX.sealMultOf(st(k)), NDX.startGoldOf(st(k))];
  if (Math.abs(got[0] - rm) > 1e-9 || Math.abs(got[1] - sm) > 1e-9 || got[2] !== g) dBad.push(`${k}: 期望 ${rm}/${sm}/${g}，实得 ${got.join('/')}`);
});
ok(dBad.length === 0, 'D1 四档 rewardMult / sealMult / startGold 实跑取值正确' + (dBad.length ? '：' + dBad.join(' | ') : ''));
console.log('     easy=0.80/0.80/200 normal=1.00/1.00/100 hard=1.30/1.20/50 hell=1.60/1.40/0');
// 兜底与解析纪律：无 difficulty 的 state 回退 normal（不得 NaN / undefined）
ok(NDX.rewardMulOf({}) === 1 && NDX.startGoldOf({}) === 100, 'D2 缺 difficulty 的 state 回退 normal（不返回 NaN）');
ok(NDX.diffCfgOf({ difficulty: '不存在的档' }).rewardMult === 1, 'D3 未知难度名安全兜底到 normal');
ok(NDX.sealMultOf(undefined) === 1, 'D4 无 state 传入（如面板预渲染）也不崩，回退 1.0');

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
