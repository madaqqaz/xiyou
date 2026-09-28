// _verify_ending_seen.js — 「已达成结局」持久化 + 结局图鉴门禁（2026-09-27 · B 方案）
//
// 背景：`NDX.ENDINGS` 索引表长期**零运行时消费者**（查询接口只被自家门禁读），立项动机
//   「让玩家看到还缺哪几个结局」从未兑现。B 方案把它接上：
//   · 存储：`NDX.storage.KEYS.ENDING_SEEN`（localStorage 跨局，只增不减 ⇒ **无需存档折算**）
//   · 写入端 3 处：`game_meta.settleReturn` / `game_lundao.lundaoChoose` / `game_event_2` 中途结局
//   · 读取端：`ui_misc_2.js` 藏经阁 CG 画廊下方插入 `NDX.endingCodexHtml()`
//
// ⚠ X4 纪律：每条断言都要能真红。反证一律用「构造违反输入」，不用静态文本计数冒充行为
//   （唯一例外是 D1 —— 它验证的是"三个写入端都接上了线"，性质同 `_verify_asset_version`）。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let fail = 0;
const ck = (name, cond, extra) => {
  if (cond) console.log('ok   ' + name);
  else { console.log('FAIL ' + name + (extra ? '  → ' + extra : '')); fail++; }
};

const ROOT = path.join(__dirname, '..');
// 受控 localStorage：让 storage.js 的 load/save 真跑起来（不是桩）
const mem = {};
const win = {};
const sandbox = {
  NDX: {}, window: win, Math: Math, JSON,
  console: { log() {}, error() {} },
  localStorage: {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null),
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: (k) => { delete mem[k]; },
    clear: () => { Object.keys(mem).forEach((k) => delete mem[k]); },
    length: 0, key: () => null,
  },
};
vm.createContext(sandbox);
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const WANT = ['data_config.js', 'data_endings_cg.js', 'endings.js', 'storage.js', 'data_endings_index.js'];
const ORDER = (HTML.match(/src="(js\/[^"?]+\.js)(?:\?[^"]*)?"/g) || [])
  .map((s) => s.replace(/^src="js\//, '').replace(/"$/, '').replace(/\?[^"]*$/, ''))
  .filter((f) => WANT.indexOf(f) >= 0);
ORDER.forEach((f) => {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'), sandbox); }
  catch (e) { console.log('  (load ' + f + ' 抛错：' + e.message + ')'); }
});
const NDX = win.NDX;

console.log('=== _verify_ending_seen：已达成结局持久化 + 结局图鉴 ===');
console.log('（沙箱加载顺序照抄 index.html：' + ORDER.join(' → ') + '）');

const reset = () => {
  Object.keys(mem).forEach((k) => delete mem[k]);
  if (NDX.storage) NDX.storage.remove(NDX.storage.KEYS.ENDING_SEEN);
};

// ── A 组 · 存储层真调 ──
reset();
ck('A1 初始未达成任何结局', NDX.endingSeenIds().length === 0, JSON.stringify(NDX.endingSeenIds()));
ck('A2 markEndingSeen({id,title}) 入簿并可读回',
  NDX.markEndingSeen({ id: 'jinchan', title: '金蝉正果' }) === true
  && NDX.endingSeenIds().indexOf('jinchan') >= 0);
{
  const before = NDX.endingSeenIds().length;
  ck('A3 反证：索引表不认的 id 必须拒绝入簿（防野条目）',
    NDX.markEndingSeen({ id: 'nope', title: '压根不存在的结局' }) === false
    && NDX.endingSeenIds().length === before,
    '长度 ' + before + ' → ' + NDX.endingSeenIds().length);
  ck('A4 幂等：重复标记同一结局不产生重复项',
    NDX.markEndingSeen({ id: 'jinchan', title: '金蝉正果' }) === true
    && NDX.endingSeenIds().length === before);
}
ck('A5 只带 title（computeEnding / 中途结局都不带 id）⇒ 按 title 反查补 id',
  NDX.markEndingSeen({ title: '大圣脱局' }) === true
  && NDX.endingSeenIds().indexOf('st_dasheng') >= 0,
  JSON.stringify(NDX.endingSeenIds()));
ck('A6 反证：只带 title 但索引表没这个标题 ⇒ 不入簿',
  NDX.markEndingSeen({ title: '论道·存留' }) === false);

// ── B 组 · 点亮判据 endingSeenFor（真调）──
reset();
{
  const dyn = NDX.endingById('yuanding');
  ck('B1 dynamic 未达成 ⇒ 不点亮', NDX.endingSeenFor(dyn) === false);
  NDX.markEndingSeen({ id: 'yuanding', title: '缘定三生' });
  ck('B1b dynamic 达成后 ⇒ 点亮', NDX.endingSeenFor(dyn) === true);
  // static 侧复用既有 clearedHeroes（不新存），桩掉它以控制输入
  const realCleared = NDX.clearedHeroes;
  const st = NDX.endingById('st_dasheng');
  NDX.clearedHeroes = () => ['wukong'];
  ck('B2 static 行按「该英雄通关」点亮（复用 clearedHeroes，不新存字段）',
    NDX.endingSeenFor(st) === true);
  NDX.clearedHeroes = () => ['tangseng'];
  ck('B3 反证：该英雄未通关 ⇒ static 行不点亮（B2 不是恒真）',
    NDX.endingSeenFor(st) === false);
  NDX.clearedHeroes = realCleared;
}

// ── C 组 · 图鉴渲染 endingCodexHtml（真调）──
reset();
{
  const realCleared = NDX.clearedHeroes;
  NDX.clearedHeroes = () => [];
  const locked = NDX.endingCodexHtml();
  const leaked = (NDX.ENDINGS || []).filter((e) => locked.indexOf(e.title) >= 0);
  ck('C1 全未点亮 ⇒ 不泄露任何结局真标题（只给解锁条件）',
    leaked.length === 0 && locked.indexOf('解锁条件') >= 0,
    '泄露：' + leaked.map((e) => e.title).join('、'));
  ck('C1b 计数渲染为「已达成 0 / 14」', locked.indexOf('已达成 0 / 14') >= 0);
  NDX.markEndingSeen({ id: 'jinchan', title: '金蝉正果' });
  const after = NDX.endingCodexHtml();
  ck('C2 反证：点亮 1 条 ⇒ 该条真标题出现（C1 不是恒真）',
    after.indexOf('金蝉正果') >= 0 && after.indexOf('已达成 1 / 14') >= 0);
  NDX.clearedHeroes = () => ['wukong', 'bajie', 'shaseng', 'xiaobailong', 'tangseng'];
  NDX.markEndingSeen({ id: 'nidao', title: '逆道西行' });
  const many = NDX.endingCodexHtml();
  ck('C3 反证：通关全 5 英雄 ⇒ 4 条 static 全亮（C2 只亮 dynamic，两者判据不同）',
    many.indexOf('大圣脱局') >= 0 && many.indexOf('净坛圆觉') >= 0
    && many.indexOf('卷帘归真') >= 0 && many.indexOf('白龙渡海') >= 0);
  NDX.clearedHeroes = realCleared;
}

// ── D 组 · 写入端接线 + 端到端 ──
{
  const gm = fs.readFileSync(path.join(ROOT, 'js', 'game', 'game_meta.js'), 'utf8');
  const ld = fs.readFileSync(path.join(ROOT, 'js', 'game', 'game_lundao.js'), 'utf8');
  const ev = fs.readFileSync(path.join(ROOT, 'js', 'game', 'game_event_2.js'), 'utf8');
  // ⚠ 必须匹配**调用式** `NDX.markEndingSeen(`，不能只查裸符号名：
  //   ① 注释里提到这个函数名会假绿；② 反向验证时若只把名字改成都带原串的后缀（如 `...SeenX`），
  //      `indexOf('markEndingSeen')` 照样命中 ⇒ 反证失效（本门禁第一版就栽在这，同 G1 那个坑）。
  const CALL = /NDX\.markEndingSeen\(/;
  ck('D1 三个写入端都接上 markEndingSeen(（settleReturn / lundaoChoose / 中途结局）',
    CALL.test(gm) && CALL.test(ld) && CALL.test(ev),
    '未接上：' + [['game_meta', gm], ['game_lundao', ld], ['game_event_2', ev]]
      .filter((p) => !CALL.test(p[1])).map((p) => p[0]).join(', '));
  ck('D1b 存储键已注册进 NDX.storage.KEYS',
    !!(NDX.storage && NDX.storage.KEYS && NDX.storage.KEYS.ENDING_SEEN));
  // 端到端：determineEnding 的真实返回值必须能入簿（动态侧由包装层补 id）
  reset();
  const r = NDX.Ending.determineEnding({
    hero: 'tangseng', good: 50, evil: 0, fate: {}, npcRel: {},
    choiceFlags: {}, flags: {}, equips: [], gold: 0,
  });
  ck('D2 端到端：determineEnding 的真实返回值能入簿（带 id）',
    !!(r && r.id) && NDX.markEndingSeen(r) === true
    && NDX.endingSeenIds().indexOf(r.id) >= 0,
    'r=' + (r ? r.id + '/' + r.title : 'null'));
  ck('D3 反证：论道三选改写的标题不在索引表 ⇒ 不入簿（图鉴不会冒出野条目）',
    NDX.markEndingSeen({ title: '论道了断 · 存留' }) === false);
}

reset();
console.log(fail
  ? '=== _verify_ending_seen：' + fail + ' 项失败 ==='
  : '=== _verify_ending_seen：持久化 + 点亮判据 + 图鉴渲染 三端齐备 ===');
console.log(fail ? 'RESULT: FAIL' : 'RESULT: PASS');
process.exit(fail ? 1 : 0);
