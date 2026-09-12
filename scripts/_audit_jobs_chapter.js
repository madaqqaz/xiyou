// _audit_jobs_chapter.js — 转职(ZHUANJIE) 与 隐藏转职(HIDDEN_JOBS) 章节分布审计
// 输出 9 章制下两套系统的「分别情况与要求」矩阵，并标记缺口。
'use strict';
const fs = require('fs');
const vm = require('vm');
const DIR = 'd:/xiyou/demo';
global.NDX = {};
const sb = { console, Math, JSON, Date, NDX: global.NDX };
sb.window = sb;
const ctx = vm.createContext(sb);
// 仅加载转职/隐藏职相关文件（不拉战斗/地图全量依赖）
['js/data_trials.js', 'js/trials81.js', 'js/events.js', 'js/zhuanjie.js'].forEach((f) => {
  vm.runInContext(fs.readFileSync(DIR + '/' + f, 'utf8'), ctx, { filename: f });
});
const N = NDX;
const L = N.TRIAL_LIB || {};

// —— 17 地区 → 9 章 映射（取自 data_compound.js regionToActChapter / GEO_SEGMENTS）——
const GEO = [
  [1, 4], [5, 9], [10, 13], [14, 18], [19, 22], [23, 27], [28, 31], [32, 36],
  [37, 40], [41, 45], [46, 49], [50, 54], [55, 58], [59, 63], [64, 72], [73, 77], [78, 81],
];
function chapterOf(diff) {
  const d = +diff;
  for (let i = 0; i < GEO.length; i++) if (d >= GEO[i][0] && d <= GEO[i][1]) return Math.min(9, Math.ceil((i + 1) / 2));
  return 9;
}
const CHAPTER_NAMES = {
  1: '章1·序章(难1-9 大唐/两界山)', 2: '章2(难10-18 黄风岭/流沙河)', 3: '章3(难19-27 五庄观/火云洞)',
  4: '章4(难28-36 车迟国/通天河)', 5: '章5(难37-45 女儿国/真假猴王)', 6: '章6(难46-54 火焰山/祭赛国)',
  7: '章7(难55-63 狮驼岭/比丘国)', 8: '章8(难64-72 天竺·玉兔)', 9: '章9(难73-81 灵山/凌云渡)',
};
const HERO_CN = { tangseng: '唐僧', wukong: '悟空', bajie: '八戒', xiaobailong: '白龙', shaseng: '沙僧', all: '全英雄' };

let pass = 0, fail = 0;
function ck(name, cond, extra) { if (cond) pass++; else { fail++; console.log('  ✗ ' + name + (extra ? '  ' + extra : '')); } }

console.log('==================================================');
console.log('一、六道专职转职（ZHUANJIE）章节门槛与要求');
console.log('==================================================');
const Z = N.ZHUANJIE;
const self = Z.selfCheck();
ck('ZHUANJIE.selfCheck 通过', self.ok, JSON.stringify(self.bad));
const TIER_CN = ['一转', '二转', '三转'];
console.log('\n各道三阶解锁章(actGate) 与 道点/行为/善恶要求：');
Z.DAOS.forEach((dao) => {
  const C = Z.CLASSES[dao];
  const gates = [0, 1, 2].map((t) => { const g = Z.gateOf(dao, t); return `章${g.actNeed}(${TIER_CN[t]})`; });
  console.log(`  ${dao}：daoGate[${C.daoGate}] behGate[${C.behGate}] actGate[${C.actGate}] → ${gates.join(' / ')}`);
});
// 每章可转职矩阵
console.log('\n每章可解锁的 转职阶（六道×三阶）：');
for (let ch = 1; ch <= 9; ch++) {
  const avail = [];
  Z.DAOS.forEach((dao) => {
    [0, 1, 2].forEach((t) => {
      const g = Z.gateOf(dao, t);
      if (g.actNeed === ch) avail.push(`${dao}${TIER_CN[t]}`);
    });
  });
  console.log(`  ${CHAPTER_NAMES[ch]}: ${avail.length ? avail.join('、') : '（无新阶）'}`);
}

console.log('\n==================================================');
console.log('二、隐藏转职（HIDDEN_JOBS）章节分布');
console.log('==================================================');
// 汇总：从 HIDDEN_JOBS(按 hero) 与 TRIAL_LIB.hidden 两路合并
const byChapter = {}; // ch -> { hero: Set(job) }
const jobChapter = {}; // job -> ch
Object.keys(L).map(Number).sort((a, b) => a - b).forEach((i) => {
  const t = L[i]; if (!t.hidden) return;
  const ch = chapterOf(i);
  const h = t.hidden;
  byChapter[ch] = byChapter[ch] || {};
  byChapter[ch][h.hero] = byChapter[ch][h.hero] || new Set();
  byChapter[ch][h.hero].add(h.job);
  jobChapter[h.job] = ch;
});
console.log('\n每章 隐藏职覆盖（英雄→职）：');
const HERO_KEYS = ['tangseng', 'wukong', 'bajie', 'xiaobailong', 'shaseng'];
for (let ch = 1; ch <= 9; ch++) {
  const bc = byChapter[ch] || {};
  const lines = [];
  HERO_KEYS.forEach((hk) => { if (bc[hk]) lines.push(`${HERO_CN[hk]}:${[...bc[hk]].join('/')}`); });
  if (bc.all) lines.push(`全英雄:${[...bc.all].join('/')}`);
  console.log(`  ${CHAPTER_NAMES[ch]}: ${lines.length ? lines.join('  ') : '（无）'}`);
}
// 每英雄隐藏职总数 + 覆盖章
console.log('\n每英雄 隐藏职清单（按章）：');
HERO_KEYS.forEach((hk) => {
  const jobs = Object.keys(jobChapter).filter((j) => {
    const t = Object.values(L).find((x) => x.hidden && x.hidden.job === j);
    return t && t.hidden.hero === hk;
  });
  const chs = jobs.map((j) => jobChapter[j]).sort((a, b) => a - b);
  console.log(`  ${HERO_CN[hk]} (${jobs.length}): ${jobs.map((j) => `章${jobChapter[j]}·${j}`).join('、')}`);
});
// 全英雄职
const allJobs = Object.keys(jobChapter).filter((j) => { const t = Object.values(L).find((x) => x.hidden && x.hidden.job === j); return t && t.hidden.hero === 'all'; });
console.log(`  全英雄 (${allJobs.length}): ${allJobs.map((j) => `章${jobChapter[j]}·${j}`).join('、')}`);

// 缺口断言：章4/5/6（无全英雄职的密集中段）应覆盖全部5英雄
[4, 5, 6].forEach((ch) => {
  const bc = byChapter[ch] || {};
  const miss = HERO_KEYS.filter((hk) => !bc[hk]);
  ck(`章${ch} 覆盖全部5英雄`, miss.length === 0, miss.map((m) => HERO_CN[m]).join('缺'));
});

// 接线一致性：HIDDEN_JOBS 登记 ↔ TRIAL_LIB.hidden 节点
// 已知「非 TRIAL_LIB.hidden 节点」触发（设计内、非缺失）：
const EXEMPT = {
  '龙太子归': 'RETURN_TRIALS/events.js 独立触发（难59 返程段节点 hidden），未接入主线 TRIAL_LIB',
  '逆兽师·百逆归心': 'game_event_2.js:364 逆道专属代码路径触发（难64 + isNiRoute），非 TRIAL_LIB.hidden 节点',
};
let wireMiss = 0;
Object.keys(N.HIDDEN_JOBS || {}).forEach((k) => {
  (N.HIDDEN_JOBS[k] || []).forEach((x) => {
    const node = L[x.trial];
    const wired = node && node.hidden && node.hidden.job === x.job;
    if (wired) return;
    if (EXEMPT[x.job]) { console.log(`  · 豁免(设计内): ${x.job}(难${x.trial}) — ${EXEMPT[x.job]}`); return; }
    wireMiss++; console.log(`  ✗ 接线缺失: ${x.job}(难${x.trial}, hero=${x.hero || k}) 无对应 TRIAL_LIB.hidden`);
  });
});
ck('HIDDEN_JOBS 全部已接线 TRIAL_LIB.hidden（豁免设计内项）', wireMiss === 0, '缺 ' + wireMiss);

const total = Object.keys(jobChapter).length;
console.log('\n隐藏职总数：' + total);
ck('隐藏职总数 ≥ 26', total >= 26, '=' + total);

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
