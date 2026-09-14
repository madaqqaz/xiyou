// =============================================================
// 剧情演出与立绘动效系统（Story Presentation & Sprite Animation）
// 对应留存设计优化方案 P2-3：剧情·美术·音乐
// =============================================================

NDX.StoryFX = NDX.StoryFX || {};

// =============================================================
// 1. 剧情演出（Story Presentation）
// 关键剧情节点增加全屏演出
// =============================================================

NDX.StoryFX.playScene = function (options) {
  const opts = options || {};
  const title = opts.title || '';
  const subtitle = opts.subtitle || '';
  const lines = opts.lines || [];
  const background = opts.background || null;
  const character = opts.character || null;
  const onComplete = opts.onComplete || null;
  const duration = opts.duration || 500; // 每行文字显示间隔
  
  // 创建演出层
  const overlay = document.createElement('div');
  overlay.className = 'story-fx-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 6000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.5s ease;
  `;
  
  // 背景图
  if (background) {
    const bg = document.createElement('div');
    bg.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background-image: url(${background});
      background-size: cover;
      background-position: center;
      opacity: 0.3;
      filter: blur(2px);
    `;
    overlay.appendChild(bg);
  }
  
  // 角色立绘
  if (character) {
    const char = document.createElement('div');
    char.className = 'story-fx-character';
    char.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 10%;
      width: 300px;
      height: 400px;
      background-image: url(${character});
      background-size: contain;
      background-position: bottom center;
      background-repeat: no-repeat;
      opacity: 0;
      transform: translateX(50px);
      transition: all 1s ease;
      filter: drop-shadow(0 0 20px rgba(0,0,0,0.5));
    `;
    overlay.appendChild(char);
    setTimeout(() => {
      char.style.opacity = '1';
      char.style.transform = 'translateX(0)';
    }, 500);
  }
  
  // 标题
  const titleEl = document.createElement('div');
  titleEl.className = 'story-fx-title';
  titleEl.style.cssText = `
    font-size: 36px;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    margin-bottom: 10px;
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.8s ease;
    z-index: 1;
  `;
  titleEl.textContent = title;
  overlay.appendChild(titleEl);
  
  // 副标题
  if (subtitle) {
    const subEl = document.createElement('div');
    subEl.className = 'story-fx-subtitle';
    subEl.style.cssText = `
      font-size: 18px;
      color: #c9b896;
      margin-bottom: 30px;
      opacity: 0;
      transition: opacity 0.8s ease 0.3s;
      z-index: 1;
    `;
    subEl.textContent = subtitle;
    overlay.appendChild(subEl);
  }
  
  // 台词容器
  const linesContainer = document.createElement('div');
  linesContainer.className = 'story-fx-lines';
  linesContainer.style.cssText = `
    max-width: 600px;
    text-align: center;
    z-index: 1;
  `;
  overlay.appendChild(linesContainer);
  
  // 点击继续提示
  const hint = document.createElement('div');
  hint.className = 'story-fx-hint';
  hint.style.cssText = `
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    color: #7a6b5a;
    font-size: 14px;
    opacity: 0;
    animation: storyHintPulse 1.5s infinite;
    z-index: 1;
  `;
  hint.textContent = '点击继续';
  overlay.appendChild(hint);
  
  document.body.appendChild(overlay);
  
  // 淡入
  setTimeout(() => {
    overlay.style.opacity = '1';
    titleEl.style.opacity = '1';
    titleEl.style.transform = 'translateY(0)';
    if (subtitle) {
      setTimeout(() => {
        overlay.querySelector('.story-fx-subtitle').style.opacity = '1';
      }, 300);
    }
  }, 100);
  
  // 逐行显示台词
  let currentLine = 0;
  function showNextLine() {
    if (currentLine < lines.length) {
      const line = lines[currentLine];
      const lineEl = document.createElement('div');
      lineEl.className = 'story-fx-line';
      lineEl.style.cssText = `
        font-size: 16px;
        color: #e8d5b0;
        line-height: 1.8;
        margin-bottom: 15px;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.5s ease;
      `;
      
      // 说话人
      if (line.speaker) {
        lineEl.innerHTML = `<span style="color: #ffd700; font-weight: bold;">${line.speaker}：</span>${line.text}`;
      } else {
        lineEl.textContent = line.text;
      }
      
      linesContainer.appendChild(lineEl);
      setTimeout(() => {
        lineEl.style.opacity = '1';
        lineEl.style.transform = 'translateY(0)';
      }, 50);
      
      currentLine++;
      hint.style.opacity = '1';
    } else {
      // 所有台词显示完毕
      hint.textContent = '点击结束';
    }
  }
  
  // 点击事件
  let clicked = false;
  overlay.addEventListener('click', () => {
    if (currentLine < lines.length) {
      showNextLine();
    } else if (!clicked) {
      clicked = true;
      // 淡出
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        if (onComplete) onComplete();
      }, 500);
    }
  });
  
  // 自动显示第一行
  setTimeout(() => showNextLine(), 1000);
  
  // 注入提示动画CSS
  if (!document.getElementById('story-fx-css')) {
    const css = document.createElement('style');
    css.id = 'story-fx-css';
    css.textContent = `
      @keyframes storyHintPulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
    `;
    document.head.appendChild(css);
  }
  
  return overlay;
};

// =============================================================
// 2. 立绘动效（Sprite Animation）
// NPC对话时立绘有轻微呼吸动画，说话时嘴巴微动
// =============================================================

NDX.StoryFX.enableSpriteAnimation = function (element, options) {
  if (!element) return;
  const opts = options || {};
  const breathing = opts.breathing !== false;
  const speaking = opts.speaking || false;
  
  // 呼吸动画
  if (breathing) {
    element.style.animation = 'spriteBreath 3s ease-in-out infinite';
  }
  
  // 说话动画（嘴巴微动，通过轻微缩放实现）
  if (speaking) {
    element.style.animation = 'spriteSpeak 0.3s ease-in-out infinite';
  }
  
  // 注入动画CSS
  if (!document.getElementById('sprite-animation-css')) {
    const css = document.createElement('style');
    css.id = 'sprite-animation-css';
    css.textContent = `
      @keyframes spriteBreath {
        0%, 100% { transform: scale(1) translateY(0); }
        50% { transform: scale(1.02) translateY(-2px); }
      }
      @keyframes spriteSpeak {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.01); }
      }
      @keyframes spriteEnter {
        from { opacity: 0; transform: translateX(-30px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes spriteExit {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(30px); }
      }
    `;
    document.head.appendChild(css);
  }
};

// 立绘入场动画
NDX.StoryFX.spriteEnter = function (element, direction) {
  if (!element) return;
  const dir = direction || 'left';
  element.style.opacity = '0';
  element.style.transform = dir === 'left' ? 'translateX(-30px)' : 'translateX(30px)';
  element.style.transition = 'all 0.5s ease';
  setTimeout(() => {
    element.style.opacity = '1';
    element.style.transform = 'translateX(0)';
  }, 50);
};

// 立绘退场动画
NDX.StoryFX.spriteExit = function (element, direction, callback) {
  if (!element) return;
  const dir = direction || 'right';
  element.style.transition = 'all 0.5s ease';
  element.style.opacity = '0';
  element.style.transform = dir === 'left' ? 'translateX(-30px)' : 'translateX(30px)';
  setTimeout(() => {
    if (callback) callback();
  }, 500);
};

// =============================================================
// 3. 对话气泡（Dialog Bubble）
// 带立绘的对话气泡
// =============================================================

NDX.StoryFX.showDialog = function (options) {
  const opts = options || {};
  const speaker = opts.speaker || '';
  const text = opts.text || '';
  const portrait = opts.portrait || null;
  const position = opts.position || 'bottom'; // bottom/left/right
  const duration = opts.duration || 0; // 0=点击关闭
  const onClose = opts.onClose || null;
  
  // 创建对话气泡
  const bubble = document.createElement('div');
  bubble.className = 'story-dialog-bubble';
  
  let positionStyle = '';
  if (position === 'bottom') {
    positionStyle = 'bottom: 100px; left: 50%; transform: translateX(-50%);';
  } else if (position === 'left') {
    positionStyle = 'bottom: 100px; left: 50px;';
  } else {
    positionStyle = 'bottom: 100px; right: 50px;';
  }
  
  bubble.style.cssText = `
    position: fixed;
    ${positionStyle}
    max-width: 500px;
    background: linear-gradient(135deg, rgba(26, 21, 16, 0.95), rgba(45, 36, 24, 0.95));
    border: 2px solid #8b7355;
    border-radius: 12px;
    padding: 15px 20px;
    z-index: 5500;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    animation: dialogBubbleIn 0.3s ease;
  `;
  
  let html = '';
  
  // 说话人
  if (speaker) {
    html += `<div style="color: #ffd700; font-weight: bold; font-size: 16px; margin-bottom: 8px;">${speaker}</div>`;
  }
  
  // 文本
  html += `<div style="color: #e8d5b0; font-size: 14px; line-height: 1.6;">${text}</div>`;
  
  bubble.innerHTML = html;
  document.body.appendChild(bubble);
  
  // 注入动画CSS
  if (!document.getElementById('dialog-bubble-css')) {
    const css = document.createElement('style');
    css.id = 'dialog-bubble-css';
    css.textContent = `
      @keyframes dialogBubbleIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(css);
  }
  
  // 自动关闭
  if (duration > 0) {
    setTimeout(() => {
      NDX.StoryFX.closeDialog(bubble, onClose);
    }, duration);
  }
  
  // 点击关闭
  bubble.addEventListener('click', () => {
    NDX.StoryFX.closeDialog(bubble, onClose);
  });
  
  return bubble;
};

// 关闭对话气泡
NDX.StoryFX.closeDialog = function (bubble, callback) {
  if (!bubble) return;
  bubble.style.transition = 'all 0.3s ease';
  bubble.style.opacity = '0';
  bubble.style.transform = 'translateY(20px)';
  setTimeout(() => {
    if (bubble.parentElement) bubble.remove();
    if (callback) callback();
  }, 300);
};

console.log('[StoryFX] 剧情演出与立绘动效系统已加载');
