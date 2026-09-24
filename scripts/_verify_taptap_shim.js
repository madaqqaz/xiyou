#!/usr/bin/env node
'use strict';
/*
 * _verify_taptap_shim.js — TapTap 分包垫片「地址重写」纯逻辑门禁
 * ---------------------------------------------------------------
 * 背景：垫片 taptap_subload.js 负责把发布包内对 img/** 等资源的请求改写到对应分包路径
 * （浏览器预览模式）或触发 tt.loadSubpackage（真机模式）。历史踩坑：
 *   1) globs 正则是 ^…$ 锚定，URL 带 ?v= 缓存串时整条失配 → 不被改写 → 404；
 *   2) 浏览器解析 innerHTML 时内部赋值 src 不经过 HTMLImageElement.src setter → 漏改写。
 * 本门禁直接加载模板（注入 packs 正则）并在最小 DOM shim 下断言重写结果，防止回归。
 *
 * 通过标准：全部断言通过 → exit 0；任一失败 → exit 1。
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const DIR = __dirname;
const TPL = path.join(DIR, 'taptap_subload.template.js');
const CFG = path.join(DIR, 'taptap_config.json');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, extra) {
  if (cond) { pass++; }
  else { fail++; fails.push(name + (extra ? '  → ' + extra : '')); }
}

function escapeReg(s) { return s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'); }
function globBody(g) {
  const segs = g.split('/');
  return segs.map(seg => seg === '**' ? '[^/]*(?:/[^/]*)*' : seg.split('*').map(escapeReg).join('[^/]*')).join('\\/');
}

const cfg = JSON.parse(fs.readFileSync(CFG, 'utf8'));
const packsJson = JSON.stringify(cfg.subpackages.map(s => ({ name: s.name, re: s.globs.map(globBody).join('|') })));

let code = fs.readFileSync(TPL, 'utf8').replace('__PACKS_JSON__', packsJson);

// 最小沙箱：只提供垫片顶层引用到的全局；DOM 构造器置空 → 相关 hook 自动跳过。
const sandbox = {
  RegExp, Promise, console, Math, JSON, Object, Array, String, Number,
  setTimeout: function () {},          // 一次性扫描不执行
  document: { querySelectorAll: function () { return []; } },
};
sandbox.window = sandbox;              // 浏览器里 window===globalThis
vm.createContext(sandbox);
try { vm.runInContext(code, sandbox, { filename: 'taptap_subload.js' }); }
catch (e) { console.log('结论：0 通过 / 1 失败'); console.log('垫片模板执行异常：' + e.message); process.exit(1); }

const S = sandbox.window.__ndxSubload;
ok('垫片暴露测试句柄 __ndxSubload', !!(S && S.packFor && S.rw && S.rwHTML), 'got=' + JSON.stringify(S && Object.keys(S || {})));
if (!S) { console.log('结论：' + pass + ' 通过 / ' + fail + ' 失败'); console.log(fails.join('\n')); process.exit(1); }

// ---- packFor：分包命中（含 ?v= 缓存串，历史 bug #1）----
ok('packFor 立绘 base(无query)', S.packFor('img/portraits/heroes/tangseng_base.webp') === 'sub_heroes', S.packFor('img/portraits/heroes/tangseng_base.webp'));
ok('packFor 立绘 ?v=302(历史bug)', S.packFor('img/portraits/heroes/tangseng.webp?v=302') === 'sub_heroes', S.packFor('img/portraits/heroes/tangseng.webp?v=302'));
ok('packFor 小妖精灵条 ?v=1', S.packFor('img/portraits/foe/mob_combat_idle_strip.webp?v=1') === 'sub_enemy', S.packFor('img/portraits/foe/mob_combat_idle_strip.webp?v=1'));
ok('packFor Boss 立绘', S.packFor('img/portraits/bosses/黄风怪.webp') === 'sub_boss', S.packFor('img/portraits/bosses/黄风怪.webp'));
ok('packFor 音频', S.packFor('audio/battle_bgm.mp3') === 'sub_audio', S.packFor('audio/battle_bgm.mp3'));
ok('packFor fragment 剥离', S.packFor('img/portraits/heroes/x.webp#a') === 'sub_heroes', S.packFor('img/portraits/heroes/x.webp#a'));
// 主包 / 外部资源 → null（不得改写）
ok('packFor 主包不发包(null)', S.packFor('img/bg/act_01_datang.webp') === null, S.packFor('img/bg/act_01_datang.webp'));
ok('packFor assets主包(null)', S.packFor('assets/sound/bgm_home.ogg') === null, S.packFor('assets/sound/bgm_home.ogg'));
ok('packFor http(null)', S.packFor('https://cdn.x.com/img/portraits/heroes/a.webp') === null, S.packFor('https://cdn.x.com/img/portraits/heroes/a.webp'));
ok('packFor data:(null)', S.packFor('data:image/png;base64,AAAA') === null, S.packFor('data:image/png;base64,AAAA'));

// ---- _rw：cssText / backgroundImage 字符串中的 url(...) ----
const rw1 = S.rw("background-image: url('img/portraits/foe/mob_combat_idle_strip.webp?v=1')");
ok('_rw url() 单引号 + query', rw1.indexOf('sub_enemy/img/portraits/foe/mob_combat_idle_strip.webp?v=1') >= 0, rw1);
const rw2 = S.rw('background-image:url("img/portraits/heroes/wukong_combat_atk_strip.webp?v=1")');
ok('_rw url() 双引号', rw2.indexOf('sub_heroes/img/portraits/heroes/wukong_combat_atk_strip.webp?v=1') >= 0, rw2);
const rw3 = S.rw('background:url(img/bg/act_01_datang.webp)');
ok('_rw 主包 url 不改写', rw3.indexOf('sub_') < 0, rw3);
const rw4 = S.rw('background-image:url(https://cdn.x.com/a.webp)');
ok('_rw http url 不改写', rw4.indexOf('sub_') < 0, rw4);

// ---- _rwHTML：innerHTML 注入路径（历史 bug #2）----
const h1 = S.rwHTML('<img src="img/portraits/heroes/tangseng_base.webp" class="p">');
ok('_rwHTML <img src> 双引号', h1.indexOf('src="sub_heroes/img/portraits/heroes/tangseng_base.webp"') >= 0, h1);
const h2 = S.rwHTML("<img src='img/portraits/foe/mob_combat_idle_strip.webp?v=1'>");
ok('_rwHTML <img src> 单引号 + query', h2.indexOf("src='sub_enemy/img/portraits/foe/mob_combat_idle_strip.webp?v=1'") >= 0, h2);
const h3 = S.rwHTML('<div style="background-image:url(img/portraits/bosses/黄风怪.webp)"></div>');
ok('_rwHTML 内联 background url()', h3.indexOf('sub_boss/img/portraits/bosses/黄风怪.webp') >= 0, h3);
const h4 = S.rwHTML('<img src="img/bg/act_01_datang.webp">');
ok('_rwHTML 主包 src 不改写', h4.indexOf('sub_') < 0, h4);
const h5 = S.rwHTML('<img src="https://cdn.x.com/a.webp"><img src="data:image/png;base64,AA">');
ok('_rwHTML http/data 不改写', h5.indexOf('sub_') < 0, h5);
const h6 = S.rwHTML('<img data-src="img/portraits/heroes/x.webp">');
ok('_rwHTML 不误伤 data-src', h6.indexOf('sub_') < 0, h6);
// 幂等：已带 sub_ 前缀的输入不再二次加前缀
const h7 = S.rwHTML('<img src="sub_heroes/img/portraits/heroes/tangseng_base.webp">');
ok('_rwHTML 幂等(不二次前缀)', h7 === '<img src="sub_heroes/img/portraits/heroes/tangseng_base.webp">', h7);

// ---- 真机模式（isTT）应为 no-op ----
sandbox.window.tt = { loadSubpackage: function () {} };
ok('isTT 检出', S.isTT() === true);
ok('isTT 下 _rw no-op', S.rw("url('img/portraits/heroes/a.webp')") === "url('img/portraits/heroes/a.webp')");
ok('isTT 下 _rwHTML no-op', S.rwHTML('<img src="img/portraits/heroes/a.webp">') === '<img src="img/portraits/heroes/a.webp">');
delete sandbox.window.tt;

console.log('结论：' + pass + ' 通过 / ' + fail + ' 失败');
if (fail) { console.log('失败项：'); console.log(fails.map(f => '  ✗ ' + f).join('\n')); process.exit(1); }
process.exit(0);
