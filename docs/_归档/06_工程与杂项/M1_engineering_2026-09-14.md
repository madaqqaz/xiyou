# 《逆道西行》M1 正式打磨 · 工程报告（性能剖析 + 桌面横屏门槛）

> 日期：2026-09-14
> 范围：`D:\xiyou\demo` 浏览器 H5 主线（三端共享核心，零构建零依赖，`platform/` 适配层隔离）
> 性质：**本轮只读 + 度量 + 方案分析**。未修改任何 `js/`、`css/`、或 `index.html`（符合 AGENTS.md 宪法：改 js/css 才需递增 `?v=`，本轮不涉及）。
> 负责人：engineering-lead-1

---

## 一、项目体积度量（实际命令与输出）

### 1.1 HEAD 树（版本库跟踪体积）
```bash
cd D:/xiyou/demo
git ls-tree -r -l HEAD | awk '{s+=$4; n++} END {printf "HEAD_TREE_BYTES=%d (%.1f MB) BLOBS=%d\n", s, s/1048576, n}'
# → HEAD_TREE_BYTES=55740270 (53.2 MB)  BLOBS=1222
git ls-files | wc -l   # → 1222
```
> 与项目已知基线（~53.1MB / 1221 文件）吻合。

### 1.2 `js/`、`css/`、`img/` 分项
```bash
# js/
for f in js/*.js; do lines=$(wc -l < "$f"); total=$((total+lines)); done
# JS_FILE_COUNT=94   JS_TOTAL_LINES=32140   js_total_bytes=3526069 (3.4 MB)

# css/
wc -c css/style.css     # 773300 字节 (755 KB, 21818 行)
wc -c css/mobile-landscape.css  # 7641 字节
du -cb css/*.woff2 | tail -1   # 2477496 字节 (4 字体, 2.48 MB)
grep -o "{" css/style.css | wc -l  # 5930 (CSS 规则块粗计)

# img/
find img -type f \( -name '*.webp' -o -name '*.png' ... \) | sed 's/.*\.//' | sort | uniq -c
#   890 webp   13 png   (共 903 文件)
du -sb img   # 25858091 字节 (25.86 MB)

# 其它
du -sb platform audio assets   # 24KB / 2.43MB / 8.42MB
```

### 1.3 首屏关键路径（无 gzip，`file://` 双击场景）
- HTML ~30KB + `style.css` **755KB**（index.html:12 链接的是未压缩版 `?v=528`，非 `style.min.css` 570KB）+ 4×woff2 **2.48MB** + 首屏 bg webp + 关键 JS。
- `img/` 总量 25.86MB，但多为 `<img>` 立绘/精灵，经 webp 探测（index.html:133-180）按需加载，非首屏全量。
- 最大单图：PWA `icon-1024.png` 238KB（离线用，非游戏路径）、敌/英雄立绘 ~70KB/webp。

---

## 二、性能热点定位（读代码确认，非推测）

### 热点 1 —— 地图整屏重渲重建 `#app.innerHTML`（**Top1**）
- 证据：`js/ui/ui_core.js` 的 `render()` 在多处直接赋值 `app.innerHTML`：
  - 起始/轮道/死亡屏：`168 / 172 / 193 / 196`
  - 地图主屏模板：`247-266`（含完整 `#mapArea` 节点图、`#bagbar`、HUD、面板）
- 机制：每次状态变化（点节点 / 开面板 / 进区域）都 teardown 整棵 `#app` 子树 → 重新解析大 HTML 字符串 → restyle + relayout + repaint。
- DOM 规模（静态估算，见 2.4 说明）：地图节点 `ui_map.js:104-310` 按 `LAYER_COUNT × MAX_COL` 生成 `.cell`（每 cell 含 `.nlabel`/`.ico`/可选 `.route-tag`/`.yield-tag` = 3-5 子节点）+ SVG `<path>` 连线（~每层×列×扇出）。本地单章 ~9层×4列≈36 cell + ~70 path + HUD/bagbar/panel ≈ **300-400 节点**；全局出关 81 层可达 **~1500-2000 节点**。
- 连带症状（根因同一）：`$cache(id)`（`ui_core.js:6-19`）的 `isConnected` 校验是**补丁**——地图重渲后 `#mapBgLayer` 被游离，旧 `_domCache` 指向死节点 → `_applyActBg` 把地区大图 append 进死节点，真实 `#mapBgLayer` 永远为空。若只修表象而不改整段 innerHTML 重建，问题会换处复发。

### 热点 2 —— CSS 体积与 `url()` 背景图（**Top2**）
- `style.css` 755KB / ~5930 规则块 → CSSOM 解析 + 样式重算（style recalc）成本高，且零打包、零 gzip（`file://` 场景）。
- `url()` 背景图共 **94 处，0 个 data-uri，全部外部 webp/kenney**（`grep -o "url(" css/style.css`）。CSS 背景图仅在选择器命中渲染元素时才请求，但地图/战斗/起始屏多规则命中（如 `bg_battle_default.webp`×4、`bg_event.webp`×4、`barBack_*.webp`×3 等），且无显式管控/懒挂。

### 热点 3 —— Service Worker `controllerchange → reload` 死循环风险（**Top3**）
- 证据：`index.html` **两处注册**：`./sw.js`（scope `./`，428-470）与 `/sw.js?v=1`（477-499，URL 带查询串 → 每次视为新注册）。
- `sw.js:63` `self.skipWaiting()` + `sw.js:87` `self.clients.claim()` → 新 SW 激活翻转 `navigator.serviceWorker.controller` → `index.html:460-466` 的 `controllerchange` 监听 → `setTimeout(location.reload, 1000)`。
- 风险：无头/每次新 context 下可反复 reload；真机表现为**每次部署必触发一次整页 reload**（SW 脚本 URL 带 `?v=` 缓存破环是反模式，版本应靠 `CACHE_VERSION` 常量控制）。
- 缓解（项目已有）：审计脚本 `docs/_audit_2026-09-14/verify_flow.js`、`shot_matrix.js`、`walk_screens.js` 用 `page.route('**/sw.js*', abort)` 旁路 SW 以避免测量被 reload 干扰。

### 2.4 DOM 节点规模说明（诚实标注）
- 本环境**未安装 Chromium**（`$HOME/.cache/ms-playwright` 不存在，PATH 无 chrome；仅 `playwright-core` 库在，无浏览器二进制），故**未跑无头 Chrome 实时计数**（任务允许的 `dangerouslyDisableSandbox` 路径需先有浏览器，下载属越界）。
- 上述地图节点数为**基于 `ui_map.js` 生成逻辑的静态估算**。实时计数方法（供团队后续执行）：
  ```bash
  # 需先安装 chromium：npx playwright install chromium
  # 再用项目既有审计脚本（已内置探针）：
  #   docs/_audit_2026-09-14/shot_matrix.js  或
  #   docs/_audit_2026-09-14/walk_screens.js
  # 关键探针：document.querySelectorAll('#app *').length
  ```

---

## 三、可量化优化建议（按优先级）

| 优先级 | 项 | 建议 | 预期收益 |
|---|---|---|---|
| **P0** | 地图 DOM 复用 | `render()` 改为**增量更新**：节点态用 class 切换、面板用 `replaceChildren` 局部替换，**不重建整段 `#app.innerHTML`**；或引入节点复用池（cell 池）。 | 消除每次交互的整树 teardown+reparse+relayout，首战/地图交互帧时间显著下降 |
| **P0** | 字体 | 已 `font-display: swap`（style.css:82-101，5 个 @font-face 均 swap）——保持。2.48MB 字体不阻塞首屏文本 ✔ | — |
| **P1** | CSS 体积 | 上线改用 `style.min.css`（570KB，省 185KB/24%）；或保留未压缩版但做 gzip。把 94 处背景图按屏拆分/懒挂（首屏不命中的规则 url 后置）。 | 首屏 CSS 传输 -24%；首屏外背景图不抢带宽 |
| **P1** | 图片 | 非首屏 `<img>`（立绘/精灵，ui_misc）加 `loading="lazy"` + `decoding="async"`；PWA png 图标（238KB）离线不必首屏。 | 降低首屏图片请求数与解码峰值 |
| **P1** | SW | 删除重复注册 `/sw.js?v=1`；SW 脚本 URL **不带 `?v=`**（版本靠 `CACHE_VERSION`）；`controllerchange` 幂等，仅在生产版本变更时 reload 一次。 | 消除每次部署强制整页 reload；关闭无头 reload 死循环 |
| **P2** | 分包 | js 94 文件/3.4MB 零打包 → `file://` 下 94 次读取、HTTP/1.1 下 94 请求（队头阻塞）。把 `data_*.js` 合并为 1-2 个数据 bundle（仍零依赖），或按进入时机 defer eval（战斗/事件数据进战斗时再载入）。 | 减少请求数 / 解析期内存峰值 |

---

## 四、桌面横屏门槛 A/B/C 方案（**只分析，不实现，待拍板**）

### 4.1 现状（已读代码确认）
- `index.html:84-95` `shortSideLandscape()`：
  ```js
  function shortSideLandscape() {
    if (window.__ndxRotated) return true;          // 旋转伪横屏：一律按横屏
    var shortSide = H;                              // 真横屏短边 = 视口高
    return shortSide <= 1080;
  }
  ```
  即门槛 = **`rotated` OR (真横屏 且 短边≤1080)`**。
- 注释 `index.html:83` 明确「提高门槛到 1080px，确保大多数横屏设备（手机/平板/**桌面窗口**）都能触发横屏适配」——于是 **1440×900（H900≤1080）、1920×1080（H1080≤1080）被误判为 `ndx-short-landscape`**，套用手机横屏布局。
- 前次修复（`docs/手机横屏适配_2026-09-14.md`）删掉 `mobile-landscape.css` 的 `media` 门槛后，该文件也一并上了桌面（根字号 16→13px），**误伤范围扩大**。
- 背景：真横屏由 `ui_core` 按 `innerWidth>=innerHeight*1.18` 加 `body.landscape`；旋转伪横屏（微信 WebView）由 `doFit()`（index.html:49-80）把 `#ndx-lock` `rotate(90deg)`，物理视口仍竖屏。

### 4.2 A / B / C 三方案

#### A — 加触屏判定 `navigator.maxTouchPoints > 0`（**推荐**）
```js
function shortSideLandscape() {
  if (window.__ndxRotated) return true;
  if (navigator.maxTouchPoints <= 0) return false;   // 桌面（无触控）天然排除
  var shortSide = H;
  return shortSide <= 1080;
}
```
- 对真横屏手机（触屏，命中）✓；对旋转伪横屏微信（`__ndxRotated` 优先）✓；对桌面（maxTouchPoints=0）✗ 排除 → 恢复桌面宽屏布局（修复误伤）。
- 与项目既有 `@media (hover:none) and (pointer:coarse)` 口径（style.css:4997/11902/13273）一致，**零新概念**。
- 回归风险：低。仅新增「桌面排除」条件，不动旋转态/真横屏既有路径；少数无触屏的横屏设备（如部分笔电）会回桌面版——可接受。

#### B — 门槛改为「短边≤1080 且 (触屏 或 rotated)」
```js
function shortSideLandscape() {
  if (window.__ndxRotated) return true;
  var touch = navigator.maxTouchPoints > 0;
  if (!(touch || window.__ndxRotated)) return false;
  return H <= 1080;
}
```
- 与 A **逻辑等价**（rotated 已在前置分支命中），只是把触屏/rotated 写成显式 AND，更啰嗦且 rotated 分支重复。**不推荐作为独立方案**。

#### C — 保留但显式排除已知桌面分辨率区间
```js
function isDesktopRes(W,H){ return [[1920,1080],[1440,900],[1366,768],[2560,1440],[1280,800]].some(r=>r[0]===W&&r[1]===H); }
function shortSideLandscape() {
  if (window.__ndxRotated) return true;
  if (H > 1080) return false;
  return !isDesktopRes(W,H);   // 黑名单排除桌面
}
```
- 桌面排除（修复误伤），真横屏手机/旋转态不受影响。
- 回归风险：**中**。分辨率黑名单需持续维护，新分辨率（如 1920×1200 H=1200 已自然排除，但未来超宽/新比例）漏判会复发；且 `H<=1080` 仍会把 1280×800 触屏笔电误判为手机排版——该类本就是触屏设备，影响可控。

### 4.3 推荐与理由
**推荐 A（加 `navigator.maxTouchPoints > 0`）+ 拒绝 B/C 作为主方案**：
1. 语义最贴「手机横屏」本意 = 持握/触屏设备；复用既有 `(hover:none) and (pointer:coarse)` 口径，不引入新判定维度。
2. 回归风险最低：只增一个「桌面排除」条件，旋转态与真横屏路径完全不动；桌面恢复宽屏是**修复**（纠正前次删 media 的副作用），非回归。
3. 免维护分辨率黑名单（C 的脆弱点）。
4. B 与 A 等价却更啰嗦，不单独采纳。

> 注：此方案与 `docs/手机横屏适配_2026-09-14.md` 第四节「待拍板」选项的 B（触屏判定）一致，本次按工程-lead 任务口径重述为 A 并附推荐。

### 4.4 验收入口（给 quality-lead / 真机）—— **必须绑定「已拍板方案」常量**

> ⚠️ **前置说明（QA 对齐修订）**：本矩阵是「拍板且落地**后**」的 **TARGET 态**。
> 当前未改代码前，默认逻辑是 `短边≤1080 或 rotated`（即 `docs/手机横屏适配_2026-09-14.md` 第四节的「A/保守当前」），
> 此时 1440×900（短边 900）与 1920×1080（短边 1080）**仍会被判 `ndx-short-landscape`、根字号 13px**——
> 这正是待修的误伤本身。下面「桌面两条」是修复后的**目标**，故自动化断言**绝不能按当前态硬编码**，必须传入 `已拍板方案` 作为输入常量。
> 命名澄清：本文 A/B/C 取自 **team-lead 任务口径**（A=加 maxTouchPoints）；与旧文档「A=保持短边≤1080」不同——旧文档的「A/当前」是**待替换的默认**，不在本文三方案之内。

**A/B/C 三方案对两个命名桌面的行为完全一致（均排除）：** A=maxTouchPoints>0、B=短边≤1080 且(触屏或rotated)、C=短边≤1080 且排除桌面黑名单 → 三者都让 1920×1080 / 1440×900 **不带 `ndx-short-landscape`、根字号 16px**。
> 若极端情况选「维持现状（不改，即旧文档的 A/当前 = 短边≤1080）」，则两条桌面仍带 `ndx-short-landscape`、根字号 13px（即当前误伤态）——该选择不在本文推荐范围，但 gate 的 `已拍板方案` 常量应预留此分支以避免断言反向失败。

| 视口 | 期望（A/B/C 任一落地后） |
|---|---|
| 桌面 **1920×1080 / 1440×900** | `<html>` 不带 `ndx-short-landscape`；探针按钮 `min-height` 为默认（非 36px 强制）；**根字号 16px** |
| 手机真横屏 **844×390 / 932×430** | `ndx-short-landscape` 存在，最小点击目标 **≥36px** |
| 微信旋转伪横屏 **390×844** | `__ndxRotated=true` → `ndx-short-landscape` 存在，**根字号 13px** |
| 回归 | 起始/地图/战斗三屏在桌面下不再套手机排版（无下溢出 19px、HUD 不贴边） |

**A 与 C 的分叉点（gate 必须区分）**：对「非黑名单、无触控、短边≤1080」的设备（如 **1280×800 笔电**）：
- **A（maxTouchPoints>0）** → 排除 → 桌面布局（正确，无触控设备本就非手机横屏）；
- **C（黑名单）** → 1280×800 不在黑名单 → 命中 → 误套手机排版。
故 Node 决策 gate 须以 `已拍板方案` 为输入，分别断言分支逻辑。

**两层 gate（与 QA 对齐，互补不冲突）：**
1. **纯 Node 决策 gate**（如 `_verify_landscape_threshold.js`）：断言 `applyShortLandscape` / `shortSideLandscape` 的**判定分支逻辑**（A/B/C 各自阈值决策），不依赖渲染。
2. **CDP 真机渲染检查**（复用 `docs/_audit_2026-09-14/shot_matrix.js` 的 10 档视口矩阵 + 探针）：读运行时 `computed min-height`、`document.documentElement` 根字号、`__ndxRotated`——这些**纯 Node 读不到**，必须 `dangerouslyDisableSandbox` 起 Chromium（本机无 Chromium 二进制，需先 `npx playwright install chromium`）或人工实机。
- 可复用 `docs/_audit_2026-09-14/shot_matrix.js` 的 10 档视口矩阵 + 探针按钮 `min-height` 判定。

### 4.5 待用户拍板项
- 选 **A / B / C**（推荐 A）。批准后方可由 engineering-lead 实现：改 `index.html` 内联 `shortSideLandscape()` 并递增 `?v=`。**本轮未改任何代码。**

---

## 五、结论摘要
- **性能 Top3 瓶颈**：① 地图 `render()` 整段重建 `#app.innerHTML`（无 DOM 复用，连带 `$cache` 死节点补丁）；② `style.css` 755KB/5930 规则 + 94 处背景图无管控；③ SW 双注册 + `controllerchange→reload` 死循环风险。
- **桌面横屏**：推荐 **A（加 `maxTouchPoints>0` 排除桌面）**，语义贴「手机横屏」、回归风险最低、免维护黑名单；B 与 A 等价、C 需维护黑名单（风险中）。
- **未执行**：无头 Chrome 实时 DOM 计数（环境无 Chromium 二进制），已给静态估算与复现命令。
- 报告路径：`docs/M1_engineering_2026-09-14.md`。
