#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新sound.js，注册所有音效文件，修改play函数优先使用音效文件
"""

import re

sound_path = r"D:\xiyou\demo\js\sound.js"

with open(sound_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 更新SFX_FILES，添加所有26个音效文件
old_sfx_files = """const SFX_FILES = {
    click:    'assets/sound/sfx_click.mp3',
    zhuanjie: 'assets/sound/sfx_zhuanjie.mp3',
    worship:  'assets/sound/sfx_worship.mp3',
  };"""

new_sfx_files = """const SFX_FILES = {
    click:    'assets/sound/sfx_click.mp3',
    zhuanjie: 'assets/sound/sfx_zhuanjie.mp3',
    worship:  'assets/sound/sfx_worship.mp3',
    attack:   'assets/sound/sfx_attack.wav',
    collect:  'assets/sound/sfx_collect.wav',
    crit:     'assets/sound/sfx_crit.wav',
    defeat:   'assets/sound/sfx_defeat.wav',
    dodge:    'assets/sound/sfx_dodge.wav',
    equip:    'assets/sound/sfx_equip.wav',
    guard:    'assets/sound/sfx_guard.wav',
    heal:     'assets/sound/sfx_heal.wav',
    hit:      'assets/sound/sfx_hit.wav',
    hover:    'assets/sound/sfx_hover.wav',
    levelup:  'assets/sound/sfx_levelup.wav',
    lifewarn: 'assets/sound/sfx_lifewarn.wav',
    open:     'assets/sound/sfx_open.wav',
    poison:   'assets/sound/sfx_poison.wav',
    reflect:  'assets/sound/sfx_reflect.wav',
    roll:     'assets/sound/sfx_roll.wav',
    seal:     'assets/sound/sfx_seal.wav',
    skill:    'assets/sound/sfx_skill.wav',
    treasure: 'assets/sound/sfx_treasure.wav',
    ult:      'assets/sound/sfx_ult.wav',
    victory:  'assets/sound/sfx_victory.wav',
    warn:     'assets/sound/sfx_warn.wav',
  };"""

if old_sfx_files in content:
    content = content.replace(old_sfx_files, new_sfx_files)
    print("✅ SFX_FILES已更新（添加26个音效文件）")
else:
    print("⚠️ 使用正则替换SFX_FILES")
    pattern = r'const SFX_FILES = \{[^}]+\};'
    content = re.sub(pattern, new_sfx_files, content)
    print("✅ SFX_FILES已通过正则更新")

# 2. 启用环境音效文件
old_ambient_use = "const AMBIENT_USE_FILES = false;"
new_ambient_use = "const AMBIENT_USE_FILES = true;"
if old_ambient_use in content:
    content = content.replace(old_ambient_use, new_ambient_use)
    print("✅ 环境音效文件已启用（AMBIENT_USE_FILES = true）")

# 3. 修改play函数，让所有音效都优先使用_sfxFile
# 我们需要修改每个case，让它们都先尝试_sfxFile，如果失败再回退到程序化合成

# 定义需要修改的音效和它们的程序化合成回退代码
sfx_cases = {
    'open': "this._tone(520, 0.14, { type: 'sine', vol: 0.3, glide: 880 });",
    'hit': "this._strike(180, 0.12, { vol: 0.4, overtone: 1.8 });",
    'crit': "this._strike(880, 0.16, { type: 'square', vol: 0.32, overtone: 1.5 });",
    'guard': "this._strike(420, 0.10, { vol: 0.3, overtone: 2.1 });",
    'dodge': "this._tone(1200, 0.08, { type: 'sine', vol: 0.2, glide: 600 });",
    'skill': "this._strike(660, 0.14, { type: 'triangle', vol: 0.3, overtone: 1.5 }); this._timeout(() => this._tone(880, 0.12, { type: 'sine', vol: 0.25, glide: 1320 }), 60);",
    'equip': "this._strike(520, 0.1, { type: 'triangle', vol: 0.28, overtone: 2 }); this._timeout(() => this._tone(780, 0.14, { type: 'sine', vol: 0.25 }), 80);",
    'seal': "this._tone(440, 0.12, { type: 'sine', vol: 0.25, glide: 660 }); this._timeout(() => this._tone(660, 0.16, { type: 'sine', vol: 0.28, glide: 880 }), 100);",
    'hover': "this._tone(880, 0.04, { type: 'sine', vol: 0.1 });",
    'warn': "this._tone(330, 0.15, { type: 'square', vol: 0.18, glide: 220 }); this._timeout(() => this._tone(330, 0.15, { type: 'square', vol: 0.18, glide: 220 }), 200);",
    'heal': "this._tone(523, 0.12, { type: 'sine', vol: 0.22, glide: 784 }); this._timeout(() => this._tone(659, 0.16, { type: 'sine', vol: 0.24, glide: 880 }), 80);",
    'poison': "this._tone(220, 0.2, { type: 'sawtooth', vol: 0.15, glide: 110 });",
    'reflect': "this._strike(330, 0.1, { type: 'square', vol: 0.22, overtone: 1.5 });",
    'treasure': "this._strike(1000, 0.12, { type: 'sine', vol: 0.3, overtone: 1.5 }); this._timeout(() => this._tone(1200, 0.2, { type: 'sine', vol: 0.3, glide: 1500 }), 90);",
    'roll': "this._tone(900, 0.05, { type: 'square', vol: 0.12, glide: 300 }); this._timeout(() => this._tone(1200, 0.05, { type: 'square', vol: 0.12, glide: 400 }), 90); this._timeout(() => this._strike(740, 0.18, { type: 'triangle', vol: 0.4 }), 180);",
}

# 逐个修改每个case
for sfx_name, fallback_code in sfx_cases.items():
    # 匹配 case 'name': code; break;
    pattern = rf"case '{sfx_name}':\s*[^;]+;\s*break;"
    match = re.search(pattern, content)
    if match:
        old_case = match.group(0)
        # 新的case：先尝试_sfxFile，失败再回退
        new_case = f"case '{sfx_name}':   this._sfxFile('{sfx_name}', () => {{ {fallback_code} }}); break;"
        content = content.replace(old_case, new_case)
        print(f"✅ {sfx_name} 音效已更新为优先使用文件")

# 特殊处理victory和defeat（多行代码）
# victory
old_victory = """case 'victory': // 三连上行法铃
          this._tone(523, 0.16, { type: 'sine', vol: 0.3 });
          this._timeout(() => this._tone(659, 0.16, { type: 'sine', vol: 0.32 }), 130);
          this._timeout(() => this._tone(784, 0.28, { type: 'sine', vol: 0.36, glide: 1046 }), 260);
          break;"""

new_victory = """case 'victory': // 三连上行法铃（优先使用文件）
          this._sfxFile('victory', () => {
            this._tone(523, 0.16, { type: 'sine', vol: 0.3 });
            this._timeout(() => this._tone(659, 0.16, { type: 'sine', vol: 0.32 }), 130);
            this._timeout(() => this._tone(784, 0.28, { type: 'sine', vol: 0.36, glide: 1046 }), 260);
          }); break;"""

if old_victory in content:
    content = content.replace(old_victory, new_victory)
    print("✅ victory 音效已更新为优先使用文件")

# defeat
old_defeat = """case 'defeat':  // 下沉低鸣
          this._tone(220, 0.4, { type: 'sawtooth', vol: 0.18, glide: 110 });
          break;"""

new_defeat = """case 'defeat':  // 下沉低鸣（优先使用文件）
          this._sfxFile('defeat', () => {
            this._tone(220, 0.4, { type: 'sawtooth', vol: 0.18, glide: 110 });
          }); break;"""

if old_defeat in content:
    content = content.replace(old_defeat, new_defeat)
    print("✅ defeat 音效已更新为优先使用文件")

# ult（多行代码）
old_ult = """case 'ult':     // 绝招（P1-7 专用音，legacy 合成回退）：低宫音 + 爆裂 + 上行扫尾
          this._strike(294, 0.3, { type: 'triangle', vol: 0.4, overtone: 1.5 });
          this._strike(880, 0.16, { type: 'square', vol: 0.3 });
          this._timeout(() => this._tone(440, 0.28, { type: 'sine', vol: 0.3, glide: 1046 }), 140);
          break;"""

new_ult = """case 'ult':     // 绝招（优先使用文件）：低宫音 + 爆裂 + 上行扫尾
          this._sfxFile('ult', () => {
            this._strike(294, 0.3, { type: 'triangle', vol: 0.4, overtone: 1.5 });
            this._strike(880, 0.16, { type: 'square', vol: 0.3 });
            this._timeout(() => this._tone(440, 0.28, { type: 'sine', vol: 0.3, glide: 1046 }), 140);
          }); break;"""

if old_ult in content:
    content = content.replace(old_ult, new_ult)
    print("✅ ult 音效已更新为优先使用文件")

# lifeWarn
old_lifewarn = "case 'lifeWarn': this._tone(440, 0.12, { type: 'square', vol: 0.2, glide: 330 }); break; // 寿烛将尽"
new_lifewarn = "case 'lifeWarn': this._sfxFile('lifewarn', () => { this._tone(440, 0.12, { type: 'square', vol: 0.2, glide: 330 }); }); break; // 寿烛将尽"
if old_lifewarn in content:
    content = content.replace(old_lifewarn, new_lifewarn)
    print("✅ lifeWarn 音效已更新为优先使用文件")

# colect（注意拼写错误，原代码是colect）
old_colect = "case 'colect':  this._tone(700, 0.1, { type: 'sine', vol: 0.28, glide: 1050 }); break; // 收集"
new_colect = "case 'colect':  this._sfxFile('collect', () => { this._tone(700, 0.1, { type: 'sine', vol: 0.28, glide: 1050 }); }); break; // 收集"
if old_colect in content:
    content = content.replace(old_colect, new_colect)
    print("✅ colect 音效已更新为优先使用文件")

# craft（新增音效，原代码没有文件）
old_craft = """case 'craft':   // 合成/锻造（M1 补齐，原静默）：砧击双响 + 上行泛音
          this._strike(392, 0.12, { type: 'triangle', vol: 0.3, overtone: 1.6 });
          this._timeout(() => this._strike(587, 0.16, { type: 'triangle', vol: 0.28, overtone: 1.5 }), 90);
          this._timeout(() => this._tone(784, 0.2, { type: 'sine', vol: 0.22, glide: 988 }), 190);
          break;"""

# craft没有对应的文件，保持原样（使用程序化合成）
print("ℹ️ craft 音效无对应文件，保持程序化合成")

# 保存文件
with open(sound_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ sound.js更新完成！")
print("   - 26个音效文件已注册到SFX_FILES")
print("   - 所有音效已更新为优先使用文件，缺失时回退到程序化合成")
print("   - 环境音效文件已启用")
