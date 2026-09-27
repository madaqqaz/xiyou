// _dump_balance_db.js — 导出全系统数值数据库 JSON 快照（生成物：data/balance_db.json，只读不手改）
// 用法：node scripts/_dump_balance_db.js
// 重建流程：改 owner 数值 → 重跑本脚本 → 库更新（宪法 §五：生成物由脚本重建，不手改）
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'balance_db.json');

const _noop = () => {};
const _store = {};
function makeCtx() {
  const _Math = Object.create(Math);
  _Math.random = () => 0.5;
  const sb = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, Date, JSON, Math: _Math,
    navigator: { userAgent: 'node' },
    localStorage: { getItem: (k) => (k in _store ? _store[k] : null), setItem: (k, v) => { _store[k] = String(v); }, removeItem: (k) => { delete _store[k]; } },
    document: {
      getElementById: () => null,
      createElement: () => ({ style: {}, setAttribute: _noop, appendChild: _noop, addEventListener: _noop, classList: { add: _noop, remove: _noop }, querySelector: () => null, remove: _noop }),
      querySelector: () => null, querySelectorAll: () => [], addEventListener: _noop, body: { appendChild: _noop }, head: { appendChild: _noop }, documentElement: { style: {} },
    },
    requestAnimationFrame: (cb) => setTimeout(cb, 0), addEventListener: _noop, removeEventListener: _noop,
  };
  sb.window = sb; sb.global = sb; sb.self = sb;
  return sb;
}
function loadGame() {
  const sb = makeCtx();
  const ctx = vm.createContext(sb);
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const files = [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].map((m) => m[1]);
  files.forEach((f) => {
    if (/^https?:/.test(f)) return;
    const fp = path.join(ROOT, f.split('?')[0]);
    if (!fs.existsSync(fp)) return;
    try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: f }); } catch (e) { console.log(`[load-fail] ${f}: ${e.message}`); }
  });
  return sb.NDX;
}

const NDX = loadGame();
if (!NDX || !NDX.BalanceDB) { console.error('BalanceDB 装载失败'); process.exit(1); }

const dump = NDX.BalanceDB.dump();
const json = JSON.stringify(dump, null, 2);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, json, 'utf8');

console.log('全系统数值数据库已导出：' + OUT);
console.log('版本：' + dump.meta.version + ' · 条目数：');
const sysNames = {
  hero: '英雄基础', equipment: '装备', pet: '宠物', sutra: '经文', sutra_rule: '经文规则',
  seal: '劫印', zhuanjie: '转职/隐藏职', ultimate: '大招', monster: '怪物', boss: 'Boss', achievement: '成就/meta',
};
for (const k of NDX.BalanceDB.systems()) {
  console.log('  ' + k.padEnd(12) + String(dump.meta.counts[k]).padStart(5) + '  ' + (sysNames[k] || ''));
}
