#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新sound.js中剩余的音效，让它们也优先使用文件
"""

import re

sound_path = r"D:\xiyou\demo\js\sound.js"

with open(sound_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 更新skill音效
old_skill = "case 'skill':   this._strike(660, 0.14, { type: 'triangle', vol: 0.3, overtone: 1.5 }); this._timeout(() => this._tone(880, 0.12, { type: 'sine', vol: 0.25, glide: 1320 }), 60); break; // 技能释放"
new_skill = "case 'skill':   this._sfxFile('skill', () => { this._strike(660, 0.14, { type: 'triangle', vol: 0.3, overtone: 1.5 }); this._timeout(() => this._tone(880, 0.12, { type: 'sine', vol: 0.25, glide: 1320 }), 60); }); break; // 技能释放"
if old_skill in content:
    content = content.replace(old_skill, new_skill)
    print("✅ skill 音效已更新")
else:
    print("⚠️ skill 音效未找到，使用正则...")
    pattern = r"case 'skill':\s*[^;]+;\s*[^;]+;\s*break;"
    match = re.search(pattern, content)
    if match:
        content = content.replace(match.group(0), new_skill)
        print("✅ skill 音效已通过正则更新")

# 2. 更新equip音效
old_equip = "case 'equip':   this._strike(520, 0.1, { type: 'triangle', vol: 0.28, overtone: 2 }); this._timeout(() => this._tone(780, 0.14, { type: 'sine', vol: 0.25 }), 80); break; // 装备获得"
new_equip = "case 'equip':   this._sfxFile('equip', () => { this._strike(520, 0.1, { type: 'triangle', vol: 0.28, overtone: 2 }); this._timeout(() => this._tone(780, 0.14, { type: 'sine', vol: 0.25 }), 80); }); break; // 装备获得"
if old_equip in content:
    content = content.replace(old_equip, new_equip)
    print("✅ equip 音效已更新")

# 3. 更新seal音效
old_seal = "case 'seal':    this._tone(440, 0.12, { type: 'sine', vol: 0.25, glide: 660 }); this._timeout(() => this._tone(660, 0.16, { type: 'sine', vol: 0.28, glide: 880 }), 100); break; // 劫印获得"
new_seal = "case 'seal':    this._sfxFile('seal', () => { this._tone(440, 0.12, { type: 'sine', vol: 0.25, glide: 660 }); this._timeout(() => this._tone(660, 0.16, { type: 'sine', vol: 0.28, glide: 880 }), 100); }); break; // 劫印获得"
if old_seal in content:
    content = content.replace(old_seal, new_seal)
    print("✅ seal 音效已更新")

# 4. 更新heal音效
old_heal = "case 'heal':    this._tone(523, 0.12, { type: 'sine', vol: 0.22, glide: 784 }); this._timeout(() => this._tone(659, 0.16, { type: 'sine', vol: 0.24, glide: 880 }), 80); break; // 治疗（上行）"
new_heal = "case 'heal':    this._sfxFile('heal', () => { this._tone(523, 0.12, { type: 'sine', vol: 0.22, glide: 784 }); this._timeout(() => this._tone(659, 0.16, { type: 'sine', vol: 0.24, glide: 880 }), 80); }); break; // 治疗（上行）"
if old_heal in content:
    content = content.replace(old_heal, new_heal)
    print("✅ heal 音效已更新")

# 5. 更新treasure音效
old_treasure = "case 'treasure': this._strike(1000, 0.12, { type: 'sine', vol: 0.3, overtone: 1.5 }); this._timeout(() => this._tone(1200, 0.2, { type: 'sine', vol: 0.3, glide: 1500 }), 90); break;"
new_treasure = "case 'treasure': this._sfxFile('treasure', () => { this._strike(1000, 0.12, { type: 'sine', vol: 0.3, overtone: 1.5 }); this._timeout(() => this._tone(1200, 0.2, { type: 'sine', vol: 0.3, glide: 1500 }), 90); }); break;"
if old_treasure in content:
    content = content.replace(old_treasure, new_treasure)
    print("✅ treasure 音效已更新")

# 6. 更新warn音效
old_warn = "case 'warn':    this._tone(330, 0.15, { type: 'square', vol: 0.18, glide: 220 }); this._timeout(() => this._tone(330, 0.15, { type: 'square', vol: 0.18, glide: 220 }), 200); break; // 警告（双声）"
new_warn = "case 'warn':    this._sfxFile('warn', () => { this._tone(330, 0.15, { type: 'square', vol: 0.18, glide: 220 }); this._timeout(() => this._tone(330, 0.15, { type: 'square', vol: 0.18, glide: 220 }), 200); }); break; // 警告（双声）"
if old_warn in content:
    content = content.replace(old_warn, new_warn)
    print("✅ warn 音效已更新")

# 7. 更新roll音效
old_roll = """case 'roll':    // 骰子滚动→落定
          this._tone(900, 0.05, { type: 'square', vol: 0.12, glide: 300 });
          this._timeout(() => this._tone(1200, 0.05, { type: 'square', vol: 0.12, glide: 400 }), 90);
          this._timeout(() => this._strike(740, 0.18, { type: 'triangle', vol: 0.4 }), 180);
          break;"""

new_roll = """case 'roll':    // 骰子滚动→落定（优先使用文件）
          this._sfxFile('roll', () => {
            this._tone(900, 0.05, { type: 'square', vol: 0.12, glide: 300 });
            this._timeout(() => this._tone(1200, 0.05, { type: 'square', vol: 0.12, glide: 400 }), 90);
            this._timeout(() => this._strike(740, 0.18, { type: 'triangle', vol: 0.4 }), 180);
          }); break;"""

if old_roll in content:
    content = content.replace(old_roll, new_roll)
    print("✅ roll 音效已更新")

# 8. 添加attack音效（在play函数中添加attack的case）
# 找到hit的case，在它前面添加attack的case
old_hit = "case 'hit':     this._sfxFile('hit', () => { this._strike(180, 0.12, { vol: 0.4, overtone: 1.8 }); }); break;  // 受击闷响"
new_attack_and_hit = """case 'attack':  this._sfxFile('attack', () => { this._strike(300, 0.1, { type: 'triangle', vol: 0.35, overtone: 1.5 }); }); break; // 攻击
        case 'hit':     this._sfxFile('hit', () => { this._strike(180, 0.12, { vol: 0.4, overtone: 1.8 }); }); break;  // 受击闷响"""

if old_hit in content:
    content = content.replace(old_hit, new_attack_and_hit)
    print("✅ attack 音效已添加")
else:
    print("⚠️ attack 音效添加失败，未找到hit的case")

# 保存文件
with open(sound_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ sound.js剩余音效更新完成！")
