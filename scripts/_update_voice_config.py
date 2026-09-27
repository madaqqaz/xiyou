#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新voice_config.js，添加车迟国三妖和狮驼岭二妖的配音配置
"""

import re

voiceConfigPath = r"D:\xiyou\demo\js\voice_config.js"
with open(voiceConfigPath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 在BOSS_VOICES中添加新Boss配置（在牛魔王配置之后，即BOSS_VOICES结束之前）
# 找到牛魔王配置的结束位置
old_boss_end = """      rage: '惹怒我老牛，你找死！',
    }
  },
};

// 通用怪物配音（按类型）"""

new_boss_config = """      rage: '惹怒我老牛，你找死！',
    }
  },
  // 车迟国三妖 - 虎力大仙
  boss_huli: {
    name: '虎力大仙',
    voiceType: '中年男性，粗犷威猛，语速较快，带有虎妖的凶悍和道士的狂妄',
    lines: {
      enter: '吾乃虎力大仙！车迟国国师，唐僧你可敢与我斗法？',
      attack: '虎爪裂空！',
      skill: '五雷法，天雷降世！',
      ult: '虎妖真身，万钧之力！',
      victory: '哈哈哈哈！就这点本事也敢来车迟国？',
      defeat: '不可能……我的五雷法……',
      hit: '吼！',
      rage: '惹怒我虎力大仙，你找死！',
    }
  },
  // 车迟国三妖 - 鹿力大仙
  boss_luli: {
    name: '鹿力大仙',
    voiceType: '中年男性，阴柔狡诈，语速适中，带有鹿妖的诡异和道士的阴险',
    lines: {
      enter: '吾乃鹿力大仙！唐僧，这隔板猜物你可敢一试？',
      attack: '鹿角穿心！',
      skill: '剖腹剜心，不死之术！',
      ult: '鹿妖真身，迷魂幻术！',
      victory: '嘻嘻……又一个被我幻术迷惑的蠢货……',
      defeat: '我的幻术……怎么会被看破……',
      hit: '呃！',
      rage: '你敢破我幻术？我要你死！',
    }
  },
  // 车迟国三妖 - 羊力大仙
  boss_yangli: {
    name: '羊力大仙',
    voiceType: '中年男性，尖锐刺耳，语速较快，带有羊妖的狡诈和道士的疯狂',
    lines: {
      enter: '吾乃羊力大仙！唐僧，这油锅洗澡你可敢陪我？',
      attack: '羊顶角击！',
      skill: '冷龙护体，油锅不侵！',
      ult: '羊妖真身，疯狂冲撞！',
      victory: '哈哈哈哈！下油锅都不敢，还取什么经？',
      defeat: '我的冷龙……怎么会消失……',
      hit: '咩！',
      rage: '敢毁我冷龙？我跟你拼了！',
    }
  },
  // 狮驼岭二妖 - 青狮精
  boss_qingshi: {
    name: '青狮精',
    voiceType: '中年男性，威猛霸道，语速较慢，带有狮妖的威严和文殊菩萨坐骑的傲气',
    lines: {
      enter: '吾乃青狮精！文殊菩萨坐骑，狮驼岭大大王！唐僧肉，我要定了！',
      attack: '狮吼震天！',
      skill: '吞天噬地，一口吞万军！',
      ult: '青狮真身，万兽臣服！',
      victory: '哈哈哈哈！又一个送入狮口的蠢货！',
      defeat: '不可能……我乃文殊坐骑……怎会败……',
      hit: '吼！',
      rage: '惹怒我青狮大王，你死定了！',
    }
  },
  // 狮驼岭二妖 - 白象精
  boss_baixiang: {
    name: '白象精',
    voiceType: '中年男性，沉稳厚重，语速较慢，带有象妖的力量和普贤菩萨坐骑的威严',
    lines: {
      enter: '吾乃白象精！普贤菩萨坐骑，狮驼岭二大王！唐僧，留下肉来！',
      attack: '象鼻卷杀！',
      skill: '万钧象力，地动山摇！',
      ult: '白象真身，踏碎山河！',
      victory: '哼哼……又一个被我象鼻卷碎的蝼蚁……',
      defeat: '我的象力……怎么会……',
      hit: '嗯！',
      rage: '敢伤我白象？我踏平你这泼猴！',
    }
  },
};

// 通用怪物配音（按类型）"""

if old_boss_end in content:
    content = content.replace(old_boss_end, new_boss_config)
    print("✅ 已添加车迟国三妖和狮驼岭二妖的配音配置")
else:
    print("⚠️ 未找到Boss配置结束位置，使用正则...")
    pattern = r"rage: '惹怒我老牛，你找死！',\s*\}\s*\},\s*\};\s*// 通用怪物配音（按类型）"
    content = re.sub(pattern, new_boss_config, content)
    print("✅ 已通过正则添加新Boss配音配置")

# 2. 在VOICE_FILES中添加新Boss的配音文件路径映射
# 找到牛魔王配音文件路径的结束位置
old_voice_files_end = """  // Boss配音 - 牛魔王
  'boss_niumowang_enter': 'assets/voice/boss_niumowang_enter.mp3',
  'boss_niumowang_attack': 'assets/voice/boss_niumowang_attack.mp3',
  'boss_niumowang_skill': 'assets/voice/boss_niumowang_skill.mp3',
  'boss_niumowang_victory': 'assets/voice/boss_niumowang_victory.mp3',
  'boss_niumowang_defeat': 'assets/voice/boss_niumowang_defeat.mp3',
  
  // 通用怪物配音"""

new_voice_files = """  // Boss配音 - 牛魔王
  'boss_niumowang_enter': 'assets/voice/boss_niumowang_enter.mp3',
  'boss_niumowang_attack': 'assets/voice/boss_niumowang_attack.mp3',
  'boss_niumowang_skill': 'assets/voice/boss_niumowang_skill.mp3',
  'boss_niumowang_victory': 'assets/voice/boss_niumowang_victory.mp3',
  'boss_niumowang_defeat': 'assets/voice/boss_niumowang_defeat.mp3',
  
  // Boss配音 - 虎力大仙
  'boss_huli_enter': 'assets/voice/boss_huli_enter.mp3',
  'boss_huli_attack': 'assets/voice/boss_huli_attack.mp3',
  'boss_huli_skill': 'assets/voice/boss_huli_skill.mp3',
  'boss_huli_victory': 'assets/voice/boss_huli_victory.mp3',
  'boss_huli_defeat': 'assets/voice/boss_huli_defeat.mp3',
  
  // Boss配音 - 鹿力大仙
  'boss_luli_enter': 'assets/voice/boss_luli_enter.mp3',
  'boss_luli_attack': 'assets/voice/boss_luli_attack.mp3',
  'boss_luli_skill': 'assets/voice/boss_luli_skill.mp3',
  'boss_luli_victory': 'assets/voice/boss_luli_victory.mp3',
  'boss_luli_defeat': 'assets/voice/boss_luli_defeat.mp3',
  
  // Boss配音 - 羊力大仙
  'boss_yangli_enter': 'assets/voice/boss_yangli_enter.mp3',
  'boss_yangli_attack': 'assets/voice/boss_yangli_attack.mp3',
  'boss_yangli_skill': 'assets/voice/boss_yangli_skill.mp3',
  'boss_yangli_victory': 'assets/voice/boss_yangli_victory.mp3',
  'boss_yangli_defeat': 'assets/voice/boss_yangli_defeat.mp3',
  
  // Boss配音 - 青狮精
  'boss_qingshi_enter': 'assets/voice/boss_qingshi_enter.mp3',
  'boss_qingshi_attack': 'assets/voice/boss_qingshi_attack.mp3',
  'boss_qingshi_skill': 'assets/voice/boss_qingshi_skill.mp3',
  'boss_qingshi_victory': 'assets/voice/boss_qingshi_victory.mp3',
  'boss_qingshi_defeat': 'assets/voice/boss_qingshi_defeat.mp3',
  
  // Boss配音 - 白象精
  'boss_baixiang_enter': 'assets/voice/boss_baixiang_enter.mp3',
  'boss_baixiang_attack': 'assets/voice/boss_baixiang_attack.mp3',
  'boss_baixiang_skill': 'assets/voice/boss_baixiang_skill.mp3',
  'boss_baixiang_victory': 'assets/voice/boss_baixiang_victory.mp3',
  'boss_baixiang_defeat': 'assets/voice/boss_baixiang_defeat.mp3',
  
  // 通用怪物配音"""

if old_voice_files_end in content:
    content = content.replace(old_voice_files_end, new_voice_files)
    print("✅ 已添加新Boss的配音文件路径映射")
else:
    print("⚠️ 未找到VOICE_FILES结束位置，使用正则...")
    pattern = r"// Boss配音 - 牛魔王\s*'boss_niumowang_enter': 'assets/voice/boss_niumowang_enter\.mp3',\s*'boss_niumowang_attack': 'assets/voice/boss_niumowang_attack\.mp3',\s*'boss_niumowang_skill': 'assets/voice/boss_niumowang_skill\.mp3',\s*'boss_niumowang_victory': 'assets/voice/boss_niumowang_victory\.mp3',\s*'boss_niumowang_defeat': 'assets/voice/boss_niumowang_defeat\.mp3',\s*// 通用怪物配音"
    content = re.sub(pattern, new_voice_files, content)
    print("✅ 已通过正则添加新Boss配音文件路径映射")

with open(voiceConfigPath, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ voice_config.js更新完成！")
print("   新增Boss配音配置:")
print("     - 虎力大仙 (boss_huli)")
print("     - 鹿力大仙 (boss_luli)")
print("     - 羊力大仙 (boss_yangli)")
print("     - 青狮精 (boss_qingshi)")
print("     - 白象精 (boss_baixiang)")
print("   每个Boss 5种语音类型: enter/attack/skill/victory/defeat")
print("   共新增 25 个配音文件路径映射")
