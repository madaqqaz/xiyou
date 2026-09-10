// =============================================================
// 修行进度UI组件（Cultivation UI）
// 对应留存设计优化方案 P0-2：成长·精通·心流
// =============================================================

NDX.UICultivation = NDX.UICultivation || {};

// 面板是否打开
NDX.UICultivation.isOpen = false;
NDX.UICultivation.currentTab = 'stats'; // stats / ring

// 打开修行面板
NDX.UICultivation.open = function (tab) {
  if (NDX.UICultivation.isOpen) return;
  NDX.UICultivation.isOpen = true;
  NDX.UICultivation.currentTab = tab || 'stats';
  NDX.UICultivation.render();
};

// 关闭修行面板
NDX.UICultivation.close = function () {
  NDX.UICultivation.isOpen = false;
  const panel = document.getElementById('cultivation-panel');
  if (panel) panel.remove();
  const overlay = document.getElementById('cultivation-overlay');
  if (overlay) overlay.remove();
};

// 渲染面板
NDX.UICultivation.render = function () {
  const oldPanel = document.getElementById('cultivation-panel');
  if (oldPanel) oldPanel.remove();
  const oldOverlay = document.getElementById('cultivation-overlay');
  if (oldOverlay) oldOverlay.remove();

  // 遮罩
  const overlay = document.createElement('div');
  overlay.id = 'cultivation-overlay';
  overlay.className = 'cultivation-overlay';
  overlay.onclick = () => NDX.UICultivation.close();
  document.body.appendChild(overlay);

  // 面板
  const panel = document.createElement('div');
  panel.id = 'cultivation-panel';
  panel.className = 'cultivation-panel';

  const cultData = NDX.Cultivation.load();
  const ringData = NDX.Cultivation.loadRing();
  const diff = NDX.Cultivation.getDifficultyModifier();

  // 标签
  const tabsHtml = `
    <div class="cultivation-tabs">
      <div class="cultivation-tab ${NDX.UICultivation.currentTab === 'stats' ? 'active' : ''}" onclick="NDX.UICultivation.switchTab('stats')">
        <span class="ct-icon">📊</span><span>修行统计</span>
      </div>
      <div class="cultivation-tab ${NDX.UICultivation.currentTab === 'ring' ? 'active' : ''}" onclick="NDX.UICultivation.switchTab('ring')">
        <span class="ct-icon">🌳</span><span>年轮树</span>
        <span class="ct-badge">${ringData.rings || 0}</span>
      </div>
    </div>`;

  // 内容
  let contentHtml = '';
  if (NDX.UICultivation.currentTab === 'stats') {
    contentHtml = NDX.UICultivation.renderStats(cultData, diff);
  } else {
    contentHtml = NDX.UICultivation.renderRing(ringData);
  }

  panel.innerHTML = `
    <div class="cultivation-close" onclick="NDX.UICultivation.close()">✕</div>
    <div class="cultivation-header">
      <h2>🧘 修行录</h2>
      <p class="cultivation-subtitle">记录你的西行之路，见证每一次成长</p>
    </div>
    ${tabsHtml}
    ${contentHtml}
  `;
  document.body.appendChild(panel);
};

// 切换标签
NDX.UICultivation.switchTab = function (tab) {
  NDX.UICultivation.currentTab = tab;
  NDX.UICultivation.render();
};

// 渲染统计
NDX.UICultivation.renderStats = function (data, diff) {
  const winRate = data.totalRuns > 0 ? Math.round((data.totalWins / data.totalRuns) * 100) : 0;
  const playHours = Math.floor((data.playTime || 0) / 3600);
  const playMins = Math.floor(((data.playTime || 0) % 3600) / 60);

  return `
    <div class="cultivation-stats">
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-value">${data.totalRuns || 0}</div>
          <div class="stat-label">西行次数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.totalWins || 0}</div>
          <div class="stat-label">通关次数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${winRate}%</div>
          <div class="stat-label">通关率</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${playHours}h${playMins}m</div>
          <div class="stat-label">修行时长</div>
        </div>
      </div>
      
      <div class="stats-detail">
        <h4>📊 详细统计</h4>
        <div class="stats-grid">
          <div class="stat-row"><span>总击杀数</span><span class="stat-num">${data.totalKills || 0}</span></div>
          <div class="stat-row"><span>获得装备</span><span class="stat-num">${data.totalEquips || 0}</span></div>
          <div class="stat-row"><span>获得劫印</span><span class="stat-num">${data.totalSeals || 0}</span></div>
          <div class="stat-row"><span>获得经文</span><span class="stat-num">${data.totalSutras || 0}</span></div>
        </div>
      </div>
      
      <div class="stats-difficulty">
        <h4>⚖️ 当前难度</h4>
        <div class="difficulty-info">
          <div class="diff-label">${diff.label}</div>
          <div class="diff-modifier">难度系数：×${diff.modifier.toFixed(2)}</div>
          <div class="diff-desc">
            ${diff.modifier < 1 ? '佛佑加持，西行之路更为顺遂' : 
              diff.modifier > 1 ? '心魔试炼，妖魔更为凶悍，但掉落更佳' : 
              '标准难度，一切如常'}
          </div>
        </div>
      </div>
      
      ${data.bestRun ? `
      <div class="stats-best">
        <h4>🏆 最佳单局</h4>
        <div class="best-run-info">
          <div>英雄：${NDX.HEROES && NDX.HEROES.find ? (NDX.HEROES.find(h => h.id === data.bestRun.hero) || {}).name || data.bestRun.hero : data.bestRun.hero}</div>
          <div>到达地区：${data.bestRun.region || 0}</div>
          <div>击杀数：${data.bestRun.kills || 0}</div>
          <div>结果：${data.bestRun.win ? '✅ 通关' : '💀 阵亡'}</div>
        </div>
      </div>` : ''}
    </div>
  `;
};

// 渲染年轮树
NDX.UICultivation.renderRing = function (ringData) {
  const bonuses = NDX.Cultivation.getAllBonuses();
  
  let upgradesHtml = '';
  for (const upgrade of NDX.Cultivation.RING_UPGRADES) {
    const level = ringData.upgrades[upgrade.id] || 0;
    const maxed = level >= upgrade.max;
    const canAfford = (ringData.rings || 0) >= upgrade.cost;
    
    upgradesHtml += `
      <div class="ring-upgrade ${maxed ? 'maxed' : ''} ${canAfford && !maxed ? 'available' : ''}">
        <div class="ru-header">
          <span class="ru-name">${upgrade.name}</span>
          <span class="ru-level">Lv.${level}/${upgrade.max}</span>
        </div>
        <div class="ru-desc">${upgrade.desc}</div>
        <div class="ru-progress">
          <div class="ru-progress-fill" style="width: ${(level / upgrade.max) * 100}%"></div>
        </div>
        <button class="ru-buy-btn" 
                ${maxed || !canAfford ? 'disabled' : ''}
                onclick="NDX.UICultivation.buyUpgrade('${upgrade.id}')">
          ${maxed ? '已满级' : `🌳 ${upgrade.cost} 年轮`}
        </button>
      </div>
    `;
  }

  return `
    <div class="cultivation-ring">
      <div class="ring-overview">
        <div class="ring-tree-icon">🌳</div>
        <div class="ring-info">
          <div class="ring-count">${ringData.rings || 0} <span>年轮</span></div>
          <div class="ring-spent">已消耗：${ringData.spent || 0}</div>
        </div>
      </div>
      
      <div class="ring-bonuses">
        <h4>✨ 当前永久加成</h4>
        <div class="bonuses-grid">
          ${bonuses.hpBonus > 0 ? `<div class="bonus-item">气血 +${Math.round(bonuses.hpBonus * 100)}%</div>` : ''}
          ${bonuses.atkBonus > 0 ? `<div class="bonus-item">攻击 +${Math.round(bonuses.atkBonus * 100)}%</div>` : ''}
          ${bonuses.lifeBonus > 0 ? `<div class="bonus-item">寿数 +${bonuses.lifeBonus}岁</div>` : ''}
          ${bonuses.luckBonus > 0 ? `<div class="bonus-item">掉落 +${Math.round(bonuses.luckBonus * 100)}%</div>` : ''}
          ${bonuses.startEquipBonus > 0 ? `<div class="bonus-item">开局装备 +${bonuses.startEquipBonus}</div>` : ''}
          ${bonuses.startSealBonus > 0 ? `<div class="bonus-item">开局劫印 +${bonuses.startSealBonus}</div>` : ''}
          ${bonuses.coinBonus > 0 ? `<div class="bonus-item">金币 +${bonuses.coinBonus}</div>` : ''}
          ${bonuses.expBonus > 0 ? `<div class="bonus-item">经验 +${Math.round(bonuses.expBonus * 100)}%</div>` : ''}
          ${Object.values(bonuses).every(v => v === 0) ? '<div class="bonus-empty">暂无加成，消耗年轮解锁</div>' : ''}
        </div>
      </div>
      
      <div class="ring-upgrades">
        <h4>🌱 年轮升级</h4>
        <div class="upgrades-grid">
          ${upgradesHtml}
        </div>
      </div>
      
      <div class="ring-tips">
        <p>💡 每完成一局西行（无论生死），获得 1 个年轮。年轮可用于解锁永久加成，让你的西行之路越来越顺。</p>
      </div>
    </div>
  `;
};

// 购买升级
NDX.UICultivation.buyUpgrade = function (upgradeId) {
  const result = NDX.Cultivation.buyUpgrade(upgradeId);
  if (result.success) {
    NDX.UICultivation.render();
    NDX.UICultivation.showToast(`升级成功！剩余 ${result.remaining} 年轮`);
  } else {
    NDX.UICultivation.showToast(result.msg);
  }
};

// 显示提示
NDX.UICultivation.showToast = function (msg) {
  const toast = document.createElement('div');
  toast.className = 'cultivation-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
};

console.log('[Cultivation UI] 修行进度UI组件已加载');
