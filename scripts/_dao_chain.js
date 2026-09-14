// _dao_chain.js — 复合劫难「六道抉择链」挂接
// 语义：本难落子 → 记 chain 标记 → 同复合节点的后续子难读标记改写自己的战场（chainMul）。
// 例：黄风岭先夺定风丹 → 黄风大圣失其风 → 难13 决战难度 ×0.78。
'use strict';
const fs = require('fs');
const path = require('path');
const W = require('./_trial_opt_writer');

const LINKS = [
  // —— 黄风岭（10-13）：定风丹是黄风怪的「风」之根本，先夺则后战皆减 ——
  [11, '趁风眼大开，夺它定风丹', "chain: 'hf_dan'"],
  [11, '它偷的不过一盏清油——佛门不认它修的道', "chain: 'hf_ni'"],
  [12, '请灵吉收风', "chainMul: ['hf_dan', 0.85]"],
  [12, '逆风而上，夺它风袋', "chainMul: ['hf_dan', 0.85]"],
  [13, '决战黄风大圣', "chainMul: ['hf_dan', 0.78]"],
  [13, '夺它那颗定风珠', "chainMul: ['hf_ni', 1.12]"],
  // —— 火焰山（46-49）：先逼出的是假扇，火更旺；偷得扇柄则牛魔王失其倚 ——
  [46, '变虫入腹，逼她交扇', "chain: 'hy_jiashan'"],
  [47, '持假扇怒闯芭蕉洞', "chainMul: ['hy_jiashan', 1.15]"],
  [48, '夜袭摩云洞，盗那扇柄', "chain: 'hy_bing'"],
  [49, '降伏牛魔，得真扇灭焰', "chainMul: ['hy_bing', 0.85]"],
  [49, '巧夺芭蕉扇，拂焰而去', "chainMul: ['hy_jiashan', 0.90]"],
  // —— 祭赛国（50-54）：先夺舍利则九头虫失其眉心之光 ——
  [50, '夺佛宝舍利，自取其一', "chain: 'js_sheli'"],
  [50, '夺回舍利超度', "chain: 'js_du'"],
  [54, '战九头虫', "chainMul: ['js_sheli', 0.85]"],
  [54, '夺月牙铲，取回塔顶佛宝舍利', "chainMul: ['js_sheli', 0.85]"],
  // —— 天竺玉兔（66-72）：夺其捣药杵则金銮殿上玉兔失兵 ——
  [70, '夺那捣药杵，破其兵势', "chain: 'tz_chu'"],
  [72, '一棒降玉兔，了结天竺之乱', "chainMul: ['tz_chu', 0.85]"],
  [72, '收其捣药杵为宝', "chainMul: ['tz_chu', 0.80]"],
  // —— 通天河（33-36）：先夺金身则香火断，金鱼失其千年供奉 ——
  [33, '夺灵感庙金身，熔作路上盘缠', "chain: 'tt_jinshen'"],
  [36, '翻江一战，擒那金鱼', "chainMul: ['tt_jinshen', 0.88]"],
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

function endOfOpt(lines, start) {
  let depth = 0;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch === '{' || ch === '[') depth++; else if (ch === '}' || ch === ']') depth--; }
    if (depth <= 0) return i;
  }
  return -1;
}

const st = W.load();
let ok = 0; const miss = [];
LINKS.forEach(([id, label, add]) => {
  const i = findOptLine(st, id, label);
  if (i < 0) { miss.push('✗ 未找到 难' + id + ' ' + label); return; }
  const e = endOfOpt(st.lines, i);
  if (e < 0) { miss.push('✗ 未闭合 难' + id); return; }
  if (/chain:|chainMul:/.test(st.lines[e])) { miss.push('· 已有 难' + id); return; }
  const line = st.lines[e];
  const li = line.lastIndexOf('}');
  if (li < 0) { miss.push('✗ 无闭合符 难' + id); return; }
  st.lines[e] = line.slice(0, li) + ', ' + add + ' ' + line.slice(li);
  ok++;
});
fs.writeFileSync(path.join(__dirname, '..', 'js', 'trials81.js'), st.BOM + st.lines.join(st.EOL), 'utf8');
miss.forEach((m) => console.log(m));
console.log('抉择链挂接 ' + ok + '/' + LINKS.length);
