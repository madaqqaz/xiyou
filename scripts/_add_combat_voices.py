#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
在ui_misc_3.js中添加攻击/受击/闪避/格挡语音
"""

import re

uiMiscPath = r"D:\xiyou\demo\js\ui\ui_misc_3.js"
with open(uiMiscPath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 在dmg-fly事件中添加语音
# 找到 "else if (data.side === 'you') {" 这一行
old_you_hit = """            else if (data.side === 'you') {
              // 我方受击：反弹 / 护盾吸收 / 普通承伤
              if (data.kind === 'reflect') _sfx('reflect');
              else if (data.kind === 'shield') _sfx('guard');
              else _sfx('hit');
            } else if (data.kind === 'crit' || data.kind === 'break') _sfx('crit');
            else _sfx('hit');"""

new_you_hit = """            else if (data.side === 'you') {
              // 我方受击：反弹 / 护盾吸收 / 普通承伤
              if (data.kind === 'reflect') _sfx('reflect');
              else if (data.kind === 'shield') {
                _sfx('guard');
                // 【语音集成】玩家格挡成功时播放受击/格挡语音（20%概率）
                try {
                  if (NDX.playHeroVoice && NDX.game && NDX.game.state && NDX.game.state.hero && Math.random() < 0.2) {
                    NDX.playHeroVoice(NDX.game.state.hero, 'hit');
                  }
                } catch (e) { /* 语音播放失败不影响游戏 */ }
              }
              else {
                _sfx('hit');
                // 【语音集成】玩家受击时播放受击语音（15%概率，避免过于频繁）
                try {
                  if (NDX.playHeroVoice && NDX.game && NDX.game.state && NDX.game.state.hero && Math.random() < 0.15) {
                    NDX.playHeroVoice(NDX.game.state.hero, 'hit');
                  }
                } catch (e) { /* 语音播放失败不影响游戏 */ }
              }
            } else if (data.kind === 'crit' || data.kind === 'break') {
              _sfx('crit');
              // 【语音集成】玩家暴击时播放攻击语音（25%概率）
              try {
                if (NDX.playHeroVoice && NDX.game && NDX.game.state && NDX.game.state.hero && Math.random() < 0.25) {
                  NDX.playHeroVoice(NDX.game.state.hero, 'attack');
                }
              } catch (e) { /* 语音播放失败不影响游戏 */ }
            }
            else {
              _sfx('hit');
              // 【语音集成】玩家普通攻击命中时播放攻击语音（10%概率）
              try {
                if (NDX.playHeroVoice && NDX.game && NDX.game.state && NDX.game.state.hero && Math.random() < 0.10) {
                  NDX.playHeroVoice(NDX.game.state.hero, 'attack');
                }
              } catch (e) { /* 语音播放失败不影响游戏 */ }
            }"""

if old_you_hit in content:
    content = content.replace(old_you_hit, new_you_hit)
    print("✅ 已添加受击/攻击语音")
else:
    print("⚠️ 未找到受击代码块，使用正则...")
    # 使用正则替换
    pattern = r"else if \(data\.side === 'you'\) \{\s*// 我方受击：反弹 / 护盾吸收 / 普通承伤\s*if \(data\.kind === 'reflect'\) _sfx\('reflect'\);\s*else if \(data\.kind === 'shield'\) _sfx\('guard'\);\s*else _sfx\('hit'\);\s*\} else if \(data\.kind === 'crit' \|\| data\.kind === 'break'\) _sfx\('crit'\);\s*else _sfx\('hit'\);"
    content = re.sub(pattern, new_you_hit, content)
    print("✅ 已通过正则添加受击/攻击语音")

# 2. 在dodge事件中添加闪避语音
old_dodge = "else if (t === 'dodge') _sfx('dodge');                       // 闪避（高频下滑）"
new_dodge = """else if (t === 'dodge') {
            _sfx('dodge');                       // 闪避（高频下滑）
            // 【语音集成】玩家闪避时播放闪避语音（20%概率）
            try {
              if (NDX.playHeroVoice && NDX.game && NDX.game.state && NDX.game.state.hero && Math.random() < 0.2) {
                NDX.playHeroVoice(NDX.game.state.hero, 'hit');
              }
            } catch (e) { /* 语音播放失败不影响游戏 */ }
          }"""

if old_dodge in content:
    content = content.replace(old_dodge, new_dodge)
    print("✅ 已添加闪避语音")
else:
    print("⚠️ 未找到闪避代码行")

with open(uiMiscPath, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ 语音集成完成！")
print("   - 玩家受击时15%概率播放受击语音")
print("   - 玩家格挡成功时20%概率播放受击/格挡语音")
print("   - 玩家普通攻击命中时10%概率播放攻击语音")
print("   - 玩家暴击时25%概率播放攻击语音")
print("   - 玩家闪避时20%概率播放闪避语音")
