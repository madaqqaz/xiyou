// ============================================================================
//  劫印系统数据库（单局肉鸽构筑层 · 含篝火献祭取舍）
//  独立维护：本文件包含劫印与篝火仪典的数据表与逻辑函数。
//  劫印数据表：NDX.SEAL_DAOTU / NDX.SEAL_WORDS / NDX.SEAL_DAOTU_WORDS / NDX.HERO_MAIN_DAOTU
//  篝火仪典：NDX.BONFIRE_RITES（声明式：代价判定 + 增益，由 doRite 统一执行）
//  逻辑函数：NDX.offerSeals / NDX.addSeal / NDX.offerSealsAligned / NDX._mkSeal
//            NDX._sealMechanism / NDX.riteList / NDX.doRite / NDX.doRiteBlood
//            NDX.rollSealTier（来源→品质档位统一结算；红劫=三难融合专属）
//  命痕：已并入劫印（V8.26 → 模块三收口），FATE_* 数据表与 offerFates/addFate/命痕仪典
//        全量移除，机制改写职责由 SEAL_WORDS.mech / _sealMechanism 单一真源承接。
//  修改劫印名称、加成百分比、机制标记、道途归属，直接编辑下方对应数据表即可。
// ============================================================================

// 劫印系统（单局肉鸽构筑层 · V41 新增）
// 设计文档：开发文档/劫印开发.docx
// 来源：八十一难即八十一道封印——每破一难，天庭在取经人身上落下一道「劫印」。
//   劫印为单局临时战力构筑，离开本局（通关/阵亡/重开）即清空。
// 获取（V9.8 五档契约）：小怪概率白劫；精英必掉绿劫；Boss 二阶变身蓝劫、三段变身（打满三阶）红劫；金=三红合金。
// 生效：V3 §1.1 全量自动生效——劫印不入生效格、无需捺存/换上，全部持有即累计。
//   品质白/绿/蓝/红/金（V9.8 五档）：白/绿/蓝/红由来源直给，金=顶阶仅由三红合金合成；
//   计层 白/绿=1、蓝=2、红=3、金=4（金劫顶阶，计层最高）。
// 六大道途（劫印·六道属性 · 2026-09-01 调整，与选项六道对齐）。
// 注意（2026-09-12 收口）：六道抉择本身「不给任何属性」——属性体系全部由本表劫印承担；
//   六道只作「四池概率偏置」的源头（见 NDX.daoPoolWeights）。
//   战(物攻) / 渡(气血) / 缘(双防) / 夺(反伤) / 隐(闪避) / 逆(反伤为主·全属性小幅增益)
// 道途层数：按道累计持有印层数，3/6/9/12 触发阶段加成（SEAL_DAO_BREAKPOINTS）。
// 词条以百分比加成形式并入 computeStats（见 combat.js）。
// ============================================================

// 六大道途定义
NDX.SEAL_DAOTU = {
  战: { key: '战', name: '战道·杀伐', stat: 'atk', desc: '物理体系，主堆物攻' },
  渡: { key: '渡', name: '渡道·禅光', stat: 'maxhp', desc: '气血体系，渡世养身，主堆气血上限' },
  缘: { key: '缘', name: '缘道·金身', stat: 'dr+mdef', desc: '双防体系，主堆减伤与法防' },
  夺: { key: '夺', name: '夺道·吞纳', stat: 'reflect', desc: '反噬体系，主堆反伤' },
  隐: { key: '隐', name: '隐道·匿踪', stat: 'eva', desc: '身法体系，主堆闪避' },
  逆: { key: '逆', name: '逆道·戾骨', stat: 'reflect', desc: '逆修体系，反伤为主，全属性小幅增益' },
};

// 劫印词条字典（白/绿/金 基档百分比；蓝=绿×1.62、红=金基×1.55 由 sealTierVal 派生）
//   stat: 影响的属性； tiers: {white, blue, gold} 百分比加成
//   unique: 唯一（如吸血（渡厄））
//   hero: 该词条偏好的英雄体系（用于联动提示与默认道途加权，非硬限制）
//   link: 与装备/法宝红色神器的联动标记（四层联动见文档）
// 劫印词条字典（五档：白/绿/蓝/红/金）
//   stat: 影响的属性； tiers: {white, blue, gold, red} 百分比加成
//   unique: 唯一（如吸血（渡厄））
//   hero: 该词条偏好的英雄体系（用于联动提示与默认道途加权，非硬限制）
//   link: 与装备/法宝红色神器的联动标记（四层联动见文档）
//   —— V8.26 命痕并入：原命痕（FATE_WORDS）的 18 个「战斗机制」按道途并入劫印词条，
//        由蓝/金档承载（mechTier），combat.js 聚合 bonus.seals.mechanism 进 fateFlags，
//        与旧结算路径完全兼容，实现「机制改写层 → 劫印专属」的职责归并。——
NDX.SEAL_WORDS = {
  杀伐: { name: '杀伐', dao: '战', stat: 'atk', tiers: { white: 0.12, green: 0.20, gold: 0.34 }, desc: '物攻提升。', hero: 'wukong' },
  碎击: { name: '碎击', dao: '战', stat: 'atk', tiers: { white: 0.10, green: 0.16, gold: 0.28 }, crit: 0.06, desc: '物攻提升，并(+6%暴击)。', hero: 'wukong' },
  禅光: { name: '禅光', dao: '渡', stat: 'maxhp', tiers: { white: 0.12, green: 0.20, gold: 0.34 }, desc: '气血提升。', hero: 'tangseng' },
  渡厄: { name: '渡厄', dao: '渡', stat: 'maxhp', tiers: { white: 0.08, green: 0.14, gold: 0.22 }, unique: true, lifesteal: 0.06, desc: '气血提升，唯一附带吸血（金≈6%）。', hero: 'tangseng' },
  守心: { name: '守心', dao: '缘', stat: 'dr', tiers: { white: 0.05, green: 0.09, gold: 0.15 }, desc: '减伤提升。', hero: 'bajie' },
  固甲: { name: '固甲', dao: '缘', stat: 'mdef', tiers: { white: 0.06, green: 0.10, gold: 0.16 }, desc: '法防提升。', hero: 'bajie' },
  吞纳: { name: '吞纳', dao: '夺', stat: 'reflect', tiers: { white: 0.10, green: 0.16, gold: 0.26 }, desc: '反伤提升。', hero: 'shaseng' },
  噬血: { name: '噬血', dao: '夺', stat: 'reflect', tiers: { white: 0.08, green: 0.13, gold: 0.20 }, lifesteal: 0.04, desc: '反伤提升，附带少量吸血（金≈4%）。', hero: 'shaseng' },
  匿踪: { name: '匿踪', dao: '隐', stat: 'eva', tiers: { white: 0.05, green: 0.09, gold: 0.15 }, desc: '闪避提升。', hero: 'xiaobailong' },
  残影: { name: '残影', dao: '隐', stat: 'eva', tiers: { white: 0.04, green: 0.07, gold: 0.12 }, evaOnDodge: true, desc: '闪避提升，闪避后下一击必中（残影）。', hero: 'xiaobailong' },
  戾骨: { name: '戾骨', dao: '逆', stat: 'reflect', tiers: { white: 0.08, green: 0.13, gold: 0.20 }, desc: '反伤提升（反弹所受伤害）。', hero: 'all' },
  // 通用/英雄专属第二套（同道途差异化）—— 机制改写并入（V8.26）
  裂魂: { name: '裂魂', dao: '战', stat: 'atk', tiers: { white: 0.09, green: 0.15, gold: 0.25 }, desc: '物攻提升（裂魂·专破护体）。', hero: 'wukong', mech: 'critAtkStack', mechVal: 3, mechTier: 'green', mechDesc: '机制·每次暴击永久 +3 物攻（越打越狠）。' },
  齐天: { name: '齐天', dao: '战', stat: 'atk', tiers: { white: 0.10, green: 0.18, gold: 0.30 }, desc: '物攻提升（大圣本色·齐天）。', hero: 'wukong', mech: 'critBreakShield', mechVal: 0.15, mechTier: 'gold', mechDesc: '机制·暴击必破护盾，并使该敌减防 15%。' },
  逐杀: { name: '逐杀', dao: '战', stat: 'atk', tiers: { green: 0.16, gold: 0.28 }, desc: '物攻提升（逐杀·斩将夺机）。', hero: 'wukong', mech: 'killRefreshTreasure', mechVal: 1, mechTier: 'gold', mechDesc: '机制·每击杀一个单位，下场战斗首个操作点法宝免充能。' },
  禅息: { name: '禅息', dao: '渡', stat: 'maxhp', tiers: { white: 0.10, green: 0.17, gold: 0.28 }, desc: '气血提升（禅息·以禅养盾）。', hero: 'tangseng', mech: 'spellLifestealToShield', mechVal: 0.5, mechTier: 'green', mechDesc: '机制·法术吸血有 50% 转为护盾而非回血。' },
  渡生: { name: '渡生', dao: '渡', stat: 'maxhp', tiers: { white: 0.09, green: 0.15, gold: 0.25 }, desc: '气血提升（渡生·渡人渡己）。', hero: 'tangseng', mech: 'shieldLifesteal', mechVal: 0.06, mechTier: 'gold', mechDesc: '机制·自身有护盾时，普攻附带 6% 吸血。' },
  金蝉: { name: '金蝉', dao: '渡', stat: 'maxhp', tiers: { green: 0.15, gold: 0.25 }, desc: '气血提升（金蝉·十世余泽）。', hero: 'tangseng', mech: 'reviveOnce', mechVal: 2, mechTier: 'gold', mechDesc: '机制·首次阵亡复活，并以 2 倍法伤反噬击杀者。' },
  坚甲: { name: '坚甲', dao: '缘', stat: 'dr', tiers: { white: 0.05, green: 0.09, gold: 0.15 }, desc: '减伤提升（坚甲·以守代攻）。', hero: 'shaseng', mech: 'shieldBreakSlow', mechVal: 0.15, mechTier: 'green', mechDesc: '机制·护盾被击碎时，攻击者减速 15%。' },
  厚土: { name: '厚土', dao: '缘', stat: 'dr', tiers: { white: 0.05, green: 0.10, gold: 0.16 }, maxhp: 0.05, desc: '减伤提升，并(+5%气血上限)（厚土载物）。', hero: 'shaseng', mech: 'regenShieldEachTurn', mechVal: 0.08, mechTier: 'gold', mechDesc: '机制·每回合开始恢复 8% 最大气血的护盾。' },
  万象: { name: '万象', dao: '缘', stat: 'dr', tiers: { green: 0.10, gold: 0.17 }, desc: '减伤提升（万象·森罗）。', hero: 'shaseng', mech: 'shieldImmuneCtrl', mechVal: 1, mechTier: 'gold', mechDesc: '机制·自身有护盾时免疫一切控制。' },
  戾伤: { name: '戾伤', dao: '夺', stat: 'reflect', tiers: { white: 0.10, green: 0.17, gold: 0.28 }, desc: '反伤提升（戾伤·以血养兵）。', hero: 'bajie', mech: 'hpLossBoostTreasure', mechVal: 0.5, mechTier: 'green', mechDesc: '机制·每损失 10% 气血，祭出法宝伤害 +5%。' },
  残魂: { name: '残魂', dao: '夺', stat: 'reflect', tiers: { white: 0.08, green: 0.14, gold: 0.23 }, desc: '反伤提升（残魂·反噬）。', hero: 'bajie', mech: 'shieldBreakReflect', mechVal: 0.5, mechTier: 'gold', mechDesc: '机制·护盾被击碎时，对全场敌人反弹 50% 该护盾值的伤害。' },
  焚天: { name: '焚天', dao: '夺', stat: 'reflect', tiers: { green: 0.15, gold: 0.26 }, desc: '反伤提升（焚天·死战）。', hero: 'bajie', mech: 'lowHpTreasureCdHalf', mechVal: 1, mechTier: 'gold', mechDesc: '机制·气血低于 30% 时，所有法宝冷却减半。' },
  轻影: { name: '轻影', dao: '隐', stat: 'eva', tiers: { white: 0.05, green: 0.09, gold: 0.15 }, desc: '闪避提升（轻影·掠影）。', hero: 'xiaobailong', mech: 'evaSpeedUp', mechVal: 1, mechTier: 'green', mechDesc: '机制·闪避后下次攻击必定抢先出手。' },
  逐风: { name: '逐风', dao: '隐', stat: 'eva', tiers: { white: 0.04, green: 0.08, gold: 0.13 }, desc: '闪避提升（逐风·而行）。', hero: 'xiaobailong', mech: 'doubleEvaResetCd', mechVal: 1, mechTier: 'gold', mechDesc: '机制·单场连续两次闪避，重置一件法宝冷却。' },
  逆鳞: { name: '逆鳞', dao: '隐', stat: 'eva', tiers: { green: 0.08, gold: 0.14 }, desc: '闪避提升（逆鳞·护身）。', hero: 'xiaobailong', mech: 'evaImmuneBurn', mechVal: 1, mechTier: 'gold', mechDesc: '机制·闪避成功时免疫灼烧。' },
  蚀骨: { name: '蚀骨', dao: '逆', stat: 'reflect', tiers: { white: 0.07, green: 0.12, gold: 0.20 }, desc: '反伤提升（蚀骨·怨骨蚀心）。', hero: 'all', mech: 'hurtStackReflect', mechVal: 0.02, mechTier: 'green', mechDesc: '机制·每次受伤叠加 2% 反伤。' },
  万劫: { name: '万劫', dao: '逆', stat: 'reflect', tiers: { white: 0.06, green: 0.11, gold: 0.18 }, desc: '反伤提升（万劫·加身）。', hero: 'all', mech: 'lowHpReflectMult', mechVal: 2, mechTier: 'gold', mechDesc: '机制·气血低于 35% 时，反伤触发 2 段。' },
  流沙: { name: '流沙', dao: '逆', stat: 'reflect', tiers: { green: 0.12, gold: 0.20 }, desc: '反伤提升（流沙·吞魂）。', hero: 'all', mech: 'reflectMagic', mechVal: 1, mechTier: 'gold', mechDesc: '机制·反伤附带等量法术伤害。' },
  // —— V8.28 流派扩充：每道途 +1 差异化劫印，增强 build 组合多样性 ——
  破军: { name: '破军', dao: '战', stat: 'atk', tiers: { white: 0.10, green: 0.17, gold: 0.28 }, crit: 0.08, desc: '物攻提升，并(+8%暴击)（破军·开局爆发）。', hero: 'wukong' },
  大悲: { name: '大悲', dao: '渡', stat: 'maxhp', tiers: { white: 0.09, green: 0.15, gold: 0.24 }, lifesteal: 0.04, desc: '气血提升，附带吸血（金≈4%）（大悲·渡己渡人）。', hero: 'tangseng' },
  金刚: { name: '金刚', dao: '缘', stat: 'dr', tiers: { white: 0.05, green: 0.09, gold: 0.15 }, maxhp: 0.08, desc: '减伤提升，并(+8%气血上限)（金刚·不坏）。', hero: 'shaseng' },
  饕餮: { name: '饕餮', dao: '夺', stat: 'reflect', tiers: { white: 0.09, green: 0.15, gold: 0.24 }, lifesteal: 0.06, desc: '反伤提升，附带吸血（金≈6%）（饕餮·贪噬）。', hero: 'bajie' },
  风行: { name: '风行', dao: '隐', stat: 'eva', tiers: { white: 0.04, green: 0.07, gold: 0.12 }, crit: 0.05, desc: '闪避提升，并(+5%暴击)（风行·掠影）。', hero: 'xiaobailong' },
  修罗: { name: '修罗', dao: '逆', stat: 'reflect', tiers: { white: 0.07, green: 0.12, gold: 0.20 }, maxhp: 0.06, desc: '反伤提升，并(+6%气血上限)（修罗·血战）。', hero: 'all' },
  // —— V8.37 流派深度扩充：每道途 +2 差异化劫印，强化 build 组合多样性（纯属性，无需改 combat 内核）——
  // 战道
  浴血: { name: '浴血', dao: '战', stat: 'atk', tiers: { white: 0.11, green: 0.18, gold: 0.30 }, crit: 0.10, desc: '物攻提升，并(+10%暴击)（浴血·死战不退）。', hero: 'wukong' },
  连斩: { name: '连斩', dao: '战', stat: 'atk', tiers: { white: 0.10, green: 0.17, gold: 0.28 }, lifesteal: 0.05, desc: '物攻提升，附带吸血（金≈5%）（连斩·斩将夺旗）。', hero: 'wukong' },
  // 渡道
  焚经: { name: '焚经', dao: '渡', stat: 'maxhp', tiers: { white: 0.10, green: 0.17, gold: 0.28 }, lifesteal: 0.05, desc: '气血提升，附带吸血（金≈5%）（焚经·以血饲法）。', hero: 'tangseng' },
  禅定: { name: '禅定', dao: '渡', stat: 'maxhp', tiers: { white: 0.11, green: 0.18, gold: 0.30 }, crit: 0.08, desc: '气血提升，并(+8%暴击)（禅定·寂然生慧）。', hero: 'tangseng' },
  // 缘道
  磐石: { name: '磐石', dao: '缘', stat: 'dr', tiers: { white: 0.06, green: 0.10, gold: 0.17 }, maxhp: 0.10, desc: '减伤提升，并(+10%气血上限)（磐石·稳如泰山）。', hero: 'shaseng' },
  铁壁: { name: '铁壁', dao: '缘', stat: 'dr', tiers: { white: 0.05, green: 0.09, gold: 0.16 }, mdef: 0.08, desc: '减伤提升，并(+8%法防)（铁壁·水火不侵）。', hero: 'shaseng' },
  // 夺道
  血怒: { name: '血怒', dao: '夺', stat: 'reflect', tiers: { white: 0.10, green: 0.17, gold: 0.28 }, atk: 0.06, desc: '反伤提升，并(+6%物攻)（血怒·以血养兵）。', hero: 'bajie' },
  回春: { name: '回春', dao: '夺', stat: 'reflect', tiers: { white: 0.09, green: 0.15, gold: 0.24 }, lifesteal: 0.08, desc: '反伤提升，附带吸血（金≈8%）（回春·生生不息）。', hero: 'bajie' },
  // 隐道
  影袭: { name: '影袭', dao: '隐', stat: 'eva', tiers: { white: 0.05, green: 0.09, gold: 0.15 }, atk: 0.06, desc: '闪避提升，并(+6%物攻)（影袭·来去无踪）。', hero: 'xiaobailong' },
  致命: { name: '致命', dao: '隐', stat: 'eva', tiers: { white: 0.04, green: 0.08, gold: 0.13 }, crit: 0.12, desc: '闪避提升，并(+12%暴击)（致命·一击必杀）。', hero: 'xiaobailong' },
  // 逆道
  咒怨: { name: '咒怨', dao: '逆', stat: 'reflect', tiers: { white: 0.08, green: 0.13, gold: 0.22 }, matk: 0.06, desc: '反伤提升，并(+6%法伤)（咒怨·怨魂缠身）。', hero: 'all' },
  不灭: { name: '不灭', dao: '逆', stat: 'reflect', tiers: { white: 0.07, green: 0.12, gold: 0.20 }, lifesteal: 0.06, desc: '反伤提升，附带吸血（金≈6%）（不灭·浴火重生）。', hero: 'all' },
  轮回: { name: '轮回', dao: '逆', stat: 'reflect', tiers: { white: 0.08, green: 0.13, gold: 0.22 }, maxhp: 0.08, desc: '反伤提升，并(+8%气血上限)（轮回·六道轮回）。', hero: 'all', mech: 'reflectStackClear', mechVal: 1, mechTier: 'gold', mechDesc: '机制·反伤触发时清除自身 1 个负面状态。' },
};

// ============================================================
//  劫印图标映射（V8.37）：专属立绘图标，东方写意焦墨水墨风格
//  路径：img/seals/，未映射的劫印使用道途通用图标
// ============================================================
NDX.SEAL_ICONS = {
  // 战道
  '杀伐': 'img/seals/seal_zhan_shafa.webp',
  '碎击': 'img/seals/seal_zhan_suiji.webp',
  '裂魂': 'img/seals/seal_zhan_liehun.webp',
  '齐天': 'img/seals/seal_zhan_qitian.webp',
  '逐杀': 'img/seals/seal_zhan_zhusha.webp',
  '浴血': 'img/seals/seal_zhan_yuxue.webp',
  '连斩': 'img/seals/seal_zhan_lianzhan.webp',
  '破军': 'img/seals/seal_zhan_pojun.webp',
  // 渡道
  '禅光': 'img/seals/seal_du_changuang.webp',
  '渡厄': 'img/seals/seal_du_du_e.webp',
  '禅息': 'img/seals/seal_du_chanxi.webp',
  '渡生': 'img/seals/seal_du_dusheng.webp',
  '金蝉': 'img/seals/seal_du_jinchan.webp',
  '焚经': 'img/seals/seal_du_fenjing.webp',
  '禅定': 'img/seals/seal_du_chanding.webp',
  '大悲': 'img/seals/seal_du_dabei.webp',
  // 缘道
  '守心': 'img/seals/seal_yuan_shouxin.webp',
  '固甲': 'img/seals/seal_yuan_gujia.webp',
  '坚甲': 'img/seals/seal_yuan_jianjia.webp',
  '厚土': 'img/seals/seal_yuan_houtu.webp',
  '万象': 'img/seals/seal_yuan_wanxiang.webp',
  '磐石': 'img/seals/seal_yuan_panshi.webp',
  '铁壁': 'img/seals/seal_yuan_tiebi.webp',
  '金刚': 'img/seals/seal_yuan_jingang.webp',
  // 夺道
  '吞纳': 'img/seals/seal_duo_tunna.webp',
  '噬血': 'img/seals/seal_duo_shixue.webp',
  '戾伤': 'img/seals/seal_duo_lishang.webp',
  '残魂': 'img/seals/seal_duo_canhun.webp',
  '焚天': 'img/seals/seal_duo_fentian.webp',
  '血怒': 'img/seals/seal_duo_xuenu.webp',
  '回春': 'img/seals/seal_duo_huichun.webp',
  '饕餮': 'img/seals/seal_duo_taotie.webp',
  // 隐道
  '匿踪': 'img/seals/seal_yin_nizong.webp',
  '残影': 'img/seals/seal_yin_canying.webp',
  '轻影': 'img/seals/seal_yin_qingying.webp',
  '逐风': 'img/seals/seal_yin_zhufeng.webp',
  '逆鳞': 'img/seals/seal_yin_nilin.webp',
  '影袭': 'img/seals/seal_yin_yingxi.webp',
  '致命': 'img/seals/seal_yin_zhiming.webp',
  '风行': 'img/seals/seal_yin_fengxing.webp',
  // 逆道
  '戾骨': 'img/seals/seal_ni_ligu.webp',
  '蚀骨': 'img/seals/seal_ni_shigu.webp',
  '万劫': 'img/seals/seal_ni_wanjie.webp',
  '流沙': 'img/seals/seal_ni_liusha.webp',
  '修罗': 'img/seals/seal_ni_xiuluo.webp',
  '咒怨': 'img/seals/seal_ni_zhouyuan.webp',
  '不灭': 'img/seals/seal_ni_bumie.webp',
};
// 道途通用图标（未映射专属图标的劫印使用）
NDX.SEAL_DAO_ICONS = {
  '战': 'img/seals/seal_zhan_shafa.webp',
  '渡': 'img/seals/seal_du_changuang.webp',
  '缘': 'img/seals/seal_yuan_shouxin.webp',
  '夺': 'img/seals/seal_duo_tunna.webp',
  '隐': 'img/seals/seal_yin_nizong.webp',
  '逆': 'img/seals/seal_ni_ligu.webp',
};
// 获取劫印图标路径（优先专属图标，其次道途通用图标）
NDX.getSealIcon = function (sealName, dao) {
  if (sealName && NDX.SEAL_ICONS[sealName]) return NDX.SEAL_ICONS[sealName];
  if (dao && NDX.SEAL_DAO_ICONS[dao]) return NDX.SEAL_DAO_ICONS[dao];
  return '';
};

// 道途 -> 该道所有词条名（用于三选一生成时按道途与英雄身份加权）
NDX.SEAL_DAOTU_WORDS = (function () {
  const m = { 战: [], 渡: [], 缘: [], 夺: [], 隐: [], 逆: [] };
  Object.keys(NDX.SEAL_WORDS).forEach((k) => { m[NDX.SEAL_WORDS[k].dao].push(k); });
  return m;
})();

// 英雄主体系（决定劫印池默认偏好道途，使「该英雄拿到最需要的劫印」更顺）
NDX.HERO_MAIN_DAOTU = {
  wukong: '战', tangseng: '渡', shaseng: '缘', bajie: '夺', xiaobailong: '隐',
};

// ============================================================
// V9.6 劫印来源真源：来源 → 品质档位 / 阵营 / 契合度
//   背景：V9.x 曾有独立模块 js/data_seal_source.js（NDX.SealSource），设想「随机 roll 来源
//   + 按来源概率抽品质」。该前提与项目真实结构冲突（来源由**节点类型**决定、品质由**公式直给**、
//   品质仅 white/blue/gold 三级无 red、道途键为中文而非英文），故该模块从未接线、全仓零调用。
//   V9.6 处置：删除该模块，把其中唯一有效的信息（来源→品质档位）收敛为下方单一真源，
//   并把原先散落在 5 个文件 6 处调用点上的 tier / 阵营硬编码判定统一到此（逐位等价，无回归）。
//   数值口径 [已调优]（2026-09-14）：来源→品质档位契约已被门禁 _verify_seal_source B/B2/B3 逐位等价写死
//     （精英必绿/Boss 二阶蓝/三阶红/融合≥3 红），不得改动。复核契约与用户拍板的 V9.8 五档一致，确认保持。
// ============================================================
NDX.SEAL_SOURCE_TIER = {
  // V9.8 五档掉落契约（用户拍板）：
  //   小怪概率白 / 精英必掉绿 / Boss 二阶变身必掉蓝 / 三段变身（打满三阶）必掉红 / 金=三红合金
  // 普通劫难（非 Boss）：白为底，按章提升绿率；
  //   Boss：bossPhase>=3（三段变身 Boss 打满三阶）→ 红；其余（两段/单相）→ 蓝。
  trial:  { name: '战斗破劫', align: 'evil',  bossTier: 'blue', bossTierMax: 'red' },
  mob:    { name: '小妖伏诛', align: 'evil',  fixedTier: 'white' }, // 小怪：白劫（概率出，见 SEAL_MOB_CHANCE）
  elite:  { name: '精英伏诛', align: null,    fixedTier: 'green' }, // 精英：绿劫（机制改写层）+ 逆道经文碎片
  // 融合节点：子难数 1/2/3 → 白/绿/红；**三难全战**（子难 3）保底出红劫（红劫唯一产出源之一，
  //   与三段变身 Boss 并列）。金劫不再由任何来源直给——须于土地庙以「三红合金」三枚红劫熔铸一枚金劫。
  //   层级口径 white<green<blue<red<gold（金劫为顶阶，须玩家主动合成）。数值口径 [已调优]（2026-09-14）：融合三难保底红为红劫双源之一，
  //     门禁 _verify_seal_source B2 / _verify_seal_alloy 锁死「金劫任何来源不直给、仅三红合金」，确认保持。
  fusion: { name: '劫难融合', align: null,    byFusion: true },
  good:   { name: '兵不血刃', align: 'good',  fixedTier: 'white' }, // 非战斗劫难：白劫 + 善道阵营
  xinmo:  { name: '心魔劫',   align: null,    fixedTier: 'green' }, // 心魔隐藏劫：绿劫，候选再筛「逆」
};
// 小怪掉白概率（V9.8）：刷怪的劫印回报，刻意低于精英/ Boss，使「多刷怪」有边际但非最优 [已调优]（2026-09-14）：
//   门禁仅要求 SEAL_MOB_CHANCE∈(0,1)（B3）；复核 0.35 使刷怪有零碎白印进项、又远低于精英必掉绿，梯度成立，确认保持。
NDX.SEAL_MOB_CHANCE = 0.35;
// 阵营 → 道途池（与 offerSealsAligned 内的池定义同源，杜绝两处漂移）
NDX.SEAL_SOURCE_ALIGN = { evil: ['战', '夺', '逆'], good: ['渡', '隐', '缘'] };

// 统一品质档位结算：把散落的 tier 判定收敛到一处。
//   source：NDX.SEAL_SOURCE_TIER 的键；s：state；opt：{ isBoss, fusionN }
//   注意：本函数内 Math.random() 的调用**顺序与次数**须与迁移前逐位一致——
//        Boss / 固定档位 / 融合 三条路径均**不掷骰**（品质由来源/子难数直接决定）；
//        仅「白为底」路径（trial 非 Boss）先掷「按章蓝率」，仍为白且逆道抉择>0 时再掷「逆道进阶」。
//        fusion（融合）路径：子难 1/2/3 → 白/绿/红，红劫保底（不再掷升华骰）。
//        金劫（gold）不由任何来源直给，仅由 NDX.combineRedSeals 三红合金产出。
NDX.rollSealTier = function (source, s, opt) {
  const O = opt || {};
  const cfg = NDX.SEAL_SOURCE_TIER[source];
  if (!cfg) return 'white';
  if (cfg.byFusion) {
    const n = O.fusionN || 0;
    if (n < 2) return 'white';
    if (n < 3) return 'green';
    return 'red';   // 三难全战融合 → 保底红劫（红劫=融合/三段变身Boss 双源）
  }
  if (cfg.fixedTier) return cfg.fixedTier;
  if (O.isBoss) {
    // V9.8：Boss 按变身阶段给档——打满三阶（三段变身 Boss）出红，两段/单相出蓝
    return (O.bossPhase || 0) >= 3 ? (cfg.bossTierMax || 'red') : (cfg.bossTier || 'blue');
  }
  let tier = 'white';
  const bP = Math.min(0.5, 0.04 + 0.02 * ((s ? s.act : 1) - 1));   // 按章提升绿率（0.04 + 0.02×章）
  if (Math.random() < bP) tier = 'green';
  if (tier === 'white' && s && s.flags && (s.flags.sealUp || 0) > 0
      && Math.random() < Math.min(0.6, 0.2 * s.flags.sealUp)) tier = 'green';  // 逆道抉择→进阶（每次 +20%，上限 60%）
  return tier;
};
// Boss 变身阶段数（唯一真源）：三段变身 Boss（phases 3 段 / BOSS_FORMS 三段）→ 3；
//   两段变身（默认 stages 两相 / phaseOverrides 2 段）→ 2；其余 → 1。
//   打赢即视为打满所拥有的全部阶段，故「阶段数」= 掉落档位依据。
NDX.bossPhaseOf = function (monster) {
  if (!monster) return 1;
  const arr = monster.phases || monster.phaseOverrides || monster.phaseStats;
  if (Array.isArray(arr) && arr.length >= 3) return 3;
  if (monster.stages && Array.isArray(monster.stages) && monster.stages.length >= 2) return 2;
  if (Array.isArray(arr) && arr.length === 2) return 2;
  return 1;
};

// 主道契合度：把「候选劫印道途 vs 玩家主道」的关系显式化，供 UI 提示。
//   原 data_seal_source 的 calculateDaoAlignment 用英文道途键（du/zhan/yin…），与中文六道不符、
//   从未生效；此处按真实六道重写，相关道关系沿用原设计的「战↔夺↔逆」「渡↔缘↔隐」三三成组。
NDX.SEAL_DAO_RELATED = {
  战: ['夺', '逆'], 夺: ['战', '逆'], 逆: ['战', '夺'],
  渡: ['缘', '隐'], 缘: ['渡', '隐'], 隐: ['渡', '缘'],
};
NDX.sealDaoAlignment = function (dao, mainDao) {
  if (!dao) return 0.2;
  if (!mainDao) return 0.3;
  if (dao === mainDao) return 1.0;
  return (NDX.SEAL_DAO_RELATED[mainDao] || []).indexOf(dao) >= 0 ? 0.6 : 0.2;
};
// 契合度 → 展示标签（档位口径与原 alignmentText 一致：≥0.8 主道契合 / ≥0.5 相关道 / 其余跨界）
NDX.sealAlignmentLabel = function (dao, mainDao) {
  const a = NDX.sealDaoAlignment(dao, mainDao);
  return {
    alignment: a,
    tier: a >= 0.8 ? 'main' : (a >= 0.5 ? 'related' : 'off'),
    text: a >= 0.8 ? '主道契合' : (a >= 0.5 ? '相关道' : '跨界'),
  };
};


// 依据敌人类型生成劫印 3 选 1
//   heroId：当前英雄； tier：'white'|'blue'|'gold'（小怪/精英/Boss）
//   s：state（用于层数上限校验）
//   返回 [{id, name, dao, tier, stat, val, desc, unique, ...}] 长度 3
// V8.37 劫印「善道档位保底」（非随机保底）
// 核查结论：offerSeals / offerFates 的候选池恒以主道途为首项（pool = [main]），
// 主道途印必然出现，「连抽不中主道途」的前提不成立，故不做随机 pity（否则是死代码）。
//
// 真实缺口是「档位不对称」，而非随机性：
//   · 战斗节点（MAP_PLAN 中 7/9）走 offerSealsAligned(..., 'evil') → 战/夺/逆，可出 blue/gold
//   · 善系英雄（tangseng 渡 / shaseng 缘 / xiaobailong 隐，占 3/5）主道途属善道，
//     在战斗节点永远吃不到主道途印，只能靠非战斗劫难（game.js 固定 white 最低档）与融合节点
//   → 善系英雄的主道途成长被压在最低档，恶系英雄（wukong 战 / bajie 夺）则能在战斗中拿高品阶主道途印。
//
// 对策：累计 SEAL_STARVE_THRESHOLD 次「未获得主道途印」后，下一次善道印由 white 提档至 blue。
// 只提品阶、不改道途归属，因此不破坏「非战斗只出善印、战斗只出恶印」的既有设计语义。
NDX.SEAL_STARVE_THRESHOLD = 3;
// 依据 state 与本次候选池，结算主道途「饥渴计数」，返回本次应使用的品阶
NDX._resolveSealTier = function (heroId, tier, s, daos) {
  if (!s) return tier;
  // V9.6 口径统一：主道判定与 offerSeals 同源（动态主道 → 英雄本命道回落）
  const main = (NDX.DaoSystem && NDX.DaoSystem.getMainDao)
    ? (NDX.DaoSystem.getMainDao(s) || NDX.HERO_MAIN_DAOTU[heroId] || '战')
    : (NDX.HERO_MAIN_DAOTU[heroId] || '战');
  const mainReachable = daos.indexOf(main) >= 0;
  if (!mainReachable) {
    // 本次拿不到主道途印（如善系英雄打战斗节点）→ 累计饥渴
    s.sealMainStarve = (s.sealMainStarve || 0) + 1;
    return tier;
  }
  // 本次可出主道途印：若饥渴已达标且当前是最低档，则提一档并清零
  if ((s.sealMainStarve || 0) >= NDX.SEAL_STARVE_THRESHOLD && tier === 'white') {
    s.sealMainStarve = 0;
    return 'blue';
  }
  return tier;
};

NDX.offerSeals = function (heroId, tier, s) {
  // V9.6 口径统一（GDD §2.2 劫印池）：首槽主道读「当前动态主道」单一真源 getMainDao
  //   （锚点 / 劫印累积 / 英雄六道归属三段回落），与装备 / 法宝池完全同口径；
  //   无 state 时回落英雄本命道。转道后首槽随新主道，不再被英雄固有道锁死
  //   （synergy-in-reach「主道劫印恒在候选池」保证不变，因 dynamic main 即主道）。
  const main = (s && NDX.DaoSystem && NDX.DaoSystem.getMainDao)
    ? (NDX.DaoSystem.getMainDao(s) || NDX.HERO_MAIN_DAOTU[heroId] || '战')
    : (NDX.HERO_MAIN_DAOTU[heroId] || '战');
  // 候选道途：本英雄主体系 +（通关后解锁）通用逆 + 随机两道（保证多样）
  // 逆道全锁（反转 V8.16）：逆系劫印通关任意英雄一次（niDaoUnlocked）后方进入候选池
  // 【2026-09-14】首周目逆命数 ≥ NIDAO_FIRST_CYCLE_GATE 亦开缝（见 data_negotiate.niDaoUnlocked）
  const pool = [main];
  if (NDX.niDaoUnlocked(s)) pool.push('逆');
  const others = ['战', '渡', '缘', '夺', '隐'].filter((d) => d !== main && d !== '逆');
  // V3 §1.5 轻度道途倾向：其余槽位按「已投道途层数」加权概率抽取（已投越多越易刷出对应劫印，非锁死）；主道途首项恒在作全局兜底
  while (pool.length < 3 && others.length) {
    // V9.6 六道主干：候选道权重 = 「已投层数」× 「六道数量（软饱和）」，共同决定非主道劫印出现概率
    const weights = others.map((d) => (1 + (NDX.sealDaoLayerSum ? NDX.sealDaoLayerSum(s, d) : 0) * 0.6)
      * (NDX.daoPoolMult ? NDX.daoPoolMult(s, d) : 1));
    // P1 Seed 播种：候选道途加权抽取走整局播种流（runWeightedPick），同种子候选流可复现
    let idx = (NDX.runWeightedPick) ? NDX.runWeightedPick(weights) : (() => {
      const wsum = weights.reduce((a, b) => a + b, 0);
      let roll = Math.random() * wsum, j = 0;
      for (let i = 0; i < weights.length; i++) { roll -= weights[i]; if (roll <= 0) { j = i; break; } }
      return j;
    })();
    if (idx < 0 || idx >= others.length) idx = 0;
    pool.push(others[idx]);
    others.splice(idx, 1);
  }
  // 善道档位保底：主道途恒在池内，故此只可能「提档」，不会改道途归属
  tier = NDX._resolveSealTier(heroId, tier, s, pool);
  // 已拥有劫印（用于唯一校验）
  const owned = s.seals || [];
  const ownedNames = new Set(owned.map((x) => x.name));

  const out = [];
  const usedNames = new Set();
  for (const dao of pool) {
    // 该道途候选词条
    let words = NDX.SEAL_DAOTU_WORDS[dao].slice();
    // 过滤：唯一劫印若已拥有则跳过；本轮已选过同名跳过；该档无数值的词条跳过
    words = words.filter((w) => {
      const wd = NDX.SEAL_WORDS[w];
      if (wd.unique && ownedNames.has(w)) return false;
      if (usedNames.has(w)) return false;
      if (wd.tiers && wd.tiers[tier] == null) return false;
      return true;
    });
    if (!words.length) { words = NDX.SEAL_DAOTU_WORDS[dao].slice().filter((w) => NDX.SEAL_WORDS[w].tiers && NDX.SEAL_WORDS[w].tiers[tier] != null); }
    const wname = words[Math.floor(Math.random() * words.length)];
    usedNames.add(wname);
    const wd = NDX.SEAL_WORDS[wname];
    const val = NDX.sealTierVal(wd, tier);
    const _m = NDX._sealMechanism(wd, tier); // 模块三·命痕并入劫印：统一判定
    const seal = {
      id: 'seal_' + dao + '_' + wname + '_' + tier,
      name: wname, dao, tier, stat: wd.stat, val,
      desc: wd.desc, unique: !!wd.unique, hero: wd.hero || 'all',
      crit: wd.crit || 0, lifesteal: wd.lifesteal || 0,
      maxhp: wd.maxhp || 0, evaOnDodge: !!wd.evaOnDodge,
      mechanism: _m ? _m.mechanism : null,
      mechVal: _m ? _m.mechVal : 0,
      mechDesc: _m ? _m.mechDesc : '',
    };
    out.push(seal);
  }
  return out;
};

// V8.26 命痕砍除：开局改授「英雄专属初始劫印」（带机制，替代原 HERO_INITIAL_FATE 命痕奠基流派）
NDX.HERO_INITIAL_SEAL = {
  wukong: { name: '齐天', dao: '战', tier: 'blue', mech: 'critBreakShield', mechVal: 0.15 },
  tangseng: { name: '金蝉', dao: '渡', tier: 'blue', mech: 'reviveOnce', mechVal: 2 },
  shaseng: { name: '厚土', dao: '缘', tier: 'blue', mech: 'regenShieldEachTurn', mechVal: 0.08 },
  bajie: { name: '残魂', dao: '夺', tier: 'blue', mech: 'shieldBreakReflect', mechVal: 0.5 },
  xiaobailong: { name: '轻影', dao: '隐', tier: 'blue', mech: 'evaSpeedUp', mechVal: 1 },
};
NDX.grantInitialSeal = function (s, heroId) {
  const cfg = NDX.HERO_INITIAL_SEAL[heroId];
  if (!cfg) return null;
  const wd = NDX.SEAL_WORDS[cfg.name];
  if (!wd) return null;
  const seal = {
    id: 'seal_initial_' + cfg.name,
    name: cfg.name, dao: cfg.dao, tier: cfg.tier,
    stat: wd.stat, val: wd.tiers[cfg.tier] || 0,
    desc: wd.desc, unique: !!wd.unique, hero: wd.hero || 'all',
    crit: wd.crit || 0, lifesteal: wd.lifesteal || 0,
    maxhp: wd.maxhp || 0, evaOnDodge: !!wd.evaOnDodge,
    mechanism: wd.mech, mechVal: (wd.mechVal || cfg.mechVal || 1),
    mechDesc: wd.mechDesc || '', initial: true,
  };
  if (!(s.seals || []).some((x) => x.name === cfg.name)) {
    (s.seals = s.seals || []).push(seal);
  }
  return seal;
};

// 依「恩怨归属」生成劫印 3 选 1：只从指定善恶阵营的道途出。
// 善 = 渡/隐/缘（非战斗劫难）；恶 = 战/夺/逆（战斗劫难）。
// 与 offerSeals 同构，但候选池限定在单一阵营内，保证「非战斗只出善印、战斗只出恶印」。
NDX.offerSealsAligned = function (heroId, tier, s, align) {
  // V9.6 阵营池改读来源真源 NDX.SEAL_SOURCE_ALIGN（原有内联 GOD/EVIL 双份定义收敛）
  const daos = ((NDX.SEAL_SOURCE_ALIGN && NDX.SEAL_SOURCE_ALIGN[align])
    || (align === 'evil' ? ['战', '夺', '逆'] : ['渡', '隐', '缘'])).slice();
  // 逆道全锁：未通关（niDaoUnlocked 假）时，恶阵营候选池剔除「逆」，逆系劫印不进入候选
  // 【2026-09-14】同 offerSeals：首周目逆命数达标即开缝，故此处须传 s 才有该旁路
  if (!NDX.niDaoUnlocked(s)) {
    const _i = daos.indexOf('逆');
    if (_i >= 0) daos.splice(_i, 1);
  }
  // 善道档位保底：主道途不在本次池内时累计饥渴；在池内且饥渴达标则提档（white→blue）
  tier = NDX._resolveSealTier(heroId, tier, s, daos);
  const owned = s.seals || [];
  const ownedNames = new Set(owned.map((x) => x.name));
  const out = [];
  const usedNames = new Set();
  for (const dao of daos) {
    let words = NDX.SEAL_DAOTU_WORDS[dao].slice();
    words = words.filter((w) => {
      const wd = NDX.SEAL_WORDS[w];
      if (wd && wd.unique && ownedNames.has(w)) return false;
      if (usedNames.has(w)) return false;
      // V9.6 修复·白档废印：该档无数值的词条（「逐杀/焚天/流沙」等仅有蓝/金档）不得进入候选，
      //   否则白档会产出 val 为 undefined 的「零收益废印」——与 offerSeals 的过滤口径统一。
      if (!wd || !wd.tiers || wd.tiers[tier] == null) return false;
      return true;
    });
    if (!words.length) {
      words = NDX.SEAL_DAOTU_WORDS[dao].slice()
        .filter((w) => NDX.SEAL_WORDS[w] && NDX.SEAL_WORDS[w].tiers && NDX.SEAL_WORDS[w].tiers[tier] != null);
    }
    if (!words.length) words = NDX.SEAL_DAOTU_WORDS[dao].slice();
    const wname = words[Math.floor(Math.random() * words.length)];
    usedNames.add(wname);
    const wd = NDX.SEAL_WORDS[wname];
    const _m = NDX._sealMechanism(wd, tier); // 模块三·命痕并入劫印：统一判定
    const seal = {
      id: 'seal_' + dao + '_' + wname + '_' + tier,
      name: wname, dao, tier, stat: wd.stat,
      // 提档防护：该词条若无本次品阶数值，回退到原档（避免 val 为 undefined）
      val: (wd.tiers && wd.tiers[tier] != null) ? wd.tiers[tier] : (wd.tiers ? wd.tiers.white : 0),
      desc: wd.desc, unique: !!wd.unique, hero: wd.hero || 'all',
      crit: wd.crit || 0, lifesteal: wd.lifesteal || 0,
      maxhp: wd.maxhp || 0, evaOnDodge: !!wd.evaOnDodge,
      mechanism: _m ? _m.mechanism : null,
      mechVal: _m ? _m.mechVal : 0,
      mechDesc: _m ? _m.mechDesc : '',
    };
    out.push(seal);
  }
  return out;
};

// 将一枚劫印并入 state（V8.6：取消品阶持有数上限——不做强制要求，
// 改为受「81难所能获得的劫印总数」自然约束；仅保留唯一劫印不可重复）
// V3 §1.1 砍生效格：劫印全量自动生效，无 active 标记、无捺存/换上管理。
NDX.addSeal = function (s, seal) {
  const owned = s.seals || [];
  const wd = NDX.SEAL_WORDS[seal.name];
  if (wd && wd.unique && owned.some((x) => x.name === seal.name)) return { ok: false, reason: 'unique' };
  owned.push(seal);
  // V8.58 新手教学触发：获得第一个劫印时触发劫印教学（n2_seal_panel）
  try {
    if (owned.length === 1 && NDX.NewbieTeach && NDX.triggerTeach) {
      NDX.triggerTeach('n2_seal_panel', { seal: seal });
    }
  } catch (e) { /* noop */ }
  // —— 图鉴系统：获得劫印时记录到图鉴（非侵入，独立机制）——
  try {
    const _id = seal.name || 'unknown';
    const _data = {
      name: seal.name || '未知劫印',
      dao: wd ? wd.dao : (seal.dao || ''),
      stat: wd ? wd.stat : (seal.stat || ''),
      tier: seal.tier || seal.quality || '',
      desc: wd ? wd.desc : (seal.desc || ''),
      hero: wd ? wd.hero : '',
    };
    if (NDX.CODEX && NDX.CODEX.record) {
      NDX.CODEX.record('seal', _id, _data);
    }
  } catch (e) { /* 图鉴记录失败不影响主逻辑 */ }
  return { ok: true };
};

// ============================================================
//  生效格（V8.20 → V8.5y 转职扩格 → V3 §1.1 全量砍除）：
//  劫印不再占生效格，全部持有自动累计生效；道途层数阶段碑承接成长位，
//  转职扩格奖励由 V3 §6 协同共鸣承接。原 sealSlotCap/toggleSealActive/
//  activeSealsFor/sealActiveCount 等管理函数全部移除。
// ============================================================

// ============================================================
//  命痕系统已于 V8.26 → 模块三 全量并入劫印（机制改写职责由 SEAL_WORDS.mech /
//  _sealMechanism 承接），FATE_* 数据表、offerFates / addFate、命痕仪典全部移除，
//  combat.js 以 fateFlags 聚合 bonus.seals.mechanism 进入回合内核，劫印为唯一真源。
// ============================================================

// ============================================================
//  篝火献祭取舍系统（《体系补全》·一阶补全）
//  篝火不只是"回血+淬炼"，更应是「以代价换增益」的取舍场。
//  V8.26 命痕砍除：涅槃换命 / 化痕为印 / 化印为痕 三个命痕仪典一并移除，
//  保留「舍血淬体」（烧血换永久成长）；机制改写职责已并入劫印。
//  V9.6 接线收口：原表仅 blood 有执行函数，life/xinmo/incense 三项「有数据、有按钮、
//   无分发无执行」——点击完全无响应。现改为**声明式单一真源**：每个仪典自带
//   代价判定(costOk/costFn/pay) + 增益(gain)，由统一执行器 NDX.doRite 结算，
//   结构性杜绝「数据有 / 执行无」。desc 中原引用不存在字段的两项已按真实字段改写
//   （「+3%诵经伤害」无结算字段 → +2% 暴击；「心魔上限+5」需改心魔内核常量 → 去除，
//    其代价本就是消耗的 10 点心魔，一进一出）。数值口径 [已调优]（2026-09-14）：四仪典跨资源兑换已自洽——
//    血200→+1攻/+8血/+2暴、寿1年→+2法攻/+2法防/+2暴、心魔10→+3攻/+2暴、金50→+15血/+1防/+1闪，
//    不同资源换永久属性的边际互不可直接比较（心魔可循环、血寿为硬资源），无破坏平衡增益，确认保持。
// ============================================================
NDX.BONFIRE_RITES = {
  blood: {
    id: 'blood', name: '舍血淬体', icon: '🩸',
    desc: '献祭 200 点当前气血，永久 +1 体攻、+8 气血上限、+2% 暴击。',
    cost: '血', costText: '200 当前气血',
    costOk: (s) => (s.hp || 0) > 1, costWhy: '气血全无，无可献祭',
    costFn: (s) => Math.min(200, (s.hp || 0) - 1),
    pay: (s, n) => { s.hp = Math.max(1, (s.hp || 0) - n); },
    gain: { atk: 1, hp: 8, cri: 0.02 },
    gainText: '体攻 +1、气血上限 +8、暴击 +2%',
  },
  life: {
    id: 'life', name: '舍寿悟道', icon: '📿',
    desc: '献祭 1 岁寿数，永久 +2 法攻、+2 法防、+2% 暴击。',
    cost: '寿', costText: '1 岁寿数',
    costOk: (s) => (s.life || 0) >= 1, costWhy: '寿元已尽，无寿可舍',
    costFn: () => 1,
    pay: (s, n) => { s.life = Math.max(0, (s.life || 0) - n); },
    gain: { matk: 2, mdef: 2, cri: 0.02 },
    gainText: '法攻 +2、法防 +2、暴击 +2%',
  },
  xinmo: {
    id: 'xinmo', name: '心魔献祭', icon: '👹',
    desc: '献祭 10 点心魔值，永久 +3 体攻、+2% 暴击——以戾换力，心魔消而杀心长。',
    cost: '心魔', costText: '10 点心魔值',
    costOk: (s) => (s.xinmo || 0) >= 10, costWhy: '心魔不足 10 点，无从献祭',
    costFn: () => 10,
    pay: (s, n) => { s.xinmo = Math.max(0, (s.xinmo || 0) - n); },
    gain: { atk: 3, cri: 0.02 },
    gainText: '体攻 +3、暴击 +2%',
  },
  incense: {
    id: 'incense', name: '香火供奉', icon: '🕯',
    desc: '献祭 50 金币，永久 +15 气血上限、+1% 防御、+1% 闪避。',
    cost: '金', costText: '50 金币',
    costOk: (s) => (s.gold || 0) >= 50, costWhy: '金币不足 50，供奉不起',
    costFn: () => 50,
    pay: (s, n) => { s.gold = Math.max(0, (s.gold || 0) - n); },
    gain: { hp: 15, dr: 0.01, eva: 0.01 },
    gainText: '气血上限 +15、减伤 +1%、闪避 +1%',
  },
};
// bonusTi（体·肉身）容器兜底：仅补键、不改既有值
NDX._bonusTi = function (s) {
  s.bonusTi = s.bonusTi || { atk: 0, hp: 0, dr: 0, eva: 0, maxHp: 0, cri: 0, criMult: 0, lifesteal: 0, matk: 0, mdef: 0 };
  return s.bonusTi;
};
// 列出当前篝火可用的仪典（依资源可用性点亮/置灰）
NDX.riteList = function (s) {
  return Object.values(NDX.BONFIRE_RITES).map((r) => {
    const ok = r.costOk ? !!r.costOk(s) : true;
    return Object.assign({}, r, { disabled: !ok, why: ok ? '' : (r.costWhy || '此刻无法献祭') });
  });
};
// 统一执行器（单一真源）：数据驱动扣减代价 + 并入 bonusTi 永久增益
//   返回 { ok, id, pay, gain, gainText, name, cost } 或 { ok:false, reason, why }
NDX.doRite = function (s, id) {
  const r = NDX.BONFIRE_RITES[id];
  if (!r) return { ok: false, reason: 'no-rite', why: '此处无此仪典' };
  if (r.costOk && !r.costOk(s)) return { ok: false, reason: 'cost', why: r.costWhy || '此刻无法献祭' };
  const pay = r.costFn ? (r.costFn(s) || 0) : 0;
  if (pay <= 0) return { ok: false, reason: 'cost', why: r.costWhy || '此刻无法献祭' };
  if (r.pay) r.pay(s, pay);
  const ti = NDX._bonusTi(s);
  const g = r.gain || {};
  Object.keys(g).forEach((k) => { ti[k] = +((ti[k] || 0) + g[k]).toFixed(3); });
  return { ok: true, id: id, name: r.name, cost: r.cost, pay: pay, gain: g, gainText: r.gainText };
};
// 兼容旧接口「舍血淬体」（保留原返回字段，供既有调用点/门禁读取）
NDX.doRiteBlood = function (s) {
  const r = NDX.doRite(s, 'blood');
  if (!r.ok) return { ok: false, reason: r.reason, why: r.why };
  return { ok: true, cost: r.pay, atk: r.gain.atk, hp: r.gain.hp, cri: r.gain.cri, gainText: r.gainText };
};

// ============================================================
//  劫印品阶（V8.6 重铸 → V3 §1.1 砍管理 → V9.6 三红合金顶阶）：
//   - 白/绿/蓝/红/金 五档（V9.8）：白/绿/蓝/红 由来源直给，金=顶阶仅由三红合金合成
//   - 层级 white<green<blue<red<gold；计层 白/绿=1、蓝=2、红=3、金=4（金劫顶阶，计层最高）
//   - V9.8 恢复 3合1 合成链（白3→绿、绿3→蓝、蓝3→红、红3→金），于土地庙进行；2换1、同阶相易、
//     等管理操作全部下线，品阶只随获取来源自然产生；金劫来源唯一（三红合金），不污染掉落
//   - 取消品阶持有上限：能刻多少取决于 81 难所能获得的劫印总数
// ============================================================
NDX.SEAL_TIER_LABEL = { white: '白劫', green: '绿劫', blue: '蓝劫', red: '红劫', gold: '金劫' };
NDX.SEAL_TIER_CLS = { white: 'tier-white', green: 'tier-green', blue: 'tier-blue', red: 'tier-red', gold: 'tier-gold' };
// V9.8 五档阶梯（用户拍板）：白 < 绿 < 蓝 < 红 < 金
//   掉落口径：小怪概率白 / 精英必掉绿 / Boss 二阶变身蓝 / 三段变身（三阶）红 / 金=三红合金
NDX.SEAL_TIER_ORDER = ['white', 'green', 'blue', 'red', 'gold'];
// P2-2 弃印定价：白/绿/蓝/红/金 → 碎金（土地庙放下劫印）；金劫为顶阶，定价 = 3×红劫（与功率中性同口径）
NDX.SEAL_TIER_GOLD = { white: 6, green: 10, blue: 16, red: 26, gold: 78 };
// 蓝劫 = 绿档 ×1.62（新插入档，位于绿与红之间；与「红/蓝 ≈1.62」同一步长，阶梯均匀）[已调优]（2026-09-14）：
//   门禁 _verify_seal_source B3 / _verify_seal_alloy 对倍率参数化且要求阶梯均匀（蓝/绿=SEAL_BLUE_MULT、金/白<20）；
//   复核弃印价 10→16→26→78 步长 1.6/1.625/3 均匀无断层，确认保持 1.62。
NDX.SEAL_BLUE_MULT = 1.62;
// 红劫 = 金基 ×1.55（融合≥3 / 三段变身 Boss 击破；红劫=单印强档）
NDX.SEAL_RED_MULT = 1.55;
// 金劫 = 红劫 ×3（即 金基×4.65）：金劫为顶阶、仅由三红合金合成，
//   三红合金功率中性（3×红 = 1×金），合成价值在「构筑精简 + 顶阶标识」而非数值暴增。
NDX.SEAL_GOLD_SCALE = 4.65;   // = SEAL_RED_MULT × 3

// 3合1 合成链（V9.8）：3 枚同档 → 1 枚上一档（白→绿→蓝→红→金）
NDX.SEAL_COMBINE_N = 3;
// 上一档 / 下一档（合成链真源）
NDX.sealNextTier = function (tier) {
  const i = NDX.SEAL_TIER_ORDER.indexOf(tier);
  return (i >= 0 && i < NDX.SEAL_TIER_ORDER.length - 1) ? NDX.SEAL_TIER_ORDER[i + 1] : null;
};

// 统一劫印数值缩放（单一真源）：
//   白/绿 取各自基档；蓝 = 绿档×SEAL_BLUE_MULT；红 = 金基×SEAL_RED_MULT；金 = 金基×SEAL_GOLD_SCALE
NDX.sealTierVal = function (wd, tier) {
  if (!wd || !wd.tiers) return 0;
  if (tier === 'gold') return (wd.tiers.gold != null ? wd.tiers.gold : 0) * (NDX.SEAL_GOLD_SCALE || 1);
  if (tier === 'red') return (wd.tiers.gold != null ? wd.tiers.gold : 0) * (NDX.SEAL_RED_MULT || 1);
  if (tier === 'blue') return (wd.tiers.green != null ? wd.tiers.green : 0) * (NDX.SEAL_BLUE_MULT || 1);
  return wd.tiers[tier] != null ? wd.tiers[tier] : 0;
};

// 派生档数值补全：红 = 金基×1.55、蓝 = 绿档×1.62（就地补档，供候选过滤/展示通过）
(function () {
  Object.keys(NDX.SEAL_WORDS || {}).forEach((k) => {
    const wd = NDX.SEAL_WORDS[k];
    if (!wd || !wd.tiers) return;
    // 不四舍五入：保持 红 = 金基×SEAL_RED_MULT 与 金 = 金基×SEAL_GOLD_SCALE 的精确 1:3 关系，
    // 使「三红合金功率中性」在数学上严格成立（金劫值 ≡ 3×红劫值）。显示层 ui_panel_2.js 用 Math.round(val*100)% 自行取整，不受此影响。
    if (wd.tiers.gold != null && wd.tiers.red == null) wd.tiers.red = wd.tiers.gold * NDX.SEAL_RED_MULT;
    if (wd.tiers.green != null && wd.tiers.blue == null) wd.tiers.blue = wd.tiers.green * NDX.SEAL_BLUE_MULT;
  });
})();

// 由词条名构造一枚劫印对象
NDX._mkSeal = function (name, tier) {
  const wd = NDX.SEAL_WORDS[name];
  const dao = wd.dao;
  const _m = NDX._sealMechanism(wd, tier); // 模块三·命痕并入劫印：品阶达标才附着战斗机制
  return {
    id: 'seal_' + dao + '_' + name + '_' + tier,
    name, dao, tier, stat: wd.stat, val: NDX.sealTierVal(wd, tier),
    desc: wd.desc, unique: !!wd.unique, hero: wd.hero || 'all',
    crit: wd.crit || 0, lifesteal: wd.lifesteal || 0,
    maxhp: wd.maxhp || 0, evaOnDodge: !!wd.evaOnDodge,
    mechanism: _m ? _m.mechanism : null,
    mechVal: _m ? _m.mechVal : 0,
    mechDesc: _m ? _m.mechDesc : '',
  };
};

// 模块三·命痕并入劫印：统一判定一枚劫印词条是否附着战斗机制（唯一真源）
// 数据源 SEAL_WORDS.mech / mechTier / mechVal / mechDesc；品阶 ≥ mechTier 才附带（绿起机制、金机制足）。
// V9.8 五档：white0 < green1 < blue2 < red3 < gold4（原「blue 起机制」随档位下移更名为 green）
NDX._mechRank = { white: 0, green: 1, blue: 2, red: 3, gold: 4 };
NDX._sealMechanism = function (wd, tier) {
  if (!wd || !wd.mech) return null;
  const tr = wd.mechTier;
  if (tr == null || NDX._mechRank[tr] == null || NDX._mechRank[tier] == null) return null;
  if (NDX._mechRank[tier] < NDX._mechRank[tr]) return null;
  return { mechanism: wd.mech, mechVal: wd.mechVal || 1, mechDesc: wd.mechDesc || '' };
};

// 当前各品阶劫印计数
NDX.sealCounts = function (s) {
  const c = { white: 0, green: 0, blue: 0, gold: 0, red: 0 };
  (s.seals || []).forEach((x) => { if (c[x.tier] != null) c[x.tier]++; });
  return c;
};

// 3合1 合成（V9.8 全链）：消耗 N 枚同档 → 1 枚上一档（白→绿→蓝→红→金）。
//   - 道途取 N 枚「多数派」（平局取序列首枚），产物继承该道一名有 next 档数值的词条。
//   - 顶阶（金）数值 = 红劫 ×3（见 SEAL_GOLD_SCALE），故三红合金功率中性，
//     价值在「构筑精简 + 顶阶标识」；低档合成同理：数值按档位阶梯跳档（非 ×3 爆炸），
//     回报为 机制解锁（绿起）+ 道途层数 + 构筑收敛。
//   - 仅由土地庙触发（chooseRest 'seal-combine:<tier>'），不污染任何掉落来源（金劫来源唯一）。
NDX.combineSeals = function (s, tier) {
  const N = NDX.SEAL_COMBINE_N || 3;
  const next = NDX.sealNextTier(tier);
  if (!next) return { ok: false, why: '金劫已为顶阶，无可再合' };
  const src = (s.seals || []).filter((x) => x && x.tier === tier);
  if (src.length < N) return { ok: false, why: (NDX.SEAL_TIER_LABEL[tier] || tier) + '不足 ' + N + ' 枚，无从合成' };
  const cnt = {};
  src.forEach((x) => { cnt[x.dao] = (cnt[x.dao] || 0) + 1; });
  let dao = src[0].dao, best = 0;
  Object.keys(cnt).forEach((d) => { if (cnt[d] > best) { best = cnt[d]; dao = d; } });
  // 优先消耗多数派道途（构筑收敛向主道），不足再取其余
  const pick = src.filter((x) => x.dao === dao).concat(src.filter((x) => x.dao !== dao)).slice(0, N);
  const ids = new Set(pick.map((x) => x.id));
  s.seals = (s.seals || []).filter((x) => !ids.has(x.id));
  const words = (NDX.SEAL_DAOTU_WORDS[dao] || []).filter((w) => {
    const wd = NDX.SEAL_WORDS[w]; return wd && wd.tiers && wd.tiers[next] != null;
  });
  const word = words.length ? words[Math.floor(Math.random() * words.length)] : null;
  if (!word) return { ok: false, why: '该道无可合成' + (NDX.SEAL_TIER_LABEL[next] || next) + '词条' };
  const out = NDX._mkSeal(word, next);
  s.seals.push(out);
  const r = { ok: true, dao: dao, tier: next, seal: out, consumed: pick };
  if (next === 'gold') r.gold = out;   // 兼容旧字段（三红合金）
  return r;
};
// 兼容层：三红合金（顶阶合成）= combineSeals(s, 'red')
NDX.combineRedSeals = function (s) { return NDX.combineSeals(s, 'red'); };
// 土地庙合成面板真源：各档「可合成」状态（count / need / next / can / why）
NDX.combineInfo = function (s) {
  const N = NDX.SEAL_COMBINE_N || 3;
  const c = NDX.sealCounts(s);
  return NDX.SEAL_TIER_ORDER.slice(0, -1).map((t) => {
    const next = NDX.sealNextTier(t);
    const count = c[t] || 0;
    return {
      tier: t, next: next, count: count, need: N,
      can: count >= N,
      why: count >= N ? '' : (NDX.SEAL_TIER_LABEL[t] + '还差 ' + (N - count) + ' 枚'),
      label: NDX.SEAL_TIER_LABEL[t] + ' ×' + N + ' → ' + NDX.SEAL_TIER_LABEL[next],
    };
  });
};

// ============================================================
//  道途层数 · 阶段碑（V3 §1.3/§1.4 引入 · 叠加层）
//   - 层数 = 该道全部持有劫印的 layerVal 之和；金=2、红=3（等价 V3「金=2普通，红=3普通」，
//     脸好拿高档印 => 该道层数快进，构成 §4.6 运气峰谷正反馈）。
//   - 按 3/6/9/12 递增触发六道阶段效果（自动累计于全部持有印，独立于即时「生效位 cap」，
//     故玩家无需任何「生效格/捺存」管理——V3 §1.1「砍生效格」落地）。
//   - 阶段字段限定为 calcSealBonus 白名单内的确定属性（atkPct/matkPct/hpPct/drPct/eva/cri/dr），
//     直接并入对外结算；每当成存档「达到该层后的总加成」。
// ============================================================
NDX.sealLayerVal = function (tier) {
  // V9.8 五档计层：白/绿=1 层；蓝=2 层；红=3 层；金=4 层（金劫为顶阶，计层最高，鼓励三红合金冲顶）
  //   [已调优]（2026-09-14）阶段碑门槛 3/6/9/12 不变，高档加速是对「高档变稀有」的补偿；
  //   门禁 _verify_seal_source B3 写死计层白1/绿1/蓝2/红3/金4，确认保持。
  if (tier === 'gold') return 4;
  if (tier === 'red') return 3;
  if (tier === 'blue') return 2;
  return 1;
};
// 某道当前层数（全部持有印累加）
NDX.sealDaoLayerSum = function (s, dao) {
  let sum = 0;
  ((s && s.seals) || []).forEach((x) => { if (x && x.dao === dao) sum += NDX.sealLayerVal(x.tier); });
  return sum;
};
// 六道阶段碑：达到该层数的「总加成」（6 档内含 3 档效应，依 V3 §1.3「激活N个效果」累加语义）
NDX.SEAL_DAO_BREAKPOINTS = {
  '战': { 3: { atkPct: 0.05 }, 6: { atkPct: 0.10, cri: 0.03 }, 9: { atkPct: 0.14, cri: 0.05 }, 12: { atkPct: 0.20, cri: 0.08 } },
  '渡': { 3: { matkPct: 0.05 }, 6: { matkPct: 0.10 }, 9: { matkPct: 0.15, dr: 0.03 }, 12: { matkPct: 0.20, dr: 0.05 } },
  '缘': { 3: { hpPct: 0.08 }, 6: { hpPct: 0.15, dr: 0.03 }, 9: { hpPct: 0.20, dr: 0.05 }, 12: { hpPct: 0.25, dr: 0.08 } },
  '夺': { 3: { hpPct: 0.05, atkPct: 0.02 }, 6: { hpPct: 0.10, atkPct: 0.04 }, 9: { hpPct: 0.15, atkPct: 0.06 }, 12: { hpPct: 0.20, atkPct: 0.09 } },
  '隐': { 3: { eva: 0.03 }, 6: { eva: 0.05, cri: 0.03 }, 9: { eva: 0.08, cri: 0.05 }, 12: { eva: 0.12, cri: 0.08 } },
  '逆': { 3: { atkPct: 0.03, matkPct: 0.03 }, 6: { atkPct: 0.05, matkPct: 0.05, cri: 0.02 }, 9: { atkPct: 0.08, matkPct: 0.08, cri: 0.04 }, 12: { atkPct: 0.12, matkPct: 0.12, cri: 0.06 } },
};
NDX.SEAL_DAO_TIER_ORDER = [3, 6, 9, 12];
// 某道当前激活的最高档阶段效果（向下取最近档；不足 3 层则为空）
NDX.sealBreakFor = function (s, dao) {
  const sum = NDX.sealDaoLayerSum(s, dao);
  const tiers = NDX.SEAL_DAO_BREAKPOINTS[dao] || {};
  let best = null;
  for (const lt of NDX.SEAL_DAO_TIER_ORDER) { if (sum >= lt && tiers[lt]) best = tiers[lt]; }
  return best;
};
// 是否已激活某档（供 UI 标亮）
NDX.sealDaoTierHit = function (s, dao, lt) {
  return NDX.sealDaoLayerSum(s, dao) >= lt;
};
// 聚合六道全部已激活档位效应 → 属性加成对象（并入对外结算，字段均在 calcSealBonus 白名单内）
NDX.sealBreakAll = function (s) {
  const bonus = {};
  for (const dao of ['战', '渡', '缘', '夺', '隐', '逆']) {
    const e = NDX.sealBreakFor(s, dao);
    if (!e) continue;
    for (const k of Object.keys(e)) {
      if (e[k] == null) continue;
      bonus[k] = (bonus[k] || 0) + e[k];
    }
  }
  return bonus;
};
// 展示信息：某道 层数 / 当前档效果 / 下一档 层数（供「道途层数」进度、轮回总鉴提示）
NDX.sealBreakInfo = function (s, dao) {
  const sum = NDX.sealDaoLayerSum(s, dao);
  const cur = NDX.sealBreakFor(s, dao) || {};
  let nxtTier = null, nxtEff = null;
  for (const lt of NDX.SEAL_DAO_TIER_ORDER) {
    if (sum < lt) { nxtTier = lt; nxtEff = (NDX.SEAL_DAO_BREAKPOINTS[dao] || {})[lt] || null; break; }
  }
  return { dao, layer: sum, cur, nxtTier, nxtEff };
};

