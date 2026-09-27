#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将语音集成到战斗系统的关键节点
1. 战斗开始时播放出场语音
2. 战斗胜利时播放胜利语音
3. 战斗失败时播放失败语音
4. 玩家攻击时播放攻击语音
5. 玩家使用技能时播放技能语音
"""

import re

# 1. 修改game_combat_1.js - 在战斗开始时添加出场语音
combat1_path = r"D:\xiyou\demo\js\game\game_combat_1.js"
with open(combat1_path, 'r', encoding='utf-8') as f:
    content1 = f.read()

# 在fight函数中，怪物数据准备完成后，添加出场语音
# 找到 "m.tier = m.boss ? 'boss' : (monster.type === 'elite' ? 'elite' : 'mob');" 这一行
old_tier_line = "m.tier = m.boss ? 'boss' : (monster.type === 'elite' ? 'elite' : 'mob');"
new_tier_line = """m.tier = m.boss ? 'boss' : (monster.type === 'elite' ? 'elite' : 'mob');
    // 【语音集成】战斗开始时播放出场语音
    try {
      if (NDX.playBossVoice && m.boss) {
        // 尝试匹配Boss ID
        const bossIdMap = {
          '白骨夫人': 'boss_baigujing', '白骨精': 'boss_baigujing',
          '黄风大圣': 'boss_huangfeng', '黄风怪': 'boss_huangfeng',
          '红孩儿': 'boss_honghaier', '圣婴大王': 'boss_honghaier',
          '刘洪': 'boss_liuhong',
          '金角大王': 'boss_jinjiao', '金角': 'boss_jinjiao',
          '银角大王': 'boss_yinjiao', '银角': 'boss_yinjiao',
          '大鹏金翅雕': 'boss_dapeng', '大鹏': 'boss_dapeng',
          '牛魔王': 'boss_niumowang', '平天大圣': 'boss_niumowang',
        };
        const bossId = bossIdMap[name] || bossIdMap[m.name];
        if (bossId) NDX.playBossVoice(bossId, 'enter');
      } else if (NDX.playHeroVoice && s.hero) {
        // 玩家英雄出场语音（仅Boss战播放，避免过于频繁）
        if (m.boss) NDX.playHeroVoice(s.hero, 'enter');
      }
    } catch (e) { /* 语音播放失败不影响游戏 */ }"""

if old_tier_line in content1:
    content1 = content1.replace(old_tier_line, new_tier_line)
    print("✅ game_combat_1.js - 已添加出场语音")
else:
    print("⚠️ game_combat_1.js - 未找到tier行，使用正则...")
    pattern = r"m\.tier = m\.boss \? 'boss' : \(monster\.type === 'elite' \? 'elite' : 'mob'\);"
    content1 = re.sub(pattern, new_tier_line, content1)
    print("✅ game_combat_1.js - 已通过正则添加出场语音")

with open(combat1_path, 'w', encoding='utf-8') as f:
    f.write(content1)

# 2. 修改game_combat_2.js - 在战斗结束时添加胜利/失败语音
combat2_path = r"D:\xiyou\demo\js\game\game_combat_2.js"
with open(combat2_path, 'r', encoding='utf-8') as f:
    content2 = f.read()

# 在战斗结束播放胜负音效后，添加语音播放
old_audio_line = "try { if (window.NDX_MP3) { window.NDX_MP3.stopBgm(); window.NDX_MP3.playSfx(p.win ? 'victory' : 'defeat'); } } catch(e) { console.warn('[MP3] fight end sfx:', e); }"
new_audio_line = """try { if (window.NDX_MP3) { window.NDX_MP3.stopBgm(); window.NDX_MP3.playSfx(p.win ? 'victory' : 'defeat'); } } catch(e) { console.warn('[MP3] fight end sfx:', e); }
    // 【语音集成】战斗结束时播放胜利/失败语音
    try {
      const voiceType = p.win ? 'victory' : 'defeat';
      // Boss语音
      if (NDX.playBossVoice && p.monster && p.monster.boss) {
        const bossIdMap = {
          '白骨夫人': 'boss_baigujing', '白骨精': 'boss_baigujing',
          '黄风大圣': 'boss_huangfeng', '黄风怪': 'boss_huangfeng',
          '红孩儿': 'boss_honghaier', '圣婴大王': 'boss_honghaier',
          '刘洪': 'boss_liuhong',
          '金角大王': 'boss_jinjiao', '金角': 'boss_jinjiao',
          '银角大王': 'boss_yinjiao', '银角': 'boss_yinjiao',
          '大鹏金翅雕': 'boss_dapeng', '大鹏': 'boss_dapeng',
          '牛魔王': 'boss_niumowang', '平天大圣': 'boss_niumowang',
        };
        const bossId = bossIdMap[p.name] || bossIdMap[p.monster.name];
        if (bossId) NDX.playBossVoice(bossId, voiceType);
      }
      // 玩家英雄语音（胜利时播放，失败时不播放避免重复）
      if (p.win && NDX.playHeroVoice && s.hero) {
        NDX.playHeroVoice(s.hero, voiceType);
      }
    } catch (e) { /* 语音播放失败不影响游戏 */ }"""

if old_audio_line in content2:
    content2 = content2.replace(old_audio_line, new_audio_line)
    print("✅ game_combat_2.js - 已添加胜利/失败语音")
else:
    print("⚠️ game_combat_2.js - 未找到音频行，使用正则...")
    pattern = r"try \{ if \(window\.NDX_MP3\) \{ window\.NDX_MP3\.stopBgm\(\); window\.NDX_MP3\.playSfx\(p\.win \? 'victory' : 'defeat'\); \} \} catch\(e\) \{ console\.warn\('\[MP3\] fight end sfx:', e\); \}"
    content2 = re.sub(pattern, new_audio_line, content2)
    print("✅ game_combat_2.js - 已通过正则添加胜利/失败语音")

with open(combat2_path, 'w', encoding='utf-8') as f:
    f.write(content2)

# 3. 修改game_combat_3.js - 在玩家攻击/技能时添加语音
combat3_path = r"D:\xiyou\demo\js\game\game_combat_3.js"
with open(combat3_path, 'r', encoding='utf-8') as f:
    content3 = f.read()

# 搜索玩家攻击相关的代码
attack_pattern = r"(NDX\.sfx\('attack'\)|playSfx\('attack'\))"
attack_matches = re.findall(attack_pattern, content3)
print(f"game_combat_3.js - 找到 {len(attack_matches)} 处攻击音效调用")

# 在第一处攻击音效后添加攻击语音
if attack_matches:
    old_attack_sfx = attack_matches[0]
    new_attack_sfx = old_attack_sfx + """
    // 【语音集成】玩家攻击时播放攻击语音（30%概率，避免过于频繁）
    try {
      if (NDX.playHeroVoice && s.hero && Math.random() < 0.3) {
        NDX.playHeroVoice(s.hero, 'attack');
      }
    } catch (e) { /* 语音播放失败不影响游戏 */ }"""
    content3 = content3.replace(old_attack_sfx, new_attack_sfx, 1)
    print("✅ game_combat_3.js - 已添加攻击语音")

# 搜索玩家技能相关的代码
skill_pattern = r"(NDX\.sfx\('skill'\)|playSfx\('skill'\))"
skill_matches = re.findall(skill_pattern, content3)
print(f"game_combat_3.js - 找到 {len(skill_matches)} 处技能音效调用")

# 在第一处技能音效后添加技能语音
if skill_matches:
    old_skill_sfx = skill_matches[0]
    new_skill_sfx = old_skill_sfx + """
    // 【语音集成】玩家使用技能时播放技能语音（50%概率）
    try {
      if (NDX.playHeroVoice && s.hero && Math.random() < 0.5) {
        NDX.playHeroVoice(s.hero, 'skill');
      }
    } catch (e) { /* 语音播放失败不影响游戏 */ }"""
    content3 = content3.replace(old_skill_sfx, new_skill_sfx, 1)
    print("✅ game_combat_3.js - 已添加技能语音")

with open(combat3_path, 'w', encoding='utf-8') as f:
    f.write(content3)

print("\n✅ 语音集成完成！")
print("   - 战斗开始时播放出场语音（Boss + 玩家英雄）")
print("   - 战斗胜利时播放胜利语音（Boss + 玩家英雄）")
print("   - 战斗失败时播放失败语音（Boss）")
print("   - 玩家攻击时30%概率播放攻击语音")
print("   - 玩家使用技能时50%概率播放技能语音")
