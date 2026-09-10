# 素材来源与授权声明

> 本文档记录《逆道西行》项目中使用的所有第三方素材来源及其授权状态。
> 最后更新：2026-09-02

---

## 1. 字体

| 字体文件 | 字体名称 | 授权协议 | 商用状态 | 来源 |
|---------|---------|---------|---------|------|
| CooperZhengKai-Subset.ttf | 汇迹正楷 (CooperZhengkai) | 免费商用 | ✅ 可商用 | 猫啃网 (maoken.com) |
| WenYuanSerifSC-Regular-Subset.ttf | 文源宋体 Regular | SIL OFL 1.1 | ✅ 可商用 | Adobe/Google 思源宋体系列 |
| WenYuanSerifSC-Bold-Subset.ttf | 文源宋体 Bold | SIL OFL 1.1 | ✅ 可商用 | Adobe/Google 思源宋体系列 |
| WenYuanSerifSC-Heavy-Subset.ttf | 文源宋体 Heavy | SIL OFL 1.1 | ✅ 可商用 | Adobe/Google 思源宋体系列 |

### 汇迹正楷 (CooperZhengKai) 授权详情

- **全称**：汇迹正楷，英文名 CooperZhengkai，Ver 1.1
- **作者**：绵云饴里 × 特里王
- **构成**：OFL 开源拉丁字体 Cooper* + 免费中文字体汇文正楷 合并
- **分发平台**：猫啃网 (maoken.com) — 仅收录免费商用字体
- **来源路径**：`D:\xiyou\demo\img\汇迹正楷2.001_猫啃网\`
- **项目使用**：经 subset_fonts_v2.py 子集化后为 CooperZhengKai-Subset.ttf
- **参考链接**：https://www.maoken.com/freefonts/24749.html

### 文源宋体系列授权详情

- 基于 Adobe/Google 思源宋体 (Source Han Serif) 衍生
- SIL Open Font License 1.1 — 允许商用、修改、再分发
- 禁止单独出售字体文件，修改版须以相同协议发布
- **参考链接**：https://scripts.sil.org/OFL

---

## 2. UI 素材

| 素材包 | 文件数 | 授权协议 | 商用状态 | 来源 |
|-------|-------|---------|---------|------|
| Kenney UI Pack (2.0) | 98 | CC0 (Creative Commons Zero) | ✅ 可商用 | kenney.nl |
| Kenney UI Pack: RPG Extension | 87 | CC0 (Creative Commons Zero) | ✅ 可商用 | kenney.nl |

- CC0 表示作者已放弃版权，素材进入公有领域
- 可自由用于个人、教育和商业项目，无需署名
- **来源**：https://www.kenney.nl/assets/ui-pack / https://www.kenney.nl/assets/ui-pack-rpg-expansion
- **本地License**：`8.12/kenney_ui-pack/License.txt` / `8.12/kenney_ui-pack-rpg-expansion/License.txt`

---

## 3. AI 生成立绘

| 类别 | 数量 | 生成工具 | 商用状态 |
|------|------|---------|---------|
| 怪物立绘 (enemies/) | ~74 | 即梦AI 图片5.0 Pro | ⚠️ 需书面授权 |
| Boss立绘 (bosses/) | ~31 | 即梦AI 图片5.0 Pro | ⚠️ 需书面授权 |
| 英雄立绘 (heroes/) | ~34 | 即梦AI 图片5.0 Pro | ⚠️ 需书面授权 |
| NPC立绘 (npcs/) | ~8 | 即梦AI 图片5.0 Pro | ⚠️ 需书面授权 |
| 特殊立绘 (special/) | ~16 | 即梦AI 图片5.0 Pro | ⚠️ 需书面授权 |
| 宠物立绘 (pets/) | ~5 | 即梦AI 图片5.0 Pro | ⚠️ 需书面授权 |

### 即梦AI商用授权说明

- **服务提供方**：字节跳动 / 深圳市脸萌科技有限公司
- **用户协议**：生成内容知识产权归属用户（或原始著作权人）
- **商用要求**：需签订书面授权协议并明确授权范围
- **用户协议URL**：https://lf9-cdn-tos.draftstatic.com/obj/ies-hotsoon-draft/vco/17620dba-f821-4a18-85f9-b8b11f73304a.html
- **待办**：上线前需完成即梦AI商用书面授权协议签订

---

## 4. 题材与剧情

| 内容 | 版权状态 |
|------|---------|
| 西游记原著故事与人物 | ✅ 公有领域（吴承恩，明代） |
| 游戏原创剧情与设定 | ✅ 自有版权 |

---

## 5. 授权合规状态总览

| 风险等级 | 类别 | 状态 | 待办 |
|---------|------|------|------|
| 🟢 低 | Kenney UI素材 | CC0，无需额外操作 | 无 |
| 🟢 低 | 汇迹正楷字体 | 免费可商用 | 无 |
| 🟢 低 | 文源宋体字体 | SIL OFL 1.1，可商用 | 无 |
| 🟢 低 | 西游记题材 | 公有领域 | 无 |
| 🟡 中 | 即梦AI立绘 | 商用需书面授权 | **上线前签订商用授权协议** |