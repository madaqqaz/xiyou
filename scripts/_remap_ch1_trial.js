// 临时脚本：将 Ch1 的 TRIAL_LIB / HERO_TRIALS 重排到骨架 v1.19 编号（1-14）
// 复用现有 prose，插入观音院+黑风山(10-11)，高老庄14→12，虎先锋10→13，黄风三态→14(Boss)
const fs = require('fs');
global.NDX = {};
const files = ['js/trials_ch1.js', 'js/hero_trials_ch1.js'];
for (const f of files) { try { eval(fs.readFileSync(f, 'utf8')); } catch (e) { console.error('LOAD', f, e.message); } }

const L = NDX.TRIAL_LIB || {};
const H = NDX.HERO_TRIALS || {};

// ---- 观音院 + 黑风山（文档 616-664 浓缩）----
const guanyuan = {
  id: 10, name: '观音院·借宿', act: 1, type: 'event', icon: '✦',
  portrait: '金池长老',
  fate: '渡', echo: '渡路线→禅院古舍利(法杖六舍利①)',
  dark: '唐僧师徒行至观音院，院主金池长老二百七十岁，见唐僧锦襕袈裟心生贪念。是夜众僧放火欲烧死师徒谋夺袈裟，悟空借辟火罩护住唐僧，却吹起神风，一座观音院烧作废墟。金池长老羞愧撞墙而死。',
  intro: '观音院中，金池长老盛情款待。席间问起宝贝，唐僧推辞不过取出锦襕袈裟，满院喝彩——长老眼中却掠过一丝贪婪。',
  options: [
    { key: '渡', label: '展示袈裟，结此院善缘', fate: '渡', effect: { alignGood: 10, ti: { hp: 40 }, material: 'chan_yuan_sheli' }, tip: '渡路线：点化金池长老，得法杖六舍利之一「禅院古舍利」' },
    { key: '缘', label: '不展示，避其贪念', fate: '缘', effect: { alignGood: 6, ti: { eva: 4 } } },
    { key: '战', label: '护院不退，与纵火僧众对峙', fate: '战', effect: { alignEvil: 3, ti: { atk: 8 } }, fight: true },
    { key: '夺', label: '趁火夺回袈裟并卷走院中宝物', fate: '夺', effect: { alignEvil: 8, gold: 40 } },
    { key: '隐', label: '早察异动，潜行护物', fate: '隐', effect: { alignGood: 2, ti: { eva: 6 } } },
  ],
};
const heifeng = {
  id: 11, name: '黑风山·夺袈裟', act: 1, type: 'fight', icon: '⚔',
  portrait: '黑熊精',
  fate: '战', echo: '战副→黄风逆吹呼应；黑熊精夺袈裟',
  dark: '混乱中黑风山黑熊精趁火打劫，偷走锦襕袈裟。悟空追至黑风山大战，黑熊精不敌逃回洞中紧闭不出。悟空无奈去请观音——菩萨化作凌虚仙子，将仙丹诱黑熊精吞下，腹痛现出原形，以禁箍儿收作落伽山守山大神，袈裟夺回。',
  intro: '黑风山洞前，黑熊精执黑缨枪拦路，袈裟就披在他身上："这袈裟，本是佛前之物，今归我了。"',
  options: [
    { key: '战', label: '强攻黑风洞，夺回袈裟', fate: '战', effect: { alignGood: 3, ti: { atk: 9, hp: 48 } }, fight: true, battleFlags: { openingMomentum: 1 } },
    { key: '渡', label: '请观音菩萨收妖', fate: '渡', effect: { alignGood: 10, ti: { hp: 30, dr: 0.03 } } },
    { key: '夺', label: '趁乱夺袈裟并搜洞府', fate: '夺', effect: { alignEvil: 6, gold: 50 } },
    { key: '逆', label: '问它——佛前之物，凭什么归你', fate: '逆', ni: true, effect: { alignEvil: 8, treasure: 'ni_heifeng' } },
  ],
  treasure: { id: 'ts_robe_base', type: 'armor', hp: 90, dr: 0.05, mdef: 0.05, note: '袈裟胚·观音院机缘' },
};
// 黄风怪章末 Boss（坍缩 11/12/13 三态 prose；HUANGFENG_FORMS 提供 p1/p2/p3）
const huangfeng = {
  id: 14, name: '黄风岭·黄风怪', act: 1, type: 'boss', icon: '👑',
  portrait: '黄风怪',
  fate: '战', echo: '章末Boss·三态(人形/妖形飞沙/妖形黄沙护体)；须定风珠破风眼',
  dark: '黄风岭的风不是风，是一只貂鼠的怨。它原是灵山脚下守酥陀的貂，偷抿一口香油便被打下界——一勺油，换满山黄沙。三昧神风迎面吹来，连火眼金睛也睁不开；风眼里貂鼠盘尾，问你："三藏，你这一路取经，到头来是给谁点的灯？"金目赤红的黄风大圣立于风眼："过岭的取经人，都该被吹成沙。"',
  intro: '黄风大圣立在风眼，金目赤红。灵吉菩萨的飞龙宝杖已在半空，可这一战，终究要你自己走完。',
  options: [
    { key: '战', label: '决战黄风大圣', fate: '战', effect: { alignGood: 3, ti: { atk: 5, hp: 39 } }, fight: true, battleFlags: { openingMomentum: 1 } },
    { key: '渡', label: '请灵吉菩萨收风', fate: '渡', effect: { alignGood: 10, ti: { hp: 23, dr: 0.03 } } },
    { key: '夺', label: '夺它那颗定风珠', fate: '夺', effect: { alignEvil: 6, ti: { atk: 5, hp: 45 } }, fight: true, treasure: 'tre_dingfengzhu' },
    { key: '逆', label: '夺其风源，反吹灵山', fate: '逆', ni: true, effect: { alignEvil: 8, ti: { atk: 6, hp: 36 } } },
  ],
  treasure: { id: 'dingfeng', type: 'treasure', note: '黄风大圣·定风珠（定风珠破三昧神风）' },
};

function remapLib() {
  const out = {};
  for (let t = 1; t <= 9; t++) out[t] = L[t];        // 1-9 江州/双叉岭/两界山/鹰愁涧 直接复用
  out[10] = guanyuan;
  out[11] = heifeng;
  out[12] = Object.assign({}, L[14], { id: 12, name: '高老庄·收八戒', act: 1 });  // 14→12
  out[13] = Object.assign({}, L[10], { id: 13, name: '黄风岭·虎先锋', act: 1 });   // 10→13 虎先锋(精英·不变身)
  out[14] = huangfeng;                                                                 // 黄风 Boss
  return out;
}

function remapHero() {
  const out = {};
  for (const hero of Object.keys(H)) {
    const src = H[hero] || {};
    const o = {};
    for (let t = 1; t <= 9; t++) if (src[t]) o[t] = src[t];
    // 10-11 观音院/黑风山：若无专属则用基础文本（浅合并由 trialByLayer 处理，此处留空回退）
    if (src[14]) o[12] = Object.assign({}, src[14], { name: '高老庄·收八戒' });
    if (src[10]) o[13] = Object.assign({}, src[10], { name: '黄风岭·虎先锋' });
    // 14 黄风：用 src[11]/[12]/[13] 中最贴合者（黄风大圣 prose）
    o[14] = src[13] ? Object.assign({}, src[13], { name: '黄风岭·黄风怪' }) : (src[11] || src[12]);
    out[hero] = o;
  }
  return out;
}

const newLib = remapLib();
const newHero = remapHero();

function ser(obj) { return JSON.stringify(obj, null, 2); }

const libOut = `// ============================================================================
// trials_ch1.js — 《逆道西行》八十一难 · 第 1 章（难 1–14，骨架 v1.19 对齐）
// 拆分依据：骨架 v1.19 九章边界（合入式，保持 NDX.TRIAL_LIB 单对象接口）
// act 字段由 trials_return.js 的 normalizeTrialLibAct() 按 ACT_RANGES 统一派生。
// 重排：1-9 江州/双叉岭/两界山/鹰愁涧 复用；10-11 观音院+黑风山(新增)；
//       12 高老庄(原14)；13 虎先锋(原10)；14 黄风怪章末Boss三态(原11/12/13坍缩)。
// ============================================================================
NDX.TRIAL_LIB = Object.assign(NDX.TRIAL_LIB || {},
${ser(newLib)}
);
`;

let heroOut = `// hero_trials_ch1.js — 英雄专属劫难（按章拆分，v1.19 章边界 1-14）
// 重排同 trials_ch1.js：1-9 复用；12 高老庄(原14)；13 虎先锋(原10)；14 黄风(原11/12/13坍缩)。
NDX.HERO_TRIALS = NDX.HERO_TRIALS || {};
`;
for (const hero of Object.keys(newHero)) {
  heroOut += `\nNDX.HERO_TRIALS.${hero} = Object.assign(NDX.HERO_TRIALS.${hero} || {}, ${ser(newHero[hero])}\n);\n`;
}

fs.writeFileSync('js/trials_ch1.js', libOut, 'utf8');
fs.writeFileSync('js/hero_trials_ch1.js', heroOut, 'utf8');
console.log('Ch1 remap written. trials keys:', Object.keys(newLib).join(','));
for (const h of Object.keys(newHero)) console.log('  hero', h, 'keys:', Object.keys(newHero[h]).join(','));
