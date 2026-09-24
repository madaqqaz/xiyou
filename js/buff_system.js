/**
 * buff_system.js - 战斗 Buff 生命周期统一模型（V8.53）
 * 移植 Godot Gameplay Attributes（OctoD/godot_gameplay_attributes）的 Buff 设计模式：
 *   AttributeOperation（操作） + Buff 生命周期（duration/叠加/瞬时）+ 集中出账。
 * 目标：收敛战斗里散落的 pDebuffs/mBuffLayers 手写"挂/复挂/衰减/结算"样板，
 *       让生命周期与应用/衰减/清除语义单一真源在此文件；数值真源仍为 combat.js computeStats。
 *
 * 设计约束：
 * 1. 共享对象即物主存储：Pool 直接"收养"外部传入的 plain map（战斗里的 pDebuffs 对象），
 *    外部消费方（game_combat 系列 / main / ui_panel 系列）沿用同一对象，零改动。
 * 2. Battle 运行时惰性解析 PDB 副作用表（NDX.PDB_DOT/MISS/ATKMUL，定义于 combat_part2，
 *    加载晚于此文件但早于任何战斗运行），避免加载顺序耦合。
 * 3. 纯数据模型 + 运行时，零 DOM；可被 Node 直接单测。
 */
(function () {
  'use strict';

  var NDX = window.NDX || (window.NDX = {});

  var B = {};

  /**
   * AttributeOperation 语义（GGA AttributeOperation）：与 buffed 运算，供读值/出账复用。
   *   ADD/SUB/MUL/DIV/PERCENTAGE/SET —— PERCENTAGE 为按百分比乘（value 为百分比数，0.2=+20%）。
   */
  B.Op = { ADD: 'add', SUB: 'sub', MUL: 'mul', DIV: 'div', PERCENTAGE: 'pct', SET: 'set' };
  B.applyOp = function (op, value, current) {
    switch (op) {
      case B.Op.ADD: return (current || 0) + value;
      case B.Op.SUB: return (current || 0) - value;
      case B.Op.MUL: return (current || 0) * value;
      case B.Op.DIV: return value === 0 ? (current || 0) : (current || 0) / value;
      case B.Op.PERCENTAGE: return (current || 0) * (1 + value);
      case B.Op.SET: return value;
      default: return current;
    }
  };

  /**
   * Buff 时长合并策略（GGA AttributeBuff.duration_merging）：
   *   RESTART 同型复挂刷新到满 duration；ADD 累加时长；STACK 叠层（层数受 maxStacks 约束）。
   */
  B.DURATION = { STACK: 'stack', ADD: 'add', RESTART: 'restart' };

  // PDB 副作用表惰性读取（战斗运行时必然已定义于 combat_part2）
  function pdbDots() { return NDX.PDB_DOT || {}; }
  function pdbMiss() { return NDX.PDB_MISS || {}; }
  function pdbAtkMul() { return NDX.PDB_ATKMUL || {}; }

  /**
   * Pool：瞬时回合制 Buff 池（GGA AttributeContainer/BuffPoolQueue 的平迁）。
   * 收养 owner（plain map）为唯一真源——外部对 owner 直接写/删对池同样可见。
   * 仅归口生命周期的落账（apply/tick/clear）；结算读值经 dot/miss/atkMul。
   */
  function Pool(owner) {
    this.owner = owner || {};
  }

  Pool.prototype.apply = function (p) {
    p = p || {};
    // id/dur 缺失则 no-op（沿用"给谁续几回合"的最小契约，由调用方保证 type/dur）
    var id = p.id, dur = p.dur;
    if (id == null) return;
    var merge = p.merge || B.DURATION.RESTART;
    var cur = this.owner[id] || 0;
    var v;
    if (merge === B.DURATION.STACK) {
      var cap = (p.maxStacks == null) ? Infinity : p.maxStacks;
      v = Math.min(cur + 1, cap);
    } else if (merge === B.DURATION.ADD) {
      v = cur + (dur || 0);
    } else { // RESTART：刷新到满时长（Boss 招牌同型复挂）
      v = dur || 0;
    }
    if (v > 0) this.owner[id] = v; else delete this.owner[id];
  };

  // 瞬时时间推进：统一衰减（原 pDebuffs 逐键 -1 归零移除，语义一致）
  Pool.prototype.tick = function () {
    var o = this.owner;
    var keys = Object.keys(o);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var v = o[k] - 1;
      if (v > 0) o[k] = v; else delete o[k];
    }
  };

  // 统一清除（雪羽·净化：清空托管池，含全部键）
  Pool.prototype.clear = function () {
    var o = this.owner;
    Object.keys(o).forEach(function (k) { delete o[k]; });
  };

  Pool.prototype.has = function (id) { return (this.owner[id] || 0) > 0; };
  Pool.prototype.duration = function (id) { return this.owner[id] || 0; };

  // 出账：生效中的 DOT 型招牌（逐条目出账，等价原 PDB_DOT×生效判定）
  Pool.prototype.activeDots = function () {
    var D = pdbDots();
    var keys = Object.keys(D);
    var out = [];
    for (var i = 0; i < keys.length; i++) {
      var t = keys[i];
      if ((this.owner[t] || 0) > 0) out.push({ type: t, def: D[t] });
    }
    return out;
  };

  // 出账：落空概率（同时生效取最高，原 PDB_MISS 语义）
  Pool.prototype.miss = function () {
    var M = pdbMiss();
    var keys = Object.keys(M);
    var prob = 0, type = null;
    for (var i = 0; i < keys.length; i++) {
      var t = keys[i];
      if ((this.owner[t] || 0) > 0 && M[t] > prob) { prob = M[t]; type = t; }
    }
    return { prob: prob, type: type };
  };

  // 出账：减攻乘数（同时生效取最小，原 PDB_ATKMUL 语义）
  Pool.prototype.atkMul = function () {
    var A = pdbAtkMul();
    var keys = Object.keys(A);
    var mul = 1, type = null;
    for (var i = 0; i < keys.length; i++) {
      var t = keys[i];
      if ((this.owner[t] || 0) > 0 && A[t] < mul) { mul = A[t]; type = t; }
    }
    return { mul: mul, type: type };
  };

  // 工厂：收养一个既有 plain map 为物主存储（战斗里的 pDebuffs）
  /**
   * resolve：GGA AttributeContainer 的只读顺序结算入口。
   * 输入一个由 { key, op, value } 组成的 op 链（同 key 多条按顺序依次 applyOp），
   * 在一个基础对象 base 之上按声明顺序产出最终只读快照。
   * 用途：computeStats 里"纯加性属性字段逐来源累加"（装备/bonus/经文/随从）收敛为声明式。
   *   每条 op 与原有 `field += x` / `field *= x` 逐项等价；不改任何最终值。
   */
  B.resolve = function (ops, base) {
    var res = {};
    if (base) for (var k in base) { if (Object.prototype.hasOwnProperty.call(base, k)) res[k] = base[k]; }
    ops = ops || [];
    for (var i = 0; i < ops.length; i++) {
      var o = ops[i];
      if (!o || o.key == null || o.value == null) continue;
      res[o.key] = B.applyOp(o.op || B.Op.ADD, o.value, res[o.key]);
    }
    return res;
  };

  B.pool = function (owner) { return new Pool(owner); };

  /**
   * StackPool：可叠加 Buff 的层数记数（妖气暴涨等持久叠层，DURATION.STACK 语义）。
   * 原 mBuffLayers 为裸计数器，现归口此栈，供统一测试与复用。
   */
  function StackPool(id, start) {
    this.id = id;
    this._v = start || 0;
    this._cap = Infinity;
  }
  StackPool.prototype.add = function (n) { this._v = Math.min(this._v + (n || 1), this._cap); return this._v; };
  StackPool.prototype.count = function () { return this._v; };
  StackPool.prototype.cap = function (c) { this._cap = c; return this._v; };
  StackPool.prototype.reset = function (v) { this._v = v || 0; return this._v; };
  B.stackPool = function (id, start) { return new StackPool(id, start); };

  NDX.BuffSystem = B;
})();