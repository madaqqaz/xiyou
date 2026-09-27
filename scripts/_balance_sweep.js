// _balance_sweep.js — 战斗平衡回归采样（设计者视角 P0）
// ---------------------------------------------------------------------------
// 目的：给《逆道西行》一套「可常驻跑批」的平衡手感采样。
//   门禁已覆盖 结构/语法/一致性；但「玩家 vs 各 Boss 的胜率/回合数/残血分布」
//   没有常驻验证。本脚本在 computeStats 的 GGA 属性结算 + calcCombat 真实内核之上，
//   批量采样 9 章末 Boss 的平衡曲线，输出可读表格，并带一层默认关闭的基线断言。
//
// 用法：
//   node scripts/_balance_sweep.js            → 全量采样 + 基线断言（默认 EXPLICIT_BASELINE）
//   node scripts/_balance_sweep.js --baseline  → 强制开启基线门禁（供 _run_all_gates 选配）
//   node scripts/_balance_sweep.js --demo      → Demo 模式：仅采样前三章，输出 bare/legacy × 六道 胜率对比
//   node scripts/_balance_sweep.js --demo --baseline → Demo 模式 + 硬性基线门禁
//   node scripts/_balance_sweep.js --csv       → 额外输出 CSV 到 scripts/_balance_out.csv
//   node scripts/_balance_sweep.js --seeds=40            → 40 个采样点（默认，两尺同源）
//   node scripts/_balance_sweep.js --seed-list=0.99,0.5  → 显式种子序列（旧写法仍兼容）
//
// 判定：基线断言开启时，任何 Boss 的「胜率采样均值」落到 RATIONABLE 区间之外
//   ⇒ 非 0 进程退出（blocking），供门禁抓取。默认（不带 --baseline）仅报告、不阻断，
//   保证本脚本不抢跑手调平衡。
//
// 设计约束（对齐宪法）：
//   - 只读：装载真实 index.html 全链（含 buff_system / combat_part1 / computeStats / bossStageSetup）
//   - 确定性：唯一随机源 Math.random 桩为可入种子序列，逐 Boss 可复现
//   - 真实 Boss：经 bossStageSetup 构造多阶段 rawMonster（不造 zero-strength 假面）
//   - 采样：diff 爬升贯穿，Boss 强度随难号/档位爬升，检验"曲线平滑"是否被打穿
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
// R1（2026-09-27）：平衡常量/换算的**单一真源**。此前 sweep 与 run_model 各复制一份
//   ROUTES/DAO_ATK/CHAPTER_ENDS/HERO_GEAR_CHAIN/applyFightScale/bossRaw/applyRoute/metaBonus，
//   已实际漂移出「sweep 战/夺 mult 停在 1.0、真机是 1.12/1.20」⇒ 本尺在测零压强假想局。
const CB = require('./_balance_common.js');

// —— 命令行参数（R7：--seeds=N 采样点数，默认 40；--seed-list=a,b 显式序列）——
const ARGS = process.argv.slice(2);
const WANT_BASELINE = ARGS.includes('--baseline');
const WANT_DEMO = ARGS.includes('--demo');
const WANT_CSV = ARGS.includes('--csv');
const SEEDS_ARG = (ARGS.filter((a) => a.startsWith('--seeds=')).map((a) => a.split('=')[1]) || [''])[0];
const SEEDLIST_ARG = (ARGS.filter((a) => a.startsWith('--seed-list=')).map((a) => a.split('=')[1]) || [''])[0];
const SEEDS = CB.resolveSeeds(SEEDS_ARG, SEEDLIST_ARG, CB.DEFAULT_SEED_N).filter((n) => Number.isFinite(n));

// —— 装配平面（R1：内核装载 + 种子化 PRNG 已抽到 _balance_common.js，两尺同构）——
// 种子化 PRNG 的意义（探针 _tmp_action_probe 实证，脚本已归档至 scripts/_retired/_tmp_20260927/_tmp_action_probe.js）：旧桩 Math.random 恒返回单一种子值，使整局每个
// 随机判定（怪物动作加权、暴击、闪避…）坍缩为同一结果——种子高时怪物全程 guard/buff 白嫖全胜、低时
// 全程普攻被秒，少量种子只能表达二态点（曾致满屏 21% 平台 / 0% 陡降的伪胜率）。

// —— 玩家构造器（随章/随难号取真实 computeStats 面板）——
// 口径=用户确认：「当档裸号+装备」。装备随章缓增、保守（非最优）。
// run 状态：
//   bare  —— 首通·无遗产：守恒装备，无局外加成。
//   legacy—— 3-5 次后·衣冠冢：守恒装备 + 取回一件高阶遗物(武器/组件) + 真实难簿成就加成。
//             「遗产」是装备向的跨局强化（没死者留在第X章衣冠冢的装备，下局到X章取回），
//             非数值膨胀；余量靠现有成就系统（achievements.js globalAchBonus 公式）。
function repEquip(ai) {                      // ai=章下标 0..8（兜底用：三槽装载失败时退保守单件）
  const c = ai / 8;
  return [{ id: 'pw', slot: 'weapon', atk: Math.round(20 + 120 * c), matk: Math.round(60 + 220 * c),
    hp: Math.round(900 + 2600 * c), dr: +(0.02 + 0.04 * c).toFixed(3), mdef: +(0.04 + 0.06 * c).toFixed(3) }];
}
// —— 当档三槽装备（真实口径，V8.58 落地）——
// 复刻真实游玩：英雄专属成长链 weapon/armor/treasure 三槽随章自动进阶（upgradeHeroGear，
// targetTier = min(max(act,1),4)，act≥4 后全用 tier4 终极件）。经 NDX.lootById 装载
// EQUIP_POOL 真值副本，杜绝复制数值漂移。
// 道带→英雄映射（**平衡取样用**，非游戏内机制：V9.51 起英雄本命道已取消，
//   道带英雄只用于给每条道挑一个代表性英雄面板，与《五英雄养成总表》v1.1 的推荐路线一致）：
//   渡=取经人(tangseng) / 战=沙僧(shaseng) / 夺=悟空(wukong)；逆无候选英雄，用取经人作保守代表。
// 装备链 id（凡品→ch2→ch3→ch4，EQUIP_POOL 真值）：
//   取经人：九环锡杖·凡→度→渡厄→大乘；锦斓袈裟·凡→净→金身→佛光；紫金钵盂→慈→悲悯→无量
//   沙僧：降妖宝杖·凡→沉→卷澜→天河；沉沙僧袍·凡→固→护念→流沙；降妖念珠·凡→净→梵音→无量
//   悟空：金箍棒胚→初醒→闹天→齐天；锁子甲胚→韧→烈→大圣；如意精箍棒→束缚→镇魔→天命
const HERO_GEAR_CHAIN = CB.HERO_GEAR_CHAIN; // R1：单一真源
function threeSlotEquip(NDX, ai, heroId) {
  const chain = HERO_GEAR_CHAIN[heroId] || HERO_GEAR_CHAIN.tangseng;
  const tier = Math.min(Math.max(ai + 1, 1), 4) - 1; // 章下标0..8 → 章1..9 → tier1..4(封顶)
  const out = [];
  for (const slot of ['weapon', 'armor', 'treasure']) {
    const id = chain[slot][tier];
    const e = NDX.lootById ? NDX.lootById(id) : null;
    if (e) out.push(Object.assign({}, e)); // 副本，防共享引用被消费
  }
  if (!out.length) return repEquip(ai);     // 装载失败兜底：退保守单件
  return out;
}
// 衣冠冢遗物（legacy）：在当档三槽之上，把取回的高阶武器/组件抽象为「词条 ×1.55 的武器」。
function legacyEquip(NDX, ai, heroId) {
  const set = threeSlotEquip(NDX, ai, heroId);
  const w = set.find((e) => e.slot === 'weapon');
  if (w) { w.atk = Math.round((w.atk || 0) * 1.55); w.matk = Math.round((w.matk || 0) * 1.55); }
  return set;
}
// 当档善念（渡道裸号保守量级）：单事件 +5~40，81 难渡道可上百；取保守下限递增。
// good 是取经人核心乘区（慈悲愿力 法伤+10%/善念、慈悲血量 +0.4%/善念，combat_part1.js:449/697），
// 裸号 0 善念会把法伤流玩家面板砍到只有基础值——曾致采样假性全败。
const BARE_GOOD = [12, 18, 24, 30, 34, 38, 42, 46, 50]; // ch1..9
const LEGACY_GOOD = 60;                                // run3-5 渡道积累
const NO_META = {};
// 六道攻式（dao_system.js DAO_ATK_STYLE 同源）：玩家路线选择直接改写战斗行为。
// 采样口径修正：此前未设 daoAtk，渡道「25% 伤害回血」/战道「25% 暴击」/夺道「20% 吸血」
// 全部缺席——曾致「满meta 渡 ch9 只有 20%（实为 Boss 随机不出手的伪胜率）」，属系统性低估。
// V8.57 demo 补齐六道：隐（影遁必杀·闪避后必爆，pct=0 纯机制）与缘（缘起护身·20% 伤转盾）。
// R1：常量已抽到 _balance_common.js（含 V9.66 逆道 ls=0.035 逆血续航）。
const DAO_ATK = CB.DAO_ATK;
// 「满meta」局外永久加成：严格复刻 achievements.js 的真实难簿逐难公式（R1 已抽真源）
function metaBonus(ndx, nb, over) { return CB.metaBonus(ndx, nb, over); }
const META_NB = 45; // 3-5 次后：跨局累计 ~45 项难簿成就
// 满meta（V8.57）：难簿全解锁（ACH_BONUS_CAP=81），软上限后按 50% 折算；装备仍为当档三槽裸号
// ——与 legacy（run3-5 衣冠冢）区分：满meta 是成就向的局外永久加成，不叠 1.55× 衣冠冢遗物。
const META_NB_FULL = 81;
const META_GOOD = 80; // 满meta 渡道善念积累（81 难渡道可上百，取保守中值）
function makePlayer(NDX, ai, diff, mode, daoKey, heroId) {
  const h = heroId || 'tangseng';
  const eq = (mode === 'legacy') ? legacyEquip(NDX, ai, h) : threeSlotEquip(NDX, ai, h); // meta/bare 均落三槽裸号
  const bonus = (mode === 'legacy') ? metaBonus(NDX, META_NB)
             : (mode === 'meta') ? metaBonus(NDX, META_NB_FULL)
             : NO_META;
  const good = (mode === 'legacy') ? LEGACY_GOOD
             : (mode === 'meta') ? META_GOOD
             : BARE_GOOD[Math.min(Math.max(ai, 0), 8)];
  const daoAtk = DAO_ATK[daoKey] || null; // 六道攻式（渡回血/战暴击/夺吸血/逆真伤）
  const P = NDX.computeStats(h, eq, [], bonus, diff);
  // 对齐 fight() 的 _playerObj 骨架（战斗内核消费 ti.hp/curHp/maxHp 等；被动按 player.heroId 查 HEROES）
  return {
    heroId: h, good: good, daoAtk: daoAtk,
    spd: (P.spd != null ? P.spd : 8),
    ti: Object.assign({}, P.ti, { hp: P.ti.maxHp, curHp: P.ti.maxHp }),
    yuan: { matk: P.yuan.matk, mdef: P.yuan.mdef },
    reflect: P.reflect || 0, shieldPct: P.shieldPct || 0, armorPen: P.armorPen || 0,
    sealReflect: P.sealReflect || 0, lifesteal: P.lifesteal || 0, evaOnDodge: P.evaOnDodge || false,
    fateFlags: P.fateFlags || {}, coll: P.coll || {}, battleFlags: {}, engineTier: P.engineTier || {},
  };
}

// —— 用难号标尺给 Boss 定档（最小覆盖：前/中/后/终局代表难号）——
// 注：代表难号必须是「真实关隘难号」→ 经 bossNameForAct(act) 取章节 Boss 真名，
//   绝不直接用 TRIAL_BOSS 显示名（其与 BOSS_FORMS 键不符会造成零强度假面）。
// R1：REPRESENTATIVE_ACTS / DIFF_BAND 已随「章末难号」并入 _balance_common.CHAPTER_ENDS。
function numberOr(n, def) { return (Number.isFinite(+n) && n != null) ? +n : def; }

let pass = 0, fail = 0;
const lines = [];

// —— 校准配置：每章末 Boss 强度系数 B(act) ——
// 用户目标阶梯（当档裸号+装备）：ch1 硬而可过；ch2 单一六道必过；ch3 正确装备可过；
// ch4 首通≈墙；ch9 满meta(run5) 战/夺可通。
// R1：章末难号与 B_SEQ 已并入 _balance_common（两尺同源）。
const CHAPTER_ENDS = CB.CHAPTER_ENDS;         // 9章·章末难号
const B_SEQ = CB.B_SEQ;
// 道带（R1：真源在 _balance_common.ROUTES_FOUR / ROUTES_SIX）
//   ⚠ 原本地面 战/夺 mult=1.0 是 V9.65 之前的陈旧值 ⇒ 本尺曾长期在测「零道带压强」的假想局。
//     V9.65 起真机 `game_event_2.js:307-315` 已写 monStr += 0.03(战)/0.05(夺)，4 次封顶 ⇒ 1.12 / 1.20。
// dao 字段：该道带对应的六道攻式键（渡回血 / 战暴击 / 夺吸血 / 逆真伤），必须随道带传入 makePlayer，
//   否则六道攻式（DAO_ATK）缺席——曾致采样玩家无渡道回血，ch3+ 伪全败（0%）。
// hero 字段：道带代表英雄（**平衡取样用**，非游戏内机制——V9.51 起英雄本命道已取消：
//   渡=取经人/战=沙僧/夺=悟空）；逆无候选英雄，用取经人作保守代表。英雄面板+被动（悟空的 mercyAtk、沙僧的 mReflect 等）
//   由 calcCombat 按 player.heroId 查 HEROES 自动生效（combat_part1.js:353-365）。
const ROUTES = CB.ROUTES_FOUR;
// 六道（demo 模式）：隐=闪避线(小白龙)、缘=辅助线(八戒)；攻式键与 DAO_ATK 对齐。
const SIX_DAO_ROUTES = CB.ROUTES_SIX;

// R1：applyFightScale / bossRaw / applyRoute 已并入 _balance_common（与 fight() 同源，钳位 0.03/档·封顶 1.6）。
const bossRaw = CB.bossRaw;
const applyRoute = CB.applyRoute;
const clone = CB.clone;

// 多名玩家副本（对局内不共用引用）。daoKey+heroId 随道带传入（六道攻式/英雄面板必须生效）
function playerBuilder(NDX, ai, diff, meta, daoKey, heroId) {
  return () => makePlayer(NDX, ai, diff, meta, daoKey, heroId);
}

// 每种子独立对局，跨种子聚合（确定性随机源已转发到 common 的 setRep）
function sampleMon(NDX, rawMonster, pb) {
  const wins = [], rounds = [], hpPct = [];
  let n = 0;
  for (const seed of SEEDS) {
    setGlobalRep(seed);
    if (typeof NDX.calcCombat !== 'function') continue;
    const player = pb();
    let res;
    try { res = NDX.calcCombat(player, clone(rawMonster), { stanceSeq: ['ATK'] }); } catch (e) { continue; }
    if (!res) continue;
    n++;
    wins.push(!!res.win && !res.lose ? 1 : 0);
    const r = Number.isInteger(res.totalRounds) ? res.totalRounds : (Array.isArray(res.roundsDetail) ? res.roundsDetail.length : 0);
    rounds.push(r);
    const base = numberOr(player.ti && player.ti.maxHp, 3000);
    hpPct.push(base > 0 ? Math.max(0, Math.min(1, numberOr(res.playerHpLeft, 0) / base)) : 0);
    if (SEEDS.length === 1) break;
  }
  if (n === 0) return null;
  const sortedP = hpPct.slice().sort((a, b) => a - b);
  return { n, winRatio: wins.reduce((a, b) => a + b, 0) / n,
    avgRounds: rounds.length ? rounds.reduce((a, b) => a + b, 0) / rounds.length : 0,
    avgHpPct: hpPct.length ? hpPct.reduce((a, b) => a + b, 0) / hpPct.length : 0,
    p10HpPct: sortedP[Math.floor(sortedP.length * 0.1)] || 0 };
}

// —— Demo 模式（V8.57）：仅采样前三章（demo=ch1-3），输出 bare/legacy × 六道 胜率对比 ——
// 用户设计（2026-09-24 确认）：
//   首玩（bare）：仅渡道在装备完全正确时能过第二章；第三章需合成组件+运气（裸号渡 15-25%）；
//                 战/夺/隐/缘/逆（难度带 1.0/1.28）不可过（≤30%）。
//   3-5 次后（legacy 衣冠冢遗物）：六道可正常通过（ch3 遗产/正确装备后 40-60%）。
function reportDemo(NDX) {
  const chapterBosses = NDX.CHAPTER_BOSS_NAMES || [];
  lines.push('== Demo 平衡采样报告（前三章 · 当档裸号+装备）==');
  lines.push('覆盖：ch1-3 章末 Boss × 六道(渡/战/夺/隐/缘/逆) × bare(首通) / legacy(遗产)');
  lines.push(seedLine());
  lines.push('道带倍率：渡×0.72 / 战夺隐缘×1.0 / 逆×1.28（跨度 1.78）');
  lines.push('');
  lines.push('表A：前三章章末 Boss 六道胜率%');
  lines.push('章/Boss\t渡×0.72\t战×1.0\t夺×1.0\t隐×1.0\t缘×1.0\t逆×1.28');
  const allRatios = [];
  const ladder = [];
  for (let ai = 0; ai < 3; ai++) {
    const bossName = chapterBosses[ai]; if (!bossName) continue;
    const diff = CHAPTER_ENDS[ai];
    const rm0 = bossRaw(NDX, bossName, diff);
    for (const mode of ['bare', 'legacy']) {
      const tag = mode === 'legacy' ? '遗产' : '裸号';
      const row = SIX_DAO_ROUTES.map((rr) => {
        const a = sampleMon(NDX, applyRoute(NDX, rm0, rr.mult), playerBuilder(NDX, ai, diff, mode, rr.dao, rr.hero));
        const cell = !a ? 'N/A' : (a.winRatio * 100).toFixed(0) + '%';
        if (a) {
          allRatios.push(a.winRatio);
          ladder.push({ name: `ch${ai + 1}-${mode === 'legacy' ? '遗' : '裸'}-${rr.key}`, ratio: a.winRatio });
        }
        return cell;
      });
      lines.push(`ch${ai + 1}/d${diff} ${bossName}（${tag}）\t${row.join('\t')}`);
    }
  }
  lines.push('');
  const mean = allRatios.length ? allRatios.reduce((a, b) => a + b, 0) / allRatios.length : 0;
  lines.push(`样本均值胜率：${(mean * 100).toFixed(1)}%（样本 ${allRatios.length}）`);
  if (SEEDS.length > 1) lines.push('注：多种子取每格均值，去随机后的真实手感。');
  if (WANT_CSV) {
    const f = path.join(ROOT, 'scripts', '_balance_out.csv');
    fs.writeFileSync(f, 'cell,seed_aggr,winRatio\n' + ladder.map((b) => `${b.name},${SEEDS.length},${b.ratio.toFixed(4)}`).join('\n') + '\n');
    lines.push(''); lines.push(`CSV 已写出: scripts/_balance_out.csv`);
  }
  if (WANT_BASELINE) {
    // demo 硬性基线（用户设计目标）：
    //   ① ch1 渡 bare 可过（≥40%）         ② ch2 渡 bare 可过（≥55%，仅渡可过第二章）
    //   ③ ch2 其余五道 bare 不可过（≤30%）  ④ ch3 渡 bare 运气窗（目标 15-25%，容忍 [10%,40%]）
    //   ⑤ ch3 六道 legacy 可过（≥40%，遗产后六道正常通过）
    const anchors = [];
    anchors.push({ name: 'ch1-裸-渡', need: [0.40, 1.001], label: 'ch1 渡 bare 可过(≥40%)' });
    anchors.push({ name: 'ch2-裸-渡', need: [0.55, 1.001], label: 'ch2 渡 bare 可过(≥55%)——仅渡可过第二章' });
    for (const d of ['战', '夺', '隐', '缘', '逆']) anchors.push({ name: `ch2-裸-${d}`, need: [0.0, 0.30], label: `ch2 ${d} bare 不可过(≤30%)` });
    anchors.push({ name: 'ch3-裸-渡', need: [0.10, 0.40], label: 'ch3 渡 bare 运气窗(目标15-25%)' });
    for (const d of ['渡', '战', '夺', '隐', '缘', '逆']) anchors.push({ name: `ch3-遗-${d}`, need: [0.40, 1.001], label: `ch3 ${d} legacy 可过(≥40%)` });
    let crisp = true;
    for (const an of anchors) {
      const hit = ladder.find((b) => b.name === an.name);
      if (!hit || hit.ratio < 0) { lines.push(`  ? ${an.name} 未采样`); continue; }
      if (hit.ratio < an.need[0] || hit.ratio > an.need[1]) { crisp = false; lines.push(`  ! ${an.label} 实测 ${(hit.ratio * 100).toFixed(1)}%（需 [${(an.need[0] * 100).toFixed(0)},${(an.need[1] * 100).toFixed(0)}]）`); }
    }
    if (crisp) { pass++; lines.push('基线断言：demo 目标阶梯满足 ✓'); }
    else { fail++; lines.push('基线断言：demo 阶梯存在失控样本 ✗（Boss 强度校准后复跑）'); }
  } else {
    lines.push('基线断言：未开启（--demo --baseline 才门禁）。本报告仅信息性。');
    pass++;
  }
}

// R7：自打印采样口径（SEEDS=N + 首/末种子），报告头必须可见 ⇒ 跨版本数字可直接对账
function seedLine() {
  const head = SEEDS.slice(0, 3).join(','), tail = SEEDS.slice(-2).join(',');
  return `随机种子采样：SEEDS=${SEEDS.length}（首 ${head} … 末 ${tail}）`;
}

function report(NDX) {
  if (WANT_DEMO) { reportDemo(NDX); return; }
  const chapterBosses = NDX.CHAPTER_BOSS_NAMES || [];
  lines.push('== 平衡采样报告 · 当档裸号+装备（用户口径）==');
  lines.push('覆盖：9 章末 Boss × 道带(渡/战夺/逆) × 裸号/满meta');
  lines.push(seedLine());
  lines.push('');

  const allRatios = [];
  const ladder = [];

  // 表1：每章末 Boss（当档 diff）当档裸号，四道带胜率（战/夺 分列：英雄与攻式不同，须分别验收）
  lines.push('表1：9 章末 Boss 当档裸号胜率%');
  lines.push('章/diff\tBoss\t渡×0.72\t战×1.0\t夺×1.0\t逆×1.28');
  for (let ai = 0; ai < chapterBosses.length; ai++) {
    const bossName = chapterBosses[ai]; if (!bossName) continue;
    const diff = CHAPTER_ENDS[ai];
    const rm0 = bossRaw(NDX, bossName, diff);
    const row = ROUTES.map((rr) => {
      const a = sampleMon(NDX, applyRoute(NDX, rm0, rr.mult), playerBuilder(NDX, ai, diff, 'bare', rr.dao, rr.hero));
      const cell = !a ? 'N/A' : (a.winRatio * 100).toFixed(0) + '%';
      if (a) allRatios.push(a.winRatio);
      ladder.push({ name: `ch${ai + 1}-裸-${rr.key}`, ratio: a ? a.winRatio : -1 });
      return cell;
    });
    lines.push(`ch${ai + 1}/d${diff}\t${bossName}\t${row.join('\t')}`);
  }

  // 表2：满meta（裸号三槽 + 全量难簿成就）ch9 —— 用户设计目标：满meta 后渡路线 ch9 胜率需 ≥55%
  // V8.57 模式修正：此前误用 legacy（衣冠冢 1.55× 武器 + meta45）冒充满meta，现落回裸号三槽。
  lines.push('');
  lines.push('表2：满meta ch9 胜率%（终局可通，目标渡≥55%）');
  const rm9m0 = bossRaw(NDX, chapterBosses[8], CHAPTER_ENDS[8]);
  for (const rr of ROUTES) {
    const a = sampleMon(NDX, applyRoute(NDX, rm9m0, rr.mult), playerBuilder(NDX, 8, CHAPTER_ENDS[8], 'meta', rr.dao, rr.hero));
    const cell = !a ? 'N/A' : (a.winRatio * 100).toFixed(1) + '%';
    lines.push(`ch9满meta-${rr.key}: ${cell}`);
    if (a) { allRatios.push(a.winRatio); ladder.push({ name: `ch9-满meta-${rr.key}`, ratio: a.winRatio }); }
  }

  if (WANT_CSV) {
    const f = path.join(ROOT, 'scripts', '_balance_out.csv');
    fs.writeFileSync(f, 'cell,seed_aggr,winRatio\n' + ladder.map((b) => `${b.name},${SEEDS.length},${b.ratio.toFixed(4)}`).join('\n') + '\n');
    lines.push(''); lines.push(`CSV 已写出: scripts/_balance_out.csv`);
  }

  lines.push('');
  const mean = allRatios.length ? allRatios.reduce((a, b) => a + b, 0) / allRatios.length : 0;
  lines.push(`样本均值胜率：${(mean * 100).toFixed(1)}%（样本 ${allRatios.length}）`);
  if (SEEDS.length > 1) lines.push('注：多种子取每格均值，去随机后的真实手感。');

  if (WANT_BASELINE) {
    // 路感知硬性基线（目标阶梯；种子粒度粗，用宽带表达）
    //  锚点：渡(最易) — ch1 硬而可过、ch4≈首通墙、ch9 满meta 渡≥55%（用户设计：满meta 后渡路线 ch9 ≥55%）
    const anchors = [];
    anchors.push({ name: 'ch1-裸-渡', need: [0.40, 1.001], label: 'ch1 渡 可过(≥40%)' });
    anchors.push({ name: 'ch4-裸-渡', need: [0.0, 0.45], label: 'ch4 渡 ≈首通墙(≤45%)' });
    anchors.push({ name: 'ch9-满meta-渡', need: [0.55, 1.001], label: 'ch9 满meta 渡 可通(≥55%)' });
    // 逆(最难)必须低于同章渡（难度方向正确）
    let crisp = true;
    for (const an of anchors) {
      const hit = ladder.find((b) => b.name === an.name);
      if (!hit || hit.ratio < 0) { lines.push(`  ? ${an.name} 未采样`); continue; }
      if (hit.ratio < an.need[0] || hit.ratio > an.need[1]) { crisp = false; lines.push(`  ! ${an.label} 实测 ${(hit.ratio * 100).toFixed(1)}%（需 [${(an.need[0] * 100).toFixed(0)},${(an.need[1] * 100).toFixed(0)}]）`); }
    }
    // 难度方向：渡(最易)胜率应最高，逆(最难)最低 ⇒ 胜率随难度单调下降（渡 ≥ 战/夺 ≥ 逆）。
    // B 缩放 / 成长曲线若让难路线胜率反超易路线（渡<战/夺 或 战/夺<逆），即道带反转。
    for (let ai = 0; ai < 9; ai++) {
      const c = (r) => ladder.find((b) => b.name === `ch${ai + 1}-裸-${r}`);
      const _d = c('渡'), _z = c('战'), _q = c('夺'), _i = c('逆');
      if (!_d || !_z || !_q || !_i || _d.ratio < 0 || _z.ratio < 0 || _q.ratio < 0 || _i.ratio < 0) continue;
      const pct = (x) => `${(x * 100).toFixed(0)}%`;
      if (_d.ratio < _z.ratio - 1e-6) { crisp = false; lines.push(`  ! ch${ai + 1} 道带反转（渡${pct(_d.ratio)}% < 战${pct(_z.ratio)}%）`); }
      else if (_d.ratio < _q.ratio - 1e-6) { crisp = false; lines.push(`  ! ch${ai + 1} 道带反转（渡${pct(_d.ratio)}% < 夺${pct(_q.ratio)}%）`); }
      else if (_z.ratio < _i.ratio - 1e-6) { crisp = false; lines.push(`  ! ch${ai + 1} 道带反转（战${pct(_z.ratio)}% < 逆${pct(_i.ratio)}%）`); }
      else if (_q.ratio < _i.ratio - 1e-6) { crisp = false; lines.push(`  ! ch${ai + 1} 道带反转（夺${pct(_q.ratio)}% < 逆${pct(_i.ratio)}%）`); }
    }
    if (crisp && WANT_BASELINE) { pass++; lines.push('基线断言：路感知目标阶梯满足 ✓'); }
    else if (WANT_BASELINE) { fail++; lines.push('基线断言：存在阶梯失控样本 ✗（B(act)/成长曲线调平后复跑）'); }
  } else {
    lines.push('基线断言：未开启（加 --baseline 强制门禁才能 fail）。本报告仅信息性。');
    pass++;
  }
}

// —— 入口：单次装载整链（Math.random 已转发到可切换的 __ndxRep，多种子免重复装载）——
const GAME = CB.loadGame();
const NDX = GAME.NDX;
const setGlobalRep = GAME.setRep;
if (!NDX || typeof NDX.calcCombat !== 'function') {
  console.log('FATAL: NDX.calcCombat 未加载'); process.exit(1);
}
report(NDX);

console.log('\n' + lines.join('\n'));
console.log('\n平衡采样：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail > 0 ? 1 : 0);