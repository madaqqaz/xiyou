// 临时探针2：当档裸号 + 该章代表装备 → 9章末 Boss 胜率梯度验证
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const _noop = () => {};
const _store = {};
let __rep = 0.99;
const _Math = Object.create(Math); _Math.random = () => __rep;
const sb = { console, setTimeout, clearTimeout, setInterval, clearInterval, Date, JSON, Math: _Math,
  navigator: { userAgent: 'node' },
  localStorage: { getItem: (k)=>(k in _store?_store[k]:null), setItem:(k,v)=>{_store[k]=String(v);}, removeItem:(k)=>{delete _store[k];} },
  document: { getElementById:()=>null, createElement:()=>({style:{},setAttribute:_noop,appendChild:_noop,addEventListener:_noop,classList:{add:_noop,remove:_noop},querySelector:()=>null,remove:_noop}), querySelector:()=>null, querySelectorAll:()=>[], addEventListener:_noop, body:{appendChild:_noop}, documentElement:{style:{}} },
  requestAnimationFrame:(cb)=>setTimeout(cb,0), addEventListener:_noop, removeEventListener:_noop };
sb.window=sb; sb.global=sb; sb.self=sb;
const ctx = vm.createContext(sb);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
[...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].map((m)=>m[1]).forEach((f)=>{ if(/^https?:/.test(f))return; const p=f.split('?')[0]; const fp=path.join(ROOT,p); if(!fs.existsSync(fp))return; try{vm.runInContext(fs.readFileSync(fp,'utf8'),ctx,{filename:p});}catch(e){} });
const NDX = sb.NDX;

// 装备池：全局 EQUIP_POOL，按 chapter 过滤出怪/获得品
const POOL = NDX.EQUIP_POOL || [];
function poolByChapter(ch) { return POOL.filter((e)=>!e.chapter || e.chapter <= ch); }
// 取"该章前段获得"的代表装备：每槽 1 件 + 数值合理，不全装
function equipSetFor(ch) {
  const pool = poolByChapter(ch);
  const bySlot = {};
  for (const e of pool) { const s = e.slot || 'other'; if (!bySlot[s]) bySlot[s] = []; bySlot[s].push(e); }
  const picked = [];
  for (const s of Object.keys(bySlot)) {
    const arr = bySlot[s].sort((a,b)=>(b.atk||0)+(b.matk||0)+(b.hp||0)*0.5 - ((a.atk||0)+(a.matk||0)+(a.hp||0)*0.5));
    // 取最强的 1 件（省略多件以防超模）
    if (arr[0]) picked.push(arr[0]);
  }
  return picked;
}

function buildPlayer(ch, diff) {
  const equips = equipSetFor(ch);
  const cs = NDX.computeStats('tangseng', equips, [], {}, diff);
  const ti = cs.ti||{}, yuan = cs.yuan||{};
  return { heroId:'tangseng', good:0, spd: cs.spd||ti.baseSpd||8,
    ti:{ atk:ti.atk||0, atkB:ti.atkB||0, fixAtk:ti.fixAtk||0, maxHp:ti.maxHp||ti.hp||1, curHp:ti.maxHp||ti.hp||1, hp:ti.maxHp||ti.hp||1, dr:ti.dr||0, mdef:ti.mdef||0, matk:(yuan&&yuan.matk)||ti.matk||0, mine:0, cri:ti.cri||0.1, criMult:ti.criMult||1.6, eva:ti.eva||0, hit:1, hpRegen:ti.hpRegen||0 },
    yuan:{ matk:(yuan&&yuan.matk)||0, matkB:(yuan&&yuan.matkB)||0, fixMatk:(yuan&&yuan.fixMatk)||0, mdef:(yuan&&yuan.mdef)||0 },
    sealFlags:{lifesteal:cs.lifesteal||0,evaOnDodge:!!cs.evaOnDodge}, lifesteal:cs.lifesteal||0, reflect:cs.reflect||0, shieldPct:cs.shieldPct||0, fateFlags:cs.fateFlags||{}, coll:{}, battleFlags:{}, engineTier:{}, wEquips: equips.length };
}
function buildBoss(bossName, diff) {
  let raw;
  try { const setup = NDX.bossStageSetup ? NDX.bossStageSetup(bossName, {}) : null;
    if (setup && setup.stages && setup.p1) raw = { name:setup.name||bossName, type:'boss', boss:true, stages:setup.stages, hp:setup.stages[0], maxHp:setup.stages[0], atk:setup.p1.atk, dr:setup.p1.dr, matk:setup.p1.matk, mdef:setup.p1.mdef, phaseOverrides:setup.phaseOverrides, breakWith:setup.breakWith, blessTreasure:setup.blessTreasure };
  } catch(e){}
  if (!raw) { const b = NDX.monsterAt(diff)||{}; raw={name:bossName,type:'boss',boss:true,hp:b.hp,maxHp:b.hp,atk:b.atk,dr:b.dr,matk:b.matk,mdef:b.mdef}; }
  return raw;
}
function sampleCh(ch, bossName, diff) {
  const p = buildPlayer(ch, diff);
  const raw = buildBoss(bossName, diff);
  let n=0, wins=0, pHp=0, rds=0;
  for (const seed of [0.99,0.5,0.33,0.7,0.21]) { __rep=seed; let r; try{ r=NDX.calcCombat(JSON.parse(JSON.stringify(p)), JSON.parse(JSON.stringify(raw)), {stanceSeq:['ATK']}); }catch(e){continue;} if(!r)continue; n++; if(!!r.win&&!r.lose) wins++; const rr=Number.isInteger(r.totalRounds)?r.totalRounds:(Array.isArray(r.roundsDetail)?r.roundsDetail.length:0); rds+=rr; pHp+=r.playerHpLeft||0; }
  if(!n) return null;
  return { winRatio: wins/n, avgRounds: rds/n, avgHpPct: (pHp/n)/(p.ti.maxHp||1) };
}

console.log('章\tBoss\t装备数\t胜率\t均回合\t均残血%');
const names = NDX.CHAPTER_BOSS_NAMES || [];
for (let i=0;i<names.length;i++) {
  const bn = names[i]; const ch = i+1; const diff = Math.min(20, 4 + i*2);
  const a = sampleCh(ch, bn, diff);
  if (!a) { console.log(`${ch}\t${bn}\t-\tN/A`); continue; }
  console.log(`${ch}\t${bn}\t${equipSetFor(ch).length}\t${(a.winRatio*100).toFixed(0)}%\t${a.avgRounds.toFixed(1)}\t${(a.avgHpPct*100).toFixed(0)}%`);
}