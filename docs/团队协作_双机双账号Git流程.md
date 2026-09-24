# 单人 · 双机 · 多账号 代码同步流程（《逆道西行》）

> **场景**：同一个人，一台在**家**、一台在**单位**，两台机器轮流开发。
> 两台机器各自登录**不同的 WorkBuddy / Trea / 豆包账号**（这不影响 git）。
> 仓库根：本机 `D:/xiyou/demo`（其他机器路径可不同）；远端 `origin`=GitHub、`gitee`=Gitee 镜像（**共用一个账号**）。
> 配套脚本：`scripts/_git_sync.sh`

---

## 〇、拓扑（一句话）

```
        同一把 SSH 公钥 / 同一个 GitHub+Gitee 账号
                        │
        ┌───────────────┴───────────────┐
   🏠 家里电脑 (账号A)              🏢 单位电脑 (账号B)
   D:/xiyou/demo                   D:/xiyou/demo
        │  push                          │  push
        └──────────► GitHub ◄────────────┘
                      (main)
              Gitee 镜像（国内备用）
```

**关键：GitHub / Gitee 只用一个账号；两台机器各自生成一把 SSH 密钥，两把都加进这同一个账号。不需要协作者、不需要 Fork+PR。**

---

## 一、已拍板的策略（2026-09-24）

| 决策 | 结论 |
|---|---|
| D1 仓库可见性 | **改 private**（需在 GitHub 网页点一下，见 §5.3） |
| D2 美术入库策略 | **方案 B**：图片**不入库**，走 `art_pack` 离线包；git 只装代码/文档/音频/视频 |
| D3 第二个账号 | ~~协作者~~ → **不适用**。两台电脑都是本人 → **共用一个 GitHub 账号**（见 §5.1） |

落地提交：`d119c2d chore(repo): 方案B入库清洗`。**HEAD 树 1482 → 846 文件，最大单文件 2.1MB。**

---

## 二、方案 B 的规则（一句话记住）

| 内容 | 存放位置 |
|---|---|
| `js/`、`css/`、`index.html`、`docs/`、`scripts/`、根级配置文件 | **git** |
| `audio/`、`video/`、`assets/sound/`、`assets/voice/`（音频） | **git** |
| `img/`（全部，1.8GB）、`assets/*.png`（Boss 底图等） | **art_pack 离线包** |
| `taptap_bundle/`（构建产物 539MB） | 各自本地生成，**两边都不要入库** |
| `.workbuddy/`（项目记忆） | 不入库，**手工搬**（见 §6） |

> ⚠️ 代价：**新机器 clone 后必须先 `artrestore` 才能跑游戏**（否则立绘/背景全 404）。

---

## 三、第二台电脑初始化（清单）

### 3.0 先跑体检

```bash
scripts/_git_sync.sh newmachine     # 身份 / 远端 / SSH / 美术 六项一键自检
```

### 3.1 传代码：二选一

**A. U 盘 / 局域网（快，推荐）** —— 避开 `.git` 1.9GB 的网络下载：

```bash
# 家里电脑上
scripts/_git_sync.sh bundle D:/xiyou_full.bundle       # 全量仓库（含历史）
# 拷到单位电脑后：
git clone "D:/xiyou_full.bundle" D:/xiyou/demo
cd D:/xiyou/demo
git remote set-url origin git@github.com:madaqqaz/xiyou.git
git remote add gitee git@gitee.com:madaqqaz/xiyou.git
```

**B. 纯网络** —— 浅克隆省时间（只有代码/文档，约 200MB）：

```bash
git clone --depth 1 git@github.com:madaqqaz/xiyou.git D:/xiyou/demo
```

### 3.2 传美术：必须做，否则游戏跑不起来

```bash
# 家里电脑：打包 img/ + assets 根图片（约 1.8GB，未压缩 tar，拷得快）
scripts/_git_sync.sh artpack D:/xiyou_artpack.tar
# 把 xiyou_artpack.tar 拷到单位电脑，然后：
cd D:/xiyou/demo
scripts/_git_sync.sh artrestore D:/xiyou_artpack.tar   # 带 sha256 校验，损坏即中止
```

日常只改了少量图时，不必重打全包，直接增量同步整个 `img/`：

```powershell
robocopy D:\xiyou\demo\img \\OTHER-PC\xiyou\img /MIR /Z /R:2 /W:2
```

### 3.3 配身份（两台机器**各设一次**）

```bash
# 单位电脑（举例：用"@单位"标记提交来源，邮箱必须是 GitHub 账号的邮箱）
scripts/_git_sync.sh identity "马达@单位" "你的真实邮箱"
# 家里电脑
scripts/_git_sync.sh identity "马达@家"   "你的真实邮箱"
```

> 两台的 `user.name` 可以不同（便于在 GitHub 上区分是哪台机器提交的），
> 但 **`user.email` 必须是 GitHub 账号里已验证的邮箱**，否则提交不会归属到你的账号。
> 不知道用哪个邮箱？GitHub → Settings → Emails 里任选一个已验证的，或直接用
> 「Keep my email addresses private」给出的 `你的ID+用户名@users.noreply.github.com`。

### 3.4 配 SSH（两台机器各一把密钥，都加到同一个账号）

```bash
# 1) 本机生成（家里那把已有就跳过）
ssh-keygen -t ed25519 -C "你的邮箱" -f ~/.ssh/id_ed25519

# 2) 打印公钥，整行复制
cat ~/.ssh/id_ed25519.pub
```

- 贴到 **GitHub** → Settings → SSH and GPG keys → New SSH key
- 同一行再贴到 **Gitee** → 设置 → 安全设置 → SSH 公钥

首次连 Gitee 若报 `Host key verification failed`，在**你自己的终端**里跑一次（写 `~/.ssh` 需在普通终端，AI 会话被文件保护层拦为 EPERM）：

```bash
ssh-keyscan -t ed25519 gitee.com >> ~/.ssh/known_hosts
```

验证：

```bash
ssh -T git@github.com     # 期望：Hi madaqqaz! You've successfully authenticated...
ssh -T git@gitee.com      # 期望：Hi ...! You've successfully authenticated...
```

> **Gitee 只是国内备用镜像**：GitHub 通了就能干活；Gitee 没通不影响。

---

## 四、日常循环（单人双机 · 极简版）

**默认策略：直接在主分支 `main` 上干活，靠「开工先 pull、收工即 push」保证两台机器一致。**

```bash
# ── 到单位开机第一件事 ──
cd D:/xiyou/demo
scripts/_git_sync.sh status           # 看是否落后
scripts/_git_sync.sh pull             # 拉最新代码（工作区须干净）

# ── 干活 ──
# …改代码…

# ── 收工前 ──
git add js css index.html docs scripts    # ⚠️ 严禁 git add -A / git add .
scripts/_git_sync.sh check
git commit -m "fix(battle): 描述"
scripts/_git_sync.sh push                 # 同时推 GitHub + Gitee
```

**什么时候才需要开分支？** 只有一种情况：两台机器**同时**在写**不同功能**（比如单位改 A、家里改 B，一天内都要合）。这时各开一条机器分支，走 PR 合并：

| 机器 | 分支名 |
|---|---|
| 单位电脑 | `pc-work/功能名` |
| 家里电脑 | `pc-home/功能名` |

```bash
git checkout -b pc-work/fix-battle-balance
# …改代码、commit…
scripts/_git_sync.sh push pc-work/fix-battle-balance
# GitHub 上开 PR → 合并到 main → 另一台 _git_sync.sh pull
```

**冲突预防三原则**（单人双机最容易踩的坑）：
1. 不把同一台机器上没提交的改动丢在一边就换机器开工 —— 先 commit + push 再走人；
2. 编辑器别开着自动保存 + 自动格式化在后台改文件（会让工作区莫名其妙变脏）；
3. 换机器前 `scripts/_git_sync.sh status` 看一眼「未跟踪/未暂存」是不是 0。

---

## 五、账号相关答疑

### 5.1 「两台电脑能共用一个 GitHub 账号吗？」

**你的情况（两台都是你自己）→ 可以，而且这是推荐做法。**

- 同一个账号在两台机器上 clone / push 是标准用法，**不需要加协作者**；
- 每台机器**各生成一把 SSH 密钥**，两把都加到同一账号 —— 谁推的一目了然，需要时还能单独撤销某一把；
- 两台机器的 `user.email` 用**同一个真实邮箱**，`user.name` 可以用 `马达@家` / `马达@单位` 区分；
- 唯一代价：GitHub 上的提交人都是你（本来就是同一个人，无所谓）。

**「那我能不能共用账号给别人？」→ 不能。**

1. GitHub 服务条款是「一人一账号」，共享账号属违规，有被限制风险；
2. 对方拿到的是你**整个账号**（不止这个仓库，还能看你其他私有仓库）；
3. 出事无法追溯。

真要给别人协作权限 → 仓库 → Settings → Collaborators 加人（只给这一个仓库的权限）。
Gitee 同理：仓库 → 管理 → 仓库成员管理 → 角色选「开发者」。

### 5.2 两个 WorkBuddy / Trea / 豆包账号的关系

这三套账号与 git **完全无关**，共用一个 GitHub 账号不受影响。
但要注意：**两个 WorkBuddy 账号的「技能库 + 长期记忆」互不相通**（各自独立存在 `~/.workbuddy/`），
项目记忆 `.workbuddy/memory/` 又被 `.gitignore` 排除、不随 git 走 → 见 §6，需要手工搬一次。

### 5.3 改 private（D1）

网页操作最快：仓库 → **Settings** → 最下方 **Danger Zone** → **Change repository visibility** → Make private → 按提示输入仓库名确认。

> 需要我用接口改的话，给我一个有 `repo` 权限的 GitHub 个人访问令牌（PAT）；SSH 凭据只能推代码，改不了仓库设置。

---

## 六、两个 WorkBuddy 账号的数据同步（手工，一次性）

git 里没有这些东西（`.workbuddy/` 被忽略），所以换账号/换机器时它们不会跟过去：

| 内容 | 位置 | 说明 |
|---|---|---|
| 用户级技能库 | `~/.workbuddy/skills/` | 例如 `xiyou-doc-truth-sync` 等自定义 skill |
| 用户级长期记忆 | `~/.workbuddy/MEMORY.md` | 跨项目的偏好与约定 |
| 项目记忆 | `<仓库>/.workbuddy/memory/` | 每日工作日志 + 项目 MEMORY.md |

搬一次（PowerShell，把 U 盘盘符换成你的）：

```powershell
# 单位电脑 → U 盘
robocopy "$env:USERPROFILE\.workbuddy\skills"   "E:\wx\skills"   /MIR /Z /R:1 /W:1
robocopy "$env:USERPROFILE\.workbuddy"          "E:\wx\root"     MEMORY.md /Z /R:1 /W:1
robocopy "D:\xiyou\demo\.workbuddy\memory"      "E:\wx\projmem"  /MIR /Z /R:1 /W:1

# 家里电脑 ← U 盘
robocopy "E:\wx\skills"   "$env:USERPROFILE\.workbuddy\skills"   /E /Z /R:1 /W:1
robocopy "E:\wx\projmem"  "D:\xiyou\demo\.workbuddy\memory"      /E /Z /R:1 /W:1
copy "E:\wx\root\MEMORY.md" "$env:USERPROFILE\.workbuddy\MEMORY.md"
```

> 项目记忆里如果写了绝对路径（本机是 `C:/Users/马达/...`、`D:/xiyou/demo`），换机器后路径不同属正常，读的时候按当前机器理解即可。

---

## 七、三条铁律

1. **永远不要 `git add -A` / `git add .`**
   工作区有 1.8GB `img/` + 539MB `taptap_bundle/`，全量 add 会瞬间把仓库撑爆。
   → 只 add 具体目录：`git add js css index.html docs scripts`。
2. **`img/`、`taptap_bundle/`、`assets/*.png` 永久不入库**（`.gitignore` 已锁）。
3. **提交前跑 `scripts/_git_sync.sh check`** —— 会拦 `img/`、构建产物、≥95MB 大文件、归档/PSD。

---

## 八、常见故障

| 现象 | 原因 | 处理 |
|---|---|---|
| 新机 clone 后立绘全 404 | 美术不在 git 里 | `scripts/_git_sync.sh artrestore <artpack.tar>` |
| 推送被拒 `fetch first` | 另一台机器推过新提交 | `scripts/_git_sync.sh pull` 后再 push |
| `Host key verification failed`（gitee） | known_hosts 缺主机密钥 | 普通终端跑 `ssh-keyscan -t ed25519 gitee.com >> ~/.ssh/known_hosts` |
| `Permission denied (publickey)`（gitee） | 公钥没加到 Gitee | 把 `~/.ssh/id_ed25519.pub` 贴进 Gitee → SSH 公钥 |
| 提交人不显示在 GitHub | 邮箱是占位符 / 不是账号邮箱 | `scripts/_git_sync.sh identity "名字" "真实邮箱"`；未推送的提交可 `git commit --amend --reset-author` |
| `git status` 上万条 | 构建产物/美术 | 用 `git status -uno`；确认 `.gitignore` 生效 |
| 推送被拒 `exceeds 100MB` | 大文件入库 | `git reset -- <file>` 后加 `.gitignore` |
| clone 卡在下载 | `.git` 有 1.9GB 历史 | 用 `--depth 1`，或用 `bundle` 走 U 盘 |
| 两台改了同一文件、冲突 | 同时改同处 | 冲突方 `git pull --rebase` 解冲突；或改用 §4 的机器分支 + PR |
| worktree 合并后 `img/` 变小 | WorkBuddy worktree 与主仓库共用 `.git`，merge 会按索引状态重写工作区 | 合并后 `scripts/_git_sync.sh artrestore` 恢复美术 |

---

## 九、脚本速查

```bash
scripts/_git_sync.sh status                    # 体检：分支 / 领先落后 / 脏文件统计
scripts/_git_sync.sh pull                      # 从 origin rebase 拉取（工作区须干净）
scripts/_git_sync.sh push [branch]             # 同时推 origin 与 gitee
scripts/_git_sync.sh check                     # 提交前自检
scripts/_git_sync.sh bundle <path>             # 打全量 git bundle 搬机
scripts/_git_sync.sh artpack [out.tar]         # 打包美术离线包（img/ + assets 图片）
scripts/_git_sync.sh artrestore <tar>          # 恢复美术（带 sha256 校验）
scripts/_git_sync.sh identity <名字> <邮箱>     # 设置本机 git 身份
scripts/_git_sync.sh newmachine                # 新机器初始化清单（六项自检）
```

---

*最后更新：2026-09-24（单人双机拓扑定稿）*
