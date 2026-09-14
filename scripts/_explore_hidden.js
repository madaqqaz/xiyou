const fs = require('fs');
const vm = require('vm');
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node' }, configurable: true });
global.window = global; global.NDX = {};
const sb = { console, Math, JSON, Date, NDX: global.NDX }; sb.window = sb;
const ctx = vm.createContext(sb);
vm.runInContext(fs.readFileSync('d:/xiyou/demo/js/trials81.js', 'utf8'), ctx, { filename: 'trials81.js' });
vm.runInContext(fs.readFileSync('d:/xiyou/demo/js/events.js', 'utf8'), ctx, { filename: 'events.js' });
const L = NDX.TRIAL_LIB;
// 隐藏职分布
const byAct = {};
Object.keys(L).map(Number).sort((a,b)=>a-b).forEach(i=>{
  const t = L[i];
  if (t.hidden) { const a = t.act||'?'; (byAct[a]=byAct[a]||[]).push({id:i, hero:t.hidden.hero, job:t.hidden.job, cond:t.hidden.cond}); }
});
console.log('=== 隐藏职章节分布 ===');
Object.keys(byAct).map(Number).sort((a,b)=>a-b).forEach(a=>{
  console.log('act'+a+' ('+byAct[a].length+'):');
  byAct[a].forEach(h=>console.log('  难'+String(h.id).padStart(2)+' ['+h.hero+'] '+h.job+'  <- '+h.cond));
});
const total = Object.values(byAct).reduce((x,y)=>x+y.length,0);
console.log('总计 '+total+' 个隐藏职；覆盖 act: '+Object.keys(byAct).sort((a,b)=>a-b).join(','));
// 英雄分布
const byHero = {};
Object.values(byAct).flat().forEach(h=>{ (byHero[h.hero]=byHero[h.hero]||[]).push(h.job); });
console.log('=== 英雄分布 ===');
Object.keys(byHero).forEach(h=>console.log(h+': '+byHero[h].join(' / ')));
// 事件装备 gear 授予点
const ev = NDX.EVENTS || {};
console.log('=== 事件 gear 授予（冒险日记体系）===');
let gearN=0;
Object.keys(ev).forEach(id=>{ const e=ev[id]; (e.opts||[]).forEach(o=>{ if(o.gear){gearN++; console.log('  '+id+' ['+(e.regionMin||'?')+'-'+(e.regionMax||'?')+'] '+o.gear+' ('+o.fate+')');}});});
console.log('事件装备授予点总计 '+gearN);
