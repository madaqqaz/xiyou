// _check_dao_fieldloss.js — 对比备份，列出被重写难「原 options 中的特殊字段」，防重写丢字段
// 用法：node scripts/_check_dao_fieldloss.js
const fs = require('fs');
const path = require('path');
const OLD = path.join(__dirname, '..', 'js', 'trials81.js.bak_dao1');
const NEW = path.join(__dirname, '..', 'js', 'trials81.js');

const KEYS = ['rewardTitle', 'rewardDesc', 'unlockCodex', 'favorGate', 'favorText', 'favorEffect',
  'bossDiff', 'fight', 'battleFlags', 'ending', 'jobConfirm', 'subText', 'treasure', 'refill',
  'material', 'equipPick', 'sutraInsight', 'ally', 'noFight', 'ni'];

function blocks(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r\n|\n/);
  const out = {};
  let cur = null, buf = [], depth = null;
  lines.forEach((l) => {
    const m = l.match(/^ {2}(\d+): \{ id: (\d+),/);
    if (m && !cur) { cur = +m[1]; buf = []; }
    if (cur !== null) {
      buf.push(l);
      if (/^ {4}options: \[/.test(l)) depth = 0;
      if (depth !== null) {
        for (const ch of l) { if (ch === '[') depth++; else if (ch === ']') depth--; }
        if (depth === 0 && /\]/.test(l)) { (out[cur] = out[cur] || []).push(buf.join('\n')); cur = null; depth = null; }
      }
    }
  });
  return out;
}

const A = blocks(OLD), B = blocks(NEW);
const ids = Object.keys(A).map(Number).sort((a, b) => a - b);
let n = 0;
ids.forEach((id) => {
  const oldBlk = (A[id] || [])[0] || '';
  const newBlk = (B[id] || [])[0] || '';
  if (!oldBlk || !newBlk || oldBlk === newBlk) return;
  const lost = [];
  KEYS.forEach((k) => {
    const re = new RegExp('\\b' + k + '\\s*[:,]');
    if (re.test(oldBlk) && !re.test(newBlk)) lost.push(k);
  });
  if (lost.length) { n++; console.log('难' + id + ' 丢失字段：' + lost.join(', ')); }
});
console.log('\n--- 共 ' + n + ' 难存在字段丢失（需逐条确认是否为有意移除）---');
