// _audit_equip_numbers.js — B3 装备数值复核 + 掉落概率复核（只读报告，不进门禁）
// 用法: node scripts/_audit_equip_numbers.js
// 方法论: game-numeric-design（五特性模型 · 生成/成长/消亡/变化/联系）
// 产出: 控制台报告。改数值前先由用户终审本报告。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

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
      querySelector: () => null, querySelectorAll: () => [], addEventListener: _noop, body: { appendChild: _noop }, documentElement: { style: {} },
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
    try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: f }); } catch (e) { /* 静默：只取数据层 */ }
  });
  return sb.NDX;
}

const NDX = loadGame();
if (!NDX || !NDX.EQUIP_POOL) { console.error('NDX 装载失败'); process.exit(1); }

const P = (s) => console.log(s);
const r1 = (v) => Math.round(v * 10) / 10;

// ---------- 全量注册表（与 equipById 同口径） ----------
const bossFlat = Object.values(NDX.BOSS_REWARDS || {}).reduce((a, b) => a.concat(Array.isArray(b) ? b : [b]), []);
const registry = new Map();
(NDX.EQUIP_POOL || []).concat(bossFlat).concat(NDX.CRAFT_POOL || []).forEach((e) => { if (e && e.id && !registry.has(e.id)) registry.set(e.id, e); });
P(`== B3 装备数值复核 · 全量注册表 ${registry.size} 件（EQUIP_POOL ${(NDX.EQUIP_POOL||[]).length} + BOSS_REWARDS ${bossFlat.length} + CRAFT_POOL ${(NDX.CRAFT_POOL||[]).length}）==\n`);

// ---------- ① 成长曲线：章 × 槽 统计 ----------
P('① 章节成长曲线（每章每槽：件数 / 平均攻 / 平均愿伤 / 平均血 / 平均dr）');
const SLOTS = ['weapon', 'armor', 'head', 'boots', 'treasure', 'pet', 'special'];
const chapters = [...new Set([...registry.values()].map((e) => e.chapter || 1))].sort((a, b) => a - b);
const stat = {};
registry.forEach((e) => {
  const ch = e.chapter || 1, sl = e.slot || '?';
  // ch10-12 是法宝内部标注（至宝套路分组），非第 10~12 地区，统计时并入 treasure 说明
  const k = ch + '|' + sl;
  stat[k] = stat[k] || { n: 0, atk: 0, matk: 0, hp: 0, dr: 0, eva: 0, mdef: 0, cri: 0, maxAtk: 0, maxHp: 0 };
  const t = stat[k];
  t.n++; t.atk += e.atk || 0; t.matk += e.matk || 0; t.hp += e.hp || 0; t.dr += (e.dr || 0);
  t.eva += e.eva || 0; t.mdef += e.mdef || 0; t.cri += e.cri || 0;
  t.maxAtk = Math.max(t.maxAtk, e.atk || 0); t.maxHp = Math.max(t.maxHp, e.hp || 0);
});
P('章\\槽\t' + SLOTS.join('\t'));
chapters.forEach((ch) => {
  const row = SLOTS.map((sl) => {
    const t = stat[ch + '|' + sl];
    if (!t) return '—';
    const ev = t.eva / t.n, md = t.mdef / t.n, cr = t.cri / t.n;
    const ex = [ev ? `闪${(ev * 100).toFixed(0)}%` : '', md ? `御念${(md * 100).toFixed(0)}%` : '', cr ? `暴${(cr * 100).toFixed(0)}%` : ''].filter(Boolean).join('/');
    return `${t.n}件/${r1(t.atk / t.n)}攻/${r1(t.hp / t.n)}血/${(r1(t.dr / t.n) * 100).toFixed(0)}%dr${ex ? ' ' + ex : ''}`;
  });
  P(`ch${ch}\t` + row.join('\t'));
});
P('');

// 综合强度指数（技能权重: 攻10/愿伤10/血1/dr千分） 每槽章节中位曲线单调性
const SLOT_W = { weapon: 1, armor: 1, head: 1, boots: 1, treasure: 1, pet: 1, special: 1 };
// 权重：攻10/愿伤10/血1/dr%×1000/闪%×1000/御念%×600/暴%×400（对齐 skill 价值换算量级）
const powOf = (t) => (t.atk / t.n) * 10 + (t.matk / t.n) * 10 + t.hp / t.n + (t.dr / t.n) * 1000 + (t.eva / t.n) * 1000 + (t.mdef / t.n) * 600 + (t.cri / t.n) * 400;
P('② 综合强度指数均值（攻10/愿10/血1/dr千/闪千/御念600/暴400）——检查跨章单调性');
P('章\\槽\t' + SLOTS.join('\t'));
const flag = [];
chapters.forEach((ch) => {
  const row = SLOTS.map((sl) => (stat[ch + '|' + sl] ? String(Math.round(powOf(stat[ch + '|' + sl]))) : '—'));
  P(`ch${ch}\t` + row.join('\t'));
});
// 单调性：逐槽检查相邻章均值是否回落
SLOTS.forEach((sl) => {
  let prev = -1;
  chapters.forEach((ch) => {
    const t = stat[ch + '|' + sl];
    if (!t) return;
    const p = powOf(t);
    if (prev >= 0 && p < prev * 0.92) flag.push(`  ⚠ ch${ch} ${sl} 均值较前章回落 ${Math.round((1 - p / prev) * 100)}%`);
    prev = Math.max(prev, p);
  });
});
P(flag.length ? '单调性异常：\n' + flag.join('\n') : '单调性：✅ 各槽跨章无 >8% 回落');
P('');

// ---------- ③ 掉落概率复核 ----------
P('③ 掉落链概率复核（game_loot + rollAdvDrops + rollEquips）');
const lowIds = NDX.LOW_EQUIP_DROPS || [], eliteIds = NDX.ELITE_EQUIP_DROPS || [], bossIds = NDX.BOSS_EQUIP_DROPS || [];
P(`游历散宝表：low ${lowIds.length} / elite ${eliteIds.length} / boss ${bossIds.length} 件，均【等权随机】且【全章共用同一张表】`);
const showDrop = (tag, ids) => {
  P(`  [${tag}]`);
  ids.forEach((id) => {
    const e = registry.get(id) || (NDX.lootById ? NDX.lootById(id) : null);
    if (!e) { P(`    ${id} — ⚠ 查无此物`); return; }
    P(`    ${e.name}(${id}) ch${e.chapter || 1} ${e.slot || '?'} 攻${e.atk || 0} 愿${e.matk || 0} 血${e.hp || 0} dr${Math.round((e.dr || 0) * 100)}% ${e.set ? '套:' + e.set : ''}${e.eventOnly ? ' 【事件专属】' : ''}`);
  });
};
showDrop('low 小怪表 45%+保底', lowIds);
showDrop('elite 精英必掉', eliteIds);
showDrop('boss 必掉', bossIds);
P('');

// 期望收入核算：每章 16 战（3+7+4+1+2+2 节点口径 → 3+7+4 mob? 以 3mob+4elite+2boss 计战）
// 口径注释：按工作区记忆「每章≈19 节点、16 战」——其中 mob 战与 trial 内战难分，此处按 mob 9/elite 4/boss 2 做上界估计
const MOB_FIGHTS = 9, ELITE_FIGHTS = 4, BOSS_FIGHTS = 2;
// 小怪 low 掉落期望：0.45,0.45,1.0 循环（保底 streak>=2 必掉）→ 每战期望 0.6333
const lowPerFight = (0.45 + 0.45 + 1) / 3;
P(`期望收入/章（上界口径 mob${MOB_FIGHTS}+elite${ELITE_FIGHTS}+boss${BOSS_FIGHTS}=${MOB_FIGHTS + ELITE_FIGHTS + BOSS_FIGHTS} 战）：`);
P(`  游历散宝: mob ${MOB_FIGHTS}×${r1(lowPerFight)}=${r1(MOB_FIGHTS * lowPerFight)} + elite ${ELITE_FIGHTS}×1 + boss ${BOSS_FIGHTS}×1 = ${r1(MOB_FIGHTS * lowPerFight + ELITE_FIGHTS + BOSS_FIGHTS)} 件`);
P(`  基础套装(_mobBasicLoot 25%×mob): ${r1(MOB_FIGHTS * 0.25)} 件（3 基座 id，已拥有/已替代则转材料）`);
P(`  rollEquips 随机(_randomLoot 25% 触发点数另计): 软保底 ${NDX.EQUIP_PITY_THRESHOLD} 次必出套装基座/成品，同道权重 ×${NDX.DAO_EQUIP_W}`);
P('');

// ---------- ④ 品质倍率 & quality 分布 ----------
P('④ quality 分布（0凡/1灵/2宝 ×1.0/1.3/1.6）');
const q = { 0: 0, 1: 0, 2: 0, undef: 0 };
registry.forEach((e) => { if (e.quality == null) q.undef++; else q[e.quality] = (q[e.quality] || 0) + 1; });
P(`  无quality: ${q.undef} ｜ 凡: ${q[0] || 0} ｜ 灵: ${q[1] || 0} ｜ 宝: ${q[2] || 0}`);
P('');

// ---------- ⑤ 成长封顶复核（六道成长轴 vs 全面板占比） ----------
P('⑤ 六道成长封顶 vs 满装备面板（数据源 EQUIP_GROWTH）');
const G = NDX.EQUIP_GROWTH || {};
Object.keys(G).forEach((k) => {
  const s = G[k];
  P(`  ${k}(${s.label}): per ${s.per}/${NDX.EQUIP_GROWTH_PER_HITS}打, 熔铸 ${s.forge}, cap ${s.cap}${s.unit || ''}`);
});
P('\n== 报告完（只读，未改任何数值）==');
