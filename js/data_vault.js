// =============================================================
// data_vault.js — 《逆道西行》万世剑冢 · 衣冠冢/舍利塔地图节点
// V8.56：衣冠冢与舍利塔不再是「结算即时带下世」，而是每周目刷新、跨周目回访拾取的成亡节点。
// 唯一真源：data_reincarnation.js(引渡匣/终点回程) 之外，衣冠冢/舍利塔的持久化与衰减全在此。
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.VAULT_KEY = 'xynj_vault_v1';
NDX.VAULT_MAX = 3;                 // 地图共存上限（最多 3 个节点）
NDX.VAULT_DECAY = [1, 0.7, 0.4];   // 按累计拾取次数：第1次100% / 第2次70% / 第3次起维持40%
NDX.VAULT_REGIONS = 17;            // 事件里的地区号范围 1..17

// —— 取衰减倍率（按节点已拾取次数 pickupCount，0→1、1→0.7、≥2→0.4，钳在 40% 不再折旧）——
NDX.vaultDecay = function (pickupCount) {
  const c = Math.max(0, (pickupCount | 0));
  return NDX.VAULT_DECAY[Math.min(c, NDX.VAULT_DECAY.length - 1)];
};

// 读取持久节点库（≤VAULT_MAX；结构 { nodes:[{region,kind,hero,ts,pickupCount,pool}] }）
NDX.loadVault = function () {
  const o = NDX.SaveSystem.load(NDX.VAULT_KEY, { nodes: [] });
  o.nodes = Array.isArray(o.nodes) ? o.nodes : [];
  return o;
};
NDX.saveVault = function (o) {
  NDX.SaveSystem.save(NDX.VAULT_KEY, o);
};

// —— 局终 rewardPool 快照：本次成亡/坐化时拥有的装备 / 红材·组件 / 经文 ——
// 装备：只收非法宝（e.treasure 排除），去重；红材·组件：s.materials 权重点；经文：舍利塔（shrine）才收。
NDX._vaultPoolFromRun = function (s, kind) {
  const pool = { equips: [], mats: [], sutras: [] };
  if (!s) return pool;
  (s.equips || []).forEach((e) => {
    if (!e || !e.id || e.treasure) return;
    if (pool.equips.some((x) => x.id === e.id)) return;
    pool.equips.push(Object.assign({}, e)); // 深克隆快照，避免后续飘改污染节点
  });
  const mats = s.materials || {};
  const seenMat = {};
  Object.keys(mats).forEach((mid) => {
    const n = mats[mid] || 0;
    if (n <= 0 || seenMat[mid]) return;
    seenMat[mid] = 1;
    if (pool.equips.some((e) => e.id === mid)) return; // 材料与装备 id 撞车守卫
    pool.mats.push({ id: mid, name: mid, count: n });
  });
  if (kind === 'shrine') {
    const seen = {};
    (s.sutras || []).forEach((id) => { if (id && !seen[id]) { seen[id] = 1; pool.sutras.push(id); } });
    (s.niSutras || []).forEach((id) => { if (id && !seen[id]) { seen[id] = 1; pool.sutras.push(id); } });
  }
  return pool;
};

// —— 登记节点（死亡→tomb；返程坐化→shrine）—— 返回新节点（或 null 失败）。
// 独占规则：每区只保留一个（同区旧节点被这次顶替）；舍利塔覆盖衣冠冢（同 kind 亦即时被替换）；
// 同时最多 VAULT_MAX 个，超额驱逐最旧（LRU by ts）的一个。
NDX.registerVault = function (s, kind, regionArg) {
  try {
    const o = NDX.loadVault();
    const s2 = s || {};
    const kind2 = kind === 'shrine' ? 'shrine' : 'tomb';
    const region = Math.max(1, Math.min(NDX.VAULT_REGIONS, +(regionArg != null ? regionArg : (s2.act || 1)) || 1));
    o.nodes = o.nodes.filter((n) => n.region !== region); // 同区唯一：旧的让位
    const node = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      region, kind: kind2, hero: s2.hero || null,
      ts: Date.now(), pickupCount: 0,
      pool: NDX._vaultPoolFromRun(s2, kind2),
    };
    o.nodes.push(node);
    if (o.nodes.length > NDX.VAULT_MAX) {
      o.nodes.sort((a, b) => a.ts - b.ts);
      o.nodes.splice(0, o.nodes.length - NDX.VAULT_MAX);
    }
    NDX.saveVault(o);
    return node;
  } catch (e) { return null; }
};
// 取某区当前生效节点（地图/面板摆放）；null=该区无
NDX.vaultForRegion = function (region) {
  const o = NDX.loadVault();
  return o.nodes.find((n) => n.region === (+region || 0)) || null;
};
// 全部生效节点（按登记先后升序，≤VAULT_MAX），供「成亡节点」面板回访
NDX.activeVaults = function () {
  const o = NDX.loadVault();
  return o.nodes.slice().sort((a, b) => a.ts - b.ts);
};

// —— 仅保留属性：克隆奖励、剥离链式/升级/隐性标记，并按衰减倍率缩放数值属性 ——
// 割掉 uses/setTier/red/mechanism/upgraded/fromMonument/chain 等「触发后续任务链/升级链/成就」的钩子。
NDX._stripVaultReward = function (srcEquip, mult) {
  const e = Object.assign({}, srcEquip);
  ['uses', 'setTier', 'red', 'mechanism', 'upgraded', 'fromMonument', 'chain', 'secretChain', 'hiddenJobHook'].forEach(
    (k) => { if (e[k] !== undefined) delete e[k]; }
  );
  const numericKeys = ['atk', 'hp', 'matk', 'mdef', 'eva', 'cri', 'criMult', 'hit', 'atkB', 'fixAtk', 'fixDr', 'matkB', 'fixMatk', 'fixMdef', 'hpRegen', 'reflect', 'spd', 'shieldPct', 'armorPen'];
  numericKeys.forEach((k) => {
    if (typeof e[k] === 'number' && e[k] !== 0) e[k] = Math.round(e[k] * mult * 100) / 100;
  });
  return e;
};

// —— 二选一候选题面（供弹窗展示）。返回 { opts:[{cat,kind,id,name,count?,desc?}], mult, nodeId, nextCount } ——
// 衣冠冢：装备列表 + 红材/组件项；舍利塔：装备列表 + 经文列表。mult 为当前衰减档 1/0.7/0.4。
NDX.vaultOptions = function (node) {
  const pool = (node && node.pool) || { equips: [], mats: [], sutras: [] };
  const mult = NDX.vaultDecay(node.pickupCount);
  const opts = [];
  (pool.equips || []).slice(0, 8).forEach((e) => {
    opts.push({ cat: '装备', kind: 'equip', id: e.id, name: e.name || e.id, desc: e.slot || '' });
  });
  if (node.kind === 'shrine') {
    (pool.sutras || []).slice(0, 6).forEach((sid) => {
      // P0-3：同 data_compound.js——先经 SUTRA_DAO_OF 反查藏 key，再取藏名，否则显示裸 id
      const _cangKey = (NDX.SUTRA_DAO_OF || {})[sid];
      const d = (_cangKey && NDX.SUTRA_SIX_CANG && NDX.SUTRA_SIX_CANG[_cangKey]) || {};
      opts.push({ cat: '经文', kind: 'sutra', id: sid, name: d.name || sid, desc: '佛经全本 · 渡/逆' });
    });
  } else {
    (pool.mats || []).slice(0, 4).forEach((m) => {
      opts.push({ cat: '组件/红材', kind: 'mat', id: m.id, name: m.name, count: m.count, desc: '合成材料' });
    });
  }
  return { nodeId: node.id, kind: node.kind, region: node.region, mult, nextCount: (node.pickupCount || 0), opts };
};

// 按 id 定位节点（领取时用）
NDX.vaultById = function (nodeId) {
  const o = NDX.loadVault();
  return o.nodes.find((n) => n.id === nodeId) || null;
};
// 领取后递增拾取次数（由 game 在成功发放后调用）
NDX.bumpVaultPick = function (nodeId) {
  const o = NDX.loadVault();
  const n = o.nodes.find((x) => x.id === nodeId);
  if (n) { n.pickupCount = (n.pickupCount || 0) + 1; NDX.saveVault(o); }
};