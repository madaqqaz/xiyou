// ============================================================================
//  劫印系统数据库（单局肉鸽构筑层 · 含篝火献祭取舍）
//  独立维护：本文件包含劫印与篝火仪典的数据表与逻辑函数。
//  劫印数据表：NDX.SEAL_DAOTU / NDX.SEAL_WORDS / NDX.SEAL_DAOTU_WORDS / NDX.HERO_MAIN_DAOTU
//  篝火仪典：NDX.BONFIRE_RITES
//  逻辑函数：NDX.offerSeals / NDX.addSeal / NDX.offerSealsAligned / NDX._mkSeal
//            NDX._sealMechanism / NDX.riteList / NDX.doRiteBlood
//  命痕：已并入劫印（V8.26 → 模块三收口），FATE_* 数据表与 offerFates/addFate/命痕仪典
//        全量移除，机制改写职责由 SEAL_WORDS.mech / _sealMechanism 单一真源承接。
//  修改劫印名称、加成百分比、机制标记、道途归属，直接编辑下方对应数据表即可。
// ============================================================================

// 劫印系统（单局肉鸽构筑层 · V41 新增）
// 设计文档：开发文档/劫印开发.docx
// 来源：八十一难即八十一道封印——每破一难，天庭在取经人身上落下一道「劫印」。
//   劫印为单局临时战力构筑，离开本局（通关/阵亡/重开）即清空。
// 获取：小怪战→白劫3选1；精英→蓝劫3选1；Boss→金劫3选1。
// 生效：V3 §1.1 全量自动生效——劫印不入生效格、无需捺存/换上，全部持有即累计。
//   品质白/蓝/金/红仅为稀有度标签（脸好正反馈），金=2 层、红=3 层计入道途层数。
// 六大道途（六道属性体系 · 2026-09-01 调整，与选项六道对齐）：
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

// 劫印词条字典（白/蓝/金三档百分比）
//   stat: 影响的属性； tiers: {white, blue, gold} 百分比加成
//   unique: 唯一（如吸血（渡厄））
//   hero: 该词条偏好的英雄体系（用于联动提示与默认道途加权，非硬限制）
//   link: 与装备/法宝红色神器的联动标记（四层联动见文档）
// 劫印词条字典（白/蓝/金/红四档）
//   stat: 影响的属性； tiers: {white, blue, gold, red} 百分比加成
//   unique: 唯一（如吸血（渡厄））
//   hero: 该词条偏好的英雄体系（用于联动提示与默认道途加权，非硬限制）
//   link: 与装备/法宝红色神器的联动标记（四层联动见文档）
//   —— V8.26 命痕并入：原命痕（FATE_WORDS）的 18 个「战斗机制」按道途并入劫印词条，
//        由蓝/金档承载（mechTier），combat.js 聚合 bonus.seals.mechanism 进 fateFlags，
//        与旧结算路径完全兼容，实现「机制改写层 → 劫印专属」的职责归并。——
NDX.SEAL_WORDS = {
  杀伐: { name: '杀伐', dao: '战', stat: 'atk', tiers: { white: 0.12, blue: 0.20, gold: 0.34 }, desc: '物攻提升。', hero: 'wukong' },
  碎击: { name: '碎击', dao: '战', stat: 'atk', tiers: { white: 0.10, blue: 0.16, gold: 0.28 }, crit: 0.06, desc: '物攻提升，并(+6%暴击)。', hero: 'wukong' },
  禅光: { name: '禅光', dao: '渡', stat: 'maxhp', tiers: { white: 0.12, blue: 0.20, gold: 0.34 }, desc: '气血提升。', hero: 'tangseng' },
  渡厄: { name: '渡厄', dao: '渡', stat: 'maxhp', tiers: { white: 0.08, blue: 0.14, gold: 0.22 }, unique: true, lifesteal: 0.06, desc: '气血提升，唯一附带吸血（金≈6%）。', hero: 'tangseng' },
  守心: { name: '守心', dao: '缘', stat: 'dr', tiers: { white: 0.05, blue: 0.09, gold: 0.15 }, desc: '减伤提升。', hero: 'bajie' },
  固甲: { name: '固甲', dao: '缘', stat: 'mdef', tiers: { white: 0.06, blue: 0.10, gold: 0.16 }, desc: '法防提升。', hero: 'bajie' },
  吞纳: { name: '吞纳', dao: '夺', stat: 'reflect', tiers: { white: 0.10, blue: 0.16, gold: 0.26 }, desc: '反伤提升。', hero: 'shaseng' },
  噬血: { name: '噬血', dao: '夺', stat: 'reflect', tiers: { white: 0.08, blue: 0.13, gold: 0.20 }, lifesteal: 0.04, desc: '反伤提升，附带少量吸血（金≈4%）。', hero: 'shaseng' },
  匿踪: { name: '匿踪', dao: '隐', stat: 'eva', tiers: { white: 0.05, blue: 0.09, gold: 0.15 }, desc: '闪避提升。', hero: 'xiaobailong' },
  残影: { name: '残影', dao: '隐', stat: 'eva', tiers: { white: 0.04, blue: 0.07, gold: 0.12 }, evaOnDodge: true, desc: '闪避提升，闪避后下一击必中（残影）。', hero: 'xiaobailong' },
  戾骨: { name: '戾骨', dao: '逆', stat: 'reflect', tiers: { white: 0.08, blue: 0.13, gold: 0.20 }, desc: '反伤提升（反弹所受伤害）。', hero: 'all' },
  // 通用/英雄专属第二套（同道途差异化）—— 机制改写并入（V8.26）
  裂魂: { name: '裂魂', dao: '战', stat: 'atk', tiers: { white: 0.09, blue: 0.15, gold: 0.25 }, desc: '物攻提升（裂魂·专破护体）。', hero: 'wukong', mech: 'critAtkStack', mechVal: 3, mechTier: 'blue', mechDesc: '机制·每次暴击永久 +3 物攻（越打越狠）。' },
  齐天: { name: '齐天', dao: '战', stat: 'atk', tiers: { white: 0.10, blue: 0.18, gold: 0.30 }, desc: '物攻提升（大圣本色·齐天）。', hero: 'wukong', mech: 'critBreakShield', mechVal: 0.15, mechTier: 'gold', mechDesc: '机制·暴击必破护盾，并使该敌减防 15%。' },
  逐杀: { name: '逐杀', dao: '战', stat: 'atk', tiers: { blue: 0.16, gold: 0.28 }, desc: '物攻提升（逐杀·斩将夺机）。', hero: 'wukong', mech: 'killRefreshTreasure', mechVal: 1, mechTier: 'gold', mechDesc: '机制·每击杀一个单位，下场战斗首个操作点法宝免充能。' },
  禅息: { name: '禅息', dao: '渡', stat: 'maxhp', tiers: { white: 0.10, blue: 0.17, gold: 0.28 }, desc: '气血提升（禅息·以禅养盾）。', hero: 'tangseng', mech: 'spellLifestealToShield', mechVal: 0.5, mechTier: 'blue', mechDesc: '机制·法术吸血有 50% 转为护盾而非回血。' },
  渡生: { name: '渡生', dao: '渡', stat: 'maxhp', tiers: { white: 0.09, blue: 0.15, gold: 0.25 }, desc: '气血提升（渡生·渡人渡己）。', hero: 'tangseng', mech: 'shieldLifesteal', mechVal: 0.06, mechTier: 'gold', mechDesc: '机制·自身有护盾时，普攻附带 6% 吸血。' },
  金蝉: { name: '金蝉', dao: '渡', stat: 'maxhp', tiers: { blue: 0.15, gold: 0.25 }, desc: '气血提升（金蝉·十世余泽）。', hero: 'tangseng', mech: 'reviveOnce', mechVal: 2, mechTier: 'gold', mechDesc: '机制·首次阵亡复活，并以 2 倍法伤反噬击杀者。' },
  坚甲: { name: '坚甲', dao: '缘', stat: 'dr', tiers: { white: 0.05, blue: 0.09, gold: 0.15 }, desc: '减伤提升（坚甲·以守代攻）。', hero: 'shaseng', mech: 'shieldBreakSlow', mechVal: 0.15, mechTier: 'blue', mechDesc: '机制·护盾被击碎时，攻击者减速 15%。' },
  厚土: { name: '厚土', dao: '缘', stat: 'dr', tiers: { white: 0.05, blue: 0.10, gold: 0.16 }, maxhp: 0.05, desc: '减伤提升，并(+5%气血上限)（厚土载物）。', hero: 'shaseng', mech: 'regenShieldEachTurn', mechVal: 0.08, mechTier: 'gold', mechDesc: '机制·每回合开始恢复 8% 最大气血的护盾。' },
  万象: { name: '万象', dao: '缘', stat: 'dr', tiers: { blue: 0.10, gold: 0.17 }, desc: '减伤提升（万象·森罗）。', hero: 'shaseng', mech: 'shieldImmuneCtrl', mechVal: 1, mechTier: 'gold', mechDesc: '机制·自身有护盾时免疫一切控制。' },
  戾伤: { name: '戾伤', dao: '夺', stat: 'reflect', tiers: { white: 0.10, blue: 0.17, gold: 0.28 }, desc: '反伤提升（戾伤·以血养兵）。', hero: 'bajie', mech: 'hpLossBoostTreasure', mechVal: 0.5, mechTier: 'blue', mechDesc: '机制·每损失 10% 气血，祭出法宝伤害 +5%。' },
  残魂: { name: '残魂', dao: '夺', stat: 'reflect', tiers: { white: 0.08, blue: 0.14, gold: 0.23 }, desc: '反伤提升（残魂·反噬）。', hero: 'bajie', mech: 'shieldBreakReflect', mechVal: 0.5, mechTier: 'gold', mechDesc: '机制·护盾被击碎时，对全场敌人反弹 50% 该护盾值的伤害。' },
  焚天: { name: '焚天', dao: '夺', stat: 'reflect', tiers: { blue: 0.15, gold: 0.26 }, desc: '反伤提升（焚天·死战）。', hero: 'bajie', mech: 'lowHpTreasureCdHalf', mechVal: 1, mechTier: 'gold', mechDesc: '机制·气血低于 30% 时，所有法宝冷却减半。' },
  轻影: { name: '轻影', dao: '隐', stat: 'eva', tiers: { white: 0.05, blue: 0.09, gold: 0.15 }, desc: '闪避提升（轻影·掠影）。', hero: 'xiaobailong', mech: 'evaSpeedUp', mechVal: 1, mechTier: 'blue', mechDesc: '机制·闪避后下次攻击必定抢先出手。' },
  逐风: { name: '逐风', dao: '隐', stat: 'eva', tiers: { white: 0.04, blue: 0.08, gold: 0.13 }, desc: '闪避提升（逐风·而行）。', hero: 'xiaobailong', mech: 'doubleEvaResetCd', mechVal: 1, mechTier: 'gold', mechDesc: '机制·单场连续两次闪避，重置一件法宝冷却。' },
  逆鳞: { name: '逆鳞', dao: '隐', stat: 'eva', tiers: { blue: 0.08, gold: 0.14 }, desc: '闪避提升（逆鳞·护身）。', hero: 'xiaobailong', mech: 'evaImmuneBurn', mechVal: 1, mechTier: 'gold', mechDesc: '机制·闪避成功时免疫灼烧。' },
  蚀骨: { name: '蚀骨', dao: '逆', stat: 'reflect', tiers: { white: 0.07, blue: 0.12, gold: 0.20 }, desc: '反伤提升（蚀骨·怨骨蚀心）。', hero: 'all', mech: 'hurtStackReflect', mechVal: 0.02, mechTier: 'blue', mechDesc: '机制·每次受伤叠加 2% 反伤。' },
  万劫: { name: '万劫', dao: '逆', stat: 'reflect', tiers: { white: 0.06, blue: 0.11, gold: 0.18 }, desc: '反伤提升（万劫·加身）。', hero: 'all', mech: 'lowHpReflectMult', mechVal: 2, mechTier: 'gold', mechDesc: '机制·气血低于 35% 时，反伤触发 2 段。' },
  流沙: { name: '流沙', dao: '逆', stat: 'reflect', tiers: { blue: 0.12, gold: 0.20 }, desc: '反伤提升（流沙·吞魂）。', hero: 'all', mech: 'reflectMagic', mechVal: 1, mechTier: 'gold', mechDesc: '机制·反伤附带等量法术伤害。' },
  // —— V8.28 流派扩充：每道途 +1 差异化劫印，增强 build 组合多样性 ——
  破军: { name: '破军', dao: '战', stat: 'atk', tiers: { white: 0.10, blue: 0.17, gold: 0.28 }, crit: 0.08, desc: '物攻提升，并(+8%暴击)（破军·开局爆发）。', hero: 'wukong' },
  大悲: { name: '大悲', dao: '渡', stat: 'maxhp', tiers: { white: 0.09, blue: 0.15, gold: 0.24 }, lifesteal: 0.04, desc: '气血提升，附带吸血（金≈4%）（大悲·渡己渡人）。', hero: 'tangseng' },
  金刚: { name: '金刚', dao: '缘', stat: 'dr', tiers: { white: 0.05, blue: 0.09, gold: 0.15 }, maxhp: 0.08, desc: '减伤提升，并(+8%气血上限)（金刚·不坏）。', hero: 'shaseng' },
  饕餮: { name: '饕餮', dao: '夺', stat: 'reflect', tiers: { white: 0.09, blue: 0.15, gold: 0.24 }, lifesteal: 0.06, desc: '反伤提升，附带吸血（金≈6%）（饕餮·贪噬）。', hero: 'bajie' },
  风行: { name: '风行', dao: '隐', stat: 'eva', tiers: { white: 0.04, blue: 0.07, gold: 0.12 }, crit: 0.05, desc: '闪避提升，并(+5%暴击)（风行·掠影）。', hero: 'xiaobailong' },
  修罗: { name: '修罗', dao: '逆', stat: 'reflect', tiers: { white: 0.07, blue: 0.12, gold: 0.20 }, maxhp: 0.06, desc: '反伤提升，并(+6%气血上限)（修罗·血战）。', hero: 'all' },
  // —— V8.37 流派深度扩充：每道途 +2 差异化劫印，强化 build 组合多样性（纯属性，无需改 combat 内核）——
  // 战道
  浴血: { name: '浴血', dao: '战', stat: 'atk', tiers: { white: 0.11, blue: 0.18, gold: 0.30 }, crit: 0.10, desc: '物攻提升，并(+10%暴击)（浴血·死战不退）。', hero: 'wukong' },
  连斩: { name: '连斩', dao: '战', stat: 'atk', tiers: { white: 0.10, blue: 0.17, gold: 0.28 }, lifesteal: 0.05, desc: '物攻提升，附带吸血（金≈5%）（连斩·斩将夺旗）。', hero: 'wukong' },
  // 渡道
  焚经: { name: '焚经', dao: '渡', stat: 'maxhp', tiers: { white: 0.10, blue: 0.17, gold: 0.28 }, lifesteal: 0.05, desc: '气血提升，附带吸血（金≈5%）（焚经·以血饲法）。', hero: 'tangseng' },
  禅定: { name: '禅定', dao: '渡', stat: 'maxhp', tiers: { white: 0.11, blue: 0.18, gold: 0.30 }, crit: 0.08, desc: '气血提升，并(+8%暴击)（禅定·寂然生慧）。', hero: 'tangseng' },
  // 缘道
  磐石: { name: '磐石', dao: '缘', stat: 'dr', tiers: { white: 0.06, blue: 0.10, gold: 0.17 }, maxhp: 0.10, desc: '减伤提升，并(+10%气血上限)（磐石·稳如泰山）。', hero: 'shaseng' },
  铁壁: { name: '铁壁', dao: '缘', stat: 'dr', tiers: { white: 0.05, blue: 0.09, gold: 0.16 }, mdef: 0.08, desc: '减伤提升，并(+8%法防)（铁壁·水火不侵）。', hero: 'shaseng' },
  // 夺道
  血怒: { name: '血怒', dao: '夺', stat: 'reflect', tiers: { white: 0.10, blue: 0.17, gold: 0.28 }, atk: 0.06, desc: '反伤提升，并(+6%物攻)（血怒·以血养兵）。', hero: 'bajie' },
  回春: { name: '回春', dao: '夺', stat: 'reflect', tiers: { white: 0.09, blue: 0.15, gold: 0.24 }, lifesteal: 0.08, desc: '反伤提升，附带吸血（金≈8%）（回春·生生不息）。', hero: 'bajie' },
  // 隐道
  影袭: { name: '影袭', dao: '隐', stat: 'eva', tiers: { white: 0.05, blue: 0.09, gold: 0.15 }, atk: 0.06, desc: '闪避提升，并(+6%物攻)（影袭·来去无踪）。', hero: 'xiaobailong' },
  致命: { name: '致命', dao: '隐', stat: 'eva', tiers: { white: 0.04, blue: 0.08, gold: 0.13 }, crit: 0.12, desc: '闪避提升，并(+12%暴击)（致命·一击必杀）。', hero: 'xiaobailong' },
  // 逆道
  咒怨: { name: '咒怨', dao: '逆', stat: 'reflect', tiers: { white: 0.08, blue: 0.13, gold: 0.22 }, matk: 0.06, desc: '反伤提升，并(+6%法伤)（咒怨·怨魂缠身）。', hero: 'all' },
  不灭: { name: '不灭', dao: '逆', stat: 'reflect', tiers: { white: 0.07, blue: 0.12, gold: 0.20 }, lifesteal: 0.06, desc: '反伤提升，附带吸血（金≈6%）（不灭·浴火重生）。', hero: 'all' },
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
  const main = NDX.HERO_MAIN_DAOTU[heroId] || '战';
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
  const main = NDX.HERO_MAIN_DAOTU[heroId] || '战';
  // 候选道途：本英雄主体系 +（通关后解锁）通用逆 + 随机两道（保证多样）
  // 逆道全锁（反转 V8.16）：逆系劫印通关任意英雄一次（niDaoUnlocked）后方进入候选池
  const pool = [main];
  if (NDX.niDaoUnlocked()) pool.push('逆');
  const others = ['战', '渡', '缘', '夺', '隐'].filter((d) => d !== main && d !== '逆');
  // V3 §1.5 轻度道途倾向：其余槽位按「已投道途层数」加权概率抽取（已投越多越易刷出对应劫印，非锁死）；主道途首项恒在作全局兜底
  while (pool.length < 3 && others.length) {
    const weights = others.map((d) => 1 + (NDX.sealDaoLayerSum ? NDX.sealDaoLayerSum(s, d) : 0) * 0.6);
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
    const val = wd.tiers[tier];
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
  const GOD = ['渡', '隐', '缘'];
  const EVIL = ['战', '夺', '逆'];
  const daos = (align === 'evil' ? EVIL : GOD).slice();
  // 逆道全锁：未通关（niDaoUnlocked 假）时，恶阵营候选池剔除「逆」，逆系劫印不进入候选
  if (!NDX.niDaoUnlocked()) {
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
      return true;
    });
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
// ============================================================
NDX.BONFIRE_RITES = {
  blood: {
    id: 'blood', name: '舍血淬体', icon: '🩸',
    desc: '献祭 200 点当前气血，永久 +1 体攻、+8 气血上限、+2% 暴击。',
    cost: '血', costText: '200 当前气血',
  },

  // —— V8.42 新增篝火仪典：舍寿悟道 / 心魔献祭 / 香火供奉 ——
  life: {
    id: 'life', name: '舍寿悟道', icon: '📿',
    desc: '献祭 1 岁寿数，永久 +2 法攻、+2 法防、+3% 诵经伤害。',
    cost: '寿', costText: '1 岁寿数',
  },
  xinmo: {
    id: 'xinmo', name: '心魔献祭', icon: '👹',
    desc: '献祭 10 点心魔值，永久 +3 物攻、+2% 暴击，但心魔上限 +5。',
    cost: '心魔', costText: '10 点心魔值',
  },
  incense: {
    id: 'incense', name: '香火供奉', icon: '🕯',
    desc: '献祭 50 金币，永久 +15 气血上限、+1% 防御、+1% 闪避。',
    cost: '金', costText: '50 金币',
  },
};
// 列出当前篝火可用的仪典（依资源可用性点亮/置灰）
NDX.riteList = function (s) {
  const hp = s.hp || 0;
  return Object.values(NDX.BONFIRE_RITES).map((r) => {
    let disabled = false, why = '';
    if (r.id === 'blood') { if (hp <= 1) { disabled = true; why = '气血全无，无可献祭'; } }
    return Object.assign({}, r, { disabled, why });
  });
};
// 执行「舍血淬体」
NDX.doRiteBlood = function (s) {
  const cost = Math.min(200, (s.hp || 0) - 1);
  if (cost < 1) return { ok: false, reason: '血量过低' };
  s.hp -= cost;
  s.bonusTi.atk = (s.bonusTi.atk || 0) + 1;
  s.bonusTi.hp = (s.bonusTi.hp || 0) + 8;
  s.bonusTi.cri = +((s.bonusTi.cri || 0) + 0.02).toFixed(3);
  return { ok: true, cost: cost, atk: 1, hp: 8, cri: 0.02 };
};

// ============================================================
//  劫印品阶（V8.6 重铸 → V3 §1.1 砍管理）：
//   - 白/蓝/金/红 四档仅作稀有度标签（脸好正反馈），金=2 层、红=3 层计入道途层数
//   - V3 §1.1：合成链（白3→蓝、蓝3→金、金3→红）、2换1、同阶相易、红印易异、
//     土地庙购印 等管理操作全部下线，品阶只随获取来源自然产生
//   - 取消品阶持有上限：能刻多少取决于 81 难所能获得的劫印总数
// ============================================================
NDX.SEAL_TIER_LABEL = { white: '白劫', blue: '蓝劫', gold: '金劫', red: '红劫' };
NDX.SEAL_TIER_CLS = { white: 'tier-white', blue: 'tier-blue', gold: 'tier-gold', red: 'tier-red' };
// P2-2 弃印定价：白/蓝/金/红 → 碎金（土地庙放下劫印）
NDX.SEAL_TIER_GOLD = { white: 6, blue: 12, gold: 20, red: 30 };
NDX.SEAL_RED_MULT = 1.55;

// 红色品阶数值补全：红 = 金 ×1.55（对全部劫印词条就地补档）
(function () {
  Object.keys(NDX.SEAL_WORDS || {}).forEach((k) => {
    const wd = NDX.SEAL_WORDS[k];
    if (wd && wd.tiers && wd.tiers.gold != null && wd.tiers.red == null) {
      wd.tiers.red = Math.round(wd.tiers.gold * NDX.SEAL_RED_MULT * 100) / 100;
    }
  });
})();

// 由词条名构造一枚劫印对象
NDX._mkSeal = function (name, tier) {
  const wd = NDX.SEAL_WORDS[name];
  const dao = wd.dao;
  const _m = NDX._sealMechanism(wd, tier); // 模块三·命痕并入劫印：品阶达标才附着战斗机制
  return {
    id: 'seal_' + dao + '_' + name + '_' + tier,
    name, dao, tier, stat: wd.stat, val: wd.tiers[tier],
    desc: wd.desc, unique: !!wd.unique, hero: wd.hero || 'all',
    crit: wd.crit || 0, lifesteal: wd.lifesteal || 0,
    maxhp: wd.maxhp || 0, evaOnDodge: !!wd.evaOnDodge,
    mechanism: _m ? _m.mechanism : null,
    mechVal: _m ? _m.mechVal : 0,
    mechDesc: _m ? _m.mechDesc : '',
  };
};

// 模块三·命痕并入劫印：统一判定一枚劫印词条是否附着战斗机制（唯一真源）
// 数据源 SEAL_WORDS.mech / mechTier / mechVal / mechDesc；品阶 ≥ mechTier 才附带（蓝起机制、金机制足）。
NDX._mechRank = { white: 0, blue: 1, gold: 2, red: 3 };
NDX._sealMechanism = function (wd, tier) {
  if (!wd || !wd.mech) return null;
  const tr = wd.mechTier;
  if (tr == null || NDX._mechRank[tr] == null || NDX._mechRank[tier] == null) return null;
  if (NDX._mechRank[tier] < NDX._mechRank[tr]) return null;
  return { mechanism: wd.mech, mechVal: wd.mechVal || 1, mechDesc: wd.mechDesc || '' };
};

// 当前各品阶劫印计数
NDX.sealCounts = function (s) {
  const c = { white: 0, blue: 0, gold: 0, red: 0 };
  (s.seals || []).forEach((x) => { if (c[x.tier] != null) c[x.tier]++; });
  return c;
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
  // 白/蓝=1 层；金=2 层；红=3 层（V3 §1.4 计数等价）
  return tier === 'gold' ? 2 : tier === 'red' ? 3 : 1;
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

