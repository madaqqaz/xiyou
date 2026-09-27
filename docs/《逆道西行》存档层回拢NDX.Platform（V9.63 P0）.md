# 《逆道西行》存档层回拢 NDX.Platform（V9.63 · P0 · 设计文档 v1.0）

> 性质：**合同修复，不改语义** —— `js/storage.js` 违反 AGENTS.md §七·五 "核心代码只调 NDX.Platform" 的契约，本轮把 5 个方法内部拉回单一后端，`NDX.storage.*` 对外签名与所有调用点零改动。

## 一、问题（阶段②审计结论 + 本轮复核）

- `NDX.Platform.storage` 抽象已在 `platform/browser.js` / `platform/taptap.js` / `platform/index.js` 完备，接口与 `localStorage` 语义兼容（`get/set/remove/clear/getItem/setItem/removeItem/length/key`）。
- 但 `js/storage.js` 的 `NDX.storage.load/save/remove/clearAll/clearByPrefix` **5 个方法全部裸调 `localStorage`**（源码扫描 9 处 `localStorage.getItem/setItem/removeItem/length/key`），完全绕过 `NDX.Platform.storage`。
- 后果：
  - 浏览器 H5 端：`platform/browser.js` 内部 `STORE = localStorage`，行为等价，**当前不炸**。
  - TapTap 端：`platform/taptap.js` 用 TapTap 本地存储 API 作 `NDX.Platform.storage`；而 `NDX.storage.*` 仍写 `localStorage`，双轨不一致 → **存档静默丢失或读不回**（除非 TapTap webview 代理了 localStorage，不能赌）。
- 违反条款：AGENTS.md §五"共享语义必须单一真源"、§七·五"核心代码只调用 NDX.Platform，不直接调用平台 API"。

## 二、合同设计（唯一 owner）

- **修复点唯一 owner**：`js/storage.js`。所有 `NDX.storage.*` 内部改为经本地 helper `_store()` 拿后端。
- **Platform 优先，fallback 兜底**：`_store()` 优先返回 `window.NDX.Platform.storage`；Platform 未装配的极端启动窗口（storage.js 在 platform/index.js 之前执行）fallback 到 `localStorage`；两者都不可用则返回内存 no-op 对象。
- **对外签名零改动**：`NDX.storage.load/save/remove/clearAll/clearByPrefix/migrateAll/KEYS/VERSION/getVersion` 保持原样，全部既有调用点（`save_system.js`、`game.js`、`main.js`、各 UI）**零修改**。
- **不改动 Platform 层**：`platform/*` 已是正确抽象，不动。
- **不动加载顺序**：`js/storage.js?v=386` 保持在 `platform/*.js` 之前（因 `_store()` 是运行时才取表，加载顺序无关）。

## 三、防漂移门禁（新建 `scripts/_verify_storage_platform_bridge.js`）

三段断言：

1. **源码裸扫**：`js/storage.js` 中 `localStorage.(getItem|setItem|removeItem|clear|length|key)` 出现次数 = 0，**除**标记了 `__PLATFORM_FALLBACK__` 的行（仅 `_store()` 内一处白名单）；确保后续任何人重新引入裸调都会被红拦。
2. **沙箱注入**：`global.window.NDX.Platform = { storage: mockBackend }`（非 localStorage 后端）+ `global.localStorage = 陷阱 spy`，`require('js/storage.js')`；断 `NDX.storage.save/load/remove/clearAll` 数据落在 mock、`lsTrap` 数据始终为空。断契约不漂移：`KEYS/VERSION/getVersion()`。
3. **降级路径**：`window.NDX = {}`（无 Platform）时装载，断 `NDX.storage.save` fallback 到 `localStorage` 且不抛。

## 四、数值/接口不变清单（回归零风险）

- `SAVE_VER`、`MIGRATIONS` 迁移表：不动。
- `STORE` 注册表 34 个 key：不动，字符串值保持历史兼容。
- 存档 JSON 结构（`_version` / `_savedAt` 自动注入语义）：不动。
- `clearAll` 前缀集 `['nidao','ndx_','xynj_','xy_']`：不动。

## 五、缓存版本号

`index.html`：`js/storage.js?v=385` → `?v=386`（AGENTS.md §五 缓存版本号纪律）。

## 六、验收（2026-09-26）

| 命令 | 结果 |
|---|---|
| `node --check js/storage.js` | 无输出（通过） |
| `node scripts/_verify_storage_platform_bridge.js` | **16 通过 / 0 失败** |
| `node scripts/_run_all_gates.js` | 74 脚本，73 通过；唯一红 = `_verify_skill_variant.js`（V9.55 战斗技能变体既存红，与本轮 storage 修复无耦合：门禁不 require `js/storage.js`、不引用 `localStorage`/`NDX.storage`） |

## 七、遗留与已知债务

- **既存红**：`_verify_skill_variant.js` G3（重复调用不得二次缩放 dmg / 拼接 note）— 属 V9.55 战斗技能变体域，与本轮 P0-2 无关，本轮不背；后续作为独立 bug 处理。
- **未来 P1**：三端发包链路（`www/`、`android/`、`minigame/`）在开发者视角报告 V9.42 已标"长时间未跑通"；本轮把 storage 契约拉回 Platform 是三端同步的前置必要条件，但发包链本身另成独立议题。
- **未来 P2**：`platform_test.js` 在 AGENTS.md §十一 标"已创建（41 项通过）"但标注未运行；本轮新门禁与其互补（bridge 门禁测核心层是否走 Platform，platform_test 测 Platform 本身）。

## 八、改动清单

- `js/storage.js`：+52 −25 行（新增 `_store()` helper + `_storeKeys()` 迭代 helper；5 个方法内部改走 `_store()`；`clearAll/clearByPrefix` 用 `_storeKeys()` 快照遍历避免边删边索引）
- `scripts/_verify_storage_platform_bridge.js`：新建 141 行
- `index.html`：`storage.js?v=385` → `?v=386`（1 行）
- 本设计文档：新建
