// _audit_balance.js — 81 难六道平衡审计（难度/善恶/抉择链/转职/事件）
// 用法: node scripts/_audit_balance.js
'use strict';
const fs = require('fs');
const path = require('path');
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node' }, configurable: true });
global.window = global;
global.NDX = {};
require(path.join(__dirname, '..', 'js', 'trials81.js'));
require(path.join(__dirname, '..', 'js', 'data_trial_dao.js'));

const L = NDX.TRIAL_LIB;
const OUT = [];
const P = (s) => OUT.push(s);

// ---------- 1. 各道难度分布（bossDiff / fight） ----------
const byDao = {};
const daoStat = {};
['战', '渡', '缘', '夺', '隐', '逆'].forEach((d) => { byDao[d] = []; daoStat[d] = { n: 0, fight: 0, diffSum: 0, diffN: 0, max: 0 }; });
const bossDiffVals = [];
Object.keys(L).map(Number).sort((a, b) => a - b).forEach((i) => {
  (L[i].options || []).forEach((o) => {
    const d = o.fate || o.key;
    if (!byDao[d]) return;
    const st = daoStat[d];
    st.n++;
    if (o.fight) st.fight++;
    const bd = o.bossDiff != null ? o.bossDiff : (o.effect && o.effect.bossDiff);
    if (bd != null) { st.diffSum += bd; st.diffN++; st.max = Math.max(st.max, bd); bossDiffVals.push({ id: i, dao: d, bd, label: o.label }); }
    byDao[d].push({ id: i, label: o.label, fight: !!o.fight, bd, good: o.effect && o.effect.alignGood, evil: o.effect && o.effect.alignEvil, tre: o.effect && o.effect.treasure });
  });
});

P('=== 1. 各道战斗难度（bossDiff）分布 ===');
P('道   选项数 战斗数 带diff 均值  最高');
Object.keys(daoStat).forEach((d) => {
  const s = daoStat[d];
  P(`${d}   ${String(s.n).padStart(3)}   ${String(s.fight).padStart(3)}   ${String(s.diffN).padStart(3)}   ${(s.diffN ? (s.diffSum / s.diffN).toFixed(2) : '-').padStart(5)} ${s.diffN ? s.max.toFixed(2) : '-'}`);
});

P('');
P('=== 2. 夺选项明细（应=战力天花板 ≥1.35，奖励最高）===');
byDao['夺'].forEach((o) => {
  const flags = [];
  if (o.bd == null) flags.push('无diff');
  else if (o.bd < 1.30) flags.push('⚠难度不足');
  if (!o.fight) flags.push('⚠非战斗');
  if (o.evil == null && o.good == null) flags.push('⚠未签善恶');
  P(`  难${String(o.id).padStart(2)} bd=${o.bd == null ? '—' : o.bd} fight=${o.fight ? 'Y' : 'n'} 善${o.good == null ? '-' : o.good}/恶${o.evil == null ? '-' : o.evil} 宝=${o.tre || '无'} ${flags.join(' ')} | ${o.label}`);
});

P('');
P('=== 3. 渡选项战斗难度（应最低）===');
const du = byDao['渡'].filter((o) => o.fight || o.bd != null);
du.forEach((o) => {
  const flag = (o.bd != null && o.bd > 1.05) ? '⚠偏高' : '';
  P(`  难${String(o.id).padStart(2)} bd=${o.bd == null ? '—' : o.bd} ${flag} | ${o.label}`);
});

P('');
P('=== 4. 战/隐 善恶签署（应逐条按后果，非一刀切）===');
['战', '隐'].forEach((d) => {
  let g = 0, e = 0, z = 0, nulls = 0;
  byDao[d].forEach((o) => {
    if (o.good == null && o.evil == null) nulls++;
    else if ((o.good || 0) > 0) g++;
    else if ((o.evil || 0) > 0) e++;
    else z++;
  });
  P(`  ${d}: 共${byDao[d].length}  善${g} 恶${e} 中性0值${z} 未签${nulls}`);
});
// 战/隐 善恶值分布
['战', '隐'].forEach((d) => {
  const vals = byDao[d].filter(o => o.good != null || o.evil != null).map(o => (o.good ? '+' + o.good : '-' + o.evil));
  P(`  ${d} 取值样本(前25): ${vals.slice(0, 25).join(' ')}`);
});

// ---------- 5. 隐藏转职绑定 ----------
P('');
P('=== 5. 隐藏转职（jobConfirm / 隐藏职）绑定统计 ===');
let jobTrials = [];
Object.keys(L).map(Number).sort((a, b) => a - b).forEach((i) => {
  const t = L[i];
  const jobs = [];
  if (t.hidden) jobs.push('block:' + (t.hidden.name || t.hidden));
  (t.options || []).forEach((o) => {
    const ef = o.effect || {};
    if (ef.jobConfirm) jobs.push('opt:' + (o.fate || o.key) + '→' + (ef.jobConfirm.name || ef.jobConfirm.id || JSON.stringify(ef.jobConfirm)).slice(0, 30));
    if (ef.job) jobs.push('opt:' + (o.fate || o.key) + '→' + ef.job);
    if (ef.unlockJob) jobs.push('opt:' + (o.fate || o.key) + '→' + ef.unlockJob);
  });
  if (jobs.length) jobTrials.push(`  难${String(i).padStart(2)} ${jobs.join(' ; ')}`);
});
P('  含隐藏职的难数: ' + jobTrials.length);
jobTrials.forEach((s) => P(s));

// ---------- 6. 事件绑定 ----------
P('');
P('=== 6. 选项→事件绑定（effect.event / nextEvent / flag）===');
let evN = 0;
Object.keys(L).map(Number).sort((a, b) => a - b).forEach((i) => {
  (L[i].options || []).forEach((o) => {
    const ef = o.effect || {};
    const keys = Object.keys(ef).filter((k) => /event|flag|mark|story|chain/i.test(k));
    if (keys.length) { evN++; P(`  难${String(i).padStart(2)} [${o.fate || o.key}] ${keys.join(',')} | ${o.label.slice(0, 24)}`); }
  });
});
P('  带事件类字段的选项数: ' + evN);

// ---------- 7. 复合节点抉择链 ----------
P('');
P('=== 7. 复合节点（COMPOUND_NODES）六道抉择链 ===');
try {
  require(path.join(__dirname, '..', 'js', 'data_compound.js'));
  const CN = NDX.COMPOUND_NODES || {};
  Object.keys(CN).forEach((act) => {
    const node = CN[act];
    if (node === true) { P(`  act${act}: 标记 true（自动生成）`); return; }
    P(`  act${act} keys=${Object.keys(node).slice(0, 12).join(',')}`);
    const subs = node.subs || node.trials || node.list || [];
    subs.forEach((s) => {
      if (typeof s === 'number') {
        const t = L[s];
        P(`    └ 难${s} ${t ? t.name : '?'} 道=${t ? (t.options || []).map((o) => o.fate || o.key).join('') : '?'}`);
      }
    });
  });
} catch (e) { P('  加载 data_compound 失败: ' + e.message); }

// ---------- 8. 奖励强度分布 ----------
P('');
P('=== 8. 各道奖励强度（treasure/equipPick 出现数）===');
Object.keys(byDao).forEach((d) => {
  const withTre = byDao[d].filter((o) => o.tre).length;
  P(`  ${d}: ${withTre}/${byDao[d].length} 带宝物`);
});

fs.writeFileSync(path.join(__dirname, '_balance_out.txt'), OUT.join('\n'), 'utf8');
console.log(OUT.join('\n'));
