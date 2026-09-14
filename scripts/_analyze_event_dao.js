// _analyze_event_dao.js (v2) — 事件↔六道 结合度实测（修正地区映射 + 标签/fate 错配）
'use strict';
const fs = require('fs');
const vm = require('vm');
const DIR = 'd:/xiyou/demo';
const sb = { console, Math, JSON, Date };
sb.NDX = {}; sb.NDX._pick = (a) => a[0]; sb.NDX.HEROES = {}; sb.NDX.bus = { emit() {} };
const ctx = vm.createContext(sb);
vm.runInContext(fs.readFileSync(DIR + '/js/events.js', 'utf8'), ctx, { filename: 'events.js' });
const N = sb.NDX;
const DAOS = ['战', '渡', '缘', '夺', '隐', '逆'];
const chapterOfRegion = (r) => Math.min(9, Math.ceil(r / 2));

// 标签→道：text 中含【X】
const labelRe = /【(战|渡|缘|夺|隐|逆)】/;

let total = 0, universal = 0, regionGated = 0;
const chDaoOffer = {}; for (let c = 1; c <= 9; c++) { chDaoOffer[c] = {}; DAOS.forEach((d) => (chDaoOffer[c][d] = 0)); }
const daoOffer = {}; DAOS.forEach((d) => (daoOffer[d] = 0));
let mismatch = 0; const mismatchSamples = [];
const fateCount = {}; DAOS.forEach((d) => (fateCount[d] = 0));
let optsTotal = 0, optsFate = 0;

Object.keys(N.EVENTS).forEach((k) => {
  const ev = N.EVENTS[k]; if (!ev || !Array.isArray(ev.opts)) return;
  total++;
  const rg = ev.region || null;
  if (rg) regionGated++; else universal++;
  const chs = rg ? [chapterOfRegion(rg[0])] : [1,2,3,4,5,6,7,8,9];
  let offers = {}; DAOS.forEach((d) => (offers[d] = false));
  ev.opts.forEach((o) => {
    optsTotal++;
    const lab = (o.text || '').match(labelRe);
    const labDao = lab ? lab[1] : null;
    if (o.fate && DAOS.indexOf(o.fate) >= 0) { fateCount[o.fate]++; optsFate++; offers[o.fate] = true; }
    // 错配：文案标了【道】但 fate 缺失或不同
    if (labDao && (!o.fate || o.fate !== labDao)) {
      mismatch++;
      if (mismatchSamples.length < 12) mismatchSamples.push(`${k}: "${o.text.slice(0,22)}…" 标${labDao} fate=${o.fate||'(无)'}`);
    }
  });
  DAOS.forEach((d) => { if (offers[d]) { daoOffer[d]++; chs.forEach((c) => chDaoOffer[c][d]++); } });
});

const line = (s) => console.log(s);
line('=== 事件↔六道 结合度实测 v2 ===');
line(`EVENTS 总数=${total}  通用(无region)=${universal}  地区门控=${regionGated}  选项数=${optsTotal}  带fate选项=${optsFate}`);
line('');
line('— 各道「可选项供给面」(至少含该道选项的事件数 / 总数) —');
DAOS.forEach((d) => line(`  ${d}：${daoOffer[d]} (${((daoOffer[d]/total)*100).toFixed(0)}%)  fate标签=${fateCount[d]}`));
line('');
line('— 每章(地区→章映射) 玩家可面对的各道可选项数（通用事件计入每章） —');
for (let c = 1; c <= 9; c++) {
  const row = DAOS.map((d) => `${d}:${chDaoOffer[c][d]}`).join(' ');
  line(`  章${c}：${row}`);
}
line('');
line(`— 标签/ fate 错配：文案标【道】但 fate 缺失或不同 = ${mismatch} 处 —`);
mismatchSamples.forEach((s) => line('  · ' + s));
