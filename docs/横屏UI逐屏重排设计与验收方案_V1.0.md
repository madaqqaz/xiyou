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
| L-P3-01 | P3 | `settings` 屏左上角关闭按钮下方出现疑似渲染损坏的小图标（非热区问题，纯视觉占位符残留） | 待 grep：`.settings-close` 相邻装饰元素 | 初判：确认是否为缺失图片资源/图标字体的 fallback 占位，若是则删除或替换为内联 SVG | `css/mobile-landscape.css` 或 `css/style.css` | `phone-landscape-844x390__settings.png`、`real-landscape-900x420__settings.png` 均可见 |
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
- **全 6 视口全量取证已跑完**（156 截图）：热区 6 视口全 0。初版登记的 collection 关闭按钮 ~35px（L-P2-06）经全量复验为**入场动画时序假阳性**（静止态 ≥ 40px，全 6 视口 hotViol 均 0），改判为非缺陷销账；L-P2-01 跨视口目视复测因该缺陷回退移交 Task 5，本轮不再标为已修。
- **大屏档残留**：`tablet-1280x800`/`wide-desktop-1920x1080` 仍有 9/10px 残留（`.ni-seg`/`tspan` 等），因 `.ndx-short-landscape` 门槛在大屏短边>640px 不命中，属另一门槛态（`.ndx-wide-landscape`），**非本轮手机横屏范围**，待大屏专项处理。

| L-P2-06 | 已销账（非缺陷） | ~~collection 关闭按钮实测 ~35px，贴 36 红线~~ | `BUTTON.opt-btn.ghost[close-modal]`（collection 屏） | 全 6 视口全量复验 hotViol 均 0，静止态 ≥40px；初判为入场动画未停时的时序采样假阳性，非真实热区缺陷，改判销账不入 Task 6 | — | 全量 6 视口 `hotzone_summary.json` collection 屏均空数组 |

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
| R-1 `69vh` 前提失真 | 属实：style.css:15179 v325 终局层已把 overlay padding 覆写为 `2% 12px 3%`、modal `max-height:92%`（% 无 vh 耦合）；真实可用高≈89vh，69vh 过度收紧约 23%；且 `.rub-body` 已被 L15188 置 none，注释「穿透 72vh」不实 | 删除 scoped 块的 `max-height:69vh`、`.lunhui/.rub-overlay` 的 `4vh` padding 覆写与旋转态 `88%/4%` 专属覆写，宽高统一由 style.css 终局层 + VH_TRAP 块接管（同时消除 vh 耦合与 !important 叠加）；根因注释改写为坐实版（footer 落进 `.scene-modal` 自身 overflow 滚动区外）；L106 错误不变量同步订正 |
| R-2 回退泛用时隐式改变全站 scene-modal 口径 | 属实：删 `max-width:90vw` 后回落终局层 `96%`（cp-modal 宽 +50px）；padding 16→14 | 接受回落真源口径不再叠加覆写；按评审要求目视补验 ranking/petAtlas/followerAtlas/meta 四网格屏（`phone-landscape-844x390` 新截图）均无列数变化型热区回归（全量热区 6 视口 0 互证）；本行即显式登记该副作用 |
| R-3 结构判据与 DOM 事实不符 | 属实：monuments/ranking/meta-overview/ash/follower/劫印弹窗同为「标题+body+footer 直接子」结构（尚未复现裁切） | 注释判据改述为事实性（「本轮实拍坐实裁切的才入桶，扩桶前逐屏实拍」）；未复现六屏登记为债务，归 Task 6 用新 footer 断言复测 |
| R-4 热区门禁对裁切结构性盲 | 属实：`HOTZONE_EXPR` 跳过完全出屏元素，「热区 0」不能证明 footer 可见 | 工具新增 `FOOTER_EXPR` 收尾按钮可见性断言（modal 最后直接子 button 的 rect 超视口底/顶或超 modal 可视底缘即 clipped，与热区同轮零额外渲染），产出 `footer_summary<suffix>.json`，`--hotzone-only` 退出码纳入 clipped；门禁 `_verify_landscape_hotzone.js` 同步消费（无文件时计 0 向后兼容）。**断言首跑即拓出基线未登记的 dynasty 屏「合上年表」真裁切**（bottom=886 vs modal 底 376，十朝铺在 modal 直下、footer 落进滚动区）→ 将 `.ach-book-modal`（仅 dynasty 使用）并入 scoped flex 列块（滚动体 `.ach-list`，header/lead 钉住），复验 clipped=0 且截图目视按钮完整钉底 |
| D-1 截图未随端口隔离 | 属实 | 截图文件名同步加 `PORT_SUFFIX` |
| D-2 `NDX_CDP_PORT` 无校验 | 属实：非法值可被门禁 envBad 正则洗成 SKIP 假绿灯 | 加范围校验非法回落 9222 + 告警；用法注释补 env 说明 |
| D-3 VH_TRAP 注释失真 | 属实：自称「置于文件末尾」实际在 L248 | 改为源序契约描述（特异性+后置源序；后续文末 rotated 覆写须在其后）；本轮 scoped 块已无 vh 声明，旋转态专属覆写整块删除 |
| D-4 `?v=` 未递增 | 与既有决策一致 | 仍归 Task 7 收口统一 bump（172→173） |

**整改后复测**：`--hotzone-only`（9224 隔离）热区 **0** / footer 裁切 **0** / exit **0**；全量 6 视口 × 26 屏：热区 **0**、footer 裁切 **0**、字号 offenders 手机三视口 **0**（仅 tablet/wide hero 残留，大屏门槛态同 §十·B 口径）；目视：dynasty 钉底修复、cycle 92% 接管后 footer 仍单行钉底、ranking/petAtlas/followerAtlas/meta 网格屏无回归。


