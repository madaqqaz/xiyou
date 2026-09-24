// _tmp_probe_diag.js — 诊断平衡采样为何全胜（临时，不提交）
// 问题：_tmp_probe_path/_balance_sweep 对 9章末 Boss 一律 100% 胜率（玩家不灭）。
// 假设(待证伪)：
//  H1 多阶段 calcMultiStage 每阶段都把玩家回满血（子阶段 simulateSingle 从满血起算）
//     → 阶段→阶段免费满血，Boss 永远磨不死玩家。
//  H2 Boss atk/面板太低，玩家防御溢出（dr=0.5 cap + mdef）→ 玩家无敌。
//  H3 采样读 res.win/lose 不对。
// 本探针逐项打印可证伪证据。
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const _noop = () => {};
const _store = {};
let __rep = 0.5; function setRep(v){__rep=v;}
function makeCtx(){
  const _Math = Object.create(Math); _Math.random = () => __rep;
  const sb = { console, setTimeout, clearTimeout, Date, JSON, Math: _Math,
    navigator: { userAgent: 'node' },
    localStorage: { getItem:(k)=>k in _store?_store[k]:null, setItem:(k,v)=>{_store[k]=String(v);}, removeItem:(k)=>{delete _store[k];} },
    document: { getElementById:()=>null, createElement:()=>({style:{},setAttribute:_noop,appendChild:_noop,addEventListener:_noop,classList:{add:_noop},querySelector:()=>null}), querySelector:()=>null, querySelectorAll:()=>[], addEventListener:_noop, body:{appendChild:_noop}, documentElement:{style:{}} },
    requestAnimationFrame:(cb)=>setTimeout(cb,0), addEventListener:_noop, removeEventListener:_noop };
  sb.window=sb; sb.global=sb; sb.self=sb; return sb;
}
function load(){
  const ctx = vm.createContext(makeCtx());
  const html = fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].forEach((m)=>{ if(/^https?:/.test(m[1]))return; const fp=path.join(ROOT,m[1].split('?')[0]); if(fs.existsSync(fp)){try{vm.runInContext(fs.readFileSync(fp,'utf8'),ctx,{filename:m[1]});}catch(e){console.log('load skip',m[1]);}} });
  return ctx.NDX;
}
const clone=(o)=>JSON.parse(JSON.stringify(o));
const numberOr=(n,d)=>(Number.isFinite(+n)&&n!=null)?+n:d;

// 复用标准玩家（sweep 口径）与当档玩家
function stdPlayer(over){ return Object.assign({ heroId:'tangseng', good:0, spd:11,
  ti:{ atk:180, atkB:0, fixAtk:0, maxHp:3000, curHp:3000, hp:3000, dr:0.10, mdef:50, matk:70, mine:0, cri:0.15, criMult:1.6, eva:0.05, hit:1 },
  yuan:{ matk:90, matkB:0, fixMatk:0, mdef:60 },
  reflect:0, shieldPct:0, armorPen:0, lifesteal:0, sealReflect:0, evaOnDodge:false,
  fateFlags:{}, coll:{}, battleFlags:{}, engineTier:{} }, over||{}); }

let NDX = load();
const ch09 = NDX.CHAPTER_BOSS_NAMES[8];   // 第9章末 Boss
const ch01 = NDX.CHAPTER_BOSS_NAMES[0];
const END09 = 81, END01 = 14;

function rawOf(name, diff){
  try { const s = NDX.bossStageSetup(name,{});
    if(s && s.stages && s.stages.length>=1 && s.p1){
      return { name:s.name||name, type:'boss', boss:true, diff,
        stages:s.stages, phaseOverrides:s.phaseOverrides, phaseStats:s.phaseStats,
        phase2Override:s.phase2Override, stageRewards:s.stageRewards, breakWith:s.breakWith,
        hp:numberOr(s.stages[0],1000), maxHp:numberOr(s.stages[0],1000),
        atk:numberOr(s.p1.atk,30), dr:numberOr(s.p1.dr,0.1),
        matk:numberOr(s.p1.matk,20), mdef:numberOr(s.p1.mdef,30) };
    }
  } catch(e){}
  const b=(NDX.monsterAt&&NDX.monsterAt(diff))||{}; const hp=numberOr(b.hp,1200);
  return { name, type:'boss', boss:true, diff, hp, maxHp:hp, atk:numberOr(b.atk,24),
    dr:numberOr(b.dr,0.12), matk:numberOr(b.matk,16), mdef:numberOr(b.mdef,30),
    stages:[hp, Math.round(hp*0.62)] };
}

const C = (P,R,opts)=>{ try{ return NDX.calcCombat(clone(P),clone(R),opts); }catch(e){ return {err:''+e.message}; } };

console.log('=== 玩家面板 ===');
const std = stdPlayer();
const PS = NDX.computeStats('tangseng', [{id:'pw',slot:'weapon',atk:20,matk:60,hp:900,dr:0.02,mdef:0.04}], [], {}, END09);
console.log('std  :', JSON.stringify({atk:std.ti.atk, matk:std.yuan.matk, maxHp:std.ti.maxHp, dr:std.ti.dr, mdef:std.ti.mdef}));
console.log('当档9 :', JSON.stringify({atk:PS.ti.atk, matk:PS.yuan.matk, maxHp:PS.ti.maxHp, dr:PS.ti.dr, mdef:PS.ti.mdef}));

console.log('\n=== 第9章末 Boss 真实面板(经 bossStageSetup) ===');
const r09 = rawOf(ch09, END09);
console.log(ch09, JSON.stringify({hp:r09.hp, atk:r09.atk, matk:r09.matk, dr:r09.dr, mdef:r09.mdef, stages:r09.stages, multi:(r09.stages&&r09.stages.length>=2)}));

console.log('\n=== H1测试：多阶段 vs 单阶段（只留stage1），std玩家 vs ch9 Boss ===');
setRep(0.5);
const r09single = Object.assign({}, r09, {stages:[r09.stages[0]]});
const a = C(std, r09, {stanceSeq:['ATK']});
const b = C(std, r09single, {stanceSeq:['ATK']});
console.log('多阶段: win=%s lose=%s total=%s playerHpLeft=%s monsterHpLeft=%s', a.win, a.lose, a.total, a.playerHpLeft, a.monsterHpLeft);
console.log('单阶段: win=%s lose=%s total=%s playerHpLeft=%s monsterHpLeft=%s', b.win, b.lose, b.total, b.playerHpLeft, b.monsterHpLeft);

console.log('\n=== 残血走势(单阶段 roundsDetail 玩家/怪物HP, 前12拍) ===');
if (Array.isArray(b.roundsDetail)) {
  for (let i=0;i<Math.min(12,b.roundsDetail.length);i++){
    const d=b.roundsDetail[i];
    console.log(`  r${d.round || i} first=${d.first||'-'} pHp=${d.pHpAfter} mHp=${d.mHpAfter} act=${d.act||d.action||''}`);
  }
}

console.log('\n=== H2快速：Boss攻击是否够打到玩家？(单阶段) ===');
// 玩家普攻伤害估算
const pAtk = std.ti.atk, mDef = r09.dr||0;
console.log('std player 物攻=%s, boss(ch9) dr=%s → 玩家每击造价≈%s', pAtk, mDef, Math.round(pAtk*(1-mDef)));
console.log('boss atk=%s, 玩家 dr=%s → Boss每击≈%s', r09.atk, std.ti.dr, Math.round(r09.atk*(1-std.ti.dr)));

// Boss 若把 atk×10 呢？玩家还 100% 赢吗（找玩家死亡阈值）
const P2 = stdPlayer();
for (const mult of [5,10,20,40]){
  const r2 = Object.assign({}, r09single, {atk:Math.round(r09single.atk*mult), matk:Math.round(r09single.matk*mult)});
  const c = C(P2, r2, {stanceSeq:['ATK']});
  console.log(`boss atk×${mult}: win=%s lose=%s total=%s pHpLeft=%s`, c.win, c.lose, c.total, c.playerHpLeft);
}
process.exit(0);