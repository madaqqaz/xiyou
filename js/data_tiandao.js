// =============================================================
// data_tiandao.js — 《逆道西行》天道劫系统 · HUNYUAN_KEY/TIANDAO_KEY
// 从 data.js 拆分（2026-08-31）：独立维护天道劫系统
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.HUNYUAN_KEY = 'ndx_hunyuan';
NDX.loadHunyuan = function () {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  const data = NDX.SaveSystem.load(NDX.HUNYUAN_KEY, {});
  return data && typeof data === 'object' ? data : {};
};
NDX.saveHunyuan = function (obj) {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  NDX.SaveSystem.save(NDX.HUNYUAN_KEY, obj || {});
};

// 天道劫最高层数持久化（用于混元淬炼前置判断）
NDX.TIANDAO_KEY = 'ndx_tiandao_layer';
NDX.loadTianDaoLayer = function () {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  return NDX.SaveSystem.loadNumber(NDX.TIANDAO_KEY, 0);
};
NDX.saveTianDaoLayer = function (layer) {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  const cur = NDX.loadTianDaoLayer();
  if (layer > cur) NDX.SaveSystem.saveNumber(NDX.TIANDAO_KEY, layer);
};

// 混元淬炼条目定义（prereq 用于前置锁定判断）
NDX.HUNYUAN_OPTS = [
  {
    id: 'yin_yang', name: '阴阳同调·极', cost: 10, maxLv: 3,
    eff: '破韧成功后，BOSS 阴阳同调机制失效 3 秒',
    prereq: null,
  },
  {
    id: 'yin_guo', name: '因果倒置', cost: 20, maxLv: 1,
    eff: '战斗开局，复制 BOSS 随机 1 个常驻 Buff',
    prereq: null,
  },
  {
    id: 'jie_wuqiong', name: '劫数无穷（终极）', cost: 100, maxLv: 1,
    eff: '开启真·超脱结局',
    // 前置：所有淬炼条目至少 1 层 + 天道劫抵达 100 层
    prereq: function (hy, fv) {
      const allHave = NDX.HUNYUAN_OPTS.every((o) => (hy[o.id] || 0) >= 1);
      const layer = NDX.loadTianDaoLayer();
      return allHave && layer >= 100;
    },
  },
];

// ============================================================
// 天道劫（终局 · 登天征伐）
// 设计原则：不推翻现有架构，仅做内容填充与逻辑延伸。
// 节点序列 TJ_001~TJ_100，复用现有 NDX.LAYERS[layer][col] 管理。
// 线性廊道 + 每5层战术岔路（choice）。
// ============================================================
NDX.TIANJIE_MAX = 100;            // 天道劫总层数（100层为剧情杀，之后无尽虚空）
NDX.TIANJIE_PREFIX = 'TJ_';       // 节点序列化前缀
NDX._tianJieMode = false;         // 运行时模式标记（start 时置 true）

// 模式判定：当前是否处于天道劫
NDX.isTianJie = function () { return !!NDX._tianJieMode; };
NDX.setTianJieMode = function (v) { NDX._tianJieMode = !!v; };

// 节点类型 → 图标 / 中文标签（适配现有地图 UI）
NDX.TJ_NODE_ICON = {
  fight:  { icon: '⚔️', label: '劫难节点', sys: '普通战斗', tip: '天兵天将，血量随层数指数增长' },
  elite:  { icon: '🔥', label: '精英劫难', sys: '精英战斗', tip: '星宿神将，必掉1个神装碎片' },
  event:  { icon: '🛐', label: '缘分节点', sys: '事件',     tip: '异神相会：哪吒卖火尖枪图纸，二郎神卖天眼结印' },
  rest:   { icon: '🔨', label: '炉火节点', sys: '休息/强化', tip: '调息石台：回复HP/强化装备（消耗神装碎片）' },
  shop:   { icon: '🛒', label: '星市节点', sys: '商店',     tip: '天庭暗市：用「业力」购买高层装备' },
  mirror: { icon: '🔮', label: '业镜节点', sys: '抉择事件', tip: '天道拷问：选「顺」得防御，选「逆」得攻击' },
  boss:   { icon: '👑', label: 'BOSS节点', sys: '阶段BOSS', tip: '天庭神将：每20层一关，掉落大量混元点' },
  choice: { icon: '🔀', label: '分神路口', sys: '岔路',     tip: '二选一：左路(战)掉战痕，右路(缘)遇异神' },
};

// 天道劫节点生成（线性廊道 + 每5层岔路）
// 规则（与策划案对齐）：
//   · layer % 20 === 0 → boss（每20层阶段BOSS）
//   · layer % 5 === 0  → choice（分神路口二选一；TJ_050 用 mirror 业镜取代普通 choice）
//   · layer % 4 === 0  → elite（精英劫难）
//   · layer % 3 === 0  → event（缘分/业镜）
//   · 其余             → fight（普通劫难）
// TJ_050 为关键业镜抉择（顺天/逆天）；TJ_099 为镜像BOSS（业相·西行幻影）
NDX.generateTianJieMap = function () {
  const L = NDX.TIANJIE_MAX;
  const layers = [null];
  for (let n = 1; n <= L; n++) {
    let type;
    if (n === 99) type = 'boss';           // 镜像BOSS（业相·西行幻影）独占 TJ_099
    else if (n % 20 === 0) type = 'boss';  // 阶段BOSS（20/40/60/80/100）
    else if (n === 50) type = 'mirror';    // 中点业镜抉择（顺天/逆天）
    else if (n % 5 === 0) type = 'choice'; // 分神路口
    else if (n % 4 === 0) type = 'elite';  // 精英
    else if (n % 3 === 0) type = 'event';  // 缘分
    else type = 'fight';                   // 普通

    const meta = NDX.TJ_NODE_ICON[type] || NDX.TJ_NODE_ICON.fight;
    const node = {
      type: type,
      name: meta.label,
      tjId: NDX.TIANJIE_PREFIX + String(n).padStart(3, '0'),
      diff: n,                              // 难度锚定层数
      gold: 12 + n * 4,
      tianJie: true,
    };
    // 岔路：左路(战) / 右路(缘)
    if (type === 'choice') {
      node.branches = {
        left:  { kind: 'fight',  reward: 'war',  desc: '敌人更强，掉落【战痕】（强化装备）' },
        right: { kind: 'event',  reward: 'fate', desc: '遇异神，可购买/兑换稀有劫印' },
      };
    }
    // 业镜节点：仅标记类型 + 按层解锁的 tier（具体抉择库由 NDX.buildMirror 动态构建）
    if (type === 'mirror') {
      let tier = 1;                                    // 1-20 天兵 / 21-40 星宿 / 41-60 真君 / 61-80 帝君
      if (n >= 61) tier = 4;
      else if (n >= 41) tier = 3;
      else if (n >= 21) tier = 2;
      node.mirrorTier = tier;
      node.mirrorMid = (n === 50);                     // 第50层【业镜·中阴身】分水岭
      node.mirrorBroken = (n > 100 && n % 10 === 0);   // 无尽模式【业镜·破碎】
    }
    // 镜像BOSS（TJ_099）
    if (n === 99) {
      node.mirrorBoss = true;
      node.name = '业相·西行幻影';
      node.tip = '你以为你变了？你不过是重复着昨日的业。';
    }
    // 阶段BOSS 命名
    if (type === 'boss') {
      const bossNames = { 20: '巨灵神', 40: '哪吒', 60: '二郎神', 80: '真武大帝', 99: '业相·西行幻影', 100: '天道意志' };
      node.name = bossNames[n] || ('天庭神将·第' + n + '阶');
      node.bossTier = Math.ceil(n / 20);
    }
    layers[n] = { 3: node }; // 单列入口（线性廊道）
    // 线性廊道：本层节点连向下一层同列（col=3）
    if (n < L) node.next = [3];
  }
  layers[0] = {}; // 逻辑起点层（无节点），nextNodes(0) 自动指向 layers[1][3]
  NDX.LAYER_COUNT = L + 1;
  NDX.START_LAYER = 0;
  return layers;
};

// ============================================================
// 业镜节点（天道劫·轮回殿投影）
// 设计原则：业镜不是选择题，是照妖镜——它不给你“好处”，只把你的“心”具象化。
// 选项分 秩序(顺) / 混沌(逆) 双线，按层解锁 tier；效果以“百分比乘区 + 本局持续状态”表达。
// 本局持续状态统一写入 s.mirror（由 game.js 的 stats/fight/finishFight 读取）。
// ============================================================
