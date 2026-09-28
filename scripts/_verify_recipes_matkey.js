// _verify_recipes_matkey.js — S03 §⑤-1/6 门禁：配方材料重复键静态守卫
// 断言：equipment_part2.js 的 RECIPES 中，每个 materials:{...} 块不得有重复材料键
//       （JS 对象字面量重复键后者覆盖前者 → 材料成本静默坍缩，合成决策失真，P0 数值债务）。
// 由 scripts/_run_all_gates.js 的 /^(_smoke_|test_|_verify_).*\.js$/ 正则自动收录。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'js', 'equipment_part2.js'), 'utf8');
let fail = 0;
const failMsg = (m) => { console.log('FAIL ' + m); fail++; };
const ok = (c, m) => { if (!c) failMsg(m); };

// 1) 逐 materials 块：键唯一
const blocks = [...src.matchAll(/materials:\s*\{([^}]*)\}/g)];
let dupBlocks = 0;
blocks.forEach((b, i) => {
  const keys = [...b[1].matchAll(/'([^']+)'\s*:\s*([^,}]+)/g)].map((m) => m[1].trim());
  const seen = {};
  const dups = keys.filter((k) => (seen[k] ? true : ((seen[k] = 1), false)));
  if (dups.length) { dupBlocks++; failMsg(`materials 块#${i} 重复键: ${[...new Set(dups)].join(',')}`); }
});
ok(dupBlocks === 0, `RECIPES 不应有材料重复键（检测到 ${dupBlocks} 块）`);

// 2) 全局相邻重复键模式禁绝（宽口径回归防线）
const adj = src.match(/'([^']+)':\s*\d+,\s*'\1'/g) || [];
ok(adj.length === 0, `全文件不应出现相邻重复键 'x':n,'x'（命中 ${adj.length}）`);

if (fail === 0) console.log(`ok / RECIPES 材料重复键守卫通过（${blocks.length} 个 materials 块）`);
else console.log(fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
