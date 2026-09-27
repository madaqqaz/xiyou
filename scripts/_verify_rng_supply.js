// _verify_rng_supply.js — X3「rng 透传链断裂」供给接线门禁（2026-09-27 · Batch 1）
//
//   守护一条链：**供给**（combat_active.js 4 处 ctx 的 `rng:` 键）
//     → **中转**（resolveSkillAct 建 c1.rng，data_skill_index.js:397）
//     → **消费**（applyJingSlotMods 第 4 参 / applyTreasureStatus 第 3 参）
//   断在任一段，概率层就回退裸 `Math.random()`，同态双调不一致率 41.88%（S09 R2 实测）。
//
// ⚠ 纪律（X4 教训）：本门禁**不许只做静态文本断言**。A 组只当「新增调用点忘接线」的差集护栏，
//   B/C 组一律**真调**（真跑一次 activeSkill，截获 ctx 与各层实参），并配**反证**
//   （把接线改回旧写法 ⇒ 本脚本必须变红）。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };
const readSrc = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// —— vm 全量沙箱（按 index.html 顺序装载）——
function loadGame() {
  const _noop = () => {};
  const sb = {
    console: { log: () => {}, warn: () => {}, error: () => {}, info: () => {} },
    setTimeout, clearTimeout, setInterval, clearInterval, Date, JSON, Math,
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
  const html = readSrc('index.html');
  [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].forEach((m) => {
    const f = m[1]; if (/^https?:/.test(f)) return;
    const fp = path.join(ROOT, f.split('?')[0]);
    if (!fs.existsSync(fp)) return;
    try { vm.runInContext(readSrc(f.split('?')[0]), ctx, { filename: f }); } catch (e) { /* 单文件失败不中断 */ }
  });
  return sb.NDX;
}

console.log('=== _verify_rng_supply：X3 rng 透传链（供给 → 中转 → 消费）===');

// ═══ A 组 · 静态差集护栏：新增 resolveSkillAct 调用点若忘补 rng 必红 ═══
{
  const CA = readSrc('js/combat_active.js');
  const codeLines = CA.split(/\r?\n/).filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l));
  const calls = codeLines.filter((l) => /NDX\.resolveSkillAct\s*\(/.test(l));
  ok(calls.length === 4, `A0 combat_active.js 的 resolveSkillAct 调用点已枚举（实得 ${calls.length} 处）`);
  const noRng = calls.filter((l) => !/rng:/.test(l));
  ok(noRng.length === 0,
    `A1 每个调用点的 ctx 字面量都带 rng 键（漏 ${noRng.length} 处：${noRng.map((l) => l.trim().slice(0, 40)).join(' | ') || '无'}）`);
  ok(/function _actRng\(\)\s*\{\s*return \(typeof NDX\.runRandom === 'function'\)\s*\?\s*NDX\.runRandom\s*:\s*null/.test(CA),
    'A2 供给器 _actRng() 只取 NDX.runRandom（未播种时它即 Math.random，生产等价）');
  ok(/NDX\.runRandom\s*=\s*function[^\n]* ND?X?\._runRng \? NDX\._runRng\(\) : Math\.random\(\)/.test(readSrc('js/data_seed.js'))
    || /return NDX\._runRng \? NDX\._runRng\(\) : Math\.random\(\)/.test(readSrc('js/data_seed.js')),
    'A3 data_seed.js 的 runRandom 在未播种时回退 Math.random（本接线零回归的依据）');
  // 🩸 X4 判据如实化（2026-09-27）：原断言名写「**生产侧**尚无 initRunRng 调用」，
  //    但扫描范围**只有 `js/combat_active.js` 一个文件**（还按行首注释过滤，恰好把含
  //    initRunRng 的两行注释滤掉）⇒ 扫不到 `js/game/game_event_1.js`。
  //    实证：改动前 game_event_1.js:14 每局开局都调 initRunRng ⇒ 生产 `_runRng` 非 null
  //    ⇒ `runRandom()` 走 mulberry32 流 ⇒ **真生产侧并不成立**，本条是「假护栏」。
  //    2026-09-27 随「种子系统退役」摘除该调用 ⇒ 本护栏才名副其实（A2/A3 的零回归前提也因此为真）。
  //    ⚠ 仍属**文本匹配**类断言：它抓得住「有人在此文件重新接线」，抓不住「别处偷偷播种」
  //      ⇒ 全生产侧的真调兜底在下方 B 组（同文件），两者互补，别只留一个。
  ok(!/initRunRng\s*\(/.test(codeLines.filter((l) => !l.includes('data_seed.js')).join('\n')),
    'A4 护栏：combat_active.js 内无 initRunRng 调用（⇒ runRandom 恒等于 Math.random，接线零回归）'
    + '【扫描范围=单文件·非全生产侧；全侧真调见 B 组】');
}

// ═══ B 组 · 真调 + 反证：ctx 里是否真有 rng ═══
const FAKE_S = { hero: 'tangseng', flags: {}, materials: {}, equips: [], act: 1, layer: 1 };
const FAKE_PLAYER = { ti: { atk: 100, maxHp: 500 }, yuan: { matk: 80, maxHp: 500 }, crit: 0.1, critDmg: 1.5, eva: 0.05 };
const FAKE_MON = { name: '测试妖', hp: 500, atk: 50, tier: 3 };

function capture(NDX, patch) {
  const CA = patch ? patch(readSrc('js/combat_active.js')) : readSrc('js/combat_active.js');
  const _noop = () => {};
  const sb = {
    console: { log: () => {}, warn: () => {}, error: () => {}, info: () => {} },
    setTimeout, clearTimeout, setInterval, clearInterval, Date, JSON, Math,
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
  // 只注入 rng 链路四件套（按 index.html 顺序），不整装，避免单文件失败噪声
  const order = readSrc('index.html').match(/<script src="([^"]+)"[^>]*>/g) || [];
  const want = ['js/data_seed.js', 'js/combat_active.js', 'js/data_sutra.js', 'js/data_skill_variant.js', 'js/data_skill_index.js'];
  const ctx = vm.createContext(sb);
  order.map((tag) => tag.match(/src="([^"]+)"/)[1])
    .filter((f) => want.some((w) => f.split('?')[0].endsWith(w)))
    .forEach((f) => {
      let src = readSrc(f.split('?')[0]);
      if (f.split('?')[0].endsWith('combat_active.js')) src = CA;
      try { vm.runInContext(src, ctx, { filename: f }); } catch (e) { /* 缺依赖时静默 */ }
    });
  const N = sb.NDX;

  const capCtx = [], capJing = [], capTre = [];
  // 🩸 一次性快照：包装器**绝不写回 NDX**。旧写法 `NDXO[key] = keep` 里的 keep 就是包装器自己，
  //    ⇒ 每调一次就把自己再包一层，万层自我嵌套后 capJing 塞满 "function" 撑爆输出（128KB）。
  const snap = (obj, key, sink, pick) => {
    const orig = obj[key];
    if (typeof orig !== 'function') return;
    obj[key] = function () {
      if (sink.length < 20) sink.push(pick(arguments));   // 限长兜底：任何包装器泄漏都不会撑爆输出
      return orig.apply(this, arguments);
    };
  };
  if (N.resolveSkillAct) {
    snap(N, 'resolveSkillAct', capCtx, (a) => ({ kind: a[1], t: a[2] && typeof a[2].rng }));
  }
  // ⚠ 口径：`resolveSkillAct:401` 把未传的 rng 归一成 **c1.rng = null**（不是 undefined）
  //   ⇒ typeof null === 'object'。这里统一归一为 'null' / 'fn'，避免断言被 typeof 的表象绕进去。
  const norm = (v) => (v == null ? 'null' : (typeof v === 'function' ? 'fn' : typeof v));
  if (N.applyJingSlotMods) snap(N, 'applyJingSlotMods', capJing, (a) => norm(a[3]));
  if (N.applyTreasureStatus) snap(N, 'applyTreasureStatus', capTre, (a) => norm(a[2]));

  ['atk', 'chant', 'ult'].forEach((k) => {
    try { N.activeSkill(FAKE_PLAYER, FAKE_MON, k, FAKE_S); } catch (e) { /* 缺依赖不得中断断言 */ }
  });
  return { capCtx, capJing, capTre, N };
}

{
  const good = capture(null);
  ok(good.capCtx.length === 3 && good.capCtx.every((x) => x.t === 'function'),
    `B1 真调：activeSkill 的 atk/chant/ult 三路 ctx.rng 都是函数（实得 ${JSON.stringify(good.capCtx)}）`);
  ok(good.capJing.length > 0 && good.capJing.every((t) => t === 'fn'),
    `B2 真调：jing 层 applyJingSlotMods 第 4 参收到 rng 函数（实得 ${JSON.stringify(good.capJing)}）`);
  ok(good.capTre.length > 0 && good.capTre.every((t) => t === 'fn'),
    `B2b 真调：treasure 层 applyTreasureStatus 第 3 参收到 rng 函数（实得 ${JSON.stringify(good.capTre)}）`);

  // 反证：把 4 处 ctx 的 rng 键摘掉（= 改回旧写法），断言必须全部变 undefined
  const revert = (txt) => txt.replace(/, rng: _actRng\(\)/g, '');
  const bad = capture(null, revert);   // ⚠ 第 2 参才是 patch；写成 capture(revert) 会把 revert 当 NDX 传进去，反证假绿
  ok(bad.capCtx.length === 3 && bad.capCtx.every((x) => x.t === 'undefined')
    && bad.capJing.length > 0 && bad.capJing.every((t) => t === 'null')
    && bad.capTre.length > 0 && bad.capTre.every((t) => t === 'null'),
    `B3 反证：摘掉 rng 键后 ctx.rng 归一为 null、两层实参也收 null ⇒ 必回退 Math.random（实得 ${JSON.stringify(bad.capCtx)} / ${JSON.stringify(bad.capJing)} / ${JSON.stringify(bad.capTre)}）`);
}

// ═══ C 组 · 真调：供给源在播种后可复现（零回归的反向验证）═══
{
  const N = loadGame();
  ok(N._runRng === null, 'C1 生产态 NDX._runRng 为 null（runRandom ≡ Math.random，接线不改变线上手感）');
  const a = [N.runRandom(), N.runRandom()], b = [N.runRandom(), N.runRandom()];
  ok(a[0] !== a[1], `C2 未播种时 runRandom 连续取值不同（真随机行为，实得 ${a[0].toFixed(5)}→${a[1].toFixed(5)}）`);
  const seed = 20260927;
  const r1 = N.initRunRng(seed); const s1 = [r1(), r1(), r1()].join(',');
  N.initRunRng(seed); const s2 = [r1(), r1(), r1()].join(',');
  const before = s1;
  N.initRunRng(seed);
  const r2 = N.initRunRng(seed); const s3 = [r2(), r2(), r2()].join(',');
  ok(before === s3, `C3 播种后同种子复现同一随机流（${before}）`);
  N.clearRunRng();
  ok(N._runRng === null, 'C4 clearRunRng 后回到真随机（作用域可安全退出）');
}

console.log(`\n_verify_rng_supply：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
