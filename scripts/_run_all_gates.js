// _run_all_gates.js — 全量门禁跑批器（不依赖 shell glob，Windows/Git Bash 均稳）
// 判据：退出码 != 0 或 输出结论行中「N 失败 / N fail」的 N != 0
//
// V9.40 · 环境自适应双模式执行
//   · 首选 spawn 子进程 —— 真隔离，与手动 `node scripts/xxx.js` 完全一致；
//   · 若环境拒绝创建子进程（沙箱 EBUSY / EPERM：status===null 且有 error），
//     自动退回「in-process vm 沙箱」逐个执行，**每个门禁一个全新 context**。
//   ⚠ 修复动机：此前 EVERY 门禁在沙箱里都报 `exit=null`，看起来像全量回归，实为环境故障。
//
//   in-process 模式为何必须自带模块加载器：
//     大量门禁的启动姿势是
//         Object.defineProperty(global, 'window', { value: global });
//         require(path.join(ROOT, 'js', f));      // game js 写 window.NDX
//         const NDX = global.NDX;
//     若 require 走**宿主**模块系统，被加载的 game js 会执行在宿主 realm 里，
//     把 NDX 写到宿主的 global，而门禁读的是它自己 context 的 global → NDX undefined。
//     因此这里实现「context 内模块系统」：非内建模块的源码在门禁自己的 context 里求值，
//     缓存亦按 context 隔离 → 门禁之间零串味，等价于每个门禁一个独立进程。
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Module = require('module');
const DIR = path.join(__dirname);
const ROOT = path.join(DIR, '..');
const BUILTINS = new Set((Module.builtinModules || []).map((m) => m.replace(/^node:/, '')));
const files = fs.readdirSync(DIR).filter((f) => /^(_smoke_|test_|_verify_).*\.js$/.test(f))
  .concat(['regression.js', 'platform_test.js', 'validate_audio.js', 'bus_decoupling_test.js',
    // 六道供给规则门禁（data_trial_dao.js）：审查=必给缺失数，字段守卫=重写丢字段数
    '_audit_trial_dao.js', '_check_dao_fieldloss.js', '_audit_trials81.js'])
  .filter((f) => fs.existsSync(path.join(DIR, f)))
  .filter((f) => f !== path.basename(__filename))
  .filter((f, i, a) => a.indexOf(f) === i)
  .sort();
// 可选：命令行子串过滤，便于单点复现（node scripts/_run_all_gates.js squad jing）
const ARGV = process.argv.slice(2);
const VERBOSE = ARGV.includes('-v') || ARGV.includes('--verbose') || !!process.env.GATES_VERBOSE;
const FILTER = ARGV.filter((a) => !a.startsWith('-'));
const picked = FILTER.length ? files.filter((f) => FILTER.some((k) => f.includes(k))) : files;

// —— 运行模式探测：本环境能否创建子进程 ——
function spawnUsable() {
  try {
    const r = spawnSync(process.execPath, ['-e', '0'], { encoding: 'utf8', timeout: 15000 });
    return !(r.error || r.status === null);
  } catch (e) { return false; }
}

// —— in-process 兜底：门禁 = 「CommonJS 顶层脚本」，跑在自己的 vm context 里 ——
function runInProcess(file) {
  const logs = [];
  const push = (...a) => logs.push(a.map((x) => {
    if (typeof x === 'string') return x;
    try { return JSON.stringify(x); } catch (e) { return String(x); }
  }).join(' '));
  const EXIT = { __gateExit: true, code: 0 };
  const sandbox = {
    console: { log: push, error: push, warn: push, info: push, debug: push },
    __dirname: DIR,
    __filename: file,
    process: {
      argv: ['node', file], execPath: process.execPath, platform: process.platform,
      arch: process.arch, version: process.version, versions: process.versions, env: process.env,
      cwd: () => process.cwd(), nextTick: (fn, ...a) => process.nextTick(fn, ...a),
      exitCode: 0, on() {}, once() {}, off() {}, emit() {},
      exit: (code) => { EXIT.code = (code == null ? 0 : code); throw EXIT; },
    },
    Buffer, URL, URLSearchParams, TextEncoder, TextDecoder, AbortController,
    setTimeout, clearTimeout, setInterval, clearInterval, setImmediate, clearImmediate, queueMicrotask,
  };
  let code = 0;
  const ctx = vm.createContext(sandbox);
  const g = vm.runInContext('this', ctx);
  // 门禁普遍用 global/window/self 三者互相赋值来搭 DOM 替身，先给出同一对象
  sandbox.global = g; sandbox.window = g; sandbox.self = g;
  // —— context 内模块系统 ——
  const cache = Object.create(null);
  // 与 node `Module._compile` 对齐：去掉 BOM 与 shebang（脚本内有 `#!/usr/bin/env node` 时，
  //   不处理会被包进 `(function(){ #!... })` → SyntaxError: Invalid or unexpected token）。
  //   用 replace 保留换行，避免行号偏移导致报错行号错位。
  const prep = (src) => src.replace(/^\uFEFF/, '').replace(/^#![^\n]*/, '');
  function ctxRequire(id) {
    if (typeof id !== 'string') return require(id);
    if (BUILTINS.has(id.replace(/^node:/, ''))) return require(id);
    let abs = null;
    try { abs = path.isAbsolute(id) ? id : require.resolve(id, { paths: [DIR, ROOT] }); } catch (e) { abs = null; }
    if (!abs || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) return require(id); // 交回宿主（会正常抛错）
    if (cache[abs]) return cache[abs].exports;
    const mod = { exports: {}, id: abs, filename: abs, loaded: false, paths: Module._nodeModulePaths(path.dirname(abs)) };
    cache[abs] = mod;
    try {
      const wrapper = vm.runInContext(
        '(function (exports, require, module, __filename, __dirname) {' + prep(fs.readFileSync(abs, 'utf8')) + '\n})',
        ctx, { filename: abs });
      wrapper.call(mod.exports, mod.exports, ctxRequire, mod, abs, path.dirname(abs));
      mod.loaded = true;
    } catch (e) {
      delete cache[abs];
      throw e;
    }
    return mod.exports;
  }
  sandbox.require = ctxRequire;
  // ⚠ 关键：门禁本身也必须走「模块包裹」执行，不能用 vm.runInContext(源码) 裸跑。
  //   原因（本仓真实踩坑）：门禁顶层普遍有 `const NDX = global.NDX;`。裸跑时它是**全局词法绑定**，
  //   在整个脚本求值期间处于 TDZ —— 连它自己上方的加载循环里那些 `require(gameJs)` 都会被影响：
  //   被加载模块里的裸 `NDX` 会解析到那个 TDZ 绑定，抛 `ReferenceError: NDX is not defined`
  //   （表现为「法宝 on-hit / 六道 / squad 等门禁集体报 NDX 未定义」，而同一份代码 spawn 跑得好好的）。
  //   套上 CommonJS 包裹后 const/let/var 全部函数作用域，语义与真实 node 完全一致。
  try {
    ctxRequire(file);
    code = sandbox.process.exitCode || 0;
  } catch (e) {
    if (e && e.__gateExit) code = e.code || 0;
    else { code = 1; logs.push('[throw] ' + String((e && e.stack) || e)); }
  }
  return { status: code, out: logs.join('\n') };
}

const useSpawn = spawnUsable();
if (!useSpawn) {
  console.log('⚠ 本环境拒绝创建子进程（spawn EBUSY/EPERM）→ 改用 in-process vm 沙箱执行；');
  console.log('  每个门禁独立 context + context 内模块系统，等价于独立进程，结论依然可信。\n');
}

let worst = 0, okN = 0;
const rows = [];
picked.forEach((f) => {
  const abs = path.join(DIR, f);
  const r = useSpawn
    ? spawnSync(process.execPath, [abs], { encoding: 'utf8', cwd: ROOT })
    : runInProcess(abs);
  const out = (r.stdout || '') + (r.stderr || '') + (r.out || '');
  const concl = (out.match(/^.*(结论|通过 \/|ok \/).*$/gm) || []).slice(-1)[0] || '';
  // 失败数判据兼容两种结论格式：中文「N 失败」；以及「通过 / 失败 = A / B」（取 B）
  const m1 = concl.match(/(\d+)\s*(失败|fail)/);
  const m2 = concl.match(/失败\s*[=:]\s*\d+\s*\/\s*(\d+)/);
  const failN = m1 ? +m1[1] : (m2 ? +m2[1] : 0);
  const bad = r.status !== 0 || failN !== 0;
  if (bad) {
    worst = 1;
    rows.push('*** FAIL ' + f + ' exit=' + r.status + ' ' + concl.trim());
    if (VERBOSE) rows.push(out.replace(/^\s*$/gm, '').replace(/^/gm, '        | '));
    else {
      const tail = out.trim().split('\n').filter((l) => /✗|FAIL|Error|throw/.test(l)).slice(0, 6);
      if (tail.length) rows.push('        ↳ ' + tail.join('\n        ↳ '));
    }
  } else { okN++; rows.push('ok   ' + f.padEnd(40) + ' ' + concl.trim()); }
});
console.log(rows.join('\n'));
console.log('\n=== 脚本数=' + picked.length + (FILTER.length ? '/' + files.length + '（已过滤）' : '') + ' 通过=' + okN + ' worst=' + worst + '（0=全绿）模式=' + (useSpawn ? 'spawn' : 'in-process') + ' ===');
process.exit(worst);
