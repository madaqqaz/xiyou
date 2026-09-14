// _bind_hidden_dao.js — 隐藏转职条件与六道抉择深度绑定（2026-09-12）
// 新增两种条件语法（由 evalHiddenCond 解析）：
//   夺宝≥N —— 夺得至宝件数（s.flags.duoTreasures），夺道「少而难」的凭证
//   道xN   —— 曾连续 N 难以该道收场（s.flags.daoStreak.max），要求一贯到底而非累计凑数
'use strict';
const fs = require('fs');
const path = require('path');

const MAP = [
  [9, "cond: '战 + 战≥3'", "cond: '战 + 战≥3 + 战x3'", "cond: '战 + 战≥3 + 战x3'"],
  [21, "cond: '逆 + 紧箍'", "cond: '逆 + 紧箍 + 夺宝≥1'", "cond: '逆 + 紧箍 + 夺宝≥1'"],
  [45, "cond: '逆 + 紧箍'", "cond: '逆 + 紧箍 + 夺宝≥1'", "cond: '逆 + 紧箍 + 夺宝≥1'"],
  [26, "cond: '隐 + 隐≥3'", "cond: '隐 + 隐≥3 + 隐x3'", "cond: '隐 + 隐≥3 + 隐x3'"],
  [34, "cond: '隐 + 隐≥3'", "cond: '隐 + 隐≥3 + 隐x3'", "cond: '隐 + 隐≥3 + 隐x3'"],
  [29, "cond: '战 + 战≥2'", "cond: '战 + 战≥2 + 夺宝≥1'", "cond: '战 + 战≥2 + 夺宝≥1'"],
  [65, "cond: '夺 + 夺≥3'", "cond: '夺 + 夺≥3 + 夺宝≥2'", "cond: '夺 + 夺≥3 + 夺宝≥2'"],
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 1) data_trials.js（HIDDEN_JOBS，按 trial 号精确定位）
let d = fs.readFileSync(path.join(__dirname, '..', 'js', 'data_trials.js'), 'utf8');
let n1 = 0;
MAP.forEach(([t, from, to]) => {
  const re = new RegExp('(\\{ trial: ' + t + ', )' + esc(from));
  const b = d;
  d = d.replace(re, '$1' + to);
  if (d !== b) n1++; else console.log('  未命中 data_trials trial ' + t + ' (' + from + ')');
});
fs.writeFileSync(path.join(__dirname, '..', 'js', 'data_trials.js'), d, 'utf8');

// 2) trials81.js（节点 hidden.cond，运行时实际读取处）
let s = fs.readFileSync(path.join(__dirname, '..', 'js', 'trials81.js'), 'utf8');
let n2 = 0;
MAP.forEach(([t, from, to]) => {
  // 节点块形如 "  9: { id: 9, ... hidden:{ ... cond: '...' ... } }"：限定在块内替换首个 cond
  const bi = s.indexOf('\n  ' + t + ': { id: ' + t + ',');
  if (bi < 0) { console.log('  未找到块 难' + t); return; }
  const seg = s.slice(bi, bi + 4000);
  const ci = seg.indexOf(from);
  if (ci < 0) { console.log('  未命中 trials81 难' + t + ' (' + from + ')'); return; }
  s = s.slice(0, bi) + seg.slice(0, ci) + to + seg.slice(ci + from.length) + s.slice(bi + 4000);
  n2++;
});
fs.writeFileSync(path.join(__dirname, '..', 'js', 'trials81.js'), s, 'utf8');

console.log('隐藏职条件绑定：data_trials ' + n1 + '/' + MAP.length + '，trials81 ' + n2 + '/' + MAP.length);
