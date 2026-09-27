// =============================================================
// battle_sprite_player.js - 战斗序列帧精灵播放器
// 功能：播放英雄/怪物的序列帧动画（待机/攻击/施法/受击/死亡）
// 加载顺序：battle_animation.js -> battle_sprite_player.js
// 规范：动画实现规范_精灵表打包与播放.md
// =============================================================

window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.BattleSprite = NDX.BattleSprite || {};

// =============================================================
// 一、精灵表数据注册表
// =============================================================

NDX.BattleSprite.ATLAS_REGISTRY = {
  // 英雄精灵表（待生成后填充）
  'hero_tangseng': {
    image: 'img/sprites/heroes/tangseng_atlas.webp',
    frames: null, // 运行时加载
    meta: {
      size: { w: 5120, h: 5120 },
      fps: { idle: 3.33, attack: 6.67, cast: 5.0, hit: 6.67, death: 2.5 },
      pivot: { x: 0.5, y: 0.8 }
    }
  },
  'hero_wukong': {
    image: 'img/sprites/heroes/wukong_atlas.webp',
    frames: null,
    meta: {
      size: { w: 5120, h: 5120 },
      fps: { idle: 3.33, attack: 6.67, cast: 5.0, hit: 6.67, death: 2.5 },
      pivot: { x: 0.5, y: 0.8 }
    }
  },
  // 怪物精灵表（待生成后填充）
  'mob_generic': {
    image: 'img/sprites/mobs/generic_atlas.webp',
    frames: null,
    meta: {
      size: { w: 5120, h: 5120 },
      fps: { idle: 3.33, attack: 6.67, cast: 5.0, hit: 6.67, death: 2.5 },
      pivot: { x: 0.5, y: 0.8 }
    }
  }
};

// 已加载的精灵表缓存
NDX.BattleSprite._loadedAtlas = {};
NDX.BattleSprite._loadingPromises = {};

// =============================================================
// 二、精灵表加载
// =============================================================

NDX.BattleSprite.loadAtlas = function(atlasKey) {
  const registry = this.ATLAS_REGISTRY[atlasKey];
  if (!registry) {
    console.warn('[BattleSprite] 未找到精灵表:', atlasKey);
    return Promise.reject(new Error('未找到精灵表: ' + atlasKey));
  }

  // 已加载缓存
  if (this._loadedAtlas[atlasKey]) {
    return Promise.resolve(this._loadedAtlas[atlasKey]);
  }

  // 加载中，返回同一个Promise
  if (this._loadingPromises[atlasKey]) {
    return this._loadingPromises[atlasKey];
  }

  const self = this;
  this._loadingPromises[atlasKey] = new Promise(function(resolve, reject) {
    // 加载图片
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      // 加载帧数据JSON（如果存在）
      const jsonUrl = registry.image.replace(/\.(webp|png)$/, '.json');
      fetch(jsonUrl)
        .then(function(res) {
          if (res.ok) return res.json();
          // JSON不存在，使用默认帧数据
          return self._generateDefaultFrames(registry.meta);
        })
        .then(function(data) {
          const atlas = {
            image: img,
            frames: data.frames || self._generateDefaultFrames(registry.meta).frames,
            meta: data.meta || registry.meta
          };
          self._loadedAtlas[atlasKey] = atlas;
          delete self._loadingPromises[atlasKey];
          resolve(atlas);
        })
        .catch(function() {
          // JSON加载失败，使用默认帧数据
          const atlas = {
            image: img,
            frames: self._generateDefaultFrames(registry.meta).frames,
            meta: registry.meta
          };
          self._loadedAtlas[atlasKey] = atlas;
          delete self._loadingPromises[atlasKey];
          resolve(atlas);
        });
    };
    img.onerror = function() {
      delete self._loadingPromises[atlasKey];
      reject(new Error('精灵表图片加载失败: ' + registry.image));
    };
    img.src = registry.image;
  });

  return this._loadingPromises[atlasKey];
};

// 生成默认帧数据（5x5网格，25帧）
NDX.BattleSprite._generateDefaultFrames = function(meta) {
  const frameSize = 1024;
  const frames = {};
  const actions = [
    { name: 'idle', count: 4, duration: 300 },
    { name: 'attack', count: 6, duration: 150 },
    { name: 'cast', count: 6, duration: 200 },
    { name: 'hit', count: 3, duration: 150 },
    { name: 'death', count: 6, duration: 400 }
  ];

  let idx = 0;
  actions.forEach(function(action) {
    for (let i = 0; i < action.count; i++) {
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      frames[action.name + '_' + i] = {
        frame: {
          x: col * frameSize,
          y: row * frameSize,
          w: frameSize,
          h: frameSize
        },
        duration: action.duration
      };
      idx++;
    }
  });

  return { frames: frames, meta: meta };
};

// =============================================================
// 三、精灵播放器类
// =============================================================

NDX.BattleSprite.Player = function(atlasKey, options) {
  options = options || {};
  this.atlasKey = atlasKey;
  this.atlas = null;
  this.state = 'idle';
  this.idx = 0;
  this.acc = 0;
  this.faceLeft = options.faceLeft || false;
  this.once = false;
  this.scale = options.scale || 1;
  this.opacity = 1;
  this.filters = '';
  this.visible = true;
  this.x = 0;
  this.y = 0;
  this._lastTime = 0;
  this._animationEndCallback = null;
};

// 设置状态
NDX.BattleSprite.Player.prototype.setState = function(state, callback) {
  if (this.state === state) return;
  this.state = state;
  this.idx = 0;
  this.acc = 0;
  this.once = (state === 'attack' || state === 'hit' || state === 'death' || state === 'cast');
  this._animationEndCallback = callback || null;
};

// 更新动画
NDX.BattleSprite.Player.prototype.update = function(dt) {
  if (!this.atlas || !this.visible) return;

  const key = this.state + '_' + this.idx;
  const f = this.atlas.frames[key];
  if (!f) return;

  this.acc += dt;
  while (this.acc >= f.duration) {
    this.acc -= f.duration;
    this.idx++;
    const next = this.state + '_' + this.idx;
    if (!this.atlas.frames[next]) {
      // 当前动作播完
      if (this.once) {
        if (this.state === 'death') {
          this.idx--; // 死亡停最后一帧
        } else {
          if (this._animationEndCallback) {
            const cb = this._animationEndCallback;
            this._animationEndCallback = null;
            cb();
          }
          this.setState('idle'); // 其余播完回待机
        }
      } else {
        this.idx = 0; // 循环
      }
      break;
    }
  }
};

// 绘制精灵
NDX.BattleSprite.Player.prototype.draw = function(ctx, x, y) {
  if (!this.atlas || !this.visible) return;

  const f = this.atlas.frames[this.state + '_' + this.idx];
  if (!f) return;

  const p = this.atlas.meta.pivot || { x: 0.5, y: 0.8 };
  const drawX = x || this.x;
  const drawY = y || this.y;

  ctx.save();
  ctx.globalAlpha = this.opacity;
  if (this.filters) {
    ctx.filter = this.filters;
  }
  ctx.translate(drawX, drawY);
  ctx.scale(this.scale * (this.faceLeft ? -1 : 1), this.scale);
  ctx.drawImage(
    this.atlas.image,
    f.frame.x, f.frame.y, f.frame.w, f.frame.h,
    -f.frame.w * p.x, -f.frame.h * p.y, f.frame.w, f.frame.h
  );
  ctx.restore();
};

// 播放攻击动画
NDX.BattleSprite.Player.prototype.playAttack = function(callback) {
  this.setState('attack', callback);
};

// 播放施法动画
NDX.BattleSprite.Player.prototype.playCast = function(callback) {
  this.setState('cast', callback);
};

// 播放受击动画
NDX.BattleSprite.Player.prototype.playHit = function(callback) {
  this.setState('hit', callback);
};

// 播放死亡动画
NDX.BattleSprite.Player.prototype.playDeath = function(callback) {
  this.setState('death', callback);
};

// 设置朝向
NDX.BattleSprite.Player.prototype.setFaceLeft = function(faceLeft) {
  this.faceLeft = faceLeft;
};

// 设置缩放
NDX.BattleSprite.Player.prototype.setScale = function(scale) {
  this.scale = scale;
};

// 设置滤镜（用于异常状态）
NDX.BattleSprite.Player.prototype.setFilters = function(filters) {
  this.filters = filters;
};

// 设置位置
NDX.BattleSprite.Player.prototype.setPosition = function(x, y) {
  this.x = x;
  this.y = y;
};

// 显示/隐藏
NDX.BattleSprite.Player.prototype.show = function() {
  this.visible = true;
};

NDX.BattleSprite.Player.prototype.hide = function() {
  this.visible = false;
};

// =============================================================
// 四、战斗场景精灵管理器
// =============================================================

NDX.BattleSprite.Manager = function(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.sprites = [];
  this._running = false;
  this._lastTime = 0;
  this._rafId = null;
};

// 添加精灵
NDX.BattleSprite.Manager.prototype.addSprite = function(sprite) {
  this.sprites.push(sprite);
  return sprite;
};

// 移除精灵
NDX.BattleSprite.Manager.prototype.removeSprite = function(sprite) {
  const idx = this.sprites.indexOf(sprite);
  if (idx > -1) {
    this.sprites.splice(idx, 1);
  }
};

// 清空所有精灵
NDX.BattleSprite.Manager.prototype.clear = function() {
  this.sprites = [];
};

// 开始渲染循环
NDX.BattleSprite.Manager.prototype.start = function() {
  if (this._running) return;
  this._running = true;
  this._lastTime = performance.now();
  this._loop();
};

// 停止渲染循环
NDX.BattleSprite.Manager.prototype.stop = function() {
  this._running = false;
  if (this._rafId) {
    cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }
};

// 渲染循环
NDX.BattleSprite.Manager.prototype._loop = function() {
  if (!this._running) return;

  const now = performance.now();
  const dt = now - this._lastTime;
  this._lastTime = now;

  // 更新所有精灵
  for (let i = 0; i < this.sprites.length; i++) {
    this.sprites[i].update(dt);
  }

  // 清空画布
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

  // 绘制所有精灵
  for (let i = 0; i < this.sprites.length; i++) {
    this.sprites[i].draw(this.ctx);
  }

  const self = this;
  this._rafId = requestAnimationFrame(function() {
    self._loop();
  });
};

// =============================================================
// 五、CSS DOM模式精灵播放器（兼容现有DOM战斗界面）
// =============================================================

NDX.BattleSprite.DomPlayer = function(element, atlasKey, options) {
  options = options || {};
  this.element = element;
  this.atlasKey = atlasKey;
  this.atlas = null;
  this.state = 'idle';
  this.idx = 0;
  this.acc = 0;
  this.faceLeft = options.faceLeft || false;
  this.once = false;
  this._lastTime = 0;
  this._rafId = null;
  this._running = false;
  this._animationEndCallback = null;
  this.frameSize = 1024;
};

// 加载精灵表
NDX.BattleSprite.DomPlayer.prototype.load = function() {
  const self = this;
  return NDX.BattleSprite.loadAtlas(this.atlasKey).then(function(atlas) {
    self.atlas = atlas;
    self._setupElement();
    return atlas;
  });
};

// 设置元素样式
NDX.BattleSprite.DomPlayer.prototype._setupElement = function() {
  if (!this.element || !this.atlas) return;

  this.element.style.backgroundImage = 'url(' + this.atlas.image.src + ')';
  this.element.style.backgroundRepeat = 'no-repeat';
  this.element.style.backgroundSize = (this.frameSize * 5) + 'px ' + (this.frameSize * 5) + 'px';
  this.element.style.width = this.frameSize + 'px';
  this.element.style.height = this.frameSize + 'px';
  this.element.style.transform = this.faceLeft ? 'scaleX(-1)' : '';
  this._updateFrame();
};

// 更新帧显示
NDX.BattleSprite.DomPlayer.prototype._updateFrame = function() {
  if (!this.element || !this.atlas) return;

  const key = this.state + '_' + this.idx;
  const f = this.atlas.frames[key];
  if (!f) return;

  this.element.style.backgroundPosition = '-' + f.frame.x + 'px -' + f.frame.y + 'px';
};

// 设置状态
NDX.BattleSprite.DomPlayer.prototype.setState = function(state, callback) {
  if (this.state === state) return;
  this.state = state;
  this.idx = 0;
  this.acc = 0;
  this.once = (state === 'attack' || state === 'hit' || state === 'death' || state === 'cast');
  this._animationEndCallback = callback || null;
  this._updateFrame();
};

// 开始动画循环
NDX.BattleSprite.DomPlayer.prototype.start = function() {
  if (this._running) return;
  this._running = true;
  this._lastTime = performance.now();
  this._loop();
};

// 停止动画循环
NDX.BattleSprite.DomPlayer.prototype.stop = function() {
  this._running = false;
  if (this._rafId) {
    cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }
};

// 动画循环
NDX.BattleSprite.DomPlayer.prototype._loop = function() {
  if (!this._running) return;

  const now = performance.now();
  const dt = now - this._lastTime;
  this._lastTime = now;

  if (this.atlas) {
    const key = this.state + '_' + this.idx;
    const f = this.atlas.frames[key];
    if (f) {
      this.acc += dt;
      while (this.acc >= f.duration) {
        this.acc -= f.duration;
        this.idx++;
        const next = this.state + '_' + this.idx;
        if (!this.atlas.frames[next]) {
          if (this.once) {
            if (this.state === 'death') {
              this.idx--;
            } else {
              if (this._animationEndCallback) {
                const cb = this._animationEndCallback;
                this._animationEndCallback = null;
                cb();
              }
              this.setState('idle');
            }
          } else {
            this.idx = 0;
          }
          break;
        }
        this._updateFrame();
      }
    }
  }

  const self = this;
  this._rafId = requestAnimationFrame(function() {
    self._loop();
  });
};

// 播放攻击动画
NDX.BattleSprite.DomPlayer.prototype.playAttack = function(callback) {
  this.setState('attack', callback);
};

// 播放施法动画
NDX.BattleSprite.DomPlayer.prototype.playCast = function(callback) {
  this.setState('cast', callback);
};

// 播放受击动画
NDX.BattleSprite.DomPlayer.prototype.playHit = function(callback) {
  this.setState('hit', callback);
};

// 播放死亡动画
NDX.BattleSprite.DomPlayer.prototype.playDeath = function(callback) {
  this.setState('death', callback);
};

// 设置朝向
NDX.BattleSprite.DomPlayer.prototype.setFaceLeft = function(faceLeft) {
  this.faceLeft = faceLeft;
  if (this.element) {
    this.element.style.transform = faceLeft ? 'scaleX(-1)' : '';
  }
};

// =============================================================
// 六、初始化
// =============================================================

NDX.BattleSprite.init = function() {
  console.log('[BattleSprite] 战斗序列帧精灵播放器已初始化');
  console.log('[BattleSprite] 支持模式: Canvas模式 + DOM模式');
  console.log('[BattleSprite] 标准动作集: 待机(4帧) 攻击(6帧) 施法(6帧) 受击(3帧) 死亡(6帧) = 25帧');
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    NDX.BattleSprite.init();
  });
} else {
  NDX.BattleSprite.init();
}
