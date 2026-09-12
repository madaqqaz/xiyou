// _fill_dao_batch3.js — 批次3：补齐「带怪物可有战」「有法宝可有夺」
const W = require('./_trial_opt_writer');

const NEWOPT = {
  6: [
    `      { key: '渡', label: '为随从收尸立碑', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '缘', label: '受老者指引', fate: '缘', effect: { alignGood: 4, gold: 20 } },`,
    `      { key: '战', label: '拔刀护住剩下那两个从人', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '逆', label: '不信老者——灵山的人，凭什么怜悯', fate: '逆', ni: true, effect: { alignEvil: 5 } },`,
  ],
  13: [
    `      { key: '战', label: '决战黄风大圣', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '渡', label: '请灵吉菩萨收风', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '夺', label: '夺它那颗定风珠', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '夺其风源，反吹灵山', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
  ],
  16: [
    `      { key: '战', label: '夺那骷髅串，与河底怨灵一战', fate: '战', effect: { alignEvil: 8 } },`,
    `      { key: '渡', label: '合掌渡那九颅，送其转生', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '隐', label: '绕开河底，避其锋芒', fate: '隐', effect: { alignGood: 4 } },`,
    `      { key: '夺', label: '摘下那串九骷髅——九个没走完的取经人', fate: '夺', effect: { alignEvil: 6, treasure: 'ni_jiukulou' } },`,
    `      { key: '逆', label: '问那九世因——你吞的九世，哪一世最悔', fate: '逆', ni: true, effect: { alignEvil: 4, jiushiyin: true } },`,
  ],
  18: [
    `      { key: '战', label: '一战降之', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '渡', label: '木吒说降，归他一个正果', fate: '渡', effect: { alignGood: 15, ally: 'shaseng' } },`,
    `      { key: '夺', label: '夺他降妖宝杖', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '问罪卷帘，索回九颅', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
  ],
  19: [
    `      { key: '渡', label: '与镇元子论道', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '缘', label: '往南海求观音甘露医树', fate: '缘', effect: { alignGood: 8 } },`,
    `      { key: '夺', label: '偷摘一枚人参果带在路上', fate: '夺', effect: { alignEvil: 8 } },`,
    `      { key: '逆', label: '拔树看根——三千年一果，凭什么只许佛门吃', fate: '逆', ni: true, effect: { alignEvil: 10 } },`,
  ],
  37: [
    `      { key: '战', label: '硬闯泉眼，强行夺水', fate: '战', effect: { alignEvil: 8 } },`,
    `      { key: '渡', label: '与其论法，劝真仙放行', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '夺', label: '取一葫芦子母河水——留着，说不定有用', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '倒转泉眼，破其守泉根本', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
  ],
  38: [
    `      { key: '战', label: '夺泉一战，败如意真仙', fate: '战', effect: { alignEvil: 8 } },`,
    `      { key: '渡', label: '以礼相求，请其解厄', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '夺', label: '夺他如意钩', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '夜取泉水，不告而取', fate: '逆', ni: true, effect: { alignEvil: 6 } },`,
  ],
  40: [
    `      { key: '渡', label: '请昴日星官降之，以音破毒', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '战', label: '以力破法，强战琵琶精', fate: '战', effect: { alignEvil: 8 } },`,
    `      { key: '夺', label: '夺她尾上那根倒马毒桩', fate: '夺', effect: { alignEvil: 8 } },`,
    `      { key: '逆', label: '劝她弃邪西行——雷音寺推你那一把，我替你记着', fate: '逆', ni: true, effect: { alignEvil: 8, treasure: 'ni_xiejing' } },`,
  ],
  45: [
    `      { key: '战', label: '如来收六耳', fate: '战', effect: { alignEvil: 6 } },`,
    `      { key: '渡', label: '与六耳和解', fate: '渡', effect: { alignGood: 15 } },`,
    `      { key: '夺', label: '夺他随心铁杆兵', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '认下「你即我」', fate: '逆', ni: true, effect: { alignEvil: 15, d29Ni: true } },`,
  ],
  52: [
    `      { key: '渡', label: '劝龙兵回头', fate: '渡', effect: { alignGood: 15 } },`,
    `      { key: '战', label: '杀进这场龙宫夜宴', fate: '战', effect: { alignEvil: 6 } },`,
    `      { key: '夺', label: '夺九叶灵芝草', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '逼问龙兵', fate: '逆', ni: true, effect: { alignEvil: 10 } },`,
  ],
  56: [
    `      { key: '渡', label: '请弥勒来收，归他一个座下', fate: '渡', effect: { alignGood: 12 } },`,
    `      { key: '战', label: '一棒砸了这座假雷音', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '夺', label: '夺金铙法器，破其假阵', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '夺人种袋——他想坐的，不过是那张位子', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
  ],
  58: [
    `      { key: '战', label: '破尸山', fate: '战', effect: { alignGood: 3 } },`,
    `      { key: '渡', label: '超度亡魂', fate: '渡', effect: { alignGood: 20 } },`,
    `      { key: '夺', label: '夺阴阳二气瓶', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '取尸骨为甲', fate: '逆', ni: true, effect: { alignEvil: 10 } },`,
  ],
  76: [
    `      { key: '渡', label: '问如来·请老君收牛', fate: '渡', effect: { alignGood: 28 } },`,
    `      { key: '隐', label: '隐于莲座下，窃听佛问', fate: '隐', effect: { alignGood: 2 } },`,
    `      { key: '战', label: '与这座兜率宫打一场', fate: '战', effect: { alignEvil: 12 } },`,
    `      { key: '逆', label: '闯兜率宫·质问老君', fate: '逆', ni: true, effect: { alignEvil: 22 } },`,
  ],
  77: [
    `      { key: '渡', label: '归入经书', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '隐', label: '携碑遁走', fate: '隐', effect: { alignGood: 2 } },`,
    `      { key: '战', label: '与这具大圣残躯打完最后一战', fate: '战', effect: { alignEvil: 8 } },`,
    `      { key: '逆', label: '碎无字碑', fate: '逆', ni: true, effect: { alignEvil: 15 } },`,
  ],
};

W.replaceOptions(NEWOPT);
console.log('批次3 完成');
