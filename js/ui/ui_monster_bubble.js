// =============================================================
// 怪物冒泡说话组件（Monster Speech Bubble）
// 对应玩家需求：怪物暴击采用冒泡说话方式提醒
// =============================================================

NDX.MonsterBubble = NDX.MonsterBubble || {};

// 冒泡模板
NDX.MonsterBubble.TEMPLATES = {
  // 暴击/重击预警
  heavy: [
    '「受死吧！」',
    '「这一击，要你命！」',
    '「看我蓄力一击！」',
    '「你躲不掉的！」',
    '「死到临头了！」',
    '「接我这招！」',
  ],
  // 多段连击预警
  multi: [
    '「疾风连斩！」',
    '「让你尝尝连击的滋味！」',
    '「看我连环招数！」',
    '「躲得过第一刀，躲得过第二刀吗？」',
  ],
  // 铁壁蓄势预警
  guard: [
    '「固若金汤！」',
    '「任你攻击，我自巍然不动！」',
    '「你的攻击，对我无效！」',
    '「防守反击，才是王道！」',
  ],
  // 妖气暴涨预警
  buff: [
    '「妖气暴涨！」',
    '「力量，正在涌上来！」',
    '「感受我的愤怒吧！」',
    '「这才是我的真正实力！」',
  ],
  // 妖法回春预警
  heal: [
    '「回春之术！」',
    '「伤势，正在恢复！」',
    '「你打不死我的！」',
    '「生生不息，源源不绝！」',
  ],
  // 狂暴预警
  enrage: [
    '「啊啊啊——！」',
    '「我要杀了你！」',
    '「不可饶恕！」',
    '「怒火，燃烧吧！」',
  ],
  // 普通攻击（偶尔说话）
  attack: [
    '「哼！」',
    '「看招！」',
    '「死！」',
    '「接招！」',
  ],
};

// 防守建议
NDX.MonsterBubble.DEFENSE_TIPS = {
  heavy: '⚠ 蓄力重击！建议【防守/识破】',
  multi: '⚡ 多段连击！建议【闪避/护盾】',
  guard: '🛡 铁壁蓄势！建议【等待/破防】',
  buff: '🌀 妖气暴涨！建议【集火打断】',
  heal: '💚 妖法回春！建议【集火阻止】',
  enrage: '🔥 狂暴状态！建议【全力输出】',
};

// 显示怪物冒泡
NDX.MonsterBubble.show = function (options) {
  const opts = options || {};
  const type = opts.type || 'attack';
  const text = opts.text || NDX.MonsterBubble.getRandomText(type);
  const monsterElement = opts.monsterElement || NDX.MonsterBubble.findMonsterElement();
  const duration = opts.duration || 2500;
  const showDefenseTip = opts.showDefenseTip !== false;
  
  if (!monsterElement) return;
  
  // 移除旧冒泡
  const oldBubble = document.querySelector('.monster-speech-bubble');
  if (oldBubble) oldBubble.remove();
  
  // 创建冒泡
  const bubble = document.createElement('div');
  bubble.className = 'monster-speech-bubble';
  
  let html = `<div class="msb-text">${text}</div>`;
  
  // 防守建议
  if (showDefenseTip && NDX.MonsterBubble.DEFENSE_TIPS[type]) {
    html += `<div class="msb-tip">${NDX.MonsterBubble.DEFENSE_TIPS[type]}</div>`;
  }
  
  bubble.innerHTML = html;
  
  // 定位到怪物上方
  const rect = monsterElement.getBoundingClientRect();
  bubble.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top - 20}px;
    transform: translateX(-50%) translateY(-100%);
    z-index: 4800;
    max-width: 280px;
    background: linear-gradient(135deg, rgba(40, 20, 20, 0.95), rgba(60, 30, 30, 0.95));
    border: 2px solid #c0392b;
    border-radius: 12px;
    padding: 10px 15px;
    box-shadow: 0 0 20px rgba(192, 57, 43, 0.4);
    animation: msbIn 0.3s ease;
    pointer-events: none;
  `;
  
  // 小尾巴
  const tail = document.createElement('div');
  tail.style.cssText = `
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid #c0392b;
  `;
  bubble.appendChild(tail);
  
  document.body.appendChild(bubble);
  
  // 自动消失
  setTimeout(() => {
    bubble.style.animation = 'msbOut 0.3s ease forwards';
    setTimeout(() => bubble.remove(), 300);
  }, duration);
  
  return bubble;
};

// 获取随机文本
NDX.MonsterBubble.getRandomText = function (type) {
  const templates = NDX.MonsterBubble.TEMPLATES[type] || NDX.MonsterBubble.TEMPLATES.attack;
  return templates[Math.floor(Math.random() * templates.length)];
};

// 查找怪物元素
NDX.MonsterBubble.findMonsterElement = function () {
  return document.querySelector('.fb-side.foe .fb-avatar, .fb-foe-art, .enemy-portrait, [class*="foe"][class*="avatar"]');
};

// 根据战斗意图显示冒泡
NDX.MonsterBubble.showByIntent = function (intent, options) {
  const opts = options || {};
  let type = 'attack';
  
  switch (intent) {
    case 'heavy':
    case 'telegraph':
      type = 'heavy';
      break;
    case 'multi':
      type = 'multi';
      break;
    case 'guard':
      type = 'guard';
      break;
    case 'buff':
      type = 'buff';
      break;
    case 'heal':
      type = 'heal';
      break;
    case 'enrage':
    case 'fury':
      type = 'enrage';
      break;
    default:
      // 普通攻击只有30%概率说话
      if (Math.random() > 0.3) return null;
      type = 'attack';
  }
  
  return NDX.MonsterBubble.show({
    type: type,
    duration: opts.duration || 2500,
    showDefenseTip: opts.showDefenseTip !== false
  });
};

// 注入CSS
NDX.MonsterBubble.injectCSS = function () {
  if (document.getElementById('monster-bubble-css')) return;
  const css = document.createElement('style');
  css.id = 'monster-bubble-css';
  css.textContent = `
    .monster-speech-bubble .msb-text {
      color: #ffcccc;
      font-size: 14px;
      font-weight: bold;
      line-height: 1.4;
      margin-bottom: 6px;
      text-align: center;
    }
    .monster-speech-bubble .msb-tip {
      color: #ffd700;
      font-size: 12px;
      background: rgba(0, 0, 0, 0.4);
      padding: 4px 8px;
      border-radius: 6px;
      text-align: center;
    }
    @keyframes msbIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-100%) scale(0.8); }
      to { opacity: 1; transform: translateX(-50%) translateY(-100%) scale(1); }
    }
    @keyframes msbOut {
      from { opacity: 1; transform: translateX(-50%) translateY(-100%) scale(1); }
      to { opacity: 0; transform: translateX(-50%) translateY(-120%) scale(0.8); }
    }
  `;
  document.head.appendChild(css);
};

// 初始化
NDX.MonsterBubble.injectCSS();

console.log('[MonsterBubble] 怪物冒泡说话组件已加载');
