// _repair_hidden_close.js — 修正 _inject_hidden_ch4_6.js 第二轮注入产生的闭合 bug：
// 节点 options 以 `    ] },`（无逗号）结尾时，注入后变成 `    ]\n    hidden: {...} }, }`（多一个 `}`）。
// 仅匹配 `    ]\n    hidden: {...} },` 形态（正确节点用 `    ],` 不会被命中）。
'use strict';
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', 'js', 'trials81.js');
let s = fs.readFileSync(F, 'utf8');
const before = s;
// 捕获 hidden 对象（含其自身 `}`），把尾部的 ` },`（节点闭 `}` + 条目 `,` + 多余 `}`）规整为 ` },`（节点闭 + 条目 `,`）
const re = /    \]\n    hidden: (\{[\s\S]*?\}) },/g;
let n = 0;
s = s.replace(re, (m, obj) => { n++; return '    ],\n    hidden: ' + obj + ' },'; });
fs.writeFileSync(F, s, 'utf8');
console.log('修复闭合 bug 节点数：' + n + '（' + (s !== before ? '文件已改' : '无变化') + '）');
