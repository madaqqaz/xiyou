// 二轮普查：装备/法宝/宠物/敌人/职业/结局池
const fs = require('fs');
const path = require('path');
const noop = function () { return STUB; };
function STUB() {}
const elStub = new Proxy(function () {}, {
  get: (t, k) => {
    if (k === 'length') return 0;
    if (k === 'style') return {};
    if (k === 'dataset') return {};
    if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
    if (k === 'getContext') return () => new Proxy({}, { get: () => () => ({}), set: () => true });
    if (k === Symbol.toPrimitive) return () => '';
    return noop;
  },
  apply: () => elStub, set: () => true,
});
global.window = global; global.NDX = {};
global.document = { getElementById: () => elStub, querySelector: () => elStub, querySelectorAll: () => [], createElement: () => elStub, createTextNode: () => elStub, addEventListener() {}, removeEventListener() {}, body: elStub, documentElement: elStub, head: elStub, hidden: false, visibilityState: 'visible' };
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {}, clear() {}, key: () => null, length: 0 };
global.sessionStorage = global.localStorage;
global.navigator = { userAgent: 'node-stub', language: 'zh-CN', maxTouchPoints: 0, vibrate() {} };
global.location = { href: 'file:///D:/xiyou/demo/index.html', protocol: 'file:', pathname: '/D:/xiyou/demo/index.html', search: '', hash: '', reload() {} };
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
global.cancelAnimationFrame = clearTimeout;
global.AudioContext = function () { return { createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { value: 0, setValueAtTime() {} } }; }, createGain() { return { connect() {}, gain: { value: 0 } }; }, destination: {}, currentTime: 0, resume() { return Promise.resolve(); } }; };
global.addEventListener = () => {}; global.removeEventListener = () => {};
global.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
global.getComputedStyle = () => ({ getPropertyValue: () => '' });

const html = fs.readFileSync('D:/xiyou/demo/index.html', 'utf8');
const scripts = [...html.matchAll(/src="(js\/[^"?]+)/g)].map(m => m[1]);
for (const s of scripts) {
  try { new Function(fs.readFileSync(path.join('D:/xiyou/demo', s), 'utf8'))(); } catch (e) {}
}
const N = global.NDX;
function n(x) { return x == null ? '∅' : (typeof x === 'object' ? (Array.isArray(x) ? x.length : Object.keys(x).length) : x); }
console.log('HIDDEN_JOBS     ', n(N.HIDDEN_JOBS));
console.log('FOLLOWERS(宠物) ', n(N.FOLLOWERS));
console.log('PET_FETTERS     ', n(N.PET_FETTERS));
console.log('PET_EVOLUTIONS  ', n(N.PET_EVOLUTIONS));
console.log('FABAO_POOL      ', n(N.FABAO_POOL));
console.log('TREASURES       ', n(N.TREASURES));
console.log('EQUIP_POOL      ', n(N.EQUIP_POOL));
console.log('BASIC_EQUIPS    ', n(N.BASIC_EQUIPS));
console.log('ACHIEVEMENTS    ', n(N.ACHIEVEMENTS));
console.log('ENDINGS_CG      ', n(N.ENDINGS_CG));
// computeEnding 输出
try { console.log('computeEnding fn:', typeof N.computeEnding); } catch (e) {}
// 敌人池
Object.keys(N).filter(k => /ENEM|MONS|FOE|BOSS/i.test(k)).slice(0, 15).forEach(k => console.log('ENEMY-like', k, n(N[k])));
// 敌人结构
try { const e = N.ENEMY_LIB || N.ENEMIES_LIB; } catch (e) {}
// 转职树
Object.keys(N).filter(k => /ZHUAN|JOB_|SET_JOBS/i.test(k)).slice(0, 15).forEach(k => console.log('JOB-like', k, n(N[k])));
// 六道/命运
console.log('fate keys:', Object.keys(N).filter(k => /FATE|DAO(?!TU)|SIX/i.test(k)).slice(0, 25).join(', '));
// 心魔
Object.keys(N).filter(k => /XINMO|SIN/i.test(k)).slice(0, 10).forEach(k => console.log('XINMO-like', k, n(N[k])));
