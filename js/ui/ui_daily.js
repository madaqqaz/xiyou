// =============================================================
// 每日系统UI组件（Daily UI）
// 对应留存设计优化方案 P2-1：限时·每日·FOMO
// =============================================================

NDX.UIDaily = NDX.UIDaily || {};

// 面板是否打开
NDX.UIDaily.isOpen = false;

// 打开每日面板
NDX.UIDaily.open = function () {
  if (NDX.UIDaily.isOpen) return;
  NDX.UIDaily.isOpen = true;
  NDX.UIDaily.render();
};

// 关闭每日面板
NDX.UIDaily.close = function () {
  NDX.UIDaily.isOpen = false;
  const panel = document.getElementById('daily-panel');
  if (panel) panel.remove();
  const overlay = document.getElementById('daily-overlay');
  if (overlay) overlay.remove();
};

// 渲染面板
NDX.UIDaily.render = function () {
  const oldPanel = document.getElementById('daily-panel');
  if (oldPanel) oldPanel.remove();
  const oldOverlay = document.getElementById('daily-overlay');
  if (oldOverlay) oldOverlay.remove();

  // 遮罩
  const overlay = document.createElement('div');
  overlay.id = 'daily-overlay';
  overlay.className = 'daily-overlay';
  overlay.onclick = () => NDX.UIDaily.close();
  document.body.appendChild(overlay);

  // 面板
  const panel = document.createElement('div');
  panel.id = 'daily-panel';
  panel.className = 'daily-panel';

  const meditation = NDX.Daily.getMeditationPreview();
  const challenge = NDX.Daily.getTodayChallenge();
  const stats = NDX.Daily.getStats();
  const activeEvent = stats.activeEvent;

  panel.innerHTML = `
    <div class="daily-close" onclick="NDX.UIDaily.close()">✕</div>
    <div class="daily-header">
      <h2>📅 每日修行</h2>
      <p class="daily-subtitle">每日登录领取奖励，完成劫难获取功德</p>
      <div class="daily-streak">
        <span class="streak-icon">🔥</span>
        <span class="streak-text">连续修行 <b>${meditation.loginStreak}</b> 天</span>
      </div>
    </div>
    
    <!-- 每日禅修 -->
    <div class="daily-section">
      <h3>🧘 每日禅修</h3>
      <div class="meditation-card ${meditation.todayClaimed ? 'claimed' : ''}">
        <div class="meditation-info">
          <div class="meditation-day">第 ${meditation.streakDay} 天 · ${meditation.todayReward.desc}</div>
          <div class="meditation-rewards">
            ${meditation.todayReward.gold ? `<span class="reward-item">💰 ${meditation.todayReward.gold}</span>` : ''}
            ${meditation.todayReward.sutraFragment ? `<span class="reward-item">📜 经文碎片 ×${meditation.todayReward.sutraFragment}</span>` : ''}
            ${meditation.todayReward.equipQuality ? `<span class="reward-item">⚔️ ${meditation.todayReward.equipQuality === 'blue' ? '稀有' : '史诗'}装备</span>` : ''}
          </div>
        </div>
        <button class="meditation-btn" 
                ${meditation.todayClaimed ? 'disabled' : ''}
                onclick="NDX.UIDaily.claimMeditation()">
          ${meditation.todayClaimed ? '✓ 已领取' : '领取奖励'}
        </button>
      </div>
      
      <!-- 7天奖励预览 -->
      <div class="week-preview">
        ${meditation.weekRewards.map(r => `
          <div class="week-day ${r.day === meditation.streakDay ? 'current' : ''} ${r.day < meditation.streakDay ? 'past' : ''}">
            <div class="week-day-num">${r.day}</div>
            <div class="week-day-reward">${r.gold}💰</div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <!-- 今日劫难 -->
    <div class="daily-section">
      <h3>⚔️ 今日劫难</h3>
      <div class="challenge-card ${challenge.completed ? 'completed' : ''}">
        <div class="challenge-info">
          <div class="challenge-name">${challenge.challenge.name}</div>
          <div class="challenge-desc">${challenge.challenge.desc}</div>
          <div class="challenge-reward">
            奖励：${challenge.challenge.reward.gold ? `${challenge.challenge.reward.gold}💰` : ''} 
            ${challenge.challenge.reward.merit ? `${challenge.challenge.reward.merit}功德` : ''}
          </div>
        </div>
        <div class="challenge-status">
          ${challenge.completed ? '<span class="status-completed">✓ 已完成</span>' : '<span class="status-pending">进行中</span>'}
        </div>
      </div>
    </div>
    
    <!-- 限时活动 -->
    ${activeEvent ? `
    <div class="daily-section event-section">
      <h3>🎉 限时活动</h3>
      <div class="event-card">
        <div class="event-name">${activeEvent.name}</div>
        <div class="event-desc">${activeEvent.desc}</div>
        <div class="event-effects">
          ${activeEvent.effects.dropRate ? `<span class="effect-item">掉落 ×${activeEvent.effects.dropRate}</span>` : ''}
          ${activeEvent.effects.expRate ? `<span class="effect-item">经验 ×${activeEvent.effects.expRate}</span>` : ''}
          ${activeEvent.effects.sutraDrop ? `<span class="effect-item">经文 ×${activeEvent.effects.sutraDrop}</span>` : ''}
          ${activeEvent.effects.allStats ? `<span class="effect-item">全属性 +${Math.round((activeEvent.effects.allStats - 1) * 100)}%</span>` : ''}
        </div>
      </div>
    </div>
    ` : ''}
    
    <!-- 统计 -->
    <div class="daily-stats">
      <div class="stat-item">
        <span class="stat-label">总登录</span>
        <span class="stat-value">${stats.totalLogins}天</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">完成劫难</span>
        <span class="stat-value">${stats.totalChallenges}次</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
};

// 领取禅修奖励
NDX.UIDaily.claimMeditation = function () {
  const result = NDX.Daily.claimMeditation();
  if (result.success) {
    NDX.UIDaily.render();
    NDX.UIDaily.showToast(`领取成功！获得 ${result.reward.gold}金币 + ${result.reward.sutraFragment}经文碎片`);
  } else {
    NDX.UIDaily.showToast(result.msg);
  }
};

// 显示提示
NDX.UIDaily.showToast = function (msg) {
  const toast = document.createElement('div');
  toast.className = 'daily-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
};

// 每日登录弹窗（新的一天首次登录时显示）
NDX.UIDaily.showLoginPopup = function () {
  const loginResult = NDX.Daily.onLogin();
  if (!loginResult.isNewDay) return null;
  
  const popup = document.createElement('div');
  popup.className = 'daily-login-popup';
  popup.innerHTML = `
    <div class="login-popup-content">
      <div class="login-popup-title">🌅 新的一天</div>
      <div class="login-popup-streak">连续修行 <b>${loginResult.loginStreak}</b> 天</div>
      <div class="login-popup-hint">记得领取每日禅修奖励哦！</div>
      <button class="login-popup-btn" onclick="this.parentElement.parentElement.remove(); NDX.UIDaily.open()">查看每日</button>
      <button class="login-popup-close" onclick="this.parentElement.parentElement.remove()">关闭</button>
    </div>
  `;
  document.body.appendChild(popup);
  
  // 5秒后自动消失
  setTimeout(() => {
    if (popup.parentElement) popup.remove();
  }, 8000);
  
  return popup;
};

console.log('[Daily UI] 每日系统UI组件已加载');
