// _audit_trial_dao.js — 六道供给规则审查：按 data_trial_dao.js 的规则表核对 81 难选项
//   必给：res（请救兵）→ 渡
//   可有：boss/pet → 逆；mon（带怪）→ 战；tre（法宝）→ 夺
// 输出：逐难缺口 + 汇总 + 写入 scripts/_audit_dao_out.txt
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node' }, configurable: true });
global.window = global;
global.NDX = {};
require(path.join(ROOT, 'js/trials81.js'));
require(path.join(ROOT, 'js/data_trial_dao.js'));

const L = NDX.TRIAL_LIB || {};
const R = NDX.TRIAL_DAO_RULE || {};
const MOTIF = NDX.TRIAL_NI_MOTIF || {};
const rows = [];
let fail = 0;
const gaps = { 渡: [], 逆: [], 战: [], 夺: [] };

Object.keys(L).map(Number).sort((a, b) => a - b).forEach((id) => {
  const t = L[id];
  const r = R[id] || {};
  const opts = t.options || [];
  const has = {};
  opts.forEach((o) => { const d = o.fate || o.key; if (d) has[d] = 1; });
  const need = NDX.trialDaoNeed(id);
  const missMust = need.must.filter((d) => !has[d]);
  const missMay = need.may.filter((d) => !has[d]);
  // 硬失败：必给缺失
  if (missMust.length) { fail++; missMust.forEach((d) => gaps[d].push(id)); }
  // 可有缺失记为建议（不计失败，但汇总列出）
  missMay.forEach((d) => { if (!(gaps[d].indexOf(id) >= 0)) (gaps['_may_' + d] = gaps['_may_' + d] || []).push(id); });
  const labelBad = opts.filter((o) => /^【/.test(o.label || '')).length;
  const signBad = opts.filter((o) => !o.effect || (o.effect.alignGood == null && o.effect.alignEvil == null)).length;
  rows.push({
    id, name: t.name, who: r.who || '', n: opts.length,
    has: Object.keys(has).join(''),
    must: (need.must.join('') || '-'),
    may: (need.may.join('') || '-'),
    missMust: missMust.join('') || '',
    missMay: missMay.join('') || '',
    motif: MOTIF[id] ? 'Y' : '-',
    labelBad, signBad
  });
});

const pad = (s, n) => { s = String(s); let w = 0; for (const ch of s) w += /[\u4e00-\u9fa5（）·]/.test(ch) ? 2 : 1; return s + ' '.repeat(Math.max(0, n - w)); };
const out = [];
out.push('难  名称              现有道           必有  可有  缺必  缺可  逆母题 前缀 未签善恶');
rows.forEach((r) => {
  out.push(pad(r.id, 3) + ' ' + pad(r.name, 16) + pad(r.has + '(' + r.n + ')', 17) + pad(r.must, 6) + pad(r.may, 6) +
    pad(r.missMust, 6) + pad(r.missMay, 6) + pad(r.motif, 8) + pad(r.labelBad, 5) + r.signBad);
});
out.push('');
out.push('=== 必给缺失（硬失败）===');
out.push('渡（请救兵必有）：' + (gaps.渡.join(',') || '无'));
out.push('');
out.push('=== 可有缺失（建议补齐）===');
['逆', '战', '夺'].forEach((d) => {
  const has = rows.filter((r) => r.missMay.indexOf(d) >= 0).map((r) => r.id);
  out.push(d + '：' + (has.join(',') || '无') + '  (共 ' + has.length + ')');
});
out.push('');
out.push('=== 逆母题缺失（boss/pet=1 但无母题文案）===');
out.push(rows.filter((r) => r.motif === '-' && /逆/.test(r.may)).map((r) => r.id).join(',') || '无');
out.push('');
out.push('=== 汇总 ===');
out.push('必给缺失难数=' + fail);
out.push('前缀未去难数=' + rows.filter((r) => r.labelBad > 0).length + '（选项数 ' + rows.reduce((a, r) => a + r.labelBad, 0) + '）');
out.push('善恶未签选项数=' + rows.reduce((a, r) => a + r.signBad, 0));
out.push('平均选项数=' + (rows.reduce((a, r) => a + r.n, 0) / rows.length).toFixed(2));
out.push('\n结论：' + fail + ' 失败（必给缺失难数）');
fs.writeFileSync(path.join(__dirname, '_audit_dao_out.txt'), out.join('\n'), 'utf8');
console.log(out.slice(-60).join('\n'));
process.exit(0);
