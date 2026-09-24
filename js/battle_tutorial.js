// =============================================================
// battle_tutorial.js - 战斗教学和引导模块
// 功能：关键操作教学（第一次识破/爆发/受击微决策时高亮提示）、战斗帮助
// 加载顺序：battle_animation.js -> battle_tutorial.js
// =============================================================

window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.BattleTutorial = NDX.BattleTutorial || {};

// 教学进度存储key
NDX.BattleTutorial.STORAGE_KEY = 'nidao_battle_tutorial_progress';

// 教学项定义
NDX.BattleTutorial.TUTORIAL_ITEMS = {
  firstBattle: {
    title: '战斗基础',
    text: '战斗自动进行，你可以在关键时刻使用法宝、识破或爆发来扭转战局！',
    position: 'center'
  },
  firstTelegraph: {
    title: '识破窗口',
    text: '怪物正在蓄力重击！点击「识破」按钮可以格挡并反制，造成大量伤害！',
    position: 'bottom',
    highlight: '.shipo-btn, #shipo-btn, [data-action="shipo"]'
  },
  firstMomentum: {
    title: '气势爆发',
    text: '气势已满！点击「爆发」按钮倾泻气势，造成爆发伤害，气势越高伤害越高！',
    position: 'bottom',
    highlight: '.burst-btn, #burst-btn, [data-action="burst"]'
  },
  firstTreasure: {
    title: '法宝使用',
    text: '点击法宝图标可以主动释放法宝技能，法宝有冷却时间，请合理使用！',
    position: 'right',
    highlight: '.treasure-slot, .treasure-item, [data-treasure]'
  },
  firstGuard: {
    title: '受击微决策',
    text: '面对强敌攻击时，可以选择「格挡」「闪避」或「硬抗」，不同选择有不同效果！',
    position: 'bottom',
    highlight: '.guard-btn, #guard-btn, [data-action="guard"]'
  },
  firstBossSkill: {
    title: 'Boss专属技能',
    text: 'Boss释放了专属技能！注意观察技能效果，及时调整策略！',
    position: 'center'
  },
  firstEnrage: {
    title: '怪物狂暴',
    text: '怪物进入狂暴状态，攻击力大幅提升！抓紧时间输出，或者加强防御！',
    position: 'center'
  },
  firstBreak: {
    title: '阶段转换',
    text: 'Boss进入下一阶段！可能会解锁新技能，注意应对！',
    position: 'center'
  }
};

// 获取教学进度
NDX.BattleTutorial.getProgress = function() {
  try {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

// 保存教学进度
NDX.BattleTutorial.saveProgress = function(progress) {
  try {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {}
};

// 标记教学项已完成
NDX.BattleTutorial.markCompleted = function(itemId) {
  const progress = this.getProgress();
  progress[itemId] = true;
  this.saveProgress(progress);
};

// 检查教学项是否已完成
NDX.BattleTutorial.isCompleted = function(itemId) {
  const progress = this.getProgress();
  return !!progress[itemId];
};

// 重置所有教学进度
NDX.BattleTutorial.resetAll = function() {
  try {
    localStorage.removeItem(this.STORAGE_KEY);
  } catch (e) {}
};

// =============================================================
// 一、教学提示显示
// =============================================================

// 显示教学提示
NDX.BattleTutorial.showTutorial = function(itemId) {
  const item = this.TUTORIAL_ITEMS[itemId];
  if (!item) return;
  
  // 检查是否已经显示过
  if (this.isCompleted(itemId)) return;
  
  // 标记为已完成
  this.markCompleted(itemId);
  
  // 创建教学提示元素
  const overlay = document.createElement('div');
  overlay.id = 'battle-tutorial-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-out;
  `;
  
  // 高亮目标元素
  if (item.highlight) {
    const target = document.querySelector(item.highlight);
    if (target) {
      const rect = target.getBoundingClientRect();
      const highlight = document.createElement('div');
      highlight.style.cssText = `
        position: fixed;
        left: ` + rect.left + `px;
        top: ` + rect.top + `px;
        width: ` + rect.width + `px;
        height: ` + rect.height + `px;
        border: 3px solid #ffd700;
        border-radius: 8px;
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
        z-index: 10000;
        animation: pulseHighlight 1s ease-in-out infinite;
        pointer-events: none;
      `;
      overlay.appendChild(highlight);
    }
  }
  
  // 教学提示框
  const box = document.createElement('div');
  box.style.cssText = `
    background: linear-gradient(135deg, rgba(30, 20, 10, 0.98), rgba(50, 30, 15, 0.98));
    border: 2px solid #ffd700;
    border-radius: 12px;
    padding: 25px 35px;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 0 40px rgba(255, 215, 0, 0.4);
    position: relative;
    z-index: 10001;
  `;
  
  box.innerHTML = `
    <div style="color: #ffd700; font-size: 20px; font-weight: bold; margin-bottom: 12px; text-shadow: 0 0 10px rgba(255,215,0,0.5);">` + item.title + `</div>
    <div style="color: #ddd; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">` + item.text + `</div>
    <button id="battle-tutorial-close" style="
      background: linear-gradient(135deg, #8b0000, #5c0000);
      color: #ffd700;
      border: 1px solid #ffd700;
      padding: 8px 30px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: all 0.2s;
    ">我知道了</button>
  `;
  
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  
  // 添加动画样式
  if (!document.getElementById('battle-tutorial-css')) {
    const css = document.createElement('style');
    css.id = 'battle-tutorial-css';
    css.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes pulseHighlight {
        0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); }
        50% { box-shadow: 0 0 40px rgba(255, 215, 0, 1); }
      }
    `;
    document.head.appendChild(css);
  }
  
  // 关闭按钮
  const closeBtn = document.getElementById('battle-tutorial-close');
  if (closeBtn) {
    closeBtn.onclick = () => overlay.remove();
  }
  
  // 点击遮罩关闭
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
  
  // 3秒后自动关闭
  setTimeout(() => {
    if (overlay.parentNode) overlay.remove();
  }, 5000);
};

// =============================================================
// 二、战斗帮助面板
// =============================================================

// 显示战斗帮助
NDX.BattleTutorial.showHelp = function() {
  // 创建帮助面板
  let panel = document.getElementById('battle-help-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'battle-help-panel';
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, rgba(20, 15, 10, 0.98), rgba(40, 25, 15, 0.98));
      border: 2px solid #ffd700;
      border-radius: 12px;
      padding: 25px 35px;
      z-index: 10000;
      color: #ddd;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 0 40px rgba(255, 215, 0, 0.4);
    `;
    document.body.appendChild(panel);
  }
  
  panel.innerHTML = `
    <div style="color: #ffd700; font-size: 22px; font-weight: bold; text-align: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,215,0,0.3); padding-bottom: 12px;">战斗帮助</div>
    
    <div style="margin-bottom: 18px;">
      <div style="color: #ffd700; font-size: 15px; font-weight: bold; margin-bottom: 8px;">⚔️ 基础操作</div>
      <div style="font-size: 13px; line-height: 1.7; color: #ccc;">
        • 战斗自动进行，玩家在关键时刻主动操作<br>
        • 点击法宝图标释放法宝技能（有冷却）<br>
        • 怪物蓄力时可点击「识破」格挡并反制<br>
        • 气势满时可点击「爆发」造成爆发伤害<br>
        • 受击时可选择「格挡/闪避/硬抗」
      </div>
    </div>
    
    <div style="margin-bottom: 18px;">
      <div style="color: #ffd700; font-size: 15px; font-weight: bold; margin-bottom: 8px;">💫 气势系统</div>
      <div style="font-size: 13px; line-height: 1.7; color: #ccc;">
        • 攻击命中积累气势，受击损失气势<br>
        • 气势分三档：一势(×0.6)、二势(×1.0)、三势(×1.5)<br>
        • 爆发伤害 = 气势档位 × 基础伤害<br>
        • 识破成功额外获得2点气势
      </div>
    </div>
    
    <div style="margin-bottom: 18px;">
      <div style="color: #ffd700; font-size: 15px; font-weight: bold; margin-bottom: 8px;">🛡️ 识破机制</div>
      <div style="font-size: 13px; line-height: 1.7; color: #ccc;">
        • 怪物蓄力重击时出现识破窗口<br>
        • 识破成功：格挡伤害并反制（攻击力×0.8）<br>
        • 克制关系命中时反制伤害×1.5<br>
        • 注意：部分劫难有限制识破次数
      </div>
    </div>
    
    <div style="margin-bottom: 18px;">
      <div style="color: #ffd700; font-size: 15px; font-weight: bold; margin-bottom: 8px;">🔥 Boss战要点</div>
      <div style="font-size: 13px; line-height: 1.7; color: #ccc;">
        • Boss有专属技能，注意观察技能效果<br>
        • Boss血量低于50%/30%时可能进入新阶段<br>
        • 部分Boss有多段变身，每段技能不同<br>
        • 狂暴状态下Boss攻击力大幅提升
      </div>
    </div>
    
    <div style="margin-bottom: 18px;">
      <div style="color: #ffd700; font-size: 15px; font-weight: bold; margin-bottom: 8px;">⚡ 战斗速度</div>
      <div style="font-size: 13px; line-height: 1.7; color: #ccc;">
        • 第五章后开放2倍速<br>
        • 第十章后开放3倍速<br>
        • 第十五章后开放跳过战斗<br>
        • 可在设置中调整默认战斗速度
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px;">
      <button onclick="document.getElementById('battle-help-panel').style.display='none'" style="
        background: linear-gradient(135deg, #8b0000, #5c0000);
        color: #ffd700;
        border: 1px solid #ffd700;
        padding: 10px 40px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 15px;
        font-weight: bold;
      ">关闭</button>
    </div>
  `;
  
  panel.style.display = 'block';
};

// =============================================================
// 三、教学触发检查
// =============================================================

// 检查并触发教学
NDX.BattleTutorial.checkAndTrigger = function(eventType, data) {
  switch (eventType) {
    case 'battleStart':
      if (!this.isCompleted('firstBattle')) {
        setTimeout(() => this.showTutorial('firstBattle'), 1000);
      }
      break;
    case 'telegraph':
      if (!this.isCompleted('firstTelegraph')) {
        setTimeout(() => this.showTutorial('firstTelegraph'), 500);
      }
      break;
    case 'momentumFull':
      if (!this.isCompleted('firstMomentum')) {
        setTimeout(() => this.showTutorial('firstMomentum'), 500);
      }
      break;
    case 'treasureAvailable':
      if (!this.isCompleted('firstTreasure')) {
        setTimeout(() => this.showTutorial('firstTreasure'), 1000);
      }
      break;
    case 'guardOpportunity':
      if (!this.isCompleted('firstGuard')) {
        setTimeout(() => this.showTutorial('firstGuard'), 500);
      }
      break;
    case 'bossSkill':
      if (!this.isCompleted('firstBossSkill')) {
        setTimeout(() => this.showTutorial('firstBossSkill'), 500);
      }
      break;
    case 'enrage':
      if (!this.isCompleted('firstEnrage')) {
        setTimeout(() => this.showTutorial('firstEnrage'), 500);
      }
      break;
    case 'stageBreak':
      if (!this.isCompleted('firstBreak')) {
        setTimeout(() => this.showTutorial('firstBreak'), 500);
      }
      break;
  }
};

// =============================================================
// 四、初始化
// =============================================================

NDX.BattleTutorial.init = function() {
  console.log('[BattleTutorial] 战斗教学和引导模块已加载');
};

console.log('[BattleTutorial] 战斗教学和引导模块已加载：关键操作教学 + 战斗帮助');
