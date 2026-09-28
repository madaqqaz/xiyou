// _verify_sutra_reach.js — 经文可达性门禁（9 章制）
// 断言：① 22 部渡经**逐部**在 9 章制下有真实投放通道；② `SUTRA_REGION` 键 ⊆1~9 且无缺章；
//       ③ `sutraChantPool` 每章非空；④ `region` 字段域合法；⑤ HUAYAN_QUOTA 两档都可达。
// 🔴 2026-09-28：本门禁存在的**唯一理由**是防「目录里有 ≠ 玩家拿得到」——
//   经文系统此前栽过两次：SUTRA_REGION 手写 17 键（10~17 永不命中）+ `region` 字段另写
//   10~17（`sutraChantPool` 的 `f.region === act` 永不成立）。两者都是**结构性不可达**，
//   静态看代码毫无异样，只有「逐部枚举通道」才暴露。
//   ⇒ 因此本门禁必须含**逐部反证**：抽掉某部经的唯一通道，实测该部必须被判为不可达。
//   由 scripts/_run_all_gates.js 的 /^(_smoke_|test_|_verify_).*\.js$/ 自动收录。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const win = {};
const sandbox = { NDX: {}, window: win, console: console, Math: Math };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'data_sutra.js'), 'utf8'), sandbox);
const NDX = win.NDX;
NDX.runRandom = function () { return 0.5; };     // 依赖桩（真源在 data_seed.js）
NDX.playerDao = function () { return null; };
const T = NDX.SUTRA_FULLS || [];

let fail = 0;
let inSome = 0;
const bad = (m) => { console.log('FAIL ' + m); fail++; };
const ok = (c, m) => { if (!c) bad(m); };

// ---------- 通道枚举（真调，不读源码文本） ----------
// 渡经在 9 章制下的全部投放通道：
//   A. 章池（a 取 1..9 全扫）——⚠ 用 `sutraRegionMap()` **实时重算**而非读快照 `SUTRA_REGION`。
//      `SUTRA_REGION` 是加载时算好的快照，手改 `f.region` 不会影响它 ⇒ 若这里读快照，
//      F 组反证（改 region 后必须判不可达）会**永远不敏感**（本门禁自己写错一次，2026-09-28）。
//      快照与实时的一致性另由 B 组「手改漂移守卫」钉住。
//   B. 诵经池 = NDX.sutraChantPool（真调，含 'global' / 'death' 分支）
//   C. 死亡解锁池 = NDX.SUTRA_DEATH_POOL（deathReq 有上界 ⇒ 恒可达）
const channelsOf = (fullId) => {
  const via = [];
  const M = (NDX.sutraRegionMap ? NDX.sutraRegionMap() : (NDX.SUTRA_REGION || {}));
  for (let a = 1; a <= 9; a++) {
    const pool = M[a] || [];
    if (pool.indexOf(fullId) >= 0) via.push('章池a' + a);
    // 诵经池对传承经有 `deaths >= deathReq` 门 ⇒ 两种状态都要扫
    [0, 99].forEach((d) => {
      let ch = null;
      try { ch = NDX.sutraChantPool({ act: a, deaths: d }) || []; } catch (e) { ch = []; }
      if (ch.some((x) => (typeof x === 'string' ? x : x.id) === fullId)) via.push('诵经a' + a + '(d' + d + ')');
    });
  }
  const f = NDX.sutraFullById(fullId);
  if (f && f.region === 'death' && (NDX.SUTRA_DEATH_POOL || []).indexOf(fullId) >= 0) via.push('死亡池');
  return via;
};
const nameOf = (id) => { const f = NDX.sutraFullById(id); return f ? f.name : id; };

// ---------- A 组：逐部可达 ----------
{
  const dead = T.filter((f) => channelsOf(f.id).length === 0);
  ok(dead.length === 0,
    '以下渡经在 9 章制下无任何投放通道（结构性不可达）：'
    + dead.map((f) => f.id + '(' + nameOf(f.id) + ',region=' + f.region + ')').join(' / '));
  const cost = NDX.sutraCostOf;
  const worst = T.slice().sort((a, b) => cost(b.id) - cost(a.id))[0];
  ok(cost(worst.id) === 20, '定价最高部应=20（梵网经），实际 ' + cost(worst.id) + ' @' + worst.id + ' · 若此红说明定价被改过，可达性结论需重新核对');
}

// ---------- B 组：SUTRA_REGION 键域（9 章制） ----------
{
  const R = NDX.SUTRA_REGION || {};
  const keys = Object.keys(R).map(Number).filter((n) => !isNaN(n));
  ok(keys.every((k) => k >= 1 && k <= 9), 'SUTRA_REGION 出现越界键（只允许 1~9）：' + keys.join(','));
  for (let a = 1; a <= 9; a++) ok(!!R[a], 'SUTRA_REGION 缺第 ' + a + ' 章');
  ok(keys.length === 9, 'SUTRA_REGION 应恰 9 章，实际 ' + keys.length);
  // 手写漂移守卫：派生结果与实时重算必须逐键一致（不一致＝有人手改了表）
  const live = NDX.sutraRegionMap ? NDX.sutraRegionMap() : {};
  const same = Object.keys(live).every((k) => JSON.stringify(live[k].slice().sort())
    === JSON.stringify(((R[k] || []).slice().sort())))
    && Object.keys(R).every((k) => JSON.stringify(live[k].slice().sort())
      === JSON.stringify((R[k] || []).slice().sort()));
  ok(same, 'SUTRA_REGION 与 sutraRegionMap() 实时重算不一致 ⇒ 表被手改过（应改 region 字段后让它派生）');
  // 每章池 ≥2 部：三选一需要候选多样性
  const thin = keys.filter((k) => ((R[k] || []).length) < 2);
  ok(thin.length === 0, '第 ' + thin.join('/') + ' 章渡经池 <2 部（三选一同章内无差别），实际 ' + thin.map((k) => k + ':' + R[k].length).join(','));
}

// ---------- C 组：诵经池每章非空 + 覆盖 ----------
{
  for (let a = 1; a <= 9; a++) {
    const p = NDX.sutraChantPool({ act: a }) || [];
    ok(p.length > 0, '第 ' + a + ' 章诵经池为空（玩家在此章将无经可诵）');
  }
  // ⚠ 传承经（`region:'death'`）在 `deaths` 不足时被诵经池**有意**排除 ⇒ 扫描必须含「死亡数已解锁」状态，
  //   否则永远判为「未覆盖」，那是门禁写错、不是产品缺陷（本门禁自己栽过，2026-09-28）。
  const covered = new Set();
  for (let a = 1; a <= 9; a++) {
    [0, 3, 99].forEach((d) => {
      (NDX.sutraChantPool({ act: a, deaths: d }) || []).forEach((x) => covered.add(typeof x === 'string' ? x : x.id));
    });
  }
  const miss = T.filter((f) => !covered.has(f.id)).map((f) => f.id);
  ok(miss.length === 0, '诵经池从未覆盖到的渡经：' + miss.join(','));
}

// ---------- D 组：region 字段域合法 ----------
{
  const illegal = T.filter((f) => typeof f.region === 'number' && !(f.region >= 1 && f.region <= 9));
  ok(illegal.length === 0,
    'region 字段越界（只允许 1~9 或 "global"/"death"，17 地区制已废）：'
    + illegal.map((f) => f.id + '=' + f.region).join(','));
  const kinds = new Set(T.map((f) => typeof f.region === 'number' ? 'num' : f.region));
  ok(kinds.has('global'), "应有 region='global' 的经（华严）");
  ok(kinds.has('death'), "应有 region='death' 的经（传承经）");
}

// ---------- E 组：HUAYAN_QUOTA 两档都可达（分支不可是死代码） ----------
{
  const lo = [], hi = [];
  for (let a = 1; a <= 9; a++) {
    const q = NDX.HUAYAN_QUOTA(a);
    if (q === 1) lo.push(a); else if (q === 2) hi.push(a); else bad('HUAYAN_QUOTA(' + a + ')=' + q + '，非 {1,2}');
  }
  ok(lo.length > 0, 'HUAYAN_QUOTA 的「1 片」档无章可达（死分支）');
  ok(hi.length > 0, 'HUAYAN_QUOTA 的「2 片」档无章可达（死分支）');
}

// ---------- F 组：逐部反证（本门禁的有效性自证） ----------
// 判据：把某部经的 region 改成越界值 12（模拟「17 地区制残留」复发）后，
//       A 组可达清单必须**恰好少了这一部**。若少了别的或一部没少 ⇒ 反证失效／通道判据失真。
{
  const targets = T.filter((f) => typeof f.region === 'number');
  const dead = [];
  targets.forEach((f) => {
    const old = f.region;
    f.region = 12;                                  // 制造「越界 region」——违反「region ∈ 1..9」不变量
    const stillReachable = channelsOf(f.id).length > 0;
    f.region = old;                                 // 立即还原（不污染后续断言）
    if (stillReachable) bad('反证失效：' + f.id + ' 的 region 改成越界值后仍判可达 ⇒ 通道判据没覆盖这条路径');
    else dead.push(f.id);
  });
  ok(dead.length === targets.length,
    '反证不完整：越界 region 后判为不可达的仅 ' + dead.length + '/' + targets.length
    + ' 部（漏判 ' + targets.filter((f) => dead.indexOf(f.id) < 0).map((f) => f.id).join(',') + '）');
}

// ---------- G 组：华严限量过滤不是死代码 ----------
// 依据（data_sutra.js 注释）：sutraDropChoices 里 `pool.filter(fid => fid==='su_full_huayan' ? picked < HUAYAN_QUOTA : true)`
// **假定华严在章池内**——若某章池内没有华严，该过滤永远不触发 ⇒ 整段死代码。
{
  for (let a = 1; a <= 9; a++) if (((NDX.sutraRegionPool(a) || []).indexOf('su_full_huayan') >= 0)) inSome++;
  ok(inSome === 9, '华严经应入每一章章池（否则限量过滤是死代码），覆盖章数 ' + inSome);
  // 真调：章池内华严超限后必须被过滤掉
  {
    const s = { _sutraActPick: { '3:su_full_huayan': NDX.HUAYAN_QUOTA(3) } };
    const ch = NDX.sutraDropChoices(s, 'ferry', 3) || [];
    ok(ch.indexOf('su_full_huayan') < 0, '华严在本章已超限量时仍出现在三选一候选（限量为死代码）');
    const s2 = { _sutraActPick: {} };
    ok((NDX.sutraDropChoices(s2, 'ferry', 3) || []).indexOf('su_full_huayan') >= 0, '未超限量时华严应可能在候选内');
  }
}

// ---------- H 组：零回归（9 章制改动不得改变部数与规模真源） ----------
{
  ok(T.length === NDX.SUTRA_SPEC.ferry.bu, '渡藏部数应与 SUTRA_SPEC 一致：' + T.length + ' vs ' + NDX.SUTRA_SPEC.ferry.bu);
  const ids = T.map((f) => f.id);
  ok(new Set(ids).size === ids.length, 'SUTRA_FULLS 存在重复 id');
  const noFrag = T.filter((f) => !f.frags || !f.frags.length);
  ok(noFrag.length === 0, '存在无碎片定义的渡经：' + noFrag.map((f) => f.id).join(','));
}

console.log(fail === 0
  ? 'OK 经文 9 章制可达性（渡 ' + T.length + ' 部全部可达 · 章池 9/9 · 华严覆盖 ' + inSome + '/9）'
  : ('经文可达性门禁：' + fail + ' 项失败'));
process.exit(fail === 0 ? 0 : 1);
