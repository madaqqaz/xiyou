import io, os
root = r'D:\xiyou\demo'

# 1) 清理临时取证脚本
for f in ['_audit_recon.py', '_audit_portrait.py', '_audit_ndx.js']:
    p = os.path.join(root, f)
    if os.path.exists(p):
        os.remove(p)
        print('deleted', f)

# 2) 追加记忆
mp = os.path.join(root, '.workbuddy', 'memory', '2026-09-12.md')
d = io.open(mp, encoding='utf-8', newline='').read()
note = '\n\n## 重新审计 v2（GitHub 仓库更新后 · 代码真源取证）\n\n**触发**：用户告知代码仓库已改 GitHub，要求重新审计。\n\n**方法（环境坑）**：Bash 的 PATH 在本会话损坏（wc/grep/find/head/tail/rm 全 `command not found`），故取证改用 ①Python 绝对路径（`C:/Users/Administrator/.workbuddy/binaries/python/.../python.exe`）②Grep 工具 ③Node `vm` 上下文加载 NDX。NDX 加载关键：index.html 脚本路径含 `?v=NN` 须 strip，且须用 `vm.runInContext` 在 `sb.window=sb` 共享上下文执行（否则 `var NDX` 成模块局部取不到）；`data.js:7` 定义 `window.NDX=window.NDX||{}`。\n\n**关键结论（当前真源）**\n- **P0-1 立绘 404 已彻底修复**：`CHAR_PORTRAITS` 131 键，17 个特殊角色（哪吒/二郎/接引/如来/观音…）webp 全部存在（经 `__pickWebp`/`__pickWebpImgFallback` 双保险，`index.html:135/148`）；仅 `boss_zhenyuanzi_new.png` 1 处孤立失效。\n- **NEW P0-A 战斗背景全 404**：`NDX.ACT_BG` 17 条引用 `img/bg/act_XX_拼音.webp?v=2`，实际资源是 `img/bg/bg_battle_中文.png`（30+ 个），命名+格式双不匹配，且路径内嵌 `?v` 查询串 → 17/17 文件不存在。比立绘更全局的视觉缺口。\n- **P0-2 BGM 未修**：`assets/sound/bgm_*.mp3` 仍 5×480698 字节等长（30s@128kbps 占位），长局必露循环。\n- **P1-B**：`index.html` 引用 `combat_narrative/intervention/calc/combo/effect/debuff.js`（均 ?v=1）6 个文件不存在 → 浏览器 404，其战斗逻辑疑似已并入 combat.js/combat_skills.js，须删引用或补文件。\n- **P1-C 隐藏职不一致**：`NDX.HIDDEN_JOBS` 仅 6，但 trials81.js/data_trials.js 注入 26 个隐藏节点（六道供给落地时批量补），需核对成就注册全覆盖。\n- **P2-D**：新增 115 个多态 png 立绘（boss phase/atk/hit/idle、hero combat_hit_strip、pet 三态）未被三套 PORTRAITS 引用，疑为战斗演出层/__pickWebp 回退资源，待确认接入。\n- **P0-3 CSS 令牌部分改善**：`:root` 24 变量 + `var(--)` 709 次，但硬编码 hex 仍 1901、rgba 3055（v1 极少→24，进步但未闭环）。\n- **规模（真源 vs v1 文档口径）**：英雄5 / 渡经22部203片（文档曾写133）/ 逆经12部76片（文档曾写58）/ 法宝59 / 装备384 / 事件162 / 81难 / 转职64 / 绝招5·诵经5 / 宠物12 / 17地区。广度达买断级，深度条目数翻倍。\n- **战斗**：Rev.5 C1/C5/C7 已落（工作树未提交）、飘字三档已规范化；回合数软上限 C2 仍 `[PLACEHOLDER]`——实测战力翻倍回合数几乎不变（HP/ATK 同步缩放），构筑对时长无感。\n\n**交付**：`docs/nidao-xiyou-report/nidao-xiyou-reaudit-2026-09-12.html`（重新审计报告 v2，含 P0 修复追踪 + NEW P0-A + 规模对比 + 优先级清单）。临时脚本已删。'
assert ('重新审计 v2' not in d)
io.open(mp, 'a', encoding='utf-8', newline='').write(note)
print('mem appended')
