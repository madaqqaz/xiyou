// =============================================================
// battle_particle_pool.js - 战斗粒子对象池系统
// 功能：复用粒子对象，减少GC压力，限制同屏粒子数量上限
// 加载顺序：battle_animation.js -> battle_particle_pool.js
// =============================================================

window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.ParticlePool = NDX.ParticlePool || {};

// =============================================================
// 一、配置
// =============================================================
NDX.ParticlePool.config = {
  maxParticles: 50,        // 同屏最大粒子数量（移动端性能优化）
  poolSize: 30,            // 对象池初始大小
  particleLifetime: 800,   // 粒子生命周期（毫秒）
  enabled: true            // 是否启用对象池
};

// =============================================================
// 二、对象池实现
// =============================================================
NDX.ParticlePool._pool = [];
NDX.ParticlePool._activeParticles = [];

// 初始化对象池
NDX.ParticlePool.init = function() {
  if (this._pool.length > 0) return;
  for (let i = 0; i < this.config.poolSize; i++) {
    this._pool.push(this._createParticle());
  }
};

// 创建粒子对象
NDX.ParticlePool._createParticle = function() {
  const el = document.createElement('div');
  el.style.position = 'absolute';
  el.style.pointerEvents = 'none';
  el.style.willChange = 'transform, opacity';
  el.style.display = 'none';
  return {
    el: el,
    active: false,
    startTime: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 10,
    color: '#fff',
    opacity: 1
  };
};

// 从对象池获取粒子
NDX.ParticlePool.getParticle = function() {
  if (!this.config.enabled) return this._createParticle();
  
  // 检查是否超过同屏最大粒子数量
  if (this._activeParticles.length >= this.config.maxParticles) {
    // 回收最老的粒子
    const oldest = this._activeParticles.shift();
    if (oldest) this._recycleParticle(oldest);
  }
  
  let particle = this._pool.pop();
  if (!particle) {
    particle = this._createParticle();
  }
  
  particle.active = true;
  particle.startTime = Date.now();
  this._activeParticles.push(particle);
  
  return particle;
};

// 回收粒子
NDX.ParticlePool._recycleParticle = function(particle) {
  if (!particle) return;
  particle.active = false;
  particle.el.style.display = 'none';
  if (particle.el.parentNode) {
    particle.el.parentNode.removeChild(particle.el);
  }
  if (this._pool.length < this.config.poolSize * 2) {
    this._pool.push(particle);
  }
};

// 释放粒子
NDX.ParticlePool.releaseParticle = function(particle) {
  if (!particle || !particle.active) return;
  const idx = this._activeParticles.indexOf(particle);
  if (idx > -1) {
    this._activeParticles.splice(idx, 1);
  }
  this._recycleParticle(particle);
};

// =============================================================
// 三、粒子发射接口
// =============================================================

// 发射粒子爆发效果
NDX.ParticlePool.emitBurst = function(container, x, y, options) {
  if (!this.config.enabled || !container) return;
  
  const opts = options || {};
  const count = opts.count || 8;
  const color = opts.color || '#ffd700';
  const size = opts.size || 8;
  const spread = opts.spread || 60;
  
  for (let i = 0; i < count; i++) {
    const particle = this.getParticle();
    if (!particle) continue;
    
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    
    particle.x = x;
    particle.y = y;
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed;
    particle.size = size + Math.random() * 4;
    particle.color = color;
    particle.opacity = 1;
    
    particle.el.style.cssText = [
      'position: absolute',
      'left: ' + x + 'px',
      'top: ' + y + 'px',
      'width: ' + particle.size + 'px',
      'height: ' + particle.size + 'px',
      'background: ' + color,
      'border-radius: 50%',
      'pointer-events: none',
      'will-change: transform, opacity',
      'opacity: 1',
      'transform: scale(1)',
      'transition: transform 0.6s ease-out, opacity 0.6s ease-out',
      'z-index: 1000'
    ].join(';');
    
    container.appendChild(particle.el);
    
    // 触发动画
    requestAnimationFrame(function() {
      particle.el.style.transform = 'translate(' + (particle.vx * spread) + 'px, ' + (particle.vy * spread) + 'px) scale(0)';
      particle.el.style.opacity = '0';
    });
    
    // 动画结束后回收
    const self = this;
    setTimeout(function() {
      self.releaseParticle(particle);
    }, this.config.particleLifetime);
  }
};

// 清理所有活跃粒子
NDX.ParticlePool.clearAll = function() {
  while (this._activeParticles.length > 0) {
    const particle = this._activeParticles.pop();
    this._recycleParticle(particle);
  }
};

// 初始化
try {
  NDX.ParticlePool.init();
} catch (e) {
  console.warn('[ParticlePool] 初始化失败:', e);
}
