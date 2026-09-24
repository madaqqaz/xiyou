// _tmp_probe_kact.js — Demo=ch1-3 按章 Boss 强度校准：
// 杠杆=每章 hp 放大 M（作用于 fight 缩放后）。目标(bare守恒装备)：
//   ch1渡≈45-60艰难 / ch2渡≈75-90舒服 / ch3渡≈15-25运气窗 / 非渡 ch2-3 ≤30
// legacy 口径（衣冠冢：取回一件高阶武器 + 成就）：渡与战/夺 ch2-3 ≥55。
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..');
const _noop=()=>{};const _store={};
let __rep=0.5;function setRep(v){__rep=v;}
function makeCtx(){const _Math=Object.create(Math);_Math.random=()=>__rep;
  const sb={console,setTimeout,clearTimeout,Date,JSON,Math:_Math,navigator:{userAgent:'node'},
    localStorage:{getItem:(k)=>k in _store?_store[k]:null,setItem:(k,v)=>{_store[k]=String(v);},removeItem:(k)=>{delete _store[k];}},
    document:{getElementById:()=>null,createElement:()=>({style:{},setAttribute:_noop,appendChild:_noop,addEventListener:_noop,classList:{add:_noop},querySelector:()=>null}),querySelector:()=>null,querySelectorAll:()=>[],addEventListener:_noop,body:{appendChild:_noop},documentElement:{style:{}}},
    requestAnimationFrame:(cb)=>setTimeout(cb,0),addEventListener:_noop,removeEventListener:_noop};
  sb.window=sb;sb.global=sb;sb.self=sb;return sb;}
function load(){const ctx=vm.createContext(makeCtx());const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].forEach((m)=>{if(/^https?:/.test(m[1]))return;const fp=path.join(ROOT,m[1].split('?')[0]);if(fs.existsSync(fp)){try{vm.runInContext(fs.readFileSync(fp,'utf8'),ctx,{filename:m[1]});}catch(e){}}});return ctx.NDX;}
const clone=(o)=>JSON.parse(JSON.stringify(o));const numberOr=(n,d)=>(Number.isFinite(+n)&&n!=null)?+n:d;
const SEEDS=[0.02,0.06,0.10,0.14,0.19,0.23,0.27,0.31,0.35,0.40,0.44,0.48,0.52,0.56,0.61,0.65,0.69,0.73,0.77,0.82,0.86,0.90,0.94,0.98];
const END=[14,20,31];
function repEquip(ai){const c=ai/8;return[{id:'pw',slot:'weapon',atk:Math.round(20+120*c),matk:Math.round(60+220*c),hp:Math.round(900+2600*c),dr:+(0.02+0.04*c).toFixed(3),mdef:+(0.04+0.06*c).toFixed(3)}];}
// 衣冠冢 legacy：守恒装备 + 取回一件高阶武器(上一难/上章的遗物) + 成就
function legacyEquip(ai){const base=repEquip(ai);const up=Math.round((base[0].atk|0)*1.55),um=Math.round((base[0].matk|0)*1.55),uh=Math.round((base[0].hp|0)*1.5);
  return[{id:'pw',slot:'weapon',atk:up,matk:um,hp:uh,dr:+(0.03+0.06*(ai/8)).toFixed(3),mdef:+(0.05+0.08*(ai/8)).toFixed(3)}];}
function metaBonus(ndx,nb){const per=(ndx&&ndx.ACH_BONUS_PER)||{atk:1.2,hp:6,matk:0.9,mdef:0.004,dr:0.002};
  const cut=(ndx&&ndx.ACH_SOFT_CUT)!=null?ndx.ACH_SOFT_CUT:40,tail=(ndx&&ndx.ACH_SOFT_TAIL)!=null?ndx.ACH_SOFT_TAIL:0.5;
  const n=Math.min(nb,(ndx&&ndx.ACH_BONUS_CAP)||81),eff=n<=cut?n:cut+(n-cut)*tail;
  return{ti:{atk:+(per.atk*eff).toFixed(1),hp:Math.round(per.hp*eff),dr:+(per.dr*eff).toFixed(4)},yuan:{matk:+(per.matk*eff).toFixed(1),mdef:+(per.mdef*eff).toFixed(4)}};}
const META_NB=45;
function makePlayer(NDX,ai,diff,eq,meta){const P=NDX.computeStats('tangseng',eq,[],meta?metaBonus(NDX,META_NB):{},diff);
  return{heroId:'tangseng',good:0,spd:(P.spd!=null?P.spd:8),ti:Object.assign({},P.ti,{hp:P.ti.maxHp,curHp:P.ti.maxHp}),yuan:{matk:P.yuan.matk,mdef:P.yuan.mdef},
    reflect:P.reflect||0,shieldPct:P.shieldPct||0,armorPen:P.armorPen||0,sealReflect:P.sealReflect||0,lifesteal:P.lifesteal||0,evaOnDodge:P.evaOnDodge||false,fateFlags:P.fateFlags||{},coll:P.coll||{},battleFlags:{},engineTier:P.engineTier||{}};}
function baseBoss(NDX,name,diff){let setup,rm;
  try{setup=NDX.bossStageSetup(name,{});}catch(e){setup=null;}
  if(setup&&setup.stages&&setup.stages.length>=1&&setup.p1){
    rm={name:setup.name||name,type:'boss',boss:true,diff,stages:setup.stages,phaseOverrides:setup.phaseOverrides,phaseStats:setup.phaseStats,phase2Override:setup.phase2Override,stageRewards:setup.stageRewards,breakWith:setup.breakWith,blessTreasure:setup.blessTreasure,phaseSkipOn:setup.phaseSkipOn,behavior:setup.behavior,hp:setup.stages[0],maxHp:setup.stages[0],atk:setup.p1.atk,dr:setup.p1.dr,matk:setup.p1.matk,mdef:setup.p1.mdef};
  }else{const b=(NDX.monsterAt&&NDX.monsterAt(diff))||{};const hp=numberOr(b.hp,1200);
    rm={name,type:'boss',boss:true,diff,behavior:b.behavior,hp,maxHp:hp,atk:numberOr(b.atk,24),dr:numberOr(b.dr,0.12),matk:numberOr(b.matk,16),mdef:numberOr(b.mdef,0.2),stages:[hp,Math.round(hp*0.62)]};}
  return rm;}
function softScale(m,diff,M){const d=Math.max(1,diff);
  const hpS=(1+(d-1)*0.06+Math.max(0,d-6)*0.14)*M,atkS=1+(d-1)*0.13;
  const m2={name:m.name,type:m.type,boss:!!m.boss,diff:d,behavior:m.behavior,
    hp:Math.max(1,Math.round((m.hp||100)*hpS)),maxHp:Math.max(1,Math.round((m.maxHp||m.hp||100)*hpS)),
    atk:Math.round((m.atk||18)*atkS),matk:Math.round((m.matk||20)*atkS),
    dr:Math.min(0.45,m.dr!=null?m.dr:0.1),mdef:Math.min(0.45,m.mdef!=null?m.mdef:0.05)};
  m2.stages=(Array.isArray(m.stages)&&m.stages.length)?m.stages.map((h)=>Math.max(1,Math.round(h*hpS))):[m2.hp,Math.max(1,Math.round(m2.hp*0.62))];
  return m2;}
function applyRoute(NDX,raw,mult){if(mult===1)return raw;
  const flag=mult>=1?{monStr:+(mult-1).toFixed(3)}:{monWeak:+(1-mult).toFixed(3)};
  const cp=clone(raw);return(NDX.scaleRunMods&&NDX.scaleRunMods(cp,{flags:flag}))||cp;}
function win(NDX,P,raw){let w=0,n=0;
  for(const sd of SEEDS){setRep(sd);let res;try{res=NDX.calcCombat(clone(P),clone(raw),{stanceSeq:['ATK']});}catch(e){continue;}if(!res)continue;n++;if(!!res.win&&!res.lose)w++;}
  return n?w/n:-1;}
let NDX=load();
const ROUTES=[['渡',0.55],['战/夺',1.0],['逆',1.28]];
function cellsOf(P,raw){return ROUTES.map(([k,mult])=>{const w=win(NDX,P,applyRoute(NDX,clone(raw),mult));return`${k}${Math.round(w*100)}%`;}).join(' ');}
// ch1/ch2 的 M 扫描（从现状 ch1渡50/ch2渡71 微调）
console.log('=== ch1 目标渡≈45-60：扫 M ===');
for(const M of [1.0,0.9,0.8,0.7,0.6]){
  const fsb=softScale(baseBoss(NDX,NDX.CHAPTER_BOSS_NAMES[0],END[0]),END[0],M);
  const p=makePlayer(NDX,0,END[0],repEquip(0),false);
  console.log(`  M=${M}: ${cellsOf(p,fsb)}`);
}
console.log('=== ch2 目标渡≈75-90：扫 M ===');
for(const M of [1.0,0.85,0.7,0.55]){
  const fsb=softScale(baseBoss(NDX,NDX.CHAPTER_BOSS_NAMES[1],END[1]),END[1],M);
  const p=makePlayer(NDX,1,END[1],repEquip(1),false);
  console.log(`  M=${M}: ${cellsOf(p,fsb)}`);
}
console.log('=== ch3 目标渡≈15-25：扫 M ===');
for(const M of [1.0,0.8,0.6,0.5,0.4,0.32]){
  const fsb=softScale(baseBoss(NDX,NDX.CHAPTER_BOSS_NAMES[2],END[2]),END[2],M);
  const p=makePlayer(NDX,2,END[2],repEquip(2),false);
  console.log(`  M=${M}: ${cellsOf(p,fsb)}`);
}
console.log('\n=== legacy 口径（衣冠冢取回高阶武器+成就）：全路线 ch2-3 ===');
for(const ai of [1,2]){
  const nm=NDX.CHAPTER_BOSS_NAMES[ai],d=END[ai];
  const M=ai===1?0.85:0.4; // 先用上面 edn 探的候选 M
  const fsb=softScale(baseBoss(NDX,nm,d),d,M);
  const pb=makePlayer(NDX,ai,d,repEquip(ai),false);
  const pl=makePlayer(NDX,ai,d,legacyEquip(ai),true);
  console.log(`  ch${ai+1}/M=${M}: bare=${cellsOf(pb,fsb)} | legacy=${cellsOf(pl,fsb)}`);
}
process.exit(0);