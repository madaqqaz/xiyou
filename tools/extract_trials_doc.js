// 提取 81 难：章节 Boss + 复合/混合劫难 + 每难当前选项与善恶 → Markdown 供审阅
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..');
const sandbox = {};
sandbox.window = sandbox;
sandbox.console = console;
sandbox.Math = Math;
vm.createContext(sandbox);
function load(f) {
  const code = fs.readFileSync(path.join(root, f), 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
}
load('js/data_region_config.js');
load('js/trials81.js');
load('js/data_compound.js');
const NDX = sandbox.NDX || sandbox.window.NDX;

function alignOf(opt) {
  const e = opt.effect || {};
  if (e.alignGood) return '善+' + e.alignGood;
  if (e.alignEvil) return '恶+' + e.alignEvil;
  return '兜底';
}
function fightTag(opt) {
  if (opt.fight) return '战';
  if (opt.noFight) return '不战';
  return '-';
}
function cleanLabel(s) {
  return (s || '').replace(/\【[^\】]*\】/g, '').replace(/\n/g, ' ').trim();
}

const LIB = NDX.TRIAL_LIB || {};
const BOSS = NDX.TRIAL_BOSS || {};
const CN = NDX.COMPOUND_NODES || {};

// 地区/Boss 来自 GEO_SEGMENTS（每地区末尾= Boss 难）
const segs = NDX.GEO_SEGMENTS || [];
const out = [];
out.push('# 《逆道西行》八十一难 · 章节 Boss 与混合劫难梳理（当前状态）');
out.push('');
out.push('> 用途：逐项调整「选项与善恶」前的现状清点。本文件只读不写代码，确认后由 AI 落回代码。');
out.push('> 规律：每地区末尾难号 = 该章 Boss 难；复合/混合劫难来自 COMPOUND_NODES（手动 1/2/3/7 + 自动 4–17）。');
out.push('> 善恶标注：选项显式 `effect.alignGood/alignEvil` 优先；「兜底」指未声明、由 fate 兜底（渡/缘→善1、逆/夺→恶1、战/隐→中性）。');
out.push('');

// 按地区统计
let tallyAll = { 善: 0, 恶: 0, 中性: 0, 兜底: 0 };

segs.forEach((g) => {
  const act = g.act;
  const lo = g.segs[0].lo, hi = g.segs[0].hi;
  const regionName = g.name;
  const bossDiff = hi;
  const bossName = BOSS[bossDiff] || '(无)';
  // 复合节点
  const cn = CN[act];
  let fusionLines = [];
  if (cn) {
    const fs2 = cn.fusions || [];
    if (fs2.length) {
      fs2.forEach((f) => {
        const dh = f.diffs.length > 1 ? f.diffs[0] + '-' + f.diffs[f.diffs.length - 1] : f.diffs[0];
        fusionLines.push(`    - 融合节点：第 ${dh} 难 · ${f.name}${f.chechi ? '（车迟斗法：选隐即短路）' : ''}`);
      });
    } else if (cn.diffs && cn.diffs.length) {
      fusionLines.push(`    - 旧式复合：第 ${cn.diffs[0]}-${cn.diffs[cn.diffs.length - 1]} 难 · ${cn.name || cn.title || ''}`);
    }
  }
  out.push(`## 第${act}章 · ${regionName}（难 ${lo}–${hi}）`);
  out.push('');
  out.push(`- **Boss**：第 ${bossDiff} 难 · ${bossName}`);
  if (fusionLines.length) {
    out.push('- **混合/复合劫难**：');
    out.push(fusionLines.join('\n'));
  } else {
    out.push('- **混合/复合劫难**：无（纯线性）');
  }
  out.push('');

  const chapterTally = { 善: 0, 恶: 0, 中性: 0, 兜底: 0 };
  for (let d = lo; d <= hi; d++) {
    const t = LIB[d];
    if (!t) { out.push(`### 难${d} · (缺失)`); out.push(''); continue; }
    const isBoss = (d === bossDiff);
    const bossTag = isBoss ? ' 🏴 **[BOSS]**' : '';
    out.push(`### 难${d} · ${t.name}${bossTag}（${t.type || 'event'}）`);
    if (t.portrait) out.push(`- 登场敌/对面：${BOSS[d] || t.portrait}${BOSS[d] && BOSS[d] !== t.portrait ? '（立绘：' + t.portrait + '）' : ''}`);
    else out.push(`- 登场敌：${BOSS[d] || '—'}`);
    const opts = t.options || [];
    if (!opts.length) {
      out.push('- 选项：无（纯剧情/战斗节点）');
    } else {
      out.push('| 键 | 道 | 战斗 | 当前善恶 | 标签摘要 |');
      out.push('|----|----|------|----------|----------|');
      opts.forEach((o) => {
        const a = alignOf(o);
        const fa = a.startsWith('善') ? '善' : a.startsWith('恶') ? '恶' : (a === '兜底' ? '兜底' : '中性');
        chapterTally[fa] = (chapterTally[fa] || 0) + 1;
        tallyAll[fa] = (tallyAll[fa] || 0) + 1;
        const lab = cleanLabel(o.label).slice(0, 24);
        out.push(`| ${o.key} | ${o.fate || ''} | ${fightTag(o)} | ${a} | ${lab} |`);
      });
    }
    if (t.hidden) {
      const h = t.hidden;
      out.push(`- 隐藏职：${h.hero} · 解锁条件「${h.cond}」→ ${h.job}（${h.desc || ''}）`);
    }
    out.push('');
  }
  // 章小结
  out.push(`> 本章选项善恶倾向：善 ${chapterTally.善 || 0} · 恶 ${chapterTally.恶 || 0} · 中性 ${chapterTally.中性 || 0} · 兜底 ${chapterTally.兜底 || 0}`);
  out.push('');
});

out.push('---');
out.push('## 全局汇总');
out.push(`- 选项善恶计数：善 ${tallyAll.善 || 0} · 恶 ${tallyAll.恶 || 0} · 中性 ${tallyAll.中性 || 0} · 兜底 ${tallyAll.兜底 || 0}`);
out.push('');
out.push('> 下一步：逐章确认选项增减与善恶数值，确认后由 AI 落回 TRIAL_LIB（trials81.js）。');

const md = out.join('\n');
fs.writeFileSync(path.join(root, 'docs', '八十一难_章节Boss与混合劫难梳理.md'), md, 'utf8');
console.log('WROTE docs/八十一难_章节Boss与混合劫难梳理.md');
console.log('总计选项:', tallyAll);
