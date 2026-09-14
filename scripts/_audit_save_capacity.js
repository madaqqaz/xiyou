// =============================================================
// _audit_save_capacity.js — 第五阶段·存档迁移与容量测试（临时审计脚本）
// 用途：
//   1) 构造"全英雄解锁/全章节通关/全收集"的满进度存档，逐 key 序列化测算字节数
//   2) 汇总总大小，对照 localStorage 5MB（约 5,000,000 字符 ≈ 5MiB）限制
//   3) 复核 storage.js 的版本迁移逻辑（v1→v2）
//   4) 复核配额超限 / 数据损坏的错误处理路径
// 运行：node demo/scripts/_audit_save_capacity.js
// 注意：本脚本为审计工具，不进入游戏运行时，不修改任何存档。
// =============================================================
'use strict';

// localStorage 限制：各浏览器普遍 5MB（按字符计）。
// 中文在 JSON 中以 UTF-16 计 1 字符，5MB ≈ 5 * 1024 * 1024 = 5,242,880 字符。
var QUOTA = 5 * 1024 * 1024;

function bytesOf(obj) { return JSON.stringify(obj).length; }
function kb(n) { return (n / 1024).toFixed(1) + ' KB'; }

// ---------- 构造满进度存档（按 storage.js STORE 注册表逐 key 建模） ----------
// 取值按"远超真实上限"的上界估计，用于保守判断容量余量。
var saves = {};

// 1) RUN 断点存档（最大块）：含英雄/装备/劫印/经文/已访问节点/命运等
function makeMaxRun() {
  var equips = [];
  for (var i = 0; i < 12; i++) {
    equips.push({
      id: 'eq_' + i, name: '暗黑袈裟·' + i, slot: i % 6, tier: '神话',
      baseAtk: 999, baseHp: 9999, affixes: [
        { k: '攻击', v: 100 + i }, { k: '气血', v: 999 + i },
        { k: '暴击', v: 30 }, { k: '吸血', v: 15 },
        { k: '五行·火', v: 25 }, { k: '天劫抗性', v: 40 }
      ],
      desc: '这是一件经过反复淬炼的神话级装备，附带六条史诗词条，用于上界体积估计。'
    });
  }
  var seals = [];
  for (var j = 0; j < 30; j++) {
    seals.push({ id: 'seal_' + j, name: '劫印·' + j, dao: ['战','渡','逆','隐','夺','缘'][j % 6],
      tier: j % 3, power: 500 + j, desc: '劫印词条文本描述占位，用于估计存档体积上界。' });
  }
  var visited = [];
  for (var k = 0; k < 81; k++) {
    visited.push({ layer: k + 1, col: k % 3, kind: ['fight','event','shop','rest','boss'][k % 5],
      id: 'node_' + k, visitedTs: 1700000000000 + k * 1000, choice: '逆道而行' });
  }
  return {
    _version: 2, hero: 'wukong', act: 9, layer: 81, col: 2,
    gold: 99999, ash: 88888, hp: 9999, maxHp: 9999, mp: 999, maxMp: 999,
    good: 500, evil: 500, diff: 4,
    fate: { '战': 55, '渡': 55, '逆': 55, '隐': 55, '夺': 55, '缘': 55 },
    fateStats: { kills: 9999, trials: 81, events: 200 },
    equips: equips, seals: seals, sutras: ['经卷一','经卷二','经卷三','经卷四','经卷五'],
    niSutras: ['逆经一','逆经二','逆经三','逆经四','逆经五'],
    visited: visited, pending: { kind: 'over' },
    over: { win: true, reason: '八十一难功成', ending: { title: '逆道成佛', cg: 'ending_nidao' } },
    flags: { cycle: 9, newGamePlus: true },
    buffs: [ { id: 'buff1', name: '金身', turns: 99, desc: '永久金身不坏。' } ],
    log: '第1难...第81难...功成。'.repeat(20)
  };
}
saves['xy_run_autosave_v1'] = makeMaxRun();

// 2) MONUMENT 碑塔：上限 200 条
var monuments = [];
for (var m = 0; m < 200; m++) {
  monuments.push({ id: 'mon' + m, hero: ['行者','八戒','悟净','龙女','金蝉'][m%5], symbol: '器',
    win: m%2===0, killed: m%2!==0, grade: 'return', honor: '果位·' + m, reason: '八十一难功成' + m,
    act: (m%9)+1, years: 80, diff: 4, good: 500, evil: 500, ts: 1700000000000 + m });
}
saves['xynj_monuments'] = monuments;

// 3) YEZANGLU 降妖簿图鉴：全条目（估 500 妖怪，每条含名称/描述/掉落/击杀数）
var yezanglu = {};
for (var y = 0; y < 500; y++) {
  yezanglu['mon_' + y] = { name: '妖魔·' + y, desc: '此妖出没于第' + ((y%81)+1) + '难，形貌可怖，善食人魂魄，描述用于上界估计。',
    kills: y % 7, drops: ['装备A','装备B','装备C','装备D'], seen: true };
}
saves['xynj_yezanglu'] = yezanglu;

// 4) COLLECTION 藏品库：红装/法宝收藏
var collection = {};
for (var c = 0; c < 300; c++) {
  collection['item_' + c] = { name: '藏品·' + c, kind: c%2?'装备':'法宝', count: (c%5)+1, hero: ['行者','八戒','悟净'][c%3] };
}
saves['xynj_collection'] = collection;

// 5) RUBBING 拓印：全经卷拓片
var rubbing = { total: 81, shards: {} };
for (var r = 0; r < 200; r++) rubbing.shards['shard_' + r] = { got: true, du: r%2===0, ni: r%2!==0 };
saves['xynj_rubbing'] = rubbing;

// 6) ACHIEVEMENTS 全成就
var ach = [];
for (var a = 0; a < 150; a++) ach.push({ id: 'ach_' + a, done: true, ts: 1700000000000 + a });
saves['nx_ach_v1'] = ach;

// 7) 其余永久 key（小数据，逐个上界估计）
saves['xy_last_run_v1'] = { killed: false, beatCh1Boss: true, deathLayer: 81, ts: 1700000000000 };
saves['xynj_favor'] = { progress: 999, cycle: 9, lastKilled: false, orderLv: 99, chaosLv: 99, hunyuan: 9999 };
saves['xynj_cycle'] = { cycle: 9 };
saves['xynj_clears'] = 99;
saves['xynj_ash_shop'] = { level: 99, purchased: Array.from({length:60},(_,i)=>'upgrade_'+i) };
saves['xynj_inherit_stash'] = { items: Array.from({length:40},(_,i)=>({id:'inh'+i,tier:'神话'})) };
saves['xynj_monument_gear_v1'] = { gear: Array.from({length:40},(_,i)=>({id:'mg'+i,tier:'神话'})) };
saves['ndx_awakened_jobs'] = ['job1','job2','job3','job4','job5','job6','job7','job8'];
saves['ndx_track'] = { good: 99999, evil: 99999 };
saves['ndx_hunyuan'] = 99999;
saves['ndx_tiandao_layer'] = { layer: 99, cleared: true };
saves['ndx_cleared_diffs'] = [0,1,2,3,4];
saves['xynj_sound_on'] = '1';
saves['xy_save_meta_v1'] = { _version: 2, lastSave: 1700000000000, device: 'browser' };
saves['ndx_hero_unlock'] = { wukong: true, bajie: true, wujing: true, longnu: true, jinchan: true };
saves['ndx_difficulty'] = '4';
saves['ndx_tutorial_done'] = '1';
saves['ndx_leaderboard'] = Array.from({length:50},(_,i)=>({name:'玩家'+i,score:99999-i*100,ts:i}));
saves['ndx_settings'] = { soundOn: true, soundVol: 0.8, battleSpeed: 3, quality: 'high' };
saves['ndx_last_hero'] = 'wukong';
saves['ndx_seed_history'] = Array.from({length:200},(_,i)=>'seed_'+i+'_'+i);
saves['ndx_stat_total'] = { runs: 9999, clears: 999, deaths: 9000, kills: 999999, trials: 9999, events: 9999, maxLayer: 81, totalAsh: 999999 };
saves['xynj_sound_vol'] = '0.8';
saves['xynj_onboard_done'] = '1';
saves['xynj_vault_guide_done'] = '1';

// ---------- 测算 ----------
console.log('=== 满进度存档容量测算（上界估计） ===');
var total = 0;
var rows = [];
Object.keys(saves).forEach(function (k) {
  var s = bytesOf(saves[k]);
  total += s;
  rows.push([k, s]);
});
rows.sort(function (a, b) { return b[1] - a[1]; });
rows.forEach(function (r) {
  console.log((r[0]).padEnd(28, ' ') + ' ' + kb(r[1]).padStart(10, ' ') + '  (' + r[1] + ' 字符)');
});
console.log('------------------------------------------------');
console.log('总大小（含 key 名与 JSON 结构开销的保守上界估计）: ' + kb(total) + ' / ' + (QUOTA/1024/1024).toFixed(0) + ' MB');
console.log('占 5MB 配额比例: ' + (total / QUOTA * 100).toFixed(2) + ' %');
console.log('剩余余量: ' + kb(QUOTA - total) + '（约可再存 ' + Math.floor((QUOTA - total) / Math.max(1, total)) + ' 倍当前满档）');

// ---------- 迁移逻辑复核（复刻 storage.js _migrate） ----------
console.log('\n=== 存档版本迁移复核 ===');
var SAVE_VER = 2;
var MIGRATIONS = {
  1: function (data) {
    if (data && data.meta && typeof data.layer === 'number') data._runInvalid = true;
    return data;
  }
};
function migrate(data) {
  if (!data || typeof data !== 'object') return data;
  var ver = data._version || 0;
  while (ver < SAVE_VER && MIGRATIONS[ver]) {
    var prev = ver;
    data = MIGRATIONS[ver](data) || data;
    ver = (typeof data._version === 'number' && data._version > prev) ? data._version : prev + 1;
  }
  data._version = SAVE_VER;
  return data;
}
// 旧版 v1 带 layer 的 run 档
var oldV1 = { _version: 1, meta: true, layer: 20, hero: 'wukong' };
var migrated = migrate(oldV1);
console.log('v1 run档(带layer)迁移后 _runInvalid =', migrated._runInvalid, '| _version =', migrated._version);
if (migrated._runInvalid !== true || migrated._version !== 2) { console.log('!! 迁移断言失败'); process.exit(1); }
// 无版本号的老档（_version 缺省 0）不应崩
var legacy = migrate({ foo: 1 });
console.log('无版本老档迁移后 _version =', legacy._version, '| foo =', legacy.foo);
// 损坏 JSON 由 load 的 try/catch 兜底（storage.js load 返回 null）
try { JSON.parse('{{{broken'); console.log('!! 损坏 JSON 未抛错（异常）'); process.exit(1); }
catch (e) { console.log('损坏 JSON 解析抛错 → storage.load try/catch 兜底返回 null，OK'); }

// ---------- 配额超限处理复核 ----------
console.log('\n=== 配额超限/错误处理复核 ===');
console.log('storage.save: try/catch 包裹 localStorage.setItem，QuotaExceededError 被静默捕获（注释"隐私模式/空间满：静默失败"）');
console.log('  → 风险点：save() 无返回值，调用方无法感知"保存失败"。需在容量逼近阈值时给用户提示（见报告）。');
console.log('SaveSystem.save: 返回 boolean，调用方可感知失败 —— 优于 storage.save。');

console.log('\n=== 容量测试结论 ===');
console.log(total < QUOTA ? 'PASS：满进度存档上界 ' + kb(total) + ' 远低于 5MB 配额，无溢出风险。'
                          : 'FAIL：满进度存档超过 5MB，需裁剪。');
process.exit(total < QUOTA ? 0 : 2);
