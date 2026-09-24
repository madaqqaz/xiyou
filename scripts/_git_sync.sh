#!/usr/bin/env bash
# =============================================================================
#  _git_sync.sh —— 《逆道西行》双远端 / 双机协作同步助手
#  远端：origin = GitHub (ssh)   |   gitee = Gitee (https) 镜像
#  用法：
#    scripts/_git_sync.sh status            # 体检：当前分支 / 领先落后 / 脏文件统计
#    scripts/_git_sync.sh pull              # 从 origin 拉取并 rebase（工作区必须干净）
#    scripts/_git_sync.sh push [branch]     # 推送到 origin 与 gitee（同分支，快进）
#    scripts/_git_sync.sh check             # 提交前自检：大文件 / 构建产物 / 误入库 PNG
#    scripts/_git_sync.sh bundle <输出路径>  # 打全量 git bundle（U 盘/移动硬盘搬新机）
#  设计原则：只做加法与只读检查，不执行 reset --hard / clean / 强推。
# =============================================================================
set -euo pipefail

REMOTE_PRIMARY="origin"
REMOTE_MIRROR="gitee"
WARN_MB=20      # 单文件告警阈值(MB)
BLOCK_MB=95     # 单文件阻断阈值(MB) —— GitHub 硬限 100MB

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"
say()  { printf "\033[36m%s\033[0m\n" "$*"; }
ok()   { printf "\033[32m  ✓ %s\033[0m\n" "$*"; }
warn() { printf "\033[33m  ! %s\033[0m\n" "$*"; }
bad()  { printf "\033[31m  ✗ %s\033[0m\n" "$*"; }

cur_branch() { git rev-parse --abbrev-ref HEAD; }

cmd_status() {
  say "===== 仓库状态：$REPO_ROOT ====="
  local b; b="$(cur_branch)"
  echo "  当前分支      : $b"
  echo "  HEAD          : $(git log --oneline -1)"
  echo "  本机身份      : $(git config user.name) <$(git config user.email)>"
  [ "$(git config user.email)" = "madaqqaz@example.com" ] && \
    warn "邮箱是占位符 madaqqaz@example.com，GitHub/Gitee 无法归属提交，建议改成账号真实邮箱"

  echo ""
  say "----- 与远端的分叉 -----"
  git fetch -q "$REMOTE_PRIMARY" 2>/dev/null || warn "fetch $REMOTE_PRIMARY 失败（离线？）"
  for r in "$REMOTE_PRIMARY" "$REMOTE_MIRROR"; do
    local ref="$r/main"
    if git rev-parse --verify -q "$ref" >/dev/null; then
      local lr; lr="$(git rev-list --left-right --count "$ref...$b" 2>/dev/null || echo '? ?')"
      local behind ahead; behind="${lr%%$'\t'*}"; ahead="${lr##*$'\t'}"
      printf "  %-8s %s  ← 落后 %s / 领先 %s\n" "$r" "$(git log --oneline -1 "$ref")" "$behind" "$ahead"
    else
      warn "$r 无对应分支 $ref"
    fi
  done

  echo ""
  say "----- 工作区文件统计（git status -uno 看已跟踪）-----"
  local staged unstaged untracked
  staged=$(git diff --cached --name-only | wc -l)
  unstaged=$(git diff --name-only | wc -l)
  untracked=$(git ls-files --others --exclude-standard | wc -l)
  echo "  已暂存(将提交) : $staged"
  echo "  已改未暂存     : $unstaged"
  echo "  未跟踪         : $untracked"
  if [ "$staged" -gt 0 ]; then
    echo ""
    say "  暂存内容 Top 目录："
    git diff --cached --name-only | awk -F/ '{print $1}' | sort | uniq -c | sort -rn | head -8 | sed 's/^/    /'
  fi
}

cmd_pull() {
  local b; b="$(cur_branch)"
  if [ -n "$(git status --porcelain -uno)" ]; then
    bad "工作区有未提交改动，先 commit 或 stash，再 pull。"
    exit 1
  fi
  say "拉取 $REMOTE_PRIMARY/$b 并 rebase 到本地 $b ..."
  git pull --rebase "$REMOTE_PRIMARY" "$b"
  ok "完成。当前 $(git log --oneline -1)"
}

cmd_push() {
  local b="${1:-$(cur_branch)}"
  say "准备推送分支：$b"
  for r in "$REMOTE_PRIMARY" "$REMOTE_MIRROR"; do
    say "→ $r"
    if git push "$r" "$b:$b"; then ok "$r 推送成功"; else bad "$r 推送失败（多半是落后需先 pull --rebase）"; fi
  done
}

cmd_check() {
  say "===== 提交前自检 ====="
  local fail=0
  local Q=( -c core.quotepath=false )   # 中文路径原样输出，便于匹配
  local tmp="${TMPDIR:-/tmp}"
  local staged_txt="$tmp/_git_sync_staged.txt"
  local szfile="$tmp/_git_sync_sizes.txt"

  git "${Q[@]}" diff --cached --name-only > "$staged_txt"
  local n_staged; n_staged=$(grep -c . "$staged_txt" || true)
  say "  暂存文件数：$n_staged"
  if [ "$n_staged" -eq 0 ]; then warn "暂存区为空，无可提交内容"; return 0; fi

  # 1) 构建产物 / 第三方目录不该入库
  local bad_dirs
  bad_dirs="$(awk -F/ 'NF>1{print $1}' "$staged_txt" | sort -u \
              | grep -E '^(taptap_bundle|www|dist|godot_gameplay_attributes-master)$' || true)"
  if [ -n "$bad_dirs" ]; then
    while IFS= read -r d; do bad "暂存区含构建产物/第三方目录：$d/  → git reset -q -- $d"; done <<< "$bad_dirs"
    fail=1
  fi

  # 2) 大体积归档 / 设计源文件（docs/_归档 属正当文档归档，不在此列）
  local arch
  arch="$(grep -E '^img/_archive/|^img/美术资产归档|\.psd$|\.psb$|\.ai$|\.clip$|\.xcf$|/raw/|^_legacy' "$staged_txt" || true)"
  if [ -n "$arch" ]; then
    local n_arch; n_arch=$(printf '%s\n' "$arch" | grep -c .)
    warn "大体积归档/设计源文件共 $n_arch 个被暂存，不该入库（示例前 5 个）："
    printf '%s\n' "$arch" | head -5 | sed 's/^/      /'
    warn "清理：git reset -q -- img/_archive \"img/美术资产归档_逆道西行_2026-09-18\""
  fi

  # 3) 大文件：整个索引一次性批量取对象大小（单进程，避免逐文件 stat）
  git ls-files -s -z | tr '\0' '\n' \
    | awk -F'\t' 'NF>=2 {split($1,a," "); if (a[2] ~ /^[0-9a-f]+$/) print a[2]" "$2}' \
    | git cat-file --batch-check='%(objectsize) %(rest)' > "$szfile" 2>/dev/null || true

  if [ -s "$szfile" ]; then
    awk -v W="$WARN_MB" -v B="$BLOCK_MB" '
      {
        mb = $1 / 1048576;
        p  = substr($0, index($0, " ") + 1);
        if (mb < W) next;
        printf "%s\t%.0f\t%s\n", (mb >= B ? "BLOCK" : "WARN"), mb, p;
      }' "$szfile" > "$tmp/_git_sync_big.txt"
    local nbig; nbig=$(grep -c . "$tmp/_git_sync_big.txt" || true)
    if [ "$nbig" -gt 0 ]; then
      while IFS=$'\t' read -r lvl mb p; do
        if grep -Fxq "$p" "$staged_txt"; then
          if [ "$lvl" = "BLOCK" ]; then bad "阻断（本次将提交）${mb}MB  $p  ≥ ${BLOCK_MB}MB，远端会拒收"; fail=1
          else warn "偏大（本次将提交）${mb}MB  $p"; fi
        else
          printf "  · 仅索引内已存在（本次不提交）%sMB  %s\n" "$mb" "$p"
        fi
      done < "$tmp/_git_sync_big.txt"
    fi
    local maxmb; maxmb=$(awk 'BEGIN{m=0} {v=$1/1048576; if(v>m)m=v} END{printf "%.1f", m}' "$szfile")
    say "  已扫描索引文件数：$(grep -c . "$szfile")，最大单文件 ${maxmb}MB"
  fi

  # 4) 关键运行文件是否漏入库
  for f in assets/Boss.png css/style.css js/main.js index.html; do
    [ -f "$f" ] || continue
    git ls-files --error-unmatch "$f" >/dev/null 2>&1 || warn "运行必需但未入库：$f"
  done

  if [ "$fail" -eq 0 ]; then ok "自检通过，可以 commit"; else bad "自检未通过，修掉上面的 ✗ 再提交"; exit 1; fi
}

cmd_bundle() {
  local out="${1:?用法: scripts/_git_sync.sh bundle <输出路径，如 D:/xiyou_full.bundle>}"
  say "打包全量仓库（含历史，用于 U 盘/移动硬盘搬到新机器）..."
  git bundle create "$out" --all
  ok "已生成 $out"
  echo "  新机器上执行："
  echo "    git clone \"$out\" xiyou"
  echo "    cd xiyou"
  echo "    git remote set-url origin  git@github.com:madaqqaz/xiyou.git"
  echo "    git remote add  gitee      https://gitee.com/madaqqaz/xiyou.git"
}

case "${1:-status}" in
  status) cmd_status ;;
  pull)   cmd_pull ;;
  push)   shift; cmd_push "${1:-}" ;;
  check)  cmd_check ;;
  bundle) shift; cmd_bundle "${1:-}" ;;
  *) echo "用法: $0 {status|pull|push [branch]|check|bundle <path>}"; exit 2 ;;
esac
