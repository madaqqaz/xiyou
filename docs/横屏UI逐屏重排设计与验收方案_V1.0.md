# 《逆道西行》横屏 UI 逐屏重排 · 设计与验收方案（V1.0）

> 日期：2026-09-27｜状态：待用户审阅｜上位文档：`docs/横屏UI逐屏审计清单.md`（V1 审计，本方案将其升级为全量重排基线）
> 目标形态：TapTap 手机版（原生壳锁横屏）为主目标，浏览器 H5 / 微信旋转伪横屏不得回归。

## 〇、前置闸（阻断项，未闭合不开始实现）

- **脏工作区授权**：当前 git 工作区大规模 dirty（js/css/index.html/资源等数百处未提交改动）。按 AGENTS.md §十三/§十五，实施第一批改动前必须由用户二选一：
  1. 先完成基线提交（用户明示授权后执行，agent 不自行 `git add .`）；或
  2. 明确授权"在现有脏工作区上叠加横屏重排改动"，并承诺本轮只触碰 §六 边界文件、不回滚不覆盖既有未授权改动。
- **真机配合**：手机真机验收需用户设备通过 cpolar 隧道（`mobile_test.ps1`）访问，属计划内协作项，非 agent 单方面可闭环。

## 一、现状事实（已取证）

| 项 | 事实 | 真源 |
|---|---|---|
| 壳层横屏锁 | TapTap 小游戏形态 `deviceOrientation: "landscape"` 已声明；H5 直发/PWA `orientation: "landscape"` 已声明 | `taptap_bundle/game.json`、`manifest.json` |
| 网页层门控 | `index.html` 内联 `applyShortLandscape()` 给 `<html>` 挂 `.ndx-short-landscape`（旋转伪横屏或真实横屏短边≤1080）/ `.ndx-wide-landscape`；竖屏挂「请横屏游玩」提示层；`#ndx-lock` CSS 旋转兜底 | `index.html` 内联脚本 |
| 微调样式 | `css/mobile-landscape.css`（483 行）为窄横屏唯一微调 owner；旋转态 vh/vw 陷阱已改容器百分比 | 文件头注释 + 实读 |
| 审计基线 | V1 审计 22 屏 × 4 视口 = 88 张 CDP 真渲染截图；无 P1；坊市（shop）屏**不在清单**（S17 标 P1 审计缺口） | `docs/横屏UI逐屏审计清单.md`、`docs/系统审计/全角度分析_v2.0/S17…md` |
| 已知热区疑点 | `.jing-pick` ≈26px、`.rub-sutra` ≈21px，低于 36px 红线（待实测复核） | S0 总览 L2 |
| 版本号现状 | `style.css?v=161`、`mobile-landscape.css?v=172`（V1 审计文档中 `?v=533/4` 与现状不符 → 经历过 vnorm 归一，须以当前 `index.html` 实读为准；S0 L4 已登记 `?v=` 双计数风险） | `index.html` 实读 |
| 测试工具 | `scripts/_tool_landscape_cdp.js`：headless Edge + CDP，状态驱动跳屏（`NDX.ui.show*` + `doRender()`），零游戏代码改动 | 脚本实读 |

## 二、方案选定

**方案 A · 类门控体系内的逐屏重排**（已获用户确认）。

- 保持 `.ndx-short-landscape` / `.ndx-wide-landscape` 类门控为唯一门槛真源；`mobile-landscape.css` 保持横屏微调唯一 owner。
- 以 CDP 真渲染取证驱动，逐屏重排字号/间距/堆叠/热区；审计确认不合理的历史规则**整段重写**，禁止在其上继续追加补丁式 `!important`。

否决项（留存理由，不得复活）：
- 方案 B（`style.css` 横屏优先重做）：改动面覆盖全站主样式表，回归风险与当前脏工作区状态不可承受。
- 方案 C（clamp()/容器查询流体系统）：等同自研 CSS 框架，微信 WebView 老内核兼容未验证；仅作长期方向记录，不进入本轮。

## 三、测试与取证矩阵

### 3.1 CDP 视口矩阵（重排主靶心 = 真实横屏）

| 视口名 | 尺寸 (W×H) | 代表场景 | 判定预期 |
|---|---|---|---|
| `phone-landscape-844x390` | 844×390 | 主流手机壳锁横屏（新增） | `.ndx-short-landscape` 命中、无旋转层 |
| `real-landscape-900x420` | 900×420 | V1 审计主视口（保留） | 同上 |
| `tall-phone-800x360` | 800×360 CSS px（等效物理 2400×1080 @dsf=3）（新增） | 挖孔/超宽比热区 | 同上 |
| `tablet-1280x800` | 1280×800 | 平板/桌面横屏（保留） | short-landscape（≤1080 短边） |
| `wide-desktop-1920x1080` | 1920×1080 | 大屏（保留） | `.ndx-wide-landscape` |
| `rotated-portrait-420x900` | 420×900 | 微信旋转伪横屏（保留） | 旋转层 + short-landscape，**不得回归** |

工具改造：`_tool_landscape_cdp.js` 的 `VIEWPORTS` 按上表增删；`SCENES` 补 `shop`（`p.kind==='shop'` 状态置位方式与 show* 标志并列处理）及盘点中发现的其余缺屏。

### 3.2 手机真机验收清单（用户设备执行）

1. 运行 `powershell -ExecutionPolicy Bypass -File demo/mobile_test.ps1` 取公网地址，手机浏览器打开。
2. 逐项验收并反馈：横屏锁定/旋转表现、「请横屏游玩」提示层进出、逐屏点击热区手感、弹窗与长面板不溢出、刘海/挖孔安全区（`viewport-fit=cover`）、买断门禁弹窗（TapTap 态）位置。
3. 真机问题按 §四 重排原则红线回填到对应屏整改，重截 CDP 图复证。

### 3.3 门禁与回归

- 每批 CSS 改动后：`node --check`（如触 JS）→ 复跑 CDP 全视口截图对比。
- 收尾全量：`node scripts/_run_all_gates.js`（要求 worst=0）；`_verify_syntax_all`、`_verify_media_paths` 必绿。
- TapTap bundle：横屏相关文件改完后经既有构建脚本同步（小游戏形态 `_taptap_bundle.js` / H5 直发 `_build_taptap_h5.js`，dry 先行、`--build` 需用户确认产物落点），比对 bundle 内 `mobile-landscape.css`/`index.html` 与 demo 源一致。

## 四、逐屏重排原则（每屏评审检查单）

1. **字号阶梯**：窄横屏统一 11/12/13/16/18px 五档；同屏不得出现第 6 种杂散字号；发现即并入阶梯。
2. **热区红线**：全部可点元素 `getBoundingClientRect()` ≥36px（战斗内高频主操作 ≥44px）；不足则扩 padding/命中层，不用 zoom 伪装。
3. **堆叠与滚动**：390px 逻辑高度下，每屏"主体一屏可见 + 面板内部滚动"；禁止整页滚动把收尾按钮藏到屏外；`panel-body` 底部保留 ≥14px 余量（沿用 V1 P3 修复）。
4. **vh/vw 陷阱**：旋转伪横屏态禁止新增 vh/vw 依赖（沿用文件尾「旋转伪横屏修正」容器百分比策略）；真实横屏态媒体查询仅用于大屏特例。
5. **整段重写纪律**：某屏历史规则被取证证伪时，重写该规则组并删除被替代条款；`mobile-landscape.css` 行数不得因"追加而膨胀"，允许因"重写"变化。
6. **文案风格**：新增可见文案遵循既有「黑暗西游 · 文言/白话混合」风格，不得临时硬编码后补。

## 五、范围（屏清单）

V1 的 22 屏：base（局内地图）、hero、bag、dock、lamp、xinmo、momentum、ach、collection、rubbing、settings、meta、compliance、yezanglu、cycle、monuments、ranking、dynasty、ash、changan、petAtlas、followerAtlas。

本轮新增纳入：
- **shop（坊市）**：S17 P1 审计缺口，补进 `SCENES` 并逐条过 §四 原则；
- **battle（战斗屏）**：V1 审计以静态 show* 屏为主，战斗屏含 `fb-bottombar/op-point-panel/skill-btn/treasure-btn` 等最重热区面，需以实际开局态纳入截图矩阵；
- **事件/叙事屏（scene-modal/opt-cards/trial）**：`.jing-pick`、`.rub-sutra` 热区疑点所在屏，实测复核并修复；
- **buyout-gate（买断门禁弹窗）**：TapTap 启动第一屏，壳锁横屏下的定位须取证。

最终逐屏缺陷清单在 Phase 1 基线取证后产出（输出为本文档新增章节「§十 逐屏实测缺陷附表」，缺陷按 P1/P2/P3 分级）。

## 六、实施边界（文件 owner）

允许触碰：
- `css/mobile-landscape.css`（横屏微调唯一 owner，重写主战场）
- `css/style.css`：**仅限**逐屏取证证伪的基础布局规则（改前先在本清单登记条目）
- `scripts/_tool_landscape_cdp.js`（视口/场景扩展）
- `index.html`（仅 `?v=` 版本号递增）
- `taptap_bundle/`（仅经构建脚本同步产物）
- `docs/横屏UI逐屏审计清单.md`（升级为 V2 全量版）与本文档

禁止触碰：
- `js/**` 全部游戏逻辑与 UI 渲染代码（重排只走 CSS 与审计工具；若取证发现必须改 JS 才能闭合的缺陷 → 停下向用户报告，不擅自扩面）
- `platform/**`、`capacitor.config.json`（壳层锁横屏配置现状已达标，无需改动）
- 任何与本轮无关的 dirty 文件（不回滚、不覆盖、不吸入提交）

## 七、实施批次

| Phase | 内容 | 出口条件 |
|---|---|---|
| P0 前置 | 用户闭合 §〇 脏工作区授权 | 明确授权文本 |
| P1 基线 | 改造 CDP 视口/场景矩阵 → 全量截图 → 按 §四 逐屏产出缺陷清单（P1/P2/P3 分级）写入本文档附表 | 每屏有图有分级 |
| P2 重排批1 | 核心高频屏：base 地图、battle、shop、事件/叙事屏（含热区疑点修复） | CDP 复证 4 真实横屏视口全过 |
| P3 重排批2 | 面板弹窗群：bag/dock/lamp/xinmo/momentum/settings 及 settings 系 | 同上 |
| P4 重排批3 | 图鉴收藏系：ach/collection/rubbing/meta/compliance/yezanglu/cycle/monuments/ranking/dynasty/ash/changan/petAtlas/followerAtlas + buyout-gate | 同上 |
| P5 收口 | 旋转伪横屏 420×900 全量回归 → `?v=` 递增 → bundle 同步 → 审计清单 V2 回写 → `_run_all_gates.js` worst=0 → 真机清单交用户 | 门禁全绿 + 用户真机反馈闭环 |

每批独立可验收；任何批内发现 P1 阻断必须当批收掉，不得降级"后面再说"。

## 八、风险与停止条件

| 风险 | 缓解 | 停止并询问条件 |
|---|---|---|
| 重写 `mobile-landscape.css` 引发微信旋转态回归 | 每批后 420×900 视口全量复截 | 旋转态出现 P1（不可点/溢出）立即停止扩批 |
| `style.css` 改动外溢到桌面态 | 改前登记条目、桌面 1920×1080 同步复截 | 单条规则影响面超出登记范围 |
| 真机与 headless 渲染差异 | 真机清单覆盖壳锁横屏 + cpolar 隧道 | 真机复现但 headless 不可复现的缺陷 |
| 脏工作区冲突 | §〇 前置闸 + §六 边界 | 发现目标文件存在用户未授权改动与本改动同段冲突 |

## 九、验收标准（完成定义）

1. CDP 矩阵全视口 × 全屏（22 + 新增 4 类）截图取证归档，P1=0、P2=0（P3 允许登记为明示债务）。
2. 全部可点元素真实横屏态实测 ≥36px（`.jing-pick`/`.rub-sutra` 复测数据写入审计清单 V2）。
3. `node scripts/_run_all_gates.js` worst=0；`index.html` `?v=` 与触达文件一一对应递增。
4. `taptap_bundle` 同步产物与 demo 源一致（bundle 漂移门禁通过）。
5. 用户手机真机验收清单反馈闭环（通过或问题入清单）。
