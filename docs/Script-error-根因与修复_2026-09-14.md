# 「[运行时错误] Script error.」根因与修复报告

日期：2026-09-14
触发：玩家截图显示地图页顶部常驻 `[运行时错误] Script error.`（页面其余部分正常，故极易被当作「无害提示」忽略）

---

## 一、为什么这个 bug 一直查不出来

`file://` 直开时，浏览器把同目录脚本当作跨域资源，`window.onerror` 只能拿到**脱敏**的
`"Script error."` —— 没有文件名、没有行号、没有堆栈。`main.js` 的全局错误兜底因此只能打印这一句，
玩家与开发者都看不到真凶是谁。

**破局手法**：起一个本地 HTTP 服务（`python -m http.server`）用 `http://127.0.0.1:8899` 打开同一份代码，
同源后浏览器不再脱敏，Playwright 捕获 `pageerror` 立刻拿到真名真行号：

```
Uncaught SyntaxError: Unexpected token '{'  @ js/ui/ui_bag.js:69
```

> 这条手法值得沉淀：**排查「Script error.」先换 http 协议复现**，比在 file:// 下盲猜快一个数量级。

---

## 二、真凶：`js/ui/ui_bag.js` 两处「坏编辑」语法损伤

| # | 位置 | 损伤 | 后果 |
|---|---|---|---|
| ① | L69 | `${this._buildSynergyPanel(s)}` 被写在模板串闭合的 `` `; `` **之后**，成了裸语句 | 整个文件解析失败 |
| ② | L140 | `bagSlotPickerHtml` 收尾 `}` 后**漏逗号**，直接接下一个方法名 | 整个文件解析失败 |

一处就足以致命，这里两处并存。**整个 `ui_bag.js` 从未被浏览器执行过**：

- 装备/法宝/宠物「生效格」面板、换装弹窗全部是死的（点「装备栏 0/4」没反应）；
- V9.0「构筑协同图」自诞生起就没在玩家面前出现过一次。

**修复**：① 把调用移入模板串内；② 补回逗号。

```diff
         </div>
+        ${this._buildSynergyPanel(s)}
       </div>`;
-          ${this._buildSynergyPanel(s)}
     },
@@
-    }
+    },
     // V9.0 构筑协同图
     _buildSynergyPanel(s) {
```

---

## 三、连带发现：地图地区背景「显示不完整」的第二个根因

`ui_core.js` 的 DOM 缓存 `$cache()` 只判「缓存里有没有」，**不判「节点是否还在文档中」**：

```js
// 旧实现
$cache(id) { if (!this._domCache[id]) this._domCache[id] = document.getElementById(id); return this._domCache[id]; }

// 新实现：命中前校验 isConnected，新鲜节点优先
$cache(id) {
  const c = this._domCache[id];
  if (c && c.isConnected) return c;
  const el = document.getElementById(id);
  if (el) { this._domCache[id] = el; return el; }
  return c || el;
}
```

`#mapBgLayer` 被 `_applyActBg()` 用来挂地区大图，而地图**每次重渲染都重建 `#app.innerHTML`** →
元素被换成新的，缓存却仍指向**已被替换下来的游离 div**。结果：地区大图被 append 进死节点。
（旁证：`_clearDomCache()` 全仓从未被调用，缓存没有任何失效时机，属死代码。）

实机取证（修复前）：

```json
{ "cachedTag": "DIV#mapBgLayer", "cachedConnected": false, "sameNode": false }
// 调用 _applyActBg(1) 之后
{ "liveImgs": 0, "cachedImgs": 1 }   // 图进了死节点，页面上的图层永远是空的
```

---

## 四、并行会话提交引入的 CSS 结构损伤（P0 反向回归）

排查期间发现**另一个会话正在同一仓库并行提交**。其中 `a725fcf`
（commit 标题：`fix: 战斗背景图路径从.png改为.webp，修复战斗背景黑色问题`）在 `css/style.css` 上
做 `.png → .webp` 机械替换时，**把 `` .png" } `` + 换行 + 下一个选择器一并吃掉**，
17 条 `.fb-bg-act1~17` 被压成一行，**16 个 `}` 与 16 个选择器人间蒸发**：

```
花括号统计：db7d968 → 5932/5932 平衡；3abcc45 → 5929/5929 平衡；a725fcf → 5929/5913 失衡(-16)
```

后果：`.fb-bg-act2` 到 `.fb-bg-act17` 选择器已不存在，**第 2~17 章战斗背景全部失去映射**——
即那次提交「修复战斗背景」的实际效果是**反向的**，只有第 1 章还有背景。

**修复**：按 `3abcc45` 的原始 17 条规则**逐条重建**，仅把扩展名改为已存在的 `.webp`；
花括号恢复 5929/5929 平衡。实机验证（CSSOM）：

```
act1  → bg_battle_default.webp        act2  → bg_battle_liangjieshan.webp
act5  → bg_battle_default.webp        act9  → bg_battle_nverguo.webp
act17 → bg_battle_lingshan.webp
```

### 另一处同类 404（已修）

`css/style.css` 有两处引用**不存在的 `.png`**，而同名 `.webp` 就在旁边：
`../img/changan_start_bg.png`（开场页背景）、`../img/bg/bg_battle_lingshan.png`。已改为 `.webp`。
`changan_start_bg.webp` 现已在 CSSOM 中命中，开场页背景恢复。

---

## 五、修复清单

| 文件 | 改动 |
|---|---|
| `js/ui/ui_bag.js` | 修 2 处语法损伤 → 文件恢复执行，换装面板 + V9.0 构筑协同图复活 |
| `js/ui/ui_core.js` | `$cache()` 增 `isConnected` 失效校验 → 地区大图不再写进死节点 |
| `css/style.css` | 重建被吃掉的 17 条 `.fb-bg-actN`；`changan_start_bg` / `bg_battle_lingshan` 改 `.webp` |
| `index.html` | 版本号 `style.css 521→522`、`ui_bag 445→446`、`ui_core 437→438`、`ui_map 507→508` |
| `img/pwa/` | 新增 `icon-192/512/1024.png`（源 `.webp` 已有，index.html 引 `.png` 一直 404；`apple-touch-icon` 只认 PNG） |
| `scripts/_verify_syntax_all.js` | **新增门禁 19 项**（见下） |

---

## 六、新增门禁 `scripts/_verify_syntax_all.js`（19 通过 / 0 失败）

为什么需要它：本次三个 bug（JS 语法、CSS 花括号、资源 404）**全部属于「浏览器不告诉你哪里坏了」**，
而既有门禁只 `node --check` 抽查了 25 个文件，`ui_bag.js` 恰好不在名单里。

| 段 | 断言 |
|---|---|
| A | `js/` 下**全部 145 个** `.js` 通过语法解析（不再抽检） |
| B | `index.html` 引用的本地文件全部存在；JS 内引用资源无**新增**缺失（存量 17 项白名单） |
| C | `ui_bag.js` 可加载；`bagHtml()` 真的产出「构筑协同」面板；模板串闭合后无裸 `${}` |
| D | `$cache()` 带 `isConnected` 校验并回写新节点 |
| E | `style.css` 花括号平衡 / 无多余 `}` / 无「多选择器压成一行」/ 位图引用无新增缺失 / `.fb-bg-act1~17` 齐全 |

全量跑批：**31 脚本 / 31 通过 / 0 失败**（原 30/30）。

---

## 七、遗留（未擅动，待拍板）

### 1. 资源缺失 17 项 → 已挤到 14 项（已登记白名单，新增即红）
「立绘缺失」里有一半**不是缺美术，是引用名写错**。`data_heroes_data.js` 有 10 条写成「中文名.webp」，
磁盘上却是拼音 ASCII 名 → 一律 404 → 立绘空白。不新增任何美术，只改引用名：

| 数据键 | 原引用（404） | 改为 | 尺寸 |
|---|---|---|---|
| `boss_zhenyuanzi` | `portraits/bosses/镇元大仙.webp` | `bosses/boss_zhenyuanzi.webp` | 512×341 |
| `boss_liuhong` | `portraits/npcs/刘洪.webp` | `bosses/boss_liuhong.webp` | 512×341 |
| `npc_jiangliuer_special` | `portraits/npcs/江流儿.webp` | `npcs/npc_jiangliuer.webp` | 512×341 |

**明确撤回两条**（资源类别不符，宁留 404 走兜底）：`boss_huangfeng_phase1` / `boss_heixiongjing_phase1`
是 **300×400 透明底矢量精灵**，且配 `_atk/_hit/_idle` 三帧＝**战斗立绘**，不是头像美术，接进头像位会画风错位。

剩余缺失：**立绘 7**（黄风怪 / 黑熊精 / 灵吉菩萨 / 唐太宗 / 殷温娇 / 陈光蕊 / 虎仔）、
**开场音频 5**、**UI 图标 2**。

### 1b. 乱码文件名：不可逆，别再逆推
`img/portraits/npcs/` 6 个 + `bosses/` 4 个 + `img/ui/` **108 个**文件名是编码损伤产物。
试过 4 种正向假设（utf8→latin1 / →gbk / 双重 latin1 / gbk 再 latin1）**全部无法命中**——
多轮编码叠加已丢信息。可靠路径只有两条：**看图认人** / 让生成方给映射。
（出图手法：Node 把乱码名复制成 ASCII 名 → 组 HTML → 无头 Chrome `fullPage` 截图，一次成表。）

**我的看图推测（未擅自改名，等你确认）**：
- `bosses/` 乱码 1~4 → 黄风怪（金甲+风）、黑熊精（黑熊）、镇元大仙（老者+树）、灵吉菩萨（趺坐+龙）
- `npcs/` 乱码 2=殷温娇（抱婴漂江）、3=唐太宗（冕旒）、4=刘洪（乌纱+刀）、6=虎仔（虎崽）；1、5 待定

若确认，我一条命令即可改名接线（这批是水墨风格，与主美术一致，正好补上黄风怪/黑熊精/灵吉菩萨）。
对照表：`docs/待认领_乱码立绘对照表_2026-09-14.png`

### 1c. ⚠ 新发现：美术水印（三端发布前必须清）
- 主美术 `img/portraits/heroes/tangseng_base.webp`（600×800）**干净**，只有装饰性印章；
- 但 `img/portraits/npcs/npc_jiangliuer.webp` 右下角带 **"AI生成" 水印**——`npcs/` 那批是带水印草稿。
- 本轮接入的 `npc_jiangliuer` 同样带水印，已如实标注；要不要先回退、或统一出水印清理批次，请定。
- 核查用图：`docs/接线立绘_水印与画风核查_2026-09-14.png`
- 另有 `css/style.css` 引用的 `../assets/Boss.png`、`../assets/精英.png` 不存在（已在门禁白名单登记）

### 2. 战斗背景映射未对齐 9 章制
`js/ui/ui_panel_2.js` 用 `'fb-bg-act' + act` 选背景，而 `.fb-bg-actN` 仍是**十七地区时代**的映射
（act2=两界山、act3=黄风岭…），与 `NDX.ACT_BG` 的九章制（ch2=流沙河、ch3=火云洞…）**不一致**。
本次只做「原样重建 + 修扩展名」，**不动映射语义**——按章对齐属设计决策，请拍板。

### 3. 并发写入风险（重要）
本次排查期间另一会话在同一仓库连续提交 4 次（`3abcc45`/`4eaa295`/`248b4d3`/`a725fcf`），
且 `a725fcf` 正是引入 CSS 结构损伤的那次。**建议：同一仓库同一时间只保留一个写入者**，
否则双方的工作区会互相覆盖（本次已出现一次）。

### 4. Service Worker 强制刷新
`index.html` 的 SW `controllerchange` 监听器会 `window.location.reload()`——
每次 SW 版本更新都会**强制整页重载**，若发生在战斗/结算中途可能丢当局进度。建议改为提示用户手动刷新。

### 5. `css/style.css` 注释乱码
82 行注释为 GBK 误解码产物（如 `/* 鎴樻枟灞?*/`），**未影响任何 `content:` 文案**，仅开发者可读性受损；
但说明该文件曾被 GBK 往返，后续往返有污染真实字符串的风险。
