// =============================================================
// data_trial_yuan.js — 缘道选项补足以至与渡道齐平（2026-09-14 P1 整改 #9）
// ---------------------------------------------------------------------------
// 问题（实测）：六道选项数 渡 80 / 逆 73 / 战 59 / 夺 35 / 隐 33 / **缘 32**。
//   缘道是六道里供给最薄的一支，50 个难根本没有「缘」可选项——
//   玩家想走缘道，一大半劫难里按不出对应选项，该流派长期内容饥渴。
//   另一面：缘道是六道中唯一「完全不靠杀伐」的流派（广结善缘·防御加身·肉身成圣），
//   在 50 个战斗/事件难里缺席，等于把最温和的一条路堵死，只剩打与抢。
//
// 方案：为 18 个主题契合的难各补 1 条缘选项（结缘 / 收留 / 认亲 / 记名 / 送别），
//   缘道 32 → 50，与渡道（80）仍有差距但不再是垫底断供。
//   数值取向统一：善 +6~10，收益以 气血 / 魔御 / 减伤 为主（对齐缘道"防御加身"定位），
//   不给攻击向收益，避免缘道变成"换皮的战道"。
//
// ⚠ 落地方式同 data_trial_dark.js：以覆盖表追加进 TRIAL_LIB[id].options，
//   不改写 trials81.js 源码（18 处 options 数组正则改写风险高）。
//   追加后该难选项数 +1（4 → 5），六道直选面板最多展示 6 条，布局不受影响。
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// 追加选项表：难号 → [ { key, label, fate, effect } ]
NDX.TRIAL_EXTRA_YUAN = {
  2: [{ key: '缘', label: '谢那接生稳婆一念之仁，记下这桩善缘', fate: '缘', effect: { alignGood: 8, ti: { hp: 80, mdef: 0.04 } } }],
  3: [{ key: '缘', label: '托孤于渔翁，替这孩子留一线血脉', fate: '缘', effect: { alignGood: 9, ti: { hp: 90, dr: 0.03 } } }],
  7: [{ key: '缘', label: '为岭上残魂各记一名，结一路同行之缘', fate: '缘', effect: { alignGood: 10, ti: { hp: 100, mdef: 0.05 } } }],
  15: [{ key: '缘', label: '先认他做师弟，再论降伏', fate: '缘', effect: { alignGood: 8, ti: { hp: 110, dr: 0.04 } } }],
  17: [{ key: '缘', label: '先渡他上岸，再收他入队', fate: '缘', effect: { alignGood: 10, ti: { hp: 120, mdef: 0.05 } } }],
  21: [{ key: '缘', label: '不念咒，先问一句他为何要打', fate: '缘', effect: { alignGood: 6, ti: { hp: 95, mdef: 0.04 } } }],
  23: [{ key: '缘', label: '成全这一段私奔，只求他日记得', fate: '缘', effect: { alignGood: 8, ti: { hp: 105, dr: 0.04 } } }],
  26: [{ key: '缘', label: '认下这门穷亲，替它正一个名分', fate: '缘', effect: { alignGood: 9, ti: { hp: 100, mdef: 0.05 } } }],
  27: [{ key: '缘', label: '先认他做侄儿，再谈收伏', fate: '缘', effect: { alignGood: 7, ti: { hp: 115, dr: 0.04 } } }],
  28: [{ key: '缘', label: '与虎力结个善缘，共求这一场雨', fate: '缘', effect: { alignGood: 6, ti: { hp: 90, mdef: 0.04 } } }],
  30: [{ key: '缘', label: '逐个记下僧名，许他们将来重聚', fate: '缘', effect: { alignGood: 10, ti: { hp: 110, mdef: 0.05 } } }],
  33: [{ key: '缘', label: '与庙祝共坐一夜，问清这河的旧事', fate: '缘', effect: { alignGood: 7, ti: { hp: 95, dr: 0.04 } } }],
  39: [{ key: '缘', label: '留一纸通关，结一段不必相负的缘', fate: '缘', effect: { alignGood: 9, ti: { hp: 105, mdef: 0.05 } } }],
  43: [{ key: '缘', label: '不问真假，先谢它听完这一路', fate: '缘', effect: { alignGood: 8, ti: { hp: 100, dr: 0.04 } } }],
  51: [{ key: '缘', label: '替老僧把这部经念完', fate: '缘', effect: { alignGood: 10, ti: { hp: 115, mdef: 0.05 } } }],
  55: [{ key: '缘', label: '与树精对饮一夜，续一段诗缘', fate: '缘', effect: { alignGood: 8, ti: { hp: 95, mdef: 0.04 } } }],
  62: [{ key: '缘', label: '陪郡侯守一夜米山，结一郡之缘', fate: '缘', effect: { alignGood: 9, ti: { hp: 100, dr: 0.04 } } }],
  71: [{ key: '缘', label: '送她一程月光，不问归期', fate: '缘', effect: { alignGood: 8, ti: { hp: 105, mdef: 0.05 } } }],
};

// 追加进 TRIAL_LIB（幂等：已存在同 key 的缘选项则跳过，避免重复注入）
NDX.injectExtraYuan = function () {
  const lib = NDX.TRIAL_LIB || {};
  let added = 0;
  Object.keys(NDX.TRIAL_EXTRA_YUAN || {}).forEach((id) => {
    const tr = lib[id];
    if (!tr) return;
    if (!Array.isArray(tr.options)) tr.options = [];
    (NDX.TRIAL_EXTRA_YUAN[id] || []).forEach((opt) => {
      const dup = tr.options.some((o) => o && (o.fate || o.key) === '缘' && o.__injectedYuan);
      if (dup) return;
      const o = Object.assign({ __injectedYuan: true }, opt);
      tr.options.push(o);
      added++;
    });
  });
  // 追加项同样要走道评注入（否则新选项没有观音道评 / 道派定位，又变成 2% 覆盖的缺口）
  if (NDX.injectDaoTips) NDX.injectDaoTips();
  return added;
};

if (NDX.TRIAL_LIB) NDX.injectExtraYuan();
