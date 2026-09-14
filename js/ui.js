// =============================================================
// ui.js — 渲染与面板（纯展示，读 NDX.game.state）
// =============================================================
// HTML 文本转义（被 sceneModal / rewardModal / _safe 错误降级等多处引用，必须全局定义）
function esc(v) {
  if (v === undefined || v === null) return '';
  return String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
NDX.esc = esc;

// V8.32 手机适配·长安送行教学：每步观音点睛文案（复用每步关键提示，观音视角盖字）。
// 仅作为气泡文本；原文教学卡不动。step5(收尾)返回空、不弹气泡。
function SongStepTip(step) {
  const tips = {
    0: '金蝉子，此去西行十万八千里。三件法器已备，慎用之。',
    1: '包裹为行囊，所得装备、法宝、材料尽入其中，随时可查。',
    2: '袈裟护于身，锡杖执于手，体愿双系，当按需而御。',
    3: '法宝为主动战技，临阵祭出可重创群敌，然有冷却之时。',
    4: '地图高亮处即可行之径，节点众，择其利者而西进。',
  };
  return tips[step] || '';
}

NDX.ui = {
TAGS: {
    tutorial: '<img src="img/map_nodes/tutorial.webp" class="map-node-icon" alt="教学" loading="lazy" decoding="async">',
    mob: '<img src="img/map_nodes/battle.webp" class="map-node-icon" alt="战斗" loading="lazy" decoding="async">',
    trial: '<img src="img/map_nodes/trial.webp" class="map-node-icon" alt="劫难" loading="lazy" decoding="async">',
    elite: '<img src="img/map_nodes/elite.webp" class="map-node-icon" alt="精英" loading="lazy" decoding="async">',
    boss: '<img src="img/map_nodes/boss.webp" class="map-node-icon" alt="关隘" loading="lazy" decoding="async">',
    rest: '<img src="img/map_nodes/rest.webp" class="map-node-icon" alt="歇脚" loading="lazy" decoding="async">',
    shop: '<img src="img/map_nodes/shop.webp" class="map-node-icon" alt="坊市" loading="lazy" decoding="async">',
    event: '<img src="img/map_nodes/event.webp" class="map-node-icon" alt="奇遇" loading="lazy" decoding="async">',
    treasure: '<img src="img/map_nodes/treasure.webp" class="map-node-icon" alt="宝窟" loading="lazy" decoding="async">',
    treasure_lux: '<img src="img/map_nodes/treasure.webp" class="map-node-icon" alt="秘藏宝窟" loading="lazy" decoding="async">',
    branch: '<img src="img/map_nodes/branch.webp" class="map-node-icon" alt="岔路" loading="lazy" decoding="async">',
    start: '<img src="img/map_nodes/start.webp" class="map-node-icon" alt="起点" loading="lazy" decoding="async">',
    cave: '<img src="img/map_nodes/cave.webp" class="map-node-icon" alt="秘境" loading="lazy" decoding="async">',
    compound: '<img src="img/map_nodes/compound.webp" class="map-node-icon" alt="复合" loading="lazy" decoding="async">',
  },
showAchBook: false,
showCyclePalace: false,
showCollection: false,
showRubbing: false,
showYezanglu: false,
showMonuments: false,
showAsh: false,
showRanking: false,
showChangan: false,
showSettings: false,
showMetaOverview: false,
showCompliance: false,
complianceKind: 'privacy',
_resetConfirm: false,
showPetAtlas: false,
showDockModal: false,
dockTab: 'equip',
fightSpeed: 1,
fightSpeedLocked: false,
stageBreakRemain: 0,
_fxListeners: {},
_domCache: {},
_LINE_POOL: {
    wukong: {
      crit: ['吃俺老孙一棒！', '碎你这业障！'],
      hurt: ['哼，挠痒！'],
      break: ['这便破了你的道！'],
    },
    tangseng: {
      crit: ['阿弥陀佛，善哉。'],
      hurt: ['罪过，罪过…'],
      break: ['业障自当消散。'],
    },
    boss: {
      crit: ['蝼蚁，安敢犯我！'],
      hurt: ['呃…你竟能伤我？'],
      break: ['业障破碎？可笑！'],
    },
  },
_TREASURE_LINE: {
    zijinbo: '钵盂罩定！', baojiao: '芭蕉扇起，业风倒卷！', zhaoyao: '照妖镜照，原形毕露！',
    jinchan: '金蝉舍利，护我周全！', zijinhu: '紫金红葫芦，收！',
  },
_fxLineCD: {},
_fxBubbleMax: 2,
_fxBubbles: [],
effectDensity: 'high',
_particlePool: {
    slash: [],
    projectile: [],
    climaxParticle: [],
    maxPoolSize: 20,
    
    // 从对象池获取元素
    get(type) {
      const pool = this[type] || [];
      if (pool.length > 0) {
        return pool.pop();
      }
      return null;
    },
    
    // 将元素放回对象池
    put(type, el) {
      const pool = this[type] || [];
      if (pool.length < this.maxPoolSize) {
        // 清理元素状态
        el.className = el.className.replace(/show/g, '').trim();
        el.style.cssText = '';
        if (el.parentNode) el.parentNode.removeChild(el);
        pool.push(el);
      } else {
        // 对象池已满，直接销毁
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    },
    
    // 清空对象池
    clear() {
      this.slash = [];
      this.projectile = [];
      this.climaxParticle = [];
    }
  },
_toastQueue: [],
_toastBusy: false
};
