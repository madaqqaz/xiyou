// _duo_rebalance.js — 夺道重构：分级（T0 天花板/T1 高难/soft 顺手）+ 改道 + 奖励绑定
// 规则：真夺必须开战（fight:true）且难度为同期战力天花板；伪夺（顺手牵羊/取回己物）改归真实道。
//
// 🔴 【已废弃 · 2026-09-25 标注】切勿直接重跑！
//   本脚本是 2026-09-12 的一次性注入器，当时的输出目标 js/trials81.js 是单文件；
//   该文件现已重构为「聚合器桩」（仅 15 行，只 require trials_ch1..9 + trials_return）。
//   ⇒ 重跑本脚本会**用旧数据整体覆盖** js/trials81.js，摧毁 81 难入口。
//   保留仅供追溯：T0/T1 的难度档位（bd）与奖励绑定记录在此。
//   2026-09-25：T1 中 11 件凑数法宝已按 R6 退役（见 js/data_treasure_evo.js 的 T1_RETIRED），此处同步移除。
'use strict';
const fs = require('fs');
const path = require('path');
const W = require('./_trial_opt_writer');

// ---- T0：原著根本法宝，夺之则妖失其依。难度=天花板(1.55~1.65)，奖励=专属法宝 + 隐藏升级链 ----
const T0 = [
  [11, '趁风眼大开，夺它定风丹', 1.58, 'tre_dingfengdan'],
  [19, '偷摘一枚人参果带在路上', 1.60, 'tre_renshenguo'],
  [21, '夺那紧箍，自此无束', 1.62, 'tre_jingu'],
  [24, '夺紫金红葫芦与羊脂玉净瓶', 1.60, 'tre_hulu'],
  [27, '夺它三昧真火', 1.62, 'tre_sanmei'],
  [35, '趁乱夺琢，金兜归你', 1.65, 'tre_jingangzhuo'],
  [40, '夺她尾上那根倒马毒桩', 1.62, 'tre_daomadu'],
  [49, '巧夺芭蕉扇，拂焰而去', 1.65, 'tre_bajiaoshan'],
  [50, '夺佛宝舍利，自取其一', 1.60, 'tre_sheli'],
  [56, '夺金铙法器，破其假阵', 1.60, 'tre_jinnao'],
  [57, '夺它三个金铃', 1.58, 'tre_jinling'],
  [58, '夺阴阳二气瓶', 1.62, 'tre_yinyangping'],
];
// ---- T1：有名法宝，难度 1.40~1.48，奖励=稀有装备（无升级链）----
// 【2026-09-25 R6 退役】下列 11 条已取消（妖怪随身道具 / 场所产物），不再挂载：
//   风袋 tre_fengdai · 灵感庙金身 tre_jinshen · 如意钩 tre_ruyigou · 塔顶佛光 tre_foguang
//   月牙铲 tre_yueyachan · 千年木心 tre_muxin · 剃度刀 tre_tidao · 雨符 tre_yufu
//   犀角灯 tre_xijiaodeng · 捣药杵 tre_daoyaochu · 捣药杵·月华 tre_daoyaochu_yue
const T1 = [
  [13, '夺它那颗定风珠', 1.48, 'tre_dingfengzhu'],
  [16, '摘下那串九骷髅——九个没走完的取经人', 1.42, 'ni_jiukulou'],
  [18, '夺他降妖宝杖', 1.42, 'tre_baozhang'],
  [26, '夺它颔下夜明珠', 1.40, 'tre_yemingzhu'],
  [45, '夺他随心铁杆兵', 1.48, 'tre_suixinbing'],
  [46, '变虫入腹，逼她交扇', 1.50, 'tre_bajiaoshan_ying'],
  [52, '夺九叶灵芝草', 1.42, 'tre_lingzhi'],
];
// ---- 改道：这些不是「夺宝」，是顺手取物/逃遁/力战 → 归其真实道 ----
const REDAO = [
  [17, '夺那渡牌，自掌水路', '战'],
  [37, '取一葫芦子母河水——留着，说不定有用', '缘'],
  [39, '夺通关文牒，连夜出城', '隐'],
  [48, '夜袭摩云洞，盗那扇柄', '隐'],
  [53, '黑吃黑，夺下盗草赃物', '战'],
  [66, '夺婚书聘礼，拂袖而去', '隐'],
];

function findOptLine(st, id, label) {
  const { lines } = st;
  const { starts, blockOf } = W.indexBlocks(lines);
  const s = starts.find((x) => x.id === id);
  if (!s) return -1;
  for (let i = s.line; i < blockOf[id]; i++) {
    if (lines[i].indexOf("label: '" + label + "'") >= 0) return i;
  }
  return -1;
}

// 从 optLine 起，找选项对象结束行（第一个以 }, 或 } 结尾且其内括号已配平的行）
function endOfOpt(lines, start) {
  let depth = 0;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch === '{' || ch === '[') depth++; else if (ch === '}' || ch === ']') depth--; }
    if (depth <= 0) return i;
  }
  return -1;
}

function main() {
  const st = W.load();
  const report = [];
  // 1) 改道
  REDAO.forEach(([id, label, dao]) => {
    const i = findOptLine(st, id, label);
    if (i < 0) { report.push('✗ 改道失败 难' + id + ' ' + label); return; }
    const before = st.lines[i];
    st.lines[i] = st.lines[i].replace(/key: '夺'/, "key: '" + dao + "'").replace(/fate: '夺'/, "fate: '" + dao + "'");
    report.push((st.lines[i] === before ? '✗ 未变 ' : '· 改道 ') + '难' + id + ' 夺→' + dao + ' | ' + label);
  });
  // 2) 真夺注入
  const inject = (list, tier) => {
    list.forEach(([id, label, bd, tre]) => {
      const i = findOptLine(st, id, label);
      if (i < 0) { report.push('✗ 未找到 难' + id + ' ' + label); return; }
      const e = endOfOpt(st.lines, i);
      if (e < 0) { report.push('✗ 未闭合 难' + id); return; }
      let line = st.lines[e];
      if (/fight:|bossDiff:/.test(line)) { report.push('· 已有 难' + id); return; }
      const add = `fight: true, bossDiff: ${bd}, duo: '${tier}', treasure: '${tre}'`;
      // 关键：最后一个 '}' 才是选项对象闭合（effect:{...} 内部还有 '}'），
      // 必须插在它「之前」；插在行尾逗号后会变成对象外的游离字段（历史踩坑）。
      const li = line.lastIndexOf('}');
      if (li < 0) { report.push('✗ 无闭合 难' + id); return; }
      line = line.slice(0, li) + ', ' + add + ' ' + line.slice(li);
      st.lines[e] = line;
      report.push(`· ${tier} 难${id} bd=${bd} → ${tre}`);
    });
  };
  inject(T0, 'T0');
  inject(T1, 'T1');
  require('./_trial_opt_writer').load; // noop
  fs.writeFileSync(path.join(__dirname, '..', 'js', 'trials81.js'), st.BOM + st.lines.join(st.EOL), 'utf8');
  report.forEach((r) => console.log(r));
  console.log('\n真夺 T0=' + T0.length + ' T1=' + T1.length + ' 改道=' + REDAO.length);
}
main();
