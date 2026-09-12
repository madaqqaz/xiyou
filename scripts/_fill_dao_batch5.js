// _fill_dao_batch5.js — 批次5：为「已有逆选项但未授予逆兽」的难补 effect.treasure（收妖为逆兽）
const W = require('./_trial_opt_writer');

const BEAST = {
  20: { 逆: 'ni_baigu' },      // 白骨夫人
  25: { 逆: 'ni_qingshi' },    // 青毛狮子（文殊坐骑）
  33: { 逆: 'ni_jinyu' },      // 灵感金鱼（观音莲池）
  36: { 逆: 'ni_jinyu' },      // 同上（决战不再重复授予：lootById 已持有时按获得处理）
  56: { 逆: 'ni_huangmei' },   // 黄眉（弥勒司磬童儿）
  57: { 逆: 'ni_jinmaohou' },  // 金毛犼（观音坐骑）
  59: { 逆: 'ni_bailu' },      // 白鹿（寿星坐骑）
  81: { 逆: 'ni_laoyuan' },    // 通天河老鼋
};

const fs = require('fs');
const path = require('path');
const st = W.load();
const { lines } = st;
const { starts, blockOf } = W.indexBlocks(lines);
const done = [];

function endOfOption(start, bound) {
  let d = 0;
  for (let i = start; i < bound; i++) {
    for (const ch of lines[i]) { if (ch === '{') d++; else if (ch === '}') d--; }
    if (d <= 0) return i;
  }
  return -1;
}

Object.keys(BEAST).map(Number).sort((a, b) => a - b).forEach((id) => {
  const s = starts.find((x) => x.id === id);
  if (!s) { console.log('缺块 ' + id); return; }
  let oi = -1;
  for (let i = s.line; i < blockOf[id]; i++) { if (/^ {4}options: \[/.test(lines[i])) { oi = i; break; } }
  if (oi < 0) { console.log('缺 options ' + id); return; }
  Object.keys(BEAST[id]).forEach((key) => {
    let curStart = -1;
    for (let i = oi; i < blockOf[id]; i++) {
      const m = lines[i].match(new RegExp("^ {6}\\{ key: '" + key + "'"));
      if (m) { curStart = i; break; }
    }
    if (curStart < 0) { console.log('难' + id + ' 无 ' + key + ' 选项'); return; }
    const e = endOfOption(curStart, blockOf[id]);
    const txt = lines.slice(curStart, e + 1).join('\n');
    if (/treasure:\s*'ni_/.test(txt)) { console.log('难' + id + ' [' + key + '] 已有逆兽，跳过'); return; }
    const pet = BEAST[id][key];
    if (/effect:\s*\{/.test(txt)) {
      for (let i = curStart; i <= e; i++) {
        if (/effect:\s*\{/.test(lines[i])) {
          lines[i] = lines[i].replace(/effect:\s*\{([^}]*)\}/, (mm, inner) => {
            const sep = inner.trim() && !/,\s*$/.test(inner) ? ', ' : '';
            return 'effect: {' + inner.replace(/\s*$/, '') + sep + "treasure: '" + pet + "' }";
          });
          done.push('难' + id + ' [' + key + '] +' + pet);
          break;
        }
      }
    } else {
      const last = lines[e];
      const idx = last.lastIndexOf('}');
      if (idx > 0) {
        const head = last.slice(0, idx).replace(/[,\s]+$/, '');
        lines[e] = head + ", effect: { treasure: '" + pet + "' }" + last.slice(idx);
        done.push('难' + id + ' [' + key + '] +' + pet + '（新建 effect）');
      }
    }
  });
});

if (done.length) fs.writeFileSync(path.join(__dirname, '..', 'js', 'trials81.js'), st.BOM + lines.join(st.EOL), 'utf8');
console.log('批次5 完成：' + done.length + ' 处');
done.forEach((d) => console.log('  ' + d));
