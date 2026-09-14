// =============================================================
// data_newbie_teach.js — 《逆道西行》新手教学数据表
// 从 data.js 拆分（2026-09-08）：独立维护新手教学数据
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
// 设计原则：
// 1. 每个教学只在玩家第一次接触该系统时触发，之后不再出现
// 2. 教学提示≤15字，出现在被教学元素旁边（气泡式），不居中弹窗
// 3. 玩家点对了，提示立刻消失；点错了提示不消失但不阻止操作
// 4. 关键教学要求玩家实际操作一次（点击装备、点击法宝），不是只读
// 5. 玩家还没接触到的系统，绝不提前出现提示

NDX.NEWBIE_TEACH = {
  // 教学状态存储key
  STORAGE_KEY: 'ndx_newbie_teach_flags',
  
  // 教学项定义
  // id: 唯一标识
  // title: 教学标题（≤10字）
  // text: 教学提示文字（≤15字）
  // detail: 详细说明（≤30字，点击查看时显示）
  // trigger: 触发条件（函数或条件描述）
  // target: 目标元素选择器（用于高亮和气泡定位）
  // type: 'bubble'（气泡提示）/ 'highlight'（高亮按钮）/ 'modal'（弹窗说明）
  // once: 是否只触发一次（默认true）
  
  // ========== 第一难：金蝉遭贬（接引使战斗）==========
  n1_battle_attack: {
    id: 'n1_battle_attack',
    title: '攻击',
    text: '点击攻击，打出普攻',
    detail: '普攻是最基础的攻击方式，无消耗',
    target: '.battle-btn-attack',
    type: 'highlight',
    once: true,
    order: 1,
  },
  n1_battle_sutra: {
    id: 'n1_battle_sutra',
    title: '诵经',
    text: '诵经：法术伤害更高',
    detail: '诵经消耗愿力，造成法术伤害',
    target: '.battle-btn-sutra',
    type: 'highlight',
    once: true,
    order: 2,
  },
  n1_battle_ultimate: {
    id: 'n1_battle_ultimate',
    title: '终结',
    text: '金蝉禅唱：终结一击',
    detail: '敌人血量低于30%时可释放终结技',
    target: '.battle-btn-ultimate',
    type: 'highlight',
    once: true,
    order: 3,
  },
  
  // ========== 第一难：第一次抉择（六道）==========
  n1_fate_choice: {
    id: 'n1_fate_choice',
    title: '六道抉择',
    text: '选择你的道途',
    detail: '顺命→渡道，争胜→战道，避世→隐道',
    target: '.fate-choice-options',
    type: 'bubble',
    once: true,
    order: 4,
  },
  
  // ========== 第二难：金蝉蒙冤（劫印教学）==========
  n2_seal_panel: {
    id: 'n2_seal_panel',
    title: '劫印',
    text: '点击查看劫印面板',
    detail: '生效格内的劫印才加属性，同道途劫印可叠加',
    target: '.seal-panel-btn',
    type: 'highlight',
    once: true,
    order: 5,
  },
  n2_seal_active: {
    id: 'n2_seal_active',
    title: '生效格',
    text: '生效格内的劫印才加属性',
    detail: '点击劫印可切换生效/捺存',
    target: '.seal-active-slots',
    type: 'bubble',
    once: true,
    order: 6,
  },
  
  // ========== 第三难：江流漂孤（寿数+心魔教学）==========
  n3_life_hud: {
    id: 'n3_life_hud',
    title: '寿数',
    text: '西行耗寿，大限即坐化',
    detail: '每进节点耗寿，土地庙可回寿，55岁大限',
    target: '.life-hud',
    type: 'highlight',
    once: true,
    order: 7,
  },
  n3_demon_hud: {
    id: 'n3_demon_hud',
    title: '心魔',
    text: '恶道增心魔，满则心魔临门',
    detail: '心魔满100，下一战强制镜像战，胜后清零',
    target: '.demon-hud',
    type: 'highlight',
    once: true,
    order: 8,
  },
  
  // ========== 第四难：长安送行（装备+法宝+地图教学）==========
  n4_equip_slot: {
    id: 'n4_equip_slot',
    title: '装备槽位',
    text: '拖拽或点击，装备入槽',
    detail: '装备有槽位，同槽位只能穿一件',
    target: '.equip-slots',
    type: 'highlight',
    once: true,
    order: 9,
  },
  n4_treasure: {
    id: 'n4_treasure',
    title: '法宝',
    text: '法宝可在战斗中祭出',
    detail: '战斗中点击法宝图标祭出，有冷却',
    target: '.treasure-panel-btn',
    type: 'highlight',
    once: true,
    order: 10,
  },
  n4_map_node: {
    id: 'n4_map_node',
    title: '地图节点',
    text: '点击高亮节点，继续西行',
    detail: '不同节点，不同奖励（战斗/精英/事件/商店/休息）',
    target: '.map-node-highlight',
    type: 'highlight',
    once: true,
    order: 11,
  },
  
  // ========== Boss1：刘洪（气势教学）==========
  boss1_qi: {
    id: 'boss1_qi',
    title: '气势',
    text: '气势满时可爆发',
    detail: '攻击和受击都会积累气势，满后可释放爆发技',
    target: '.qi-bar',
    type: 'highlight',
    once: true,
    order: 12,
  },
  boss1_qi_blast: {
    id: 'boss1_qi_blast',
    title: '爆发',
    text: '点击爆发，释放强力一击',
    detail: '爆发技伤害极高，但消耗全部气势',
    target: '.qi-blast-btn',
    type: 'highlight',
    once: true,
    order: 13,
  },
};

// 获取教学状态（已完成的教学项）
NDX.getNewbieTeachFlags = function () {
  try {
    const flags = NDX.SaveSystem.loadObject(NDX.NEWBIE_TEACH.STORAGE_KEY, {});
    return flags || {};
  } catch (e) {
    return {};
  }
};

// 检查教学是否已完成
NDX.isNewbieTeachDone = function (teachId) {
  try {
    const flags = NDX.getNewbieTeachFlags();
    return !!flags[teachId];
  } catch (e) {
    return false;
  }
};

// 标记教学已完成
NDX.markNewbieTeachDone = function (teachId) {
  try {
    const flags = NDX.getNewbieTeachFlags();
    flags[teachId] = true;
    NDX.SaveSystem.saveObject(NDX.NEWBIE_TEACH.STORAGE_KEY, flags);
    return true;
  } catch (e) {
    return false;
  }
};

// 重置所有教学状态（用于测试或新周目）
NDX.resetNewbieTeach = function () {
  try {
    NDX.SaveSystem.remove(NDX.NEWBIE_TEACH.STORAGE_KEY);
    return true;
  } catch (e) {
    return false;
  }
};

// 获取下一个应该触发的教学（按order排序）
NDX.getNextNewbieTeach = function (context) {
  try {
    const flags = NDX.getNewbieTeachFlags();
    const teaches = Object.values(NDX.NEWBIE_TEACH).filter(t => t && t.id && t.order);
    teaches.sort((a, b) => a.order - b.order);
    for (const t of teaches) {
      if (!flags[t.id]) {
        // 检查触发条件（如果有trigger函数）
        if (typeof t.trigger === 'function') {
          if (t.trigger(context)) return t;
        } else {
          return t;
        }
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};
