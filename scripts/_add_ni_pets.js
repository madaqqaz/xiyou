// _add_ni_pets.js — 新增「逆兽」宠物组：八十一难里有来历的妖王，被【逆】道说动后可收为御兽
// 规则依据：data_trial_dao.js —— boss/pet=1 的难，逆选项可「说动其反出主家 / 收为逆兽」
// 落地：逆选项 effect.treasure = 'ni_xxx'，由 game_event_2 的 lootById 直接授予
// 保行尾：按原文件分隔符切分 splice 回写，不重写整文件
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'js', 'equipment.js');
const raw = fs.readFileSync(SRC, 'utf8');
const nl = /\r\n/.test(raw) ? '\r\n' : '\n';
const lines = raw.split(/\r\n|\n/);

const NI = [
  // 双叉岭 / 两界山
  ['ni_sanshou', '双叉岭三兽', 10, 30, 0.03, 0, 0, 0, 1, '寅将军·熊山君·特处士三兽同契（逆兽·反出无主之山）', 'guard'],
  ['ni_yulong', '玉龙·未受鞍', 16, 40, 0, 0, 0.05, 0, 2, '西海三太子（逆兽·不回龙宫·不受那副鞍）', 'dragon_aura'],
  ['ni_huxianfeng', '虎先锋', 20, 22, 0, 0, 0.04, 0.04, 2, '黄风岭前部（逆兽·第一次有人问它想守什么）', 'rend'],
  ['ni_huangfeng', '黄毛貂鼠', 14, 26, 0, 8, 0.08, 0, 3, '灵山脚下偷油得道（逆兽·佛门不认它修的道）', null],
  ['ni_baigu', '白骨夫人', 12, 10, 0, 6, 0.12, 0.06, 3, '尸魔三戏（逆兽·白骨观·以骨同行）', null],
  // 流沙河 / 五庄观 / 黄袍
  ['ni_jiukulou', '九骷髅', 18, 20, 0.02, 0, 0, 0, 3, '九个取经人没走完的路（逆兽·挂在颈上的九次西行）', 'rend'],
  ['ni_kui', '奎木狼', 22, 30, 0, 0, 0.03, 0.06, 4, '二十八宿下界（逆兽·天庭当逃犯，你当他是人）', null],
  // 火云洞
  ['ni_lutong', '炉边童子', 10, 24, 0.02, 18, 0, 0, 4, '金角银角（逆兽·五件宝贝都不是它们的）', null],
  ['ni_qingshi', '青毛狮子', 24, 45, 0.04, 0, 0, 0, 4, '文殊坐骑（逆兽·仇报完了，自己也成了罪）', null],
  ['ni_tuolong', '黑水鼍龙', 18, 35, 0.03, 4, 0.04, 0, 4, '西海龙族穷亲（逆兽·它只想有个自己的水府）', 'dragon_aura'],
  ['ni_honghai', '红孩儿', 12, 28, 0, 26, 0.02, 0.05, 4, '牛魔王之子（逆兽·观音要收它，问过它了吗）', null],
  // 通天河 / 金兜
  ['ni_jinyu', '灵感金鱼', 16, 35, 0.02, 10, 0.05, 0, 5, '观音莲池听经百年（逆兽·被放生就成了妖）', null],
  ['ni_qingniu', '板角青牛', 20, 70, 0.08, 0, 0, 0, 5, '老君青牛（逆兽·主人从未把它当过别的什么）', 'rockwall'],
  ['ni_xiejing', '琵琶蝎', 18, 20, 0, 8, 0.06, 0.10, 5, '雷音听经之虫（逆兽·它反，是被推出来的）', 'poison'],
  // 火焰山
  ['ni_luocha', '罗刹女', 8, 34, 0.02, 24, 0.02, 0, 6, '铁扇公主（逆兽·她守扇，是替红孩儿守的）', null],
  ['ni_niumo', '牛魔王·未降', 30, 50, 0.05, 0, 0, 0.05, 6, '平天大圣（逆兽·他本就反过一次）', 'berserk'],
  // 祭赛 / 狮驼
  ['ni_jiutou', '九头虫', 26, 40, 0.03, 0, 0.05, 0.04, 6, '碧波潭驸马（逆兽·八十一难里唯一逃出去的妖）', null],
  ['ni_huangmei', '黄眉·假佛', 14, 32, 0.03, 22, 0, 0, 6, '弥勒司磬童儿（逆兽·他只想坐一回那张位子）', null],
  ['ni_jinmaohou', '金毛犼', 20, 40, 0.04, 0, 0, 0, 6, '观音坐骑（逆兽·三年无人问它一句苦）', 'guard'],
  ['ni_shujing', '十八公', 4, 60, 0.05, 14, 0, 0, 6, '荆棘岭树精（逆兽·它只想谈一夜诗）', 'regen'],
  // 比丘 / 玉华
  ['ni_bailu', '寿星白鹿', 8, 50, 0.02, 12, 0.06, 0, 7, '南极仙翁坐骑（逆兽·拉了千年车）', 'whisk'],
  ['ni_baozi', '艾叶花皮豹', 16, 24, 0, 0, 0.06, 0.05, 7, '隐雾山南山大王（逆兽·不害人，只抢些行李）', null],
  ['ni_huangshi', '黄狮精', 14, 45, 0.04, 0, 0, 0, 7, '豹头山（逆兽·八十一难里唯一一个像人的妖）', 'guard'],
  ['ni_jiuling', '九灵元圣', 34, 80, 0.10, 0, 0, 0, 7, '太乙坐骑九头狮（逆兽·一声吼开九幽·驯兽师御兽）', 'berserk'],
  // 天竺
  ['ni_xiniu', '辟寒犀', 18, 55, 0.06, 0, 0, 0, 7, '金平府假佛（逆兽·人跪的不是佛，是三支犀角）', 'stoneheart'],
  ['ni_yutu', '捣药玉兔', 10, 28, 0, 18, 0.10, 0.04, 7, '广寒宫玉兔（逆兽·它下界只为报那一记掌）', 'whisk'],
  ['ni_laoyuan', '通天老鼋', 6, 120, 0.12, 0, 0, 0, 8, '通天河老鼋（逆兽·它问寿数，如来没答）', 'rockwall'],
];

const mk = ([id, name, atk, hp, dr, matk, eva, cri, ch, tail, passive]) =>
  `  { id: '${id}', name: '${name}', slot: 'pet', atk: ${atk}, hp: ${hp}, dr: ${dr}, matk: ${matk}, eva: ${eva}, cri: ${cri}, ` +
  `desc: '攻+${atk} 血+${hp}${matk ? ' 愿伤+' + matk : ''}${dr ? ' 减伤+' + Math.round(dr * 100) + '%' : ''}${eva ? ' 闪避+' + Math.round(eva * 100) + '%' : ''}${cri ? ' 暴击+' + Math.round(cri * 100) + '%' : ''}（${tail}）', ` +
  `set: '御兽', setTier: 2, chapter: ${ch}, quality: 2, petPassive: ${passive ? "'" + passive + "'" : 'null'}, branch: 'ni', virtue: '逆', src: '逆道·${name}·说动反出' },`;

const block = ['  // —— 逆兽组（V8.7x 六道供给规则）：八十一难中「有来历的妖王」，【逆】道说动后可收为御兽 ——',
  '  // 获得途径：对应劫难的逆选项（effect.treasure = id），不进普通掉落；逆道专属，御兽套共鸣',
  '  // 佛法口径：收妖不是奴役——是给它们一条不被收编、不入轮回的路',
  ...NI.map(mk)];

// 1) 插入到 tongbishiyuan 行之后
let idx = lines.findIndex((l) => l.indexOf("id: 'tongbishiyuan'") >= 0);
if (idx < 0) { console.error('未找到 tongbishiyuan 锚点'); process.exit(1); }
if (lines.findIndex((l) => l.indexOf("id: 'ni_sanshou'") >= 0) >= 0) { console.log('逆兽组已存在，跳过插入'); }
else { lines.splice(idx + 1, 0, ...block); }

// 2) 追加逆兽羁绊
let fidx = lines.findIndex((l) => /NDX\.PET_FETTERS = \[/.test(l));
if (fidx >= 0) {
  const hasNi = lines.slice(fidx, fidx + 12).some((l) => l.indexOf('逆兽同契') >= 0);
  if (!hasNi) {
    let end = fidx;
    while (end < lines.length && !/\];/.test(lines[end])) end++;
    const fetters = [
      "    { id: '逆兽同契', a: 'ni_huangshi', b: 'ni_jiuling', hpPct: 0.25, atkPct: 0.12, desc: '逆兽同契（黄狮精+九灵元圣）：全队生命 +25%、攻击 +12%——说动的妖越多，反的越稳' },",
      "    { id: '火焰余脉', a: 'ni_honghai', b: 'ni_niumo', matkPct: 0.30, desc: '火焰余脉（红孩儿+牛魔王）：愿伤 +30%——积雷山一门三口，都不肯被收编' },",
      "    { id: '佛门弃徒', a: 'ni_huangfeng', b: 'ni_xiejing', cri: 0.08, desc: '佛门弃徒（黄毛貂鼠+琵琶蝎）：暴击 +8%——一个偷油被追，一个听经被推' }",
    ];
    // 末尾一行去掉逗号处理：在 ]; 前插入，需保证上一行带逗号
    if (!/,\s*$/.test(lines[end - 1])) lines[end - 1] = lines[end - 1].replace(/\s*$/, ',');
    lines.splice(end, 0, ...fetters);
  }
}

fs.writeFileSync(SRC, lines.join(nl), 'utf8');
console.log('逆兽组写入完成，共 ' + NI.length + ' 只；行尾=' + (nl === '\r\n' ? 'CRLF' : 'LF'));
