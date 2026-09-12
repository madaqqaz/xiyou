// _inject_hidden_ch4_6.js — 为章4/5/6 补全的隐藏职注入 TRIAL_LIB 节点 hidden 字段（修正版）
// 单遍内存改写 + 一次 writeFileSync（避免多次 Edit 互踩）。
// 兼容 options 闭合两种写法： `\n    ],` 与 `\n    ] },`。
'use strict';
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', 'js', 'trials81.js');
let s = fs.readFileSync(F, 'utf8');

// 下一个节点的起始位置（界定当前块，避免误入 RETURN_TRIALS 同名块）
function nextNodeStart(s, from) {
  const m = s.slice(from + 1).match(/\n  \d+: \{ id: \d+,/);
  return m ? from + 1 + m.index : s.length;
}

// 已完成（已在上一轮注入 / 已有 hidden）的节点不再处理：37/40/46/52/53 + 49(罗刹·铁扇)
const NEW = [
  [28, "hidden: { hero: 'tangseng', cond: '渡 + 善≥25', job: '车迟·谕道', hint: '车迟国三场斗法择「渡」、善行满二十五——谕道于民，僧亦可帅', desc: '车迟三场斗法立坛祈雨渡旱，谕众以道——金蝉再显（唐僧·车迟·谕道）' },"],
  [31, "hidden: { hero: 'bajie', cond: '战 + 战≥2', job: '车迟·力士', hint: '车迟国三场斗法一贯以「战」收场——力士之躯，越战越雄', desc: '车迟斗法扛桩力胜虎力，以肩承山（八戒·车迟·力士）' },"],
  [32, "hidden: { hero: 'shaseng', cond: '渡 + 善≥20', job: '沙·问渡', hint: '通天河择「渡」、善行满二十——问龟亦问己，渡人先渡心', desc: '通天河畔问老龟寿数、以渡渡之——卷帘再问渡（沙僧·沙·问渡）' },"],
  [42, "hidden: { hero: 'shaseng', cond: '渡 + 善≥20', job: '沙·辨假', hint: '真假猴王择「渡」、善行满二十——渡假存真，沙僧慧眼', desc: '真假猴王以渡辨假，卷帘慧眼（沙僧·沙·辨假）' },"],
  [48, "hidden: { hero: 'xiaobailong', cond: '渡 + 善≥25', job: '白龙·吐水', hint: '积雷山牛魔王一战择「渡」、善行满二十五——吐水化雨，龙克真火', desc: '积雷山牛魔王真身前吐水克火，白龙化雨（小白龙·白龙·吐水）' },"],
];

let nA = 0, skip = 0;
NEW.forEach(([id, hiddenLine]) => {
  const bi = s.indexOf('\n  ' + id + ': { id: ' + id + ',');
  if (bi < 0) { console.log('  ✗ 未找到块 难' + id); return; }
  const ne = nextNodeStart(s, bi);
  const block = s.slice(bi, ne);
  if (/\n\s{4}hidden:/.test(block)) { console.log('  · 难' + id + ' 已有 hidden，跳过'); skip++; return; }
  const oi = block.indexOf('options: [');
  if (oi < 0) { console.log('  ✗ 难' + id + ' 无 options'); return; }
  // 兼容 `\n    ],` 与 `\n    ] },`：取 options 之后的首个 4 空格 `]`
  const ci = block.indexOf('\n    ]', oi);
  if (ci < 0) { console.log('  ✗ 难' + id + ' 未定位 options 闭合'); return; }
  const insAt = bi + ci + '\n    ]'.length;
  s = s.slice(0, insAt) + '\n    ' + hiddenLine + s.slice(insAt);
  nA++;
});

fs.writeFileSync(F, s, 'utf8');
console.log('隐藏职节点注入 ' + nA + '/' + NEW.length + '；跳过已有 ' + skip);
