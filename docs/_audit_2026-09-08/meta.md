# 逆道西行 · 元进度子系统审计（地图 / 经济 / 跨周目循环）

> 审计日期：2026-09-08
> 审计对象：D:\xiyou\demo （vanilla JS/CSS 黑暗西游肉鸽 H5）
> 审计方式：运行时证据（Node harness 加载 js/ 逻辑层，取 global.NDX，实跑 generateMap / quotaCheck / favorBonus / globalAchBonus）
> 审计脚本：D:\xiyou\demo\scripts\_audit_meta.js （新建只读探针，未修改任何游戏源文件）
> 静态证据：file:line 由 Grep 定位

## 0. 方法论与口径
- 17 地区 / 81 难 模型由代码实定义：NDX.TOTAL_ACTS=17、NDX.TOTAL_TRIALS=81、NDX.ACT_RANGES.length=17（js/data_region_config.js）。
- 运行时实跑 NDX.generateMap(act) 遍历 17 地区，统计节点类型分布。
- 配额门禁由 NDX.quotaEnabled / quotaCheck / addQuota 实跑验证。
- 货币字段逐一探活（NDX.<field> 是否真实挂在新档 state 上）。
- 死系统判定：对 NDX.<Sys> 全仓外部引用计数（排除自身定义文件）=0 即判孤儿。

## 1. 探针① 地图结构（一致性 + 节点分布）
运行时实拍（_audit_meta.js A 节）：
- TOTAL_ACTS=17、TOTAL_TRIALS=81、ACT_RANGES.length=17、ACT_NAMES.length=17 —— 与代码常量一致。
- 17 地区地图节点总数 = 1232（含 startPoint=151）。
- 节点类型分布：
  - trial 364（29.5%）、compound 330（26.8%）、boss 138（11.2%）、rest 134（10.9%）、event 107（8.7%）、mob 105（8.5%）、elite 51（4.1%）、shop 3（0.2%）。
- 结论：地图结构在"代码常量层"自洽，但与文档常称的"九章"不符（见探针⑥）。shop 节点占比仅 0.2%（17 地区仅 3 个市），经济侧金流缺乏消耗出口（见探针③）。

## 2. 探针② 地区配额制是否真约束地图
- quotaEnabled(1)=false、quotaEnabled(2)=true、quotaEnabled(17)=true —— 第 1 章不约束，其余启用，符合设计。
- 实跑 addQuota 真实调用点：js/game/game_core_2.js:120-122（battle/elite/rest）、js/game/game_event_3.js:634-635（经 _qk 注入 ferry/yuan/yin/duo/rebel）、js/game/game_compound.js（复合节点）。quotaCheck 在 js/ui/ui_map.js:459 消费。→ 配额制非形同虚设。
- 两处死键 / 不可达：
  - 渡道 alt 路径 'chant' 永不可达：data_quota.js:35 定义 `渡:{main:{ferry:2}, alt:{chant:3}}`，但全仓 `addQuota(...chant)` 命中=0（Grep 无结果）→ 选"诵经 3 次"的替代达标线永远无法被累加，渡道 alt 分支实质死。
  - "战" dao 映射到死键 'war'：game_event_3.js:634 中 `战: 'war'`，而配额检测读取的键是 `battle`（data_quota.js:20 `战:{main:{battle:N}}`）。QUOTA_LABEL.war='战·抉择' 标签存在，但 quotaCheck 从不读 'war' 键 → 战道经抉择事件累计的配额是永不被校验的幽灵计数。

## 3. 探针③ 经济系统（货币种类 / 来源 / 消耗 / 失衡）
运行时探活（_audit_meta.js C 节）：NDX.gold / credits / hunyuan / sutraFragment / merit / jieyin / xianghuo / lingyu / token / mi / ash / jieyinSui 均非顶层 NDX 字段（undefined）—— 这些状态字段挂在存档而非 NDX，属正常；但据此确认：
- 灵玉（lingyu）是文档虚构货币：全仓 `灵玉|lingyu` 命中 4 次，全部是"凌云"（地名/装备名）假阳性（data_regions.js:30 act_17_lingyun、js/data/equipment.js 凌云套、js/data/events.js 凌云渡、js/ui/icon_map.js cmp_lingyu）。代码中不存在灵玉经济。
- 香火 = 15 次命中，仅为 js/data/data_materials.js 合成材料，非主货币。
- 无抽卡 / gacha 系统：gacha/抽经/抽卡 命中=0；经匣为碎片集齐自动合成。
- 真实跨周目货币：劫灰（ASH_SHOP 五线，data_reincarnation.js）：hp/dmg（横向解锁传承英雄，不增数值）、roll（+5%/级 劫运骰）、chg（+1 法宝初始充能）、seal（+1 永久劫印槽）。混元点（hunyuan）用于终局淬炼，hunyuanUnlocked 存在。
- 失衡点：shop 节点占比 0.2%（见探针①），金流缺乏消耗出口；纵向增益被刻意压平（见探针④），元进度对单局经济影响极弱，黄金在单局内易堆积。

## 4. 探针④ 跨周目 / 元进度循环
- VAULT（衣冠冢/舍利塔）：VAULT_MAX=3、VAULT_DECAY=[1,0.7,0.4]（_audit_meta.js D 节实跑确证真实衰减）—— 长期存档有衰减，避免无限堆叠。
- saveInherit（引渡匣继承）、recordMonument（碑塔）存在。
- 图鉴（CODEX）：CATEGORIES / load / save / record / isUnlocked / progress 等完整，属真实长线收集目标。
- 成就（globalAchBonus）：模拟 40 难簿成就 → atk=48、hp=240、matk=36、eff=40/cap=70，永久微量加成 + 软上限（ACH_SOFT_CUT=40）边际递减，真实有效长线目标。
- 每日（Daily）：外部引用 3（已接入 js/ui/ui_daily.js），真实有效。
- 轮回赐福纵向被砍（核心空虚风险）：favorBonus（data_reincarnation.js:312-322）中 bonusTi.atk/hp/dr/eva 恒 0（line 319）、bonusYuan.matk/mdef 恒 0（line 320），仅保留 startGold（每 5 点 +5 开局金，line 322）、pityGrace（保底掉装提前，line 315/321）。即"跨周目纵向养成"在赐福线上已被清空，仅余经济层保底。
- 与战斗橡皮筋（buildMatchFight 难度系数钳 [0.25,0.90]）呼应：元进度增益被设计成"不破坏单局平衡"，但代价是元进度对实战体感极弱 —— 存在"收集了没用"的感知风险（设计意图 vs 玩家感知的张力）。

## 5. 探针⑤ 成就 / 心魔 / 罪业 / 阵营接入性
- XINMO 外部引用 9、SIN_ROUTES 4、CAMP 5、ACHIEVEMENTS 3（含 checkAch / globalAchBonus / UI 展示）—— 均被多处真实消费，非死系统。
- 成就系统已完整接入（checkAch 评估 + globalAchBonus 注入永久微量加成）。
- 孤儿死系统（P0）：
  - NDX.Exploration 外部引用 = 0（_audit_meta.js E 节；仅定义于 js/data_exploration.js）—— 设计文档承诺的"探索未知"系统未落地，游戏主循环 / UI 零消费。
  - NDX.LoopEnhance 外部引用 = 0（_audit_meta.js E 节；仅定义于 js/data_loop_enhance.js）—— "多层循环强化"系统未落地，零消费。
  → 两者为确证孤儿死系统（定义完整但无任何接入），属最高优先级缺陷。

## 6. 探针⑥ 文档口径漂移
- 文档多处仍称"九章"，代码实为 17 地区制（TOTAL_ACTS=17）；81 难一致。
- 文档假设的"灵玉"货币在代码中不存在（探针③）。
- 设计文档承诺的"探索 / 循环强化"系统（探针⑤）未接入运行。

## 7. 不足汇总（P0 / P1 / P2）
### P0（阻断性 / 死系统）
- P0-1 NDX.Exploration 孤儿：定义完整但全仓零外部引用，系统未接入（js/data_exploration.js）。
- P0-2 NDX.LoopEnhance 孤儿：同上（js/data_loop_enhance.js）。
- P0-3 渡道 alt 路径 'chant' 不可达：data_quota.js:35 定义 alt:{chant:3}，但 addQuota(...chant) 全仓=0，替代达标线永不可达。

### P1（失衡 / 虚假 / 死计数）
- P1-1 "战" dao 映射死键 'war'：game_event_3.js:634，quotaCheck 读 'battle' 不读 'war'，战道抉择累计为幽灵计数。
- P1-2 文档虚构货币"灵玉"：代码中零真实出现（4 次命中皆"凌云"假阳性）。
- P1-3 跨周目纵向养成被清空：favorBonus 纵向增益恒 0（data_reincarnation.js:319-320），赐福线仅余保底，元进度对实战体感极弱。
- P1-4 商店节点占比 0.2%（17 地区仅 3 市）：金流缺乏消耗出口，单局黄金易堆积。

### P2（文档 / 口径）
- P2-1 文档"九章" vs 代码 17 地区制口径漂移。
- P2-2 设计文档承诺的"探索 / 循环强化"系统未落地（与 P0 同源，文档先行、实现缺位）。

## 8. 关键证据速查
| 项 | 证据 |
|----|------|
| 17 地区 / 81 难 | data_region_config.js：TOTAL_ACTS=17、TOTAL_TRIALS=81 |
| 运行时节点 1232（含 startPoint 151） | _audit_meta.js A 节 |
| 配额启用 | quotaEnabled(1)=false, (2)=true, (17)=true |
| 渡道 alt 死 | data_quota.js:35 alt:{chant:3}；addQuota(...chant) 全仓命中=0 |
| 战→war 死键 | game_event_3.js:634；data_quota.js:20 读 battle |
| 灵玉虚构 | Grep 灵玉\|lingyu = 4（全"凌云"假阳性） |
| 纵向恒 0 | data_reincarnation.js:319-320 |
| 孤儿系统 | _audit_meta.js E 节：Exploration / LoopEnhance 外部引用=0 |
| VAULT 衰减 | VAULT_MAX=3、VAULT_DECAY=[1,0.7,0.4] |
| 成就加成 | globalAchBonus(40) atk=48 hp=240 matk=36 eff=40/cap=70 |
| 节点分布 | trial 29.5% / compound 26.8% / boss 11.2% / shop 0.2% |

---
审计结论：地图结构常量自洽但文档口径漂移；配额制真实约束地图但含 2 处死键/不可达分支；经济系统"灵玉"为虚构货币、商店过稀；跨周目循环中 VAULT/图鉴/成就/每日真实有效，但 Exploration 与 LoopEnhance 为孤儿死系统、轮回赐福纵向被清空，元进度对实战体感偏弱。建议优先修复 P0-1/P0-2/P0-3（接入或移除孤儿系统、打通渡道 alt 路径），再处理 P1 死键与虚假货币描述，最后对齐文档口径。
