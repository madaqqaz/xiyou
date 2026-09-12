// _fill_dao_batch4.js — 批次4：① 去掉 label 的【六道】前缀（六道由 key/fate 承载）
//                            ② 为未签善恶的选项按「该选项造成的剧情后果」补签 alignGood/alignEvil
// 仅作用于 NDX.TRIAL_LIB 区（不动 NDX.RETURN_TRIALS 返程段）
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'js', 'trials81.js');

// 逐条签署：按该选项在剧情里的实际后果（渡/缘=善、逆/夺=恶、战/隐按后果）
const SIGN = {
  4: { 战: { alignEvil: 6 } },        // 手刃刘洪：报父冤，但破不杀生戒
  8: { 缘: { alignGood: 8 } },        // 揭帖许他自由
  20: { 战: { alignGood: 3 } },       // 三打尸魔：降魔护法
  23: { 战: { alignGood: 8 }, 隐: { alignGood: 4 } },
  25: { 缘: { alignGood: 6 } },       // 八戒背尸
  50: { 战: { alignGood: 6 } },       // 请二郎助擒
  51: { 渡: { alignGood: 10 } },      // 为冤僧申冤
  59: { 隐: { alignGood: 2 } },       // 隐于丹房探底细
  60: { 缘: { alignGood: 8 } },       // 化解灭法之厄
  68: { 隐: { alignGood: 4 } },       // 识破玉兔而不伤
  81: { 逆: { alignEvil: 20 }, 渡: { alignGood: 15 }, 隐: { alignGood: 8 } },
};

let raw = fs.readFileSync(SRC, 'utf8');
const BOM = raw.charCodeAt(0) === 0xfeff ? '\uFEFF' : '';
if (BOM) raw = raw.slice(1);
const EOL = ((raw.match(/\r\n/g) || []).length * 2 > (raw.match(/\n/g) || []).length) ? '\r\n' : '\n';
const lines = raw.replace(/\r\n/g, '\n').split('\n');

const libEnd = lines.findIndex((l) => /^NDX\.RETURN_TRIALS = \{/.test(l));
const end = libEnd < 0 ? lines.length : libEnd;

let prefixN = 0, signN = 0;
let id = null, inOpt = false, curKey = null, curStart = -1;

function endOfOption(start) {
  let d = 0;
  for (let i = start; i < end; i++) {
    for (const ch of lines[i]) { if (ch === '{') d++; else if (ch === '}') d--; }
    if (d <= 0) return i;
  }
  return -1;
}
function flush() {
  if (id != null && curKey && curStart >= 0) {
    const e = endOfOption(curStart);
    if (e >= 0) {
      const txt = lines.slice(curStart, e + 1).join('\n');
      // ① 去【六道】前缀
      if (/label: '【[^\]]】/.test(txt)) {
        for (let i = curStart; i <= e; i++) {
          const nl = lines[i].replace(/(label: ')【[^\]]】/g, '$1');
          if (nl !== lines[i]) { lines[i] = nl; prefixN++; }
        }
      }
      // ② 补签善恶
      const sig = (SIGN[id] || {})[curKey];
      if (sig) {
        const txt2 = lines.slice(curStart, e + 1).join('\n');
        const has = /align(Good|Evil)\s*:/.test(txt2);
        if (!has) {
          const key = sig.alignGood != null ? 'alignGood' : 'alignEvil';
          const val = sig.alignGood != null ? sig.alignGood : sig.alignEvil;
          if (/effect:\s*\{/.test(txt2)) {
            for (let i = curStart; i <= e; i++) {
              if (/effect:\s*\{/.test(lines[i])) {
                lines[i] = lines[i].replace(/effect:\s*\{([^}]*)\}/, (m, inner) => {
                  const sep = inner.trim() && !/,\s*$/.test(inner) ? ', ' : '';
                  return 'effect: {' + inner.replace(/\s*$/, '') + sep + key + ': ' + val + ' }';
                });
                signN++;
                break;
              }
            }
          } else {
            // 无 effect：在最后一个 } 前插入
            const last = lines[e];
            const idx = last.lastIndexOf('}');
            if (idx > 0) {
              const head = last.slice(0, idx).replace(/[,\s]+$/, '');
              lines[e] = head + ', effect: { ' + key + ': ' + val + ' }' + last.slice(idx);
              signN++;
            }
          }
        }
      }
    }
  }
  curStart = -1; curKey = null;
}

for (let i = 0; i < end; i++) {
  const l = lines[i];
  const mb = l.match(/^ {2}(\d+): \{ id: (\d+),/);
  if (mb) { flush(); id = +mb[1]; inOpt = false; continue; }
  if (id == null) continue;
  if (/^ {4}options: \[/.test(l)) { inOpt = true; continue; }
  if (inOpt && /^ {4}\]/.test(l)) { flush(); inOpt = false; id = null; continue; }
  if (!inOpt) continue;
  const mo = l.match(/^ {6}\{ key: '([^']+)'/);
  if (mo) { flush(); curKey = mo[1]; curStart = i; }
}
flush();

fs.writeFileSync(SRC, BOM + lines.join(EOL), 'utf8');
console.log('去前缀 ' + prefixN + ' 处；补签善恶 ' + signN + ' 处');
