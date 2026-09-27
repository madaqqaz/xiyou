// _rescale_gear.js — 批A 装备重定标一次性脚本（V9.5x 综合量纲）
// ---------------------------------------------------------------------------
// 用途：把英雄链装备（凡品/成长件/T2成品/隐藏套装）的数值字段
//   按「全系统综合数值设计合同」锚点重定标：
//     · 三槽 atk/matk = 当章裸号 × [ch1 1.5 / ch2 1.8 / ch3 2.0 / ch4+ 2.1]
//     · 三槽 maxHp  = 当章裸号 × [ch1 2.0 / ch2 2.5 / ch3+ 2.8]
//     · 三槽 dr 供给渐进收敛：ch1 ~0.12 / ch2 ~0.15 / ch3 ~0.17 / ch4 ~0.19
//   只改数值字段与 desc 文案（攻+X 血+Y 等），不动结构/配方/ID。
// 用法：node scripts/_rescale_gear.js（幂等：二次运行无副作用）
// 验收：scripts/_retired/_tmp_20260927/_tmp_gear_anchor.js 输出三槽倍率 ∈ 目标区间
'use strict';
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'js', 'equipment_part1.js');

// —— 重定标表：id → { fields, desc } ——
// fields 仅列出要覆盖的数值字段；desc 为同步后的展示文案（含数值）。
const REPL = {
  // ===== 取经人（法系：主愿伤 matk）=====
  ts_staff_fan:  { fields: { atk: 20, matk: 176, hp: 100, dr: 0 }, desc: '愿伤+176 攻+20 血+100（取经人·凡品锡杖·法杖·纯愿伤）' },
  ts_robe_fan:   { fields: { atk: 0, hp: 650, dr: 0.09, mdef: 0.06 }, desc: '血+650 减伤+9% 御念+6%（取经人·凡品袈裟）' },
  ts_bowl_fan:   { fields: { atk: 0, matk: 95, hp: 550, dr: 0.04 }, desc: '愿伤+95 血+550 减伤+4%。【法宝·紫金钵盂·取经人特有】非战斗回满气血（3/3）；可在土地庙补满。' },
  ts_weapon_ch2: { fields: { atk: 30, matk: 345, hp: 160, dr: 0.02 }, desc: '攻+30 愿伤+345 血+160 减伤+2%（取经人·杖·第二章成长·以愿伤为主）' },
  ts_armor_ch2:  { fields: { atk: 0, hp: 975, dr: 0.11, mdef: 0.08 }, desc: '血+975 减伤+11% 御念+8%（取经人·衣·第二章成长）' },
  ts_treasure_ch2:{ fields: { atk: 0, matk: 185, hp: 815, dr: 0.05 }, desc: '愿伤+185 血+815 减伤+5%。【法宝·紫金钵盂·慈·取经人特有·第二章成长】非战斗回满气血（恶+8，代价稍减）（3/3）；可在土地庙补满。' },
  ts_weapon_ch3: { fields: { atk: 40, matk: 430, hp: 190, dr: 0.03 }, desc: '攻+40 愿伤+430 血+190 减伤+3%（取经人·杖·第三章成长·以愿伤为主）' },
  ts_armor_ch3:  { fields: { atk: 0, hp: 1170, dr: 0.12, mdef: 0.10 }, desc: '血+1170 减伤+12% 御念+10%（取经人·衣·第三章成长）' },
  ts_treasure_ch3:{ fields: { atk: 0, matk: 230, hp: 980, dr: 0.06 }, desc: '愿伤+230 血+980 减伤+6%。【法宝·紫金钵盂·悲悯·取经人特有·第三章成长】非战斗回满气血+下战怪物攻-10%（恶+5）（4/4）；可在土地庙补满。' },
  ts_weapon_ch4: { fields: { atk: 50, matk: 550, hp: 240, dr: 0.04 }, desc: '攻+50 愿伤+550 血+240 减伤+4%（取经人·终极杖·以愿伤为主）' },
  ts_armor_ch4:  { fields: { atk: 0, hp: 1170, dr: 0.13, mdef: 0.12 }, desc: '血+1170 减伤+13% 御念+12%（取经人·终极衣）' },
  ts_treasure_ch4:{ fields: { atk: 0, matk: 300, hp: 930, dr: 0.06 }, desc: '愿伤+300 血+930 减伤+6%。【法宝·紫金钵盂·无量·取经人终极】非战斗回满气血+下战怪物攻-20%（恶+3，代价极微）（5/5）；可在土地庙补满。' },

  // ===== 悟空（物理：主物攻 atk）=====
  wk_staff_base: { fields: { atk: 140, hp: 90, dr: 0 }, desc: '攻+140 血+90（悟空·棒 基座）' },
  wk_armor_base: { fields: { atk: 25, hp: 480, dr: 0.08 }, desc: '攻+25 血+480 减伤+8%（悟空·甲 基座）' },
  jingu_treasure:{ fields: { atk: 68, hp: 310, dr: 0.05 }, desc: '攻+68 血+310 减伤+5%。【法宝·如意精箍棒·悟空专属】敌人现身即削其 5%~10% 气血；每回合有概率（随法宝增强而提高）附带一记额外物理重击，自动发动、不耗充能。' },
  wk_weapon_ch2: { fields: { atk: 250, hp: 120, dr: 0.03, crit: 0.04 }, desc: '攻+250 血+120 减伤+3% 暴击+4%（悟空·兵·第二章成长）' },
  wk_armor_ch2:  { fields: { atk: 50, hp: 660, dr: 0.08 }, desc: '攻+50 血+660 减伤+8%（悟空·甲·第二章成长）' },
  wk_treasure_ch2:{ fields: { atk: 118, hp: 540, dr: 0.05 }, desc: '攻+118 血+540 减伤+5%。【法宝·如意精箍棒·悟空特有·第二章成长】敌人现身即削其5%~10%气血；每回合概率更高地附带一记额外物理重击，自动发动。' },
  wk_weapon_ch3: { fields: { atk: 360, hp: 150, dr: 0.04, crit: 0.08 }, desc: '攻+360 血+150 减伤+4% 暴击+8%（悟空·兵·第三章成长）' },
  wk_armor_ch3:  { fields: { atk: 72, hp: 790, dr: 0.10 }, desc: '攻+72 血+790 减伤+10%（悟空·甲·第三章成长）' },
  wk_treasure_ch3:{ fields: { atk: 168, hp: 640, dr: 0.06 }, desc: '攻+168 血+640 减伤+6%。【法宝·如意精箍棒·悟空特有·第三章成长】敌人现身即削其8%~15%气血；每回合概率更高地附带一记额外物理重击，自动发动。' },
  wk_weapon_ch4: { fields: { atk: 465, hp: 190, dr: 0.05, crit: 0.12 }, desc: '攻+465 血+190 减伤+5% 暴击+12%（悟空·终极兵）' },
  wk_armor_ch4:  { fields: { atk: 93, hp: 790, dr: 0.12 }, desc: '攻+93 血+790 减伤+12%（悟空·终极甲）' },
  wk_treasure_ch4:{ fields: { atk: 217, hp: 600, dr: 0.07 }, desc: '攻+217 血+600 减伤+7%。【法宝·如意精箍棒·悟空终极】敌人现身即削其12%~20%气血；每回合高概率附带一记额外物理重击，自动发动。' },

  // ===== 八戒（物理坦克）=====
  bj_rake_fan:  { fields: { atk: 219, hp: 125, dr: 0.02 }, desc: '攻+219 血+125 减伤+2%（八戒·凡品钉耙）' },
  bj_robe_fan:  { fields: { atk: 0, hp: 680, dr: 0.08 }, desc: '血+680 减伤+8%（八戒·凡品僧衣）' },
  bj_bowl_fan:  { fields: { atk: 0, hp: 445, dr: 0.04 }, desc: '血+445 减伤+4%。【法宝·净坛宝盂·八戒特有】非战斗回满气血+下战怪物攻-10%（3/3）；可在土地庙补满。' },
  bj_rake_ch2:  { fields: { atk: 456, hp: 190, dr: 0.03, crit: 0.02 }, desc: '攻+456 血+190 减伤+3% 暴击+2%（八戒·钉耙·第二章成长）' },
  bj_robe_ch2:  { fields: { atk: 0, hp: 940, dr: 0.10 }, desc: '血+940 减伤+10%（八戒·衣·第二章成长）' },
  bj_bowl_ch2:  { fields: { atk: 0, hp: 745, dr: 0.05 }, desc: '血+745 减伤+5%。【法宝·净坛宝盂·八戒·第二章成长】非战斗回满气血+下战怪物攻-10%（3/3）；可在土地庙补满。' },
  bj_rake_ch3:  { fields: { atk: 570, hp: 280, dr: 0.04, crit: 0.04 }, desc: '攻+570 血+280 减伤+4% 暴击+4%（八戒·钉耙·第三章成长）' },
  bj_robe_ch3:  { fields: { atk: 0, hp: 1130, dr: 0.12 }, desc: '血+1130 减伤+12%（八戒·衣·第三章成长）' },
  bj_bowl_ch3:  { fields: { atk: 0, hp: 840, dr: 0.06 }, desc: '血+840 减伤+6%。【法宝·净坛宝盂·八戒·第三章成长】非战斗回满气血+下战怪物攻-10%（4/4）；可在土地庙补满。' },
  bj_rake_ch4:  { fields: { atk: 741, hp: 350, dr: 0.05, crit: 0.08 }, desc: '攻+741 血+350 减伤+5% 暴击+8%（八戒·终极钉耙）' },
  bj_robe_ch4:  { fields: { atk: 0, hp: 1130, dr: 0.14 }, desc: '血+1130 减伤+14%（八戒·终极衣）' },
  bj_bowl_ch4:  { fields: { atk: 0, hp: 770, dr: 0.07 }, desc: '血+770 减伤+7%。【法宝·净坛宝盂·八戒终极】非战斗回满气血+下战怪物攻-20%（5/5）；可在土地庙补满。' },

  // ===== 龙马/小白龙（物理闪避）=====
  lm_hoof_fan:  { fields: { atk: 228, hp: 80, dr: 0, eva: 0.06 }, desc: '攻+228 血+80 闪避+6%（龙马·凡品龙蹄）' },
  lm_scale_fan: { fields: { atk: 31, hp: 500, dr: 0.06, eva: 0.05 }, desc: '攻+31 血+500 减伤+6% 闪避+5%（龙马·凡品逆鳞）' },
  lm_bowl_fan:  { fields: { atk: 0, hp: 420, dr: 0.04 }, desc: '血+420 减伤+4%。【法宝·避水珠·龙马专属】非战斗回满气血（3/3）；可在土地庙补满。' },
  lm_weapon_ch2:{ fields: { atk: 458, hp: 150, dr: 0, eva: 0.10, crit: 0.04 }, desc: '攻+458 血+150 闪避+10% 暴击+4%（龙马·蹄·第二章成长）' },
  lm_armor_ch2: { fields: { atk: 62, hp: 750, dr: 0.06, eva: 0.08 }, desc: '攻+62 血+750 减伤+6% 闪避+8%（龙马·鳞·第二章成长）' },
  lm_treasure_ch2:{ fields: { atk: 0, hp: 600, dr: 0.05 }, desc: '血+600 减伤+5%。【法宝·避水珠·龙马专属·第二章成长】非战斗回满气血（3/3）；可在土地庙补满。' },
  lm_weapon_ch3:{ fields: { atk: 572, hp: 180, dr: 0, eva: 0.14, crit: 0.08 }, desc: '攻+572 血+180 闪避+14% 暴击+8%（龙马·蹄·第三章成长）' },
  lm_armor_ch3: { fields: { atk: 78, hp: 900, dr: 0.07, eva: 0.12 }, desc: '攻+78 血+900 减伤+7% 闪避+12%（龙马·鳞·第三章成长）' },
  lm_treasure_ch3:{ fields: { atk: 0, hp: 720, dr: 0.05 }, desc: '血+720 减伤+5%。【法宝·避水珠·龙马专属·第三章成长】非战斗回满气血（4/4）；可在土地庙补满。' },
  lm_weapon_ch4:{ fields: { atk: 729, hp: 220, dr: 0, eva: 0.20, crit: 0.12 }, desc: '攻+729 血+220 闪避+20% 暴击+12%（龙马·终极蹄）' },
  lm_armor_ch4: { fields: { atk: 100, hp: 900, dr: 0.08, eva: 0.16 }, desc: '攻+100 血+900 减伤+8% 闪避+16%（龙马·终极鳞）' },
  lm_treasure_ch4:{ fields: { atk: 0, hp: 680, dr: 0.06 }, desc: '血+680 减伤+6%。【法宝·避水珠·龙马终极】非战斗回满气血（5/5）；可在土地庙补满。' },

  // ===== 沙僧（混合：体法双修）=====
  ss_staff_fan: { fields: { atk: 140, matk: 100, hp: 90, dr: 0.03, mdef: 0.04 }, desc: '攻+140 愿伤+100 血+90 减伤+3% 御念+4%（沙僧·凡品宝杖）' },
  ss_robe_fan:  { fields: { atk: 0, hp: 575, dr: 0.08, mdef: 0.06 }, desc: '血+575 减伤+8% 御念+6%（沙僧·凡品僧袍）' },
  ss_bowl_fan:  { fields: { atk: 93, matk: 131, hp: 485, dr: 0.04, mdef: 0.04 }, desc: '攻+93 愿伤+131 血+485 减伤+4% 御念+4%。【法宝·降妖念珠·沙僧专属】非战斗回满气血+下战怪物攻-10%（3/3）；可在土地庙补满。' },
  ss_weapon_ch2:{ fields: { atk: 288, matk: 310, hp: 140, dr: 0.04, mdef: 0.08 }, desc: '攻+288 愿伤+310 血+140 减伤+4% 御念+8%（沙僧·杖·第二章成长）' },
  ss_armor_ch2: { fields: { atk: 0, hp: 860, dr: 0.09, mdef: 0.08 }, desc: '血+860 减伤+9% 御念+8%（沙僧·袍·第二章成长）' },
  ss_treasure_ch2:{ fields: { atk: 192, matk: 186, hp: 725, dr: 0.05, mdef: 0.08 }, desc: '攻+192 愿伤+186 血+725 减伤+5% 御念+8%。【法宝·降妖念珠·净·沙僧专属·第二章成长】非战斗回满气血+下战怪物攻-10%；战斗中佛光伤敌10%（3/3）；可在土地庙补满。' },
  ss_weapon_ch3:{ fields: { atk: 360, matk: 372, hp: 170, dr: 0.05, mdef: 0.12 }, desc: '攻+360 愿伤+372 血+170 减伤+5% 御念+12%（沙僧·杖·第三章成长）' },
  ss_armor_ch3: { fields: { atk: 0, hp: 1035, dr: 0.10, mdef: 0.10 }, desc: '血+1035 减伤+10% 御念+10%（沙僧·袍·第三章成长）' },
  ss_treasure_ch3:{ fields: { atk: 240, matk: 248, hp: 865, dr: 0.06, mdef: 0.12 }, desc: '攻+240 愿伤+248 血+865 减伤+6% 御念+12%。【法宝·降妖念珠·梵音·沙僧专属·第三章成长】非战斗回满气血+下战怪物攻-20%；战斗中佛光伤敌15%（4/4）；可在土地庙补满。' },
  ss_weapon_ch4:{ fields: { atk: 464, matk: 487, hp: 210, dr: 0.06, mdef: 0.18 }, desc: '攻+464 愿伤+487 血+210 减伤+6% 御念+18%（沙僧·终极杖）' },
  ss_armor_ch4: { fields: { atk: 0, hp: 1035, dr: 0.12, mdef: 0.12 }, desc: '血+1035 减伤+12% 御念+12%（沙僧·终极袍）' },
  ss_treasure_ch4:{ fields: { atk: 310, matk: 324, hp: 825, dr: 0.07, mdef: 0.16 }, desc: '攻+310 愿伤+324 血+825 减伤+7% 御念+16%。【法宝·降妖念珠·无量·沙僧终极】非战斗回满气血+下战怪物攻-30%；战斗中佛光伤敌20%（5/5）；可在土地庙补满。' },

  // ===== T2 成品（合成流，≈同章成长件强度）=====
  ts_staff_top: { fields: { atk: 30, matk: 230, hp: 140, dr: 0.04 }, desc: '攻+30 愿伤+230 血+140 减伤+4%（取经人·锡杖 成品·法杖·以愿伤为主）' },
  ts_robe_top:  { fields: { atk: 0, hp: 900, dr: 0.13 }, desc: '血+900 减伤+13%（取经人·袈裟 成品）' },
  ts_bowl_top:  { fields: { atk: 0, hp: 580, dr: 0.06 }, desc: '血+580 减伤+6%（取经人·钵 成品）。【法宝·紫金钵·取经人特有】非战斗可祭出：化缘回满气血，然每用一次迷失一分本心（恶+，解锁取经人暗线）' },
  wk_staff_top: { fields: { atk: 310, hp: 100, dr: 0.04 }, desc: '攻+310 血+100 减伤+4%（悟空·棒 成品）' },
  wk_armor_top: { fields: { atk: 50, hp: 640, dr: 0.10 }, desc: '攻+50 血+640 减伤+10%（悟空·甲 成品）' },
  wk_crown_top: { fields: { atk: 130, hp: 120, dr: 0.04 }, desc: '攻+130 血+120 减伤+4%（悟空·冠 成品·头冠）' },
  bj_rake_top:  { fields: { atk: 210, hp: 120, dr: 0.06 }, desc: '攻+210 血+120 减伤+6%（八戒·耙 成品）' },
  bj_robe_top:  { fields: { atk: 0, hp: 900, dr: 0.12 }, desc: '血+900 减伤+12%（八戒·衣 成品）' },
  bj_belly_top: { fields: { atk: 0, hp: 680, dr: 0.08 }, desc: '血+680 减伤+8%（八戒·腹 成品）' },
  lm_hoof_top:  { fields: { atk: 210, hp: 80, dr: 0, eva: 0.14 }, desc: '攻+210 血+80 闪避+14%（龙马·蹄 成品）' },
  lm_saddle_top:{ fields: { atk: 60, hp: 320, dr: 0.07, eva: 0.12 }, desc: '攻+60 血+320 减伤+7% 闪避+12%（龙马·鞍 成品）' },
  lm_scale_top: { fields: { atk: 80, hp: 240, dr: 0.06, eva: 0.10 }, desc: '攻+80 血+240 减伤+6% 闪避+10%（龙马·鳞 成品）' },
  ss_staff_top: { fields: { atk: 190, matk: 120, hp: 100, dr: 0.04, mdef: 0.10 }, desc: '攻+190 愿伤+120 血+100 减伤+4% 御念+10%（沙僧·杖 成品）' },
  ss_skull_top: { fields: { atk: 80, matk: 80, hp: 500, dr: 0.07, mdef: 0.12 }, desc: '攻+80 愿伤+80 血+500 减伤+7% 御念+12%（沙僧·串 成品）' },
  ss_robe_top:  { fields: { atk: 0, hp: 700, dr: 0.10, mdef: 0.10 }, desc: '血+700 减伤+10% 御念+10%（沙僧·袍 成品）' },
  set_weapon_top:{ fields: { atk: 130, hp: 0, dr: 0.06 }, desc: '攻+130 减伤+6%（套装·破军 成品）' },
  set_armor_top: { fields: { atk: 0, hp: 900, dr: 0.14 }, desc: '血+900 减伤+14% 每场战斗后回血+90（套装·玄武 成品）' },
  set_treasure_top:{ fields: { atk: 90, hp: 600, dr: 0.08 }, desc: '攻+90 血+600 减伤+8%（套装·贪狼 成品）' },

  // ===== 隐藏套装（天命 ch1 / 涅槃 ch3）=====
  tm_w_base: { fields: { atk: 130, hp: 90, dr: 0 }, desc: '攻+130 血+90（天命·剑·兵基座）' },
  tm_a_base: { fields: { atk: 0, hp: 650, dr: 0.09 }, desc: '血+650 减伤+9%（天命·甲·甲基座）' },
  tm_t_base: { fields: { atk: 95, hp: 560, dr: 0.04 }, desc: '攻+95 血+560 减伤+4%（天命·佩·宝基座）' },
  np_w_base: { fields: { atk: 280, hp: 150, dr: 0, hpRegen: 4 }, desc: '攻+280 血+150 回血+4（涅槃·杖·兵基座）' },
  np_a_base: { fields: { atk: 0, hp: 1150, dr: 0.12, hpRegen: 8 }, desc: '血+1150 减伤+12% 回血+8（涅槃·袍·甲基座）' },
  np_t_base: { fields: { atk: 0, hp: 1040, dr: 0.06, hpRegen: 5 }, desc: '血+1040 减伤+6% 回血+5（涅槃·珠·宝基座）' },
};

// —— 执行：整行字段替换 + desc 替换 ——
const src = fs.readFileSync(FILE, 'utf8');
const lines = src.split('\n');
let replaced = 0, errors = [];
for (const [id, spec] of Object.entries(REPL)) {
  const idx = lines.findIndex((l) => l.includes(`id: '${id}'`) || l.includes(`id: "${id}"`));
  if (idx < 0) { errors.push(`未找到 ${id}`); continue; }
  let line = lines[idx];
  const before = line;
  for (const [k, v] of Object.entries(spec.fields)) {
    const re = new RegExp(`\\b${k}:\\s*[^,}]+`);
    if (re.test(line)) {
      line = line.replace(re, `${k}: ${v}`);
    } else if (k === 'matk' && !line.includes('matk:')) {
      // 法系装备原行无愿伤字段 → 注入到 desc 之前（保持对象合法）
      if (!/,\s*desc:/.test(line)) { errors.push(`${id}.${k} 无 desc 锚点可注入`); continue; }
      line = line.replace(/,\s*desc:/, `, matk: ${v}, desc:`);
    } else {
      errors.push(`${id}.${k} 字段未匹配`); continue;
    }
  }
  if (!spec.keepDesc && spec.desc) {
    const dre = /desc: '[^']*'/;
    if (dre.test(line)) line = line.replace(dre, `desc: '${spec.desc}'`);
    else errors.push(`${id}.desc 未匹配`);
  }
  if (line !== before) { lines[idx] = line; replaced++; }
}
if (errors.length) {
  console.error('重定标失败：\n' + errors.join('\n'));
  process.exit(1);
}
fs.writeFileSync(FILE, lines.join('\n'), 'utf8');
console.log(`装备重定标完成：${replaced}/${Object.keys(REPL).length} 行已替换`);
