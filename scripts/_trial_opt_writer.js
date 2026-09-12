// _trial_opt_writer.js — trials81.js 选项块精确替换器（保 BOM / 保行尾 / 幂等）
// 用法：
//   const w = require('./_trial_opt_writer');
//   w.replaceOptions({ 24: [ '选项行...', ... ], ... });   // 行需自带 6 空格缩进与尾逗号
//   w.replaceInBlock(64, /cond: '夺 \+ 出阵灵兽≥3'/, "cond: '逆 + 出阵灵兽≥3'");
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'js', 'trials81.js');

function load() {
  let raw = fs.readFileSync(SRC, 'utf8');
  const BOM = raw.charCodeAt(0) === 0xfeff ? '\uFEFF' : '';
  if (BOM) raw = raw.slice(1);
  const crlf = (raw.match(/\r\n/g) || []).length;
  const lf = (raw.match(/\n/g) || []).length;
  const EOL = crlf * 2 > lf ? '\r\n' : '\n';
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  return { BOM, EOL, lines };
}

function indexBlocks(lines) {
  const starts = [];
  lines.forEach((l, i) => { const m = l.match(/^ {2}(\d+): \{ id: (\d+),/); if (m) starts.push({ id: +m[1], line: i }); });
  starts.sort((a, b) => a.line - b.line);
  const blockOf = {};
  starts.forEach((s, i) => { blockOf[s.id] = (i + 1 < starts.length) ? starts[i + 1].line : lines.length; });
  return { starts, blockOf };
}

function save(state) {
  fs.writeFileSync(SRC, state.BOM + state.lines.join(state.EOL), 'utf8');
}

// 替换若干难的 options 数组体
function replaceOptions(NEWOPT) {
  const st = load();
  const { lines } = st;
  const { starts, blockOf } = indexBlocks(lines);
  const report = [];
  Object.keys(NEWOPT).map(Number).sort((a, b) => a - b).forEach((id) => {
    const s = starts.find((x) => x.id === id);
    if (!s) { report.push('缺块 ' + id); return; }
    let oi = -1;
    for (let i = s.line; i < blockOf[id]; i++) { if (/^ {4}options: \[/.test(lines[i])) { oi = i; break; } }
    if (oi < 0) { report.push('缺 options ' + id); return; }
    let depth = 0, end = -1;
    for (let i = oi; i < blockOf[id]; i++) {
      for (const ch of lines[i]) { if (ch === '[') depth++; else if (ch === ']') depth--; }
      if (depth === 0) { end = i; break; }
    }
    if (end < 0) { report.push('options 未闭合 ' + id); return; }
    // 关键：原结束行可能是「    ] },」——数组闭合与该难对象闭合同行。
    // 直接替换成「    ],」会吞掉「}」，导致整块不闭合（历史踩坑，务必保留尾部）。
    const tailM = lines[end].match(/^\s*\]\s*(.*)$/);
    const tail = tailM ? (tailM[1] || '').trim() : '';
    const tailLines = (/^\}/.test(tail)) ? ['  ' + tail] : [];
    const body = ['    options: ['].concat(NEWOPT[id], ['    ],']).concat(tailLines);
    const oldN = end - oi + 1;
    lines.splice(oi, oldN, ...body);
    const delta = body.length - oldN;
    starts.forEach((x) => { if (x.line > oi) x.line += delta; });
    Object.keys(blockOf).forEach((k) => { if (blockOf[k] > oi) blockOf[k] += delta; });
    report.push('难' + id + ' 选项 ' + (oldN - 2) + '→' + NEWOPT[id].length);
  });
  save(st);
  report.forEach((r) => console.log(r));
  return report;
}

// 在指定难块内做一次正则替换（用于 hidden.cond 等随道别迁移的字段）
function replaceInBlock(id, re, to, expect) {
  const st = load();
  const { lines } = st;
  const { starts, blockOf } = indexBlocks(lines);
  const s = starts.find((x) => x.id === id);
  if (!s) { console.log('缺块 ' + id); return false; }
  let hit = 0;
  for (let i = s.line; i < blockOf[id]; i++) {
    if (re.test(lines[i])) { lines[i] = lines[i].replace(re, to); hit++; }
  }
  if (hit) save(st);
  console.log('难' + id + ' 块内替换 ' + hit + ' 处' + (expect ? '（期望 ' + expect + '）' : ''));
  return hit > 0;
}

module.exports = { replaceOptions, replaceInBlock, load, indexBlocks };
