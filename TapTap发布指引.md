# 《逆道西行》Demo · TapTap 发布指引

> 对应 AGENTS.md §七「三端同步」与 §十一 验收门禁；本文档是 TapTap 买断版端的发布/验收真源，与 `微信小游戏发布指引.md` 并列。核心玩法、数值、UI 布局必须与浏览器 H5 主线保持一致，平台差异只经适配层隔离。

## 当前形态（买断版定位，2026-08-29 勾兑）

* TapTap 买断版与浏览器 H5、微信小游戏**三端共享同一核心代码库**（`demo/js/*.js`、`demo/css/style.css`、`demo/index.html`），平台差异经 `demo/platform/` 适配层隔离（browser / wechat / taptap）。

* 买断版基于 H5 核心 + TapTap SDK：启动时验证**买断状态**，未购买提示购买；**无广告、无内购**（除买断本身）；支持**完全离线游玩**。

* **横屏**：游戏为恒横屏 H5（`game.json` `deviceOrientation=landscape`）。

* 存档走**本地存储**（TapTap 用本地存储，浏览器用 `localStorage`），跨周目承继。

纯前端 HTML5（原生 JavaScript + DOM），零第三方依赖，浏览器双击 `index.html` 即玩。
工程结构（当前真源已不止下述文件，扩展系统见 AGENTS.md §一）：

```
demo/
  index.html        # 入口（脚本按 data→…→game→ui→main 顺序加载，均带 ?v=NN 缓存号）
  css/style.css     # 样式
  js/data.js        # 地图生成 generateMap、怪物、复合节点、罪业贸易、土地神龛等配置
  js/combat.js      # 战斗内核（普攻/诵经/大招/气势·破爆发）
  js/game.js        # 游戏主状态机（纯逻辑）
  js/ui.js          # 渲染与交互面板
  js/main.js        # 入口与事件委托
  serve.ps1         # 本地预览服务器（PowerShell/.NET）；跨设备预览用 _serve.cjs（0.0.0.0:8090）
```

## 为什么用 HTML5

* TapTap 直接支持 **H5 游戏分区**发布，JS 逻辑无需重写即可上线。

* 同一套代码后续可零成本打包为 **安卓 APK** 上架 TapTap 安卓端。

* 符合"简单肉鸽、单人开发"定位，不引入 Unity 等重型引擎。

***

## 方案 A：H5 直发 TapTap（最快）

1. 将 `demo/` 作为静态站点部署（TapTap 开放平台 H5 上传 / 自有静态托管）。
2. 入口 `index.html`，全部资源相对路径，已就绪。
3. 注意：TapTap H5 要求 **HTTPS + 备案域名**；需做移动端适配（视口、触控、字号）。

## 方案 B：安卓 APK（历史备案，已不推荐）

> ⚠ **冲突标注**：下方引擎迁移方案（Cocos/Capacitor/Phaser）与 AGENTS.md §一「不引入前端框架、构建工具、TypeScript 或重型引擎」、§七「三端共享核心代码库」冲突。当前 TapTap 买断版按 **H5 核心 + SDK 适配层** 落地，不迁移引擎。本条仅作历史设计备案保留，不作为实施路线。

* **Cocos Creator（JS 生态）**：新建空白工程，把 `js/` 逻辑迁为组件脚本，一键发布 Android APK → TapTap 安卓包。

* **Capacitor**：`npm init` → 把 `demo` 作为 web 资产 → `npx cap add android` → Android Studio 打包签名。

* **Phaser + Cordova**：同理，Phaser 负责渲染、Cordova 负责原生壳。

***

## 移动端适配清单（发布前必做）

> 状态勾兑日期：2026-08-29，依据当前源码（index.html / js/main.js / js/ui.js / js/storage.js / css/style.css / js/sound.js）。

* [x] `viewport` meta + 禁止双击缩放
  * 已满足：`index.html:5` 含 `maximum-scale=1.0, user-scalable=no, viewport-fit=cover`。

* [x] 触控替代鼠标（加大点按区）
  * 已满足：`main.js` 用 `pointerdown/pointermove/pointerup` 实现拖拽展开敌方详情、长按 450ms 弹法宝；`css/style.css` 含 `touch-action:manipulation`、`-webkit-tap-highlight-color:transparent`、`html,body{overscroll-behavior:none}`。点按区以手指尺寸为主。

* [x] 字号 / 按钮加大，布局
  * 已满足：`css/style.css` 有针对窄屏的多组 `@media (max-width:762/768/720…)` 折叠布局 + `.opt-btn` 等大点按区。

* [x] 本地存档
  * 已满足：`js/storage.js` `NDX.storage`/`NDX.SaveSystem` 统一持久化进度、解锁、成就、舍利塔、设置等；TapTap 买断版走本地存储。

* \[\~] ~~横竖屏策略、退后台暂停~~ 横竖屏=恒横屏

  * 已满足：游戏为横屏 H5（`game.json` landscape）；**退后台暂停已补**（main.js §37 `visibilitychange`/`blur`/`focus` 顺延 QTE/破韧窗口 deadline）。

  * **统一横屏类门控（2026-08-30 落地）**：竖屏设备由 `index.html` 旋转层（`#ndx-lock` 旋 90°）自动切成横屏展示，此时 CSS `@media (orientation: landscape)` 因物理方向仍为竖屏而**不匹配**。为此把 style.css 中 24 个 `orientation: landscape` 媒体查询统一改写为 `.ndx-short-landscape` 类门控（`index.html` 按几何判断 `shortSideLandscape()`：竖屏旋转命中，或真实横屏短显示边 ≤640px 命中，桌面不命中），保证弹窗/战斗/成就/商店等所有界面在旋转伪横屏与真实横屏下样式一致。已用 CDP 三视口（420×900 / 900×420 / 1280×800）验证类命中与弹窗不溢出。

* [x] 音效与美术
  * 已满足（清单文本"ASCII/文本"为早期遗留、已过时）：`js/sound.js` Web Audio 合成音效已完成；美术已用 `img/portraits/` 六子目录立绘 + 长安城/战斗/场景背景图替换。

**2026-09-04 复查记录（V8.53→V8.55 后）**

* 统一横屏门控复查：全 CSS 仅剩 1 处 `@media (orientation: landscape) and (min-width: 760px)`（`style.css:14282`）——为**桌面宽屏专用**横向化（`.ndx-short-landscape` 刻意排除桌面，二者互补），非冲突残留；其余手机横屏样式均已走 `.ndx-short-landscape` 类门控。

* 后台暂停：`main.js` `visibilitychange/blur/focus` 顺延 QTE/破韧窗口 deadline；`document.hidden` 判后台。已核。

* 三端合同：`platform/` 三实现（browser/taptap/wechat）+ `NDX.Platform`；TapTap 买断门 `platform/taptap.js` `verifyAndBoot` + `BUYOUT_KEY` 防泄露；`minigame/game.json` `deviceOrientation: landscape`。已核。

* **真机执行项（2026-09-04 复查核验）**

  * ② **微信首包** **`<4MB`：已核验 ✅** `demo/minigame/` 递归总计 **1.78 MB**（主因 `bundle.js` 1.73MB，`engine/` 与配置为 KB 级），未超 4MB 上限。

  * ① **音频真机自检（headless 无法验真机数值，须真机/模拟器）**，照下列步骤执行：

    1. 点屏弹出手势解锁（否则 `selfTest` 报 `error: not init`）；
    2. 控制台执行 `NDX.audio.selfTest(40)`，判定返回 `stealOk === true` 且 `peakVoices ≤ maxVoices`（移动端 `maxVoices=24`、桌面 `64`）；
    3. 控制台执行 `NDX.audio.getDiagnostics()`，判定 `budgetOk === true` 且 `voicesStress ≤ maxVoices`，并核对 `bossAct / bossFlavor / zone / bossRootOff` 随关隘/区域切换、总线参数在预算内；
    4. headless 侧仅能验守卫（不抛、`ready:false` 快照、sfx 名 1:1），已由 `scripts/validate_audio.js` 覆盖（当下 13/0 通过）。

***

## 与既有设计的衔接

* 战斗公式、第一章 20 层拓扑、逐难数值已严格对齐《第1关Demo切片》《第一章路线设计V5.16》《第一篇完整图谱V5.13》。

* 五英雄、三魄轮回、无尽·不归人等元叙事设计见 `8.5/五英雄终局设计/` 系列文档，后续按此框架扩展角色与模式。

* 数值软上限（减伤 ≤ 80%、装备堆叠）已在 `combat.js` 内实现，便于后续接入无尽模式递增。

***

## 本地调试（新手可逐条照做）

### 起本地服务器

* 桌面端自测（推荐走 HTTP，避免 `file://` 兼容问题）：

  ```
  node scripts/_serve.cjs      # 绑定 0.0.0.0:8090
  ```

  浏览器打开 `http://localhost:8090/`。

* 纯本地双击 `demo/index.html` 也能玩，但 `?v=NN` 缓存号在浏览器 H5 端最好走 HTTP 验证。

### 模拟器 / 真机预览

* TapTap 开发者工具 / 模拟器打开 `demo/`（或部署到静态站点后扫码预览）。

* 用**真机**重点验证：横屏锁定、触控手感、字节字号可读、退后台暂停（qte/破韧窗口 deadline 顺延）。

### 一致性与门禁

* 买断版与浏览器 H5 共用核心代码，跑三端兼容门禁：

  ```
  node demo/scripts/platform_test.js
  ```

  （覆盖 host A 浏览器 / host B TapTap 离线 / host C 微信 bundle + bundle 漂移防护）

* 改动核心后同步递增 `index.html?=vNN` 缓存版本号。

## 买断版特殊规则（AGENTS.md §七·五）

* **买断验证**：启动时验证买断状态，未购买提示购买，不直接放玩。

* **无广告**：不得含任何广告（含激励视频、横幅）。

* **无内购**：除买断本身外，所有内容买断后即可玩。

* **离线游玩**：完全离线可玩，不强制联网。

* **成就/排行榜**：经适配层接入 TapTap SDK；平台专属功能不污染核心逻辑。

## 平台适配层接入（三端合同 · NDX.Platform）

核心代码永远只调用 `NDX.Platform`，**不直接写** **`localStorage`** **/** **`wx.*`** **/ TapTap SDK**。
目录：`demo/platform/`

```
platform/browser.js   — 浏览器 H5 实现（localStorage + dev mock 买断 + 成就落内存）
platform/taptap.js    — TapTap 买断版实现（SDK failback 到本地存储，真实上线时替换 SDK 调用）
platform/wechat.js    — 微信小游戏实现（wx.setStorageSync / postMessage 占位）
platform/index.js     — 装配器：三端自动识别 -> 统一挂到 window.NDX.Platform，并提供 fallback mem store
```

加载顺序（`index.html` 中，必须在 `save_system.js` 之前）：

```
platform/browser.js → platform/taptap.js → platform/wechat.js → platform/index.js → js/save_system.js
```

统一接口合同（三端必须同时提供）：

| 域            | 方法                                                                                                            | 说明                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| storage      | `get/set/remove/clear` + `getItem/setItem/removeItem/length/key(i)`                                           | 同步；save\_system.js 经 `_store()` 调用      |
| buyout       | `verifyAndBoot({onPurchased,onNeedPurchase,onError})` / `markPurchased(token)` / `simulate(state\|undefined)` | 买断验证主入口；返回 Promise                      |
| achievements | `reportUnlocked(histArr, newlyUnlocked)` / `reportLeaderboard(payload)`                                       | game.js `_syncAch` 中 fire-and-forget 调用 |
| share        | `share({url?, title?, desc?})`                                                                                | 浏览器复制链接 / 微信分享 / TapTap 系统分享            |
| purchase     | `purchase(sku)`                                                                                               | 买断版一律返回 reject（除买断本身外无内购，宪法 4）          |

## 买断验证接入（启动门禁 · 主流程）

触发点：`js/main.js` 的 `DOMContentLoaded` → **先不**实例化 `NDX.Game`，先调用：

```js
NDX.Platform.buyout.verifyAndBoot({
  onPurchased: startGame,           // 已购买 → 实例化 Game + 绑定事件 + doRender()
  onNeedPurchase: _showBuyoutGate,  // 未购买 → 渲染全屏 buyout-gate 弹窗
  onError: (e) => { /* 降级：走 buyout-gate，绝不直接放玩 */ },
});
```

UI 层：

```
css/style.css 追加 .buyout-gate 与 .ndx-short-landscape .buyout-gate 两套样式（竖 / 横一致）
id="ndx-buyout-gate" 弹窗由 main.js _showBuyoutGate() 动态插在 <body> 顶层（不进入 #ndx-lock，旋转伪横屏时仍居中）
弹窗三按钮：「启动游戏 · 买断解锁」/「我已购买，验证」/「取消（不进游戏）」
开发调试：?buyout=0 或 window.__ndxAllowBuyoutSim=true → 弹窗底部出现「模拟未购买」复选框
```

Browser 端 / TapTap 端本地 mock：默认视为"已购买"（不破坏当前 H5 开发体验）；要触发未购门禁两种方式：

* URL 带 `?buyout=0` 或 `window.__ndxBuyoutSim = false`

* 调 `NDX.Platform.buyout.simulate(false)`

上线前：`platform/taptap.js` 中 `NDX.Platform.buyout.verifyAndBoot` 把 failback localStorage 检查替换为 TapTap SDK 真实买断验证调用；核心层与 UI 层不动。

## 成就接入（Platform.achievements.reportUnlocked）

核心触发点：`js/game.js` 的 `_syncAch()`。新点亮成就（与上次调用 hist 的差集）作为 `newlyUnlocked`，平台适配层负责上报：

```js
const newlyUnlocked = hist.filter(id => histBefore.indexOf(id) < 0);
Promise.resolve().then(() => NDX.Platform.achievements.reportUnlocked(hist, newlyUnlocked))
  .catch(err => console.warn('[Game._syncAch] 上报异常已忽略', err));
```

设计原则（宪法 §五 · 最小改动）：

* **绝不 await**：fire-and-forget，绝不让成就上报阻塞战斗主线或渲染。

* **吞异常**：catch 后仅 console.warn，不回抛不打断 UI。

* **幂等**：hist（累计集）+ newly（本次增量）双通道上报，平台端可按 id 去重。

上线前按平台替换实现：

* **TapTap**：`taptap.js` achievements.reportUnlocked 里调用 TapTap SDK `TTSDK.Achievement.unlock(id)`；失败 fallback 暂存本地稍后补发。

* **微信**：`wechat.js` 已提供 `wx.postMessage({type: 'achievements.unlock', ids})` 占位；游戏圈/开放数据域对接时补 payload。

* **浏览器**：仅记内存与 localStorage（`Platform.achievements._calls`），便于单元测试断言与 CDP 验收。

微信小游戏 / 离线打包需同步：`scripts/_build_minigame_bundle.js` 已把 `platform/*.js` 纳入 bundle 段并加了 `NDX.Platform / verifyAndBoot` 符号抽验，**改适配层后必须** **`node scripts/_build_minigame_bundle.js`** **重打包**，否则 host C/D 门禁 FAIL。

## 常见问题排查

| 现象               | 优先排查                                                    |
| ---------------- | ------------------------------------------------------- |
| 白屏 / 空白          | 浏览器 Console 首行报错文件；走 HTTP 而非 `file://`；确认 `?v=` 脚本能加载   |
| 改了代码没变化          | `index.html?=vNN` 是否递增（AGENTS.md §五）→ 强刷 Ctrl+F5 → 清缓存  |
| 原 core 与买断版表现不一致 | 是否三端同步递增版本、同一批核心代码；分别跑 `platform_test.js` host B 验证离线加载 |
| `?v=NN` 404      | `file://` 放开时的兼容问题；统一走 `_serve.cjs` 8090 端口             |
| 竖向不见横屏           | `game.json` `deviceOrientation=landscape`；真机/模拟器横屏锁向    |
| 购买过仍提示购买         | buyout 验证是经适配层读本地存储，确认买断标记已写入；TapTap 端验证二次              |
| 离线打不开            | 确认资源全部相对路径、无强制网络依赖；本地存储可离线读写                            |
| 中文字符乱码           | 文件为 **UTF-8 无 BOM** 保存（本项目惯例）                           |

## 相关文件速查

* 浏览器 H5 入口：`demo/index.html`（本地预览走 `scripts/_serve.cjs`，8090）

* 战斗/数值/配置真源：`demo/js/*.js`（`combat.js` / `data.js` / `game.js`）

* 三端兼容门禁：`demo/scripts/platform_test.js`（host A/B/C + bundle 漂移防护）

* 平台适配层：`demo/platform/`（browser / wechat / taptap；接入后核心只调 `NDX.Platform`）

* 微信对照指引：`demo/微信小游戏发布指引.md`

