# 《逆道西行》skill_variant 概率层 rng 注入通道（V9.64 · 已闭合）

> 状态：**V9.64 已修复并全绿**。本文档前身是 V9.63 会话末尾建立的 P1 backlog（曾错误归因为"s mutate"），本轮通过只读复核推翻旧假设、锁定真实根因、按 Bounded TDD 闭环。为保持文档索引一致，仍沿用原文件路径；内容整体重写为"已闭合"记录。
>
> 关联门禁：`scripts/_verify_skill_variant.js` G3 段。
> 关联 owner：`js/data_sutra.js` `NDX.applyJingSlotMods` + `js/data_skill_index.js` `SKILL_LAYERS.jing.run` / `resolveSkillAct`。

## 一、症状（V9.55 既存红）

`node scripts/_verify_skill_variant.js` 末段：

```
FAIL G3 重复调用不得重复拼接 note：「挥兵狠击·连环」 vs 「挥兵狠击·连环·经连击」
FAIL G3 重复调用不得二次缩放 dmg：100 vs 130
```

`scripts/_run_all_gates.js` 基线：74 脚本 / 73 通过 / **worst=1**（唯一红=本条）。

## 二、根因（V9.64 复核最终版）

**修正说明**：V9.63 会话 Spike 探针曾把根因猜为「`applyJingSlotMods` mutate 了共享 `s`，破坏跨实例幂等」，属**错误推测**（探针未直接验证 s 是否被写入，仅从"跨实例结果差"倒推）。V9.64 只读复核 `js/data_sutra.js:1238-1281` `applyJingSlotMods` 全文，函数**只读 `jingSlotMods(s)`**、写 `act.*`，**无一处 `s.xxx = ...` 或其他 s 突变**。

真实根因：**`applyJingSlotMods` 内部的 `_roll` 直吃全局 `Math.random()`，不接受注入**（`js/data_sutra.js:1242`）：

```js
const _roll = function (p) { return typeof Math.random === 'function' && Math.random() < p; };
if (slotKey === 'atk') {
  if (m.combo && _roll(m.combo)) { /* 概率触发连击 */ }
  if (m.crit  && _roll(m.crit))  { /* 概率触发暴击 */ }
  ...
}
```

而项目内**其他**概率函数均已建立"注入 rng"惯例：

| 位置 | 签名 | 惯例 |
|---|---|---|
| `js/data_sutra.js:651` `grantNiSutraFrag` | `(s, rng)` → `(rng ? rng() : Math.random())` | ✅ 已注入 |
| `js/data_skill_variant.js:103` `applyTreasureStatus` | `(act, s, rng)` → `const r = rng \|\| Math.random` | ✅ 已注入（门禁段 3 用 `() => 0`） |
| `js/data_sutra.js:1238` `applyJingSlotMods` | `(act, s, slotKey)` 硬吃 Math.random | ❌ **缺注入通道** |

**这是同项目 API 一致性缺陷**。因缺 stub 通道，门禁 G3 无法把 jing 层概率分支变成确定态，导致 `a1` 与 `a2` 两次调用因 `Math.random()` 掷骰结果不同 → 表现像"跨实例不幂等"，实质是"概率函数不可测"。

`SKILL_LAYERS.jing.run`（`js/data_skill_index.js:366-372`）与 `resolveSkillAct` c1（385-408）也缺少 rng 透传通道。

## 三、修复方案（V9.64 · Bounded）

三处协同改动，一次闭环：

### 3.1 `js/data_sutra.js` `applyJingSlotMods` 加可选第 4 参数 `rng`

```diff
- NDX.applyJingSlotMods = function (act, s, slotKey) {
+ NDX.applyJingSlotMods = function (act, s, slotKey, rng) {
    if (!act || !s) return act;
    const m = NDX.jingSlotMods(s)[slotKey];
    if (!m) return act;
-   const _roll = function (p) { return typeof Math.random === 'function' && Math.random() < p; };
+   const _roll = function (p) {
+     const _r = (typeof rng === 'function') ? rng : (typeof Math.random === 'function' ? Math.random : null);
+     return _r ? (_r() < p) : false;
+   };
```

**默认不传 → 走 Math.random → 生产行为零变化**。

### 3.2 `js/data_skill_index.js` 薄接线透传 `rng`

- `resolveSkillAct` c1 里加 `rng: (typeof c.rng === 'function' ? c.rng : null)`；
- `SKILL_LAYERS.jing.run` 里 `applyJingSlotMods(act, c.s, c.kind, c.rng)`。

其他层（hero/dao/job/ult/variant/sutra/treasure）本次**未透传**，因为它们内部概率分支不在 G3 影响链路；`applyTreasureStatus` 已收第三参 `rng`，若将来 treasure 层门禁也要严格幂等，可另立小议题加一层透传。

### 3.3 `scripts/_verify_skill_variant.js` G3 传 stub

```js
const rngStub = () => 0;    // 必触发概率分支，让 a1/a2 落在同一确定态
NDX.resolveSkillAct(a1, 'atk', { s: s, rng: rngStub });
NDX.resolveSkillAct(a2, 'atk', { s: s, rng: rngStub });
NDX.resolveSkillAct(a2, 'atk', { s: s, rng: rngStub });   // 二次调用被 _skillDone 跳过
```

选 `() => 0` 而非 `() => 1` 的理由：让所有 `_roll(p)` 恒为 `0 < p` → true，覆盖 combo / crit / `_tier≥2` 追暴分支，测到最大概率路径表面积；`a1`、`a2` 一次调用、`a2` 二次跳过三者都在**同一确定态**，等价即成立。

## 四、验收（V9.64）

| 命令 | 结果 |
|---|---|
| `node --check js/data_sutra.js` | ✅ 语法通过 |
| `node --check js/data_skill_index.js` | ✅ 语法通过 |
| `node scripts/_verify_skill_variant.js` | ✅ 门禁通过（原红 G3 转绿） |
| `node scripts/_run_all_gates.js` | ✅ **74 / 74 全绿 / worst=0**（历史首次全绿） |
| `index.html` `data_skill_index.js?v=7450 → ?v=7451` | ✅ 已 bump |
| `index.html` `data_sutra.js?v=7451 → ?v=7452` | ✅ 已 bump |

生产路径未传 `rng` → 走 Math.random → 战斗行为零变化；本次唯一改动是**新增可选注入通道**，向后兼容。

## 五、影响面复盘

- **玩家可见性**：本次不改概率数值、不改触发规则、不改结算公式，仅补注入通道，玩家侧战斗手感等价。
- **回归面**：SKILL_ORDER 其他 7 层未动；resolveSkillAct 主体逻辑（`_skillDone` 逐层幂等登记 V9.54 防线）未动；combat_active.js 三键调用点（51 / 190 / 272）未动。
- **门禁语义**：G3 名义是"同一 act 二次 = 一次"（幂等），V9.54 由 `_skillDone` 保障；本轮补上"概率可确定"这一半，让名义与实际严格对齐。

## 六、经验教训（写入 AGENTS.md §十 精神）

1. **"倒推根因"必须配"直读代码"**：V9.63 探针只 dump 行为差异，未 grep 是否真存在 s 写入；假设"s mutate"直接进入 backlog 文档。V9.64 复核时**先读 `applyJingSlotMods` 全文**再下结论，才发现完全无 s 突变。教训：Spike 探针输出的**假设**在写入 backlog 前应至少 grep 一次直接证据。
2. **同项目概率函数应有一致的注入惯例**：`grantNiSutraFrag` / `applyTreasureStatus` 已有 rng 参数；`applyJingSlotMods` 单独吃 Math.random，属"平行 API 不一致"。未来新增战斗概率函数应默认 `(act, s, ..., rng)` 尾参。可考虑后续加一条 `_verify_*.js` 源码扫描门禁：`Math.random()` 只允许出现在 `rng ||` 兜底表达式内。
3. **文档诚实性**：本文件保留 V9.63 错误推测的记录，作为"曾走过错路"的明示；不给旧结论留"换个名字继续存在"的空间（AGENTS.md §五）。

## 七、复用资产

- 探针（throwaway，`.tmp/` 已被 `.gitignore` 覆盖）：`.tmp/_probe_skill_variant_idem.js`
  - 保留价值：monkey-patch `SKILL_LAYERS[nm].run` 前后 dump 差分，可复用于任何 SKILL_ORDER 层的"某层是否改变 act" 调查。
- 门禁：`scripts/_verify_skill_variant.js` G3 段（V9.64 stub rng 注入版）。

## 八、维护记录

| 版本 | 日期 | 变更 |
|---|---|---|
| V9.63 backlog | 2026-09-26 | Spike 探针复现并（错误）归因为"s mutate"；本文建立为 P1 backlog |
| **V9.64 闭合** | **2026-09-26** | **只读复核推翻 s mutate 假设；根因改锁 `_roll` 缺 rng 注入通道；Bounded TDD 三处协同改动闭环；全量 gate worst=0；文档整体重写为"已闭合"** |
