// 81 难全量审计（运行时快照）：难号/名称/地区/类型/六道覆盖/叙事长度/法宝/隐藏职/敌名/英雄专属/复合节点
// 用法：node scripts/_audit_trials81.js [--csv]
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');

global.window = global;
global.location = { href: 'http://client', search: '' };
// Node 22：global.navigator 为只读 getter，须 defineProperty 覆盖
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, configurable: true, writable: true });
const _s = {};
global.localStorage = {
  get length() { return Object.keys(_s).length; },
  key(i) { return Object.keys(_s)[i] != null ? Object.keys(_s)[i] : null; },
  getItem(k) { return Object.prototype.hasOwnProperty.call(_s, k) ? _s[k] : null; },
  setItem(k, v) { _s[k] = String(v); }, removeItem(k) { delete _s[k]; }, clear() { for (const k of Object.keys(_s)) delete _s[k]; }
};

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SKIP = new Set(['sound.js', 'ui.js', 'main.js']);
const files = [...html.matchAll(/js\/([\w\/-]+\.js)/g)].map(m => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter(f => !SKIP.has(f) && !f.startsWith('ui/'));
files.forEach(f => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const N = global.NDX;

const regionName = {};
(N.ACT_RANGES || []).forEach(r => { regionName[r.act] = (r.name || ('act' + r.act)) + '(' + r.start + '-' + r.end + ')'; });

// 复合节点反查：act -> 覆盖的难号
const compOf = {}, compStruct = {};
Object.keys(N.COMPOUND_NODES || {}).forEach(act => {
  const c = N.COMPOUND_NODES[act];
  const all = [];
  (c.diffs || []).forEach(d => all.push(d));
  (c.fusions || []).forEach(f => (f.diffs || []).forEach(d => all.push(d)));
  all.forEach(d => { compOf[d] = act; });
  compStruct[act] = {
    name: c.name || '', diffs: c.diffs || [],
    fusions: (c.fusions || []).map(f => (f.diffs || []).join('+')).join(' | '),
    quota: !!c.quotaTier, tutorial: !!c.tutorial
  };
});

// 英雄专属覆盖
const heroCover = {};
Object.keys(N.HERO_TRIALS || {}).forEach(h => {
  Object.keys(N.HERO_TRIALS[h] || {}).forEach(l => {
    (heroCover[l] = heroCover[l] || []).push(h);
  });
});

const rows = [];
for (let i = 1; i <= (N.TOTAL_TRIALS || 81); i++) {
  const t = (N.TRIAL_LIB || {})[i];
  const opts = (t && t.options) || [];
  const fates = [...new Set(opts.map(o => o.fate || o.key).filter(Boolean))];
  const darkLen = (t && t.dark) ? String(t.dark).length : 0;
  let boss = '';
  try { boss = (N.trialBossName && N.trialBossName(i)) || ((N.TRIAL_BOSS || {})[i] || ''); } catch (e) { boss = (N.TRIAL_BOSS || {})[i] || ''; }
  rows.push({
    n: i,
    name: t ? t.name : '',
    act: t ? t.act : 0,
    region: regionName[t ? t.act : 0] || '',
    type: t ? (t.type || '') : '',
    fate: t ? (t.fate || '') : '',
    optN: opts.length,
    fates: fates.join('/'),
    darkLen,
    treasure: t && t.treasure ? (t.treasure.note || t.treasure.id || 'Y') : '',
    hidden: t && t.hidden ? (t.hidden.job || 'Y') : '',
    boss,
    heroes: (heroCover[i] || []).join(','),
    comp: compOf[i] ? ('act' + compOf[i]) : ''
  });
}

const CSV = process.argv.includes('--csv');
const OUT = [];
const say = (s) => { OUT.push(s); };

if (CSV) {
  const head = ['难', '名', '地区', '类型', '主道', '选项数', '六道覆盖', '叙事字数', '法宝', '隐藏职', '敌名', '英雄专属', '复合'];
  say(head.join(','));
  rows.forEach(r => console.log([r.n, r.name, r.region, r.type, r.fate, r.optN, r.fates, r.darkLen, r.treasure, r.hidden, r.boss, r.heroes, r.comp].map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')));
} else {
  console.log('难  名称            地区                     类型    主道 选项 六道覆盖              叙事  法宝 隐藏职 敌名            英雄专属 复合');
  rows.forEach(r => {
  say(
    String(r.n).padStart(2) + '  ' +
      (r.name || '（缺）').padEnd(14) + '  ' +
      String(r.region).padEnd(24) + '  ' +
      String(r.type).padEnd(6) + '  ' +
      String(r.fate).padEnd(3) + ' ' +
      String(r.optN).padStart(2) + '   ' +
      String(r.fates).padEnd(20) + '  ' +
      String(r.darkLen).padStart(4) + '  ' +
      (r.treasure ? 'Y' : '.') + '    ' +
      (r.hidden ? 'Y' : '.') + '     ' +
      String(r.boss || '').padEnd(14) + '  ' +
      String(r.heroes).padEnd(8) + ' ' +
      String(r.comp)
    );
  });
}

// 汇总
say('\n== 汇总 ==');
say('TRIAL_LIB 条目数: ' + Object.keys(N.TRIAL_LIB || {}).length + ' / TOTAL_TRIALS: ' + N.TOTAL_TRIALS);
const missing = rows.filter(r => !r.name);
say('缺叙事条目: ' + (missing.length ? missing.map(r => r.n).join(',') : '无'));
const byType = {}; rows.forEach(r => { byType[r.type || '(空)'] = (byType[r.type || '(空)'] || 0) + 1; });
say('类型分布: ' + JSON.stringify(byType));
const byAct = {}; rows.forEach(r => { byAct[r.act] = (byAct[r.act] || 0) + 1; });
say('地区分布: ' + JSON.stringify(byAct));
const lens = rows.map(r => r.darkLen);
say('叙事字数 min/avg/max: ' + Math.min(...lens) + ' / ' + Math.round(lens.reduce((a, b) => a + b, 0) / lens.length) + ' / ' + Math.max(...lens));
say('无叙事文本(darkLen=0)的难: ' + (rows.filter(r => r.darkLen === 0).map(r => r.n).join(',') || '无'));
say('带法宝难: ' + rows.filter(r => r.treasure).length + ' / 带隐藏职难: ' + rows.filter(r => r.hidden).length);
say('英雄专属：层数 ' + Object.keys(heroCover).length + '，按英雄：' + JSON.stringify(
  Object.keys(N.HERO_TRIALS || {}).reduce((a, h) => { a[h] = Object.keys(N.HERO_TRIALS[h] || {}).length; return a; }, {})
));
say('复合节点结构：');
Object.keys(compStruct).forEach(a => {
  const c = compStruct[a];
  say('  act' + a + ' ' + c.name + ' diffs=[' + c.diffs.join(',') + ']' + (c.fusions ? ' fusions=' + c.fusions : '') + (c.quota ? ' [配额Boss]' : '') + (c.tutorial ? ' [教学]' : ''));
});
say('复合节点难: ' + JSON.stringify(Object.keys(compOf).map(Number).sort((a, b) => a - b)));
say('RETURN_TRIALS（隐藏返程段）: ' + (N.RETURN_TRIALS ? Object.keys(N.RETURN_TRIALS).length + ' 条' : '无'));
const optLess = rows.filter(r => r.optN < 2);
say('选项<2 的难: ' + (optLess.length ? optLess.map(r => r.n + '(' + r.optN + ')').join(',') : '无'));
const noFate6 = rows.filter(r => r.fates.split('/').filter(Boolean).length < 6 && r.optN > 0);
say('六道未全覆盖的难(>0 选项但<6 道): ' + (noFate6.length ? noFate6.map(r => r.n + '(' + r.fates + ')').join(', ') : '无'));

// —— 深度统计 ——
say('\n== 深度统计 ==');
// 1) 每地区聚合
say('地区 | 难号 | 难数 | fight/event/story/boss | 叙事字数(总/均) | 选项均 | 法宝 | 隐藏职 | 非复合(Boss层)');
Object.keys(regionName).map(Number).sort((a, b) => a - b).forEach(a => {
  const rs = rows.filter(r => r.act === a);
  const t = { fight: 0, event: 0, story: 0, boss: 0 };
  rs.forEach(r => { t[r.type] = (t[r.type] || 0) + 1; });
  const sum = rs.reduce((x, r) => x + r.darkLen, 0);
  const optAvg = (rs.reduce((x, r) => x + r.optN, 0) / rs.length).toFixed(1);
  const nonComp = rs.filter(r => !r.comp).map(r => r.n).join(',') || '—';
  say('act' + a + ' ' + regionName[a] + ' | ' + rs.map(r => r.n).join(',') +
    ' | ' + rs.length + ' | ' + t.fight + '/' + t.event + '/' + t.story + '/' + t.boss +
    ' | ' + sum + '/' + Math.round(sum / rs.length) +
    ' | ' + optAvg + ' | ' + rs.filter(r => r.treasure).length + ' | ' + rs.filter(r => r.hidden).length +
    ' | ' + nonComp);
});
// 2) 六道频次（玩家可得性）
const fateFreq = {};
rows.forEach(r => { (r.fates.split('/')).filter(Boolean).forEach(f => { fateFreq[f] = (fateFreq[f] || 0) + 1; }); });
const totalFates = Object.values(fateFreq).reduce((a, b) => a + b, 0);
say('\n六道出现频次（共 81 难，选项按道去重计）：' + Object.keys(fateFreq).sort((a, b) => fateFreq[b] - fateFreq[a])
  .map(f => f + '=' + fateFreq[f] + '(' + Math.round(fateFreq[f] / 81 * 100) + '%)').join(' ') + ' 合计=' + totalFates);
// 3) 善恶极性
let goodN = 0, evilN = 0, neutralN = 0, optTotal = 0;
rows.forEach(r => {
  const t = (N.TRIAL_LIB || {})[r.n];
  ((t && t.options) || []).forEach(o => {
    optTotal++;
    const e = o.effect || {};
    if (e.alignGood) goodN++;
    else if (e.alignEvil) evilN++;
    else neutralN++;   // 未显式声明 → 走 fate 兜底/中性
  });
});
say('选项极性：显式善 ' + goodN + ' / 显式恶 ' + evilN + ' / 未声明(兜底或中性) ' + neutralN + ' / 选项总数 ' + optTotal);
// 4) Boss 层（非复合难）
const bossLayer = rows.filter(r => !r.comp).map(r => r.n + '(' + r.name + ')');
say('非复合难（地区 Boss 层等，共 ' + bossLayer.length + '）：' + bossLayer.join(' '));
// 5) 叙事字数分档
const buckets = { '<50': 0, '50-99': 0, '100-199': 0, '>=200': 0 };
rows.forEach(r => { if (r.darkLen < 50) buckets['<50']++; else if (r.darkLen < 100) buckets['50-99']++; else if (r.darkLen < 200) buckets['100-199']++; else buckets['>=200']++; });
say('叙���字数分档：' + JSON.stringify(buckets));
const thin = rows.filter(r => r.darkLen < 40).map(r => r.n + '(' + r.darkLen + ')');
say('叙事极薄(<40字)：' + (thin.length ? thin.join(' ') : '无'));
const rich = rows.filter(r => r.darkLen >= 100).map(r => r.n + '(' + r.darkLen + ')');
say('叙事较厚(>=100字)：' + (rich.length ? rich.join(' ') : '无'));

fs.writeFileSync(path.join(ROOT, 'scripts', '_audit81_out.txt'), OUT.join('\n'), 'utf8');
console.log('written scripts/_audit81_out.txt (' + OUT.length + ' lines)');
