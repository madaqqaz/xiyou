// =============================================================
// _verify_materials.js — V9.62 材料精简（28→6）+ 经文连击链三档 门禁
// 断言组：A 材料池收敛 / B 归并映射完整 / C 存档折算 e2e / D 全仓残留清扫
//         E 配方与掉落合法性 / F 经文连击链三档 / G 零回归前置
// =============================================================
const fs = require('fs');
const path = require('path');
let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail ? ' — ' + detail : '')); }
}

// —— 轻沙箱（window stub）——
global.window = global;
require('../js/data_materials.js');
const NDX = global.NDX;

console.log('— A 材料池收敛 —');
ok('MAT_CORE 恰 6 名', JSON.stringify(NDX.MAT_CORE) === JSON.stringify(['香火', '妖丹', '灵筋', '玄铁', '残页', '胚料']));
ok('MAT_TASK 4 任务/专属物', JSON.stringify(NDX.MAT_TASK) === JSON.stringify(['索命簿残卷', '城隍断笔', '定风珠碎片', '镜痕']));
ok('COMMON_MATS ⊆ MAT_CORE', NDX.COMMON_MATS.every((m) => NDX.MAT_CORE.indexOf(m) >= 0));
ok('小怪池 3 名', NDX.COMMON_MATS.length === 3);
ok('commonMatsForLayer 全层合法', [1, 20, 21, 40, 41, 60, 61, 99].every((l) => NDX.commonMatsForLayer(l).every((m) => NDX.COMMON_MATS.indexOf(m) >= 0)));

console.log('— B 归并映射完整 —');
const LEGACY_EXPECT = 31; // 28 旧名中 22 并入 + 死名 6（火精/金叶/净水珠/佛光舍利/仙土/灵泉）+ 灵石/龙鳞/猿毛
ok('MAT_LEGACY_MAP 共 ' + LEGACY_EXPECT + ' 条', Object.keys(NDX.MAT_LEGACY_MAP).length === LEGACY_EXPECT, '实得 ' + Object.keys(NDX.MAT_LEGACY_MAP).length);
ok('映射目标 ⊆ MAT_CORE', Object.values(NDX.MAT_LEGACY_MAP).every((t) => NDX.MAT_CORE.indexOf(t) >= 0));
ok('旧 28 名中保留 6 名不入映射', ['香火', '妖丹', '灵筋', '定风珠碎片', '索命簿残卷', '城隍断笔'].every((k) => !NDX.MAT_LEGACY_MAP[k]));
ok('镜痕不并（心魔隐藏线专属）', !NDX.MAT_LEGACY_MAP['镜痕'] && NDX.MAT_TASK.indexOf('镜痕') >= 0);

console.log('— C 存档折算 e2e —');
const s1 = { materials: { '玄武·鳞': 2, '天竺佛香': 3, '乌巢心经': 1, '香火': 5, '灵泉': 2, '龙鳞': 1 } };
NDX.migrateLegacyMaterials(s1);
ok('旧键清空', Object.keys(s1.materials).every((k) => !NDX.MAT_LEGACY_MAP[k]));
ok('1:1 折算正确', s1.materials['玄铁'] === 2 + 3 + 1 && s1.materials['残页'] === 1 + 2 && s1.materials['香火'] === 5, JSON.stringify(s1.materials));
const before2 = JSON.stringify(s1.materials);
NDX.migrateLegacyMaterials(s1);
ok('幂等可重入', JSON.stringify(s1.materials) === before2);
ok('无材料档安全', NDX.migrateLegacyMaterials({}) === false && NDX.migrateLegacyMaterials(null) === false);

console.log('— D 全仓残留清扫 —');
const SKIP = ['taptap_bundle', '_retired', 'node_modules', '_cdata_flow'];
function walk(dir, acc = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    const p = dir + '/' + d.name;
    if (d.isDirectory()) { if (SKIP.indexOf(d.name) < 0) walk(p, acc); }
    else if (d.name.endsWith('.js')) acc.push(p);
  });
  return acc;
}
const all = walk('js').concat(walk('scripts').filter((f) => f.indexOf('_verify_materials') < 0));
const files = {};
all.forEach((f) => { files[f] = fs.readFileSync(f, 'utf8'); });
const legacyNames = Object.keys(NDX.MAT_LEGACY_MAP);
// 叙事白名单：这些「旧名」是地名/事件名/历史注释，不是材料引用（材料键/token 已清零，见 E 组）
const NARRATIVE_OK = {
  'js/events_part2.js': ['灵泉'],            // 事件标题「灵泉分脉」（叙事泉名，非材料）
  'js/data_exploration.js': ['灵泉'],        // 探索秘境「灵泉秘境」（文件已退役入 _retired，此处防复用）
  'js/data_compound.js': ['凌云木'],         // 历史注释还原（记录旧掉落池行为，非活引用）
};
const leftovers = [];
all.forEach((f) => {
  if (f === 'js/data_materials.js') return;
  const src = files[f];
  const wl = NARRATIVE_OK[f] || [];
  legacyNames.forEach((k) => {
    if (wl.indexOf(k) >= 0) return;
    if (k === '龙鳞') {
      // 龙鳞只查 quoted token（装备名「龙鳞冠·凡」等含同子串，裸文本放行）
      if (src.indexOf("'" + k + "'") >= 0) leftovers.push(f + '#' + k);
    } else if (src.indexOf(k) >= 0) {
      leftovers.push(f + '#' + k);
    }
  });
  // 五行单字死材料（'金', '木', '水', '火', '土' 退化掉落）残留
  if (/\[\s*'金',\s*'木',\s*'水'/.test(src)) leftovers.push(f + '#五行单字掉落');
});
ok('旧材料名全仓零残留（' + all.length + ' 文件）', leftovers.length === 0, leftovers.slice(0, 6).join(' | '));

console.log('— E 配方与掉落合法性 —');
// 配方 materials 键：六材 + 任务物 + 套装对材（X·Y 形态）
const PAIR_RE = /^[^·]{1,3}·[^·]{1,3}$/;
const LEGAL = NDX.MAT_CORE.concat(NDX.MAT_TASK);
const recipeFiles = ['js/equipment_part1.js', 'js/equipment_part2.js', 'js/equipment_part3.js'];
const badKeys = [];
recipeFiles.forEach((f) => {
  const src = files[f] || '';
  [...src.matchAll(/materials:\s*\{([^}]*)\}/g)].forEach((m) => {
    [...m[1].matchAll(/'([^']+)':\s*\d+/g)].forEach((k) => {
      const name = k[1];
      if (LEGAL.indexOf(name) < 0 && !PAIR_RE.test(name)) badKeys.push(f + '#' + name);
    });
  });
});
ok('配方材料键全部合法（六材/任务物/套装对材）', badKeys.length === 0, badKeys.slice(0, 5).join(' | '));
// 掉落数组：不得再引用旧名/五行单字
const dropFiles = ['js/data_map_plan.js', 'js/data_trials_story.js', 'js/enemies_part2.js'];
const badDrops = [];
dropFiles.forEach((f) => {
  const src = files[f] || '';
  [...src.matchAll(/drop:\s*\[([^\]]*)\]/g)].forEach((m) => {
    [...m[1].matchAll(/'([^']+)'/g)].forEach((k) => {
      if (legacyNames.indexOf(k[1]) >= 0) badDrops.push(f + '#' + k[1]);
    });
  });
});
ok('掉落数组零旧名', badDrops.length === 0, badDrops.slice(0, 5).join(' | '));
// petEvolve 配方（曾用 灵泉/火精/佛光舍利 等死名）键也须合法
ok('宠物进化配方键合法', (files['js/equipment_part2.js'].match(/petEvolve:\s*true/g) || []).length > 0
  && badKeys.filter((k) => k.indexOf('equipment_part2') >= 0).length === 0);

console.log('— F 经文连击链三档 —');
const sutraSrc = files['js/data_sutra.js'];
ok('break-mantra 散件档 combo 0.30 + comboDmg 0.30', /'break-mantra':\s*\{\s*slot:\s*'atk',\s*mod:\s*\{\s*combo:\s*0\.30,\s*comboDmg:\s*0\.30/.test(sutraSrc));
ok('jingSlotMods 档位判据（region×20 / (region+1)×20）', sutraSrc.indexOf('prog > rg * 20') >= 0 && sutraSrc.indexOf('prog > (rg + 1) * 20') >= 0);
ok('全本档 comboChain 0.25', sutraSrc.indexOf('comboChain = 0.25') >= 0);
ok('applyJingSlotMods 追加段伤害乘算', sutraSrc.indexOf('1 + _cd * _extra') >= 0);
ok('终极档追加段暴击（_tier≥2 ×1.5 仅乘追加段）', sutraSrc.indexOf("m._tier >= 2 && _roll(0.25)") >= 0 && sutraSrc.indexOf("_cd * _extra * 0.5") >= 0);
ok('档位只挂 break-mantra（b.mod.combo 前置）', sutraSrc.indexOf('if (b.mod && b.mod.combo)') >= 0);
ok('连击叙事 note 透出（经连击/×2/连击暴）', sutraSrc.indexOf("·经连击'") >= 0 && sutraSrc.indexOf("·连击暴") >= 0);

console.log('— G 零回归前置 —');
ok('旧 combo 0.18 不复存在（改 0.30 为拍板平衡项）', sutraSrc.indexOf('combo: 0.18') < 0);
ok('迁移入口接入 restoreRun', (files['js/game/game_rest.js'] || '').indexOf('migrateLegacyMaterials') >= 0);
ok('commonMatsForLayer 兼容保留（调用方不改）', typeof NDX.commonMatsForLayer === 'function' && (files['js/game/game_loot.js'] || '').indexOf('commonMatsForLayer') >= 0);
ok('MAT_CORE/MAT_TASK 导出（UI/图鉴后续消费）', Array.isArray(NDX.MAT_CORE) && Array.isArray(NDX.MAT_TASK));

console.log('\n=== _verify_materials：' + pass + ' 通过 / ' + fail + ' 失败 ===');
process.exit(fail ? 1 : 0);
