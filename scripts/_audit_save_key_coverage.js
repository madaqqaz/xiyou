// _audit_save_key_coverage.js — S15 §⑤-3/#1：持久化 key **注册表覆盖守卫**（2026-09-28）
// ---------------------------------------------------------------------------
// 背景（S15 §1.7-3/4）：`js/storage.js` 的 `STORE` 是**唯一 key 注册表**，但历史上
//   有键绕过它直接内联写字面量（如 `xynj_stupa` / `xynj_vault_v1` / `ndx_dynasty_idx`），
//   后果有二：
//     ① `clearAll()` 在弱后端（`_storeKeys()` 返空）时只清注册表 ⇒ 未注册键**遗留成脏数据**；
//     ② 同功能键名**两侧分叉**（`SETTINGS:'ndx_settings'` vs 裸 `'xynj_settings_on'` 之类），
//        谁也不知道哪个才是真源。
//   本门禁把「所有 setItem 字面量键必须已注册」钉死，并断言注册表值**无重复**（防同名分叉）。
//
// ⚠ 判据诚实性（X4 教训）：本文件的 C1 必须能**真的红** —— 故 C3 反证注入一个未注册键
//   走同一判定函数，若它不红说明判定恒真、本门禁无效。
'use strict';
const fs = require('fs');
const path = require('path');

let fail = 0;
const ck = (name, cond, extra) => {
  if (cond) console.log('ok   ' + name);
  else { console.log('FAIL ' + name + (extra ? '  → ' + extra : '')); fail++; }
};

const ROOT = path.join(__dirname, '..');

// —— 载入 storage.js 取注册表（stub 掉浏览器宿主）——
const _ls = {};
Object.defineProperty(global, 'window', { value: global, writable: true, configurable: true });
global.location = { href: 'http://client', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, writable: true, configurable: true });
global.localStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(_ls, k) ? _ls[k] : null),
  setItem: (k, v) => { _ls[k] = String(v); },
  removeItem: (k) => { delete _ls[k]; },
  clear: () => { Object.keys(_ls).forEach((k) => delete _ls[k]); },
  key: () => null,
  get length() { return Object.keys(_ls).length; },
};
try { require(path.join(ROOT, 'js', 'storage.js')); } catch (e) { /* 宿主差异容忍 */ }
const NDX = global.NDX || {};

// 注册表取值：优先显式导出的 KEYS，否则退回 NDX.storage 顶层字符串值
const _S = NDX.storage || {};
const REG = (_S.KEYS && typeof _S.KEYS === 'object') ? _S.KEYS : _S;
const regVals = new Set(Object.values(REG).filter((v) => typeof v === 'string' && v.length > 0));

console.log('=== _audit_save_key_coverage：持久化 key 注册表覆盖守卫 ===');
console.log('（注册表条目 ' + regVals.size + ' 个，真源 js/storage.js 的 STORE）');

// —— 扫描全仓 setItem 字面量键 ——
const walk = (d) => {
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory()
    ? walk(path.join(d, e.name))
    : (e.name.endsWith('.js') ? [path.join(d, e.name)] : [])));
};
const files = walk(path.join(ROOT, 'js')).concat(walk(path.join(ROOT, 'platform')));
const SET_RE = /setItem\s*\(\s*['"]([^'"]+)['"]/g;
const hits = {};                                  // key → [file]
files.forEach((f) => {
  const t = fs.readFileSync(f, 'utf8');
  let m;
  SET_RE.lastIndex = 0;
  while ((m = SET_RE.exec(t)) !== null) {
    (hits[m[1]] = hits[m[1]] || []).push(path.relative(ROOT, f).replace(/\\/g, '/'));
  }
});
const literalKeys = Object.keys(hits);

// —— C1 覆盖：所有 setItem 字面量键必须已注册 ——
const unreg = literalKeys.filter((k) => !regVals.has(k));
ck('C1 全仓 ' + literalKeys.length + ' 个 setItem 字面量键**全部**已在 STORE 注册表登记',
  unreg.length === 0,
  '未注册 ' + unreg.length + ' 个：' + unreg.map((k) => k + '(' + [...new Set(hits[k])].join(',') + ')').join(' | '));

// —— C2 无重名分叉：注册表内值必须唯一（一个 key 只能有一个名字）——
const valCount = {};
Object.entries(REG).forEach(([name, v]) => {
  if (typeof v !== 'string') return;
  (valCount[v] = valCount[v] || []).push(name);
});
const dupVals = Object.entries(valCount).filter(([, names]) => names.length > 1);
ck('C2 注册表值唯一（无「同一物理键两个名字」的分叉）', dupVals.length === 0,
  dupVals.map(([v, n]) => v + '←' + n.join('/')).join(' | '));

// —— C3 反证：人为注入一个未注册键 ⇒ C1 的判定必须转红（证明 C1 非恒真）——
const _isUnreg = (k) => !regVals.has(k);
ck('C3 反证：注入未注册合成键 `xynj__synthetic_probe_v9` ⇒ 判定能红（C1 非恒真）',
  _isUnreg('xynj__synthetic_probe_v9') === true);

// —— C4 反向护栏：注册表**不得为空**（防 storage.js 改动后本门禁静默变恒真）——
ck('C4 反证：注册表非空且条目数 ≥ 20（防测试自身失效导致 C1 恒真）', regVals.size >= 20,
  '实测 ' + regVals.size);

// ============ D 组 · S15 §⑤-2/#4：SAVE_KEYS（SaveSystem 侧表）归一守护 ============
//   实证（2026-09-28）：`SAVE_KEYS` 全仓 8 处引用**全在 save_system.js 内部**（零外部消费者），
//   且 `xynj_save` / `xynj_stupa` / `xynj_rank` / `xynj_dynasty` **外部写方 = 0**（纸面键）；
//   `SETTINGS:'xynj_settings'` / `DIFFICULTY:'xynj_difficulty'` 与注册表的
//   `'ndx_settings'` / `'ndx_difficulty'` **同功能不同物理名**（双真源分叉）。
//   本组把两类"例外"显式白名单化 ⇒ 既不改运行行为，也不让例外无声扩散。
const _ssSrc = fs.readFileSync(path.join(ROOT, 'js', 'save_system.js'), 'utf8');
const _blk = _ssSrc.match(/const\s+SAVE_KEYS\s*=\s*\{([\s\S]*?)\n\s*\};/);
const _savKeys = {};
if (_blk) {
  const RE = /([A-Z_]+)\s*:\s*'([^']+)'/g;
  let m; RE.lastIndex = 0;
  while ((m = RE.exec(_blk[1])) !== null) _savKeys[m[1]] = m[2];
}
// 纸面键白名单：**外部写方实测 = 0**（仅本表登记，无人写入 ⇒ 清/导出时命中空键，无副作用）。
//   值 = 「登记原因」，任一键退出白名单即须重新取证。
const PAPER_KEYS = {
  xynj_save: '主存档纸面键：全仓外部写方 = 0（实证 grep）',
  xynj_stupa: '舍利塔纸面键：外部写方 = 0',
  xynj_rank: '排行榜纸面键：外部写方 = 0（真实排行榜走 ndx_leaderboard）',
  xynj_dynasty: '朝代纸面键：外部写方 = 0（真源是注册表 DYNASTY_IDX=ndx_dynasty_idx）',
  xynj_unlock: '英雄解锁纸面键：外部写方 = 0（真实真源 ndx_hero_unlock）',
  // ⚠ 取证诚实性：`grep xynj_clear` 有 1 处命中，但那是 `storage.js:65` 的 `CLEARS: 'xynj_clears'`
  //   的子串误命中（`xynj_clear` 是 `xynj_clears` 的前缀）⇒ 本键真实外部写方仍为 0。
  xynj_clear: '通关记录纸面键：外部写方 = 0（唯一 grep 命中为 xynj_clears 的子串误命中）',
  xynj_intro: '新手引导纸面键：外部写方 = 0（真源 xynj_onboard_done）',
  xynj_sutra_frags: '经文碎片纸面键：外部写方 = 0',
  xynj_settings: '设置纸面键：外部写方 = 0（真源注册表 SETTINGS=ndx_settings）',
};
// 分叉白名单：`名字 → **被允许的 SAVE_KEYS 侧物理值**`。
//   ⚠ 设计要点（首版踩坑）：早期写成 `名字 → 注册表侧值`，判据变成「名字在表内就豁免」
//     ⇒ 同名但值又变一次也照样放过，判据**恒假**（D3 反证当场抓红）。现按**值**白名单。
const FORKED_KEYS = {
  SETTINGS: 'xynj_settings',      // 允许与注册表 ndx_settings 并存的 SAVE_KEYS 侧值
  DIFFICULTY: 'xynj_difficulty',  // 允许与注册表 ndx_difficulty 并存的 SAVE_KEYS 侧值
};
const _skNames = Object.keys(_savKeys);
ck('D1 SAVE_KEYS 表可解析且非空（防正则失配导致本组恒真）', _skNames.length >= 8,
  '解析到 ' + _skNames.length + ' 条');

const _d1bad = _skNames.filter((n) => {
  const v = _savKeys[n];
  return !regVals.has(v) && !PAPER_KEYS[v] && Object.values(FORKED_KEYS).indexOf(v) < 0;
});
ck('D1b SAVE_KEYS 每个值都「已注册 ∨ 纸面键白名单 ∨ 分叉白名单」（新键须三选一登记）',
  _d1bad.length === 0,
  _d1bad.map((n) => n + '=' + _savKeys[n]).join(' | '));

// 判定函数抽出来（D2 用它判真数据、D3 用它判合成样本 ⇒ 反证与生产判据同源）
const _isFork = (name, val) => {
  const reg = REG[name];
  return typeof reg === 'string' && reg !== val && FORKED_KEYS[name] !== val;
};
const _d2bad = _skNames.filter((n) => _isFork(n, _savKeys[n]));
ck('D2 SAVE_KEYS 与注册表**同名项必须同值**（分叉须按**值**显式进 FORKED 白名单）',
  _d2bad.length === 0,
  _d2bad.map((n) => n + '(' + _savKeys[n] + ' ≠ ' + REG[n] + ')').join(' | '));

// 反证：把 SETTINGS 的值再改一次（落到白名单之外的第三个名字）⇒ 同一判定函数必须转红
ck('D3 反证：同名项值再变一次（SETTINGS→xynj_settings_v999，超出白名单值）⇒ D2 判定能红',
  _isFork('SETTINGS', 'xynj_settings_v999') === true);

console.log(fail
  ? '=== _audit_save_key_coverage：' + fail + ' 项失败 ==='
  : '=== _audit_save_key_coverage：' + literalKeys.length + ' 个写入键全部已注册，无重名分叉 ===');
console.log(fail ? 'RESULT: FAIL' : 'RESULT: PASS');
process.exit(fail ? 1 : 0);
