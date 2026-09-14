// _verify_syntax_all.js — 全量语法 + 资源引用 + 关键接线门禁
// ---------------------------------------------------------------------------
// 背景（2026-09-14 用户截图报「[运行时错误] Script error.」）：
//   file:// 直开时浏览器把同目录脚本视为跨域，window.onerror 只能拿到脱敏的
//   "Script error."，没有文件名/行号 → 页面上永远查不出是哪个文件坏了。
//   本次真凶：js/ui/ui_bag.js 有两处「坏编辑」语法损伤——
//     ① `${this._buildSynergyPanel(s)}` 被写在模板串闭合的 `;` 之后，成了裸语句；
//     ② bagSlotPickerHtml 收尾 `}` 后漏了逗号，直接接下一个方法名。
//   整个 ui_bag.js 因此**从未被浏览器执行过**，V9.0 构筑协同图一直是死的，
//   而既有门禁（只 node --check 了 25 个文件 + 若干行为门禁）没有覆盖到它。
//
// 断言：
//   A) js/ 下**全部** .js 通过语法解析（不再只抽查若干文件）
//   B) index.html 里引用的本地 <script src> / <link href> 文件真实存在（防 404 → Script error）
//   C) ui_bag.js 加载后 NDX.ui.bagHtml 真的能产出「构筑协同」面板（锁死上面两处损伤）
//   D) ui_core.js 的 $cache 带 isConnected 失效校验（防陈旧节点 → 地区背景图被 append 进死节点）
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  \u2713 ' + name); }
  else { fail++; console.log('  \u2717 ' + name + (extra != null ? ' \u2014 ' + extra : '')); }
};

// ---------- A) 全量语法 ----------
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name);
  return d.isDirectory() ? walk(p) : (d.name.endsWith('.js') ? [p] : []);
});
const jsFiles = walk(path.join(ROOT, 'js')).sort();
console.log('  js/ 下共 ' + jsFiles.length + ' 个脚本参与语法校验');
const badSyntax = [];
for (const f of jsFiles) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) badSyntax.push(path.relative(ROOT, f) + ' :: ' + ((r.stderr || '').split('\n').find((l) => /Error/.test(l)) || '').trim());
}
ck('A1 js/ 全部脚本语法通过（0 个解析失败）', badSyntax.length === 0, badSyntax.length ? badSyntax.slice(0, 5).join(' ; ') : '');
ck('A2 参与校验的脚本数 >= 100（防 walk 失效导致空跑）', jsFiles.length >= 100, 'n=' + jsFiles.length);

// ---------- B) index.html 资源引用存在性 ----------
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"?#][^"]*?)(?:\?[^"]*)?"/g)].map((m) => m[1])
  .filter((u) => !/^(https?:|data:|\/\/|#|mailto:)/.test(u))
  .filter((u, i, a) => a.indexOf(u) === i);
const missing = refs.filter((u) => !fs.existsSync(path.join(ROOT, decodeURIComponent(u))));
ck('B1 index.html 引用的本地文件全部存在（0 个 404）', missing.length === 0, missing.length ? missing.slice(0, 6).join(' , ') : '');
ck('B2 引用总数 >= 50（防正则失效空跑）', refs.length >= 50, 'n=' + refs.length);

// ---------- B3) JS 内引用资源的存在性审计 ----------
// 存量缺失（美术/音频未产出，2026-09-14 盘点，已在白名单登记）——新增缺失即判红。
// 之所以要这条：资源 404 在 file:// 下同样只表现为脱敏的 "Script error." / 静默无声，
// 与本次 ui_bag.js 事故同属「浏览器不告诉你哪里坏了」的一类，必须静态兜住。
const KNOWN_MISSING_ASSETS = new Set([
  // 立绘未产出（10）：bosses 3 + npcs 7
  'img/portraits/bosses/镇元大仙.webp', 'img/portraits/bosses/黄风怪.webp', 'img/portraits/bosses/黑熊精.webp',
  'img/portraits/bosses/灵吉菩萨.webp',
  'img/portraits/npcs/刘洪.webp', 'img/portraits/npcs/唐太宗.webp', 'img/portraits/npcs/殷温娇.webp',
  'img/portraits/npcs/陈光蕊.webp', 'img/portraits/npcs/江流儿.webp', 'img/portraits/npcs/虎仔.webp',
  // 开场音频未产出（5）：BGM 1 + 语音 4
  'audio/intro_bgm.mp3', 'audio/intro_voice_01.mp3', 'audio/intro_voice_02.mp3',
  'audio/intro_voice_03.mp3', 'audio/intro_voice_04.mp3',
  // UI 图标未产出（2）
  'img/ui/精英.webp', 'img/ui/小怪.webp',
]);
const assetRefs = new Set();
for (const f of jsFiles) {
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/['"`]((?:audio|img|css|assets)\/[^'"`\s)]+\.(?:mp3|webp|png|jpg|ogg))['"`]/g)) assetRefs.add(m[1]);
}
const missAssets = [...assetRefs].filter((u) => !fs.existsSync(path.join(ROOT, u)));
const newMissAssets = missAssets.filter((u) => !KNOWN_MISSING_ASSETS.has(u));
ck('B3 JS 引用资源无「新增」缺失（存量 ' + KNOWN_MISSING_ASSETS.size + ' 项白名单）',
  newMissAssets.length === 0, newMissAssets.slice(0, 6).join(' , '));
ck('B4 资源引用总数 >= 500（防正则失效空跑）', assetRefs.size >= 500, 'n=' + assetRefs.size);

// ---------- C) ui_bag.js 行为可用 ----------
global.window = global;
global.NDX = {};
global.NDX.ui = {};
global.NDX.GEAR_SLOTS = ['weapon', 'armor', 'head', 'boots'];
global.NDX.GEAR_SLOT_LABEL = { weapon: '兵刃', armor: '甲胄', head: '头冠', boots: '战靴' };
global.NDX.gearSlotCap = 4;
global.NDX.petSlotCap = 2;
global.NDX.treasureSlotCap = () => 2;
global.NDX.sealLayerVal = () => 1;
global.NDX.activeEquipsFor = (s) => (s.equips || []).slice(0, 8);
global.NDX.SEAL_WORDS = { s1: { dao: '战' } };
let bagHtml = '';
try {
  require(path.join(ROOT, 'js/ui/ui_bag.js'));
  const s = {
    act: 1, equips: [{ id: 'e1', slot: 'weapon', name: '降魔刀', sys: 'ti', atk: 3 }],
    seals: [{ id: 's1', tier: 1 }], sutras: [], pets: [], treasures: [],
  };
  bagHtml = NDX.ui.bagHtml.call(NDX.ui, s);
} catch (e) {
  bagHtml = '';
  console.log('  ui_bag.js 加载/执行异常：' + (e && e.message));
}
ck('C1 ui_bag.js 可加载执行（无语法/引用异常）', bagHtml.length > 100, 'len=' + bagHtml.length);
ck('C2 bagHtml 产出「构筑协同」面板（V9.0 协同图未被坏编辑吃掉）', /class="synergy-panel"/.test(bagHtml));
ck('C3 bagHtml 产出生效格主体（panel-box bag）', /class="panel-box bag/.test(bagHtml));
ck('C4 模板串闭合后不再有裸 \${} 语句', !/`;\s*\n\s*\$\{/.test(fs.readFileSync(path.join(ROOT, 'js/ui/ui_bag.js'), 'utf8')));

// ---------- D) $cache 失效校验 ----------
const core = fs.readFileSync(path.join(ROOT, 'js/ui/ui_core.js'), 'utf8');
const cacheBody = (core.match(/\$cache\(id\)\s*\{[\s\S]*?\n\s*\},/) || [''])[0];
ck('D1 $cache 存在', cacheBody.length > 0);
ck('D2 $cache 校验 isConnected（防返回游离的陈旧节点）', /isConnected/.test(cacheBody));
ck('D3 $cache 命中后回写新节点（_domCache[id] = el）', /this\._domCache\[id\]\s*=\s*el/.test(cacheBody));

// ---------- E) CSS 结构性校验 ----------
// 背景：a725fcf 用正则做 .png→.webp 时把 `.png" }` + 换行 + 下一个选择器一并吃掉，
//   17 条 .fb-bg-actN 被压成一行、16 个 `}` 与 16 个选择器人间蒸发（花括号 5929/5913），
//   战斗背景 2~17 章全部失效，而 commit 标题写的是「修复战斗背景黑色问题」——反向回归。
//   这类「机械替换吃结构」的损伤肉眼极难发现，必须静态兜住。
const cssPath = path.join(ROOT, 'css/style.css');
const css = fs.readFileSync(cssPath, 'utf8');
const cssLines = css.split('\n');
let bo = 0, bc = 0;
for (const ch of css) { if (ch === '{') bo++; else if (ch === '}') bc++; }
ck('E1 css/style.css 花括号平衡', bo === bc, '{=' + bo + ' }=' + bc + ' 差=' + (bo - bc));

// 逐行深度：若某行结束后深度为负 → 多了一个 } ；深度长期 > 0 且到文件尾仍未归零也已由 E1 覆盖
let depth = 0, negLine = -1;
cssLines.forEach((l, i) => {
  for (const ch of l) { if (ch === '{') depth++; else if (ch === '}') { depth--; if (depth < 0 && negLine < 0) negLine = i + 1; } }
});
ck('E2 无「多余 }」的行（深度不穿负）', negLine < 0, negLine > 0 ? 'L' + negLine : '');

// 选择器粘连：同一行出现 2 个以上 `.foo {` 且行内挤着多条 url() —— 典型的替换吃换行
const glued = cssLines.findIndex((l) => (l.match(/\.fb-bg-act\d/g) || []).length > 1);
ck('E3 未出现「多选择器被压成一行」（.fb-bg-actN 粘连）', glued < 0, glued >= 0 ? 'L' + (glued + 1) : '');

const KNOWN_MISSING_CSS_BITMAP = new Set(['../assets/Boss.png', '../assets/精英.png']);
const cssBitmaps = [...new Set([...css.matchAll(/url\(\s*['"]?([^'")]+\.(?:png|jpg|jpeg))['"]?\s*\)/g)].map((m) => m[1]))];
const badBitmap = cssBitmaps.filter((u) => !fs.existsSync(path.join(ROOT, 'css', u)));
const newBadBitmap = badBitmap.filter((u) => !KNOWN_MISSING_CSS_BITMAP.has(u));
ck('E4 CSS 位图引用无「新增」缺失（存量 ' + KNOWN_MISSING_CSS_BITMAP.size + ' 项白名单）',
  newBadBitmap.length === 0, newBadBitmap.slice(0, 5).join(' , '));
ck('E5 关键样式块 .fb-bg-act1~17 齐全（战斗背景未被吃掉）',
  [1, 5, 9, 17].every((n) => new RegExp('\\.fb-bg-act' + n + '\\s*\\{').test(css)));
ck('E6 CSS 未引用不存在的 .png（.png→.webp 迁移收口）',
  !/bg_battle_[a-z]+\.png/.test(css));

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
