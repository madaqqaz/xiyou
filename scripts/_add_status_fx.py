#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
添加异常状态视觉特效播放逻辑到battle_ui_enhance.js
"""

file_path = r"D:\xiyou\demo\js\battle_ui_enhance.js"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 在文件末尾添加异常状态视觉特效模块
status_fx_module = """

// =============================================================
// 三、异常状态视觉特效
// =============================================================

// 异常状态特效映射
NDX.BattleUI.STATUS_FX = {
  burn: {
    img: 'img/portraits/foe/generic/fx/fx_fire_strip.webp',
    frames: 4,
    className: 'status-fx-burn',
    style: 'position:absolute;top:-20%;left:50%;transform:translateX(-50%);width:80px;height:80px;pointer-events:none;z-index:50;opacity:0.8;'
  },
  poison: {
    img: 'img/fx/debuff/debuff_poison.webp',
    frames: 1,
    className: 'status-fx-poison',
    style: 'position:absolute;top:-10%;left:50%;transform:translateX(-50%);width:60px;height:60px;pointer-events:none;z-index:50;opacity:0.7;'
  },
  freeze: {
    img: 'img/icons/status/status_freeze.webp',
    frames: 1,
    className: 'status-fx-freeze',
    style: 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50;opacity:0.4;mix-blend-mode:screen;'
  },
  stun: {
    img: 'img/icons/status/status_stun.webp',
    frames: 1,
    className: 'status-fx-stun',
    style: 'position:absolute;top:-30%;left:50%;transform:translateX(-50%);width:40px;height:40px;pointer-events:none;z-index:50;animation:status-spin 1s linear infinite;'
  },
  paralyze: {
    img: 'img/icons/status/status_paralyze.webp',
    frames: 1,
    className: 'status-fx-paralyze',
    style: 'position:absolute;top:-20%;left:50%;transform:translateX(-50%);width:40px;height:40px;pointer-events:none;z-index:50;animation:status-flash 0.5s ease-in-out infinite;'
  },
  buff: {
    img: 'img/fx/buff/buff_aura.webp',
    frames: 1,
    className: 'status-fx-buff',
    style: 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:40;opacity:0.5;mix-blend-mode:screen;'
  }
};

// 添加状态特效CSS动画
NDX.BattleUI.addStatusFxCSS = function() {
  if (document.getElementById('status-fx-css')) return;
  
  const style = document.createElement('style');
  style.id = 'status-fx-css';
  style.textContent = `
    @keyframes status-spin {
      from { transform: translateX(-50%) rotate(0deg); }
      to { transform: translateX(-50%) rotate(360deg); }
    }
    @keyframes status-flash {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    @keyframes status-pulse {
      0%, 100% { transform: translateX(-50%) scale(1); }
      50% { transform: translateX(-50%) scale(1.2); }
    }
    .status-fx-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 50;
    }
  `;
  document.head.appendChild(style);
};

// 在角色身上显示异常状态特效
NDX.BattleUI.showStatusFx = function(characterEl, statusType) {
  if (!characterEl || !statusType) return;
  
  this.addStatusFxCSS();
  
  const fxInfo = this.STATUS_FX[statusType];
  if (!fxInfo) return;
  
  // 查找或创建特效容器
  let fxContainer = characterEl.querySelector('.status-fx-container');
  if (!fxContainer) {
    fxContainer = document.createElement('div');
    fxContainer.className = 'status-fx-container';
    characterEl.appendChild(fxContainer);
  }
  
  // 检查是否已存在该状态的特效
  const existingFx = fxContainer.querySelector('.' + fxInfo.className);
  if (existingFx) return;
  
  // 创建特效元素
  const fxEl = document.createElement('div');
  fxEl.className = fxInfo.className;
  fxEl.setAttribute('data-status', statusType);
  fxEl.style.cssText = fxInfo.style;
  
  if (fxInfo.frames > 1) {
    // 序列帧动画
    fxEl.style.backgroundImage = 'url(' + fxInfo.img + ')';
    fxEl.style.backgroundSize = (fxInfo.frames * 100) + '% 100%';
    fxEl.style.animation = 'status-fx-play 0.8s steps(' + fxInfo.frames + ') infinite';
  } else {
    // 单帧图片
    fxEl.innerHTML = '<img src="' + fxInfo.img + '" style="width:100%;height:100%;object-fit:contain;" />';
  }
  
  fxContainer.appendChild(fxEl);
};

// 隐藏角色身上的异常状态特效
NDX.BattleUI.hideStatusFx = function(characterEl, statusType) {
  if (!characterEl) return;
  
  const fxContainer = characterEl.querySelector('.status-fx-container');
  if (!fxContainer) return;
  
  if (statusType) {
    // 隐藏指定状态的特效
    const fxEl = fxContainer.querySelector('[data-status="' + statusType + '"]');
    if (fxEl) {
      fxEl.remove();
    }
  } else {
    // 隐藏所有特效
    fxContainer.remove();
  }
};

// 更新角色的所有异常状态特效
NDX.BattleUI.updateCharacterStatusFx = function(characterEl, statuses) {
  if (!characterEl) return;
  
  // 清除所有现有特效
  this.hideStatusFx(characterEl);
  
  // 显示新的特效
  if (statuses && typeof statuses === 'object') {
    Object.keys(statuses).forEach(statusType => {
      if (statuses[statusType] > 0) {
        this.showStatusFx(characterEl, statusType);
      }
    });
  } else if (Array.isArray(statuses)) {
    statuses.forEach(statusType => {
      this.showStatusFx(characterEl, statusType);
    });
  }
};
"""

# 将模块添加到文件末尾
content += status_fx_module

# 保存文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 异常状态视觉特效模块已添加")
print("完成！")
