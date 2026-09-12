// _bump_v.js — 原子递增 index.html 中本次改动的三个脚本 ?v= 戳
'use strict';
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(F, 'utf8');
const map = [
  ['js/data_trials.js?v=376', 'js/data_trials.js?v=377'],
  ['js/zhuanjie.js?v=376', 'js/zhuanjie.js?v=377'],
  ['js/trials81.js?v=493', 'js/trials81.js?v=494'],
];
let n = 0;
map.forEach(([a, b]) => {
  if (s.indexOf(a) >= 0) { s = s.replace(a, b); n++; }
  else console.log('  · 未命中（可能已是新戳）: ' + a);
});
fs.writeFileSync(F, s, 'utf8');
console.log('版本戳递增 ' + n + '/' + map.length);
