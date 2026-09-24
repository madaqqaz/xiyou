// _tmp_probe_panel.js — 当档裸号+装备真实玩家面板 vs 章末Boss缩放后血量/攻击
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..');
const _noop=()=>{};const _store={};
function makeCtx(){const sb={console,setTimeout,clearTimeout,Date,JSON,Math,navigator:{userAgent:'node'},
  localStorage:{getItem:(k)=>k in _store?_store[k]:null,setItem:(k,v)=>{_store[k]=String(v);},removeItem:(k)=>{delete _store[k];}},
  document:{getElementById:()=>null,createElement:()=>({style:{},setAttribute:_noop,appendChild:_noop,addEventListener:_noop,classList:{add:_noop},querySelector:()=>null}),querySelector:()=>null,querySelectorAll:()=>[],addEventListener:_noop,body:{appendChild:_noop},documentElement:{style:{}}},
  requestAnimationFrame:(cb)=>setTimeout(cb,0),addEventListener:_noop,removeEventListener:_noop};
  sb.window=sb;sb.global=sb;sb.self=sb;return sb;}
function load(){const ctx=vm.createContext(makeCtx());const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].forEach((m)=>{if(/^https?:/.test(m[1]))return;const fp=path.join(ROOT,m[1].split('?')[0]);if(fs.existsSync(fp)){try{vm.runInContext(fs.readFileSync(fp,'utf8'),ctx,{filename:m[1]});}catch(e){}}});return ctx.NDX;}
const numberOr=(n,d)=>(Number.isFinite(+n)&&n!=null)?+n:d;
function repEquip(ai){const c=ai/8;return[{id:'pw',slot:'weapon',atk:Math.round(20+120*c),matk:Math.round(60+220*c),hp:Math.round(900+2600*c),dr:+(0.02+0.04*c).toFixed(3),mdef:+(0.04+0.06*c).toFixed(3)}];}
function legacyEquip(ai){const b=repEquip(ai)[0];return[{id:'pw',slot:'weapon',atk:Math.round(b.atk*1.55),matk:Math.round(b.matk*1.55),hp:Math.round(b.hp*1.5),dr:+(0.03+0.06*(ai/8)).toFixed(3),mdef:+(0.05+0.08*(ai/8)).toFixed(3)}];}
let NDX=load();
const END=[14,20,31,41,46,51,64,75,81];
console.log('章\tdiff\t裸号 hp/atk/matk/dr\t战夺Boss hp(stg)\tatk\t渡hpS收益→Boss eff');
for(let ai=0;ai<9;ai++){
  const d=END[ai];
  const P=NDX.computeStats('tangseng',repEquip(ai),[],{},d);
  const hp=P.ti.maxHp,atk=(P.ti&&P.ti.atk)||0,matk=(P.yuan&&P.yuan.matk)||0,dr=(P.ti&&P.ti.dr)||0;
  // Boss 缩放后阶段血量（复刻 fight 0.08）
  const hpS=1+(d-1)*0.06+Math.max(0,d-6)*0.08;
  let stg;try{const s=NDX.bossStageSetup(NDX.CHAPTER_BOSS_NAMES[ai],{});}catch(e){}
  const name=NDX.CHAPTER_BOSS_NAMES[ai];
  console.log(`ch${ai+1}\td${d}\thp${hp} atk${atk} m${matk} dr${dr}\t${name}\thpS=${hpS.toFixed(2)}`);
}
process.exit(0);