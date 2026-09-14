// =============================================================
// data_regions.js — 《逆道西行》地区数据 · 背景图/地图主题
// 从 data.js 拆分（2026-08-31）：独立维护地区相关数据与主题
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// =============================================================
// 九章制背景图（2026-09-13 从17地区制改为9章制）
// 索引 0~8 对应 act=1~9。进入该章时地图背景自动更换。
// 所有背景图已使用 Seedream 5.0 Pro 重新生成，1920x1080（16:9）手机横版。
// =============================================================
NDX.ACT_BG = [
  'img/bg/act_01_datang.webp?v=3',     // 第1章 出长安（大唐→两界山→黄风岭）
  'img/bg/act_04_liusha.webp?v=3',     // 第2章 满员即散（流沙河+五庄观）
  'img/bg/act_06_huoyun.webp?v=3',     // 第3章 放逐与归来（火云洞）
  'img/bg/act_07_chechi.webp?v=3',     // 第4章 情劫（车迟国+通天河）
  'img/bg/act_09_nver.webp?v=3',       // 第5章 伪佛（女儿国+真假猴王）
  'img/bg/act_11_huoyan.webp?v=3',     // 第6章 魔窟（火焰山+祭赛国）
  'img/bg/act_13_shituo.webp?v=3',     // 第7章 归真（荆棘岭→小雷音→狮驼岭）
  'img/bg/act_14_biqiu.webp?v=3',      // 第8章 天竺（比丘国+天竺·玉兔）
  'img/bg/act_16_lingshan.webp?v=3'    // 第9章 灵山（灵山+凌云渡·终章）
];
// 图片加速（外网 4G/5G/cpolar 下载大 png 太慢）：若环境有 webp 支持探测，
// 统一把 ACT_BG 切到同目录 .webp（img/bg/ 已有 act_XX.webp），不支持或无工具则退回原 png。
if (typeof window.__pickWebp === 'function') {
  try { NDX.ACT_BG = NDX.ACT_BG.map(function(u){ return window.__pickWebp(u); }); } catch(e) {}
}
// file:// 直开兼容：浏览器会将 CSS background-image 的 url('...webp?v=2') 中 ?v= 当作文件名一部分，
// 导致区域背景图 404、地图露出 .map 深棕底（即「路径黑底框」）。file:// 下去掉 ?v 让背景图正常加载；
// http 下保留 ?v 以遵守缓存纪律（强制刷新新图）。
if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
  NDX.ACT_BG = NDX.ACT_BG.map(function(u){ return u.replace(/[?&]v=\d+$/, ''); });
}

// =============================================================
// 第二~四章地图主题（ACT_MAP_THEME）
// 设计：MAP_PLAN 仅含第一章 20 层骨架（每章复用同一套地图生成规则）。为使第 2~4 章在「地图外观」上也各自成立，
//   这里按 act 提供节点名覆盖 + 精英掉落覆盖（精英层固定为 3/8/11/16/19）。劫难/商店/休息/宝窟为通用名，
//   Boss 层名由 bossNameForAct 覆盖。这样四章的地图既有统一生成骨架，又有专属叙事皮肤与掉落。
//   names 数组下标 L-1 对应第 L 层（1~20）；eliteDrops 以层号为键，drop/material 指向真实装备与材料 id。
// =============================================================
// =============================================================
// 【2026-09-13 9章制重建】原表键为 17 地区制（act 1~17），09-01 地理重排为 9 章后键位整体错位一章：
//   ch2 套用了「两界山」段、ch3 套用了「黄风岭」段…… 玩家会在地图上看到「第2章 高老庄·流沙河」
//   标注「双叉岭·山魈」这类前一段地名。现按 ACT_RANGES 的 9 章边界重建，names 长度严格 = 该章 layers。
//   names[L-1] 为该层氛围地名（作用于 mob/elite/event/rest/shop）；trial 保留 TRIAL_LIB 难名，
//   compound/boss 自带专属名（见 _applyActTheme 的排除分支）。
// =============================================================
NDX.ACT_MAP_THEME = {
  // 第1章（难1-13，大唐→两界山→黄风岭）：沿用 MAP_PLAN_CH1 默认皮肤（通用妖名），不设 theme
  // 第2章（难14-22）流沙河 + 五庄观：收八戒 → 收沙僧 → 四圣 → 五庄观 → 白骨岭
  2: {
    // 【2026-09-13 PHASE 7】layers 9 → 7，names 同步收到 7 项（原第 8/9 项是旧 9 层制残影）。
    //   顺序按章内地理：高老庄 → 云栈洞 → 流沙河 → 五庄观 → 白骨岭 → 白虎岭荒庙 → 关隘。
    names: ['高老庄·庄客', '流沙河·渡口', '西行·庄院', '五庄观·道童', '白骨岭·尸魔', '白虎岭·荒庙', '关隘'],
    // eliteDrops 的键是层号：原 L7 为非 Boss 层，现 L7 即关隘 Boss（无精英），下移至 L6。
    eliteDrops: { 3: { drop: 'langyajia', material: '黑风铁' }, 6: { drop: 'sanmei', material: '兜率火' } },
  },
  // 第3章（难23-27）黑松林 → 平顶山 → 乌鸡国 → 黑水河 → 火云洞
  3: {
    names: ['黑松林·山魅', '平顶山·金角', '乌鸡国·井龙', '黑水河·鼍兵', '关隘'],
    eliteDrops: { 3: { drop: 'langyajia', material: '三昧烬' } },
  },
  // 第4章（难28-36）车迟国斗法 + 通天河
  4: {
    names: ['车迟·祭坛', '三清观·道兵', '车迟监·狱卒', '车迟王廷·卫士', '陈家庄·佃户', '灵感庙·河祭', '通天河·冰灵', '金兜洞·青牛', '关隘'],
    eliteDrops: { 3: { drop: 'jiutouji', material: '狮驼骨' }, 7: { drop: 'mangzhu', material: '巨蟒涎' } },
  },
  // 第5章（难37-45）女儿国 + 真假猴王
  5: {
    names: ['女儿国·驿卒', '解阳山·道姑', '西梁·王廷', '琵琶洞·蝎兵', '花果山·猴兵', '水帘洞·六耳', '幽冥·谛听', '落伽山·山神', '关隘'],
    eliteDrops: { 3: { drop: 'sanmei', material: '三昧烬' }, 7: { drop: 'langyajia', material: '金翅羽' } },
  },
  // 第6章（难46-54）火焰山 + 祭赛国
  6: {
    names: ['火焰山·火卒', '芭蕉洞·罗刹', '积雷山·牛兵', '翠云宫·山神', '祭赛国·僧兵', '金光寺·妖僧', '碧波潭·虾兵', '乱石山·山神', '关隘'],
    eliteDrops: { 3: { drop: 'meiban', material: '三昧烬' }, 7: { drop: 'mangzhu', material: '巨蟒涎' } },
    regionIntro: '祭赛国金光寺塔顶本有舍利佛光，自三年前失窃，寺僧皆被指为盗宝贼，囚于地牢。城中百姓传言，潭底龙宫夜夜笙歌，明珠照彻水面——那光，像极了失窃的佛光。',
  },
  // 第7章（难55-58）荆棘岭 → 小雷音 → 朱紫国 → 狮驼岭（紧凑高潮章）
  7: {
    names: ['荆棘岭·树精', '小雷音·黄眉', '朱紫国·医馆', '关隘'],
    eliteDrops: { 3: { drop: 'jiutouji', material: '金翅羽' } },
  },
  // 第8章（难59-72）比丘国 + 天竺·玉兔（五融合弧章：比丘灭法 / 隐雾凤仙 / 玉华竹节 / 金平给孤 / 天竺玉兔）
  //   names 按「层号 - 1」消费（见 _applyActTheme），一条地名 = 一层的地区皮肤；
  //   复合节点 / 劫难节点 / 关隘 Boss 不套皮肤（弧自带名、劫难保留 TRIAL_LIB 难名）。
  //   【2026-09-13 PHASE 6】该章 layers 由 14 压至 10，names 同步由 14 项收到 10 项
  //   ——原第 11~14 项（月宫·桂影 / 玉兔宫·婢女 / 玉兔宫·土地庙 / 关隘）为旧 14 层制残影，已删。
  8: {
    names: ['比丘国·驿卒', '灭法国·捕快', '隐雾山·豹精', '凤仙郡·旱民', '玉华州·三王', '竹节山·狮奴', '金平府·犀奴', '给孤园·罗汉', '铜台府·驿丞', '天竺·驿卒'],
    eliteDrops: { 3: { drop: 'langyajia', material: '兜率火' }, 7: { drop: 'meiban', material: '天竺佛香' } },
    regionIntro: '比丘国街巷清冷，家家门上贴着求子符——国王自病后不再临朝，一切国事皆由国丈裁决。官差挨户收走孩童，说"送进宫做药引，是大造化"。你看见那国丈的官靴下，露出一截带斑的鹿蹄。',
  },
  // 第9章（难73-81）灵山 + 凌云渡（终章）
  9: {
    names: ['灵山·罗汉', '藏经阁·索经', '无字经·护法', '大雷音·菩萨', '灵山·残碑', '凌云渡·渡夫', '晒经石·灵', '接引佛·罗汉', '关隘'],
    eliteDrops: { 3: { drop: 'yuehua', material: '凌云木' }, 7: { drop: 'meiban', material: '月宫桂' } },
    regionIntro: '天竺国是西天脚下最后的王土，香火最盛，百姓最信。可这三年，宫里的公主换了个人——没人看得出，只有月圆之夜，那"公主"会对着月亮出神，指间漏出捣药的节奏。',
  },
};

// 把某章主题套用到已生成地图（在 generateMap 内、规则后处理前调用）
NDX._applyActTheme = function (layers, act) {
  const theme = NDX.ACT_MAP_THEME[act];
  if (!theme) return;
  for (let L = 1; L <= NDX.LAYER_COUNT; L++) {
    const nm = theme.names && theme.names[L - 1];
    const ed = theme.eliteDrops && theme.eliteDrops[L];
    Object.keys(layers[L] || {}).forEach((c) => {
      const node = layers[L][c];
      if (node.type === 'compound') return; // 复合节点（多难合并）自带专属名/图标，不套地区皮肤
      // 【2026-09-13 修复】劫难节点必须保留 TRIAL_LIB 的难名（如「云栈洞·收八戒」）。
      //   本函数在 _assignTrialDiffs 之后执行，此前无差别覆盖 node.name，把难名抹成地区皮肤里的
      //   「劫难」占位词，导致全游戏地图上没有一个劫难节点显示正确难名。
      if (node.type === 'trial') return;
      if (node.type === 'boss') {
        node.name = NDX.bossNameForAct(act);
        node.diff = NDX.actEnd(act); // 关隘 Boss = 该章末难（13/22/31/40/49/58/68/77/81），全局难号与剧情一致
      }
      else if (nm) node.name = nm;
      if (node.type === 'elite' && ed) {
        if (ed.drop) node.drop = ed.drop;
        if (ed.material) node.material = ed.material;
      }
    });
  }
};
