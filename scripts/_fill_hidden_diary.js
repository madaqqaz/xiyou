// _fill_hidden_diary.js — 参照「冒险日记事件装备体系」新增 4 个隐藏职，并给全部隐藏职补 hint
'use strict';
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', 'js', 'trials81.js');
let s = fs.readFileSync(F, 'utf8');

// —— A) 在指定难的 options 闭合后插入 hidden 字段 ——
const NEW = [
  [13, "hidden: { hero: 'tangseng', cond: '渡 + 日记装备≥1', job: '定风金蝉', desc: '缘路拾奇，风不能迷其眼（唐僧·定风金蝉）', hint: '走「渡」收黄风，并把路上事件所得的奇物记进日记——日记载物愈多，风愈迷不了你' },"],
  [50, "hidden: { hero: 'wukong', cond: '夺 + 日记装备≥3', job: '九头·掠宝', desc: '逆夺九虫佛宝，日记载其名（悟空·九头掠宝）', hint: '选「夺」取碧波潭佛宝，并持有≥3件冒险日记奇物——夺来的与记下的，都是你的凭证' },"],
  [66, "hidden: { hero: 'bajie', cond: '渡 + 日记装备≥2', job: '净坛·拾遗', desc: '渡了玉兔，行囊里多了几件奇物（八戒·净坛拾遗）', hint: '选「渡」放玉兔回月，并持有≥2件冒险日记奇物——你渡人，也拾奇' },"],
  [77, "hidden: { hero: 'all', cond: '逆 + 日记装备≥4', job: '行旅录主', desc: '一路奇物皆入日记，逆上灵山以物证道（全英雄·行旅录主）', hint: '选「逆」碎无字碑，并持有≥4件冒险日记奇物——以一路所得之奇物，证你逆道' },"],
];

let nA = 0;
NEW.forEach(([id, hiddenLine]) => {
  const bi = s.indexOf('\n  ' + id + ': { id: ' + id + ',');
  if (bi < 0) { console.log('  未找到块 难' + id); return; }
  const seg = s.slice(bi);
  const oi = seg.indexOf('options: [');
  if (oi < 0) { console.log('  难' + id + ' 无 options'); return; }
  // 找到 options 之后的第一个 "    ],"（4空格+方括号闭）即选项数组结束
  let k = oi, close = -1;
  while (k < seg.length) {
    const ci = seg.indexOf('\n    ],', k);
    if (ci < 0) break;
    close = ci; break;
  }
  if (close < 0) { console.log('  难' + id + ' 未定位 options 闭合'); return; }
  const insAt = bi + close + '\n    ],'.length;
  s = s.slice(0, insAt) + '\n    ' + hiddenLine + s.slice(insAt);
  nA++;
});

// —— B) 给已有隐藏职补 hint（匹配 hidden 块内 job: 'X'） ——
const HINTS = {
  '弃经金蝉': '序章碎金钵、走逆——你自弃经那一刻，便已入逆道之始',
  '逆鳞白龙': '鹰愁涧择「逆」取避水珠，龙族的逆鳞只认逆路之人',
  '斗战明王': '连战三场且一贯以战收场——战意不灭者，可窥明王之路',
  '卷帘镇妖': '流沙河择「问九世因」、持降妖念珠——九世尸骨，等你镇压',
  '卷帘复权': '踏实走「渡」、善行满三十——顺命者不必积恶也能复权',
  '金蝉了缘': '多走「缘」、缘路连三——了却因果，方得自在',
  '悟空的空': '三打白骨时择「渡」立坟、持救命毫毛——空而不空',
  '齐天残念': '贬退心猿择「逆」、持金箍、且夺过至宝——紧箍化敌血',
  '天蓬·负岳': '走「渡」、善行满三十——以背承山，以伤还伤',
  '吞天净坛': '平顶山择「逆」夺紫金红葫芦——吞食万物，饱食成盾',
  '天蓬复称': '乌鸡井龙择「立新王」——你扶的王，记得你',
  '白龙·御水': '一贯以「隐」收场三难——藏身水脉，龙归其渊',
  '夺宝龙子': '曾战且夺过至宝——龙子也能夺天',
  '白衣渡客': '一贯以「隐」三难——白衣渡人，不留姓名',
  '弃经者': '碎金钵走逆、善行满二十——弃经者亦能行善',
  '齐天·大圣': '逆上灵山、夺过至宝——大圣之名，自己写',
  '罗刹·铁扇': '第47难曾选「渡」、此劫再走「渡」——铁扇虽利，渡人更利',
  '六耳·残': '第29难曾选「逆」、且已觉醒齐天·大圣——残躯承大圣之逆',
  '驯兽师·百兽归心': '收九灵为御兽、出阵灵兽≥3、着御兽套——百兽归心',
  '判官金蝉': '一贯以「隐」三难、持索命簿残卷——阴司账薄，你来做主',
  '卷帘夺宴': '夺道连三且夺过两件至宝——宴席之上，夺者入座',
  '逆兽师·百逆归心': '逆道驯兽、出阵灵兽≥3、着御兽套——逆修之兽更凶',
};
let nB = 0;
Object.keys(HINTS).forEach((job) => {
  const tok = "job: '" + job + "'";
  const i = s.indexOf(tok);
  if (i < 0) { console.log('  未命中 hint job ' + job); return; }
  // 若已含 hint 则跳过
  if (s.slice(i, i + 200).indexOf('hint:') >= 0) { nB++; return; }
  s = s.slice(0, i + tok.length) + ", hint: '" + HINTS[job] + "'" + s.slice(i + tok.length);
  nB++;
});

fs.writeFileSync(F, s, 'utf8');
console.log('新隐藏职插入 ' + nA + '/' + NEW.length + '；已有 hint 补全 ' + nB + '/' + Object.keys(HINTS).length);
