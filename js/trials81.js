// ============================================================================
// trials81.js — 八十一难数据库入口（聚合器，向后兼容）
// 真源现已按骨架 v1.19 九章边界拆分为：
//   js/trials_ch1..9.js  —— NDX.TRIAL_LIB（81 难剧情，按章合入式组装）
//   js/trials_return.js  —— NDX.RETURN_TRIALS（隐藏返程储备）+ TRIAL_LIB.act 派生归一
// 本文件仅作兼容入口：require 即拼装完整 NDX.TRIAL_LIB / NDX.RETURN_TRIALS，
// 旧脚本（如 scripts/_audit_trial_dao.js 等）无需改路径即可继续取数。
// ⚠ 切勿在本文件直接写劫难数据：改某难请编辑对应 js/trials_chN.js。
// ============================================================================
'use strict';
const path = require('path');
const DIR = __dirname;
['trials_ch1', 'trials_ch2', 'trials_ch3', 'trials_ch4', 'trials_ch5',
 'trials_ch6', 'trials_ch7', 'trials_ch8', 'trials_ch9', 'trials_return'
].forEach((m) => { require(path.join(DIR, m + '.js')); });
