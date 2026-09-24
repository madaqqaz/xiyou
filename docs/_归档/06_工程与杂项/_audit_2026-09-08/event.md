# 《逆道西行》事件与剧情内容子系统 · 运行时审计

- 审计日期：2026-09-08
- 审计方式：**Node harness 运行时证据**（parse index.html → stub DOM → require 逻辑层 → 取 `global.NDX`），非静态推测。
- 探针脚本：`D:/xiyou/demo/scripts/_audit_event.js`（92 个逻辑层文件全部载入，失败 0）
- 交付物：本文件 + 原始探针输出 `docs/_audit_2026-09-08/event_raw.txt`

---

## 一、审计方法与探针清单

| 探针 | 主题 | 关键结论 |
|---|---|---|
| 1 | 事件总量与 17 地区分布 | 通用池占比仍高，地区辨识度低（与记忆基线一致） |
| 2 | 八十一难覆盖 | 1-81 全覆盖，无空难；Boss 数值由 `monsterAt` 全量支撑 |
| 3 | 谈判系统 / 分支互斥 | 谈判已接入但门禁极严；互斥规则执行良好（0 违规） |
| 4 | 新手教学落地 | **NEWBIE_TEACH 数据表已删、teach-event 已移除**，教学仅靠代码侧散点 banner |
| 5 | 剧情对话挂载 | `trialByLayer` 1-81 全挂载；HERO_TRIALS 五英雄覆盖 |
| 6 | 文档 vs 代码 | 多项"说有没接"：教学库删除、teach-event 移除 |

---

## 二、探针 1：事件总量与地区分布（运行时证据）

**总量**：`NDX.EVENTS` = 152 条。有 region 限定 94（61.8%），**无 region 通用池 58（38.2%）**——与记忆基线（~58 通用 / 38%）完全吻合。

**region 跨度**：94 条全部为单地区独占（跨度=1），即不存在跨区共享的地区专属事件。

**每地区分布**（口径同 `NDX.pickEvent`：通用池对所有地区可见）：

```
地区  名称             难数 独占 可出現(含通用) 通用占比  密度
 1 大唐境内            4    4      62          93.5%    15.50
 2 两界山              5    5      63          92.1%    12.60
 3 黄风岭              4    4      62          93.5%    15.50
 5 五庄观              4    5      63          92.1%    15.75
13 狮驼岭              4    8      66          87.9%    16.50
15 天竺·玉兔           9    9      67          86.6%     7.44
17 凌云渡              4    5      63          92.1%    15.75
（其余 9 地区介于上述之间，通用占比 87.9%~93.5%）
```

**地区辨识度判定**：
- 独占事件 min=4 / max=9 / 均值=5.5（记忆基线 [4,9] 仍成立）
- 无独占=0 的地区；独占≤3 的地区：无
- **单地区可出現事件池平均 63.5 条，其中通用占 91.3%**

**结论**：事件总量 152 看似充足，但 91.3% 的可出現事件为通用池，地区"专属记忆点"仅 4-9 条/地区。**地区辨识度低的核心结论仍成立**——玩家在任一地区内反复撞见通用事件，地域叙事标签被稀释。

**字段完整度**：无 opts=0、仅 1 选项=0、含【战】分支=142（93.4%）、全部选项无 fate=0（结构完整）。
**过滤维度闲置**：hero 限定=0、dao 限定=0、chainId 链式=0——`pickEvent` 支持的英雄/道线/链式过滤维度完全未被事件数据使用（证据：脚本探针 1.7）。

**双线池 `NDX.SUTRA_EVENTS`** = 157 条：渡线 91 / 逆线 64 / 其它 2；装备池 51、普通池 106。逐地区：通用 3 个地区无装备池（地区1/11/17 显示 `<< 无装备池`），渡线明显多于逆线。

---

## 三、探针 2：八十一难覆盖

- `TRIAL_LIB`=81、`TRIAL_BOSS`=81、`RETURN_TRIALS`=30、ACT_RANGES 累计=81，**1-81 全覆盖，无缺失难号、无空难**（探针 2.2）。
- **Boss 数值来源**：`game_event_2.js:68` `const mData = NDX.monsterAt(node.diff)`——trial 战斗数值由 `monsterAt(diff)` 提供。**`monsterAt` 对 1-81 全覆盖、战斗必需字段（hp/atk/matk）无缺失**（探针 2.6）。
- ⚠️ **重要纠错**：早期"TRIAL_BOSS 名未在 BOSS/ELITE/MONSTER 表命中 74/81"为**误报**——TRIAL_BOSS 名称仅作日志/标题标签，`fight(m, bossName,...)` 不据此查表。
- type 分布：fight 39 / event 36 / story 4 / boss 2。
- 选项数：2 选项 4 难、3 选项 60 难、4 选项 16 难、6 选项 1 难；**echo 伏笔 80/81、hidden 隐藏职 22/81、treasure 26/81、drop 固定掉落 0/81**。
- **暗文本偏薄**：23/81 难 `dark` 字段 <40 字（如 73 化电归真 len=24、67 铜台辨冤 len=29），需结合 `intro`/`text` 复核实际展示长度（探针 2.2）。
- **立绘缺口**：71/81 难 `portrait` 为空（仅约 10 难设立绘）。

---

## 四、探针 3：谈判系统 与 分支互斥

**谈判已接入**（file:line 证据）：
- `js/game/game_core_2.js:549` `followerForEnemy` + `canNegotiate` 判定 → `kind:'negotiate'`
- `js/game/game_meta.js:303` `prototype.negotiate`
- `js/ui/ui_panel_2.js:786` `kind==='negotiate'` 渲染
- `js/main.js:1511` `case 'negotiate-opt'`

**门禁极严**（`data_negotiate.js:75-85`）：`canNegotiate` 要求 `niDaoUnlocked()`（二周目通关）+ `mainDaoOf==='逆'` + 有可收随从 + 已持经文≥1 或碎片≥5。**首周目 / 非逆道玩家全局不可谈判**（运行时 `niDaoUnlocked()` 当前返回 false）。

**地区末难可谈判覆盖**：按 `bossNameForAct` 名映射仅 **9/17** 地区末难可谈判（黄风岭/通天河/女儿国/真假猴王/火焰山/祭赛国/狮驼岭/天竺/灵山），其余 8 个地区 Boss（刘洪、白龙、沙僧、奎木狼、车迟、比丘、凌云渡等）无 NEGOTIABLE 映射。

**分支互斥规则落地良好**（file:line）：
- `game_event_2.js:369` `isAttrOpt` / `:380` `isLootOpt` / `:391-404` `gotEquip` 装备二选一
- `game_event_1/2/3.js` `NDX.rollEquips(eff.equip, s, eff.slot)` 槽位限定
- `game_event_3.js:474-476` `eff.sutra` 走 `grantSutraShard`；`:501-508` `sutraSystemUnlocked` 门禁；`:534-535` `grantNiSutraFrag`（逆道经文碎片）
- **数据侧自检**：EVENTS 同选项同时含装备+经文 = 0；SUTRA_EVENTS `gear&&sutra` 同选项 = 0 → **互斥规则执行无违规**。

---

## 五、探针 4：新手教学 落地（重点）

**核心结论：教学"说有没接"，逻辑层确有断档。**

- `typeof NDX.NEWBIE_TEACH = undefined` → **开发文档 §31.8 承诺的四组教学内容库（n1/n2/n3/boss1）数据表已删除**，harness 未载入（探针 4.1）。
- 全库关键词扫描（排除备份/_jx_mobile/.bak）：`NEWBIE_TEACH` 0 处、`teach-event` **仅 1 处**（`js/main.js:671` 注释"V8.5x 已移除 teach-event 逐句教学"）、`teach-highlight` 5 处、`teach-bubble` 10 处（探针 4.2）。
- CSS 样式 `.teach-highlight`/`.teach-bubble` 仍存在（`css/style.css:9318/9337`，多份重复块至 14510），但**仅被 `newbie-fight`/`tutorial` 实战引导消费**（`ui_panel_1.js:314/325`、`ui_panel_3.js:34/36`）。
- 现教学 = 代码侧硬编码散点 banner：`mob/trial/sixdao/elite/boss/newbie-boss/tutorial`（`game_core_2.js:238-571`、`ui_modals_2.js:41-62`）。
- **缺口**：无结构化教学内容库、无"明白了"推进流程、地图仅 `L≤3` 高亮（`ui_map.js:212`）；前几难缺乏系统性、连贯的引导体系，教学靠散点提示堆砌。

---

## 六、探针 5：剧情对话 挂载与分支

- `NDX.trialByLayer(layer, hero)` 实测：无 hero 入参时 1-81 全部命中 TRIAL_LIB 文本（**81/81**）；五英雄 `HERO_TRIALS[hero]` 各 81/81 命中（探针 5.2）。
- `HERO_TRIALS` 覆盖：wukong 81 / bajie 81 / shaseng 81 / xiaobailong 81 / tangseng 80（层）（探针 5.3）。
- 随机 `NDX.TRIALS` 池 = 22 条，含 heroLock 专属劫难 1、__xinmo 1。
- `echoPayoff` 已定义且接入 `game_core_2.js:365`（探针 5.4），伏笔埋点 80/81，但 payoff 触发面受随机池限制。
- 挂载链路：`game_core_2.js:359/361/365`、`game_event_1.js:247/248`、`data_trials_story.js:190/238/341` 均确认。

---

## 七、探针 6：文档 vs 代码 落地率

| 特征承诺 | 运行时落地 | 备注 |
|---|---|---|
| 八十一难剧情脚本完整 | ✅ 已落地 | TRIAL_LIB 1-81 全覆盖，但 23 难 dark<40 字 |
| NEWBIE_TEACH 教学内容库 | ❌ 未落地 | 数据表已删除 |
| teach-event 逐句教学 | ❌ 未落地 | main.js:671 已移除 |
| SUTRA_EVENTS 双线池 | ✅ 已落地 | 157 条，3 地区无装备池 |
| 谈判系统 | ✅ 已落地(受限) | 门禁二周目+逆道，9/17 地区可谈判 |
| HERO_TRIALS 英雄专属 | ✅ 已落地 | 五英雄覆盖 |
| echo 伏笔 payoff | ✅ 已落地 | 触发面受随机池限制 |

关键内容文档均存在（`开发文档.md`、`代码实证分析报告_2026-09-08.md`、八十一难剧情脚本、事件系统补充设计、内容分析报告）。

---

## 八、P0 / P1 / P2 不足汇总（含关键证据）

### P0 — 内容量与地区辨识度（核心短板）
1. **地区辨识度低，结论仍成立**：通用池 58 条占 38.2%，单地区可出現池通用占 **91.3%**，独占事件仅 **4-9 条/地区**（均值 5.5）。玩家单局内事件高度重复，地域标签被稀释。证据：探针 1.1/1.4/6.3。
2. **过滤维度全闲置**：`pickEvent` 支持的 hero/dao/chainId 事件数均 = 0，英雄线、道线、链式剧情无内容区分。证据：探针 1.7。

### P1 — 教学落地断档（说有没接）
3. **NEWBIE_TEACH 教学库已删 + teach-event 已移除**，但《开发文档》§31.8 仍承诺四组教学内容库；现教学仅靠代码侧散点 banner，无结构化体系、无"明白了"流程、地图仅 L≤3 高亮。证据：`main.js:671`、`typeof NDX.NEWBIE_TEACH=undefined`、探针 4.1-4.4。
4. **谈判系统可达性极低**：门禁 `niDaoUnlocked()+mainDao==='逆'`（data_negotiate.js:77-78），首周目/非逆道全局不可谈判；17 地区末难仅 9/17 可谈判。证据：探针 3.2-3.3。

### P2 — 内容质量与一致性
5. **暗文本偏薄**：23/81 难 `dark` <40 字。证据：探针 2.2。
6. **立绘缺口**：71/81 难无 `portrait`。证据：探针 2.2。
7. **Boss 命名双系统不一致**：`TRIAL_BOSS` 名 vs `bossNameForAct(BOSS_NAMES)` 名并行（如"水贼刘洪" vs "刘洪·江流索命"），实战标签与预览不一致。证据：探针 2.5。
8. **双线池分布不均**：SUTRA_EVENTS 渡线 91 / 逆线 64，且地区 1/11/17 无装备池。证据：探针 1.8。

### 正面结论（已验证良好）
- 八十一难 1-81 全覆盖、Boss 数值 `monsterAt` 全量支撑，无空难。
- 谈判/分支选项互斥规则（`isAttrOpt`/`isLootOpt`/`rollEquips`/`grantNiSutraFrag`）完整落地，**数据侧 0 违规混发**。
- 剧情挂载 `trialByLayer` 1-81 全命中，HERO_TRIALS 五英雄覆盖完整。