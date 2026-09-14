// _audit_seal.js — 劫印系统全量体检（只读探针，不修改任何文件）
// 用途：一次性给出劫印系统的规模、覆盖、可达性、接线缺口与并行真源清单。
// 运行：node scripts/_audit_seal.js   → 输出 scripts/_audit_seal_out.txt
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
Object.defineProperty(global, 'window', { value: global, writable: true, configurable: true });
global.location = { href: 'http://client', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, writable: true, configurable: true });
const _ls = {};
global.localStorage = {
  get length() { return Object.keys(_ls).length; },
  key(i) { const k = Object.keys(_ls); return k[i] != null ? k[i] : null; },
  getItem(k) { return Object.prototype.hasOwnProperty.call(_ls, k) ? _ls[k] : null; },
  setItem(k, v) { _ls[k] = String(v); }, removeItem(k) { delete _ls[k]; },
  clear() { for (const k of Object.keys(_ls)) delete _ls[k]; },
};
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SKIP = new Set(['sound.js', 'ui.js', 'main.js']);
[...html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter((f) => !SKIP.has(f) && !f.startsWith('ui/'))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const NDX = global.NDX;
const rel = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const L = [];
const say = (s) => { L.push(s); console.log(s); };
const DAOS = ['战', '渡', '缘', '夺', '隐', '逆'];

say('==================== 劫印系统审计 ' + new Date().toISOString().slice(0, 10) + ' ====================');

// ---------- A 数据规模 ----------
const words = NDX.SEAL_WORDS || {};
const names = Object.keys(words);
say('\n[A] 劫印词条规模');
say('  总词条数: ' + names.length + '（SEAL_ICONS 映射: ' + Object.keys(NDX.SEAL_ICONS || {}).length + '）');
const byDao = {}, tierMiss = { white: [], blue: [], gold: [], red: [] }, mechN = [];
names.forEach((n) => {
  const w = words[n];
  byDao[w.dao] = byDao[w.dao] || { n: 0, mech: 0 };
  byDao[w.dao].n++;
  if (w.mech) { byDao[w.dao].mech++; mechN.push(n); }
  ['white', 'blue', 'gold', 'red'].forEach((t) => { if (!w.tiers || w.tiers[t] == null) tierMiss[t].push(n); });
});
DAOS.forEach((d) => say('  ' + d + '道: ' + (byDao[d] ? byDao[d].n : 0) + ' 条（含机制 ' + (byDao[d] ? byDao[d].mech : 0) + '）'));
say('  带战斗机制(mech)词条: ' + mechN.length + ' 条');
['white', 'blue', 'gold', 'red'].forEach((t) => {
  say('  缺 ' + t + ' 档数值: ' + tierMiss[t].length + ' 条' + (tierMiss[t].length ? ' → ' + tierMiss[t].slice(0, 8).join('/') : ''));
});

// ---------- B 图标资产 ----------
say('\n[B] 图标覆盖');
const icons = NDX.SEAL_ICONS || {};
const noIcon = names.filter((n) => !icons[n]);
say('  词条无专属图标映射: ' + noIcon.length + ' 条' + (noIcon.length ? ' → ' + noIcon.join('/') : ''));
const mappedPaths = new Set(Object.values(icons).concat(Object.values(NDX.SEAL_DAO_ICONS || {})));
const missingFile = [...mappedPaths].filter((p) => !fs.existsSync(path.join(ROOT, p)));
say('  映射指向的图标文件缺失: ' + missingFile.length + ' 个' + (missingFile.length ? ' → ' + missingFile.slice(0, 12).join(', ') : ''));
const orphanFiles = (() => {
  const dir = path.join(ROOT, 'img/seals');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /\.(webp|png|jpg)$/i.test(f))
    .filter((f) => ![...mappedPaths].some((p) => p.endsWith('/' + f)));
})();
say('  img/seals 下未被任何映射引用的图: ' + orphanFiles.length + ' 个' + (orphanFiles.length ? ' → ' + orphanFiles.slice(0, 12).join(', ') : ''));

// ---------- C 品质可达性 ----------
say('\n[C] 品质档位可达性（rollSealTier 实测）');
const srcs = Object.keys(NDX.SEAL_SOURCE_TIER || {});
const reach = new Set();
srcs.forEach((src) => {
  for (let act = 1; act <= 9; act++) {
    for (const boss of [false, true]) {
      for (let fusionN = 0; fusionN <= 3; fusionN++) {
        for (let i = 0; i < 60; i++) {
          const s = { act: act, flags: { sealUp: 5 } };
          reach.add(NDX.rollSealTier(src, s, { isBoss: boss, fusionN: fusionN }));
        }
      }
    }
  }
});
say('  可达档位: ' + [...reach].sort().join(' / '));
say('  红色档位(red)可达: ' + (reach.has('red') ? '是' : '否 —— 数据有 red 数值/label/定价，但无来源产出'));
const redDefined = names.filter((n) => words[n].tiers && words[n].tiers.red != null).length;
say('  已备 red 数值的词条: ' + redDefined + '/' + names.length + '（RED_MULT=' + NDX.SEAL_RED_MULT + '）');

// ---------- D 篝火仪典接线 ----------
say('\n[D] 篝火仪典（BONFIRE_RITES 数据 → 分发 → 执行 三段）');
const rites = NDX.BONFIRE_RITES || {};
const mainSrc = rel('js/main.js');
const campSrc = rel('js/game/game_camp.js');
Object.keys(rites).forEach((k) => {
  const hasCase = new RegExp("case\\s+'rite-" + k + "'").test(mainSrc);
  const hasBranch = new RegExp("rite\\s*===\\s*'" + k + "'").test(campSrc);
  const hasFn = new RegExp('doRite' + k.charAt(0).toUpperCase() + k.slice(1) + '\\b').test(rel('js/jieseals.js'));
  say('  ' + k + ' (' + rites[k].name + '): 数据✔ 分发' + (hasCase ? '✔' : '✘') + ' 执行' + (hasFn ? '✔' : '✘') + ' → ' + ((hasCase && hasFn) ? '可用' : '★点击无响应'));
});
const riteListed = NDX.riteList({ hp: 5000, gold: 999, xinmo: 50, life: 3 });
say('  riteList 返回 ' + riteListed.length + ' 项，其中 disabled 判定实现了 ' + riteListed.filter((r) => r.why).length + ' 项');

// ---------- E 并行真源 / 死字段 ----------
say('\n[E] 并行真源与死字段');
const _sealSample = NDX._mkSeal('杀伐', 'gold');
say('  seal 对象字段: ' + Object.keys(_sealSample).join(', '));
const attrCalcSrc = rel('js/attr_calc.js');
const cbBody = attrCalcSrc.slice(attrCalcSrc.indexOf('function calcSealBonus'), attrCalcSrc.indexOf('function calcSutraBonus'));
const readFields = (cbBody.match(/'([A-Za-z]+)'/g) || []).map((x) => x.replace(/'/g, ''));
const hitFields = readFields.filter((f) => _sealSample[f] != null);
say('  calcSealBonus 尝试读取字段: ' + [...new Set(readFields)].join(', '));
say('  → 与真实 seal 字段命中: ' + (hitFields.length ? [...new Set(hitFields)].join(', ') : '零命中（该函数对劫印本体恒返回 {}，仅道途阶段碑生效）'));
const consumers = ['calcFinalAttrs', 'traceAttrSource', 'tracePlayerStats', 'computePlayerStats'];
consumers.forEach((fn) => {
  const used = [...html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
    .filter((f) => !SKIP.has(f))
    .some((f) => { try { return new RegExp('AttrCalc\\.' + fn + '\\b').test(rel('js/' + f)); } catch (e) { return false; } });
  say('  AttrCalc.' + fn + ' 外部调用: ' + (used ? '有' : '无'));
});

// ---------- F 结算链路（真源 combat.js） ----------
say('\n[F] 结算链路');
const comboSrc = rel('js/combat.js');
say('  真源 NDX.computeStats 消费 seal.stat 分支: ' + (comboSrc.match(/sl\.stat === '/g) || []).length + ' 种');
say('  真源消费 seal.mechanism → fateFlags: ' + (/sl\.mechanism/.test(comboSrc) ? '是' : '否'));
say('  SEAL_DAO_BREAKPOINTS 档位数: ' + DAOS.map((d) => d + (Object.keys(NDX.SEAL_DAO_BREAKPOINTS[d] || {}).length)).join(' '));
const codexSrc = rel('js/data_codex.js');
say('  图鉴 seal 分类登记: ' + (/['"]seal['"]/.test(codexSrc) ? '是' : '否'));

// ---------- G 门禁覆盖 ----------
say('\n[G] 门禁覆盖');
say('  已有 _verify_seal_source.js: 是（来源 tier / 阵营 / 契合度）');
say('  缺失门禁: 仪典接线 / 品质可达性 / 词条×图标一致性 / 真源结算字段');

fs.writeFileSync(path.join(__dirname, '_audit_seal_out.txt'), L.join('\n'), 'utf8');
say('\n（已写出 scripts/_audit_seal_out.txt）');
