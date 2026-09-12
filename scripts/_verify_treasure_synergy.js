// _verify_treasure_synergy.js — 法宝 × 经文/六道 协同耦合门禁（V9.6）
// 覆盖：①概率协同（六道同源 ×1.25 / 经文共鸣 ×1.15+0.06 / 双乘 + procCap 封顶）
//       ②效果强度协同（shrink/burn/trueDmg/lifesteal）
//       ③降级安全（ctx 缺字段、真源被摘除不抛错）
//       ④单一真源连通（sutraDaoOf / sutraDaosOf）
//       ⑤飘字协同标记（syn: sutra|dao|''）
// 门禁 harness 会固定 Math.random，故本探针接管 RNG 以确定性判定「是否过概率阈」。
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
Object.defineProperty(global, 'window', { value: global, writable: true, configurable: true });
global.location = { href: 'http://client', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, writable: true, configurable: true });
const _ls = {};
global.localStorage = { get length() { return Object.keys(_ls).length; }, key(i){return Object.keys(_ls)[i]||null;}, getItem(k){return _ls[k]??null;}, setItem(k,v){_ls[k]=String(v);}, removeItem(k){delete _ls[k];}, clear(){for(const k of Object.keys(_ls))delete _ls[k];} };
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
[...html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter((f) => !['sound.js','ui.js','main.js'].includes(f) && !f.startsWith('ui/'))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const NDX = global.NDX;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); } };
// 单回合标准战斗结果：玩家打 100、怪打 50；玩家 500/1000，怪 1000/2000
const _mkRes = (rounds) => {
  const list = [];
  for (let i = 0; i < rounds; i++) list.push({
    pTurn: { deal: 100, hpBefore: 500, realDeal: 100 },
    mTurn: { deal: 50, hpBefore: 1000, hpAfter: 1000 },
    mHpAfter: 1000, pHpAfter: 500, momentum: 0,
  });
  return { roundsDetail: list, maxHp: 1000, maxMHp: 2000, monsterHpLeft: 1000, playerHpLeft: 500, total: rounds, win: false, lose: false };
};
const R = (v) => { Math.random = () => v; };   // 固定掷骰
const SYN = NDX.TREASURE_SYN;

// ── 0) 真源存在性 ───────────────────────────────────────────────
ck('NDX.TREASURE_SYN 已登记', !!(SYN && SYN.daoMatch === 1.25 && SYN.sutraMatch === 1.15 && SYN.procCap === 0.35), JSON.stringify(SYN));
ck('NDX.sutraDaosOf 已登记', typeof NDX.sutraDaosOf === 'function');

// ── A) 概率协同：用固定掷骰区分四档 proc ────────────────────────
//  基准 proc 0.25：无协同 0.25 / 同源 0.3125 / 经文 0.3475 / 双封顶 0.35
{
  R(0.30);
  const r1 = _mkRes(1);
  NDX.applyTreasureOnHit(r1, [{ proc: 0.25, shrink: 0.4, dur: 1 }], { boss: false });
  ck('A1 无协同(0.25) 掷0.30 不触发', !r1.roundsDetail[0].mTurn.shrunk);

  R(0.30);
  const r2 = _mkRes(1);
  NDX.applyTreasureOnHit(r2, [{ proc: 0.25, shrink: 0.4, dur: 1, dao: '战' }], { boss: false, playerDao: '战' });
  ck('A2 六道同源(0.3125) 掷0.30 触发', r2.roundsDetail[0].mTurn.shrunk === true);

  R(0.34);
  const r3 = _mkRes(1);
  NDX.applyTreasureOnHit(r3, [{ proc: 0.25, shrink: 0.4, dur: 1, dao: '渡' }], { boss: false, sutraDaos: ['渡'] });
  ck('A3 经文共鸣(0.3475) 掷0.34 触发', r3.roundsDetail[0].mTurn.shrunk === true);

  R(0.34);
  const r3b = _mkRes(1);
  NDX.applyTreasureOnHit(r3b, [{ proc: 0.25, shrink: 0.4, dur: 1, dao: '渡' }], { boss: false });
  ck('A3b 无经文(0.25) 掷0.34 不触发', !r3b.roundsDetail[0].mTurn.shrunk);

  R(0.349);
  const r4 = _mkRes(1);
  NDX.applyTreasureOnHit(r4, [{ proc: 0.25, shrink: 0.4, dur: 1, dao: '战' }], { boss: false, playerDao: '战', sutraDaos: ['战'] });
  ck('A4 双协同(封顶0.35) 掷0.349 触发', r4.roundsDetail[0].mTurn.shrunk === true);

  R(0.351);
  const r5 = _mkRes(1);
  NDX.applyTreasureOnHit(r5, [{ proc: 0.25, shrink: 0.4, dur: 1, dao: '战' }], { boss: false, playerDao: '战', sutraDaos: ['战'] });
  ck('A5 双协同 掷0.351 不触发（确证 procCap=0.35 而非 0.4194）', !r5.roundsDetail[0].mTurn.shrunk);
}

// ── B) 效果强度协同（shrink / burn / trueDmg / lifesteal）────────
{
  R(0); // 必中
  const b1 = _mkRes(1);
  NDX.applyTreasureOnHit(b1, [{ proc: 0.25, shrink: 0.4, dur: 1 }], { boss: false });
  ck('B1 无协同 shrink0.4 → deal30', b1.roundsDetail[0].mTurn.deal === 30, 'deal=' + b1.roundsDetail[0].mTurn.deal);

  R(0);
  const b2 = _mkRes(1);
  NDX.applyTreasureOnHit(b2, [{ proc: 0.25, shrink: 0.4, dur: 1, dao: '战' }], { boss: false, playerDao: '战' });
  ck('B2 同源 mag0.5 → deal25', b2.roundsDetail[0].mTurn.deal === 25, 'deal=' + b2.roundsDetail[0].mTurn.deal);

  R(0);
  const b3 = _mkRes(1);
  NDX.applyTreasureOnHit(b3, [{ proc: 0.25, shrink: 0.4, dur: 1, dao: '渡' }], { boss: false, sutraDaos: ['渡'] });
  ck('B3 经文 mag0.46 → deal27', b3.roundsDetail[0].mTurn.deal === 27, 'deal=' + b3.roundsDetail[0].mTurn.deal);

  R(0);
  const b4 = _mkRes(1);
  NDX.applyTreasureOnHit(b4, [{ proc: 0.25, shrink: 0.4, dur: 1, dao: '战' }], { boss: false, playerDao: '战', sutraDaos: ['战'] });
  ck('B4 双协同 mag0.575 → deal21', b4.roundsDetail[0].mTurn.deal === 21, 'deal=' + b4.roundsDetail[0].mTurn.deal);

  R(0);
  const b5 = _mkRes(2);
  NDX.applyTreasureOnHit(b5, [{ proc: 0.30, burn: 0.04, dur: 2 }], { boss: false });
  ck('B5 burn 无协同 80 → mHp920', b5.roundsDetail[0].mHpAfter === 920, 'mHp=' + b5.roundsDetail[0].mHpAfter);

  R(0);
  const b5b = _mkRes(2);
  NDX.applyTreasureOnHit(b5b, [{ proc: 0.30, burn: 0.04, dur: 2, dao: '隐' }], { boss: false, playerDao: '隐', sutraDaos: ['隐'] });
  ck('B5b burn 双协同 80×1.4375=115 → mHp885', b5b.roundsDetail[0].mHpAfter === 885, 'mHp=' + b5b.roundsDetail[0].mHpAfter);

  R(0);
  const b6 = _mkRes(1);
  NDX.applyTreasureOnHit(b6, [{ proc: 0.22, trueDmg: 0.08 }], { boss: false });
  ck('B6 trueDmg 无协同 8 → mHp992', b6.roundsDetail[0].mHpAfter === 992, 'mHp=' + b6.roundsDetail[0].mHpAfter);

  R(0);
  const b6b = _mkRes(1);
  NDX.applyTreasureOnHit(b6b, [{ proc: 0.22, trueDmg: 0.08, dao: '缘' }], { boss: false, sutraDaos: ['缘'] });
  ck('B6b trueDmg 经文 100×0.08×1.15=9 → mHp991', b6b.roundsDetail[0].mHpAfter === 991, 'mHp=' + b6b.roundsDetail[0].mHpAfter);

  R(0);
  const b7 = _mkRes(1);
  NDX.applyTreasureOnHit(b7, [{ proc: 0.25, lifesteal: 0.15 }], { boss: false });
  ck('B7 lifesteal 无协同 +15 → pHp515', b7.roundsDetail[0].pHpAfter === 515, 'pHp=' + b7.roundsDetail[0].pHpAfter);

  R(0);
  const b7b = _mkRes(1);
  NDX.applyTreasureOnHit(b7b, [{ proc: 0.25, lifesteal: 0.15, dao: '夺' }], { boss: false, sutraDaos: ['夺'] });
  ck('B7b lifesteal 经文 100×0.15×1.15=17 → pHp517', b7b.roundsDetail[0].pHpAfter === 517, 'pHp=' + b7b.roundsDetail[0].pHpAfter);
}

// ── C) 降级安全 ─────────────────────────────────────────────────
{
  R(0);
  const c1 = _mkRes(1);
  NDX.applyTreasureOnHit(c1, [{ proc: 0.25, shrink: 0.4, dur: 1 }], { boss: false /* 无 sutraDaos 字段 */ });
  ck('C1 ctx 缺 sutraDaos 不抛错且等价无协同', c1.roundsDetail[0].mTurn.deal === 30, 'deal=' + c1.roundsDetail[0].mTurn.deal);

  R(0);
  const c2 = _mkRes(1);
  NDX.applyTreasureOnHit(c2, [{ proc: 0.25, stun: 1 }], null); // ctx=null
  ck('C2 ctx=null 安全降级', c2.roundsDetail[0].mTurn.deal === 0);

  const bak = NDX.TREASURE_SYN; // 真源被摘除 → 内置兜底仍成立
  delete NDX.TREASURE_SYN;
  let threw = null;
  try {
    R(0);
    const c3 = _mkRes(1);
    NDX.applyTreasureOnHit(c3, [{ proc: 0.25, shrink: 0.4, dur: 1, dao: '战' }], { boss: false, playerDao: '战', sutraDaos: ['战'] });
    // 兜底常量与真源同值 → 双协同照常生效（0.4×1.25×1.15=0.575 → deal 21），不因真源缺失而静默失效
    if (c3.roundsDetail[0].mTurn.deal !== 21) threw = 'deal=' + c3.roundsDetail[0].mTurn.deal;
  } catch (e) { threw = 'THROW:' + e.message; }
  NDX.TREASURE_SYN = bak;
  ck('C3 真源缺失走内置兜底（不抛错且协同不失效）', threw === null, threw);
}

// ── D) 单一真源连通（sutraDaoOf / sutraDaosOf）──────────────────
{
  ck('D1 sutraDaoOf(大悲咒)=渡', NDX.sutraDaoOf('su_full_dabei') === '渡', NDX.sutraDaoOf('su_full_dabei'));
  ck('D2 sutraDaoOf(金刚经)=战', NDX.sutraDaoOf('su_full_jingang') === '战', NDX.sutraDaoOf('su_full_jingang'));
  ck('D3 ni_full_wuzi=逆', NDX.sutraDaoOf('ni_full_wuzi') === '逆', NDX.sutraDaoOf('ni_full_wuzi'));
  const d4 = NDX.sutraDaosOf({ sutras: ['su_full_dabei', 'su_full_jingang'] });
  ck('D4 sutraDaosOf 渡+战', JSON.stringify(d4.slice().sort()) === JSON.stringify(['战','渡'].sort()), JSON.stringify(d4));
  const d5 = NDX.sutraDaosOf({ sutras: ['su_full_dabei'], niSutras: ['ni_full_wuzi'], sutraBackpack: ['su_full_jingang'] });
  ck('D5 渡/逆/待投三源合并', d5.length === 3 && d5.indexOf('渡') >= 0 && d5.indexOf('逆') >= 0 && d5.indexOf('战') >= 0, JSON.stringify(d5));
  const d6 = NDX.sutraDaosOf({ sutras: ['su_full_dabei', 'su_full_dabei'] });
  ck('D6 同道经文去重', d6.length === 1 && d6[0] === '渡', JSON.stringify(d6));
  ck('D7 sutraDaosOf(null)=[]', Array.isArray(NDX.sutraDaosOf(null)) && NDX.sutraDaosOf(null).length === 0);
  ck('D8 未知经文 id 被忽略', NDX.sutraDaosOf({ sutras: ['__nope__'] }).length === 0);
}

// ── E) 飘字协同标记 syn ─────────────────────────────────────────
{
  R(0);
  const e1 = _mkRes(1);
  NDX.applyTreasureOnHit(e1, [{ proc: 0.25, shrink: 0.4, dur: 1, dao: '渡', _tid: 'a', _name: '甲' }], { boss: false, sutraDaos: ['渡'] });
  ck('E1 经文共鸣 → syn=sutra', e1.roundsDetail[0].onHitFx && e1.roundsDetail[0].onHitFx[0].syn === 'sutra', JSON.stringify(e1.roundsDetail[0].onHitFx));

  R(0);
  const e2 = _mkRes(1);
  NDX.applyTreasureOnHit(e2, [{ proc: 0.25, shrink: 0.4, dur: 1, dao: '战', _tid: 'b', _name: '乙' }], { boss: false, playerDao: '战' });
  ck('E2 仅六道同源 → syn=dao', e2.roundsDetail[0].onHitFx && e2.roundsDetail[0].onHitFx[0].syn === 'dao', JSON.stringify(e2.roundsDetail[0].onHitFx));

  R(0);
  const e3 = _mkRes(1);
  NDX.applyTreasureOnHit(e3, [{ proc: 0.25, shrink: 0.4, dur: 1, _tid: 'c', _name: '丙' }], { boss: false });
  ck('E3 无协同 → syn 空串', e3.roundsDetail[0].onHitFx && e3.roundsDetail[0].onHitFx[0].syn === '', JSON.stringify(e3.roundsDetail[0].onHitFx));

  R(0);
  const e4 = _mkRes(1);
  NDX.applyTreasureOnHit(e4, [{ proc: 0.25, shrink: 0.4, dur: 1, dao: '战', _tid: 'd', _name: '丁' }], { boss: false, playerDao: '战', sutraDaos: ['战'] });
  ck('E4 双协同优先标 sutra', e4.roundsDetail[0].onHitFx && e4.roundsDetail[0].onHitFx[0].syn === 'sutra', JSON.stringify(e4.roundsDetail[0].onHitFx));
}

// ── F) 回归：无经文时行为与 V9.6 前一致（不引入隐性削弱）────────
{
  R(0.312);
  const f1 = _mkRes(1);
  NDX.applyTreasureOnHit(f1, [{ proc: 0.25, stun: 1, dao: '缘' }], { boss: false, playerDao: '缘' });
  ck('F1 同源 0.3125 掷0.312 触发（同源阈值未漂移）', f1.roundsDetail[0].mTurn.stunned === true);

  R(0.990);
  const f2 = _mkRes(1);
  NDX.applyTreasureOnHit(f2, [{ proc: 0.25, shrink: 0.4, dur: 1, dao: '渡' }], { boss: false, playerDao: '渡', sutraDaos: ['渡'] });
  ck('F2 高掷 0.99 双协同仍不触发', !f2.roundsDetail[0].mTurn.shrunk);
}

// ── G) 表现层链路完整（缺一环则玩家看不见耦合，等于隐形机制）──
{
  const mainSrc = fs.readFileSync(path.join(ROOT, 'js/main.js'), 'utf8');
  const uiSrc = fs.readFileSync(path.join(ROOT, 'js/ui/ui_misc_3.js'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
  ck('G1 main.js 透传 syn 到 battle-fx', /treasure-onhit'[\s\S]{0,200}syn:\s*_f\.syn/.test(mainSrc));
  ck('G2 ui_misc_3.js 消费 syn 并出尾标', uiSrc.indexOf('data.syn') >= 0 && uiSrc.indexOf('tre-syn') >= 0);
  ck('G3 style.css 有 syn-sutra / syn-dao 样式', cssSrc.indexOf('.fb-tre-onhit.syn-sutra') >= 0 && cssSrc.indexOf('.fb-tre-onhit.syn-dao') >= 0);
  ck('G4 标签位移未用 @keyframes 驱动（守项目规约）', !/@keyframes[^{]*\{[^}]*fb-tre-onhit/.test(cssSrc));
}

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
