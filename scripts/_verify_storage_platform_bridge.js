'use strict';
// _verify_storage_platform_bridge.js — V9.63 存档层回拢 NDX.Platform 门禁
// 断言：源码零裸 localStorage（除 _store() 单一 fallback 一处） + 沙箱注入 mock 后端可读写 + 契约不漂移
// 沙箱模式：镜像 scripts/_verify_boss_skills.js — 用 global.NDX/window/localStorage + require 装载
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const STORAGE_PATH = path.join(ROOT, 'js', 'storage.js');

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  [' + extra + ']' : '')); }
}

// 独立装载一次 storage.js（每次清 require.cache + 重装全局），返回 { NDX, win, mockStorage, lsTrap }
function loadStorageWith({ withPlatform, seedMock, seedLS }) {
  const mockData = Object.assign({}, seedMock || {});
  const mockStorage = {
    _hits: 0,
    getItem(k) { this._hits++; return Object.prototype.hasOwnProperty.call(mockData, k) ? mockData[k] : null; },
    setItem(k, v) { this._hits++; mockData[k] = String(v); },
    removeItem(k) { this._hits++; delete mockData[k]; },
    remove(k) { return this.removeItem(k); },
    clear() { this._hits++; for (const k in mockData) delete mockData[k]; },
    get length() { this._hits++; return Object.keys(mockData).length; },
    key(i) { this._hits++; return Object.keys(mockData)[i] || null; },
    get(k, fb) { const v = this.getItem(k); return v === null ? (fb !== undefined ? fb : null) : v; },
    set(k, v) { return this.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); },
    _data: mockData,
  };
  const lsData = Object.assign({}, seedLS || {});
  let lsHits = 0;
  const lsTrap = {
    getItem(k) { lsHits++; return Object.prototype.hasOwnProperty.call(lsData, k) ? lsData[k] : null; },
    setItem(k, v) { lsHits++; lsData[k] = String(v); },
    removeItem(k) { lsHits++; delete lsData[k]; },
    clear() { lsHits++; for (const k in lsData) delete lsData[k]; },
    get length() { lsHits++; return Object.keys(lsData).length; },
    key(i) { lsHits++; return Object.keys(lsData)[i] || null; },
    _data: lsData,
    _hits: () => lsHits,
  };

  const win = {};
  if (withPlatform) {
    win.NDX = { Platform: { name: 'mock', storage: mockStorage } };
  } else {
    win.NDX = {};
  }
  // 沙箱三件套：window / localStorage / NDX
  global.window = win;
  global.localStorage = lsTrap;
  global.NDX = win.NDX;
  try {
    // 2026-09-26 兼容 _run_all_gates in-process vm 沙箱：其 require 无 .resolve，
    // 缓存清理降级为尽力而为（清理失败只影响重复装载，不影响断言本身）。
    try { delete require.cache[require.resolve(STORAGE_PATH)]; } catch (e) { /* vm 沙箱无 require.resolve */ }
    require(STORAGE_PATH);
  } finally {
    // 装载完就恢复，避免污染同批次其他 require（本文件里 storage.js 是唯一装载点，可留驻）
  }
  return { NDX: win.NDX, win, mockStorage, lsTrap };
}

// ---------- 1. 源码裸扫（防漂移） ----------
console.log('— 源码裸扫 —');
const src = fs.readFileSync(STORAGE_PATH, 'utf8');
// 匹配：localStorage.getItem/setItem/removeItem/clear/length/key(
const rawHits = [...src.matchAll(/localStorage\s*\.\s*(getItem|setItem|removeItem|clear|length|key\b)/g)];
// 允许在 _store() 的 fallback 分支内出现；用行了标记 __PLATFORM_FALLBACK__
const nonFallbackHits = rawHits.filter((m) => {
  const lineStart = src.lastIndexOf('\n', m.index) + 1;
  const lineEnd = src.indexOf('\n', m.index);
  const line = src.slice(lineStart, lineEnd < 0 ? src.length : lineEnd);
  return !/__PLATFORM_FALLBACK__/.test(line);
});
ok('js/storage.js 除 fallback 外零裸 localStorage 调用',
   nonFallbackHits.length === 0,
   '裸调用 ' + nonFallbackHits.length + ' 处：' + nonFallbackHits.map((m) => m[0]).join(', '));
ok('js/storage.js 存在 _store() helper 或等价抽象',
   /function\s+_store\b|const\s+_store\s*=|var\s+_store\s*=/.test(src));

// ---------- 2. 沙箱注入 mock Platform.storage ----------
console.log('— 沙箱注入 —');
const ctx = loadStorageWith({ withPlatform: true });
const NDX = ctx.NDX;

ok('NDX.storage 装载成功', !!NDX && !!NDX.storage);
ok('NDX.storage.KEYS 保留（契约不漂移）',
   !!NDX.storage && !!NDX.storage.KEYS && NDX.storage.KEYS.RUN === 'xy_run_autosave_v1');
ok('NDX.storage.VERSION 是数字', typeof NDX.storage.VERSION === 'number');
ok('getVersion() === VERSION', NDX.storage.getVersion() === NDX.storage.VERSION);

// save → load round-trip
const TEST_KEY = 'xy_bridge_probe_v1';
ctx.mockStorage._hits = 0;
// 重置 lsTrap 计数：重新构造不方便，用一个新会话；这里直接检查 save 后 lsTrap._data 是否被写入
NDX.storage.save(TEST_KEY, { hello: 'world', n: 42 });
ok('save() 走 Platform 后端（mock 有数据）',
   typeof ctx.mockStorage._data[TEST_KEY] === 'string' &&
   /"hello":"world"/.test(ctx.mockStorage._data[TEST_KEY]),
   'mock=' + ctx.mockStorage._data[TEST_KEY]);
ok('save() 未污染 localStorage（陷阱数据为空）',
   Object.keys(ctx.lsTrap._data).length === 0,
   'ls 键：' + Object.keys(ctx.lsTrap._data).join(','));
const back = NDX.storage.load(TEST_KEY);
ok('load() 从 Platform 后端读回', !!back && back.hello === 'world' && back.n === 42);
ok('load() 自动注入 _version', !!back && typeof back._version === 'number');

// remove
NDX.storage.remove(TEST_KEY);
ok('remove() 从 Platform 后端删除', !(TEST_KEY in ctx.mockStorage._data));

// clearAll 走 Platform 迭代（塞入两个前缀匹配键 + 一个无关键）
ctx.mockStorage._data['xynj_test_a'] = '1';
ctx.mockStorage._data['ndx_test_b'] = '2';
ctx.mockStorage._data['unrelated_key'] = 'keep';
NDX.storage.clearAll();
ok('clearAll() 按前缀清除 Platform 后端',
   !('xynj_test_a' in ctx.mockStorage._data) && !('ndx_test_b' in ctx.mockStorage._data),
   '残留：' + Object.keys(ctx.mockStorage._data).join(','));
ok('clearAll() 不动无关键', ctx.mockStorage._data['unrelated_key'] === 'keep');
ok('clearAll() 未污染 localStorage',
   Object.keys(ctx.lsTrap._data).length === 0,
   'ls 键：' + Object.keys(ctx.lsTrap._data).join(','));

// migrateAll 不炸（内部遍历 STORE 表）
let migOk = true, migErr = '';
try { NDX.storage.migrateAll(); } catch (e) { migOk = false; migErr = String(e && e.message || e); }
ok('migrateAll() 走 Platform 不抛异常', migOk, migErr);

// ---------- 3. Platform 缺席时的降级 ----------
console.log('— 降级路径 —');
const ctx2 = loadStorageWith({ withPlatform: false });
const NDX2 = ctx2.NDX;
NDX2.storage.save('xy_fb_test', { x: 1 });
ok('Platform 缺席时 fallback 到 localStorage 且不崩',
   typeof ctx2.lsTrap._data['xy_fb_test'] === 'string',
   'ls 键：' + Object.keys(ctx2.lsTrap._data).join(','));

console.log('\n=== _verify_storage_platform_bridge: ' + pass + ' 通过 / ' + fail + ' 失败 ===');
process.exit(fail ? 1 : 0);
