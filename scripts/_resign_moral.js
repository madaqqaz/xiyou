// _resign_moral.js — 战/隐善恶按佛法逻辑重签（2026-09-12 六道整体平衡）
//
// 佛法判据（写入项目规范，后续一律照此）：
//  【战】降魔护法是善，嗔恚杀伐是恶，二者之间的"击败/擒拿"取中性微值。
//    - 为护众生而战（护母、除妖护民、降伏非杀）→ 善
//    - 泄愤、赶尽杀绝、虐杀、怒闯、滥杀 → 恶
//    - 未伤性命的力取（夺水、夺泉、擒拿）→ 中性微恶
//  【隐】大乘斥"自了汉"为焦芽败种——见苦不救非善；不妄动、待机缘、忍辱则是善巧方便。
//    - 见死不救 / 弃责而逃 / 袖手旁观 / 退转弃法 → 恶
//    - 避其锋芒、不妄开杀戒、忍辱待时、识破而不动 → 中性微善
//    - 纯然避世不害人 → 中性（1）
'use strict';
const W = require('./_trial_opt_writer');

// [难号, 选项 label, 善(或 null), 恶(或 null)]
const FIX = [
  // ---------------- 战 ----------------
  [1, '夺鞭立威，驱而不伤', null, 3],   // 驱而不伤：立威非杀，微恶
  [2, '护母突围，夺路而走', 4, null],   // 护母是孝、是护生 —— 原 -8 误判为恶
  [14, '掷石入河，激妖出阵', null, 3],  // 挑衅起战，微恶（未伤命）
  [36, '翻江一战，擒那金鱼', null, 3],  // 擒非杀，原 -10 过重
  [37, '硬闯泉眼，强行夺水', null, 3],  // 夺水自救未伤命，微恶
  [38, '夺泉一战，败如意真仙', null, 3],// 败而非杀，微恶
  [41, '棒喝二猴，试其真身', null, 2],  // 棒喝是禅门接机，试而非杀
  [45, '如来收六耳', 2, null],          // 交如来裁决，非己杀
  [49, '降伏牛魔，得真扇灭焰', 3, null],// 降伏非杀，且为灭火救民 → 护法善举（原 -10 完全反了）
  [59, '追白鹿至清华洞，一战除妖', 3, null], // 除妖护民 = 护法（原 -8 误判）
  // ---------------- 隐 ----------------
  [1, '任碎石盖身，避世无痕', 1, null],  // 避世不害人，中性
  [2, '藏入棺椁，权且避世', null, 2],    // 母仍在危而自藏 → 微恶（原 +6）
  [3, '合眼不看那轮满月印', 1, null],    // 中性
  [16, '绕开河底，避其锋芒', null, 2],   // 绕开则九颅怨灵无人渡 → 微恶
  [34, '贴冰潜行，听它凿到天亮', null, 2], // 听任妖凿冰、渔村悬命 → 微恶
  [69, '不涉月宫恩怨，抽身而退', 1, null], // 中性（不涉因果）
  [78, '沿岸寻桥，绕开此渡', null, 3],   // 绕开凌云渡=退转弃解脱 → 恶
  [81, '携湿经隐世', null, 6],           // 得经而隐、不传法 = 自了汉（原 +8 完全反了）
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

function main() {
  const st = W.load();
  const miss = [];
  FIX.forEach(([id, label, good, evil]) => {
    let i = findOptLine(st, id, label);
    if (i < 0) { miss.push('✗ 未找到 难' + id + ' ' + label); return; }
    // 选项对象可能跨行：从 label 行起向下扫到对象闭合，统一在整段文本上替换
    let depth = 0, e = i, seg = [];
    for (; e < st.lines.length; e++) {
      seg.push(st.lines[e]);
      for (const ch of st.lines[e]) { if (ch === '{' || ch === '[') depth++; else if (ch === '}' || ch === ']') depth--; }
      if (depth <= 0) break;
    }
    const text = seg.join('\n');
    const want = good != null ? 'alignGood: ' + good : 'alignEvil: ' + evil;
    let out;
    if (/align(Good|Evil):\s*-?\d+/.test(text)) {
      out = text.replace(/align(Good|Evil):\s*-?\d+/, want);
    } else {
      // 无善恶字段：插到 effect 内或对象末尾（插在最后一个 } 之前）
      const li = text.lastIndexOf('}');
      out = text.slice(0, li) + ', ' + want + ' ' + text.slice(li);
    }
    const outLines = out.split('\n');
    st.lines.splice(i, seg.length, ...outLines);
  });
  require('fs').writeFileSync(require('path').join(__dirname, '..', 'js', 'trials81.js'), st.BOM + st.lines.join(st.EOL), 'utf8');
  miss.forEach((m) => console.log(m));
  console.log('重签 ' + (FIX.length - miss.length) + '/' + FIX.length + ' 条（战 10 / 隐 8）');
}
main();
