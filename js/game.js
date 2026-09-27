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
        // 🩸 S15 A3（2026-09-27 · Batch 0）：原实现直接 `storage.remove(RUN)`。
        //   `NDX.storage.VERSION` 每递增一次（`SAVE_VER`，见 storage.js:32），玩家**所有未完成的
        //   断点档**就会在这里被判定失效；而本函数是首页渲染路径（`ui_misc_1.js _runResumeHtml`）
        //   的常客 ⇒ 无声无息蒸发，玩家几十分钟的局说没就没。改为「先整串复刻到
        //   `xy_run_autosave_v1_archive` 再清」。失效判据本身一字未动（构造性零回归）。
        //   ⚠ UI 层「发现失效断点已保留」的提示待后续批次接线，本批只保证数据可救。
        NDX.storage.archiveRunSave(o._runInvalid ? 'structure' : 'version');
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
