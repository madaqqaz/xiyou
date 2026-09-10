// =============================================================
// 图鉴UI组件（Codex UI）
// 对应留存设计优化方案 P0-1：收集·图鉴·补全
// =============================================================

NDX.UICodex = NDX.UICodex || {};

// 图鉴面板是否打开
NDX.UICodex.isOpen = false;
NDX.UICodex.currentCategory = 'enemy';

// 打开图鉴面板
NDX.UICodex.open = function (category) {
  if (NDX.UICodex.isOpen) return;
  NDX.UICodex.isOpen = true;
  NDX.UICodex.currentCategory = category || 'enemy';
  NDX.UICodex.render();
};

// 关闭图鉴面板
NDX.UICodex.close = function () {
  NDX.UICodex.isOpen = false;
  const panel = document.getElementById('codex-panel');
  if (panel) panel.remove();
  const overlay = document.getElementById('codex-overlay');
  if (overlay) overlay.remove();
};

// 渲染图鉴面板
NDX.UICodex.render = function () {
  // 移除旧面板
  const oldPanel = document.getElementById('codex-panel');
  if (oldPanel) oldPanel.remove();
  const oldOverlay = document.getElementById('codex-overlay');
  if (oldOverlay) oldOverlay.remove();

  // 创建遮罩
  const overlay = document.createElement('div');
  overlay.id = 'codex-overlay';
  overlay.className = 'codex-overlay';
  overlay.onclick = () => NDX.UICodex.close();
  document.body.appendChild(overlay);

  // 创建面板
  const panel = document.createElement('div');
  panel.id = 'codex-panel';
  panel.className = 'codex-panel';
  
  // 获取全部进度
  const allProgress = NDX.CODEX.allProgress();
  
  // 分类标签
  let tabsHtml = '<div class="codex-tabs">';
  for (const cat in NDX.CODEX.CATEGORIES) {
    const catInfo = NDX.CODEX.CATEGORIES[cat];
    const progress = allProgress[cat];
    const active = cat === NDX.UICodex.currentCategory ? ' active' : '';
    tabsHtml += `<div class="codex-tab${active}" data-cat="${cat}" onclick="NDX.UICodex.switchCategory('${cat}')">
      <span class="codex-tab-icon">${catInfo.icon}</span>
      <span class="codex-tab-name">${catInfo.name}</span>
      <span class="codex-tab-progress">${progress.unlocked}/${progress.total}</span>
    </div>`;
  }
  tabsHtml += '</div>';

  // 当前分类内容
  const contentHtml = NDX.UICodex.renderCategory(NDX.UICodex.currentCategory);

  // 关闭按钮
  const closeBtn = '<div class="codex-close" onclick="NDX.UICodex.close()">✕</div>';

  // 标题
  const catInfo = NDX.CODEX.CATEGORIES[NDX.UICodex.currentCategory];
  const progress = allProgress[NDX.UICodex.currentCategory];
  const titleHtml = `<div class="codex-header">
    <h2>${catInfo.icon} ${catInfo.name}图鉴</h2>
    <div class="codex-header-progress">
      <div class="codex-progress-bar">
        <div class="codex-progress-fill" style="width: ${progress.percent}%"></div>
      </div>
      <span class="codex-progress-text">${progress.unlocked}/${progress.total} (${progress.percent}%)</span>
    </div>
    <p class="codex-header-desc">${catInfo.desc}</p>
  </div>`;

  panel.innerHTML = closeBtn + titleHtml + tabsHtml + contentHtml;
  document.body.appendChild(panel);
};

// 切换分类
NDX.UICodex.switchCategory = function (category) {
  NDX.UICodex.currentCategory = category;
  NDX.UICodex.render();
};

// 渲染分类内容
NDX.UICodex.renderCategory = function (category) {
  const unlocked = NDX.CODEX.getUnlocked(category);
  let items = [];

  // 根据分类获取所有条目
  switch (category) {
    case 'enemy':
      items = NDX.UICodex.getEnemyList();
      break;
    case 'boss':
      items = NDX.UICodex.getBossList();
      break;
    case 'equip':
      items = NDX.UICodex.getEquipList();
      break;
    case 'seal':
      items = NDX.UICodex.getSealList();
      break;
    case 'sutra':
      items = NDX.UICodex.getSutraList();
      break;
    case 'treasure':
      items = NDX.UICodex.getTreasureList();
      break;
  }

  if (items.length === 0) {
    return '<div class="codex-empty">暂无数据</div>';
  }

  let html = '<div class="codex-grid">';
  for (const item of items) {
    const isUnlocked = !!unlocked[item.id];
    const entryData = isUnlocked ? unlocked[item.id] : null;
    
    html += `<div class="codex-item ${isUnlocked ? 'unlocked' : 'locked'}" onclick="NDX.UICodex.showDetail('${category}', '${item.id}')">
      <div class="codex-item-icon">${isUnlocked ? (item.icon || '❓') : '❓'}</div>
      <div class="codex-item-name">${isUnlocked ? item.name : '???'}</div>
      ${entryData && entryData.count ? `<div class="codex-item-count">×${entryData.count}</div>` : ''}
    </div>`;
  }
  html += '</div>';

  return html;
};

// 显示详情
NDX.UICodex.showDetail = function (category, id) {
  const entry = NDX.CODEX.getEntry(category, id);
  if (!entry) {
    // 未解锁，显示提示
    NDX.UICodex.showToast('尚未解锁，继续探索吧！');
    return;
  }

  // 获取条目信息
  let itemInfo = null;
  switch (category) {
    case 'enemy':
      itemInfo = NDX.UICodex.getEnemyInfo(id);
      break;
    case 'boss':
      itemInfo = NDX.UICodex.getBossInfo(id);
      break;
    case 'equip':
      itemInfo = NDX.UICodex.getEquipInfo(id);
      break;
    case 'seal':
      itemInfo = NDX.UICodex.getSealInfo(id);
      break;
    case 'sutra':
      itemInfo = NDX.UICodex.getSutraInfo(id);
      break;
    case 'treasure':
      itemInfo = NDX.UICodex.getTreasureInfo(id);
      break;
  }

  if (!itemInfo) return;

  // 创建详情弹窗
  const detail = document.createElement('div');
  detail.id = 'codex-detail';
  detail.className = 'codex-detail';
  
  let detailHtml = '<div class="codex-detail-header">';
  detailHtml += `<div class="codex-detail-icon">${itemInfo.icon || '❓'}</div>`;
  detailHtml += `<div class="codex-detail-title">`;
  detailHtml += `<h3>${itemInfo.name}</h3>`;
  if (itemInfo.quality) detailHtml += `<span class="codex-detail-quality quality-${itemInfo.quality}">${itemInfo.qualityName || itemInfo.quality}</span>`;
  detailHtml += `</div></div>`;
  
  // 属性
  if (itemInfo.stats && Object.keys(itemInfo.stats).length > 0) {
    detailHtml += '<div class="codex-detail-stats"><h4>属性</h4><div class="codex-stats-grid">';
    for (const key in itemInfo.stats) {
      detailHtml += `<div class="codex-stat"><span class="codex-stat-key">${key}</span><span class="codex-stat-val">${itemInfo.stats[key]}</span></div>`;
    }
    detailHtml += '</div></div>';
  }
  
  // 技能
  if (itemInfo.skills && itemInfo.skills.length > 0) {
    detailHtml += '<div class="codex-detail-skills"><h4>技能</h4><ul>';
    for (const skill of itemInfo.skills) {
      detailHtml += `<li>${skill}</li>`;
    }
    detailHtml += '</ul></div>';
  }
  
  // 描述
  if (itemInfo.desc) {
    detailHtml += `<div class="codex-detail-desc"><h4>背景</h4><p>${itemInfo.desc}</p></div>`;
  }
  
  // 掉落
  if (itemInfo.drops && itemInfo.drops.length > 0) {
    detailHtml += '<div class="codex-detail-drops"><h4>掉落</h4><ul>';
    for (const drop of itemInfo.drops) {
      detailHtml += `<li>${drop}</li>`;
    }
    detailHtml += '</ul></div>';
  }
  
  // 统计
  if (entry.count) {
    detailHtml += `<div class="codex-detail-stats-info"><span>击败/获得次数：${entry.count}</span></div>`;
  }
  
  // 关闭按钮
  detailHtml += '<div class="codex-detail-close" onclick="document.getElementById(\'codex-detail\').remove()">关闭</div>';
  
  detail.innerHTML = detailHtml;
  document.body.appendChild(detail);
};

// 显示提示
NDX.UICodex.showToast = function (msg) {
  const toast = document.createElement('div');
  toast.className = 'codex-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
};

// =============================================================
// 数据获取辅助函数
// =============================================================

NDX.UICodex.getEnemyList = function () {
  const list = [];
  if (NDX.MONSTER_TABLE) {
    for (const id in NDX.MONSTER_TABLE) {
      const m = NDX.MONSTER_TABLE[id];
      list.push({ id, name: m.name || id, icon: '👹' });
    }
  } else if (NDX.MONSTERS) {
    for (const m of NDX.MONSTERS) {
      list.push({ id: m.id || m.name, name: m.name, icon: '👹' });
    }
  }
  return list;
};

NDX.UICodex.getBossList = function () {
  const list = [];
  if (NDX.BOSS_NAMES) {
    NDX.BOSS_NAMES.forEach((name, i) => {
      list.push({ id: `boss_${i}`, name, icon: '👺' });
    });
  }
  return list;
};

NDX.UICodex.getEquipList = function () {
  const list = [];
  if (NDX.EQUIP_TABLE) {
    for (const id in NDX.EQUIP_TABLE) {
      const e = NDX.EQUIP_TABLE[id];
      list.push({ id, name: e.name || id, icon: '⚔️', quality: e.quality });
    }
  } else if (NDX.EQUIPMENTS) {
    for (const e of NDX.EQUIPMENTS) {
      list.push({ id: e.id || e.name, name: e.name, icon: '⚔️', quality: e.quality });
    }
  }
  return list;
};

NDX.UICodex.getSealList = function () {
  const list = [];
  if (NDX.JIEYIN_TABLE) {
    for (const id in NDX.JIEYIN_TABLE) {
      const s = NDX.JIEYIN_TABLE[id];
      list.push({ id, name: s.name || id, icon: '🔮', quality: s.quality });
    }
  } else if (NDX.SEALS) {
    for (const s of NDX.SEALS) {
      list.push({ id: s.id || s.name, name: s.name, icon: '🔮', quality: s.quality });
    }
  }
  return list;
};

NDX.UICodex.getSutraList = function () {
  const list = [];
  if (NDX.SUTRA_FULLS) {
    for (const s of NDX.SUTRA_FULLS) {
      list.push({ id: s.id || s.name, name: s.name, icon: '📜' });
    }
  }
  if (NDX.NI_SUTRA_FULLS) {
    for (const s of NDX.NI_SUTRA_FULLS) {
      list.push({ id: s.id || s.name, name: s.name, icon: '📜' });
    }
  }
  return list;
};

NDX.UICodex.getTreasureList = function () {
  const list = [];
  if (NDX.TREASURES) {
    for (const t of NDX.TREASURES) {
      list.push({ id: t.id || t.name, name: t.name, icon: '🏺', quality: t.quality });
    }
  }
  return list;
};

// 详情信息获取（简化版，后续可完善）
NDX.UICodex.getEnemyInfo = function (id) {
  if (NDX.MONSTER_TABLE && NDX.MONSTER_TABLE[id]) {
    const m = NDX.MONSTER_TABLE[id];
    return { name: m.name || id, icon: '👹', stats: m.stats || {}, desc: m.desc || '' };
  }
  return { name: id, icon: '👹' };
};

NDX.UICodex.getBossInfo = function (id) {
  const idx = parseInt(id.replace('boss_', ''));
  if (NDX.BOSS_NAMES && NDX.BOSS_NAMES[idx]) {
    return { name: NDX.BOSS_NAMES[idx], icon: '👺' };
  }
  return { name: id, icon: '👺' };
};

NDX.UICodex.getEquipInfo = function (id) {
  if (NDX.EQUIP_TABLE && NDX.EQUIP_TABLE[id]) {
    const e = NDX.EQUIP_TABLE[id];
    return { name: e.name || id, icon: '⚔️', quality: e.quality, stats: e.stats || e.attrs || {}, desc: e.desc || '' };
  }
  return { name: id, icon: '⚔️' };
};

NDX.UICodex.getSealInfo = function (id) {
  if (NDX.JIEYIN_TABLE && NDX.JIEYIN_TABLE[id]) {
    const s = NDX.JIEYIN_TABLE[id];
    return { name: s.name || id, icon: '🔮', quality: s.quality, stats: s.stats || s.effect || {}, desc: s.desc || '' };
  }
  return { name: id, icon: '🔮' };
};

NDX.UICodex.getSutraInfo = function (id) {
  if (NDX.SUTRA_FULLS) {
    const s = NDX.SUTRA_FULLS.find(x => (x.id || x.name) === id);
    if (s) return { name: s.name, icon: '📜', desc: s.desc || s.effect || '' };
  }
  if (NDX.NI_SUTRA_FULLS) {
    const s = NDX.NI_SUTRA_FULLS.find(x => (x.id || x.name) === id);
    if (s) return { name: s.name, icon: '📜', desc: s.desc || s.effect || '' };
  }
  return { name: id, icon: '📜' };
};

NDX.UICodex.getTreasureInfo = function (id) {
  if (NDX.TREASURES) {
    const t = NDX.TREASURES.find(x => (x.id || x.name) === id);
    if (t) return { name: t.name, icon: '🏺', quality: t.quality, desc: t.desc || t.effect || '' };
  }
  return { name: id, icon: '🏺' };
};

console.log('[Codex UI] 图鉴UI组件已加载');
