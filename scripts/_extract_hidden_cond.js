// _extract_hidden_cond.js — 导出主 TRIAL_LIB 全部隐藏职的 难/英雄/职/条件，供文档生成
'use strict';
const fs = require('fs');
const vm = require('vm');
const DIR = 'd:/xiyou/demo';
global.NDX = {};
const sb = { console, Math, JSON, Date, NDX: global.NDX };
sb.window = sb;
const ctx = vm.createContext(sb);
['js/trials81.js'].forEach((f) => vm.runInContext(fs.readFileSync(DIR + '/' + f, 'utf8'), ctx, { filename: f }));
const L = NDX.TRIAL_LIB || {};
const HERO = { tangseng: '唐僧', wukong: '悟空', bajie: '八戒', xiaobailong: '白龙', shaseng: '沙僧', all: '全英雄' };
Object.keys(L).map(Number).sort((a, b) => a - b).forEach((i) => {
  const h = L[i] && L[i].hidden; if (!h) return;
  console.log(`${i}\t${HERO[h.hero] || h.hero}\t${h.job}\t${h.cond}`);
});
