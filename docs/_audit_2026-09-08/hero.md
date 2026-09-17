# 《逆道西行》英雄成长与养成 · 运行时代码审计

- 审计日期：2026-09-08
- 方法：Node 无头 harness（`scripts/_audit_hero.js`），parse `index.html` 加载顺序、stub DOM、require 逻辑层、取 `global.NDX`；运行 `node scripts/_audit_hero.js` 取得运行时数字。
- 范围：`js/data_heroes.js` `js/data_heroes_data.js` `js/zhuanjie.js` `js/data_cultivation.js` `js/data_reincarnation.js` `js/data_ultimates.js` `js/data_daoxin.js` `js/data_life.js` `js/hero_trials.js` `js/trials81.js`。
- 对照：`docs/英雄体系整改文档.md` `docs/逆道西行_开发文档.md` `docs/六道专职装备_设计定稿与口径对齐_V8.18.html` `docs/隐藏职业与六道联动_设计文档.md`。

---

## 总览结论

英雄养成的"数据层"实现度较高：英雄清单、基础数值入战、六道转职数值加成、隐藏职业、大招（15 个）、英雄试炼全覆盖均**真实接活**。但存在一处 P0「说有没接」（修炼年轮永久数值未接入战斗）与一处结构性 P0（养成增益被双向动态校准橡皮筋抵消），以及若干 P1/P2 口径偏差。

---

## 探针1 · 英雄清单与基础数值入战 ✅

`NDX.HEROES`（`js/data_heroes_data.js:10`）5 英雄，基础数值见下。运行时 `computeStats(id,[],[],{},diff)` 证明基础数值**真实进入战斗**，非仅 heroId 字符串引用：

| 英雄 | baseAtk | baseHp | baseMatk | baseDr | baseEva | baseSpd | @diff40 实测 atk/hp/matk |
|---|---|---|---|---|---|---|---|
| tangseng | 78 | 1300 | 200 | .26 | .02 | 5 | 940 / 1300 / 1226 |
| wukong | 180 | 880 | 15 | .16 | .05 | 12 | 1042 / 880 / 1041 |
| bajie | 150 | 1250 | 10 | .30 | .01 | 6 | 1012 / 1250 / 1036 |
| shaseng | 180 | 1150 | 120 | .26 | .03 | 7 | 1042 / 1150 / 1146 |
| xiaobailong | 230 | 1000 | 15 | .20 | .28 | 16 | 1092 / 1000 / 1041 |

入战路径：`NDX.playerBaseAt(d,hero)`（`js/data_heroes.js:13`）→ `combat.js:78` 消费；matk 随层成长（`(h.baseMatk)+500*t`）。基础数值差异（如悟空体攻 vs 取经人法伤）在战斗中如实反映。✅ 无空壳。

---

## 探针2 · 隐藏职业 / 六道转职 ✅（接活，但有机制词待查）

- `NDX.ZHUANJIE` 存在，六道 `渡/缘/战/夺/隐/逆`（`zhuanjie.js:34` `CLASSES`），`selfCheck()` 返回 `{"ok":true}`。
- 隐藏职业 `NDX.HIDDEN_JOBS` 6 英雄，多模块消费（`data_trials.js:10` 定义；`attr_calc.js:305`、`combat.js:318`、`game_meta.js:29`、`game_event_2.js:307` 消费），非 stub。
- 转职数值接活：构造 tangseng 渡一转（fate.渡=18），`tierBonus` 返回 `{atkPct:0.05,hpPct:0.167,drPlus:0.083,hpRegen:6.67,engineTier:{shieldPct:0.075}}`；`computeStats` 消费 `bonus.tier`（`combat.js:152`）后 **hp 1300→1517、atk 940→987** → 真实增益 ✅。
- `engineTier` 机制词（破甲/遁影/悖论/夺道吸血/多段）在 `simulateSingle` 确有消费点：`combat.js:592`(sunder) `:466`(vanish) `:632`(paradox) `:681`(夺道吸血) `:629`(多段)，非纯透传空壳。

---

## 探针3 · 修炼（年轮）/ 轮回（劫灰坊）⚠️ P0「说有没接」

### 3.1 修炼年轮永久数值加成未接入战斗（P0）

`NDX.Cultivation.RING_UPGRADES` 8 项（`js/data_cultivation.js:92`）：`hp 初始气血+5%`、`atk 初始攻击+5%`、`life +1岁`、`luck`、`startEquip 开局额外装备+1`、`startSeal 开局额外劫印+1`、`coin`、`exp`。

运行时：买满 hp/atk 后 `getAllBonuses()` = `{hpBonus:0.5, atkBonus:0.5,...}`，但 `computeStats('wukong',[],{},{},40)` 前后 **atk 1042→1042、hp 880→880 零变化**。

根因：`computeStats`（`combat.js:74`）只消费 `playerBaseAt / bonus.ti / bonus.yuan / bonus.sutras / bonus.followers / bonus.seals / bonus.tier`；**全程不接收 `NDX.Cultivation`**。`RING_UPGRADES` 的 hp/atk 只在 `js/ui/ui_cultivation.js:156` 展示（`getAllBonuses`），无战斗消费点。→ **修炼年轮（最核心的跨周目永久成长）根本不进战斗结算**，玩家投入年轮买攻击/气血后战斗数值毫无反馈。P0。

> 注：`life(+寿)`、`startEquip/startSeal(开局生成)`、`coin/exp/luck(经济)` 可能经其他开局路径生效，但核心数值 hp/atk 永久加成确为"说有没接"。

### 3.2 劫灰坊（轮回赐福）

`NDX.ASH_SHOP` 5 线（`js/data_reincarnation.js:56`）。按开发文档 §3 去纵向：`hp 金蝉余韵 / dmg 逆心初萌` = **横向解锁英雄**（不增数值，仅开人选）；`roll 六道亲和 +5%/级`、`chg 法宝共鸣 +1充能/级`、`seal 劫印拓印 +1槽/级` = 纵向数值。运行时 `ashProgress` 正常（六道亲和 5/5 +25%、劫印拓印 3/3 +3 槽）。劫灰坊**设计上已主动去纵向**，与 P0 修炼是不同问题（劫灰是"故意不滚雪球"，修炼是"忘记接线"）。

---

## 探针3b · 双向动态校准橡皮筋抵消成长（结构性 P0）

用 `buildMatchFight`（`_smoke_build_match_fight.js` 同款）验证玩家成长是否被钳制抵消：

| 玩家 | 钳出怪 atk | tank | 压力 pressure | calcCombat 胜率 |
|---|---|---|---|---|
| 裸装悟空 | 100 | 880 | 0.716 | true |
| 战三转悟空（真实+40%atk/+22%hp） | 140 | 1122 | 0.716 | true |
| 买满年轮（未接入→等同裸装） | 100 | 880 | 0.716 | true |

玩家战力经转职真实翻倍以上提升，但 `buildMatchFight` 把怪物威胁**同步放大 1.4×**，压力系数恒定 0.716、胜率不变。**养成增益被橡皮筋完全抵消**——深度养成对实际战斗难度/节奏净影响≈0（仅暴击/buildPower 维度可破橡皮筋，见战斗审计）。叠加探针3.1，修炼线因未接入连"被抵消的资格"都没有。

---

## 探针4 · 大招 ✅ 接入，但门槛与注释偏差（P1）

`NDX.ULTIMATES` 15 个（5 英雄 × 3 阶，`js/data_ultimates.js:9`），均含 `tier/cd/mult/kind/desc`。已接入 `combat.js:1868` `activeSkill` 的 `'ult'` 分支，各 `kind` 有真实机制（crit-dmg/aoe-dmg/ignore-dmg/guard-dmg/multi-dmg/wish-blade/heal-dmg/shield-dmg/drain-dmg）。

偏差（P1）：`ultimateTier`（`js/data_ultimates.js:37`）判定 `s.fate[k] >= 12` 即返回 2 阶，但文件注释写"任一道命数≥18（一转）2"（同文件 36 行）。运行时 `fate.渡=12 → ultimateTier=2`。**注释/代码口径不一致**：若设计意图是命数 18 才解锁 2 阶大招，则当前门槛（12）偏低提前解锁。另 `jobConfirm=true → tier3`（隐藏职 3 阶）正确。

---

## 探针5 · 英雄试炼 ✅ 完整可触发有闭环

`NDX.HERO_TRIALS`（`js/hero_trials.js:48`）五英雄专属剧情覆盖：tangseng **80 难**、wukong/bajie/shaseng/xiaobailong **各 81 难**，全覆盖。注入函数 `NDX.trialByLayer`（`js/data_trials_story.js:190`）被 `game_core_2.js:359`、`game_event_1.js:247` 调用。运行时 `trialByLayer(10,'wukong')` 返回 `{name:'虎先锋拦路', dark:有, treasure:有}` → 可触发、有奖励闭环。

偏差（P2）：奖励闭环主要依赖 `HERO_TRIAL_DROPS`（`js/hero_trials.js:12`）把"取经人线掉落 id → 该英雄专属装备 id"映射，仅个别条目（如 tangseng 难13）直接含 `treasure` 字段。需确认映射目标 id 均存在于 `EQUIP_POOL/TREASURES`，否则奖励掉落空指（待确证）。

---

## 探针6 · 设计文档对照

- 本命法宝 `HERO_BENMING_FABAO`：`js/data_compound.js:325` 定义 5 英雄，消费点 `data_compound.js:335`(按 owner 匹配本命法宝)、`equipment.js:1277`(本命法宝成长链)。但整改文档 `2.6` 仍标 🔴阻断②——代码有定义与消费点，接入完整度与文档清单不同步（P2，待确证真进战斗数值）。
- 本命道 `HERO_HOME_DAO`（`js/data_config.js:87`）+ `HOME_DAO_MULT=1.25`（`js/data_config.js:88`）接活，`combat.js:1796` 本命道放大消费 ✅。
- 本命诵经 `CHANTS` 5 英雄（`js/data_chants.js:13`），大招/诵经均接活（整改文档 2.7 ✅）。
- **六道专职装备设计 V8.18「六套实体装备·三阶转职·合成进化链」**：代码把"三阶转职"实现为**纯数值加成链**（`zhuanjie.js` CLASSES→tierBonus）+ 专属遗物材料（`RELICS`，合成 L5），并非"六套实体装备进化链"。与文档标题/口径偏差（P2）。
- 隐藏职业与六道联动设计文档：HIDDEN_JOBS 6 英雄 + `HIDDEN_TRIAL_REQ` 必经劫难（`data_map.js:359`/`data_trials.js:296`）已落地，触发链路完整（开发文档 §56/§59）。

---

## 不足优先级汇总

### P0
1. **修炼年轮永久数值（hp/atk 等）未接入 `computeStats`**：买满年轮后战斗数值零变化（`data_cultivation.js:92` 定义、`ui_cultivation.js:156` 仅展示、`combat.js:74` 不消费）。跨周目核心成长线"说有没接"。
2. **养成增益被双向动态校准橡皮筋抵消**：转职真实增益 +40%atk 被 `buildMatchFight` 同步钳制怪威胁 1.4×，净胜率/节奏不变（压力恒 0.716）。深度养成对实战无净影响。

### P1
3. **大招阶次门槛偏差**：`ultimateTier` 代码 `fate>=12` 即 2 阶，注释与设计意图为 `>=18`（同文件 36/37 行）。
4. **转职 engineTier 机制词部分落地存疑**：破甲/遁影/悖论/夺道吸血/多段在 `simulateSingle` 有消费点（combat.js:592/466/632/681/629），但 shieldPct 之外的其它机制词（如 multi/vanish 完整行为）依赖回合内核细节，需回归验证是否全生效。

### P2
5. **六道专职装备设计（V8.18）实现为纯数值链+遗物材料**，与"六套实体装备进化链"文档口径偏差。
6. **本命法宝整改文档标🔴阻断②**，代码已有定义与消费点，文档与实现不同步，需确证战斗数值接入度。
7. **英雄试炼奖励闭环**主要依赖 `HERO_TRIAL_DROPS` 映射，需验证所有目标装备 id 在 `EQUIP_POOL` 存在，防空指掉落。

### 已确认接活（非不足）
- 英雄基础数值入战、六道转职数值加成、隐藏职业 HIDDEN_JOBS、大招 15 个战斗机制、英雄试炼全覆盖可触发、本命道 ×1.25 放大、劫灰坊去纵向设计。
