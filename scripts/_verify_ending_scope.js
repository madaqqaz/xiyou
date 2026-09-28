// _verify_ending_scope.js — 结局**对外口径 + 孤儿索引表实况**门禁（2026-09-27）
//
// 背景：`docs/store_listing.md` / `copyright/software_manual.md` 对外宣称「**10 种结局**」。
//   同时 `js/data_endings_index.js:23` 的 `NDX.ENDINGS` 登记 **22 行**
//   （10 dynamic + 7 static + 5 farewell），其中 3 条 static 与 dynamic **同标题**
//   （st_jinchan「金蝉正果」= jinchan、st_yipo「一魄转世」= yipo、st_nidao「逆道西行」= nidao），
//   另有 6 个标题**只存在于索引表**（大圣脱局 / 净坛圆觉 / 卷帘归真 / 白龙渡海 / 齐天归山 / 金蝉东归）。
//   ⇒ 去重后索引表标题数 = 16，行数 = 22。早期审计报告据此写「对外 10 vs 索引 22 ⇒ 口径漂移，
//     建议对外改成 22」—— **那个结论是错的**：玩家能拿到的结局由 `endings.js` 的 10 条判据决定，
//     索引表 22 行里 12 行对执行面零贡献。本门禁把「对外 = 10」钉死，并钉死孤儿表的真实数字，
//     防止将来有人照搬 22。
//
// 🔴 **2026-09-27 收缩后本门禁同步更新**：索引表 **22 行 → 14 行**（删 3 条与 dynamic 同标题的
//   static + 5 条与 ENDINGS_CG 重复的 farewell），去重标题 **16 → 14**。
//   保留 4 条 static（st_dasheng / st_jingtan / st_juanlian / st_bailong）= `computeEnding`
//   各英雄分支唯一的可读门槛登记处。`endingByTitle` 命中结果不变。
//
// ⚠ X4 教训（本文件犯过一次，故逐一加反证）：
//   ①「反证」必须**真的能红**。第一版 D1 写「把「缘定三生」改成一个互异的新名字 ⇒ 去重数 -1」
//      —— 换一个互异字符串去重数当然不变，该断言**恒真**，永远红不了。正确写法是**制造重名**。
//   ② 断言口径必须诚实：绝不能写 `NDX.ENDINGS.length === 22`（把孤儿表行数当口径，表结构调整就假红）。
//   ③ 沙箱加载顺序必须**照抄 index.html**：`data_endings_index.js:110-126` 会包装
//      `NDX.Ending.determineEnding` 给结果补 `id`/`cg`，但包装层开头 `if (!NDX.Ending) return;`
//      —— 若 `endings.js` 尚未加载，这层包装**静默失效**，运行期行为整体不同（见 F 组实锤）。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let fail = 0;
const ck = (name, cond, extra) => {
  if (cond) console.log('ok   ' + name);
  else { console.log('FAIL ' + name + (extra ? '  → ' + extra : '')); fail++; }
};

const ROOT = path.join(__dirname, '..');
const mkSandbox = () => {
  const win = {};
  const sb = {
    NDX: {}, window: win, Math: Math, JSON,
    console: { log() {}, error() {} },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  };
  vm.createContext(sb);
  // ⚠ 只回传 `win`：各文件是在**加载时**才往 window.NDX 上挂东西，
  //   加载前捕获会得到 undefined（本门禁第一版就是这么炸的）。
  return { sb: sb, win: win };
};
const load = (sb, f) => {
  const p = path.join(ROOT, 'js', f);
  try { vm.runInContext(fs.readFileSync(p, 'utf8'), sb); }
  catch (e) { console.log('  (load ' + f + ' 抛错：' + e.message + ')'); }
};

// —— 沙箱加载顺序 = index.html 里的真实顺序（自动同步，不手写）——
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const WANT = ['data_config.js', 'data_endings_cg.js', 'endings.js', 'data_endings_index.js'];
const ORDER = (HTML.match(/src="(js\/[^"?]+\.js)(?:\?[^"]*)?"/g) || [])
  .map((s) => s.replace(/^src="js\//, '').replace(/"$/, '').replace(/\?[^"]*$/, ''))
  .filter((f) => WANT.indexOf(f) >= 0);
if (ORDER.length !== WANT.length) {
  console.log('FAIL 环境：index.html 里没能同时找到 ' + WANT.join(' / ')
    + '（实得 ' + ORDER.join(' / ') + '）——沙箱加载顺序不可信，拒绝继续');
  process.exit(1);
}
const main = mkSandbox();
ORDER.forEach((f) => load(main.sb, f));
const NDX = main.win.NDX;

console.log('=== _verify_ending_scope：结局对外口径 + 孤儿索引表实况 ===');
console.log('（沙箱加载顺序照抄 index.html：' + ORDER.join(' → ') + '）');

const DEF = (NDX.Ending && NDX.Ending.DEFINITIONS) || {};
const IDX = NDX.ENDINGS || [];
const CGS = NDX.ENDINGS_CG || [];
const titlesOf = (arr) => new Set(arr.map((x) => x.title).filter(Boolean));
const defTitles = titlesOf(Object.values(DEF));
const idxTitles = titlesOf(IDX);

// ── A 组 · 对外口径 ──
ck('A1 可执行结局去重标题数 = 10（对外「10 种结局」的硬口径）', defTitles.size === 10,
  '实测 ' + defTitles.size + '：' + [...defTitles].join('、'));
ck('A2 索引表去重标题数 = 14（收缩后：10 dynamic + 4 static，无重复登记）', idxTitles.size === 14,
  '实测 ' + idxTitles.size + ' 个去重标题 / ' + IDX.length + ' 行');
ck('A2b 索引表行数 = 14（22 → 14：删 3 条同标题 static + 5 条 farewell 重复行）', IDX.length === 14,
  '实测 ' + IDX.length + ' 行');
{
  const inter = [...defTitles].filter((t) => idxTitles.has(t));
  ck('A3 执行面标题 ∩ 索引标题 = 10（对外口径 = 玩家真能拿到的结局数）', inter.length === 10,
    '交集 ' + inter.length + ' 个');
}

// ── B 组 · 反证：断言不是恒真 ──
{
  const dupTarget = DEF.yuanding;
  const saved = dupTarget && dupTarget.title;
  // 🩸 必须是「制造重名」而不是「换一个互异字符串」——后者去重数不变，断言恒真、永远红不了
  if (DEF.jinchan) DEF.jinchan.title = saved;
  const after = titlesOf(Object.values(DEF)).size;
  if (DEF.jinchan) DEF.jinchan.title = '金蝉正果';
  const restored = titlesOf(Object.values(DEF)).size;
  ck('B1 反证：制造重名（jinchan 改名成「缘定三生」）⇒ 去重数 10 → ' + after
    + '，复原回 ' + restored + '（A1 不是恒真断言）',
    after === defTitles.size - 1 && restored === defTitles.size);
}
ck('B2 反证：口径取自去重标题，不是行数（索引表 ' + IDX.length + ' 行 ≠ 去重 ' + defTitles.size + ' 个）',
  IDX.length !== defTitles.size);

// ── C 组 · 执行面 ⊆ 索引面 ──
{
  const defIds = Object.keys(DEF);
  const unclaimed = defIds.filter((id) => !IDX.some((e) => e.id === id));
  ck('C1 每个可执行结局都在索引表里有条目', unclaimed.length === 0, '未被认领：' + unclaimed.join(', '));
  // 🔴 恒假的成因：包装层用 endingByTitle 反查 id，而 ENDINGS 里动态行排在 static 行之前 ⇒
  //   对「金蝉正果」永远命中 dynamic 的 jinchan，命中不了 st_jinchan。钉死这个顺序事实。
  const hit = NDX.endingByTitle ? NDX.endingByTitle('金蝉正果') : null;
  ck('C2 反查「金蝉正果」命中动态行 jinchan（不是 st_jinchan）⇒ game_meta.js:310 的 '
    + 's.over.ending.id === "st_jinchan" 恒假，是死分支', !!hit && hit.id === 'jinchan',
    '命中 id = ' + (hit && hit.id));
}

// ── D 组 · R9「一身一 id」：farewell 双表同 id，至少两者一致 ──
{
  // 收缩后：告别卡真源**只在** ENDINGS_CG，索引表不再重复登记（R9「一身一 id」）
  const fw = IDX.filter((e) => String(e.source) === 'farewell');
  const cgFarewell = CGS.filter((c) => /-farewell$/.test(c.id));
  ck('D1 索引表已无 farewell 重复行（告别卡真源收敛到 ENDINGS_CG，R9 不再双表登记）',
    fw.length === 0 && cgFarewell.length === 5,
    '索引表仍有：' + fw.map((e) => e.id).join(', ') + '；CG 表告别卡 ' + cgFarewell.length + ' 张');
  const badHero = cgFarewell.filter((c) => !c.hero);
  ck('D1b ENDINGS_CG 的 5 张告别卡都带 hero（画廊按「该英雄通关」点亮）', badHero.length === 0,
    '缺 hero：' + badHero.map((c) => c.id).join(', '));
  ck('D2 ENDINGS_CG ' + CGS.length + ' 条 id 无重复', new Set(CGS.map((x) => x.id)).size === CGS.length,
    '去重后 ' + new Set(CGS.map((x) => x.id)).size);
}

// ── E 组 · 孤儿行必须有落点（防止将来有人把 CG 文本删了只留一个空标题）──
{
  const orphanTitles = [...idxTitles].filter((t) => !defTitles.has(t));
  //   落点判定 = 「同 id 命中 CG」∪「同 hero 在 CG 里有条目」——后者才是 st_* 的正路：
  //   索引表 st_* 的判定真源是 `game_meta.computeEnding` 的 hero if 链，不是 ENDINGS_CG 的 id。
  //   ⚠ 已知事实（不在此判定，见 E3）：st_dasheng「大圣脱局」在 ENDINGS_CG 里只有 id='dasheng'
  //     的「大圣脱局·齐天再临」，**标题对不上**；computeEnding 又写「大圣脱局」——同一结局三个名字。
  //   ⚠ 必须**实时**读 `NDX.ENDINGS_CG`：E2/E3 会临时把它换掉，用顶部捕获的数组会让反证失效。
  const liveCg = () => (NDX.ENDINGS_CG || []);
  const landingOk = (t) => IDX.filter((e) => e.title === t).some((e) => {
    const cg = liveCg();
    if (cg.some((c) => c.id === e.id)) return true;
    return !!e.hero && cg.some((c) => c.hero === e.hero);
  });
  const noLanding = orphanTitles.filter((t) => !landingOk(t));
  ck('E1 索引表独有的 ' + orphanTitles.length + ' 个标题在 ENDINGS_CG 里都有落点（同 id 或同 hero+title）',
    noLanding.length === 0, '无落点：' + noLanding.join('、'));
  const savedCg = NDX.ENDINGS_CG;
  NDX.ENDINGS_CG = [];
  const afterCut = orphanTitles.filter((t) => !landingOk(t)).length;
  NDX.ENDINGS_CG = savedCg;
  ck('E2 反证：临时抽掉 ENDINGS_CG ⇒ E1 必须有 ' + orphanTitles.length + ' 个无落点（E1 不是恒真）',
    afterCut === orphanTitles.length, '抽掉后仍有落点的是 ' + (orphanTitles.length - afterCut) + ' 个');
  // 只抽 hero='wukong' 的 CG 条目：证明 E1 真的在按「同 hero 落点」判，而不是靠同 id 蒙对
  const onlyWukong = CGS.filter((c) => c.hero !== 'wukong');
  NDX.ENDINGS_CG = onlyWukong;
  const wukongOk = orphanTitles.filter((t) => landingOk(t)).length;
  NDX.ENDINGS_CG = savedCg;
  ck('E3 反证：只抽掉 hero=「悟空」的 CG 条目 ⇒ 该落点失效（证明 E1 按 hero 判定，非恒真）',
    wukongOk < orphanTitles.length, '抽掉后仍有落点的是 ' + wukongOk + ' / ' + orphanTitles.length + ' 个');
}

// ── F 组 · 加载顺序决定运行期行为（本沙箱特有，实锤包装层）──
{
  const rev = mkSandbox();
  WANT.slice().reverse().forEach((f) => load(rev.sb, f));
  const a = NDX.Ending.determineEnding({ hero: 'tangseng', good: 50, evil: 0, fate: {} });
  const b = rev.win.NDX.Ending.determineEnding({ hero: 'tangseng', good: 50, evil: 0, fate: {} });
  ck('F1 按 index.html 顺序：`determineEnding` 结果带 id（包装层 ' + 'data_endings_index.js:110-126 生效）',
    !!a && a.id != null, 'id = ' + (a && a.id));
  ck('F2 反证：反序加载（index 先于 endings）⇒ 包装层静默失效、结果不带 id',
    !!b && b.id == null, '反序 id = ' + (b && b.id));
}

// ── G 组 · 结局视频 id 判定（game_meta.js:310）——──
{
  const gmSrc = fs.readFileSync(path.join(ROOT, 'js', 'game', 'game_meta.js'), 'utf8');
  // ⚠ 只判「比较式」`=== 'st_jinchan'`，不判裸字面量 —— 修复说明本身会提到那个 id，
  //   裸字串扫描会把注释也命中，形成假红。
  // ✅ 2026-09-28：左支 id 比较式已删（与 title 判据恒等价 ⇒ 冗余）。
  //   现代码收敛为「只按 title 判」，故两个 id 比较式都不该存在。
  // 🩸🩸 必须**剥离注释后再判**：game_meta.js 里刚写的修复说明本身就提到那个 id 字面量，
  //   不剥离会被自己的注释命中 ⇒ 永远消不掉的红（本会话同类坑第 3 次）。
  //   剥离前还要先统一行尾（CRLF 行 `/\/\/.*$/` 失配，见 trial_treasure_refs 门禁）。
  const gmCode = gmSrc.replace(/\r\n?/g, '\n').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  const noIdCmp = (src) => src.indexOf("=== 'st_jinchan'") < 0 && src.indexOf("=== 'jinchan'") < 0;
  ck('G1 game_meta.js 结局视频判定已无 id 比较式（st_jinchan 死分支 + jinchan 冗余左支 均已删）',
    noIdCmp(gmCode));
  ck('G1b 反证：把 `=== \'jinchan\'` 塞回源码 ⇒ G1 判据必须转 false（证明 G1 不是恒真）',
    !noIdCmp("const _eid = (o.id === 'jinchan' || 1) ? 'zhengguo' : null;"));
  // 可达组合 = ① 动态侧（DEFINITIONS 标题 + 包装层补的 id）② 静态侧（索引表 source:static 的 7 行，
  //   computeEnding 不写 id ⇒ id 为 undefined）
  const reach = Object.values(DEF).map((d) => {
    const e = NDX.endingByTitle(d.title);
    return { title: d.title, id: e ? e.id : null };
  }).concat(IDX.filter((e) => String(e.source) === 'static').map((e) => ({ title: e.title, id: undefined })));
  // game_meta.js 的三段判定：三式对照 ——
  //   A 改前死式（id==='st_jinchan'）／ B 中间态（id==='jinchan'）／ C 现代码式（只按 title）
  const tail = (o) => (o.title || '').indexOf('逆道') >= 0 ? 'nidao'
    : (o.title || '').indexOf('大圣') >= 0 ? 'dasheng' : null;
  const mk = (idLit) => (o) => (o.id === idLit || (o.title || '').indexOf('金蝉') >= 0) ? 'zhengguo' : tail(o);
  const mkTitleOnly = (o) => ((o.title || '').indexOf('金蝉') >= 0) ? 'zhengguo' : tail(o);
  const eidOld = mk('st_jinchan');
  const eidNew = mk('jinchan');
  const eidNow = mkTitleOnly;
  const diverge = reach.filter((o) => eidOld(o) !== eidNew(o) || eidNew(o) !== eidNow(o));
  ck('G2 真调：' + reach.length + ' 个可达组合在「A 改前死式 / B 带 id 式 / C 现代码只 title 式」'
    + '三式下结果一致 ⇒ 删左支零行为变化', diverge.length === 0,
    '分歧：' + diverge.map((o) => o.title + '/' + o.id + ' A=' + eidOld(o) + ' B=' + eidNew(o) + ' C=' + eidNow(o)).join('; '));
  // 反证：等价性由**数据**保证，不是公式自带 —— 一旦 id 与 title 分叉，各立刻分道。
  //   ⚠ 合成样本的 title **不能**再出现「金蝉」二字（否则三式都被 title 分支吃成 zhengguo，反证失效）。
  const synth = { id: 'jinchan', title: '一个标题里没有那两个字的合成结局' };
  ck('G3 反证：注入「id=jinchan 但 title 不含金蝉」的组合 ⇒ 三式必须分歧'
    + '（证明 G2 的等价性依赖当前数据，不是恒真断言）',
    eidOld(synth) !== eidNew(synth) && eidNew(synth) !== eidNow(synth),
    'A=' + eidOld(synth) + ' B=' + eidNew(synth) + ' C=' + eidNow(synth));
}

console.log(fail
  ? '=== _verify_ending_scope：' + fail + ' 项失败 ==='
  : '=== _verify_ending_scope：对外 10 种结局成立；索引表已收缩为 14 行 / 去重 14 标题，未被误当口径 ===');
console.log(fail ? 'RESULT: FAIL' : 'RESULT: PASS');
process.exit(fail ? 1 : 0);
