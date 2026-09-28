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
   ⚠️ **2026-09-27 实测修订**（`fontsize_summary.json`，Task 4 开工前补采）：`phone-landscape-844x390` 全 26 屏实测显示 9px（498 处）/10px（357 处）是仅次于 13px 的第二、三高频字号，base 主地图屏 9px 达 45 处——原假设的“11px 下限”与实际严重不符。**经用户确认，本轮范围扩大**：9px/10px 提升为全站性 P2 缺陷（见 §十 L-P2-05），Task 4–6 需逐屏将低于 11px 的可见字号提升至阶梯最小档 11px（不新增阶梯档位，只把现存的 9/10px 归入既有 11px 档），优先用 `.ndx-short-landscape` 下的统一选择器提频而非逐屏定制。
2. **热区红线**：全部可点元素 ≥36px（战斗内高频主操作 ≥44px）；不足则扩 padding/命中层，不用 zoom 伪装。⚠️ **2026-09-28 二轮整改改判**：判定量从 `getBoundingClientRect()` 改为【布局盒 `offsetWidth/Height`】——rect 含 transform，无限循环脉动元素会被采样在随机相位（SETTLE 只约束有限次动画），既可能假阳性也可能漏报；布局盒不受 transform 干扰、确定性可复现。inline/contents 元素 offset 恒 0 回退 rect；可见/在屏判定仍用 rect。
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

## 十、逐屏实测缺陷附表（P1 基线取证，2026-09-27）

> 取证方式：`scripts/_tool_landscape_cdp.js` 全量跑批（6 视口 × 26 屏 = 156 张截图，产物 `scripts/_audit_shots/`，已剔除 30 张 V1 遗留旧命名截图）+ `hotzone_summary.json` 热区计数互证。当前这份 6 视口完整版已另存快照 `scripts/_audit_shots/hotzone_summary_baseline_2026-09-27.json`（不入库，仅本地取证），因为后续跑 `_verify_landscape_hotzone.js` 门禁会将其覆盖为单视口数据。
> 深读范围：对 `phone-landscape-844x390`（最严真实横屏）与 `real-landscape-900x420`（TapTap 壳典型分辨率）两个主视口，逐张人工读图评审了 base/shop/buyout/rubbing/settings/yezanglu/collection 共 7 屏（fight/event 因地图未命中，见 L-P1-01）；另对 `tall-phone-800x360` 抽查了 yezanglu 1 屏验证裁切问题跨视口一致性；其余 19 屏仅依据热区数据 + 抽样截图判断，未逐张深读，若后续批次发现遗漏缺陷按新增条目处理，不追溯本轮“未评审”为“已评审通过”。

| 编号 | 级别 | 现象 | 根因选择器（待 Task 4 前 grep 实证具体行） | 修复方向（初判，Task 4 定稿） | 目标文件 | 复测证据 |
|---|---|---|---|---|---|
| L-P1-01 | P1（已修） | `fight`/`event` 屏 `NO_HIT` 时截图残留上一屏（shop 兜底态）内容，被误标为取证证据 | `PREPS.fight`/`PREPS.event` 未命中分支未清空 `s.pending` 未重渲染 | 已在循环自然结束后、`return 'NO_HIT'` 前无条件补 `s.pending=null;doRender();`（已落地） | `scripts/_tool_landscape_cdp.js` | commit d0107d9 修复后重跑，`fight.png` 正确显示基础地图 |
| L-P2-01 | P2（Task 5 已修，见 §十·C） | 弹窗系共享壳组件底部「关闭」按钮在 800×360 / 844×390 / 900×420 三个真实横屏视口均被视口底边裁切（仅露图标上半部与「上」字），高度差 30px 不改变裁切量，疑为容器 `max-height`/定位问题而非纯高度问题 | 坐实：`.scene-overlay` row flex + `padding:7vh 14px 24vh`（可用高仅 69vh），Task 4 曾抬 `.scene-modal` max-height 至 80/90vh 超可用高 → `margin:auto` 溢出顶出 footer；settings 实为左上角 X 未裁，基线误列（其可见问题是 L-P3-01 损坏字形） | 已修：scoped flex 列钉 footer（见 §十·C） | `css/mobile-landscape.css` | 基线 12 张截图；修复后复验见 §十·C（4 弹窗 footer 单行完整显示 + 热区 6 视口全 0） |
| L-P2-02 | P2 | `rubbing` 屏 `.rub-sutra` 经文宏愿档位芯片实测高度 26px，低于 36px 红线；随视口变宽违规数上升（844×390:12 → 1920×1080:34） | `.rub-sutra`（S0 L2 已知疑点，本轮实测坐实） | 初判：为 `.ndx-short-landscape .rub-sutra` 补 `min-height:36px` 并调整内边距/字号使文字不溢出；宽视口档（`tablet-1280x800`/`wide-desktop-1920x1080`）数量更多，需同步检查大屏档是否走 `.ndx-wide-landscape` 分支 | `css/mobile-landscape.css` | `hotzone_summary.json` 全 6 视口均命中 |
| L-P2-03 | P2 | `settings` 屏音量滑杆 `INPUT[data-action=set-volume/set-bgm-volume/set-sfx-volume/...]` 实测高度 21px，为全部违规项中最短边最差值 | `input[data-action^="set-"]`（滑杆控件本体，非新增问题，V1 审计已登记待复核） | 初判：为 `input[type=range]` 系滑杆补 `min-height:36px`（含透明 padding 扩展点击区，不改变视觉轨道粗细）；若原生 range 样式受限，考虑包一层可点击容器 | `css/mobile-landscape.css` | `hotzone_summary.json` 6 视口均命中 4 处；门禁 worst 输出 `INPUT[set-volume] 160x21 @settings` |
| L-P2-04 | P2 | `yezanglu` 屏 `.yz-chip.lock` 藏品芯片实测 59×26，低于红线；视口越宽数量越多（6→17） | `.yz-chip` | 初判：同 L-P2-02 思路，`.ndx-short-landscape .yz-chip` 补 `min-height:36px`，检查是否为 flex 换行导致挤压 | `css/mobile-landscape.css` | `hotzone_summary.json` 6 视口均命中 |
| L-P3-01 | P3（Task 6 已修；CodeReview 二轮改判拆 a/b，见 §十·D/·E） | a) `settings` 屏左上角关闭钮下方出现疑似渲染损坏的小图标；b) monuments 等 `.opt-btn` 文本关闭钮左上角外溢 ⊠ 残影（基线“资产损坏”定性错误） | **两个症状、两条真因（二轮坐实：原单一因果链对 settings 不可达）**：a) `.modal-close` 本体即「✕」纯图标钮，settings plate 内无 `.opt-btn`，“继承 absolute”不可达；真因是泛用装饰规则 `[data-action*="close"]::after` 给它多叠第二个 14px 图标，✕+6px margin+14px 总宽≈38px > 钮宽 30px 且无 `overflow:hidden` → 挤到第二行悬挂于 ✕ 下方；真修＝`:not(.modal-close)` 排除。b) `.opt-btn` 系关闭钮：装饰规则只覆写 content/尺寸/背景、未覆写定位，继承 `body .opt-btn::after`（style.css，本是一条 `top:0;left:0;right:0;height:1px` 顶部高光线）的 `position:absolute`，14px 图标被钉在按钮左上角外溢成残影；真修＝显式 `position:static` + 四边 `auto` 复位。反证：非 `.opt-btn` 的 `.ach-book-close` 无此继承，cycle「离 开 轮 回 殿 ⊠」一直正常 | 已修：① `:not(.modal-close)` 排除纯图标钮（settings 真修）；② `position:static`+四边 `auto`（.opt-btn 系真修）；两处修复各命中各自症状，代码不动、归因订正 | `css/style.css` | 修复后 `phone-landscape-844x390` 实拍：settings/compliance ✕ 单图标干净；cycle/monuments/ranking/dynasty/ash/meta/changan/collection/rubbing/yezanglu 文本钮「标签 ⊠」同行内联（4× 裁剪图 `_probe_mono_btn_crop.png` 复核）；settings plate 结构证据：`js/ui/ui_modals_1.js` 关闭钮为 `.modal-close`、plate 内无 `.opt-btn` |
| L-P3-02 | P3（Task 6 新增并已修，本轮取证坐实） | 短横屏下所有 `.opt-btn` 系按钮的标签文字与左侧「◆」装饰重叠（monuments 空态「返回」、ranking「返回」、dynasty「合上年表」、ash/meta「合上」、changan「踏上西行」等均可见） | `css/mobile-landscape.css` 两条 `html.ndx-short-landscape .opt-btn` 把基座四值 padding 简写成两值（`10px 16px` / `10px 14px`），抹掉了 `.opt-btn` 基座为 `::before`「◆」（`position:absolute; left:12px`，12px 宽）预留的 `padding-left:34px` 左沟 | 已修：两条左值恒守 `34px`（`10px 16px 10px 34px` / `10px 14px 10px 34px`），并注释登记该耦合。⚠️ **二轮改判**：“顺带消除互为死码”不实——特异性核算坐实前一条所在 `L136-140` 整块为死码（min-height:44px 与 padding 均被后方同特异性 (0,2,1)+!important 的「触控优化」块覆盖），二轮已删除该死块，`.opt-btn` 横屏定义收敛到唯一落点；静止下限即贴红线 36px（零余量）另登记债务，见 §十·E 阻断3 | `css/mobile-landscape.css` | 探针实测 computed padding 由 `10px 14px` → `10px 14px 10px 34px`，文本 rect 起点 x 由 113 → 133（◆ 占 111–123，留 10px 间隙）；裁剪图目视无重叠 |
| L-P2-07 | P2（Task 6 取证新增；二轮改判待裁决 → **2026-09-28 用户裁决「重新设计布局」，已修**，见 §十·F/·G） | base 地图屏左下角 `.hud-hero` 芯片与英雄状态面板（攻·原·善·恶 + 本命行）叠压，英雄名「取经人」被折行并与「圣人」标题字符交错，肉眼难以阅读 | `css/style.css` 的 V9.50 段（`.map-hud .hud-chip{max-width:72px}` / `.hud-hero{max-width:72px;padding:4px}` / `.hud-hero-name{font-size:10px}`）把芯片收窄到 72px，与同为左下定位的状态面板争位；探针几何坐实：hud-hero（y246–313）与 #bagbar（top=253，max-height 34%）叠压 60px，名在 11px 内宽里折成竖排（均为 844×390 单视口探针值，非普适事实） | **重设计收口**：短横屏退役 `.hud-hero` 悬浮 chip（`display:none` scoped 覆写，落 `css/mobile-landscape.css`）——信息与入口全部由 bagbar 内 `status-mini` 承接（头像/名/HP/寿数/数值 + 自带 `data-action="show-hero-detail"`）。⚠️ 三轮改判：既有设计对两只 chip 处置**不同**（hud-bag 退役、hud-hero 抬高 66px 保留，style.css 相邻两行），非「漏收」；本轮是经用户裁决推翻抬高保留决策改走退役口径。另三轮发现：chip 隐藏会断裂心魔立绘变暗反馈（ui_core.js querySelector('.hud-portrait')），已修回退接线（§十·G）；叠压根因规则不 scoped，其余档位是否同因叠压**未复测**，登记债务 | `css/mobile-landscape.css` | 探针复验 hud-hero 不可见（退役生效，证据源为 `phone-landscape-844x390__base.9224.png` 实拍，探针 JSON 未落盘）；bagbar 内元素几何不变（地图节点未采，见 §十·G 债务1）；门禁 PASS（coverage ok）；base 新截图目视左下无叠压 |
| L-GAP-01 | 取证缺口 | `.jing-pick`（S0 L2 已知疑点，≈26px）在 26 屏矩阵内不可达：`ALL_FLAGS`/`SCENES`/`PREPS` 均无对应入口，热区采集选择器已包含该 class 但从未命中任何元素 | 待 Task 4 前排查该按钮实际所在屏（疑似经卷装配面板，需新增 `show*` 标志或 `prep` 路径，若需改 `js/**` 才能暴露入口则按 §六 停止上报） | 初判：优先在 `js/ui/` 中只读检索 `.jing-pick` 的实际渲染位置，确认对应 `NDX.ui.show*` 标志名后补入 `ALL_FLAGS`/`SCENES`；仅当该屏无法通过既有公开标志触达时才升级为停止上报 | `scripts/_tool_landscape_cdp.js`（若纯跳屏可达）或停止上报 | `hotzone_summary.json` 全 6 视口 0 命中，与 S0 L2 疑点不符，判定为取证覆盖缺口而非“已修复” |
| L-NEG-01 | 未复现 | Expected 缺陷下限中的「坊市 `panel-body` 在 390px 高度下可见性」与「S17 `.shop-reroll` 视觉/热区不匹配」两条，本轮实测未见问题：`.shop-reroll` 已包含在 `HOTZONE_EXPR` 选择器列表内但全 6 视口 0 命中；`phone-landscape-844x390__shop.png` 目视未见面板内容裁切 | — | 无需处理；若 Task 4 改 shop 屏时引入新问题，按新增条目登记，不追溯本条 | — | `hotzone_summary.json` shop 屏 6 视口均空数组；`phone-landscape-844x390__shop.png` 目视未见裁切 |
| L-NEG-02 | 延后 | Expected 缺陷下限中的「S0 L4 `?v=` 双计数复核」不属于基线取证范畴（是收口阶段的版本号纪律检查），本轮未处理 | — | 归入 Task 7（P5 收口）`?v=` 递增纪律检查项 | `index.html` | 本轮未涉及，非遗漏 |
| L-P2-05 | P2（本轮新增，范围扩大） | 全站 26 屏实测存在大量低于阶梯下限 11px 的可见字号：9px 共 498 处、10px 共 357 处（`phone-landscape-844x390` 口径），base 主地图屏 9px 多达 45 处，手机上肉眼难以阅读 | 待 grep：`font-size:9px`/`font-size:10px` 在 `css/style.css`/`css/mobile-landscape.css` 的具体行 | 初判：在 `mobile-landscape.css` 的 `.ndx-short-landscape` 块内统一将 `font-size:9px`/`font-size:10px` 提升为 11px（并入既有阶梯最小档，不新增档位），优先按选择器批量覆盖而非逐屏定制；需同步确认 `js/**` 中无内联 `style.fontSize` 硬编码 9/10px（若有，属 §六 禁触范围，需停下上报） | `css/mobile-landscape.css` | `fontsize_summary.json` 全 26 屏 × 6 视口实测数据 |
| L-PENDING-01 | 已关闭 | ~~字号阶梯定档尚未实测~~ 已在 23acdd5 补采完成，产出 `fontsize_summary.json`；实测结果推翻原假设，衍生出 L-P2-05 | — | 已处理，见 L-P2-05 | `scripts/_tool_landscape_cdp.js` | commit 23acdd5 + 本次全量重跑产出 |

**本轮热区违规总计**（`node scripts/_verify_landscape_hotzone.js` 口径，仅 844×390 基准视口）：22 处（rubbing 12 / settings 4 / yezanglu 6），全部计入 L-P2-02/03/04；P1=0（L-P1-01 已在取证阶段发现并修复，不进入重排范围）；P2=4；P3=1；取证缺口/待办 2。另有未复现/延后 2 条（L-NEG-01/02），属核查留痕记账行，不计入违规统计。

## 十·B、Task 4 处置与复测（核心屏 + 全站字号红线，2026-09-27）

> 本轮 owner 严格限定 `css/mobile-landscape.css`（横屏微调唯一 owner）+ `scripts/_tool_landscape_cdp.js`（取证工具口径修正）；未触碰 `js/**`、`css/style.css`、`index.html`。`index.html` 的 `mobile-landscape.css?v=172→173` 按 L-NEG-02 归入 Task 7 收口统一递增（本轮工作树 `index.html` 已被用户并行 `?v=` 改动污染，避免吸入）。

### 处置项

| 缺陷 | 处置 | 落点 |
|---|---|---|
| L-P2-05 全站字号 | 以 CDP 选择器级 offenders 真源为准（非静态 grep，可穿透继承/内联/动态类），在 `.ndx-short-landscape` 末尾统一块逐类把 `<11px` 抬到 11px（改前基线 41 类 925 实例）；含修正本文件自有 `.dock-chip`（10→11）/`.dock-cnt`（9→11）、`.detail-section.sys-ti`、`.dao-benefit`/`#topbar .dao-benefit`、`.hero-card-mini .hero-trait-mini`、`.fb-dmg-fly .dmg-squad`，并用 `.battle-debuff-item > span` 以样式表 `!important` 覆盖 `js/battle_ui_enhance.js:111` 内联 10px（未触碰 `js/**`）。**CodeReview 一轮整改**：泛用类不做无差别下压——`.dim` 移出 blanket（靠继承 13px 本已可读）；`.hero-trait` 改为作用域 `.hero-detail .hero-trait`；`.hptxt` 从 blanket 单列并补 `.status-mini .hpbar` 高/行高守卫防血条裁字。**CodeReview 二轮整改**（复审 a141e23 发现，本提交收口）：① `.hptxt`/`.hero-trait` 抬升改为 `max(11px, calc(11px * var(--font-scale))) !important`，修正一轮 blanket 用固定 11px `!important` 反而把无障碍 `body[data-font-scale=1.1/1.2]` 放大档（style.css 的 12.1/13.2px）钉回 11px 的口径失真；血条守卫高/行高同步改 `max(14px, …)` 使放大档不被固定 14px 反裁。② 删除一轮守卫误引入的死选择器 `html.ndx-short-landscape .map-hud .status-mini .hpbar`（`.status-mini` 实际在 `#bagbar` 内、与 `.map-hud` 为 `#trail` 兄弟，永不命中），仅留 `.status-mini .hpbar`。③ 订正一轮对 `.hero-trait` 的表述依据：全仓 `.hero-trait` 唯一（`ui_modals_1.js:427`），`.hero-modal .hero-trait` 的 12px 与 `.hero-detail .hero-trait` 指同一元素，短横屏真值为 10px（非“误伤的 12px”），作用域抬升即可 | `css/mobile-landscape.css` |
| L-P2-01 关闭按钮裁切 | **未修复**。Task 4 初版曾用 `.panel-box` flex 化修复，经 CodeReview 坐实为死选择器（`.panel-body` 从不是 `.panel-box` 直接子，实际挂在 `.scene-modal`/`#panel` 下），且误删 `.panel-body` 的 62vh 上限属真回归——已全部回退至原状。关闭按钮裁切根因在 `.scene-modal` 弹窗系容器，移交 **Task 5（面板弹窗群重排）** 处理 | `css/mobile-landscape.css`（回退）→ Task 5 |
| L-P2-04 `.yz-chip` | `.ndx-short-landscape .yz-chip` 改 `inline-block` + `padding:9px 0` 撑高至 `min-height:36px`（其内含 `.yz-dot` 靠 `vertical-align:super`，故不用 `inline-flex` 以免破坏上标基线） | `css/mobile-landscape.css` |
| L-P2-02 `.rub-sutra` | **工具误报，非真实热区缺陷**。经核 `.rub-sutra` 是纯展示 `span`（可点的是外层 `.rub-overlay[data-action=close-modal]`），已从 `HOTZONE_EXPR` 可点选择器列表移除，并撤回 CSS `min-height`（原补高会撑坏拓印卡版式），不再计为违规 | `scripts/_tool_landscape_cdp.js` + `css/mobile-landscape.css` |
| L-P2-03 音量滑杆 | `.ndx-short-landscape input[type=range]{min-height:36px}`（不改视觉轨道） | `css/mobile-landscape.css` |

### 工具口径修正（Task 1 工具的 Task 4 增量）

- `FONTSIZE_EXPR` 扩展：在原 `freq` 基础上增采 `<11px` 的选择器级 `offenders`（`tag.class[data-action]@px` 计数），产出结构由 `freq` 变为 `{freq,offenders}`；这是「字号红线」可证伪复测的依据。
- `HOTZONE_EXPR` 修正：违规判定原用 raw `r.height<min`、上报用 `Math.round` → 出现 35.5px 显示成「36」却被判违规的口径不一致；统一改为 `Math.floor` 同时用于判定与上报。**口径改变会同时改变计数**：35.5px 在 floor 下变 35（<36，仍违规）而 round 下变 36（显示合规却被 raw 判违规），修正后显示与判定一致。另将 `.rub-sutra` 移出 `HOTZONE_EXPR` 可点选择器（属采集口径修正，非真实交互元素）。fontsize 解析失败的 `catch` 由静默改为输出 `[字号采集失败]` 告警，避免异常被吞。

### 复测结果（`phone-landscape-844x390` 全 26 屏）

- **字号 offenders：925 → 0**（改前基线 41 类 925 实例；改后 FONTSIZE offenders 全空，本轮 hotzone-only 复验 26 屏 offenders_total=0）。字号为 computed 值、不随视口变化，base 视口归零即覆盖真实横屏各视口。
- **热区违规：22 → 0**。rubbing/settings/yezanglu 三屏 22 处全部清零；本轮修复后 `--hotzone-only` 基线视口复验违规总计 **0**，run 退出码 **0**。
- **全 6 视口全量取证已跑完**（156 截图）：热区 6 视口全 0。初版登记的 collection 关闭按钮 ~35px（L-P2-06）经全量复验为**入场动画时序假阳性**（静止态 36px，恰贴红线；⚠️ 二轮订正：原写“≥40px”不实——生效下限是触控优化块 `min-height:36px !important`，同文件另一处 44px 为被覆盖的死码，见 §十·E 阻断3），改判为非缺陷销账；L-P2-01 跨视口目视复测因该缺陷回退移交 Task 5，本轮不再标为已修。
- **大屏档残留**：`tablet-1280x800`/`wide-desktop-1920x1080` 仍有 9/10px 残留（`.ni-seg`/`tspan` 等），因 `.ndx-short-landscape` 门槛在大屏短边>640px 不命中，属另一门槛态（`.ndx-wide-landscape`），**非本轮手机横屏范围**，待大屏专项处理。

| L-P2-06 | 已销账（非缺陷） | ~~collection 关闭按钮实测 ~35px，贴 36 红线~~ | `BUTTON.opt-btn.ghost[close-modal]`（collection 屏） | 全 6 视口全量复验 hotViol 均 0，静止态 36px（恰贴红线、零余量，抬至 ≥40px 另登债务见 §十·E）；初判为入场动画未停时的时序采样假阳性，非真实热区缺陷，改判销账不入 Task 6 | — | 全量 6 视口 `hotzone_summary.json` collection 屏均空数组 |

**本轮遗留债务（CodeReview 坐实，不阻断本轮）**：① `#topbar .dao-benefit` 为死选择器（仓内无 `#topbar` 元素），与 `style.css` 同名规则构成双 owner，下一轮可删除或改指向真容器；② `css/style.css` 内已内嵌部分 `.ndx-short-landscape` 规则，与本文件横屏微调唯一 owner 职责重叠，属历史双 owner 债务，待后续批次收敛；③ `.yz-chip` 作为 `.yz-chips` 的 flex item 已被 blockify，`display:inline-block` 实为 no-op（真正生效的是 `min-height`+`padding`），保留以防基线变动，不改功能；④ 其余短横屏 `.hptxt` 血条（`.hpbar` 高 12/行高 12）本轮未逐一审计是否需同等守卫，默认 `--font-scale=1` 下 max() 与旧值等渲染，放大档尚待专项验证。

## 十·C、Task 5 面板弹窗群重排与 L-P2-01 修复（2026-09-28）

> 本轮 owner 仍严格限定 `css/mobile-landscape.css` + `scripts/_tool_landscape_cdp.js`（取证隔离增量）；未触碰 `js/**`、`css/style.css`、`index.html`。

### L-P2-01 处置（scoped flex 列钉 footer）

- **根因坐实**：`.scene-overlay` 为 row flex + `padding:7vh 14px 24vh`（可用高仅 69vh），Task 4 曾抬 `.scene-modal` max-height 至 80/90vh 超可用高 → `margin:auto` 居中溢出，footer 关闭按钮被顶出视口底。基线所列 settings 实为左上角 X 未裁，属基线误列（其可见问题是 L-P3-01 损坏字形，仍归 Task 6）。
- **修法**：文末新增 scoped 块，仅对确有「标题 + `.panel-body` + 底部 footer 直接子」结构且真裁切的 4 弹窗（collection `.col-modal` / cycle `.cp-modal` / rubbing `.rub-modal` / yezanglu `.yz-modal`）：modal 改 flex 列、`max-height:69vh`（= overlay 可用高，不侵入 overlay padding）；header/footer `flex:0 0 auto` 钉住；body `flex:1 1 auto; min-height:0; max-height:none`（穿透 style.css 的 `.col-body` 64vh / `.rub-body` 72vh / `.yz-body` 68vh 固定上限）独占剩余高内部滚动；footer 按钮 `align-self:center; width:max-content; white-space:nowrap`（修 `.ach-book-close` 带 `margin:6px auto` 在 flex 列中被 `min-width:36px` 压成窄方块逐字换行的次生问题，CDP 探针实测 36×36/scrollH=173 → 177×36 单行）；cycle/rubbing 专属 overlay（`.lunhui`/`.rub-overlay`）收回上下预留至 `4vh`；旋转态用 `%` 覆写（vh 陷阱）。
- **泛用方案回归事故（已收敛，诚实留痕）**：初版曾把同一 flex 列模型泛用至全部 `.scene-modal` + 泛用 overlay `padding:3vh`，实测把 changan/ranking 等「内容直接铺在 modal 下」的网格弹窗压扁，引入基线不存在的热区违规（changan 11 / cycle 6 / settings 5 / ranking 4 / yz 相关 1 等）；已全部回退为上述 scoped 版本，并恢复 `.panel-body` 的 62vh 上限（仅 4 弹窗内由 scoped 块覆写）。教训：弹窗系壳组件覆盖面大，结构异构（footer 位置/内容包裹层不一），必须逐屏坐实结构后再定作用域。
- **bag/dock 结构差异**：bag footer（`.bag-actions`）在 `.panel-body` 内部随内容滚动而非钉底，属既有合理交互，本轮不改；lamp/xinmo/momentum 无底部裁切，未动。

### 工具隔离增量（`scripts/_tool_landscape_cdp.js`）

- 新增 `NDX_CDP_PORT` 环境变量覆盖调试端口（默认仍 9222，门禁行为不变）；非默认端口时 profile 与汇总产物（`hotzone_summary.<port>.json` 等）加后缀。背景：CodeBuddy 自动化门禁循环会间歇抢占默认 9222/profile 并互踢产物文件，污染并行取证；独立端口可完全隔离。

### 复测结果

- 基准视口 `--hotzone-only`（NDX_CDP_PORT=9224 隔离跑）：热区违规总计 **0**，退出码 **0**；FONT offenders 基线视口 **0**。
- 全量 6 视口 × 26 屏（156 截图重生成）：热区违规总计 **0**；字号残留仅 tablet/wide 大屏档 hero 屏（`.ndx-wide-landscape` 门槛态，非本轮手机横屏范围，与 §十·B 大屏档残留同口径）。
- 并发互证：CodeBuddy 循环在默认 9222 门禁独立产出的 `hotzone_summary.json` 同步 **gate_total=0**，双口径一致。
- 目视核验（`phone-landscape-844x390`）：cycle「离 开 轮 回 殿」/ collection・rubbing・yezanglu「合 上」均单行完整显示不再裁切（按钮尾部 ⊠ 为 L-P3-01 已知损坏字形，归 Task 6）；changan/bag/settings 无回归；rotated-portrait-420x900 为「请横屏游玩」指引层（预期行为，与 Task 4 基线一致）。

### CodeReview 一轮整改（复审 7128aa1，2026-09-28，本提交收口）

评审结论：无阻断、可合入；4 设计风险 + 4 债务逐条对照代码实证后处置如下：

| 发现 | 实证 | 处置 |
|---|---|---|
| R-1 `69vh` 前提失真 | 属实：style.css 存在更晚的 `html.ndx-short-landscape` 前缀 !important 层（V9.46b：overlay padding 6px 10px / modal max-height 96%）压过 v325 层（(0,2,0) 的 2%/3% + 92%），真实可用高≈93vh，69vh 过度收紧约 23%；且泛用 `.scene-modal` 的 flex 列基调（无 !important）本就存在于 style.css，真正致压扁的是本文件叠的 !important max-height | 删除 scoped 块的 `max-height:69vh`、`.lunhui/.rub-overlay` 的 `4vh` padding 覆写与旋转态 `88%/4%` 专属覆写，宽高统一交由 style.css 生效层接管；**二轮复审再订正**：注释不再引用具体数值/行号（style.css 正被用户并行演进，行号已漂移），只写机制性指向「style.css 内最后一条 html.ndx-short-landscape 前缀 !important 规则」；根因注释改写为坐实版（footer 落进 `.scene-modal` 自身 overflow 滚动区外）；L106 错误不变量同步订正 |
| R-2 回退泛用时隐式改变全站 scene-modal 口径 | 属实：删 `max-width:90vw` 后回落终局层 `96%`（cp-modal 宽 +50px）；padding 16→14 | 接受回落真源口径不再叠加覆写；按评审要求目视补验 ranking/petAtlas/followerAtlas/meta 四网格屏（`phone-landscape-844x390` 新截图）均无列数变化型热区回归（全量热区 6 视口 0 互证）；本行即显式登记该副作用 |
| R-3 结构判据与 DOM 事实不符 | 属实：monuments/ranking/meta-overview/ash/follower/劫印弹窗同为「标题+body+footer 直接子」结构（尚未复现裁切） | 注释判据改述为事实性（「本轮实拍坐实裁切的才入桶，扩桶前逐屏实拍」）；未复现六屏登记为债务，归 Task 6 用新 footer 断言复测 |
| R-4 热区门禁对裁切结构性盲 | 属实：`HOTZONE_EXPR` 跳过完全出屏元素，「热区 0」不能证明 footer 可见 | 工具新增 `FOOTER_EXPR` 收尾按钮可见性断言（modal 最后直接子 button 的 rect 超视口底/顶或超 modal 可视底缘即 clipped，与热区同轮零额外渲染），产出 `footer_summary<suffix>.json`，`--hotzone-only` 退出码纳入 clipped；门禁 `_verify_landscape_hotzone.js` 同步消费（无文件时计 0 向后兼容）。**断言首跑即拓出基线未登记的 dynasty 屏「合上年表」真裁切**（bottom=886 vs modal 底 376，十朝铺在 modal 直下、footer 落进滚动区）→ 将 `.ach-book-modal`（仅 dynasty 使用）并入 scoped flex 列块（滚动体 `.ach-list`，header/lead 钉住），复验 clipped=0 且截图目视按钮完整钉底 |
| D-1 截图未随端口隔离 | 属实 | 截图文件名同步加 `PORT_SUFFIX` |
| D-2 `NDX_CDP_PORT` 无校验 | 属实：非法值可被门禁 envBad 正则洗成 SKIP 假绿灯 | 加范围校验非法回落 9222 + 告警；用法注释补 env 说明 |
| D-3 VH_TRAP 注释失真 | 属实：自称「置于文件末尾」实际在 L248 | 改为源序契约描述（特异性+后置源序；后续文末 rotated 覆写须在其后）；本轮 scoped 块已无 vh 声明，旋转态专属覆写整块删除 |
| D-4 `?v=` 未递增 | 与既有决策一致 | 仍归 Task 7 收口统一 bump（落点见下方二轮表债务4：取空号 >172 且 ≤235，非 173） |

**整改后复测**：`--hotzone-only`（9224 隔离）热区 **0** / footer 裁切 **0** / exit **0**；全量 6 视口 × 26 屏：热区 **0**、footer 裁切 **0**（口径：5 真实横屏视口；旋转伪横屏视口为「请横屏游玩」指引层、无 .scene-modal 目标，且 rect 变换后错轴，断言在该视口不适用，已在工具注释登记）、字号 offenders 手机三视口 **0**（仅 tablet/wide hero 残留，大屏门槛态同 §十·B 口径）；目视：dynasty 钉底修复、cycle 宽高接管后 footer 仍单行钉底、ranking/petAtlas/followerAtlas/meta 网格屏无回归。

### CodeReview 二轮整改（复审 2a4d460，2026-09-28，本提交收口）

二轮复审：0 阻断、3 设计风险、3 债务，逐条实证后处置：

| 发现 | 实证 | 处置 |
|---|---|---|
| 风险1 注释把非生效层当真源（92%/15179 又错） | 属实：工作区 style.css V9.46b 层（(0,2,1)+!important）压过 v325（(0,2,0)），生效值是 padding 6px 10px / max-height 96%；且行号随用户并行改动漂移 | 注释改为机制性指向，不再引用数值/行号（本表 R-1 行同步订正）；登记事实：泛用 .scene-modal flex 列基调一直在 style.css，本文件 scoped 块只钉 5 弹窗行为 |
| 风险2 footer 断言「未执行」可被洗成假绿灯 | 属实：CDP 异常时 result.value=undefined → \|\|'[]' 静默计 0；门禁非 ENOENT 只 WARN 仍走 PASS | 工具：检查 exceptionDetails/类型，未执行即记 ASSERT not-executed 违规（入退出码）；门禁：footer_summary 非 ENOENT（不可读/结构异常）一律 exit 1，仅文件不存在（旧工具）向后兼容计 0 |
| 风险3 旋转视口 footer=0 是虚 0（rect 错轴） | 属实：变换后坐标 y 轴判据失效；但当前旋转态为指引层、无 .scene-modal 目标，实际不致漏报 | 复测口径改述为「5 真实横屏视口」；断言输出加 rotated 标记 + 工具注释登记「若旋转态未来可达需改 offsetTop 体系」；删除旋转态专属覆写的做法经复审确认安全（旋转态同时挂 short-landscape） |
| 债务4 `?v=173` 计号会撞 A3 唯一/卡 A5 上限 | 属实：`_verify_asset_version.js` A3 全局唯一、A5 max≤资源数+64 | D-4 落点改为「取空号且 >172 且 ≤235（候选 176–180/199–200/205–208/220–221，建议 176）」，Task 7 按此执行 |
| 债务5 断言取「最后直接子」遇隐藏角标会整窗跳过 | 属实 | 改为倒序取最后一个【可见】button |
| 债务6 非法端口回落 9222 仍会与门禁抢 profile | 属实 | 改为非法值直接报错 exit 1（不回落） |
| 债务：覆盖面确认 | 部分完成：monuments/meta 已抽查为直接子 ✅；ranking/ash/follower/劫印四屏留待 Task 6 逐屏 grep 确认（已入 Task 6 前提清单） | 已闭合（Task 6）：monuments/ranking/ash/meta 四屏经 `FOOTER_EXPR` 全 6 视口实测 clipped=0，且目视确认 footer 完整钉底；follower 收起钮设定在同一滚动体内随滚（设计意图，非裁切）；劫印详情为 bag dock 页签、无独立弹窗→ 无适用目标；本行从“待确认”升为“已验” |

## 十·D、Task 6 图鉴收藏系屏重排与 L-P3-01 真因收口（2026-09-28）

### 范围与前提

P4 批3 共 14 屏 + buyout：ach / collection / rubbing / meta / compliance / yezanglu / cycle / monuments / ranking / dynasty / ash / changan / petAtlas / followerAtlas。逐屏目视基准视口 `phone-landscape-844x390` 实拍全部复核（产物 `scripts/_audit_shots/*__<screen>.9224.png`）。

### L-P3-01 定性反转：从“资产损坏”到“继承定位”

三步取证链（基线初判错误，已公开改判）：

1. **推翻“图缺失/字体 fallback”**：`_probe_t6_webp.js` 实测 `img/kenney/icon_cross.webp`（168B，RIFF/WEBP 头合法）在页内解码 OK 18×18，所引截图里那个“⊠”是一个**有效图标**，不是损坏占位。
2. **推翻“flex 换行悬挂”误诊**：先按“图标掉到第二行”加了 `white-space:nowrap` + `flex-wrap:nowrap`，探针确认 `flexWrap` 已变 `nowrap` 但残影**仍在** → 说明不是流内换行。该误修已**全量回退**（不留无效代码）。
3. **坐实真因**：`_probe_t6_mono.js` 读 computed style 发现 `::after` 是 `position:absolute`。泛用装饰规则只覆写 content/尺寸/背景，未覆写定位，于是 `.opt-btn` 系关闭钮继承 `body .opt-btn::after`（一条 `top:0;left:0;right:0;height:1px` 的顶部高光线）的定位与偏移，14px 图标被钉在按钮左上角、一半溢到框外。`.ach-book-close` 等非 `.opt-btn` 文本钮无此继承，所以 cycle「离 开 轮 回 殿 ⊠」一直是正常的——这个差异正是定位真因的反证。

修复：装饰规则显式 `position:static` + `top/right/bottom/left:auto` 复位；并对本体即「✕」的 `.modal-close` 加 `:not()` 排除（避免双图标）。owner 在 `css/style.css`。

⚠️ **CodeReview 二轮改判（拆 a/b）**：上述因果链只覆盖症状 b（`.opt-btn` 系左上角残影）；settings 屏「下方小图标」是症状 a——settings 关闭钮为 `.modal-close`（plate 内无 `.opt-btn`，`js/ui/ui_modals_1.js` 结构坐实），“继承 absolute”不可达；其真修是 `:not(.modal-close)` 消除双图标换行（✕18+6+14≈38px > 钮宽 30px、无 overflow:hidden → 挤第二行）。两处修复各命中各自症状、均已实拍验收，仅归因订正、代码不动。详见 §十 附表 L-P3-01 行与 §十·E。

### L-P3-02（本轮新增并修复）

同一轮目视发现：短横屏下 `.opt-btn` 标签与左侧「◆」装饰重叠。根因是 `mobile-landscape.css` 两条 `html.ndx-short-landscape .opt-btn` 把基座四值 padding 简写成两值，抹掉了为 `::before`（`left:12px`、12px 宽）预留的 `padding-left:34px` 左沟。⚠️ 二轮改判：原写“两条规则还互为死码”不实——特异性核算是前一条所在整块（含 min-height:44px）被后方同特异性触控优化块单向压制，属死码，二轮已删除，见 §十·E 阻断3。修复：左值恒守 34px 并注释登记耦合。该修复同时改善事件选项卡（同样走 `.opt-btn`）。

### 工具口径修正：采样前等入场动画收敛

全量重跑首次出现 `momentum BUTTON.modal-close 35×35`。`_probe_t6_close.js` 对照实测：同一按钮在置位后瞬态为 **35.28**、静止态为 **36**，而宿主 `.modal-plate` 的 `scene-in` 缩放末帧为 .98（760.5/776.0 与 470.4/480.0 两组宽度比值互证）——即 `Math.floor(36×0.98)=35` 的**时序假阳性**，与 §十·B 登记的 collection 关闭钮 ~35px（L-P2-06）同一机制第二次跨屏复现。

按“假阳性即缺陷”处理，不采用“人工判断跳过”：`_tool_landscape_cdp.js` 新增 `SETTLE_EXPR`，在每屏热区/footer/字号采样前 `awaitPromise` 等有限次动画结束（无限循环动效不参与，2.5s 超时 + 40 轮迭代双保险；未收敛/未执行则输出告警）。

**重要修正（二轮再次改判）**：上一轮全量跑登记的“5 处大屏/旋转视口边缘违规（含 1 处 rotated 假阳性）”在本轮收敛后**全部归零**——⚠️ 二轮坐实：初版 5 处明细仅存于上一轮会话控制台输出、未归档，无逐条来源；本轮能实证的是：① collection/momentum 两例已坐实为入场动画瞬态同机制；② 本轮收敛后全量 6 视口复测热区为 0（含大屏/旋转档）。因此那 5 处**推定为瞬态采样**而非逐条坐实；二轮改用确定性布局盒口径（§四.2 改判 + §十·E 风险6）后该整类时序问题从机制上消除，复测数据见 §十·E；§十·C 中相应描述以本段为准。

### 门禁假绿灯堆叠：端口后缀不同源 + “退 0 却无产物”洗成 SKIP

本轮跑 `NDX_CDP_PORT=9224 node scripts/_verify_landscape_hotzone.js` 实测得到 `HOTZONE SKIP (browser unavailable)` + **exit 0**——并非浏览器问题，而是门禁硬编码读无后缀的 `hotzone_summary.json`，工具却写 `.9224.json`：读不到→走 SKIP→计通过。即 Task 5 做的“产物按端口隔离”只做了工具一半，门禁另一半没跟，形同默认失效。

两处修复（`scripts/_verify_landscape_hotzone.js`）：

1. **后缀与工具同源**：按 `NDX_CDP_PORT` 推导 `PORT_SUFFIX`（非法值直接 exit 1，与工具同口径），清理/读取均用带后缀文件名。
2. **SKIP 收窄为真环境问题**：新增分支——工具 exit 0、无 signal、无 error、无 envBad 特征却未产出汇总 → 判为工具/口径 bug，`HOTZONE ERROR … 不得计通过` + exit 1；仅 stderr 命中浏览器环境特征才保留 SKIP 退 0。

验收证据（双口径）：

- 正向：`NDX_CDP_PORT=9224 node scripts/_verify_landscape_hotzone.js` → `HOTZONE PASS (violations=0, footerClips=0)`，exit 0（不再走 SKIP）。
- **负向（stub 工具只打日志就退 0、不产文件）**：退出码 1 且 stdout 命中新分支文案。首版负向脚本本身有缺陷（补丁把路径插入时丢了引号→ SyntaxError 假“成功”），已当场发现并修正为“退出码 + 文案”双条件判定，避免拿“意外非零”当证据。
- 默认 9222 口径本轮未实跑（避让 CodeBuddy 循环抢 profile）；该路径 `PORT_SUFFIX=''`，与修复前行为逐字等价。

### 复测结果（修复后全量重跑，NDX_CDP_PORT=9224 隔离）

| 口径 | 结果 |
|---|---|
| `--hotzone-only`（基准视口） | 热区 **0** / footer 裁切 **0** / exit **0** |
| 全量 6 视口 × 26 屏 | 热区 **0**（含手机三视口与大屏/旋转档）、footer 裁切 **0**、字号 offenders 手机三视口 **0** |
| 字号残留 | 仅 `tablet-1280x800` hero 6 处 / `wide-desktop-1920x1080` hero 17 处（`.ndx-wide-landscape` 大屏门槛态，与 §十·B 同口径，非本轮手机横屏范围） |
| 动画收敛告警 | 0 条（26×6 全采样点均在 2.5s 内收敛） |
| 目视核验 | 14 屏逐张：settings/compliance ✕ 单图标干净；cycle/monuments/ranking/dynasty/ash/meta/changan/collection/rubbing/yezanglu 文本钮「标签 ⊠」同行内联、◆ 与文字不重叠、footer 完整可见；ach 难簿顶栏钮无异常；petAtlas 网格无回归 |

### 遗留债务（本轮不处理原因与入口）

| 债务 | 不处理原因 | 后续入口 |
|---|---|---|
| ~~L-P2-07 base 屏左下 HUD 叠压~~ **已闭合（2026-09-28 用户裁决「重新设计布局」，见 §十·F）** | — | — |
| `?v=` 未递增 | 与 Task 5 已定决策一致（三端同步发布时统一 bump）；本轮改 style.css / mobile-landscape.css 后 HTTP 口径下需 bump 才破缓存。三轮补口径：`sw.js` 对 `.js/.css` 走 **network-first**（仅预缓存列表含 mobile-landscape.css），SW 不构成额外阻断，残留风险只有 HTTP 强缓存，勿误判为「SW 锁死旧样式」 | Task 7：按 §十·C 二轮表债务4 取空号（候选 176） |
| style.css 混有用户未提交改动 | 同一文件内用户 V9.67 结局图鉴 hunk（L4608）与本轮 L-P3-01 hunk（L7753）共存；不得吸入用户改动 | 本轮提交采用 **hunk 级 staged**（`git apply --cached` 仅应用 L7753 一块，已 `--check` 预验），不用 `git add <file>` |
| 临时探针脚本 | `scripts/_probe_t6_*.js` 与 `.tmp/_split_hunks.js`、`.tmp/_gate_neg_test.js` 为一次性取证探针，按 §五“生成物不提交”处理；本文档中出现的 `_probe_t6_webp/mono/close.js` 与 `_audit_shots/*.png`（该目录已 gitignore）均为**历史证据名**，本地可复跑不可追 commit | 本轮提交前已删除；可复现证据已沉淀到入库产物：`_tool_landscape_cdp.js`（SETTLE_EXPR）+ `_verify_landscape_hotzone.js`（后缀同源 + fail-closed）+ 本表复测数据 |
| `.opt-btn` 静止下限贴红线 36px、零余量（二轮新增） | 触控优化块 `min-height:36px !important` 为全 button 系共用下限，抬至 ≥40px 会改变所有弹窗/面板按钮高度，需全量布局回归，不在本轮收口面 | §十·E 债务表；待专项批次评估抬升与布局预算 |
| style.css L10934 第三处 `.ndx-short-landscape .opt-btn`（padding:7px 12px）（二轮新增） | 特异性 (0,2,0) 无 `!important`，被 mobile-landscape.css 同块 (0,2,1)+`!important` 全程压制，属死规则；且 style.css 现混用户 dirty，不值得本轮吸入去删死码 | §十·E 债务表；待 style.css 双 owner 收敛专项（同 §十·B 债务②）时一并清理 |
| style.css 短横屏 hud-hero 系死码（三轮新增） | L-P2-07 退役后，`html.ndx-short-landscape .map-hud .hud-hero/.hud-portrait/.hud-hero-name`（V9.50 收窄段）与旋转档定位段在短横屏永不起效（抬高条 1195 其余档位仍生效，非死码）；style.css 用户 dirty 不吸入；mobile-landscape.css 同族死块本轮已删 | 同 style.css 双 owner 收敛专项一并清理（§十·G 风险2） |
| 其余档位同因叠压未复测（三轮新增） | 叠压根因（hud-hero 抬高量 vs bagbar 实高）不 scoped；现有 6 视口矩阵无真竖屏档（平板/大屏 chip 仍在），390×844 竖屏只跑过旋转档工具链无法触达 | 专项：补竖屏探针或把抬高量改为随 bar 高联动（需动 style.css，双 owner 收敛时做）（§十·G 风险5） |
| 键盘可操作性全局缺口（三轮新增） | status-mini 补了 `role=button`+`aria-label`（读屏可播报），但全仓无 keydown→click 桥（仅音频解锁 kick），单独加 `tabindex` 会造出「可聚焦不可激活」的半截键盘态，故未加；被退役的 chip 本是原生 `<button>`（可聚焦），该退化属全局键盘支持缺口的局部体现 | 另批专项：全局 `[data-action]` keydown 桥（Enter/Space→click）后统一补 tabindex（§十·G 风险3） |
| `.map-dock` 仍为左下 chip 预留 220px（三轮观察） | style.css 短横屏 `.map-dock{max-width:calc(100% - 220px)}` 左侧预留随 chip 退役成空档；dock 居中无功能影响，且不在本轮 owner 面（style.css dirty） | 同双 owner 收敛专项评估收窄（§十·G 债务5） |

---

## 十·E、Task 6 CodeReview 二轮整改（复审 5b69c21，2026-09-28）

复审返回 3 阻断 + 4 风险 + 5 债务。本节逐条实证核验（不盲从：证真/证伪均留档），属实者整改。

### 逐条判定与处置

| 复审项 | 实证结论 | 处置 |
|---|---|---|
| 阻断1 门禁 envBad 短路洗绿 | **部分属实**：工具 exit 0 但 stderr 命中泛化 ENOENT 仍可被洗成 SKIP；fs 崩溃（exit≠0 + ENOENT 栈）也被误判环境。工具自身浏览器不可达只经由专属文案「无法连接 Edge CDP/无法获取页面目标」（spawn 失败后轮询必命中其一） | `_verify_landscape_hotzone.js`：exit 0 无产物 → **无条件判红不看 stderr**；envBad 收窄为专属文案 + `Error: spawn `（Edge 路径不存在）+ EBUSY/EPERM，剔除泛化 ENOENT |
| 阻断2 热区「零命中≠通过」无覆盖断言 | **属实**：渲染空白屏可以 violations=0 → PASS，门禁无法区分「审过且干净」与「没审到」 | `HOTZONE_EXPR` 返 `{v,n}`（n=视口内可见可点元素数）；summary 屏条目改 `{violations,checked}`；门禁 `checked<1` 或未执行（-1）→ `HOTZONE FAIL (coverage)` exit 1 |
| 阻断3 `.opt-btn` 下限被压到贴线 36px、44px 是死码 | **属实**：L137 与触控优化块同特异性 (0,2,1) 且均 `!important`，源序后者胜 → min-height 生效 36px；padding 同理被 `10px 14px 10px 34px` 覆盖；L136-140 整块死码；「假阳性」结论本身仍成立（静止 36 ≥ 红线 36），但零余量 | 删 `mobile-landscape.css` 死块，注释改机制性指向；文档「静止态≥40px」订正为 36px 贴线；抬 ≥40px 需全量布局回归，另批处理（入债务表） |
| 风险4 L-P3-01 因果链对 settings 不可达 | **属实**：`js/ui/ui_modals_1.js` settings 关闭钮为 `.modal-close`、plate 内无 `.opt-btn`；真修是 `:not(.modal-close)` 消除双图标换行（✕18+6+14≈38px > 钮宽 30px、无 overflow:hidden）。`.opt-btn` 系 position:static 修复对另一症状真实有效（探针 computed + 实拍坐实），两处修复各命中各自症状 | 代码不动；§十 附表 L-P3-01 行改判拆 a/b，§十·D 加改判段 |
| 风险5 「5 处归零」无来源外推 | **部分属实**：初版 5 处明细仅存上轮会话控制台未归档；本轮收敛后全 6 视口复测热区 0 可实证，但逐条对应关系无法复核 | §十·D 措辞降级为「推定瞬态、无逐条来源」；二轮新口径（下行风险6）从机制上消除该类时序问题 |
| 风险6 rect 含 transform + SETTLE 排除无限动画 → 漏报 | **机制属实**：无限脉动元素采样相位随机，可能假阳性也可能漏报（后者更危险） | 热区尺寸判定改**布局盒 `offsetWidth/Height`**（inline/contents 回退 rect；可见/在屏判定仍 rect）；§四.2 红线口径同步改判；SETTLE 保留（防有限动画期布局未定干扰在屏判定） |
| 风险7 L-P2-07 降级理由与 git 事实不符 | **属实**：`git diff HEAD -- css/style.css` 仅 L2108（region-bg 去红框）与 L4605（V9.67）两块 hunk，V9.50 HUD 段不 dirty；原「落在用户在途改动区」理由不成立 | 改判为**设计口径冲突**：V9.50 收窄是同一视口模式下的明示取舍（chip 压窄防底部栏盖末行节点），解叠压方向（放宽 chip / 挪面板）须用户拍板；定方向后在 mobile-landscape.css 内 scoped 收口。已同步附表与债务表 |
| 债务8 style.css L10934 第三处同源 padding 简写 | **属实但不生效**：(0,2,0) 非 `!important` 被全程压制，死规则；L10942 ◆ left:10px 生效但 22px 图标仍在 34px 左沟内，不重叠，仅与文档口径 12px 有差异 | 入债务表，待双 owner 收敛专项；本轮不碰用户 dirty 文件 |
| 债务9 `[data-action*="confirm"/"start"]::before` 同族反压 | **属实、非残影**：与 `.opt-btn::before` 同特异性 (0,1,0) 源序后置，✓/▶ 在**同位**（左沟）替换 ◆；实测涉及 sixdao-confirm/promote-confirm/abandon-confirm/start-opt 族等钮，属沟内图标替换非外溢 | 观察项不入缺陷（若要图标统一口径应归位单一 owner，与 L-P3-02 同机制家族） |
| 债务10 文案溢出无断言 | **属实**：现有热区/footer/字号三口径，无折行/溢出自动化断言 | 另批专项（新增需先治假阳性），不入本轮门禁 |
| 债务11 `?v=` | 与既有决策一致 | Task 7 统一 bump |

### 二轮代码落点

- `scripts/_tool_landscape_cdp.js`：`HOTZONE_EXPR` 布局盒口径 + checked；解析失败/未执行记 `checked=-1`；summary 新结构 `{violations,checked}`（旧数组结构兜底兼容）。
- `scripts/_verify_landscape_hotzone.js`：exit 0 无条件判红；envBad 收窄；零覆盖/断言未执行屏 → `FAIL (coverage)` exit 1；新旧 schema 兼容读取。
- `css/mobile-landscape.css`：删 L136-140 死块，`.opt-btn` 横屏定义收敛到唯一落点，注释机制化。
- 本档：§四.2 红线口径改判；附表 L-P3-01 拆 a/b、L-P3-02 与 L-P2-07 改判；§十·B/·D 措辞订正；债务表新增三行。

### 二轮复测（新口径，NDX_CDP_PORT=9224 隔离）

- 语法：`node --check` 两脚本通过；`hotzone_summary` 消费方仅门禁一处（grep 核实），新 schema 无其它破面。
- 门禁正向（`--hotzone-only` 基准视口）：`HOTZONE PASS (violations=0, footerClips=0, coverage ok)` exit 0；26 屏 `checked` 全部 ≥1（最低 3）。
- 门禁负向①（既有 stub：exit 0 无产物）：exit 1 命中判红分支（回归不破）。
- **门禁负向②（本轮新增，针对阻断1）**：stub exit 0 且 stderr 打 `Error: ENOENT…` → 仍判红未走 SKIP（旧版会被洗成 SKIP exit 0，新分支实测堵住）。
- 全量 6 视口 × 26 屏（新布局盒口径，156 截图重生成）：热区违规 **全 6 视口 0**（含大屏/旋转档——上轮「推定瞬态」的 5 处在确定性口径下坐实为非真实违规）、footer 裁切 **0**、零覆盖屏 **0**；字号 offenders 手机三视口 **0**（仅 tablet hero 6 / wide hero 17，大屏门槛态同 §十·B 口径不变）。
- 覆盖度合理性：低 checked 屏为收藏系空态（collection/rubbing/monuments/dynasty 5、petAtlas/followerAtlas 4）与 buyout 门禁页（3），均为真实内容量而非渲染空白。
- 告警面：个别屏（base/hero）报「2.5s 后仍有有限动画在跑」（长 finite 动画）——新口径下尺寸判定已免疫 transform，告警仅提示在屏判定可能含布局未定期，不构成假阳性来源（本轮全 0 佐证）。
- 目视抽查（新截图）：monuments「◆ 返 回 ⊠」同行干净、settings ✕ 单图标无悬挂；左下 HUD 叠压（L-P2-07）实拍仍在、维持待裁决登记（→ 已由 §十·F 收口）。

---

## 十·F、L-P2-07 重设计：短横屏退役 hud-hero 悬浮 chip（2026-09-28，用户裁决「重新设计布局」）

### 几何取证（一次性探针 `.tmp/_probe_hud_layout.js`，844×390 base 屏）

- `.hud-hero`：rect x17 y246 w65 h67（bottom 锚 66px，scale .9，max-width 72px）；
- `#bagbar`：absolute bottom:0、max-height 34%，实高 126px（top=253）；
- **叠压量 60px**（chip 底 313 vs bar 顶 253），chip（z20）压在 `.status-mini`（x25 y262 w293 h91）上；英雄名「取经人」在≈11px 内宽里折成 3 行竖排，与状态面板「圣人」称号字符交错。

### 重设计决策

两个候选里选后者：
- ✗ 抬高/放宽 chip：chip 与 `status-mini` 信息本就全量重复（头像/名/HP），保留重复元素只换个位置，且放宽会回归 V9.50 要防的「chip 压首尾列节点」问题；
- ✓ **短横屏退役 chip，信息并入底部栏**：`status-mini` 自带 `data-action="show-hero-detail"` 点击入口（`js/ui/ui_map.js` 渲染）。⚠️ 三轮改判原表述「与 hud-bag 完全同构、漏收的另一只」：既有设计对两只 chip 处置**不同**（style.css 相邻两行：`.hud-bag{display:none}` 退役、`.hud-hero{bottom:66px}` 抬高保留），本轮是**经用户裁决推翻抬高保留决策**改走退役口径，不是吸收漏收。

实现：`css/mobile-landscape.css` 新增 `html.ndx-short-landscape .map-hud .hud-hero { display:none !important; }`（含决策注释）；仅 scoped 短横屏，其余档位保留悬浮 chip——⚠️ 三轮订正：叠压根因规则（抬高量/栏高）不 scoped，其余档位（平板/大屏/竖屏）是否同因叠压**未复测**（现有视口矩阵无真竖屏档），已登记待测债务；不触碰 style.css（用户在途 dirty）。

### 验收

- 探针复验：hud-hero rect 全 0（退役生效），bagbar/status-mini/ledger 几何逐字不变。⚠️ 三轮限定：「无连带位移」仅指 **bagbar 内元素**；`_mapGeom` 的 botSafe 输入随 chip 隐藏变化（原 chip 顶比 bar 顶高≈7px，退役后预留改由 bagbar 主导，方向安全），地图节点未采证，登记 §十·G 债务1；探针 JSON 未落盘，实际证据源为 `phone-landscape-844x390__base.9224.png` 实拍；
- 门禁 `--hotzone-only`（9224）：`HOTZONE PASS (violations=0, footerClips=0, coverage ok)`——chip 退役未引入新违规/零覆盖屏；
- 全量 6 视口重生成 + base/settings/compliance 目视：左下不再有竖排名与面板交错；
- 全量 6 视口 × 26 屏（156 截图，NDX_CDP_PORT=9224）：热区 **0**、零覆盖屏 **0**、footer 裁切 **0**；字号 offenders 手机三视口 **0**（仅 tablet hero 6 / wide hero 17 大屏门槛态，口径不变）；
- 目视实拍（新）：`phone-landscape-844x390__base/settings` 左下均为单列干净状态面板（头像+取经人+HP/寿数+攻·原·善·恶+本命+一生账本），无悬浮 chip 叠压、无竖排折行。（订正：status-nums 实渲染为攻/原/善/恶四项，无「防」，`ui_map.js` 取证坐实）

---

## 十·G、L-P2-07 重设计的 CodeReview 三轮复审与整改（2026-09-28，复审对象 235d181）

CodeReview 返回 **0 阻断 + 5 风险 + 6 债务**，逐条实证核验后处置如下（本轮另自发现复审漏报的 1 处真实断裂）：

| 条目 | 核验判定 | 处置 |
|---|---|---|
| 风险1 新注释耦合一次性探针数值（y246–313/top=253/60px/72px/34%/66px），违反本文件 L117-119 已明文「数字与行号不耦合」纪律，且 34%/66px 住在用户并行改动的 style.css 必漂移 | **属实** | 注释重写为机制性指向（根因＝抬高量小于栏实高；数值故意不写死）；§十·F 几何取证段保留探针快照但标注单视口值 |
| 风险2 display:none 使同文件 L69-85 四块（hud-hero padding/hud-portrait/hud-hero-name/hud-hp）与 style.css 短横屏 hud-hero 系成死码；与二轮「同文件死块=阻断3」口径不一致 | **属实（同文件部分）** | 删 mobile-landscape.css L68-85 死块，退役规则成唯一落点；style.css 侧死码登记债务（用户 dirty 不吸入，归双 owner 收敛专项） |
| 风险3 唯一入口由原生 `<button>`（chip）降级为无语义 `<div>`（status-mini），读屏不可达；建议 role+tabindex+aria-label | **机制属实，修法半截**：grep 坐实全仓无 keydown→click 桥（keydown 仅 sound.js/音频解锁 kick），加 `tabindex="0"` 会造出「可聚焦不可激活」半截键盘态 | 采纳 `role="button"`+`aria-label="查看英雄完整属性"`（`ui_map.js`）；**拒绝 tabindex**，登记「全局 [data-action] keydown 桥后再统一补」债务 |
| 风险4 文档/注释「与 hud-bag 完全同构、漏收的另一只」与 style.css 相邻两行（一只退役一只抬高保留）互斥，且与 §十·E 风险7「解叠压须用户拍板」自判矛盾 | **属实**：L1194/1195 确实是不同处置；本轮真实语义是推翻抬高保留决策 | §十·F 决策段/实现段、附表行、CSS 注释三处改判为「经用户裁决推翻抬高保留决策改走退役口径」 |
| 风险5 「桌面竖屏无叠压」未取证：VIEWPORTS 无真竖屏档，且叠压根因规则（抬高量/栏高）不 scoped | **属实** | 措辞降级为「其余档位未复测」，登记待测债务（补竖屏探针或抬高量随栏高联动） |
| **本轮自发现（复审漏报）**：chip 隐藏断裂心魔立绘变暗反馈——`ui_core.js` L46 `querySelector('.hud-portrait')` 是 RiskVisual 唯一目标（复审 grep 只查了 hud-hero 未覆盖 hud-portrait 子元素消费者） | **属实且为本轮改动直接引发的真实回归**：探针坐实 chip 隐藏后 filter 无可见落点；`.status-hint` 双端隐藏，交互/反馈双降级 | `ui_core.js` 改可见性感知回退：`.hud-portrait` 有 offsetParent 用之，否则落 `.status-mini .hero-portrait-sm`（运行时验证见下方复测） |
| 债务1 「无连带位移」未覆盖 `_mapGeom` botSafe 输入（chip 顶原比 bar 顶高≈7px，退役后预留改由 bagbar 主导，方向安全但地图节点未采） | 属实 | 验收措辞限定为「bagbar 内元素」；如需闭环探针加采地图节点 |
| 债务2 证据产物时间戳早于 CSS 最后写入（10:47 截图 vs 10:54 写入，实质规则已生效但字节级溯源缺口） | 属实 | 本轮整改后全量重跑对齐（见复测） |
| 债务3 「探针复验 rect 全 0」无归档输出 | 属实 | §十·F 证据源改指 `__base.9224.png` 实拍；本轮起新探针输出随控制台留档 |
| 债务4 注释/文档「攻防善恶」与代码不符（实渲染攻/原/善/恶，无「防」） | **属实**（`ui_map.js` status-nums L480-483 取证） | 注释与 §十·F/附表三处订正 |
| 债务5 `.map-dock` 仍为左下 chip 预留 220px（退役后左半空档，无功能影响，不在 owner 面） | 属实 | 观察项入债务表 |
| 债务6 `?v=` 未 bump 但 SW 预缓存列表含本 CSS | **部分属实**：sw.js 对 .js/.css 走 network-first，SW 不构成额外阻断，仅 HTTP 强缓存风险 | 债务行补口径，防后续误判 |
| 复审确认无问题项 | `.hud-hero` 无其它 JS 消费者；`_mapGeom._vis` 天然跳过 display:none（阻断方向证伪）；show-hero-detail 经 onAppClick 尾部 doRender 与 open-hero 等效；提交规范（单一 hunk、无混入、未吸用户 dirty） | 无需处理（其中 _mapGeom 结论经债务1 细化：botSafe 输入确有微小变化但方向安全） |

### 三轮复测（NDX_CDP_PORT=9224 隔离，整改后）

- 语法：`node --check js/ui/ui_core.js js/ui/ui_map.js` 通过。
- 门禁 `--hotzone-only`：`HOTZONE PASS (violations=0, footerClips=0, coverage ok)` exit 0。
- 一次性运行时探针（`.tmp/_probe_r3.js`，全新 profile，844×390 base）：`.hud-hero` computed display=none（退役回归）；`.status-mini` 带 `role=button`+aria-label（新模板已加载）；置 xinmo=80 走真实 `NDX.bus.emit('render')` 链路 → `brightness(0.6) saturate(0.72)` 落在 `.status-mini .hero-portrait-sm`、隐藏 chip 无 filter——RiskVisual 回退链路坐实 PASS。
- 全量 6 视口 × 26 屏重生成（156 截图，时间戳已对齐）：热区 **0**、footer 裁切 **0**、零覆盖 **0**；字号仅 tablet hero 6 / wide hero 17 大屏门槛态（与 §十·F 基线一致，无回归）。
- 代码落点：`css/mobile-landscape.css`（删死块+注释重写）、`js/ui/ui_core.js`（RiskVisual 回退）、`js/ui/ui_map.js`（role/aria）；`?v=` 仍按债务表归 Task 7 统一 bump（本轮触了 js，Task 7 执行前 HTTP 验收需硬刷新绕缓存）。

---

## 十一、Task 7（P5 收口）：?v= 统一 bump + 三端同步核查（2026-09-28）

### ?v= 统一 bump（原债务 4，候选 176 已失效）

- 现状取证：`index.html` 正被用户在途批量重编号（56 行未提交 `?v=` 改动，style.css→208、ui_changan→222，工作树最高号已至 235）；文档旧候选 176 已被占用作废。
- 本案触碰且用户未 bump 的仅三行（均不在用户 56 行改动集内）：`mobile-landscape.css 172→190`、`ui_core.js 136→191`、`ui_map.js 138→193`；取号约束：工作树+HEAD 双集合唯一、≤A5 上限 235（资源数 171+64）；style.css 本案件 hunk 已被用户 bump 至 208 覆盖，不重复动；`scripts/_*.js` 不被 index.html 加载，无需 ?v=；sw.js 预缓存引用不带查询串，零联动。
- ⚠️ **提交状态：三行 bump 已落在工作树，尚未 commit**——`index.html` 是用户正在编辑的文件（编辑器未保存缓冲区可能整体覆盖本轮次），hunk 级提交前需用户确认时机（宪法 §十五）。
- 门禁盘点：`_verify_asset_version.js` 当前 **A3 红 = 用户在途 v234 撞号**（js/combat_part1.js vs js/balance_db.js），非本案引入、不代改；A5/A6 对本案取号 ok。

### 三端同步核查

- 本分支全量触面（merge-base..HEAD）仅：`css/mobile-landscape.css`、`css/style.css`、`js/ui/ui_core.js`、`js/ui/ui_map.js` + 取证工具脚本 + 本文档；**未触 `platform/` 适配层、未改脚本加载结构** → 三端（浏览器 H5 / 微信 web-view / TapTap）共享同一套核心，自然同步，无污染。
- `taptap_bundle/`：经 `git check-ignore` 坐列为 ignored 本地生成物（独立版本号体系），按 §五「生成物只读不手改」，发布时跑 `scripts/_taptap_bundle.js` 重生成即可，不手动同步。
- 微信内测 DOM 版（`wechat-wv/`，仓外）：web-view 直连 demo 本体 HTTP，无副本，零漂移面。
- ⚠️ 虚假基线再订正：AGENTS.md 验收表所列 `node demo/scripts/platform_test.js`（「41 项通过」）经 `git log --all` + Glob 核实**从未存在于本仓**（同 regression.js 先例）；三端宿主兼容替代证据：`_verify_storage_platform_bridge.js`（16/16）+ `_verify_taptap_shim.js`（15/15）+ `_verify_sw_single.js`（7/7）全绿。
- 全量门禁 `_run_all_gates.js`：109 脚本 108 绿；唯一常驻红 = 上述用户在途 A3 撞号；另 `_verify_final_damage.js` 批内偶发红（F20 编队战随机波动 ±0.988 贴阈），单跑 3/3 exit 0，归用户在途数值改动面，非本案引入。

### 最终验收数据（整改后全量）

- 热区门禁：`HOTZONE PASS (violations=0, footerClips=0, coverage ok)`；全量 6 视口 × 26 屏：热区/footer/零覆盖全 **0**，字号仅大屏门槛态（与基线一致）。
- 运行时探针：chip 退役/aria/RiskVisual 回退三断言 PASS（§十·G）。
- 待用户侧收口：① `index.html` 三行 bump 的 commit 时机确认；② 用户在途 v234 撞号自行消化（A3 转绿）；③ 真机（实体手机横屏）目视验收为发布前最后门禁，需用户实拍反馈。



