// _remap_9regions.js — 17 地区 → 9 大区域（1:1 与章）批量重映射
// 仅重映射「旧地区号 → 新地区号」的 act:/region: 引用；结构化块（ACT_RANGES / GEO_SEGMENTS /
// regionToTier / regionToActChapter / 音频配置 / 审计 GEO）由 Edit 工具单独处理。
// 安全：每个文件原文读入→变换→写回；变换前后字节数变化记入日志。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', 'js');

// 旧地区(1-17) → 新地区(1-9)。玉兔(15)独占 R8；灵山(16)+凌云渡(17)→R9。
const TABLE = {1:1,2:1,3:2,4:2,5:3,6:3,7:4,8:4,9:5,10:5,11:6,12:6,13:7,14:7,15:8,16:9,17:9};
const newRegionOfTrial = (id) => Math.min(9, Math.ceil(id / 9)); // 1-81 → 1-9；玉兔64-72→8, 73-81→9

function remapAct(s) {
  return s.replace(/act:\s*(\d+)/g, (m, p) => 'act: ' + (TABLE[p] != null ? TABLE[p] : p));
}
function remapRegionSingle(s) {
  return s.replace(/region:\s*(\d+)/g, (m, p) => 'region: ' + (TABLE[p] != null ? TABLE[p] : p));
}
function remapRegionArr(s) {
  return s.replace(/region:\s*\[([^\]]*)\]/g, (m, body) => {
    const nums = body.split(',').map((x) => x.trim()).filter((x) => /^\d+$/.test(x))
      .map((x) => (TABLE[x] != null ? TABLE[x] : x));
    return 'region: [' + nums.join(', ') + ']';
  });
}
// trials81：每个劫难节点的 act 由难号重算（id 锚定，避免误伤 options 内文案）
function remapTrials81(s) {
  return s.replace(/(id:\s*(\d+),[^\n]*?act:\s*)(\d+)/g, (m, pre, id) => pre + newRegionOfTrial(+id));
}

const JOBS = [
  { f: 'trials81.js',                fn: remapTrials81 },
  { f: 'enemies.js',                 fn: remapAct },
  { f: 'data_sutra.js',              fn: (s) => remapRegionArr(remapRegionSingle(s)) },
  { f: 'events.js',                  fn: (s) => remapRegionArr(remapRegionSingle(s)) },
  { f: 'data_trials_story.js',       fn: remapAct },
  { f: 'journey.js',                 fn: remapAct },
  { f: path.join('game', 'game_event_1.js'), fn: remapAct },
];

let ok = 0, changed = 0;
for (const job of JOBS) {
  const p = path.join(ROOT, job.f);
  if (!fs.existsSync(p)) { console.log('MISSING', job.f); continue; }
  const orig = fs.readFileSync(p, 'utf8');
  const out = job.fn(orig);
  if (out !== orig) {
    fs.writeFileSync(p, out);
    changed++;
    console.log('CHANGED', job.f, orig.length, '->', out.length, 'bytes');
  } else {
    console.log('NOCHANGE', job.f);
  }
  ok++;
}
console.log('DONE files=' + ok + ' changed=' + changed);
