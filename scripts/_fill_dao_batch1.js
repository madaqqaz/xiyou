// _fill_dao_batch1.js — 批次1：补齐「请救兵必有渡」8 难，并按规则补逆/夺、去前缀、签善恶
const W = require('./_trial_opt_writer');

const NEWOPT = {
  // 24 平顶山宝：金角银角=老君炉边童子（res:老君亲收 → 渡必给）
  24: [
    `      { key: '战', label: '以假葫芦诓它，教它装了自己', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '渡', label: '上天请老君亲至，收二童归炉', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '夺', label: '夺紫金红葫芦与羊脂玉净瓶', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '说破它们只是老君的库——宝贝不是你们的，命也不是', fate: '逆', ni: true, effect: { alignEvil: 8, treasure: 'ni_lutong' } },`,
  ],
  // 26 黑水鼍龙：西海龙王之侄（res:摩昂太子来收 → 渡必给）
  26: [
    `      { key: '战', label: '河神助战，擒那鼍龙', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '渡', label: '往西海请摩昂太子来收，归它一个龙族正籍', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '夺', label: '夺它颔下夜明珠', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '不归西海——穷亲这门，认它做什么', fate: '逆', ni: true, effect: { alignEvil: 8, treasure: 'ni_tuolong' } },`,
  ],
  // 41 六耳初现（res:往南海请观音分辨 → 渡必给）
  41: [
    `      { key: '缘', label: '暂不责罚，细观其行', fate: '缘', effect: { alignGood: 6 } },`,
    `      { key: '渡', label: '往南海请观音分辨真假', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '战', label: '棒喝二猴，试其真身', fate: '战', effect: { alignEvil: 8 } },`,
    `      { key: '逆', label: '不与它辨真假——伸手与它相认', fate: '逆', ni: true, effect: { alignEvil: 6 } },`,
  ],
  // 54 九头虫（res:请二郎神与梅山六兄弟 → 渡必给）
  54: [
    `      { key: '战', label: '战九头虫', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '渡', label: '请二郎显圣真君与梅山六兄弟来助', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '夺', label: '夺月牙铲，取回塔顶佛宝舍利', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '放它走——这群妖里只有它知道回去是什么下场', fate: '逆', ni: true, effect: { alignEvil: 8, treasure: 'ni_jiutou' } },`,
  ],
  // 57 朱紫医王：赛太岁=观音坐骑金毛犼（res:请观音来收 → 渡必给）
  57: [
    `      { key: '缘', label: '悬丝诊脉，先医国王', fate: '缘', effect: { alignGood: 8 } },`,
    `      { key: '渡', label: '往南海请观音收犼，还金圣宫娘娘', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '夺', label: '夺它三个金铃', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '问国王三年不朝之罪——得病的到底是谁', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
  ],
  // 63 玉华盗兵：黄狮精（res:请太乙救苦天尊 → 渡必给）
  63: [
    `      { key: '战', label: '夺回三般兵器', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '缘', label: '赴钉耙宴，与它同席吃一盏', fate: '缘', effect: { alignGood: 8, equipPick: 3 } },`,
    `      { key: '渡', label: '上天请太乙救苦天尊来收，给它一个正果', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '逆', label: '不请天尊——它办这场宴，只是想有个人来', fate: '逆', ni: true, effect: { alignEvil: 8, treasure: 'ni_huangshi' } },`,
  ],
  // 64 竹节九狮：九灵元圣=太乙坐骑（res:请天尊 → 渡必给；收为御兽归「逆」）
  64: [
    `      { key: '战', label: '硬接它这一衔，战到它松口', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '渡', label: '请太乙救苦天尊来收，让它回座下', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '隐', label: '顺毛而脱', fate: '隐', effect: { alignGood: 4 } },`,
    `      { key: '缘', label: '与九灵元圣结缘，化敌为友', fate: '缘', effect: { alignGood: 6 } },`,
    `      { key: '逆', label: '收九灵为御兽——它反出天尊座下，不再替谁衔物', fate: '逆', ni: true,`,
      `        subText: '你有足够的兽缘与身阵——若能出阵三只以上的御兽，便以兽领群，说动这头九灵元圣，自封驭兽之主。',`,
      `        effect: { alignEvil: 8, treasure: 'ni_jiuling' } },`,
  ],
  // 65 金平犀灯：三犀假佛（res:请四木禽星 → 渡必给）
  65: [
    `      { key: '战', label: '战到四木禽星下界', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '渡', label: '上奏天庭，请四木禽星收这三犀', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '夺', label: '夺犀角灯', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '不请星官——人跪的从来不是佛，是那三支角', fate: '逆', ni: true, effect: { alignEvil: 8, treasure: 'ni_xiniu' } },`,
  ],
};

W.replaceOptions(NEWOPT);
// 64 隐藏职「驯兽师·百兽归心」原挂「夺」，随收妖归逆迁移
W.replaceInBlock(64, /cond: '夺 \+ 出阵灵兽≥3'/, "cond: '逆 + 出阵灵兽≥3'", 1);
console.log('批次1 完成');
