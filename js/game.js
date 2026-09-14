// =============================================================
// game.js — 游戏主状态机（纯逻辑，无 DOM）
// 流程：选英雄 → 进入节点 → 按类型结算 → 选择下一节点 → ... → Boss通关 / 死亡
// 体 / 愿 双体系：state.bonusTi(体) / state.bonusYuan(愿) 分别累积增益
// =============================================================
class Game {
constructor() {
    this.state = null;
    this._battleFlags = null;
  }
static hasRunSave() {
    try {
      const o = NDX.storage.load(NDX.storage.KEYS.RUN);
      if (!o || !o.meta || !o.meta.hero || (typeof o.layer !== 'number')) return false;
      // v2 起：地区制重构后旧断点失效，避免第一章出现第 20 难等错位
      if (o._runInvalid || (o.meta.version && o.meta.version < NDX.storage.VERSION)) {
        NDX.storage.remove(NDX.storage.KEYS.RUN);
        return false;
      }
      return true;
    } catch (e) { return false; }
  }
static runSaveInfo() {
    try {
      const o = NDX.storage.load(NDX.storage.KEYS.RUN);
      if (!o || !o.meta || !o.meta.hero) return null;
      if (o._runInvalid || (o.meta.version && o.meta.version < NDX.storage.VERSION)) return null;
      return { hero: o.meta.hero, heroName: o.meta.heroName || o.heroName, layer: o.meta.layer || o.layer, ts: o.meta.ts || 0 };
    } catch (e) { return null; }
  }
static clearRunSave() {
    try { NDX.storage.remove(NDX.storage.KEYS.RUN); } catch (e) {}
  }
}
NDX.Game = Game;
