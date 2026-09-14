// 在 Node 中加载全部游戏脚本（DOM 桩），读取 NDX 命名空间真实数据量
const fs = require('fs');
const path = require('path');

// ---- DOM 桩 ----
const noop = function () { return STUB; };
function STUB() {}
const elStub = new Proxy(function () {}, {
  get: (t, k) => {
    if (k === 'length') return 0;
    if (k === 'style') return {};
    if (k === 'dataset') return {};
    if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
    if (k === 'getContext') return () => new Proxy({}, { get: () => () => ({}) , set: () => true });
    if (k === Symbol.toPrimitive) return () => '';
    return noop;
  },
  apply: () => elStub,
  set: () => true,
});
global.window = global;
global.NDX = {};
global.document = {
  getElementById: () => elStub, querySelector: () => elStub, querySelectorAll: () => [],
  createElement: () => elStub, createTextNode: () => elStub, addEventListener() {},
  removeEventListener() {}, body: elStub, documentElement: elStub, head: elStub,
  hidden: false, visibilityState: 'visible',
};
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {}, clear() {}, key: () => null, length: 0 };
global.sessionStorage = global.localStorage;
global.navigator = { userAgent: 'node-stub', language: 'zh-CN', maxTouchPoints: 0, vibrate() {} };
global.location = { href: 'file:///D:/xiyou/demo/index.html', protocol: 'file:', pathname: '/D:/xiyou/demo/index.html', search: '', hash: '', reload() {} };
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
global.cancelAnimationFrame = clearTimeout;
global.AudioContext = function () { return { createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }, createGain() { return { connect() {}, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} } }; }, destination: {}, currentTime: 0, resume() { return Promise.resolve(); } }; };
global.performance = global.performance || { now: () => Date.now() };
global.addEventListener = () => {}; global.removeEventListener = () => {};
global.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
global.getComputedStyle = () => ({ getPropertyValue: () => '' });
global.indexedDB = { open: () => ({}) };

// ---- 按 index.html 顺序加载脚本 ----
const html = fs.readFileSync('D:/xiyou/demo/index.html', 'utf8');
const scripts = [...html.matchAll(/src="(js\/[^"?]+)/g)].map(m => m[1]);
let ok = 0, fail = [];
for (const s of scripts) {
  const p = path.join('D:/xiyou/demo', s);
  try {
    // 每个脚本在共享全局下运行（与浏览器 file:// 顶层 var/NDX 行为一致）
    const code = fs.readFileSync(p, 'utf8');
    new Function(code + '\n//# sourceURL=' + s)();
    ok++;
  } catch (e) {
    fail.push(s + ' :: ' + e.message);
  }
}
console.log('loaded', ok, '/', scripts.length, 'failed', fail.length);
fail.slice(0, 12).forEach(f => console.log('  FAIL', f));

const N = global.NDX;
console.log('\n=== NDX 数据量 ===');
function n(x) { return x == null ? '∅' : (typeof x === 'object' ? (Array.isArray(x) ? x.length : Object.keys(x).length) : x); }
const keys = ['TRIALS', 'TRIAL_LIB', 'HEROES', 'SEAL_WORDS', 'SEAL_DAOTU_WORDS', 'SUTRA_FULLS', 'NI_SUTRA_FULLS', 'SUTRA_FRAGS', 'NI_SUTRA_FRAGS', 'ENDINGS', 'ENDINGS_CG', 'ACH', 'ACHIEVEMENTS', 'ENEMIES', 'MONSTERS', 'TOTAL_ACTS', 'TOTAL_TRIALS', 'BONFIRE_RITES', 'SEAL_SOURCE_TIER', 'MISSION_KINDS', 'HERO_MAIN_DAOTU', 'ACTIVE_SKILLS', 'JOB_TREE', 'JOBS', 'ZHUA NJIE'];
keys.forEach(k => { try { console.log(k.padEnd(22), n(N[k])); } catch (e) { console.log(k, 'ERR'); } });
// 深挖装备/宠物/法宝
try { console.log('EQUIP like:', Object.keys(N).filter(k => /EQUIP|ARMOR|WEAPON|RELIC/i.test(k)).slice(0, 20).join(', ')); } catch (e) {}
try { console.log('PET like:', Object.keys(N).filter(k => /PET|BEAST|FOLLOWER|NI_/i.test(k)).slice(0, 20).join(', ')); } catch (e) {}
try { console.log('FABAO like:', Object.keys(N).filter(k => /FABAO|TREASURE|BAO/i.test(k)).slice(0, 20).join(', ')); } catch (e) {}
try { console.log('ENDING like:', Object.keys(N).filter(k => /ENDING|END_/i.test(k)).slice(0, 10).join(', ')); } catch (e) {}
try { console.log('JOB like:', Object.keys(N).filter(k => /JOB|ZHUA|CLASS|HIDDEN/i.test(k)).slice(0, 15).join(', ')); } catch (e) {}
