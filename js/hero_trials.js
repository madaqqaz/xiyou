// hero_trials.js — 兼容聚合入口（原五英雄×81 难按章拆分后，require 即拼装）
// 浏览器实际加载 hero_trials_ch1..9.js（见 index.html）；本文件仅供 Node 端 require 兼容。
'use strict';
require('./hero_trials_ch1.js');
require('./hero_trials_ch2.js');
require('./hero_trials_ch3.js');
require('./hero_trials_ch4.js');
require('./hero_trials_ch5.js');
require('./hero_trials_ch6.js');
require('./hero_trials_ch7.js');
require('./hero_trials_ch8.js');
require('./hero_trials_ch9.js');
