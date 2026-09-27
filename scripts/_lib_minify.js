// _lib_minify.js — 发布包 JS 压缩助手（terser，可选步骤，仅作用于构建产物副本）
// 设计原则：源码零改动；同名覆盖 out 内 js 文件，index.html 无需改引用。
// 安全默认：不 mangle 顶层名（165 个经典脚本跨文件共享全局函数），只压缩+局部改名+去注释。
'use strict';
const fs = require('fs');
const path = require('path');

// terser 解析顺序：本地 node_modules → WorkBuddy 托管 workspace（与 Playwright 同源策略）
const CANDIDATES = [
  path.join(__dirname, '..', 'node_modules'),
  'C:/Users/马达/.workbuddy/binaries/node/workspace/node_modules',
];
let terser = null;
function loadTerser() {
  if (terser) return terser;
  for (const dir of CANDIDATES) {
    const p = path.join(dir, 'terser');
    if (fs.existsSync(p)) { terser = require(p); return terser; }
  }
  throw new Error('terser 未安装：node scripts/_install_terser 或手动装入 ' + CANDIDATES[1]);
}

// 压缩单文件（原地写回 dst）；语法无法安全压缩时原样复制并告警
async function minifyJsFile(src, dst) {
  const { minify } = loadTerser();
  const code = fs.readFileSync(src, 'utf8');
  try {
    const r = await minify(code, {
      compress: { passes: 2 },
      mangle: true,            // 默认不动顶层（toplevel 未开），跨文件全局名安全
      format: { comments: false, ascii_only: true },
    });
    if (r.code == null) throw new Error('terser 返回空');
    fs.writeFileSync(dst, r.code, 'utf8');
    return { ok: true, before: Buffer.byteLength(code), after: Buffer.byteLength(r.code) };
  } catch (e) {
    // 兜底：压不了的文件原样复制，绝不阻断构建
    fs.copyFileSync(src, dst);
    return { ok: false, before: Buffer.byteLength(code), after: Buffer.byteLength(code), err: String(e.message).slice(0, 120) };
  }
}

// 递归压缩目录内全部 .js（原地覆盖）
async function minifyJsTree(dir, log) {
  let before = 0, after = 0, n = 0, failed = 0;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) stack.push(p);
      else if (f.name.endsWith('.js')) {
        const r = await minifyJsFile(p, p);
        before += r.before; after += r.after; n++;
        if (!r.ok) { failed++; if (log) log('  ⚠ 未压缩(已原样保留): ' + path.relative(dir, p) + ' — ' + r.err); }
      }
    }
  }
  return { n, failed, before, after };
}

module.exports = { minifyJsFile, minifyJsTree };
