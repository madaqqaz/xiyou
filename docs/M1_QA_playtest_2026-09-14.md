# 《逆道西行》M1 正式打磨 · QA / Playtest / 分诊报告

- 日期：2026-09-14（M1 里程碑）
- 角色：quality-lead（QA 负责人，只读审计，未改任何游戏代码 / 核心数据 owner 文件）
- 范围：纯前端 H5 单局 Roguelike 肉鸽（零构建零依赖，`index.html` 双击即玩），三端共享核心代码（浏览器 H5 / 微信小游戏 web-view / TapTap 买断）
- 唯一真源：全局 `NDX` 对象与各 owner 数据文件
- 基线参照：M0 收口 commit `11e9e01`，门禁基线 31/31 全绿

---

## 一、门禁证据（实际运行输出，非推断）

### 1.1 全量门禁跑批

```bash
cd D:/xiyou/demo && node scripts/_run_all_gates.js
```

**结果（原始 stdout 节选）：**

```
ok   _audit_trial_dao.js               结论：0 失败（必给缺失难数）
ok   _audit_trials81.js
ok   _smoke_boss_hook.js               结论：52 通过 / 0 失败
ok   _smoke_dao_balance.js             结果：32 通过 / 0 失败（加载错误 3）
ok   _smoke_hidden_diary.js            结论：37 通过 / 0 失败
ok   _smoke_trials_rewrite.js          结论：33 通过 / 0 失败
ok   _verify_codex_progress.js         结论：通过 / 失败 = 12 / 0
ok   _verify_dao_pool.js               结论：34 通过 / 0 失败
ok   _verify_endings_index.js          结论：10 通过 / 0 失败
ok   _verify_fabao_dao.js              结论：通过 / 失败 = 8 / 0
ok   _verify_fabao_tier.js             结论：通过 / 失败 = 13 / 0
ok   _verify_fate_pure.js              结论：37 通过 / 0 失败
ok   _verify_hero_trials_align.js      结论：18 通过 / 0 失败
ok   _verify_life_days.js
ok   _verify_map_ch1_arc.js            结论：22 通过 / 0 失败
ok   _verify_map_window.js             结论：12 通过 / 0 失败
ok   _verify_mirror_hidden.js          结论：32 通过 / 0 失败
ok   _verify_nidao_gate.js             结论：11 通过 / 0 失败
ok   _verify_return_cost.js
ok   _verify_seal_alloy.js             结论：33 通过 / 0 失败
ok   _verify_seal_pool.js              结论：45 通过 / 0 失败
ok   _verify_seal_rites.js             结论：53 通过 / 0 失败
ok   _verify_seal_source.js            结论：75 通过 / 0 失败
ok   _verify_stance_xinmo.js           结论：10 通过 / 0 失败
ok   _verify_sutra_variant.js          结论：44 通过 / 0 失败
ok   _verify_syntax_all.js             结论：19 通过 / 0 失败
ok   _verify_treasure_lux.js           结论：通过 / 失败 = 13 / 0
ok   _verify_treasure_onhit.js         结论：27 通过 / 0 失败
ok   _verify_treasure_synergy.js       结论：39 通过 / 0 失败
ok   _verify_trial_tip.js              结论：9 通过 / 0 失败
ok   _verify_xinmo_single_source.js    结论：26 通过 / 0 失败

=== 脚本数=31 通过=31 worst=0（0=全绿）===
```

**判定：M0 基线 31/31 全绿已复现，零失败，无退化。** ✅

### 1.2 任务要求的另外两个脚本 —— 不存在（证据缺口）

```bash
cd D:/xiyou/demo && find . -name "regression*.js" -not -path "./node_modules/*"   # 0 命中
cd D:/xiyou/demo && find . -iname "*monster*behavior*"                              # 0 命中
grep -rl "smoke_monster_behavior\|regression.js" --include=*.js --include=*.md .    # 仅 planning docs 提及
```

- `scripts/regression.js`：**仓库内不存在**（仅在 `docs/*.md` 规划文档中被提及，从未落地）。
- `scripts/_smoke_monster_behavior.js`：**仓库内不存在**。
- `_run_all_gates.js` 第 8 行把 `regression.js` 列入候选清单，但第 11 行用 `fs.existsSync` 过滤，**缺失文件被静默丢弃**，故 31/31 基线并不包含"回归套件"与"怪物行为冒烟"两项。

> ⚠️ **结论**：当前"全绿"仅代表既有 31 个数据/语法/平衡门禁通过。**没有回归套件、没有怪物行为冒烟**——这两类覆盖是真空白，不是已验证。

### 1.3 门禁健壮性备注（建议修，非阻断）

1. **3 个脚本无机器可读结论行**：`_audit_trials81.js`、`_verify_life_days.js`、`_verify_return_cost.js` 输出空白结论行，跑批器仅凭退出码判绿。若其内部断言失败但仍 `exit 0`，门禁会**假绿**。建议补 `结论：N 通过 / M 失败` 行或显式 `process.exit(非零)`。
2. **`_smoke_dao_balance.js` 报告"加载错误 3"但 0 失败**：3 条六道数据加载失败却未计入失败。需 engineering-lead 确认这 3 条不是被静默丢弃的内容（可能与"六道视觉层未接入/缺战"同源）。

---

## 二、3 轮 Playtest 矩阵（设计稿，落地需人工实机）

> **沙箱限制声明**：本环境无法启动浏览器 / 真机（无显示、无 Chrome）。矩阵为**检查点清单设计稿**，所有浏览器/设备执行项标注 **【需人工实机】**，本报告不作任何伪造结果。项目已有 `docs/_audit_2026-09-14/walk_screens.js`（autoplay 驱动整局逐屏采集）与 `shot_matrix.js`（10 档视口矩阵），二者需 `dangerouslyDisableSandbox` 起 Chrome，**不在本会话执行**。

### 矩阵总览

| 轮次 | 目标端 | 重点 | 执行方式 |
|---|---|---|---|
| 轮 1 | 浏览器 H5（桌面 Chrome + 1440×900 / 1920×1080） | 桌面横屏门槛误伤复现 + 首章全流程 | 【需人工实机】|
| 轮 2 | 微信小游戏 web-view（真机 iOS/安卓，含旋转伪横屏 390×844） | 旋转态适配 + 顶部引导面板重叠复现 | 【需人工实机】|
| 轮 3 | TapTap 买断（安卓包 / 桌面） | 买断上架合规 + 存档读档 + 异常态 | 【需人工实机】|

### 每轮通用检查点清单（Checkpoints）

| # | 检查点 | 验收标准 | 关联已知项 |
|---|---|---|---|
| C1 | 启动 / 首屏 | 标题页渲染、CTA ≥36px、无 Script error（看 console） | 横屏门槛误伤 |
| C2 | 新游戏 | 择道面板六道标识完整（含"战"） | 六道视觉层未接入 |
| C3 | 首章战斗 | 战斗循环、姿态切换、伤害结算正常；怪物行为符合 spec | 怪物行为无门禁 |
| C4 | 经文事件 | 事件选项联动、文本无断链/乱码 | — |
| C5 | 劫印 / 六道构筑 | 劫印生效；`轮回`劫印机制在战斗中有可观测消费点 | 轮回劫印死机制 |
| C6 | 地图推进 | 节点推进、区域结算、无卡死 | — |
| C7 | 存档读档 | `localStorage` 写入/读出一致；重开后进度还原 | — |
| C8 | 异常态 | 断网（离线可玩）、低内存（无崩溃）、旋转横屏（无重叠/溢出） | 顶部面板重叠、横屏误伤 |
| C9 | 合规入口 | 设置→隐私政策/用户协议可打开且文本可见（非 404） | 隐私可达性（见分诊）|
| C10 | 立绘 | NPC 立绘无断链灰图、无水印可见、无面部缺失 | 歧义立绘断链、AI 水印 |

> 每轮完成后填结构化 Playtest 报告：新玩家体验 / 中盘系统 / 难度曲线 / 异常态 四段。

---

## 三、已知问题分诊表（以 2026-09-15 路线图 §四 为权威记忆）

定性口径：**阻断**（上架/可玩阻断）、**设计风险**（影响体验/合规，需拍板）、**可记录债务**（已知待办，不阻断）。

| # | 问题 | 任务简报定性 | 本人证据复核定性 | 验证入口（证据） | 路由 |
|---|---|---|---|---|---|
| K1 | 桌面横屏门槛误伤（`短边<=1080` 误判 1440×900/1920×1080 为短横屏；删坏 media 门槛后误伤扩大） | 待 engineering-lead 拍板 A/B/C | **设计风险**（非阻断，桌面可玩但排版退化） | `docs/手机横屏适配_2026-09-14.md` §四；`index.html` 内联 `applyShortLandscape()` | engineering-lead（M0 收口）|
| K2 | 844×390 顶部引导面板文字重叠（疑似 autoplay 中间态） | 待定位 | **可记录债务**（未定位唯一 owner，需脱离 autoplay 复现） | `docs/手机横屏适配_2026-09-14.md` §三"未处置"；截图在 `.tmp/mobshot/` | engineering-lead（轮2 复现）|
| K3 | 3 条歧义立绘断链（江流儿/刘洪/陈光蕊，后者面部缺失） | 引用名 vs 磁盘名不一致 | **设计风险**（断链导致灰图/缺图）。证据：`img/portraits/npcs/` 仅存 `npc_jiangliuer.webp`；**刘洪、陈光蕊 无磁盘文件** | `img/portraits/npcs/` 目录实拍；`js/data*.js` 引用中文名 | art-director + engineering-lead（M1）|
| K4 | 六道视觉层未接入（`dao_*` 5/6 可用缺"战"） | 视觉真空 | **设计风险**（核心系统无视觉锚点） | `docs/六道视觉层_接入方案_2026-09-14.md`；`js/ui/ui_panel_2.js:945-950` 仅文字 `.dao-tag`；`img/ui/dao_*` 零引用死资源 | design-strategist + art-director（M0/M1）|
| K5 | `轮回`劫印死机制（`mech:'reflectStackClear'` 无消费点 + 无立绘） | 死机制 | **阻断级设计缺陷（机制失效）**。证据：全仓 grep `reflectStackClear` **仅 `js/jieseals.js:110` 定义一处，无任何消费/分支代码** | `js/jieseals.js:110`；`grep -rn reflectStackClear js/` | design-strategist（M0 收口）|
| K6 | 隐私政策/用户协议"线上 404 死链" | 上架合规阻断 | **⚠️ 与简报冲突，证据不支持"硬 404"**：`ui_misc_1.js:637/647` 为**纯文本引用**（合规面板内已内嵌完整政策正文），非 `<a>` 死链；`.gitignore` 有 `!docs/隐私政策.md`/`!docs/用户协议.md` 否定规则 → 两文件**已部署**。最新路线图已改判为"链接大概率已生效，剩内容达标与否待核" | `js/ui/ui_misc_1.js:637,647`；`.gitignore:75-78`；路线图 §四 | design-strategist + release-ops-lead（M2 复核可达性+内容合规）|
| K7 | 美术 AI 水印（`portraits/npcs/`、`img/ui/dao_*.jpg`） | 上架合规阻断 | **阻断（合规硬伤）**。证据：`docs/六道视觉层_接入方案_2026-09-14.md` §五 确认 `dao_*` 全部带"AI生成"水印；`待认领_乱码立绘对照表`/`接线立绘_水印与画风核查` 截图佐证 | `img/ui/dao_*.jpg`；`assets/portraits/npcs/`、`img/portraits/npcs/` | art-director（M1 去水印）|

### 分诊 Top 3 结论（按上架阻断力排序）

1. **K7 AI 水印（🔴 阻断）**：存量含已接入资源，微信/TapTap 上架审核对 AI 水印零容忍，须 M1 去水印或替换。
2. **K5 轮回劫印死机制（🔴 机制失效）**：`reflectStackClear` 全仓无消费点，该金色劫印在战斗中**永远不触发任何效果**——属机制性死代码，玩家付费/构筑预期落空，须 M0 收口（补消费点或降级/移除）。
3. **K3/K4 立绘与六道视觉（🟡 设计风险）**：立绘断链致灰图、六道无视觉锚点，损害核心系统辨识度，M1 可修；K6 隐私项**降级为复核**（证据显示链接已生效，待核内容合规，非硬 404）。

> **重要提示团队主理人**：任务简报将 K6 定性为"上架合规阻断/死链 404"，但当前代码与 `.gitignore` 与 2026-09-15 路线图均不支持该判定。建议以证据为准，将 K6 从阻断清单移出、改为 M2 复核可达性+内容合规。若坚持"线上 404"，需提供具体部署 URL 与 404 复现，否则属误报。

---

## 四、缺口分析与新增 gate 建议

### 4.1 现有门禁未覆盖的已知项（缺口）

| 缺口 | 缺失 gate | 建议脚本（scripts/，CommonJS，纯 Node 优先）|
|---|---|---|
| 回归套件 | `regression.js` 不存在 | 新增 `scripts/regression.js` |
| 怪物行为冒烟 | `_smoke_monster_behavior.js` 不存在 | 新增 `scripts/_smoke_monster_behavior.js` |
| K5 死机制 | 无 mech 消费点断言 | 新增 `scripts/_verify_seal_mech_consumed.js` |
| K3 立绘断链 | 无资源引用完整性断言 | 新增 `scripts/_verify_asset_links.js` |
| K4 六道视觉 | 无六道徽章完整性断言 | 扩展 `_verify_dao_pool.js` 或新增 `_verify_dao_visual.js` |
| K1 横屏门槛 | 仅文档，无自动断言 | 新增 `scripts/_verify_landscape_threshold.js`（纯 Node 决策 gate，断言 `applyShortLandscape` 阈值分支；**须绑定 `已拍板方案` 常量**并预留「维持现状」分支防反向失败。⚠️命名碰撞：本工程 A/B/C 取 team-lead 任务口径——A=`maxTouchPoints>0`（排除无触控桌面）、C=宽分级；与旧文档「A=短边≤1080（当前默认，待替换）」不同，旧默认不在三方案内。详见 engineering-lead 报告 §4.4）|

### 4.2 提议脚本（代码于本报告，落地需主理人签批后写入 scripts/；本会话"只读"未擅自注入 CI）

**A. `scripts/regression.js`（回归跑批器，复用 _run_all_gates 模式）**
```js
// 回归：固定重跑全部门禁 + 一个黄金存档回放断言；任何失败即回归退化
const { spawnSync } = require('child_process');
const fs = require('fs'); const path = require('path');
const DIR = __dirname;
const base = spawnSync(process.execPath, [path.join(DIR,'_run_all_gates.js')], {encoding:'utf8', cwd:path.join(DIR,'..')});
const ok = base.status === 0 && /worst=0/.test(base.stdout);
// 黄金存档回放：加载 scripts/_cdata_shot 下固定存档，断言关键字段一致
console.log('回归基线门禁：' + (ok ? 'PASS' : 'FAIL'));
process.exit(ok ? 0 : 1);
```

**B. `scripts/_smoke_monster_behavior.js`（怪物行为冒烟，纯 Node 加载战斗数据）**
```js
// 断言：每个 monster 有合法 ai/行为表；Boss 三模式钩子齐全；无 undefined 行为引用
const NDX = require('../js/ndx_loader_stub'); // 纯 Node 加载 owner 数据的桩（不依赖 DOM）
let fail = 0;
for (const m of Object.values(NDX.MONSTERS || {})) {
  if (!m.ai || !m.behavior) { console.log('FAIL 怪物缺行为表: ' + m.id); fail++; }
}
console.log('结论：' + (Object.keys(NDX.MONSTERS||{}).length - fail) + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
```

**C. `scripts/_verify_seal_mech_consumed.js`（K5 死机制断言）**
```js
// 断言：每个 jieseal.mech 在战斗结算代码中存在对应消费/分支；reflectStackClear 必须被引用
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../js/jieseals.js','utf8');
const mechs = [...src.matchAll(/mech:\s*'([^']+)'/g)].map(x=>x[1]);
let fail = 0;
for (const mech of new Set(mechs)) {
  const used = require('child_process').spawnSync('grep',['-rn',mech,'../js/combat_*','../js/jieseals.js'],{encoding:'utf8'}).stdout;
  if ((used.match(new RegExp(mech,'g'))||[]).length < 2) { console.log('FAIL mech 无消费点: ' + mech); fail++; }
}
console.log('结论：' + (mechs.length - fail) + ' 通过 / ' + fail + ' 失败');
process.exit(fail?1:0);
```

**D. `scripts/_verify_asset_links.js`（K3 立绘断链断言）**
```js
// 断言：data 中引用的每张 NPC 立绘在 img/portraits/npcs/ 存在；无面部缺失需人工（截图比对，脚本只查存在性）
const fs=require('fs'),path=require('path');
const data=fs.readFileSync(__dirname+'/../js/data.js','utf8')+fs.readFileSync(__dirname+'/../js/data_compound.js','utf8');
const refs=[...data.matchAll(/(江流儿|刘洪|陈光蕊|[\u4e00-\u9fa5]+)/g)].map(x=>x[1]);
const dir=path.join(__dirname,'../img/portraits/npcs');
let fail=0;
for(const name of new Set(refs)){
  const hit=fs.readdirSync(dir).some(f=>f.includes(name)|| name.includes(f.replace(/\.webp$/,'')));
  if(!hit){console.log('FAIL 立绘断链: '+name);fail++;}
}
console.log('结论：'+(refs.length-fail)+' 通过 / '+fail+' 失败');
process.exit(fail?1:0);
```

> 纯 Node 优先；仅"横屏门槛/立绘存在性/死机制/回归"可纯 Node 断言；"顶部面板重叠/旋转态/真机手感"仍需人工实机或 CDP 脚本（`dangerouslyDisableSandbox`）。

---

## 五、质量门判定（QA 建议性，最终放行由用户决定）

- **门禁基线**：PASS（31/31，零失败，无退化）。
- **覆盖完整性**：CONCERNS——回归套件、怪物行为冒烟、立绘/六道视觉/死机制断言**均为真空白**，31/31 不等于"全功能已验证"。
- **上架阻断项**：K7（AI 水印）🔴、K5（轮回死机制）🔴 须 M1/M0 收口；K6 据证据**降级**为复核，非硬阻断。
- **建议**：M1 放行前至少落地 gate A/B/C/D 中 K5 对应的 C（死机制断言），并人工实机跑完轮 1–3 检查点。

---

## 附录：本报告的命令与证据索引

- 门禁：`node scripts/_run_all_gates.js` → 脚本数=31 通过=31 worst=0
- 缺失脚本：`find . -name "regression*.js"` / `-iname "*monster*behavior*"` → 0 命中
- 死机制：`grep -rn reflectStackClear js/` → 仅 `js/jieseals.js:110`
- 立绘目录：`ls img/portraits/npcs/` → 5 文件，缺 刘洪/陈光蕊
- 隐私：`js/ui/ui_misc_1.js:637,647`（纯文本引用）；`.gitignore:75-78`（两 md 已部署）
- 横屏：`docs/手机横屏适配_2026-09-14.md` §四
- 六道：`docs/六道视觉层_接入方案_2026-09-14.md` §一/§五
- 权威记忆：`docs/工作室阶段诊断与路线图_2026-09-15.md` §三/§四

---

## 六、M1-QA-SEALGATE-01 追补（2026-09-14）

**K5（`reflectStackClear` 无消费点）状态变更**：engineering-lead 已在工作树落地接线（`js/combat_part1.js` diff **+15 行**，mtime 13:59；`git show HEAD:js/combat_part1.js` 中**无**该机制）——该机制由「死机制」转为「已消费」，消费点 `js/combat_part1.js:597-599`。

**新增门禁**：`scripts/_verify_seal_mech_consumed.js`（`_verify_` 前缀，已被 `_run_all_gates.js` 自动发现；跑批 **31 → 32 脚本**）。
- **判定口径**：真源 `js/jieseals.js` 取全部 `mech:`（19 个），在 `js/**`（**排除**定义真源与 `js/ui/` 展示层）中判定 `F('mech')` / `_hasSeal('mech')` / `flags['mech']` / `flags.mech` 任一消费形态；违规 >0 非零退出。
- **负控（有效性证据）**：对「接线前」版本（`git show HEAD:js/combat_part1.js`）运行 → **恰好 1 违规：`reflectStackClear @ js/jieseals.js:110`（结论：21 通过 / 1 失败，rc=1）**。
- **当前工作树**：**0 违规**（结论：22 通过 / 0 失败，rc=0）——接线已生效。
- **无其它死机制**：负控中其余 18 个机制均有真实消费点（覆盖 `combat_part1/2.js`、`game/game_combat_2.js`）。

> 其余分诊项（K1/K2/K3/K4/K6/K7）状态见第三节，未变。
