// _verify_seal_mech_consumed.js — 「劫印机制消费点」门禁（M1-QA-SEALGATE-01，2026-09-14）
// ---------------------------------------------------------------------------
// 背景：劫印词条的机制改写层 SEAL_WORDS[*].mech 定义了「反伤触发时清除负面」等效果，
//   但历史上 `reflectStackClear`（轮回·金档）**定义了却零消费者**，机制静默失效很久，
//   而当时的 31/31 门禁完全没发现——本门禁即为补上这个盲区（防再犯）。
//
// 判定口径：
//   ① 真源 js/jieseals.js 取出所有 `mech:` 定义的机制名（去重，附定义行号）；
//   ② 在战斗内核语料 js/**（**排除** js/jieseals.js 定义真源与 js/ui/ 纯展示层）
//      中，判定每个机制名是否存在**实际消费**——即下列任一读取形态：
//        F('mech')  /  _hasSeal('mech')  /  flags['mech']  /  flags.mech
//      （注释里的名字列举不构成消费：这些形态不会命中注释文本，故死机制不会被注释掩盖）
//   ③ 违规（定义却无消费者）> 0 时进程非 0 退出（与既有 _verify_*.js 风格一致）。
//
// 运行：node scripts/_verify_seal_mech_consumed.js
// 预期（接线前）：违规 1 条：reflectStackClear @ js/jieseals.js:110
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra != null ? ' — ' + extra : '')); }
};

// ============================================================
// 1) 取真源：所有劫印机制名（mech）
// ============================================================
const jiePath = path.join(ROOT, 'js/jieseals.js');
const jieSrc = fs.readFileSync(jiePath, 'utf8');

// 1a) 静态解析（附定义行号，用于违规定位）
const defs = []; // { mech, line }
jieSrc.split('\n').forEach((ln, i) => {
  for (const m of ln.matchAll(/mech:\s*'([^']+)'/g)) defs.push({ mech: m[1], line: i + 1 });
});

// 1b) 载入真源交叉校验（SEAL_WORDS[*].mech，与静态解析并集，防漏）
const mechSet = new Set();
try {
  const sb = { console, Math, JSON, Date }; sb.NDX = {};
  vm.runInContext(jieSrc, vm.createContext(sb), { filename: 'js/jieseals.js' });
  const SW = sb.NDX && sb.NDX.SEAL_WORDS;
  if (SW) Object.values(SW).forEach((w) => { if (w && w.mech) mechSet.add(w.mech); });
} catch (e) { /* 载入失败则退回静态解析，不静默通过 */ }
defs.forEach((d) => mechSet.add(d.mech));
const mechs = [...mechSet].sort();

// ============================================================
// 2) 消费语料：js/** 去掉「定义真源」与「纯展示层」
// ============================================================
function walk(dir, out) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (f.name.endsWith('.js')) out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
// 负控/自测钩子：SEALGATE_COMBAT_PART1=<file> 仅替换语料里的 combat_part1.js
//   （用于对"接线前"版本做负控，证明门禁确能抓出无消费者机制；默认读真实文件，不影响常规运行）
const CORPUS_OVERRIDE = {};
if (process.env.SEALGATE_COMBAT_PART1 && fs.existsSync(process.env.SEALGATE_COMBAT_PART1)) {
  CORPUS_OVERRIDE['js/combat_part1.js'] = fs.readFileSync(process.env.SEALGATE_COMBAT_PART1, 'utf8');
}
const corpus = walk(path.join(ROOT, 'js'), [])
  .filter((p) => rel(p) !== 'js/jieseals.js')    // 排除定义真源（否则自我命中）
  .filter((p) => !rel(p).startsWith('js/ui/'))   // 排除 UI 展示层（"仅文字展示"不算机制消费）
  .map((p) => ({ file: rel(p), lines: (CORPUS_OVERRIDE[rel(p)] || fs.readFileSync(p, 'utf8')).split('\n') }));

// ============================================================
// 3) 逐机制判定消费
// ============================================================
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function consumeSites(mech) {
  const M = esc(mech);
  // 四条消费形态：F('M') / _hasSeal('M') / ['M'] / .M（\b 边界防前缀误命中）
  const re = new RegExp(
    "F\\(\\s*['\"]" + M + "['\"]\\s*\\)" +
    "|_hasSeal\\(\\s*['\"]" + M + "['\"]\\s*\\)" +
    "|\\[\\s*['\"]" + M + "['\"]\\s*\\]" +
    "|\\.\\s*" + M + "\\b"
  );
  const hits = [];
  for (const { file, lines } of corpus) {
    for (let i = 0; i < lines.length; i++) if (re.test(lines[i])) hits.push(file + ':' + (i + 1));
  }
  return hits;
}

console.log('\n[劫印机制消费门禁] 机制数=' + mechs.length + '，消费语料=' + corpus.length + ' 文件（js/** 去定义真源与 ui/）');

const violations = [];
for (const m of mechs) {
  const d = defs.find((x) => x.mech === m);
  const pos = 'js/jieseals.js' + (d ? ':' + d.line : '');
  const hits = consumeSites(m);
  if (hits.length) {
    pass++;
    console.log('  ✓ ' + m.padEnd(24) + ' 消费点 ' + hits.slice(0, 3).join(', ') + (hits.length > 3 ? ' …(共' + hits.length + ')' : ''));
  } else {
    fail++;
    violations.push({ m, pos });
    console.log('  ✗ ' + m.padEnd(24) + ' 无消费点（定义 ' + pos + '）—— 机制定义了却无消费者');
  }
}

// ============================================================
// 4) 结构守卫：机制 → fateFlags 聚合通道 + F() 读取入口
// ============================================================
const cp1 = CORPUS_OVERRIDE['js/combat_part1.js'] || fs.readFileSync(path.join(ROOT, 'js/combat_part1.js'), 'utf8');
ck('内核 F() 读取入口存在（combat_part1.js）', /const\s+F\s*=\s*\(/.test(cp1));
ck('mech→fateFlags 聚合通道存在（combat_part1.js）', /fateFlags\[[^\]]*mechanism[^\]]*\]/.test(cp1));

// ============================================================
// 5) 结论 + 违规清单
// ============================================================
ck('提取到 >=1 个机制定义（真源可解析）', mechs.length > 0, '提取数=' + mechs.length);

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
if (violations.length) {
  console.log('违规机制（' + violations.length + '，定义却无消费点）：');
  violations.forEach((v) => console.log('  - ' + v.m + ' @ ' + v.pos));
}
process.exit(fail ? 1 : 0);
