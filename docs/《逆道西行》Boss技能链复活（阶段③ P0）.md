# 《逆道西行》Boss 技能链复活（阶段③ · P0 · 设计文档 v1.0）

> 2026-09-26。上游：`《逆道西行》系统完善度审计（阶段② v1.0）.md` §六 P0。
> 性质：**复活接线，不是重写**——数据（boss_skills.js 565 行）、执行器（boss_skill_combat.js 396 行）、消费端（pDebuffs/cleanse）三件齐备，断链只发生在加载层 + 调用层两环。

## 一、断链诊断（阶段②结论 + 本轮深挖补充）

| 环节 | 现状 | 证据 |
|---|---|---|
| 数据表 | ✅ 齐 | `BOSS_SKILLS` 42 键（去重 38）、`ELITE_SKILLS`、`REGION_AFFIXES`（act 1-9 与现行 9 章对齐） |
| 执行器 | ✅ 齐 | `checkBossSkillTrigger` / `applyBossSkillEffect` / `applyRegionAffixToMob` / `applyRegionAffixOnAttack` / `checkPlayerControl` 五出口 |
| 消费端 | ✅ 预留 | `game_combat_1.js:482`「pDebuffs（V8.50 Boss 招牌，临阵可解）」+ `game_combat_2.js:817-820` cleanse 已消费 |
| **加载** | 🔴 断 | index.html 无 `boss_skill` script 标签（运行期探针：全 undefined） |
| **调用** | 🔴 断 | 加载链内零调用点 |

**键名匹配度**：38 去重键中 **37 命中现行敌人表**（core 名匹配），仅 `九灵元圣` 未命中——敌人表缺 @75 Boss 本体（数据缺口，单独立项，不阻塞复活）。

**重复键真相**：`牛魔王`/`大鹏金翅雕`/`五行归墟·大圣残躯`/`通天河老鼋·湿经` 各出现 2 次——142/162/216/247 行是 `aliasOf` 别名条目，412/422/442/453 行是真身定义。JS 对象字面量**真身覆盖别名**，运行期无害，但属数据卫生问题。

**重要澄清**：`boss_skill_combat.js:104-109` 的 `m.behavior` 与现行 `game_combat_1.js:98-109` 是同一段默认行为代码的两份拷贝——现行内核**已有**怪物行为系统（pool/pattern/guardPct/stagePatterns，guard/heavy/multi/buff 动作）。Boss 复活补的是**专属技能层**（按表触发、效果结算、debuff 消费），不是从零建 AI。

## 二、复活范围

| 项 | 决定 |
|---|---|
| `js/boss_skills.js`（数据） | ✅ 本批接线 |
| `js/boss_skill_combat.js`（执行器） | ✅ 本批接线 |
| `js/boss_skill_icons.js`（图标 UI） | ⏳ 第二批（纯 UI 增强，不阻塞战斗） |
| `js/boss_skill_audio.js`（技能语音 644 行） | ⏳ 第二批（依赖音频配置，微信首包压力，不阻塞） |

**加载位置**：enemies 数据之后、`game_combat_1.js` 之前（执行器须在战斗内核前注册 NDX 出口）。

## 三、三个调用点 + 适配层（唯一新写代码）

### A 点 · 怪物生成后：地区词缀
```
NDX.applyRegionAffixToMob(monster, act)
```
- 位置：现行怪物实例化处（战斗开局）。
- 零回归：`getRegionAffix(act)` 查无返回 null ⇒ 普通怪不变；命中时按词缀加 miss/dr/dot/summon 属性。
- ⚠ 词缀**强**（miss 30% / dr 20% / 召唤），与 Boss 技能叠加后第一章难度跳升——但词缀 boss 键表明设计意图就是「该章 Boss 在场时全区域受染」。落地后实机验证难度曲线，超调再调（数值复核留平衡批次）。

### B 点 · 敌方回合行动选择前：Boss 专属技
```
const bs = NDX.checkBossSkillTrigger(monster, round, mHp, mMaxHp);
if (bs) {
  const eff = NDX.applyBossSkillEffect(bs, monster, p.pDebuffs, pDots, ctx);
  // eff.action {type:'guard'|'atk'|'heavy'|'multi'|...} → 映射进现行 mTurn 结算（现行 behavior 分支已认识这些 type）
  // eff.newDebuffs → 合入 p.pDebuffs（现行字段）
  // eff.newDots  → 合入现行 d.resolve.dots 机制
  // eff.log → 交 UI 层 narr（⚠ 内核无日志函数，日志单源在 game_combat_1.js）
}
```
- 位置：`game_combat_1.js:634` 敌方出手（ENEMY_PHASE）行为决策处。
- 零回归：`checkBossSkillTrigger` 对非 Boss（`getBossSkills` 查无）恒返回 null ⇒ 新分支不可达 ⇒ 普通怪战斗逐位不变。
- Boss 战变化 = 功能新增（现状纯平A+behavior 池），属设计意图，非平衡回归。

### C 点 · 玩家出手命中判定：debuff 消费
```
NDX.checkPlayerControl(p.pDebuffs)
```
- 位置：玩家出手判定处（blind/stun/disarm → miss/跳过/禁物理）。
- 伴随：pDebuffs 回合递减（每敌方回合结束 -1）。
- 零回归：`p.pDebuffs` 为空对象时 checkPlayerControl 返回放行。

### 适配层规模估计
game_combat_1.js 内新增 ~50 行（B 点映射 + C 点 + 递减），1 处怪物生成插 A 点。执行器/数据**零修改**（唯一例外见 §四）。

## 四、数据卫生（同批顺手做，不改数值）

1. **别名条目去重**：删除 142/162/216/247 四条 `aliasOf` 别名（真身已覆盖它们，留着只会误导后续审计）。`getBossSkills` 的 aliasOf 解析逻辑保留（向后兼容）。
2. **`九灵元圣` 键保留**：敌人表补 Boss 本体是另一立项（3 Boss 形态补完优先级 @75），技能表先留着。

## 五、数值表（沿用旧 v1.1 调优，本批**不重平衡**）

| 参数 | 值 | 出处 |
|---|---|---|
| 技能触发概率 | 血量>50%: 20% / ≤50%: 30% / ≤30%: 40% | boss_skill_combat.js:33-35（v1.1 调优注释） |
| 技能冷却 | 2 回合（`BOSS_SKILL_COOLDOWN`） | boss_skill_combat.js:13 |
| 阶段技能门槛 | stage2=血量≤50%，stage3=血量≤30% | boss_skill_combat.js:28-29 |
| 地区词缀 | 吹沙 miss30% / 骨爪吸血10% / 火星DOT5%×2 / 兵刃格挡dr20% / 分身30%血 / 风刃miss20% / 群攻2段 / 小幻术miss25% / 小玄霜3%×2 | boss_skills.js:468-480 |

复核留待阶段③平衡批次（实测难度曲线后再调）。

## 六、门禁（新建 `scripts/_verify_boss_skills.js`）

1. 加载链：index.html 含 `boss_skills.js` + `boss_skill_combat.js` 两个 script 标签。
2. 运行期真调（vm 加载）：`NDX.getBossSkills('黄风大圣')` 命中 4 技能；`checkBossSkillTrigger(黄风怪实例)` 可返回技能（构造满足触发条件）。
3. 键名全量匹配：BOSS_SKILLS 键（core 名）≥37 命中敌人表，`九灵元圣` 白名单豁免。
4. 零回归断言：`getBossSkills('野祠饿鬼') === null`；执行器对 null 输入恒返回 null。
5. 别名去重断言：重复键 0。
6. C 点消费：`checkPlayerControl({})` 放行。

## 七、验收

1. 门禁全绿 + 全量 `_run_all_gates.js` 不新增红。
2. `?v=` 递增（`js/game/game_combat_1.js` + index.html；新文件无 v）。
3. **实机探针复测**（阶段②同款）：`BOSS_SKILLS` 运行期 defined + script 标签=2。
4. 实机打一场黄风大圣（或第一章任一 Boss）：战斗日志出现【技能名】行、pDebuffs 生效（blind miss）。

## 八、落地记录（2026-09-26 晚）

**🔴 落地中发现第五块断链**：`NDX.PDB_DOT / PDB_MISS / PDB_ATKMUL` 参数表全仓从未定义——内核 V8.50 消费层（combat_part1.js:982-1010）读的是空表。已补三表（boss_skills.js 末尾，**新增数值 v1 估值**）：

| 表 | 键 | 值 | 语义 |
|---|---|---|---|
| PDB_DOT | fire/poison/thunder_fire/xuan_shuang/curse | pctMaxHp 0.03-0.05 · atkMul 0.4-0.7 · flat 15-25 | dmg = max(flat, maxHp×pct + m.atk×atkMul)，每回合 tick |
| PDB_MISS | blind / stun | 0.50 / 1.0 | 玩家攻击落空概率；**stun→1.0 ≈ 跳过玩家攻击回合的近似实现**（内核无真·跳回合消费点） |
| PDB_ATKMUL | weak / atkDown | 0.70 / 0.75 | 玩家攻击衰减（同时生效取最小） |

blind 的技能效果 miss 0.20~0.60 收敛为单档 0.50——v1 简化，平衡批次可分级。

**改动清单**：boss_skills.js（删 4 条 aliasOf 别名 + 追加 PDB 三表）、combat_part1.js（B 点技能触发/结算 ~20 行 + 词缀攻击挂钩 ~10 行）、game_combat_1.js（A 点词缀注入 + narr 消费 bossSkillLog）、index.html（+2 script 标签，combat_part1 v524 / game_combat_1 v511）、新建 `scripts/_verify_boss_skills.js`。

**验证**：门禁 29/0；全量 71 脚本 67 通过（唯一红=存量 atlas.webp）；实机探针 bossSkillScriptTags=2、BOSS_SKILLS/ELITE_SKILLS/REGION_AFFIXES=object、checkBossSkillTrigger=function、页面零报错。

**已知 v1 简化（第二批补）**：①stun/charm/disarm 无真·跳回合/攻击自己/禁物理消费点（stun 已用 MISS 1.0 近似，charm/disarm 仅记日志不生效）②extraEffect 的 summon/aoe/cleansePlayerBuffs 未实装（内核无载体，同随从 debuff 的 needsKernel 模式）③icons/audio UI 增强第二批。

## 九、V9.62 补丁：Boss 显示名→技能键 别名层（2026-09-26）

**背景**：上一阶段门禁只断言 `getBossSkills('黄风大圣')`，未覆盖“九章末全部命中”。实际运行时 `monster.name = NDX.CHAPTER_BOSS_NAMES[act-1]`（游戏装配链见 `js/game/game_core_2.js:588-589`），boss_skill_combat.js:18 直接以 `monster.name` 精确查 `BOSS_SKILLS`。而 5/9 章末显示名与技能表内部键不一致（与 BOSS_FORMS 层同一型问题），导致这 5 个 Boss 在战斗中**静默丧失专属技能**。

**失配矩阵**（修复前）：

| 章 | CHAPTER_BOSS_NAMES 显示名 | BOSS_SKILLS 实际键 | 命中 |
|---|---|---|---|
| ch1 | 黄风大圣 | 黄风大圣 | ✓ |
| ch2 | 白骨夫人·五行归墟 | 五行归墟 | ✗ |
| ch3 | 红孩儿·三昧真火 | 红孩儿·三昧真火 | ✓ |
| ch4 | 青牛精·金刚琢 | 青牛精·独角兕 | ✗ |
| ch5 | 六耳猕猴 | 六耳猕猴 | ✓ |
| ch6 | 牛魔王 | 火焰山·牛魔王 | ✗ |
| ch7 | 狮驼岭·三魔拦路 | 狮驼岭·三魔拦路 | ✓ |
| ch8 | 九灵元圣·断岳法相 | 九灵元圣 | ✗ |
| ch9 | 传经吏·索经 | — | ✗（新内容） |

**合同设计**：唯一 owner = `js/boss_skills.js`。镜像 `enemies_part1.js:BOSS_FORM_ALIAS` 同型模式，新增 `NDX.BOSS_SKILL_ALIAS` 作为技能层显示名→内部键的单一真源；`getBossSkills` 先解析别名再查原键，保留已有 `entry.aliasOf` 分支（向后兼容）。

**修复范围**：ch2/4/6/8 四章末复用既有已平衡已接线的技能数据（零新内容、零数值风险）。ch9 '传经吏·索经' 无既有 BOSS_SKILLS 键，属终局 Boss 新内容设计，不混入本轮 bug 修复。

**门禁扩展**（`scripts/_verify_boss_skills.js`）：新增“九章末 Boss 技能命中”断言段，从 enemies_part1.js 正则抽取 CHAPTER_BOSS_NAMES，逐项断 `getBossSkills(显示名)` 命中且非空；ch9 作为非阻断 TODO 警告（一旦补上技能内容，⚠ 自动升为 ✓）。确保后续新增章末 Boss 一旦失配会被门禁红拦。

**改动清单**：
- `js/boss_skills.js`：新增 `NDX.BOSS_SKILL_ALIAS`（4 项映射）+ `getBossSkills` 前置一行别名解析；保留 `entry.aliasOf` 分支。
- `scripts/_verify_boss_skills.js`：新增 9 章末断言段（+9 项）。
- `index.html`：`boss_skills.js?v=2` → `?v=3`。

**验收**：`node scripts/_verify_boss_skills.js` — 38 通过 / 0 失败（ch1..ch8 全 ✓，ch9 ⚠ 非阻断）；`node --check js/boss_skills.js` / `node --check scripts/_verify_boss_skills.js` 无输出即语法通过。

**遗留项（新内容）**：ch9 终局 Boss '传经吏·索经'（难 81 · 灵山 · 索人事→无字真经）需单独设计专属技能组，补到 `NDX.BOSS_SKILLS` 顶层。门禁已预留自动升级机制：一旦新增该键，无需修改门禁，警告自动转成 ✓。本轮修复不混设新内容。
