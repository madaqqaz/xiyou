// =============================================================
// newbie_teach.js — 《逆道西行》新手教学触发与渲染逻辑
// 从 ui.js 拆分（2026-09-08）：独立维护新手教学触发与渲染
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
// 依赖：data_newbie_teach.js（NDX.NEWBIE_TEACH 数据表）
// 设计原则：
// 1. 每个教学只在玩家第一次接触该系统时触发，之后不再出现
// 2. 教学提示≤15字，出现在被教学元素旁边（气泡式），不居中弹窗
// 3. 玩家点对了，提示立刻消失；点错了提示不消失但不阻止操作
// 4. 关键教学要求玩家实际操作一次，不是只读

NDX.NewbieTeach = {
  // 当前激活的教学项
  _activeTeach: null,
  
  // 触发教学
  trigger: function (teachId, context) {
    try {
      // 检查教学是否已完成
      if (NDX.isNewbieTeachDone && NDX.isNewbieTeachDone(teachId)) {
        return false;
      }
      // 获取教学项
      const teach = NDX.NEWBIE_TEACH[teachId];
      if (!teach) return false;
      
      // 设置当前激活的教学项
      this._activeTeach = teach;
      
      // 触发UI渲染事件
      if (NDX.bus) {
        NDX.bus.emit('teach:show', { teach: teach, context: context });
      }
      
      return true;
    } catch (e) {
      console.error('NewbieTeach.trigger error:', e);
      return false;
    }
  },
  
  // 完成教学
  complete: function (teachId) {
    try {
      // 标记教学已完成
      if (NDX.markNewbieTeachDone) {
        NDX.markNewbieTeachDone(teachId);
      }
      
      // 清除当前激活的教学项
      if (this._activeTeach && this._activeTeach.id === teachId) {
        this._activeTeach = null;
      }
      
      // 触发UI隐藏事件
      if (NDX.bus) {
        NDX.bus.emit('teach:hide', { teachId: teachId });
      }
      
      return true;
    } catch (e) {
      console.error('NewbieTeach.complete error:', e);
      return false;
    }
  },
  
  // 获取当前激活的教学项
  getActive: function () {
    return this._activeTeach;
  },
  
  // 检查教学是否应该高亮某个元素
  shouldHighlight: function (targetSelector) {
    try {
      if (!this._activeTeach) return false;
      return this._activeTeach.target === targetSelector;
    } catch (e) {
      return false;
    }
  },
  
  // 获取教学气泡文本
  getBubbleText: function (targetSelector) {
    try {
      if (!this._activeTeach) return '';
      if (this._activeTeach.target !== targetSelector) return '';
      return this._activeTeach.text || '';
    } catch (e) {
      return '';
    }
  },
  
  // 重置所有教学状态（用于测试）
  reset: function () {
    try {
      if (NDX.resetNewbieTeach) {
        NDX.resetNewbieTeach();
      }
      this._activeTeach = null;
      return true;
    } catch (e) {
      return false;
    }
  },
};

// 便捷函数：触发教学
NDX.triggerTeach = function (teachId, context) {
  return NDX.NewbieTeach.trigger(teachId, context);
};

// 便捷函数：完成教学
NDX.completeTeach = function (teachId) {
  return NDX.NewbieTeach.complete(teachId);
};
