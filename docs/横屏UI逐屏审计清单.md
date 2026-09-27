# 逆道西行 · 横屏 UI 逐屏真渲染审计清单

> 产物时间：V9.27 工作树｜审计方式：CDP 真机渲染（headless Edge）｜审计工具：`scripts/_tool_landscape_cdp.js`
> 缺陷分级参照 Steve Krug 可用性审计：P1 阻断 / P2 明显 / P3 观感，按「最严重 → 快速修复」排序。

## 一、审计范围与方法

**覆盖矩阵**：22 屏 × 4 视口 = **88 张真渲染截图**

| 视口 | 尺寸 | 代表设备 |
|---|---|---|
| `real-landscape` | 900×420 | 横屏手机（主目标） |
| `Desktop` | 1280×800 | 桌面 / 平板横屏 |
| `wide-desktop` | 1920×1080 | 宽屏桌面 |
| `rotated-portrait` | 420×900 | 竖屏手机（验证旋转门控） |

**屏清单**（22）：base（局内地图）、hero、bag、dock、lamp、xinmo、momentum、ach、collection、rubbing、settings、meta、compliance、yezanglu、cycle、monuments、ranking、dynasty、ash、changan、petAtlas、followerAtlas。

**跳屏原理（零游戏代码改动）**：本作弹窗为状态驱动——`NDX.ui.show*` 标志位 + 全局 `doRender()`。CDP 内直接 `Runtime.evaluate` 重置全部标志、置位目标屏标志、调 `doRender()` 即完成跳屏，无需向游戏注入任何调试钩子。

**截图稳定性**（依据 `screenshot` 技能规范）：固定视口与 `deviceScaleFactor=1`、显式等待渲染就绪、截图前摘除加载遮罩与残留弹窗宿主，避免动画/过渡造成的假象。

## 二、结论总览

**无 P1 阻断缺陷**。横屏主目标视口（900×420）与桌面视口（1280×800 / 1920×1080）均未发现溢出、截断、缩放错误；竖屏（420×900）22 屏全部正确显示「请横屏游玩」锁定层，旋转门控行为正确。

## 三、缺陷清单

### P1 — 已修复：灵兽图鉴整块右移，左半空白

- **现象**：洪荒百兽（petAtlas）面板内容被推到右半边，左半大面积空白，卡片字号被压缩。
- **根因**：`css/style.css` 的 `.pet-atlas-branch { margin-left: auto; }`。该规则原为小标签设计（`font-size:10px` 的「N 形态」计数），但 `js/ui/ui_misc_3.js` 中 `.pet-atlas-branch` 已变更为**整个分支区块容器**（标题 + 灵兽网格），`margin-left:auto` 遂把全部内容推至右侧。
- **影响**：全视口可见，非横屏特有。
- **修复**：删除 `margin-left: auto`；`index.html` 中 `style.css` 版本号 `?v=532 → 533`。
- **验证**：900×420 复截图确认卡片铺满全宽、字号正常。

### P3 — 已修复：横屏滚动面板收尾按钮贴视口下缘

- **现象**：业藏录、轮回总鉴等长面板滚到底时，收尾按钮紧贴视口底边，无余量。
- **修复**：`css/mobile-landscape.css` 中 `html.ndx-short-landscape .panel-body` 增加 `padding-bottom: 14px !important`；版本号 `?v=3 → 4`。

### P3 — 已修复：数值导出脚本的 3 条 UI 装载报错（测试环境假阳性）

- **现象**：`scripts/_dump_balance_db.js` 装载期报 3 条 `Cannot read properties of undefined (reading 'appendChild')`（`ui_battle_fx` / `ui_risk_visual` / `ui_monster_bubble`）。
- **根因**：桩 `document` 缺 `head` 属性，而这 3 个文件顶部 `injectCSS()` 执行 `document.head.appendChild(css)`。真实浏览器 `document.head` 恒存在，**非运行期缺陷**。
- **修复**：桩 `document` 补 `head: { appendChild: _noop }`（仅测试环境，未改任何游戏代码）。复跑导出已无报错。

### 观察项（未修，记录备查）

| 项 | 说明 | 处置 |
|---|---|---|
| 轮回殿（cycle）左列留白 | 左列为「紧箍」具象化图形区，属设计如此 | 不修 |
| 英雄面板「战力总评 0」字号突出 | 开局 0 值的大号红字较显眼，属既有设计 | 不修 |
| 审计期偶发 | 900×420 的 ach 屏曾捕获加载层 20%（时序抖动，非游戏缺陷，后续已通过强制摘除加载层消除） | 已规避 |

## 四、复现命令

```powershell
node scripts/_tool_landscape_cdp.js      # 产出 88 张截图到 scripts/_audit_shots/
```

## 五、验收状态

- 相关门禁：`_verify_syntax_all` 19/0、`_verify_media_paths` 117/0、`_verify_balance_db` 全过。
- 说明：本轮仅改动 2 处 CSS + 1 处测试桩 + 2 个缓存版本号，故只复跑上述相关门禁；全量 `_run_all_gates.js` 最近一次为 **75/75 worst=0**（在本轮最后两处改动之前）。
- 截图产物 `scripts/_audit_shots/` 属生成物，按项目规则不提交。

## 六、遗留

- 88 张截图中已人工复核约 20 屏（覆盖 4 视口关键屏），其余存档于 `scripts/_audit_shots/` 可供随时复核。
- 若后续新增屏或改版，重跑一次该工具即可回归；建议把「加载层摘除 + 弹窗宿主清理」保留在工具内，避免审计假象。
