// _tmp_probe_seed.js — 种子分辨率验证：ch3/6/8/9 的 0%/21% 是真实墙还是采样噪声
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
function repEquip(ai){const c=ai/8;return[{id:'pw',slot:'weapon',atk:Math.round(20+120*c),matk:Math.round(60+220*c),hp:Math.round(900+2600*c),dr:+(0.02+0.04*c).toFixed(3),mdef:+(0.04+0.06*c).toFixed(3)}];}
function legacyEquip(ai){const b=repEquip(ai)[0];
  return[{id:'pw',slot:'weapon',atk:Math.round(b.atk*1.55),matk:Math.round(b.matk*1.55),hp:Math.round(b.hp*1.5),dr:+(0.03+0.06*(ai/8)).toFixed(3),mdef:+(0.05+0.08*(ai/8)).toFixed(3)}];}
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
function softScale(m,diff,M,pc2){const d=Math.max(1,diff);
  const k2=(pc2!=null?pc2:0.08);
  const hpS=(1+(d-1)*0.06+Math.max(0,d-6)*k2)*M,atkS=1+(d-1)*0.13;
  const m2={name:m.name,type:m.type,boss:!!m.boss,diff:d,behavior:m.behavior,
    hp:Math.max(1,Math.round((m.hp||100)*hpS)),maxHp:Math.max(1,Math.round((m.maxHp||m.hp||100)*hpS)),
    atk:Math.round((m.atk||18)*atkS),matk:Math.round((m.matk||20)*atkS),
    dr:Math.min(0.45,m.dr!=null?m.dr:0.1),mdef:Math.min(0.45,m.mdef!=null?m.mdef:0.05)};
  m2.stages=(Array.isArray(m.stages)&&m.stages.length)?m.stages.map((h)=>Math.max(1,Math.round(h*hpS))):[m2.hp,Math.max(1,Math.round(m2.hp*0.62))];
  return m2;}
function applyRoute(NDX,raw,mult){if(mult===1)return raw;
  const flag=mult>=1?{monStr:+(mult-1).toFixed(3)}:{monWeak:+(1-mult).toFixed(3)};
  const cp=clone(raw);return(NDX.scaleRunMods&&NDX.scaleRunMods(cp,{flags:flag}))||cp;}
function win(NDX,P,raw,n){let w=0,c=0;for(let i=0;i<n;i++){setRep((i+0.5)/n);let res;try{res=NDX.calcCombat(clone(P),clone(raw),{stanceSeq:['ATK']});}catch(e){continue;}if(!res)continue;c++;if(!!res.win&&!res.lose)w++;}return c?w/c:0;}
let NDX=load();
const END=[14,20,31,41,51,81];
const NAMS=[NDX.CHAPTER_BOSS_NAMES[0],NDX.CHAPTER_BOSS_NAMES[2],NDX.CHAPTER_BOSS_NAMES[5],NDX.CHAPTER_BOSS_NAMES[8]];
const ENDS=[14,31,51,81];
const ROUTES=[['渡',0.55],['战/夺',1.0],['逆',1.28]];
for(let n of [24,100,400]){
  console.log(`\n===== 种子数 ${n}（软缩放 0.08，M=1）=====`);
  for(let i=0;i<NAMS.length;i++){
    const ai=[0,2,5,8][i];
    const fsb=softScale(baseBoss(NDX,NAMS[i],ENDS[i]),ENDS[i],1,0.08);
    const pb=makePlayer(NDX,ai,ENDS[i],repEquip(ai),false);
    const pl=makePlayer(NDX,ai,ENDS[i],legacyEquip(ai),true);
    const cells=(P)=>{let s='';for(const[k,m]of ROUTES){const w=win(NDX,P,applyRoute(NDX,clone(fsb),m),n);s+=`${k}${(w*100).toFixed(0)}% `;}return s;};
    console.log(`  ch${ai+1}/d${ENDS[i]} bare=${cells(pb)} legacy=${cells(pl)}`);
  }
}
process.exit(0);