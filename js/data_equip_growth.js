// =============================================================
// data_equip_growth.js — 《逆道西行》六道装备成长 · 真源（V9.30）
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
//
// 设计要旨（用户拍板 · 按路线建 BD）：
//   六道的隐藏装备（带 dao 字段者，约 82 件）带**成长属性**，三源喂养：
//     ① 挨打计数：每挨打 10 次 → +per（战斗中自动累加，越打越强）
//     ② 土地庙熔铸：包裹永久 +forge（主动投入）
//     ③ 属性随道向不同（六道各一条成长轴）
//   六道成长轴：
//     缘 = 固防   （加防固定值 fixDr，金身不坏；八戒本命）
//     战 = 攻击   （棍棒加身）
//     夺 = 气血   （吞噬增厚）
//     渡 = 法伤   （经力灌顶）
//     隐 = 闪避   （身法渐疾）
//     逆 = 反伤   （仇恨凝锋）
//   注：用户 2026-09-23 拍板——缘道成长轴采用「加防固定值」(fixDr 平砍减伤)，
//       与百分比减伤(dr)分离：固防压平砍、dr 压百分比，两条减伤线各司其职。
//
// 存档字段：s.equipGrowth = { [equipId]: { hits: n, forge: m } }
//   向后兼容：字段缺失一律按 0 处理，老存档零迁移。
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// —— 六道成长规格 ——
//   field：注入装备对象的字段名（与 combat_part1.js computeStats 的装备聚合口径对齐）
//   per  ：每 PER_HITS 次挨打的增量；forge：每次土地庙熔铸的增量；cap：成长封顶
NDX.EQUIP_GROWTH = {
  缘: { label: '固防', field: 'fixDr',  per: 2,     forge: 1,     cap: 40,   unit: '',   desc: '挨打十次固防 +2；熔铸固防 +1' },
  战: { label: '攻击', field: 'fixAtk',  per: 2,     forge: 1,     cap: 60,   unit: '',   desc: '挨打十次攻击 +2；熔铸攻击 +1' },
  夺: { label: '气血', field: 'hp',      per: 30,    forge: 15,    cap: 900,  unit: '',   desc: '挨打十次气血 +30；熔铸气血 +15' },
  渡: { label: '法伤', field: 'fixMatk', per: 2,     forge: 1,     cap: 60,   unit: '',   desc: '挨打十次法伤 +2；熔铸法伤 +1' },
  隐: { label: '闪避', field: 'eva',     per: 0.02,  forge: 0.01,  cap: 0.30, unit: '%',  desc: '挨打十次闪避 +2%；熔铸闪避 +1%' },
  逆: { label: '反伤', field: 'reflect', per: 0.01,  forge: 0.005, cap: 0.25, unit: '%',  desc: '挨打十次反伤 +1%；熔铸反伤 +0.5%' },
};
NDX.EQUIP_GROWTH_PER_HITS = 10;

// 取某装备的成长规格（无 dao / 非六道 → null）
NDX.equipGrowthSpecOf = function (equip) {
  if (!equip || !equip.dao) return null;
  return NDX.EQUIP_GROWTH[equip.dao] || null;
};

// 取某装备当前成长加成（{dr:0.04}），无则 null
NDX.equipGrowthBonus = function (s, equip) {
  const spec = NDX.equipGrowthSpecOf(equip);
  if (!spec || !s || !equip.id) return null;
  const rec = (s.equipGrowth || {})[equip.id];
  if (!rec) return null;
  const hits = Math.max(0, rec.hits | 0), forge = Math.max(0, rec.forge | 0);
  if (!hits && !forge) return null;
  const steps = Math.floor(hits / NDX.EQUIP_GROWTH_PER_HITS);
  let v = steps * spec.per + forge * spec.forge;
  if (spec.cap != null) v = Math.min(spec.cap, v);
  if (v <= 0) return null;
  const out = {};
  out[spec.field] = spec.field === 'reflect' ? Math.round(v * 1000) / 1000 : v;
  return out;
};

// 把成长并入装备列表（返回**浅拷贝**数组，不改原装备对象；供 computeStats 消费）
// ⚠ 加法而非覆盖：fixDr/hp/fixAtk 等装备可能已有基础值，成长须叠加（V9.31 修复）
NDX.applyEquipGrowth = function (s, equips) {
  const list = equips || (s && s.equips) || [];
  if (!s || !Array.isArray(list)) return list || [];
  return list.map(function (e) {
    const g = NDX.equipGrowthBonus(s, e);
    if (!g) return e;
    const out = Object.assign({}, e);
    for (const k in g) {
      if (!Object.prototype.hasOwnProperty.call(g, k)) continue;
      const base = (typeof out[k] === 'number') ? out[k] : 0;
      out[k] = base + (Number(g[k]) || 0);
    }
    return out;
  });
};

// —— 战后累加挨打次数 ——
//   hits = 本场「怪物命中玩家」的回合数（由 game_combat_1 从 roundsDetail 统计）
//   返回本次新成长的装备件数（用于播报「装备共鸣·成长」）
NDX.bumpEquipGrowthHits = function (s, hits) {
  const n = Math.max(0, hits | 0);
  if (!s || n <= 0) return 0;
  s.equipGrowth = s.equipGrowth || {};
  let grown = 0;
  (s.equips || []).forEach(function (e) {
    if (!NDX.equipGrowthSpecOf(e) || !e.id) return;
    const rec = s.equipGrowth[e.id] || (s.equipGrowth[e.id] = { hits: 0, forge: 0 });
    const before = Math.floor((rec.hits | 0) / NDX.EQUIP_GROWTH_PER_HITS);
    rec.hits = (rec.hits | 0) + n;
    const after = Math.floor(rec.hits / NDX.EQUIP_GROWTH_PER_HITS);
    if (after > before) grown++;
  });
  return grown;
};

// —— 土地庙熔铸：包裹永久 +forge ——
NDX.forgeEquipGrowth = function (s, equipId) {
  if (!s || !equipId) return null;
  const e = (s.equips || []).find(function (x) { return x && x.id === equipId; });
  const spec = NDX.equipGrowthSpecOf(e);
  if (!spec) return null;
  s.equipGrowth = s.equipGrowth || {};
  const rec = s.equipGrowth[equipId] || (s.equipGrowth[equipId] = { hits: 0, forge: 0 });
  rec.forge = (rec.forge | 0) + 1;
  return { id: equipId, name: e.name, forge: rec.forge, spec: spec };
};

// 可熔铸装备清单（供土地庙 UI 列出）
NDX.forgeableEquips = function (s) {
  return ((s && s.equips) || []).filter(function (e) { return !!NDX.equipGrowthSpecOf(e); });
};

// 成长进度文本（UI 用）：如「减伤 +4% ｜ 挨打 12/20 次 +2%」
NDX.equipGrowthText = function (s, equip) {
  const spec = NDX.equipGrowthSpecOf(equip);
  if (!spec) return null;
  const rec = ((s && s.equipGrowth) || {})[equip.id] || { hits: 0, forge: 0 };
  const hits = rec.hits | 0, forge = rec.forge | 0;
  const steps = Math.floor(hits / NDX.EQUIP_GROWTH_PER_HITS);
  const got = NDX.equipGrowthBonus(s, equip) || {};
  const cur = got[spec.field] || 0;
  const pct = (spec.unit === '%') ? (cur * 100).toFixed(1) + '%' : String(cur);
  const next = (hits % NDX.EQUIP_GROWTH_PER_HITS);
  return spec.label + ' +' + pct + ' ｜ 挨打 ' + next + '/' + NDX.EQUIP_GROWTH_PER_HITS + ' → +' +
    ((spec.unit === '%') ? (spec.per * 100).toFixed(1) + '%' : spec.per) +
    '（已熔铸 ' + forge + ' 次）';
};
