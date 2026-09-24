// _tmp_probe_cal24.js — 用 _balance_sweep 同款 24 种子 + 道带映射，扫候选 B(act)，直接产出写回值
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const _noop = () => {}; const _store = {};
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
  [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].forEach((m)=>{ if(/^https?:/.test(m[1]))return; const fp=path.join(ROOT,m[1].split('?')[0]); if(fs.existsSync(fp)){try{vm.runInContext(fs.readFileSync(fp,'utf8'),ctx,{filename:m[1]});}catch(e){}} });
  return ctx.NDX;
}
const clone=(o)=>JSON.parse(JSON.stringify(o));
const numberOr=(n,d)=>(Number.isFinite(+n)&&n!=null)?+n:d;
const SEEDS=[0.02,0.06,0.10,0.14,0.19,0.23,0.27,0.31,0.35,0.40,0.44,0.48,0.52,0.56,0.61,0.65,0.69,0.73,0.77,0.82,0.86,0.90,0.94,0.98];
const END=[14,20,31,41,46,51,64,75,81];
function repEquip(ai){ const c=ai/8;
  return [{ id:'pw', slot:'weapon', atk:Math.round(20+120*c), matk:Math.round(60+220*c),
    hp:Math.round(900+2600*c), dr:+(0.02+0.04*c).toFixed(3), mdef:+(0.04+0.06*c).toFixed(3) }]; }
function metaBonus(ndx,nb){ const per=(ndx&&ndx.ACH_BONUS_PER)||{atk:1.2,hp:6,matk:0.9,mdef:0.004,dr:0.002};
  const cut=(ndx&&ndx.ACH_SOFT_CUT)!=null?ndx.ACH_SOFT_CUT:40, tail=(ndx&&ndx.ACH_SOFT_TAIL)!=null?ndx.ACH_SOFT_TAIL:0.5;
  const n=Math.min(nb,(ndx&&ndx.ACH_BONUS_CAP)||81), eff=n<=cut?n:cut+(n-cut)*tail;
  return { ti:{atk:+(per.atk*eff).toFixed(1),hp:Math.round(per.hp*eff),dr:+(per.dr*eff).toFixed(4)}, yuan:{matk:+(per.matk*eff).toFixed(1),mdef:+(per.mdef*eff).toFixed(4)} }; }
const META_NB=45;
function makePlayer(NDX,ai,diff,meta){ const P=NDX.computeStats('tangseng', repEquip(ai), [], meta?metaBonus(NDX,META_NB):{}, diff);
  return { heroId:'tangseng', good:0, spd:(P.spd!=null?P.spd:8),
    ti:Object.assign({},P.ti,{hp:P.ti.maxHp,curHp:P.ti.maxHp}), yuan:{matk:P.yuan.matk,mdef:P.yuan.mdef},
    reflect:P.reflect||0, shieldPct:P.shieldPct||0, armorPen:P.armorPen||0, sealReflect:P.sealReflect||0,
    lifesteal:P.lifesteal||0, evaOnDodge:P.evaOnDodge||false, fateFlags:P.fateFlags||{}, coll:P.coll||{}, battleFlags:{}, engineTier:P.engineTier||{} }; }
function bossRaw(NDX,name,diff,B){ let rm,setup;
  try{ setup=NDX.bossStageSetup(name,{}); }catch(e){ setup=null; }
  if(setup&&setup.stages&&setup.stages.length>=1&&setup.p1){
    rm={ name:setup.name||name,type:'boss',boss:true,diff,
      stages:setup.stages.map((h)=>Math.max(1,Math.round(h*B))),
      phaseOverrides:setup.phaseOverrides, phaseStats:setup.phaseStats, phase2Override:setup.phase2Override,
      stageRewards:setup.stageRewards, breakWith:setup.breakWith, blessTreasure:setup.blessTreasure, phaseSkipOn:setup.phaseSkipOn, behavior:setup.behavior,
      hp:Math.max(1,Math.round(setup.stages[0]*B)), maxHp:Math.max(1,Math.round(setup.stages[0]*B)),
      atk:Math.round(setup.p1.atk*B), dr:setup.p1.dr, matk:Math.round(setup.p1.matk*B), mdef:setup.p1.mdef };
    if(Array.isArray(rm.phaseStats)) rm.phaseStats=rm.phaseStats.map((p)=>p?Object.assign({},p,{atk:Math.round((p.atk||0)*B),matk:Math.round((p.matk||0)*B)}):p);
  } else {
    const b=(NDX.monsterAt&&NDX.monsterAt(diff))||{}; const hp=numberOr(b.hp,1200);
    rm={ name,type:'boss',boss:true,diff, behavior:b.behavior, hp:Math.round(hp*B), maxHp:Math.round(hp*B),
      atk:Math.round(numberOr(b.atk,24)*B), dr:numberOr(b.dr,0.12), matk:Math.round(numberOr(b.matk,16)*B), mdef:numberOr(b.mdef,0.2),
      stages:[Math.round(hp*B),Math.round(hp*B*0.62)] };
  }
  return rm; }
function applyRoute(NDX,raw,mult){ if(mult===1)return raw;
  const flag=mult>=1?{monStr:+(mult-1).toFixed(3)}:{monWeak:+(1-mult).toFixed(3)};
  const cp=clone(raw); return (NDX.scaleRunMods&&NDX.scaleRunMods(cp,{flags:flag}))||cp; }
function win(NDX,P,raw){ let w=0,n=0;
  for(const sd of SEEDS){ setRep(sd); let res; try{ res=NDX.calcCombat(clone(P),clone(raw),{stanceSeq:['ATK']}); }catch(e){continue;} if(!res)continue; n++; if(!!res.win&&!res.lose)w++; }
  return n?w/n:-1; }
let NDX=load();
const ROUTES=[['渡',0.55],['战/夺',1.0],['逆',1.28]];
// 每章候选 B：先用粗扫锁定过渡区间，再精调。
const CAND={1:[2,2.5,3,3.5],2:[3,3.5,4,4.5],3:[1.5,1.8,2,2.5],4:[1.5,2,2.2,2.5],5:[1.5,2,2.5,3],6:[1.5,2,2.5,3],7:[1.5,2,2.5,3],8:[1.5,2,2.5,3],9:[1.5,2,2.5,3]};
for(let ai=0;ai<9;ai++){
  const name=NDX.CHAPTER_BOSS_NAMES[ai], diff=END[ai];
  const Pb=makePlayer(NDX,ai,diff,false);
  let out=`ch${ai+1}/d${diff} ${name}`;
  for(const B of CAND[ai+1]){
    const cells=ROUTES.map(([k,mult])=>{ const r=applyRoute(NDX,bossRaw(NDX,name,diff,B),mult); const w=win(NDX,Pb,r); return `${k}${Math.round(w*100)}%`; }).join(' ');
    out+=`\n  B=${B}: ${cells}`;
  }
  console.log(out);
}
// ch9 metarunner
const P9m=makePlayer(NDX,8,END[8],true);
const out9=['战/夺','逆'].map(k=>{
  const mult=k==='逆'?1.28:1.0; let s=`  ${k}:`;
  for(const B of [1.5,2,2.5,3]){ const r=applyRoute(NDX,bossRaw(NDX,NDX.CHAPTER_BOSS_NAMES[8],END[8],B),mult); const w=win(NDX,P9m,r); s+=` B${B}=${Math.round(w*100)}%`; }
  return s; }).join('\n');
console.log('\nch9 满meta(run5, 46nb):\n'+out9);
process.exit(0);