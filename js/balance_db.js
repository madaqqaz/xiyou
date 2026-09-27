// =============================================================
// balance_db.js — 《逆道西行》全系统数值数据库 · 统一查询/审计层（V9.6 新增）
// 设计（宪法 §五 单一真源）：数值真源仍在各 owner 文件；本文件是只读收集层，
//   启动时构建 NDX.BalanceDB，按 系统×章节 索引全部数字字段，
//   供平衡调整查询、采样脚本调取与 JSON 导出（scripts/_dump_balance_db.js）。
// 查询接口：
//   BalanceDB.systems()                    → 系统键列表
//   BalanceDB.list(system)                 → 规范化条目数组
//   BalanceDB.get(system, id)              → 单条目（无 system 时按 id 全局查）
//   BalanceDB.stats(system, field)         → 数值聚合（count/min/max/avg/按章）
//   BalanceDB.dump()                       → 全量 JSON 对象（供导出/调取）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

(function () {
  'use strict';

  function flattenNums(obj, prefix, out, skip) {
    if (!obj || typeof obj !== 'object') return;
    for (const k in obj) {
      if (skip[k]) continue;
      const v = obj[k];
      if (typeof v === 'number') out[prefix + k] = v;
      else if (v && typeof v === 'object') flattenNums(v, prefix + k + '_', out, skip);
    }
  }

  // 注册表条目的字符串性描述字段（不计入 values）
  const SKIP = { id: 1, index: 1 };

  function norm(system, id, rec, liftKeys) {
    const values = {};
    if (rec) {
      if (liftKeys) {
        // 指定子对象（如经文/转职的 attrs）提升为 values 顶层，便于按 atk/hp/dr/atkPct 直接聚合
        liftKeys.forEach((k) => flattenNums(rec[k], '', values, SKIP));
        for (const k in rec) {
          if (SKIP[k] || liftKeys.indexOf(k) >= 0) continue;
          const v = rec[k];
          if (typeof v === 'number') values[k] = v;
          else if (v && typeof v === 'object') flattenNums(v, k + '_', values, SKIP);
        }
      } else {
        flattenNums(rec, '', values, SKIP);
      }
    }
    return {
      system: system,
      id: id,
      name: (rec && rec.name) || id,
      chapter: rec && rec.chapter,
      tier: rec && rec.tier,
      slot: rec && rec.slot,
      dao: rec && rec.dao,
      values: values,
      desc: (rec && rec.desc) || '',
    };
  }

  function arrOf(v) { return Array.isArray(v) ? v : v ? [v] : []; }
  function objEntries(v) { return v && typeof v === 'object' ? Object.entries(v) : []; }

  const DB = {};

  // —— hero：英雄基础属性 + 被动数值（data_heroes_data.js HEROES） ——
  DB.hero = [];
  objEntries(NDX.HEROES).forEach(([id, h]) => DB.hero.push(norm('hero', id, h)));

  // —— equipment：装备池 + 合成池 + Boss 掉落（排除宠物，宠物独立系统） ——
  DB.equipment = [];
  const equipSrc = (NDX.EQUIP_POOL || []).concat(NDX.CRAFT_POOL || [])
    .concat(Object.values(NDX.BOSS_REWARDS || {}).reduce((a, b) => a.concat(arrOf(b)), []));
  equipSrc.forEach((e) => { if (e && e.slot !== 'pet') DB.equipment.push(norm('equipment', e.id, e)); });

  // —— pet：装备池 + 合成池 + Boss 掉落中 slot:'pet' ——
  DB.pet = [];
  equipSrc.forEach((e) => { if (e && e.slot === 'pet') DB.pet.push(norm('pet', e.id, e)); });

  // —— sutra：经文全文（含逆藏）；attrs 子对象提升为顶层键 ——
  DB.sutra = [];
  (NDX.SUTRA_FULLS || []).concat(NDX.NI_SUTRA_FULLS || []).forEach((s) => {
    DB.sutra.push(norm('sutra', s.id, s, ['attrs']));
  });

  // —— sutra_rule：经文体系规则数值（道途加成/计数档/经位修正/命中） ——
  DB.sutra_rule = [];
  objEntries(NDX.SUTRA_DAO_BONUS).forEach(([k, v]) => DB.sutra_rule.push(norm('sutra_rule', 'dao_' + k, v)));
  objEntries(NDX.JING_KIND_MOD).forEach(([k, v]) => DB.sutra_rule.push(norm('sutra_rule', 'kind_' + k, v)));
  objEntries(NDX.JING_DAO_ONHIT).forEach(([k, v]) => DB.sutra_rule.push(norm('sutra_rule', 'onhit_' + k, v)));
  (NDX.SUTRA_COUNT_BREAKPOINTS || []).forEach((b, i) => DB.sutra_rule.push(norm('sutra_rule', 'bp_' + i, b)));

  // —— seal：劫印词条（jieseals.js SEAL_WORDS） ——
  DB.seal = [];
  objEntries(NDX.SEAL_WORDS).forEach(([k, w]) => DB.seal.push(norm('seal', k, w)));

  // —— zhuanjie：六道专职 + 隐藏职（ZHUANJIE.CLASSES，attrs 提升为顶层键） ——
  DB.zhuanjie = [];
  objEntries((NDX.ZHUANJIE || {}).CLASSES).forEach(([k, z]) => {
    const r = norm('zhuanjie', k, z, ['attrs']);
    if (z && z.cls) r.name = z.cls;
    DB.zhuanjie.push(r);
  });

  // —— ultimate：英雄大招（data_ultimates.js ULTIMATES，heroId → 阶数组） ——
  DB.ultimate = [];
  objEntries(NDX.ULTIMATES).forEach(([hero, list]) => {
    arrOf(list).forEach((u) => DB.ultimate.push(norm('ultimate', hero + '_t' + (u.tier || 1), u)));
  });

  // —— monster：普通怪物池 + 类型（enemies_part1.js MONSTER_TABLE/MOB_TYPES） ——
  DB.monster = [];
  (NDX.MONSTER_TABLE || []).concat(NDX.MOB_TYPES || []).forEach((m, i) => {
    DB.monster.push(norm('monster', (m && m.id) || 'm' + i, m));
  });

  // —— boss：Boss 表（enemies_part2.js BOSS_TABLE） ——
  DB.boss = [];
  objEntries(NDX.BOSS_TABLE).forEach(([k, b]) => DB.boss.push(norm('boss', k, b)));

  // —— achievement：成就 + meta 规则（逐条奖励在 ACH_BONUS_PER 全局常量，一并入库） ——
  DB.achievement = [];
  (NDX.ACHIEVEMENTS || []).forEach((a) => DB.achievement.push(norm('achievement', a.id, a)));
  if (NDX.ACH_BONUS_PER) DB.achievement.push(norm('achievement', 'meta_bonus_per', NDX.ACH_BONUS_PER));
  if (NDX.ACH_SOFT_CUT !== undefined) {
    DB.achievement.push(norm('achievement', 'meta_soft_cut', { cut: NDX.ACH_SOFT_CUT, tail: NDX.ACH_SOFT_TAIL }));
  }

  // id → 条目全局索引（get 无 system 时用）
  const ALL = {};
  Object.keys(DB).forEach((sys) => {
    DB[sys].forEach((r) => { (ALL[r.id] = ALL[r.id] || []).push(r); });
  });

  NDX.BalanceDB = {
    systems: function () { return Object.keys(DB); },
    list: function (system) { return (DB[system] || []).slice(); },
    get: function (system, id) {
      if (id === undefined || id === null) return null;
      if (system) {
        const rows = DB[system] || [];
        return rows.find((r) => r.id === id) || null;
      }
      const hit = ALL[id] || [];
      return hit[0] || null;
    },
    stats: function (system, field) {
      const rows = DB[system] || [];
      let count = 0, sum = 0, min = Infinity, max = -Infinity;
      const byChapter = {};
      rows.forEach((r) => {
        const v = r.values[field];
        if (v === undefined) return;
        count++; sum += v;
        if (v < min) min = v;
        if (v > max) max = v;
        const ch = r.chapter || 0;
        const b = (byChapter[ch] = byChapter[ch] || { count: 0, sum: 0, min: Infinity, max: -Infinity });
        b.count++; b.sum += v;
        if (v < b.min) b.min = v;
        if (v > b.max) b.max = v;
      });
      if (!count) return null;
      return {
        field: field, count: count,
        min: min === Infinity ? undefined : min,
        max: max === -Infinity ? undefined : max,
        avg: Math.round((sum / count) * 100) / 100,
        byChapter: byChapter,
      };
    },
    dump: function () {
      return {
        meta: {
          builtAt: new Date().toISOString(),
          version: 'V9.6',
          note: '数值真源在各 owner 文件（data_heroes/equipment_part1/data_sutra/jieseals/zhuanjie/data_ultimates/enemies_part1/2/achievements）；本库为只读快照，调整数值请改 owner 后重跑 scripts/_dump_balance_db.js 重建。',
          counts: Object.keys(DB).reduce((a, k) => (a[k] = DB[k].length, a), {}),
        },
        systems: DB,
      };
    },
  };
})();
