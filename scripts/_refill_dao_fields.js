// _refill_dao_fields.js — 回填重写时被丢掉的单值字段（fight / battleFlags / bossDiff / noFight / ending / jobConfirm）
// 依据：按 (难号, 选项 key) 与备份比对，仅补「备份有、当前无」的字段，绝不覆盖已有值
const fs = require('fs');
const path = require('path');
const OLD = path.join(__dirname, '..', 'js', 'trials81.js.bak_dao1');
const SRC = path.join(__dirname, '..', 'js', 'trials81.js');

const FIELDS = [
  { k: 'fight', re: /\bfight:\s*(true|false)/ },
  { k: 'battleFlags', re: /\bbattleFlags:\s*\{[^}]*\}/ },
  { k: 'bossDiff', re: /\bbossDiff:\s*[\d.]+/ },
  { k: 'noFight', re: /\bnoFight:\s*(true|false)/ },
  { k: 'ending', re: /\bending:\s*'[^']*'/ },
  { k: 'jobConfirm', re: /\bjobConfirm:\s*'[^']*'/ },
  { k: 'noDao', re: /\bnoDao:\s*(true|false)/ },
  { k: 'sixdaoSelect', re: /\bsixdaoSelect:\s*(true|false)/ },
];

// —— 解析备份：难号 → { key: { fight:'fight: true', ... } } ——
function parseOld() {
  const lines = fs.readFileSync(OLD, 'utf8').replace(/\r\n/g, '\n').split('\n');
  const res = {};
  let id = null, inOpt = false, curKey = null, buf = [];
  const flush = () => {
    if (id != null && curKey) {
      const txt = buf.join('\n');
      const o = (res[id] = res[id] || {});
      const p = (o[curKey] = o[curKey] || {});
      FIELDS.forEach((f) => { const m = txt.match(f.re); if (m && !p[f.k]) p[f.k] = m[0]; });
    }
    curKey = null; buf = [];
  };
  lines.forEach((l) => {
    const mb = l.match(/^ {2}(\d+): \{ id: (\d+),/);
    if (mb) { flush(); id = +mb[1]; inOpt = false; return; }
    if (id == null) return;
    if (/^ {4}options: \[/.test(l)) { inOpt = true; return; }
    if (inOpt && /^ {4}\]/.test(l)) { flush(); inOpt = false; id = null; return; }
    if (!inOpt) return;
    const mo = l.match(/^ {6}\{ key: '([^']+)'/);
    if (mo) { flush(); curKey = mo[1]; buf = [l]; return; }
    if (curKey) buf.push(l);
  });
  flush();
  return res;
}

const OLD_MAP = parseOld();
let raw = fs.readFileSync(SRC, 'utf8');
const BOM = raw.charCodeAt(0) === 0xfeff ? '\uFEFF' : '';
if (BOM) raw = raw.slice(1);
const EOL = ((raw.match(/\r\n/g) || []).length * 2 > (raw.match(/\n/g) || []).length) ? '\r\n' : '\n';
const lines = raw.replace(/\r\n/g, '\n').split('\n');

let id = null, inOpt = false, curStart = -1, curKey = null;
const patched = [];
const flush = () => {
  if (id != null && curKey && curStart >= 0) {
    const seg = lines.slice(curStart, lines.length).join('\n');
    const endIdx = (() => {
      // 找到该选项对象结束：从 curStart 起括号归零行
      let d = 0;
      for (let i = curStart; i < lines.length; i++) {
        for (const ch of lines[i]) { if (ch === '{') d++; else if (ch === '}') d--; }
        if (d <= 0) return i;
      }
      return -1;
    })();
    if (endIdx >= 0) {
      const txt = lines.slice(curStart, endIdx + 1).join('\n');
      const src = (OLD_MAP[id] || {})[curKey] || {};
      const add = [];
      FIELDS.forEach((f) => {
        if (src[f.k] && !new RegExp('\\b' + f.k + '\\s*:').test(txt)) add.push(src[f.k]);
      });
      if (add.length) {
        // 单行选项的「结束行」就是起始行（以 { 开头），须按最后一个 '}' 定位，不能用 ^}
        const last = lines[endIdx];
        const idx = last.lastIndexOf('}');
        if (idx > 0) {
          const head = last.slice(0, idx).replace(/[,\s]+$/, '');
          lines[endIdx] = head + ', ' + add.join(', ') + last.slice(idx);
          patched.push('难' + id + ' [' + curKey + '] +' + add.join(' + '));
        }
      }
    }
  }
  curStart = -1; curKey = null;
};

lines.forEach((l, i) => {
  const mb = l.match(/^ {2}(\d+): \{ id: (\d+),/);
  if (mb) { flush(); id = +mb[1]; inOpt = false; return; }
  if (id == null) return;
  if (/^ {4}options: \[/.test(l)) { inOpt = true; return; }
  if (inOpt && /^ {4}\]/.test(l)) { flush(); inOpt = false; id = null; return; }
  if (!inOpt) return;
  const mo = l.match(/^ {6}\{ key: '([^']+)'/);
  if (mo) { flush(); curKey = mo[1]; curStart = i; }
});
flush();

fs.writeFileSync(SRC, BOM + lines.join(EOL), 'utf8');
console.log('回填 ' + patched.length + ' 处：');
patched.forEach((p) => console.log('  ' + p));
