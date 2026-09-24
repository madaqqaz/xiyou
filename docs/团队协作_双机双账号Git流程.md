# 双机 · 双账号 代码更新流程（《逆道西行》）

> 适用：在两台电脑 / 两个 GitHub-Gitee 账号之间同步本仓库的代码更新。
> 仓库根目录：本机 `D:/xiyou/demo`（分支 `main`）；远端 `origin`=GitHub、`gitee`=Gitee。
> 配套脚本：`scripts/_git_sync.sh`

---

## 一、结论先行：现在直接上第二台电脑，是拿不到能跑的游戏的

体检结果（2026-09-24 实测）：

| 检查项 | 实测值 | 意味着 |
|---|---|---|
| 远端 `origin`(GitHub) | `madaqqaz/xiyou` **public**，约 623 MB | 源码公开可见 ⚠️ |
| 远端 `gitee` | `madaqqaz/xiyou`，仅 `main` 一条分支 | 镜像落后 |
| 本地 `main` vs `origin/main` | 领先 **4** / 落后 **0** | 可快进推送，无冲突 |
| 本地 `main` vs `gitee/main` | 领先 **25** / 落后 **0** | 同上 |
| **HEAD 树里的文件数** | **1482** | ← 新机器 clone 只拿到这些 |
| 工作区实际需要 | **5890** | 差距 **4408** 个文件 |
| `img/` HEAD 内 | 880 文件 / 23.6 MB | |
| `img/` 仅暂存未提交 | **2347 文件 / 1404 MB** | 一提交仓库从 623MB → ≈2GB，GitHub/Gitee 会限流或拒收 |
| `img/` HEAD 与索引都没有 | **1713 文件 / 361 MB** | **clone 完全拿不到** |
| 其中线上必需美术 | **1521 文件 / 263 MB** | `bosses` 971 个 / 186MB、`foe` 347 个、`heroes` 134 个 → **立绘大面积缺失** |
| `assets/Boss.png` | **未入库**（但 `css/style.css` 直接引用） | clone 后战斗 Boss 底图缺失 |
| `taptap_bundle/` | 539 MB / 3106 文件，**未被忽略** | 一句 `git add -A` 就会误入库 |
| 本机 git 身份 | `madaqqaz <madaqqaz@example.com>` | 假邮箱 → 提交在 GitHub 上不归属任何账号 |

**结论：git 目前不是真源。** 要双机协作，必须先做一次性「入库清洗」，把仓库变成真源，再让第二台机器 clone。

---

## 二、先拍三个板（决定后面的做法）

| # | 决策 | 选项 | 建议 |
|---|---|---|---|
| D1 | 仓库可见性 | public / **private** | 商业项目 + IP 敏感，**改 private** |
| D2 | 美术入库策略 | A 只入运行必需的 webp+少量 PNG（≈450MB）<br>B git 只装代码/文档（<10MB），美术走离线包<br>**C 全量入库（1.8GB，不推荐）** | **A**：clone 即能跑，仓库 ≈1.1GB |
| D3 | 第二个账号的关系 | **协作者（同一仓库）** / Fork + PR | 2 人以内用协作者最省事 |

---

## 三、一次性对齐（在「现在这台机器」执行）

> ⚠️ 以下只调整 **索引（暂存区）**，不删磁盘上任何文件。

```bash
cd D:/xiyou/demo

# 1) 把构建产物 / 归档 / 设计源文件从暂存区撤下（文件保留在磁盘）
git reset -q -- taptap_bundle img/_archive "img/美术资产归档_逆道西行_2026-09-18" \
                 godot_gameplay_attributes-master 2>/dev/null
git rm -r --cached -q --ignore-unmatch taptap_bundle

# 2) 把「运行必需但没入库」的美术补进索引（方案 A）
git add img/portraits/bosses img/portraits/foe img/portraits/heroes \
        img/portraits/enemies img/portraits/special img/portraits/npcs \
        img/fx img/ui assets/Boss.png
git add js css scripts docs index.html

# 3) 提交前自检（脚本会拦大文件 / 构建产物 / 归档）
scripts/_git_sync.sh check

# 4) 提交
git commit -m "chore(repo): 入库清洗——补齐运行必需美术与缺失代码，排除构建产物/归档"

# 5) 推送双远端
scripts/_git_sync.sh push main
```

推送量实测很小：到 GitHub **10.6 MB**、到 Gitee **32.0 MB**（只是增量 blob）。

---

## 四、第二台电脑初始化

### 4.1 传输方式二选一

**A. 同局域网 / U 盘（快，推荐）** —— 避开 `.git` 1.9GB 的网络下载：

```bash
# 本机打包全量仓库
scripts/_git_sync.sh bundle D:/xiyou_full.bundle
# 把 xiyou_full.bundle 拷到新机器，然后：
git clone "D:/xiyou_full.bundle" D:/xiyou/demo
cd D:/xiyou/demo
git remote set-url origin git@github.com:madaqqaz/xiyou.git
git remote add  gitee  https://gitee.com/madaqqaz/xiyou.git
```

**B. 纯网络** —— 浅克隆省时间（不需要历史时）：

```bash
git clone --depth 1 git@github.com:madaqqaz/xiyou.git D:/xiyou/demo
```

### 4.2 每台机器必须配对的「身份」（最容易踩的坑）

```bash
cd D:/xiyou/demo
# 用这台机器对应的账号，不要沿用本机的 madaqqaz
git config user.name  "账号B用户名"
git config user.email "账号B在GitHub/Gitee绑定的真实邮箱"
```

> 本机现在是 `madaqqaz@example.com`（占位符），**两个账号都必须换成真实邮箱**，否则 GitHub 不显示提交人。

### 4.3 凭据

- GitHub 走 SSH：`ssh-keygen -t ed25519 -C "账号B邮箱"` → 把 `~/.ssh/id_ed25519.pub` 加进**账号B在 GitHub 的 SSH Keys**；本项目另有 `id_ed25519` 已可用。
- Gitee 走 HTTPS：首次推送会让 Git Credential Manager 弹窗登录（或用私人令牌）。

### 4.4 账号权限（D3 选「协作者」时）

- GitHub：仓库 → Settings → Collaborators → 添加账号B。
- Gitee：仓库 → 管理 → 仓库成员管理 → 添加账号B为「开发者」。
- 若选 Fork 模式：账号B fork 后推到自己仓库，再向 `madaqqaz/xiyou` 发 PR。

---

## 五、日常循环（关键纪律）

**核心规则：每台机器一个自己的分支，`main` 只做合并，禁止两台机器同时往 `main` 直推。**

| 机器 | 建议分支名 |
|---|---|
| 本机（马达） | `pc-a/功能名` |
| 第二台/账号B | `pc-b/功能名` |

```bash
# 每轮开工
scripts/_git_sync.sh status
git checkout -b pc-a/fix-battle-balance      # 首次；已有分支则 git checkout 分支名

# 改代码…

# 提交（⚠️ 严禁 git add -A / git add .）
git add js/ui css index.html docs
scripts/_git_sync.sh check
git commit -m "fix(battle): 描述"
scripts/_git_sync.sh push pc-a/fix-battle-balance

# 收工前同步主干
git checkout main && scripts/_git_sync.sh pull
```

合并：在 GitHub 上开 PR → 合并到 `main` → 另一台机器 `git checkout main && scripts/_git_sync.sh pull`。

---

## 六、三条铁律（血泪版）

1. **永远不要 `git add -A` / `git add .`**
   本仓库工作区有 539MB 构建产物 + 1.4GB 待定美术，全量 add 会瞬间把仓库撑爆。
   → 只 add 具体目录：`git add js css scripts docs index.html`。

2. **`taptap_bundle/` 是构建产物，不入库**
   已加入 `.gitignore`（本次补充）。两端各自 `scripts/_taptap_bundle.js --build` 生成。

3. **提交前跑 `scripts/_git_sync.sh check`**
   会拦：构建产物目录、单文件 ≥95MB、归档/PSD 源文件，并提示运行必需但没入库的图。

---

## 七、常见故障

| 现象 | 原因 | 处理 |
|---|---|---|
| `git status` 上万条 | 未跟踪的构建产物/美术 | 用 `git status -uno` 只看已跟踪；确认 `.gitignore` 生效 |
| 推送被拒 `exceeds 100MB` | 大文件入库 | `git reset -- <file>` 后加入 `.gitignore`，必要时 `git filter-repo` 清历史 |
| 推送被拒 `fetch first` | 远端有新提交 | `scripts/_git_sync.sh pull` 后再 push |
| 两台机器改了同一文件 | 分支冲突 | 在 PR 里解冲突；本地 `git pull --rebase` 后手动改 |
| clone 卡在下载 | `.git` 有 1.9GB 历史 | 用 `--depth 1`，或用 `bundle` 走 U 盘 |
| 提交人不显示在 GitHub | 邮箱是占位符 | 改成账号真实邮箱后 `git commit --amend --reset-author` |

---

## 八、脚本速查

```bash
scripts/_git_sync.sh status          # 体检：分支 / 领先落后 / 脏文件统计
scripts/_git_sync.sh pull            # 从 origin rebase 拉取（工作区须干净）
scripts/_git_sync.sh push [branch]   # 同时推 origin 与 gitee
scripts/_git_sync.sh check           # 提交前自检
scripts/_git_sync.sh bundle <path>   # 打全量 bundle 搬机
```
