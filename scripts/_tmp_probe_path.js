// _tmp_probe_path.js — 路感知探针：9章 × 道带(渡0.55/战夺1.0/逆1.6) × 裸号/满meta
// 测量工具：验证「当档裸号+装备玩家 → 道感知 Boss 曲线」能否表达目标阶梯。
//   - 玩家 = computeStats(取经人, 代表装备, {}, meta?, diff=章末难号)
//   - Boss  = 真实章节 Boss 固定面板 × B(act) × 道带倍率(scaleRunMods)
//   - 用候选 B(act) 表校准，读数后回写核心装配点。
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
const numberOr=(n,d)=>(Number.isFinite(+n)&&n!=null)?+n:d;
const clone=(o)=>JSON.parse(JSON.stringify(o));
const SEEDS=[0.03,0.09,0.15,0.21,0.27,0.33,0.39,0.45,0.51,0.57,0.63,0.69,0.75,0.81,0.87,0.93,0.05,0.25,0.53,0.83];
const END = [14,20,31,41,46,51,64,75,81];     // 9章 章末难号(=diff)
const ROUTES = [ {key:'渡',mult:0.55}, {key:'战/夺',mult:1.0}, {key:'逆',mult:1.6} ];
const BOSS_STR = [1.5,1.7,2.0,2.6,3.0,3.4,4.2,5.0,6.0];   // 候选 Boss 强度系数 B(act)

// 代表装备包络（当档裸号+装备·保守：非最优、随章缓增）。血量由装备提供。
function repEquip(ai){ const c=ai/8;
  return [{ id:'pw', slot:'weapon', atk:Math.round(20+120*c), matk:Math.round(60+220*c),
    hp:Math.round(900+2600*c), dr:+(0.02+0.04*c).toFixed(3), mdef:+(0.04+0.06*c).toFixed(3) }]; }
function metaBonus(){ return { ti:{atk:120,hp:480,dr:0.012}, yuan:{matk:150,mdef:0.02} }; }

function buildRawBoss(NDX, act, B){
  const n = NDX.CHAPTER_BOSS_NAMES[act-1];
  let raw, setup;
  try { setup = NDX.bossStageSetup(n, {}); } catch(e){ setup=null; }
  if(setup && setup.stages && setup.stages.length>=2){
    raw = { name:n, type:'boss', boss:true,
      stages:setup.stages.map((h)=>Math.max(1,(h*B)|0)),
      hp:Math.max(1,(setup.stages[0]*B)|0), maxHp:Math.max(1,(setup.stages[0]*B)|0),
      atk:Math.round(setup.p1.atk*B), dr:setup.p1.dr, matk:Math.round(setup.p1.matk*B), mdef:setup.p1.mdef,
      phaseOverrides: setup.phaseOverrides, phaseStats: setup.phaseStats,
      phase2Override: setup.phase2Override, stageRewards: setup.stageRewards,
      breakWith: setup.breakWith, phaseSkipOn: setup.phaseSkipOn,
    };
    // 阶段面板(攻/法攻)同步按 B 缩放，阶段条已随 stages 缩放
    if(Array.isArray(raw.phaseStats)) raw.phaseStats = raw.phaseStats.map((p)=> p ? Object.assign({}, p, {atk:Math.round((p.atk||0)*B), matk:Math.round((p.matk||0)*B)}) : p);
  } else {
    const base = NDX.monsterAt(END[act-1])||{}; const hp=numberOr(base.hp,1200);
    raw = { name:n, type:'boss', boss:true, hp:(hp*B)|0, maxHp:(hp*B)|0,
      atk:Math.round(base.atk*B), dr:numberOr(base.dr,0.12), matk:Math.round(base.matk*B), mdef:numberOr(base.mdef,0.2),
      stages:[(hp*B)|0, Math.round(hp*B*0.62)] };
  }
  return raw;
}
// 套道带(scaleRunMods)
function applyRoute(NDX, raw, mult){
  const flag = mult>=1 ? {monStr:+(mult-1).toFixed(3)} : {};
  // 注入 monWeak 让 scaleRunMods 算出目标倍率
  const m1 = clone(raw);
  if(mult<1) flag.monWeak = +(1-mult).toFixed(3); else delete flag.monWeak;
  return NDX.scaleRunMods(m1, {flags:flag}) || m1;
}
function win(NDX, player, raw){
  let w=0,n=0;
  for(const sd of SEEDS){ setRep(sd); let res; try{ res=NDX.calcCombat(clone(player),clone(raw),{stanceSeq:['ATK']}); }catch(e){ continue; } if(!res)continue; n++; if(!!res.win&&!res.lose)w++; }
  return n? w/n : -1;
}

let NDX = load();
console.log('英雄=tangseng\t9章 章末难号='+END.join(','));
console.log('候选 Boss 强度系数 B(act)='+BOSS_STR.join(','));
console.log('表1：裸号(run1 无meta) —— 目标：渡线 4章≈12%墙，战/夺 更早墙，逆 更早');
console.log('章/diff\t渡×0.55\t战夺×1.0\t逆×1.6');
for(let ai=0; ai<9; ai++){
  const diff=END[ai]; const P=NDX.computeStats('tangseng', repEquip(ai), [], {}, diff);
  const rawB=buildRawBoss(NDX, ai+1, BOSS_STR[ai]);
  const cells = ROUTES.map(r=>{ const rw=applyRoute(NDX,rawB,r.mult); const wr=win(NDX,P,rw); return wr<0?'N/A':(wr*100).toFixed(0)+'%'; });
  console.log(`${(ai+1)}/d${diff}\t${cells[0]}\t${cells[1]}\t${cells[2]}`);
}
console.log('\n表2：满meta(run5) —— 目标：至少 战/夺(×1.0) 推通 9章(~55%+)');
console.log('章/diff\t渡×0.55\t战夺×1.0\t逆×1.6');
for(let ai=0; ai<9; ai++){
  const diff=END[ai]; const P=NDX.computeStats('tangseng', repEquip(ai), [], metaBonus(), diff);
  const rawB=buildRawBoss(NDX, ai+1, BOSS_STR[ai]);
  const cells = ROUTES.map(r=>{ const rw=applyRoute(NDX,rawB,r.mult); const wr=win(NDX,P,rw); return wr<0?'N/A':(wr*100).toFixed(0)+'%'; });
  console.log(`${(ai+1)}/d${diff}\t${cells[0]}\t${cells[1]}\t${cells[2]}`);
}
process.exit(0);