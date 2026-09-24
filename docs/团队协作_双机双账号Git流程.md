# 双机 · 双账号 代码更新流程（《逆道西行》）

> 适用：在两台电脑 / 两个 GitHub-Gitee 账号之间同步本仓库的代码更新。
> 仓库根：本机 `D:/xiyou/demo`（分支 `main`）；远端 `origin`=GitHub、`gitee`=Gitee 镜像。
> 配套脚本：`scripts/_git_sync.sh`

---

## 〇、已拍板的策略（2026-09-24）

| 决策 | 结论 |
|---|---|
| D1 仓库可见性 | **改 private**（当前仍是 public，需在 GitHub 网页改，见 §5.3） |
| D2 美术入库策略 | **方案 B**：图片**不入库**，走 `art_pack` 离线包；git 只装代码/文档/音频/视频 |
| D3 第二个账号 | **协作者**（同一仓库加人）——若两台电脑属于**同一个人**，则无需加协作者，见 §5.1 |

落地提交：`d119c2d chore(repo): 方案B入库清洗`。**HEAD 树 1482 → 846 文件，最大单文件 2.2MB。**

---

## 一、方案 B 的规则（一句话记住）

| 内容 | 存放位置 |
|---|---|
| `js/`、`css/`、`index.html`、`docs/`、`scripts/`、根级配置文件 | **git** |
| `audio/`、`video/`、`assets/sound/`、`assets/voice/`（音频） | **git** |
| `img/`（全部，1.8GB）、`assets/*.png`（Boss 底图等） | **art_pack 离线包** |
| `taptap_bundle/`（构建产物 539MB） | 各自本地生成，**两边都不要入库** |

> ⚠️ 代价：**新机器 clone 后必须先 `artrestore` 才能跑游戏**（否则立绘/背景全 404）。

---

## 二、一次性清洗：已完成（记录备查）

```bash
git reset -q                                   # 撤掉误 add 的 2912 项暂存
git rm -r -q --cached --ignore-unmatch img     # 美术退出跟踪（磁盘文件保留）
git rm -q --cached --ignore-unmatch assets/*.png
git add .gitignore index.html js css docs scripts audio video assets/sound assets/voice
git add *.md *.ps1 *.bat *.json *.yaml .nojekyll platform
scripts/_git_sync.sh check                     # 自检：无 img / 无构建产物 / 无 ≥95MB 文件
git commit -m "chore(repo): 方案B入库清洗"
```

`check` 通过标准：暂存区不含 `img/`、不含 `taptap_bundle/`、单文件 < 95MB。

---

## 三、第二台电脑初始化

### 3.1 传代码：二选一

**A. U 盘 / 局域网（快，推荐）** —— 避开 `.git` 1.9GB 的网络下载：

```bash
# 本机
scripts/_git_sync.sh bundle D:/xiyou_full.bundle      # 全量仓库（含历史）
# 拷到新机后：
git clone "D:/xiyou_full.bundle" D:/xiyou/demo
cd D:/xiyou/demo
git remote set-url origin git@github.com:madaqqaz/xiyou.git
git remote add  gitee     https://gitee.com/madaqqaz/xiyou.git
```

**B. 纯网络** —— 浅克隆省时间：

```bash
git clone --depth 1 git@github.com:madaqqaz/xiyou.git D:/xiyou/demo
```

### 3.2 传美术：必须做，否则游戏跑不起来

```bash
# 本机：打包 img/ + assets 图片（约 1.8GB，未压缩 tar，拷得快）
scripts/_git_sync.sh artpack D:/xiyou_artpack.tar
# 会把 xiyou_artpack.tar 拷到新机，然后：
cd D:/xiyou/demo
scripts/_git_sync.sh artrestore D:/xiyou_artpack.tar   # 带 sha256 校验，损坏即中止
```

日常只改了少量图时，不必重打全包，直接覆盖对应目录即可（Windows 自带的增量复制）：

```powershell
robocopy D:\xiyou\demo\img \\OTHER-PC\xiyou\img /MIR /Z /R:2 /W:2
```

### 3.3 配身份（每台机器都要对）

```bash
cd D:/xiyou/demo
git config user.name  "该机器对应账号的用户名"
git config user.email "该账号在 GitHub/Gitee 绑定的真实邮箱"
```

> 本机当前是占位邮箱 `madaqqaz@example.com`，**GitHub 不会把提交算到你账号上**，请改成真实邮箱后：
> `git commit --amend --reset-author`（仅对未推送的提交）。

### 3.4 配凭据

- GitHub 走 **SSH**：`ssh-keygen -t ed25519 -C "邮箱"` → 把 `~/.ssh/id_ed25519.pub` 贴进**对应 GitHub 账号**的 Settings → SSH and GPG keys。
- Gitee 走 **HTTPS**：首次推送由 Git Credential Manager 弹窗登录（或用私人令牌）。

---

## 四、日常循环（关键纪律）

**核心：每台机器一个自己的分支，`main` 只做合并，禁止两端同时直推 `main`。**

| 机器 | 分支名 |
|---|---|
| 本机（马达） | `pc-a/功能名` |
| 第二台 / 账号 B | `pc-b/功能名` |

```bash
scripts/_git_sync.sh status                  # 开工先体检
git checkout -b pc-a/fix-battle-balance      # 首次；之后 git checkout 分支名

# 改代码…

git add js css index.html docs               # ⚠️ 严禁 git add -A / git add .
scripts/_git_sync.sh check
git commit -m "fix(battle): 描述"
scripts/_git_sync.sh push pc-a/fix-battle-balance   # 同时推 GitHub + Gitee

# 收工前同步主干
git checkout main && scripts/_git_sync.sh pull
```

合并：GitHub 上开 PR → 合并到 `main` → 另一台 `git checkout main && scripts/_git_sync.sh pull`。

---

## 五、账号相关答疑

### 5.1 「我能共用一个 GitHub 账号吗？」

分两种情况：

- **两台电脑都是你自己** → **完全可以**。同一个账号在两台机器上 clone/push 是标准做法，**不需要加协作者**，只要两台机器各自 `git config user.email` 用同一个真实邮箱即可。SSH key 每台机器各生成一个（都加到同一账号），互不影响。
- **第二个账号是另一个人** → **不要共用**：
  1. GitHub 服务条款是「一人一账号」，共享账号/密码属于账号共享，有被限制的风险；
  2. 安全性差——对方拿到的是**你整个账号**的权限（不止这个仓库，还能改你其他仓库、看你的私有仓库）；
  3. 出事无法追溯是谁推的（提交人全是你）。

  这种就用 **D3 协作者**：只有这一个仓库的写权限，提交人各归各的账号。

### 5.2 加协作者（D3 = 协作者）

- **GitHub**：仓库 → Settings → Collaborators and teams → Add people → 填对方用户名 → 对方邮箱收邀请 → 接受。
- **Gitee**：仓库 → 管理 → 仓库成员管理 → 添加成员 → 角色选「开发者」。

加完对方就能直接 push 到本仓库的分支（不能直推受保护的 `main`，除非你放开）。

### 5.3 改 private（D1）

网页操作最快：仓库 → **Settings** → 最下方 **Danger Zone** → **Change repository visibility** → Make private → 按提示输入仓库名确认。

> 需要我用接口改的话，给我一个有 `repo` 权限的 GitHub 个人访问令牌（PAT）；我当前的 SSH 凭据只能推代码，改不了仓库设置。

---

## 六、三条铁律

1. **永远不要 `git add -A` / `git add .`**
   工作区有 1.8GB `img/` + 539MB `taptap_bundle/`，全量 add 会瞬间把仓库撑爆。
   → 只 add 具体目录：`git add js css index.html docs`。
2. **`img/` 和 `taptap_bundle/` 永久不入库**（`.gitignore` 已锁）。
3. **提交前跑 `scripts/_git_sync.sh check`** —— 会拦 `img/`、构建产物、≥95MB 大文件、归档/PSD。

---

## 七、常见故障

| 现象 | 原因 | 处理 |
|---|---|---|
| 新机 clone 后立绘全 404 | 美术不在 git 里 | `scripts/_git_sync.sh artrestore <artpack.tar>` |
| `git status` 上万条 | 构建产物/美术 | 用 `git status -uno`；确认 `.gitignore` 生效 |
| 推送被拒 `exceeds 100MB` | 大文件入库 | `git reset -- <file>` 后加 `.gitignore` |
| 推送被拒 `fetch first` | 远端有新提交 | `scripts/_git_sync.sh pull` 后再 push |
| 提交人不显示在 GitHub | 邮箱是占位符 | 改真实邮箱后 `git commit --amend --reset-author` |
| clone 卡在下载 | `.git` 有 1.9GB 历史 | 用 `--depth 1`，或用 `bundle` 走 U 盘 |
| 两端改了同一文件 | 分支冲突 | 在 PR 里解冲突；本地 `git pull --rebase` |

---

## 八、脚本速查

```bash
scripts/_git_sync.sh status              # 体检：分支 / 领先落后 / 脏文件统计
scripts/_git_sync.sh pull                # 从 origin rebase 拉取（工作区须干净）
scripts/_git_sync.sh push [branch]       # 同时推 origin 与 gitee
scripts/_git_sync.sh check               # 提交前自检
scripts/_git_sync.sh bundle <path>       # 打全量 git bundle 搬机
scripts/_git_sync.sh artpack [out.tar]   # 打包美术离线包（img/ + assets 图片）
scripts/_git_sync.sh artrestore <tar>    # 恢复美术（带 sha256 校验）
```
