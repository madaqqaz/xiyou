// _rescale_pets.js — 批A 宠物联动重定标（一次性脚本，勿重复运行）
// ---------------------------------------------------------------------------
// 用途：把 equipment_part1.js 中 slot:'pet' 的固定值按「全系统综合数值设计合同」
//   缩放进新量纲（装备重定标后裸号 atk 467-1000，原宠物 atk 5-28 形同虚设）：
//     · atk/matk 按章分档 ×[5,4.5,4.5,4,4]（ch1/ch2/ch3/ch4/ch5+）
//     · hp 按章分档 ×[6,5.5,5,4.5,4]
//     · dr 供给收敛：ch1 ≤0.04 / ch2 ≤0.05 / ch3+ ≤0.06
//   只改数值字段与 desc 数值前缀，不动 id/结构/进化链/petPassive。
// 验收：scripts/_retired/_tmp_20260927/_tmp_pet_anchor.js 输出宠物供给 ≈ 裸号 攻≥10% / 血≥18%。
'use strict';
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'js', 'equipment_part1.js');

// 章 → 缩放系数 / dr 上限
const K = {
  1: { atk: 5, hp: 6, drCap: 0.04 },
  2: { atk: 4.5, hp: 5.5, drCap: 0.05 },
  3: { atk: 4.5, hp: 5, drCap: 0.06 },
  4: { atk: 4, hp: 4.5, drCap: 0.06 },
};
const kOf = (ch) => K[ch] || { atk: 4, hp: 4, drCap: 0.06 };

function prefix(e) {
  const p = [];
  if (e.atk > 0) p.push(`攻+${e.atk}`);
  if (e.matk > 0) p.push(`愿伤+${e.matk}`);
  if (e.hp > 0) p.push(`血+${e.hp}`);
  if (e.dr > 0) p.push(`减伤+${Math.round(e.dr * 100)}%`);
  if (e.eva > 0) p.push(`闪避+${Math.round(e.eva * 100)}%`);
  if (e.mdef > 0) p.push(`御念+${Math.round(e.mdef * 100)}%`);
  if (e.cri > 0) p.push(`暴击+${Math.round(e.cri * 100)}%`);
  return p.join(' ');
}

const src = fs.readFileSync(FILE, 'utf8');
const lines = src.split('\n');
let replaced = 0, errors = [];
lines.forEach((line, i) => {
  if (!line.includes("slot: 'pet'")) return;
  const g = (k) => { const m = line.match(new RegExp(`\\b${k}:\\s*([0-9.]+)`)); return m ? parseFloat(m[1]) : null; };
  const ch = g('chapter') || 1;
  const k = kOf(ch);
  const e = {
    atk: g('atk') || 0, matk: g('matk') || 0, hp: g('hp') || 0,
    dr: g('dr') || 0, eva: g('eva') || 0, mdef: g('mdef') || 0, cri: g('cri') || 0,
  };
  const n = {
    atk: Math.round(e.atk * k.atk), matk: Math.round(e.matk * k.atk),
    hp: Math.round(e.hp * k.hp), dr: Math.min(e.dr, k.drCap),
    eva: Math.min(e.eva, 0.20), mdef: Math.min(e.mdef, 0.12), cri: Math.min(e.cri, 0.20),
  };
  let line2 = line;
  for (const f of ['atk', 'matk', 'hp', 'dr', 'eva', 'mdef', 'cri']) {
    if (g(f) != null) line2 = line2.replace(new RegExp(`\\b${f}:\\s*[0-9.]+`), `${f}: ${n[f]}`);
  }
  // desc 数值前缀重写（保留「（机制）」原文）
  const dm = line2.match(/desc: '([^']*)'/);
  if (dm) {
    const idx = dm[1].indexOf('（');
    if (idx > 0) {
      const suffix = dm[1].slice(idx);
      const nd = prefix(n) + suffix;
      line2 = line2.replace(/desc: '[^']*'/, `desc: '${nd}'`);
    } else {
      // 无括号机制：整体重写为纯数值前缀
      line2 = line2.replace(/desc: '[^']*'/, `desc: '${prefix(n)}'`);
    }
  } else {
    errors.push(`行${i + 1} 无 desc`);
  }
  if (line2 !== line) { lines[i] = line2; replaced++; }
});
if (errors.length) { console.error('宠物重定标失败：\n' + errors.join('\n')); process.exit(1); }
fs.writeFileSync(FILE, lines.join('\n'), 'utf8');
console.log(`宠物重定标完成：${replaced} 行已替换`);
