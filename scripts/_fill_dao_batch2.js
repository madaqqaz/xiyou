// _fill_dao_batch2.js — 批次2：为「有特殊 boss / 可收为逆兽」的难补【逆】
// 逆的佛法口径：不是滥杀，是「抗既定法统」——说动有来历的妖王反出主家，给它一条不被收编的路
const W = require('./_trial_opt_writer');

const NEWOPT = {
  // 5 出城逢虎：寅将军（吃九世取经人的虎）
  5: [
    `      { key: '战', label: '猎户助阵，双人杀虎', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '渡', label: '放虎归山，为伯钦爹立一坟', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '缘', label: '受伯钦赠刀，结这一山之缘', fate: '缘', effect: { alignGood: 6, equipPick: 3 } },`,
    `      { key: '逆', label: '问它一句——九世取经人，是谁叫你吃的', fate: '逆', ni: true, effect: { alignEvil: 8, treasure: 'ni_sanshou' } },`,
  ],
  // 7 双叉岭上：历代取经人残魂与三妖
  7: [
    `      { key: '战', label: '斩残魂开路', fate: '战', effect: { alignEvil: 8 } },`,
    `      { key: '渡', label: '听它们说完名字，再走', fate: '渡', effect: { alignGood: 15 } },`,
    `      { key: '隐', label: '绕行，不惊动这些残魂', fate: '隐', effect: { alignGood: 4 } },`,
    `      { key: '逆', label: '把那句「别走」替它们说完——这路，我接着走', fate: '逆', ni: true, effect: { alignEvil: 6 } },`,
  ],
  // 9 两界山·鹰愁涧：小白龙·西海三太子
  9: [
    `      { key: '战', label: '降龙，强收为脚力', fate: '战', effect: { alignEvil: 6 } },`,
    `      { key: '渡', label: '点化白龙，随行驮经', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '缘', label: '放它归海，白龙衔珠相赠', fate: '缘', effect: { alignGood: 8 } },`,
    `      { key: '逆', label: '不让它受鞍——它烧的是自家殿上的珠子', fate: '逆', ni: true, effect: { alignEvil: 8, treasure: 'ni_yulong' } },`,
  ],
  // 10 虎先锋前哨
  10: [
    `      { key: '战', label: '斗虎先锋，夺这半截经幡', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '渡', label: '渡化绕行，化风而过', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '隐', label: '潜行避其锋芒', fate: '隐', effect: { alignGood: 2 } },`,
    `      { key: '逆', label: '问它守的是什么——替人守关，你得到过什么', fate: '逆', ni: true, effect: { alignEvil: 8, treasure: 'ni_huxianfeng' } },`,
  ],
  // 11 黄风卷沙：黄毛貂鼠（tre=定风丹 → 夺）
  11: [
    `      { key: '战', label: '踏风穿云，一拳定住风眼', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '渡', label: '请灵吉念一卷还香油经', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '夺', label: '趁风眼大开，夺它定风丹', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '它偷的不过一盏清油——佛门不认它修的道', fate: '逆', ni: true, effect: { alignEvil: 8, treasure: 'ni_huangfeng' } },`,
  ],
  // 12 三昧神风
  12: [
    `      { key: '战', label: '请灵吉收风', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '渡', label: '借风势渡岭', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '夺', label: '逆风而上，夺它风袋', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '不借风也不收它——让它把这一场吹完', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
  ],
  // 14 流沙河畔·沙僧初遇：卷帘大将
  14: [
    `      { key: '缘', label: '细察残舟，拾得渡河旧物', fate: '缘', effect: { alignGood: 6 } },`,
    `      { key: '渡', label: '沿河诵经，渡河妖去', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '战', label: '掷石入河，激妖出阵', fate: '战', effect: { alignEvil: 8 } },`,
    `      { key: '逆', label: '问他一句——打碎的琉璃盏，判的是谁的罪', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
  ],
  // 22 黄袍掳公主：奎木狼
  22: [
    `      { key: '战', label: '一战降之', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '渡', label: '为宝象公主传书，送它归天', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '隐', label: '放他们私奔', fate: '隐', effect: { alignGood: 6 } },`,
    `      { key: '逆', label: '不上天庭——他下界只为续一段缘，天条管得着么', fate: '逆', ni: true, effect: { alignEvil: 8, treasure: 'ni_kui' } },`,
  ],
  // 27 红孩真火（res=请观音 → 渡）
  27: [
    `      { key: '战', label: '硬闯火云洞，三昧真火里走一遭', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '渡', label: '往南海请观音，收它做个善财童子', fate: '渡', effect: { alignGood: 12 } },`,
    `      { key: '夺', label: '夺它三昧真火', fate: '夺', effect: { alignEvil: 10 } },`,
    `      { key: '逆', label: '不叫它去受那一炉香火——牛魔王的儿子，凭什么叫童子', fate: '逆', ni: true, effect: { alignEvil: 8, treasure: 'ni_honghai' } },`,
  ],
  // 46 火焰借扇：铁扇公主
  46: [
    `      { key: '战', label: '力夺真扇', fate: '战', effect: { alignEvil: 6 } },`,
    `      { key: '夺', label: '变虫入腹，逼她交扇', fate: '夺', effect: { alignEvil: 8 } },`,
    `      { key: '缘', label: '以礼借扇，结一段善缘', fate: '缘', effect: { alignGood: 6 } },`,
    `      { key: '逆', label: '与她同病——你守扇是替红孩儿守的，我夺扇又是替谁', fate: '逆', ni: true, effect: { alignEvil: 8, treasure: 'ni_luocha' } },`,
  ],
  // 48 积雷山·牛魔王（res=请李天王父子 → 渡已有）
  48: [
    `      { key: '战', label: '棒斗牛魔王，夺路入洞', fate: '战', effect: { alignEvil: 8 } },`,
    `      { key: '渡', label: '攀交讲和，请他让扇', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '夺', label: '夜袭摩云洞，盗那扇柄', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '不请天王父子——兄弟，你本就反过一次', fate: '逆', ni: true, effect: { alignEvil: 10, treasure: 'ni_niumo' } },`,
  ],
  // 49 翠云山·真扇决战
  49: [
    `      { key: '战', label: '降伏牛魔，得真扇灭焰', fate: '战', effect: { alignEvil: 10 } },`,
    `      { key: '渡', label: '以情动铁扇，化干戈为玉帛', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '夺', label: '巧夺芭蕉扇，拂焰而去', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '当面撕了那道招安的旨——平天大圣不是谁家的一条犬', fate: '逆', ni: true, effect: { alignEvil: 12 } },`,
  ],
  // 53 万圣盗草：万圣公主盗草救夫
  53: [
    `      { key: '缘', label: '助她偷到底', fate: '缘', effect: { alignGood: 6 } },`,
    `      { key: '渡', label: '点破她，止这一桩盗案', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '夺', label: '黑吃黑，夺下盗草赃物', fate: '夺', effect: { alignEvil: 8 } },`,
    `      { key: '逆', label: '替她把草盗成——她盗草，只为给丈夫续一条命', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
  ],
  // 55 木仙谈诗：荆棘岭树精
  55: [
    `      { key: '渡', label: '点破它们执着于形的苦，送其往生', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '隐', label: '愿做树一刻', fate: '隐', effect: { alignGood: 4 } },`,
    `      { key: '夺', label: '夺其千年木心', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '不斩不留——它们只谈了一夜诗，凭什么被筑倒', fate: '逆', ni: true, effect: { alignEvil: 6, treasure: 'ni_shujing' } },`,
  ],
  // 61 隐雾梅花：艾叶花皮豹子精
  61: [
    `      { key: '战', label: '破它的分瓣梅花计', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '隐', label: '识破不走', fate: '隐', effect: { alignGood: 4 } },`,
    `      { key: '缘', label: '与梅花鹿精结缘，渡其归道', fate: '缘', effect: { alignGood: 6 } },`,
    `      { key: '逆', label: '反用它的分瓣计——你拆我几瓣，我便拆了这座山', fate: '逆', ni: true, effect: { alignEvil: 8, treasure: 'ni_baozi' } },`,
  ],
  // 66 给孤招婚：玉兔假公主
  66: [
    `      { key: '战', label: '请太阴星君来收', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '渡', label: '放她回月宫', fate: '渡', effect: { alignGood: 15 } },`,
    `      { key: '夺', label: '夺婚书聘礼，拂袖而去', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '不送她回月——她下界，只为报广寒宫那一记掌', fate: '逆', ni: true, effect: { alignEvil: 10 } },`,
  ],
  // 72 玉兔精·天竺决战
  72: [
    `      { key: '战', label: '一棒降玉兔，了结天竺之乱', fate: '战', effect: { alignEvil: 10 } },`,
    `      { key: '渡', label: '渡其归月，化干戈', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '夺', label: '收其捣药杵为宝', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '不送它回月宫——回去接着捣药，正是它逃出来的原因', fate: '逆', ni: true, effect: { alignEvil: 10, treasure: 'ni_yutu' } },`,
  ],
};

W.replaceOptions(NEWOPT);
console.log('批次2 完成');
