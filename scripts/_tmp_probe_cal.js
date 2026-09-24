// _tmp_probe_cal.js — 校准 Boss 强度系数 B(act)：当档裸号玩家 vs 真实Boss面板×B
// 目的：确定"玩家成长曲线确定后，Boss 面板需要乘多少倍 B"才能使难度梯度落在
//   目标墙（ch1 硬但可过/残血、ch4≈12% 墙、满meta ch9≥55%）。输出 B↔胜率 曲线。
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
  [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].forEach((m)=>{ if(/^https?:/.test(m[1]))return; const fp=path.join(ROOT,m[1].split('?')[0]); if(fs.existsSync(fp)){try{vm.runInContext(fs.readFileSync(fp,'utf8'),ctx,{filename:m[1]});}catch(e){}} });
  return ctx.NDX;
}
const clone=(o)=>JSON.parse(JSON.stringify(o));
const numberOr=(n,d)=>(Number.isFinite(+n)&&n!=null)?+n:d;
const END = [14,20,31,41,46,51,64,75,81];
const SEEDS=[0.03,0.09,0.15,0.21,0.27,0.33,0.39,0.45,0.51,0.57,0.63,0.69,0.75,0.81,0.87,0.93,0.05,0.25,0.53,0.83];

function repEquip(ai){ const c=ai/8;
  return [{ id:'pw', slot:'weapon', atk:Math.round(20+120*c), matk:Math.round(60+220*c),
    hp:Math.round(900+2600*c), dr:+(0.02+0.04*c).toFixed(3), mdef:+(0.04+0.06*c).toFixed(3) }]; }
function metaBonus(){ return { ti:{atk:120,hp:480,dr:0.012}, yuan:{matk:150,mdef:0.02} }; }

function rawOf(name, diff, B, routeMult){
  let raw, setup;
  try { setup = NDX.bossStageSetup(name,{}); } catch(e){ setup=null; }
  if(setup && setup.stages && setup.stages.length>=1 && setup.p1){
    raw = { name:setup.name||name, type:'boss', boss:true, diff,
      stages:setup.stages.map((h)=>Math.max(1,Math.round(h*B))),
      phaseOverrides:setup.phaseOverrides, phaseStats:setup.phaseStats,
      phase2Override:setup.phase2Override, stageRewards:setup.stageRewards,
      breakWith:setup.breakWith, phaseSkipOn:setup.phaseSkipOn,
      hp:Math.max(1,Math.round(setup.stages[0]*B)), maxHp:Math.max(1,Math.round(setup.stages[0]*B)),
      atk:Math.round(setup.p1.atk*B), dr:setup.p1.dr, matk:Math.round(setup.p1.matk*B), mdef:setup.p1.mdef };
    if(Array.isArray(raw.phaseStats)) raw.phaseStats=raw.phaseStats.map((p)=>p?Object.assign({},p,{atk:Math.round((p.atk||0)*B),matk:Math.round((p.matk||0)*B)}):p);
  } else {
    const b=(NDX.monsterAt&&NDX.monsterAt(diff))||{}; const hp=numberOr(b.hp,1200);
    raw = { name, type:'boss', boss:true, diff, hp:Math.round(hp*B), maxHp:Math.round(hp*B),
      atk:Math.round(numberOr(b.atk,24)*B), dr:numberOr(b.dr,0.12), matk:Math.round(numberOr(b.matk,16)*B), mdef:numberOr(b.mdef,0.2),
      stages:[Math.round(hp*B), Math.round(hp*B*0.62)] };
  }
  // 道带(经 scaleRunMods，渡弱/逆强)。routeMult<1→monWeak, >1→monStr
  const m1=clone(raw);
  if(routeMult>1) m1.__f={monStr:+(routeMult-1).toFixed(3)};
  else if(routeMult<1) m1.__f={monWeak:+(1-routeMult).toFixed(3)};
  else return m1;
  return NDX.scaleRunMods(m1,{flags:m1.__f})||m1;
}
function win(NDX, player, raw){
  let w=0,n=0;
  for(const sd of SEEDS){ setRep(sd); let res; try{ res=NDX.calcCombat(clone(player),clone(raw),{stanceSeq:['ATK']}); }catch(e){continue;} if(!res)continue; n++; if(!!res.win&&!res.lose)w++; }
  return n? w/n : -1;
}
let NDX = load();
console.log('英雄=tangseng');
console.log('章末难号='+END.join(','));
console.log('\n=== 真实 Boss 面板(bossStageSetup, B=1) ===');
for(let ai=0;ai<9;ai++){
  const n=NDX.CHAPTER_BOSS_NAMES[ai]; let raw;
  try{ raw = rawOf(n,END[ai],1,1); }catch(e){}
  console.log(`ch${ai+1}/d${END[ai]} ${n}: hp=${raw.hp} atk=${raw.atk} matk=${raw.matk} dr=${raw.dr} stages=${raw.stages}`);
}
console.log('\n=== B 扫描：当档裸号 vs 渡道×0.72(克Player出最易) 的胜率 ===');
// 扫 B 找 ch1 硬而可过(55%~85%)、ch4≈12%墙 的倍率
const Bs = [1,2,3,4,5,6,7,8,10,12,15,18,22,26,30,35,40];
console.log('ch\\B\t'+Bs.join('\t'));
for(let ai=0;ai<9;ai++){
  const diff=END[ai]; const P=NDX.computeStats('tangseng', repEquip(ai), [], {}, diff);
  const row=Bs.map(B=>{ const raw=rawOf(NDX.CHAPTER_BOSS_NAMES[ai],diff,B,0.72); const w=win(NDX,P,raw); return w<0?'N/A':(w*100).toFixed(0); });
  console.log(`ch${ai+1}\t`+row.join('\t'));
}
console.log('\n=== 满meta run5(ch9) B 扫描 ===');
const P9M=NDX.computeStats('tangseng', repEquip(8), [], metaBonus(), END[8]);
const rowM=Bs.map(B=>{ const raw=rawOf(NDX.CHAPTER_BOSS_NAMES[8],END[8],B,1.0); const w=win(NDX,P9M,raw); return w<0?'N/A':(w*100).toFixed(0); });
console.log('ch9满meta(B=∞/战夺)\t'+rowM.join('\t'));
process.exit(0);