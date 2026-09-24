// _tmp_probe_cal2.js — 单次战斗透视（ch1/ch9 当档玩家 vs 对应Boss路径）
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..'); const _noop=()=>{}; const _store={}; let __rep=0.5; function setRep(v){__rep=v;}
function makeCtx(){ const _Math=Object.create(Math); _Math.random=()=>__rep;
  const sb={console,setTimeout,clearTimeout,Date,JSON,Math:_Math,navigator:{userAgent:'node'},
    localStorage:{getItem:(k)=>k in _store?_store[k]:null,setItem:(k,v)=>{_store[k]=String(v);},removeItem:(k)=>{delete _store[k];}},
    document:{getElementById:()=>null,createElement:()=>({style:{},setAttribute:_noop,appendChild:_noop,addEventListener:_noop,classList:{add:_noop},querySelector:()=>null}),querySelector:()=>null,querySelectorAll:()=>[],addEventListener:_noop,body:{appendChild:_noop},documentElement:{style:{}}},
    requestAnimationFrame:(cb)=>setTimeout(cb,0),addEventListener:_noop,removeEventListener:_noop};
  sb.window=sb;sb.global=sb;sb.self=sb;return sb; }
function load(){ const c=vm.createContext(makeCtx()); const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].forEach((m)=>{ if(/^https?:/.test(m[1]))return; const fp=path.join(ROOT,m[1].split('?')[0]); if(fs.existsSync(fp)){try{vm.runInContext(fs.readFileSync(fp,'utf8'),c,{filename:m[1]});}catch(e){}} }); return c.NDX; }
const clone=(o)=>JSON.parse(JSON.stringify(o)); const numberOr=(n,d)=>(Number.isFinite(+n)&&n!=null)?+n:d;
const core=(o)=>JSON.parse(JSON.stringify(o));
const NDX=load();
function rawOf(name,diff,B){
  let raw,setup;
  try{ setup=NDX.bossStageSetup(name,{}); }catch(e){ setup=null; }
  if(setup&&setup.stages&&setup.stages.length>=1&&setup.p1){
    raw={ name:setup.name||name,type:'boss',boss:true,diff,
      stages:setup.stages.map(h=>Math.max(1,Math.round(h*B))),
      phaseOverrides:setup.phaseOverrides,phaseStats:setup.phaseStats,phase2Override:setup.phase2Override,
      stageRewards:setup.stageRewards,breakWith:setup.breakWith,phaseSkipOn:setup.phaseSkipOn,
      behavior:setup.behavior,
      hp:Math.max(1,Math.round(setup.stages[0]*B)),maxHp:Math.max(1,Math.round(setup.stages[0]*B)),
      atk:Math.round(setup.p1.atk*B),dr:setup.p1.dr,matk:Math.round(setup.p1.matk*B),mdef:setup.p1.mdef };
  } else {
    const b=(NDX.monsterAt&&NDX.monsterAt(diff))||{}; const hp=numberOr(b.hp,1200);
    const atk=numberOr(b.atk,24); const matk=numberOr(b.matk,16);
    raw={ name,type:'boss',boss:true,diff,
      behavior:b.behavior,
      hp:Math.max(1,Math.round(hp*B)),maxHp:Math.max(1,Math.round(hp*B)),
      atk:Math.round(atk*B),dr:numberOr(b.dr,0.12),matk:Math.round(matk*B),mdef:numberOr(b.mdef,0.2),
      stages:[Math.max(1,Math.round(hp*B)), Math.max(1,Math.round(hp*B*0.62))] };
  }
  return raw;
}
function repEquip(ai){ const c=ai/8; return [{id:'pw',slot:'weapon',atk:Math.round(20+120*c),matk:Math.round(60+220*c),hp:Math.round(900+2600*c),dr:+(0.02+0.04*c).toFixed(3),mdef:+(0.04+0.06*c).toFixed(3)}]; }

for (const ai of [0,8]) {
  const diff=[14,81][ai];
  const ch=NDX.CHAPTER_BOSS_NAMES[ai];
  const P=NDX.computeStats('tangseng', repEquip(ai), [], {}, diff);
  console.log(`\n===== ch${ai+1} (${ch}, diff=${diff}) 当档玩家 =====`);
  console.log('ti:', JSON.stringify(P.ti));
  console.log('yuan:', JSON.stringify(P.yuan));
  for (const B of [1,40]) {
    const raw=rawOf(ch,diff,B);
    setRep(0.5);
    const res=NDX.calcCombat(clone(P), clone(raw), {stanceSeq:['ATK']});
    console.log(`--- B=×${B}: hp=${raw.hp} atk=${raw.atk} matk=${raw.matk} dr=${raw.dr} multi=${raw.stages.length}段`);
    console.log(`    win=%s lose=%s total=%s playerHpLeft=%s monsterHpLeft=%s`, res.win,res.lose,res.total,res.playerHpLeft,res.monsterHpLeft);
    // 关键对照：单阶段(只留 stage1) 同一玩家/B，验证多阶段破韧是否自动结算
    if((ai===0||ai===1)&&B===40&&raw.stages&&raw.stages.length>=2){
      for (const [tag,over] of [['无stageIndex',{}],['stageIndex:0',{stageIndex:0}],['stageIndex:0+behavior[]',{stageIndex:0,behavior:{pattern:['atk']}}]]){
        const rawSingle=Object.assign({}, raw, {stages:[raw.stages[0]], hp:raw.stages[0], maxHp:raw.stages[0]}, over);
        setRep(0.5);
        const rS=NDX.calcCombat(clone(P), clone(rawSingle), {stanceSeq:['ATK']});
        console.log(`    [单阶段·${tag}] win=%s lose=%s total=%s pHpLeft=%s mHpLeft=%s`, rS.win,rS.lose,rS.total,rS.playerHpLeft,rS.monsterHpLeft);
      }
    }
    const rd=res.roundsDetail||[];
    if(rd.length && ai===0 && B===40){
      console.log(`    [full roundsDetail len=${rd.length}]`);
      rd.forEach((d,i)=>{ console.log(`      #${i} stage=${d.stage} gR=${d.gRound} first=${d.first} act=${d.act||d.action||''} pHp=${d.pHpAfter} mHp=${d.mHpAfter} brk=${d.stageBreak?'T':''}${d.stageBreakPoint?'BREAKPT':''}`); });
    }
  }
}
process.exit(0);