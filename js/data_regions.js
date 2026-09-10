// =============================================================
// data_regions.js — 《逆道西行》地区数据 · 背景图/地图主题
// 从 data.js 拆分（2026-08-31）：独立维护地区相关数据与主题
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// =============================================================
// 各区域（act 顺序）对应的横屏背景图（dark 国风水墨长卷，1280×768 横幅）。
// 索引 0~16 对应 act=1~17。进入该区域（出现对应节点）时地图背景自动更换。
// =============================================================
NDX.ACT_BG = [
  'img/bg/act_01_datang.webp?v=2',     // 1 大唐境内
  'img/bg/act_02_liangjie.webp?v=2',   // 2 两界山
  'img/bg/act_03_huangfeng.webp?v=2',  // 3 黄风岭
  'img/bg/act_04_liusha.webp?v=2',     // 4 流沙河
  'img/bg/act_05_wuzhuang.webp?v=2',   // 5 五庄观
  'img/bg/act_06_huoyun.webp?v=2',     // 6 火云洞
  'img/bg/act_07_chechi.webp?v=2',     // 7 车迟国
  'img/bg/act_08_tongtian.webp?v=2',   // 8 通天河
  'img/bg/act_09_nver.webp?v=2',       // 9 女儿国
  'img/bg/act_10_zhenjia.webp?v=2',    // 10 真假猴王
  'img/bg/act_11_huoyan.webp?v=2',     // 11 火焰山
  'img/bg/act_12_jisai.webp?v=2',      // 12 祭赛国
  'img/bg/act_13_shituo.webp?v=2',     // 13 狮驼岭
  'img/bg/act_14_biqiu.webp?v=2',      // 14 比丘国
  'img/bg/act_15_tianzhu.webp?v=2',    // 15 天竺·玉兔
  'img/bg/act_16_lingshan.webp?v=2',   // 16 灵山
  'img/bg/act_17_lingyun.webp?v=2'     // 17 凌云渡
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
NDX.ACT_MAP_THEME = {
  2: {
    names: ['双叉岭·山魈', '劫难', '两界山·猎户', '鹰愁涧·水妖', '五行山·土地', '劫难', '两界·灵市', '两界山·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'langyajia', material: '黑风铁' }, 7: { drop: 'sanmei', material: '兜率火' } },
  },
  3: {
    names: ['虎先锋·前哨', '劫难', '黄风洞·风妖', '灵吉·山神庙', '黄风岭·驿卒', '劫难', '黄风·灵市', '黄风岭·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'sanmei', material: '三昧烬' }, 7: { drop: 'langyajia', material: '黑风铁' } },
  },
  4: {
    names: ['流沙河·河神', '劫难', '四圣庄·幻影', '流沙河·水妖', '河神·渡口', '劫难', '流沙·灵市', '流沙河·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'langyajia', material: '黑风铁' }, 7: { drop: 'sanmei', material: '兜率火' } },
  },
  5: {
    names: ['五庄观·道童', '劫难', '人参果园·果仙', '白骨岭·尸魔', '宝象国·驿卒', '劫难', '五庄·灵市', '五庄观·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'sanmei', material: '兜率火' }, 7: { drop: 'jingangying', material: '三昧烬' } },
  },
  6: {
    names: ['黑松林·山魅', '劫难', '平顶山·金角', '乌鸡国·井龙', '黑水河·鼍兵', '劫难', '火云·灵市', '火云洞·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'langyajia', material: '三昧烬' }, 7: { drop: 'sanmei', material: '三昧烬' } },
  },
  7: {
    names: ['车迟·祭坛', '劫难', '三清观·道兵', '车迟监·狱卒', '车迟王廷·卫士', '劫难', '车迟·灵市', '车迟国·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'jiutouji', material: '狮驼骨' }, 7: { drop: 'mangzhu', material: '金翅羽' } },
  },
  8: {
    names: ['陈家庄·佃户', '劫难', '灵感庙·河祭', '通天河·冰灵', '金兜洞·青牛', '劫难', '通天·灵市', '通天河·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'jiutouji', material: '巨蟒涎' }, 7: { drop: 'mangzhu', material: '狮驼骨' } },
  },
  9: {
    names: ['女儿国·驿卒', '劫难', '子母河·水怪', '琵琶洞·蝎兵', '解阳山·道姑', '劫难', '西凉·灵市', '女儿国·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'sanmei', material: '三昧烬' }, 7: { drop: 'langyajia', material: '兜率火' } },
  },
  // V8.41 地区10-17地图皮肤框架（2026-09-01 按原著地理重排后微调各节点名）
  10: {
    names: ['花果山·猴兵', '劫难', '水帘洞·六耳', '幽冥·谛听', '落伽山·山神', '劫难', '真假·灵市', '五行山·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'jingangying', material: '兜率火' }, 7: { drop: 'langyajia', material: '金翅羽' } },
  },
  11: {
    names: ['火焰山·火卒', '劫难', '芭蕉洞·罗刹', '积雷山·牛兵', '翠云宫·山神', '劫难', '火焰·灵市', '火焰山·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'meiban', material: '三昧烬' }, 7: { drop: 'xijiao', material: '三昧烬' } },
  },
  12: {
    names: ['祭赛国·僧兵', '劫难', '金光寺·妖僧', '碧波潭·虾兵', '乱石山·山神', '劫难', '祭赛·灵市', '金光寺·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'jiutouji', material: '狮驼骨' }, 7: { drop: 'mangzhu', material: '巨蟒涎' } },
    regionIntro: '祭赛国金光寺塔顶本有舍利佛光，自三年前失窃，寺僧皆被指为盗宝贼，囚于地牢。城中百姓传言，潭底龙宫夜夜笙歌，明珠照彻水面——那光，像极了失窃的佛光。',
  },
  13: {
    names: ['荆棘岭·树精', '劫难', '小雷音·黄眉', '朱紫国·医馆', '狮驼岭·青狮', '劫难', '狮驼·灵市', '狮驼岭·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'jiutouji', material: '金翅羽' }, 7: { drop: 'gongwu', material: '狮驼骨' } },
  },
  14: {
    names: ['比丘国·驿卒', '劫难', '清华洞·白鹿', '灭法国·捕快', '凤仙郡·旱民', '劫难', '比丘·灵市', '清华洞·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'langyajia', material: '兜率火' }, 7: { drop: 'sanmei', material: '三昧烬' } },
    regionIntro: '比丘国街巷清冷，家家门上贴着求子符——国王自病后不再临朝，一切国事皆由国丈裁决。官差挨户收走孩童，说"送进宫做药引，是大造化"。你看见那国丈的官靴下，露出一截带斑的鹿蹄。',
  },
  15: {
    names: ['玉华州·三王', '劫难', '金平府·犀奴', '给孤园·罗汉', '天竺·驿卒', '劫难', '天竺·灵市', '玉兔宫·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'yuehua', material: '月宫桂' }, 7: { drop: 'meiban', material: '天竺佛香' } },
    regionIntro: '天竺国是西天脚下最后的王土，香火最盛，百姓最信。可这三年，宫里的公主换了个人——没人看得出，只有月圆之夜，那"公主"会对着月亮出神，指间漏出捣药的节奏。',
  },
  16: {
    names: ['灵山·罗汉', '劫难', '藏经阁·索经', '无字经·护法', '大雷音·菩萨', '劫难', '灵山·灵市', '灵山·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'yuehua', material: '凌云木' }, 7: { drop: 'xijiao', material: '天竺佛香' } },
  },
  17: {
    names: ['凌云渡·渡夫', '劫难', '晒经石·灵', '接引佛·罗汉', '无字经·护法', '劫难', '凌云·灵市', '凌云渡·土地庙', '关隘'],
    eliteDrops: { 3: { drop: 'meiban', material: '凌云木' }, 7: { drop: 'yuehua', material: '月宫桂' } },
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
