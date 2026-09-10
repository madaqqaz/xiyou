// ============================================================================
//  成就系统数据库 · 难簿（功名录）
//  独立维护：本文件包含全部成就数据表与成就逻辑/持久化函数。
//  数据表：NDX.ACH_VOLUMES / NDX.ACHIEVEMENTS / NDX.NANBU_DAOTU / NDX.NANBU
//          及其扁平化 NDX.NANBU_ALL / 索引 NDX.ACH_BY_ID / NDX.NANBU_BY_ID
//  逻辑函数：NDX.checkAch / NDX.reqMet / NDX.globalAchBonus
//          持久化：NDX.loadAch / NDX.saveAch
//                  NDX.loadClearedDiffs / NDX.markDiffCleared / NDX.saveClearedDiffs
//  修改成就名称/描述/解锁条件，直接编辑下方对应数据表即可。
// ============================================================================

// ============ 成就系统 · 难簿（功名录）============
// 8.11 世界观母题：灵山难簿记载每一难，英雄行迹皆被写定。
// 玩家每一步抉择、每一职觉醒、每一结局，皆在「难簿」上落一笔功名。
// 这里把可追踪的游戏事件固化为「成就」，以「簿」的形式呈现于路径最上方，便于玩家查阅。
// 成就跨周目持久化（localStorage），累计历史解锁集合，便于长期收集。
NDX.ACH_VOLUMES = [
  { id: 'ni', name: '卷一·逆道', sub: '突破簿' },
  { id: 'yin', name: '卷二·隐职', sub: '隐藏职簿' },
  { id: 'yin2', name: '卷三·因果', sub: '命运结局簿' },
  { id: 'cang', name: '卷四·收藏', sub: '收集簿' },
  { id: 'jing', name: '卷五·经藏', sub: '经藏簿' },
  { id: 'zhan', name: '卷六·战斗', sub: '战绩簿' },
  { id: 'tan', name: '卷七·探索', sub: '足迹簿' },
  { id: 'liu', name: '卷八·六道', sub: '命数簿' },
  { id: 'chao', name: '卷九·朝代', sub: '轮回簿' }
];

NDX.ACHIEVEMENTS = [
  // —— 卷一·逆道：突破既定簿录 ——
  { id: 'awaken', vol: 'ni', icon: '☲', name: '逆道初醒', desc: '首度违背佛祖定规，落下一笔「恶」业——你看见了账簿。' },
  { id: 'chugju', vol: 'ni', icon: '⚡', name: '跳出簿子', desc: '抵达任一「逆」向终局，凌云渡上不愿跪，灵山难簿少你一笔。' },
  { id: 'fanbu', vol: 'ni', icon: '🔥', name: '焚尽难簿', desc: '自己西游（恶线）集齐佛经全本，于灵山焚尽难簿，重写因果。' },
  { id: 'chongxie', vol: 'ni', icon: '✎', name: '重写难簿', desc: '以慈悲渡尽劫波，达成善之正果结局——难簿仍在，却被你改了眉批。' },

  // —— 卷二·隐职：十二脉隐藏职觉醒 ——
  { id: 'h_ts_buddha', vol: 'yin', icon: '卍', name: '弃经金蝉', desc: '取经人觉醒隐藏职「弃经金蝉」：反震六分，愿伤滔天。' },
  { id: 'h_ts_ren', vol: 'yin', icon: '卷', name: '弃经者', desc: '取经人觉醒隐藏职「弃经者」：善念化愿，一念成刃。' },
  { id: 'h_wk_empty', vol: 'yin', icon: '空', name: '悟空的空', desc: '悟空觉醒隐藏职「悟空的空」：十成穿透，棒下无物。' },
  { id: 'h_wk_will', vol: 'yin', icon: '念', name: '齐天残念', desc: '悟空觉醒隐藏职「齐天残念」：紧箍未脱，残念愈凶。' },
  { id: 'h_wk_great', vol: 'yin', icon: '圣', name: '齐天·大圣', desc: '悟空觉醒隐藏职「齐天·大圣」：金箍粉碎，棒指雷音。' },
  { id: 'h_bj_altar', vol: 'yin', icon: '坛', name: '吞天净坛', desc: '八戒觉醒隐藏职「吞天净坛」：吞食护盾，受击回元。' },
  { id: 'h_bj_marshal', vol: 'yin', icon: '帅', name: '天蓬复称', desc: '八戒觉醒隐藏职「天蓬复称」：扶起新王，旧帅重光。' },
  { id: 'h_xb_reverse', vol: 'yin', icon: '逆', name: '逆鳞白龙', desc: '小白龙觉醒隐藏职「逆鳞白龙」：血愈少，怒愈狂。' },
  { id: 'h_xb_prince', vol: 'yin', icon: '龙', name: '龙太子归', desc: '小白龙觉醒隐藏职「龙太子归」：讨回龙筋，复归本位。' },
  { id: 'h_ss_right', vol: 'yin', icon: '帘', name: '卷帘复权', desc: '沙僧觉醒隐藏职「卷帘复权」：反震转增，首击免伤。' },
  { id: 'h_ss_demon', vol: 'yin', icon: '妖', name: '卷帘镇妖', desc: '沙僧觉醒隐藏职「卷帘镇妖」：九世因果，镇妖降魔。' },
  { id: 'h_all_mirror', vol: 'yin', icon: '耳', name: '六耳·残', desc: '觉醒隐藏职「六耳·残」：分身代受，空透无间。' },
  { id: 'yiren', vol: 'yin', icon: '軍', name: '一人成军', desc: '终局同时执掌隐藏职与一枚 Boss 遗物——一人便是千军。' },

  // —— 卷三·因果：命运倾向与结局 ——
  { id: 'end_zhenguo', vol: 'yin2', icon: '果', name: '金蝉正果', desc: '取经人善线通关：金蝉脱壳，真经东归。' },
  { id: 'end_yipo', vol: 'yin2', icon: '魄', name: '一魄转世', desc: '逆道血溅凌云渡，留一魄不灭，来世更野。' },
  { id: 'end_dasheng', vol: 'yin2', icon: '猴', name: '大圣脱局', desc: '悟空棒指雷音，笑转逆云——金箍不在，簿子无名。' },
  { id: 'end_nidao', vol: 'yin2', icon: '行', name: '逆道西行', desc: '虽未成佛亦未输，西游簿上少一笔，天地多一径。' },
  { id: 'fate_ni', vol: 'yin2', icon: '逆', name: '逆道独行', desc: '命运「逆」累计满 20 道——你走的是最野的那条路。' },
  { id: 'fall_death', vol: 'yin2', icon: '殇', name: '魂断路遥', desc: '阵亡一次——天不生你，簿暂不载你，魂留一线。' },
  { id: 'fall_zuohua', vol: 'yin2', icon: '寂', name: '坐化西行', desc: '大限将至，寿数已尽——你安然坐化，这一世攒的家当，下世接着带。' },

  // —— 卷四·收藏：套装 / 佛经 / 全英雄 ——
  { id: 'set_master', vol: 'cang', icon: '胄', name: '套装大成', desc: '铸成任意一套完整套装（含英雄专属套 / 章节套）。' },
  { id: 'sutra_master', vol: 'cang', icon: '經', name: '经卷归一', desc: '将散件残卷合为一部佛经全本。', hidden: true },
  { id: 'quanjia', vol: 'cang', icon: '家', name: '一家俱全', desc: '五位英雄悉数通关——西游簿上，再无未醒之魄。' },

  // —— 卷五·经藏（V8.27 经文系统：收集制 · 双线事件）——
  // V8.36 两层机制：获得为隐性，仅完美通关回长安（ending.perfect）方可点亮
  { id: 'sutra_first', vol: 'jing', icon: '梵', name: '初闻梵音', desc: '收集第一部经文全本（渡/逆皆可）。', hidden: true },
  { id: 'sutra_du_all', vol: 'jing', icon: '渡', name: '渡藏圆满', desc: '16 部渡经全收集——经藏正果。', hidden: true },
  { id: 'sutra_ni_all', vol: 'jing', icon: '逆', name: '逆藏圆满', desc: '9 部逆经全收集——经藏逆果。', hidden: true },
  { id: 'zenith_dual', vol: 'jing', icon: '极', name: '双经齐天', desc: '单局集齐华严经 + 逆天录——渡逆双终极。', hidden: true },
  { id: 'hero_rebel', vol: 'jing', icon: '叛', name: '叛逆英雄录', desc: '集齐任一逆线英雄完整线（如哪吒 6 片）。', hidden: true },
  { id: 'hero_rebel_all', vol: 'jing', icon: '群', name: '群逆毕集', desc: '逆线 9 组事件全完成。', hidden: true },
  { id: 'hero_bodhi', vol: 'jing', icon: '善', name: '善缘录', desc: '集齐任一渡线角色线（如观音大悲咒）。', hidden: true },
  { id: 'hero_bodhi_all', vol: 'jing', icon: '八', name: '八部善缘', desc: '渡线 8 角色事件全完成。', hidden: true },
  { id: 'gear_sanjian', vol: 'jing', icon: '刃', name: '三尖重铸', desc: '集齐六部件，重铸完整三尖两刃刀。', hidden: true },
  { id: 'gear_wenshu', vol: 'jing', icon: '剑', name: '慧剑斩无明', desc: '获得文殊慧剑。', hidden: true },
  { id: 'gear_all', vol: 'jing', icon: '宝', name: '法宝齐备', desc: '集齐全部双线终极装备。', hidden: true },
  // —— 卷六·战斗：战斗技艺与战绩（V8.42 新增）——
  { id: 'combo_50', vol: 'zhan', icon: '连', name: '五十连斩', desc: '单局达成50连击——棒影如山，刀光似海。' },
  { id: 'dodge_100', vol: 'zhan', icon: '闪', name: '百次识破', desc: '单局识破蓄力重击100次——天下武功，唯快不破。' },
  { id: 'crit_50', vol: 'zhan', icon: '暴', name: '五十暴击', desc: '单局暴击50次——招招致命，式式追魂。' },
  { id: 'kill_100', vol: 'zhan', icon: '斩', name: '百妖斩', desc: '单局击杀100个怪物——西行路上，妖邪辟易。' },
  { id: 'no_damage_boss', vol: 'zhan', icon: '盾', name: '无伤破阵', desc: '单场Boss战不受伤害通关——一身转战三千里，一剑曾当百万师。' },

  // —— 卷七·探索：西行足迹与秘境（V8.42 新增）——
  { id: 'all_81', vol: 'tan', icon: '难', name: '八十一难圆满', desc: '走完所有81难——九九归真，真经东归。' },
  { id: 'all_17', vol: 'tan', icon: '路', name: '十七路皆通', desc: '单局走过全部17个地区——十万八千里，步步生莲。' },
  { id: 'hidden_event', vol: 'tan', icon: '秘', name: '秘境探索者', desc: '发现任意隐藏事件——山重水复疑无路，柳暗花明又一村。' },
  { id: 'speed_run', vol: 'tan', icon: '疾', name: '疾行取经', desc: '30分钟内通关——一日看尽长安花，半日取遍西天经。' },
  { id: 'no_death', vol: 'tan', icon: '金', name: '金刚不坏', desc: '单局0死亡通关——金身不灭，万劫不磨。' },

  // —— 卷八·六道：命数倾向与极致选择（V8.42 新增）——
  { id: 'all_du', vol: 'liu', icon: '渡', name: '普渡众生', desc: '单局全选渡道——我不入地狱，谁入地狱。' },
  { id: 'all_zhan', vol: 'liu', icon: '战', name: '战无不胜', desc: '单局全选战道——以杀止杀，以战止战。' },
  { id: 'all_ni', vol: 'liu', icon: '逆', name: '逆天而行', desc: '单局全选逆道——我命由我不由天，逆天改命在此行。' },
  { id: 'all_duo', vol: 'liu', icon: '夺', name: '夺天地造化', desc: '单局全选夺道——夺天地之造化，侵日月之玄机。' },
  { id: 'all_yin', vol: 'liu', icon: '隐', name: '隐世高人', desc: '单局全选隐道——大隐隐于市，小隐隐于野。' },
  { id: 'all_yuan', vol: 'liu', icon: '缘', name: '缘定三生', desc: '单局全选缘道——有缘千里来相会，无缘对面不相逢。' },

  // —— 卷九·朝代：轮回转世与千秋万代（V8.42 新增）——
  { id: 'xia_seng', vol: 'chao', icon: '夏', name: '夏僧', desc: '第一周目通关，称号夏僧——上古之世，鸿蒙初辟。' },
  { id: 'shang_seng', vol: 'chao', icon: '商', name: '商僧', desc: '第二周目通关，称号商僧——青铜铸鼎，巫风炽盛。' },
  { id: 'qing_seng', vol: 'chao', icon: '清', name: '清僧', desc: '清朝周目通关——康乾盛世，闭关锁国。' },
  { id: 'all_dynasty', vol: 'chao', icon: '万', name: '千秋万代', desc: '经历所有朝代——夏商周秦汉三国晋南北朝隋唐五代宋辽金元明清。' },

  // —— 卷四·收藏补充（V8.42 新增）——
  { id: 'equip_50', vol: 'cang', icon: '兵', name: '神兵收藏家', desc: '单局收集50件装备——宝光满室，神兵如云。' },
  { id: 'fabao_all', vol: 'cang', icon: '法', name: '法宝大师', desc: '收集全部法宝——法海无边，宝相庄严。' }

];

NDX.ACH_BY_ID = {};
NDX.ACHIEVEMENTS.forEach((a) => { NDX.ACH_BY_ID[a.id] = a; });

// 计算某局状态下应解锁的成就集合（仅依据当前 state，不依赖历史持久库）
NDX.checkAch = function (s) {
  s = s || {};
  const got = new Set();
  const fate = s.fate || {};
  const evil = s.evil || 0;
  const good = s.good || 0;
  const ending = (s.over && s.over.ending) || null;
  const endTitle = ending ? ending.title : '';
  const endReason = (s.over && s.over.reason) || '';
  const job = s.flags && s.flags.jobConfirm;
  const jobMap = {
    '弃经金蝉': 'h_ts_buddha', '弃经者': 'h_ts_ren',
    '悟空的空': 'h_wk_empty', '齐天残念': 'h_wk_will', '齐天·大圣': 'h_wk_great',
    '吞天净坛': 'h_bj_altar', '天蓬复称': 'h_bj_marshal',
    '逆鳞白龙': 'h_xb_reverse', '龙太子归': 'h_xb_prince',
    '卷帘复权': 'h_ss_right', '卷帘镇妖': 'h_ss_demon',
    '六耳·残': 'h_all_mirror'
  };
  // 卷一·逆道
  if (evil > 0) got.add('awaken');
  const evilPath = evil > good || ((fate['逆'] || 0) + (fate['战'] || 0) + (fate['夺'] || 0) > (fate['渡'] || 0) + (fate['隐'] || 0));
  if (evilPath || endTitle === '大圣脱局' || endTitle === '逆道西行' || endTitle === '一魄转世') got.add('chugju');
  if (endReason.indexOf('焚尽难簿') >= 0) got.add('fanbu');
  // 自己西游（恶线）集齐佛经全本并通关：以残卷焚尽灵山难簿，重写因果
  if (s.over && s.over.win && (s.sutras || []).length >= 1 && NDX.sutraSystemUnlocked && NDX.sutraSystemUnlocked(s)) got.add('fanbu');
  if (endTitle === '金蝉正果') got.add('chongxie');
  // 卷二·隐职
  if (job && jobMap[job]) got.add(jobMap[job]);
  if (job && (s.bossRewards || []).length >= 1) got.add('yiren');
  // 卷三·因果
  if (endTitle === '金蝉正果') got.add('end_zhenguo');
  if (endTitle === '一魄转世') got.add('end_yipo');
  if (endTitle === '大圣脱局') got.add('end_dasheng');
  if (endTitle === '逆道西行') got.add('end_nidao');
  if ((fate['逆'] || 0) >= 20) got.add('fate_ni');
  // 卷三·失败维度（终结时落簿，配合 game.js 失败结算 _syncAch）：
  if (s.over && !s.over.win) {
    got.add('fall_death');
    if (/寿数已尽|大限/.test(s.over.reason || '')) got.add('fall_zuohua');
  }
  // 卷四·收藏
  const equips = s.equips || [];
  if (equips.some((e) => e.setTier === 2)) got.add('set_master');
  if ((s.sutras || []).length >= 1) got.add('sutra_master');
  if (NDX.clearedHeroes && NDX.clearedHeroes().length >= 5) got.add('quanjia');
  // 卷五·经藏（V8.27 经文系统收集制）
  const _sut = s.sutras || [], _niSut = s.niSutras || [];
  const _duBind = ['su_full_dabei','su_full_xinjing','su_full_dizang','su_full_wuliangshou','su_full_lengyan','su_full_fahua','su_full_tanjing','su_full_niepan'];
  const _niBind = ['ni_full_yaopu','ni_full_wuzi','ni_full_xinyuan','ni_full_qitian','ni_full_tigujue','ni_full_zhanyaojue','ni_full_niumo'];
  if (_sut.length + _niSut.length >= 1) got.add('sutra_first');
  if (_sut.length >= 16) got.add('sutra_du_all');
  if (_niSut.length >= 9) got.add('sutra_ni_all');
  if (_sut.indexOf('su_full_huayan') >= 0 && _niSut.indexOf('ni_full_nitian') >= 0) got.add('zenith_dual');
  if (_niSut.some((id) => _niBind.indexOf(id) >= 0)) got.add('hero_rebel');
  if (Object.keys(s._sutraEvDone || {}).filter((k) => k.indexOf('ni_') === 0).length >= 9) got.add('hero_rebel_all');
  if (_sut.some((id) => _duBind.indexOf(id) >= 0)) got.add('hero_bodhi');
  if (_duBind.every((id) => _sut.indexOf(id) >= 0)) got.add('hero_bodhi_all');
  const _gearIds = (NDX.SUTRA_EVENT_GEAR || []).map((g) => g.id);
  const _heldGear = equips.filter((e) => _gearIds.indexOf(e.id) >= 0).map((e) => e.id);
  if (['sanjian_p1','sanjian_p2','sanjian_p3','sanjian_p4','sanjian_p5','sanjian_p6'].every((id) => _heldGear.indexOf(id) >= 0)) got.add('gear_sanjian');
  if (_heldGear.indexOf('wenshu_sword') >= 0) got.add('gear_wenshu');
  if (_heldGear.length >= _gearIds.length) got.add('gear_all');
  // 卷五·劫难功名（逐卷正果/逆道，按六道命数门槛解锁）
  const cycle = (NDX.getCycle ? NDX.getCycle() : 1);
  (NDX.NANBU_ALL || []).forEach((a) => {
    // V8.16 取消善恶固定路线：移除一周目逆道难簿封锁，逆道难簿一周目即可解锁
    const r = NDX.reqMet(a.req, fate, cycle, s);
    if (r.ok) got.add(a.id);
  });
  // V8.36 经文成就两层机制：隐性成就（hidden:true）仅完美通关回长安（ending.perfect）方可点亮
  // 非完美通关时，即使满足条件也只记录为"隐性获得"，不点亮成就
  const isPerfect = s.over && s.over.win && s.over.ending && s.over.ending.perfect === true;
  if (!isPerfect) {
    NDX.ACHIEVEMENTS.forEach((a) => { if (a.hidden) got.delete(a.id); });
  }
  return got;
};

// ============================================================
//  《难簿开发》· 劫难功名（按 81 难逐卷分正果/逆道两线）
//  核心机制：六道命数（战/渡/逆/隐/夺/缘）作为「业力值」，每次抉择为某道途充值。
//  成就附带「命数门槛」req：门槛未达则该成就灰锁，提示「道途未通，机缘未至」，
//  并列出具体原因（如「需【战】≥8，当前 5」）。V8.16 起逆道成就一周目即可解锁。
//  数据严格对齐《难簿开发文档》三十三卷。
// ============================================================
NDX.NANBU_DAOTU = ['战', '渡', '逆', '隐', '夺', '缘'];
// req 约定：null=无门槛；'cycle2'=逆道成就（V8.16 起一周目即可解锁）；{道:值}=该道途≥值；数组=[a,b] 需同时满足
NDX.NANBU = [
  { vol: '卷一·金蝉遭贬', zhengguo: { id: 'nb_jinchan', name: '金蝉领罚', icon: '☸', desc: '俯首领罚，忘却前尘，转生为东土高僧。', req: null },
    nidao: { id: 'nb_yinyuan', name: '因缘再启', icon: '☯', desc: '携宿慧转生，主动接下取经因缘，逆改天命。', req: 'cycle2' } },
  { vol: '卷二·双叉岭与鹰愁涧', zhengguo: { id: 'nb_liehu', name: '猎户之缘', icon: '⚔', desc: '借猎户刘伯钦之叉斩虎，结下人伦之缘。', req: { 缘: 2 } },
    nidao: { id: 'nb_andong', name: '暗洞藏珍', icon: '🔦', desc: '疑坑中有宝，暗探得避水珠，未受太白金星恩惠。', req: { 隐: 3, 渡: 2 } } }, // 文档：隐≥3且渡≤2，下限用渡≥2 近似互斥
  { vol: '卷三·观音禅院', zhengguo: { id: 'nb_heifeng', name: '黑风守山', icon: '🐻', desc: '请观音收伏黑熊精为守山，得其藏宝三昧瓶。', req: { 渡: 4 } },
    nidao: { id: 'nb_jiasha', name: '袈裟染血', icon: '🩸', desc: '强闯黑风洞，力战夺回袈裟，黑熊精亡于棒下。', req: { 战: 5 } } },
  { vol: '卷四·万寿山五庄观', zhengguo: { id: 'nb_yishu', name: '医树结缘', icon: '🌿', desc: '求观音甘露医活人参果树，与镇元子结为道友。', req: { 渡: 6 } },
    nidao: { id: 'nb_bagen', name: '拔根见骨', icon: '🦴', desc: '掘开树根，见千万取经人尸骨，悟取经代价。', req: { 逆: 6 } } },
  { vol: '卷五·白虎岭', zhengguo: { id: 'nb_sanda', name: '三打白骨', icon: '💀', desc: '金箍棒三打白骨，护师西行，纵被紧箍咒所伤亦不退缩。', req: { 战: 8 } },
    nidao: { id: 'nb_canpian', name: '齐天残念', icon: '🔆', desc: '第三棒收力听遗言，悟空得观音毫毛，紧箍现裂痕。', req: { 渡: 7, 战: 4 } } },
  { vol: '卷六·宝象国', zhengguo: { id: 'nb_longma', name: '龙马救主', icon: '🐎', desc: '白龙马化人形夜刺黄袍，救回取经人，甘愿为坐骑。', req: { 缘: 8 } },
    nidao: { id: 'nb_sibeng', name: '成全私奔', icon: '💞', desc: '点破天条虚伪，放奎木狼与百花羞公主私奔，得其星佩。', req: { 逆: 8 } } },
  { vol: '卷七·平顶山莲花洞', zhengguo: { id: 'nb_pingding', name: '平顶破法', icon: '🪄', desc: '以假乱真骗过双魔，借机夺宝，智取莲花洞。', req: { 夺: 10 } },
    nidao: { id: 'nb_duozhuo', name: '夺琢自用', icon: '💍', desc: '趁老君收牛，暗夺金刚琢，自此天下兵器皆可为我所用。', req: { 夺: 12, 渡: 5 } } },
  { vol: '卷八·乌鸡国', zhengguo: { id: 'nb_kujing', name: '枯井还阳', icon: '⛲', desc: '八戒背尸，井龙王相助，乌鸡国王复生，正道归位。', req: { 缘: 10 } },
    nidao: { id: 'nb_jinglong', name: '井龙议价', icon: '💰', desc: '与井龙王讨价还价，留印为凭，视国王性命如筹码。', req: { 逆: 10 } } },
  { vol: '卷九·号山火云洞', zhengguo: { id: 'nb_huoyun', name: '火云伏孩', icon: '🔥', desc: '硬抗三昧真火，力擒红孩儿，请观音收为善财童子。', req: { 战: 12 } },
    nidao: { id: 'nb_shancai', name: '善财归海', icon: '🌊', desc: '红孩儿未被收服，携三昧真火入海，助白龙逆鳞化形。', req: { 逆: 12, 缘: 8 } } },
  { vol: '卷十·黑水河', zhengguo: { id: 'nb_heishui', name: '黑水定鼍', icon: '🐉', desc: '借河伯之力收伏鼍龙，黑水河重归平静。', req: { 缘: 12 } },
    nidao: { id: 'nb_yuanzhu', name: '渊珠入海', icon: '🔵', desc: '念其血统之冤，纵归西海，避水珠进阶为渊珠，白龙得势。', req: { 逆: 12 } } },
  { vol: '卷十一·车迟国斗法', zhengguo: { id: 'nb_chechi', name: '斗法求雨', icon: '🌧', desc: '祈雨显神通，胜三仙，复兴佛法，僧众欢腾。', req: { 渡: 14 } },
    nidao: { id: 'nb_sanqing', name: '三清观毁', icon: '⛩', desc: '毁三清观，断道统，以童男童女血祭，证逆道之心。', req: { 逆: 14 } } },
  { vol: '卷十二·通天河', zhengguo: { id: 'nb_yulan', name: '鱼篮现身', icon: '🐟', desc: '观音持鱼篮收服灵感大王，童男童女得救，通天河安澜。', req: { 渡: 16 } },
    nidao: { id: 'nb_huangfeng', name: '谎封沉经', icon: '📜', desc: '诓骗老龟“封你千年”，经书沉河，得无字残页，逆道凭证。', req: { 逆: 16 } } },
  { vol: '卷十三·金兜山', zhengguo: { id: 'nb_jindou', name: '金兜伏牛', icon: '🐂', desc: '老子亲自收牛，金刚琢归天，众神归位。', req: { 渡: 18 } },
    nidao: { id: 'nb_duozhuo2', name: '夺琢自用', icon: '💍', desc: '趁老君收牛，暗夺金刚琢，自此套尽天下兵器。', req: { 夺: 20 } } },
  { vol: '卷十四·西梁女国', zhengguo: { id: 'nb_wenrou', name: '温柔西辞', icon: '👑', desc: '婉拒女王情深，温柔西辞，得锦襕袈裟胚，心如止水。', req: { 渡: 20 } },
    nidao: { id: 'nb_qiuzhong', name: '囚中悟囚', icon: '🔗', desc: '揭穿女王亦是国囚，点破“灵山像”虚妄，种下逆种。', req: { 逆: 20 } } },
  { vol: '卷十五·真假猕猴', zhengguo: { id: 'nb_zhenjia', name: '真假归位', icon: '🙏', desc: '如来定真假，悟空执金箍归位，六耳猕猴化为血水。', req: { 渡: 22 } },
    nidao: { id: 'nb_shuang', name: '双身齐天', icon: '🐒', desc: '悟空认六耳为另一可能，双身同体，齐天·大圣诞生。', req: { 逆: 22, 战: 15 } } },
  { vol: '卷十六·火焰山', zhengguo: { id: 'nb_sandiao', name: '三调芭蕉', icon: '🪭', desc: '三调力夺真扇，牛魔王被众神围困，铁扇公主无奈借扇。', req: { 战: 24 } },
    nidao: { id: 'nb_fuzhong', name: '腹中逼扇', icon: '🌀', desc: '变虫入铁扇公主腹中，逼扇而出，夺其法宝，断其香火。', req: { 夺: 24 } } },
  { vol: '卷十七·祭赛国', zhengguo: { id: 'nb_jinguang', name: '金光重耀', icon: '💎', desc: '二郎神助擒九头虫，舍利归塔，金光重耀，万民瞻仰。', req: { 缘: 24 } },
    nidao: { id: 'nb_sheli', name: '舍利归塔', icon: '🕯', desc: '夺回舍利，超度亡魂，舍利灯在手，愿力照破黑暗，不为苍生，只为己身。', req: { 逆: 24 } } },
  { vol: '卷十八·小雷音寺', zhengguo: { id: 'nb_jiafo', name: '假佛现形', icon: '🔔', desc: '弥勒佛笑收黄眉，假佛现形，小雷音寺重归清净。', req: { 渡: 26 } },
    nidao: { id: 'nb_duodai', name: '夺袋为用', icon: '👜', desc: '趁弥勒收童，暗夺人种袋，以假佛之法宝，行逆天之实事。', req: { 夺: 26 } } },
  { vol: '卷十九·稀柿衕', zhengguo: { id: 'nb_qijue', name: '七绝通路', icon: '🗡', desc: '力斩红蟒，开通七绝山路，百姓感念，立祠供奉。', req: { 战: 28 } },
    nidao: { id: 'nb_simang', name: '饲蟒超度', icon: '🍖', desc: '以食饲蟒，超度其千年饥魂，得绝山石，镇己之魔性。', req: { 渡: 26, 逆: 25 } } },
  { vol: '卷二十·朱紫国', zhengguo: { id: 'nb_xuansi', name: '悬丝回春', icon: '🌡', desc: '悬丝诊脉，医治国王，紫金铃入手，金圣宫娘娘归位。', req: { 缘: 28 } },
    nidao: { id: 'nb_zhuizui', name: '追罪问天', icon: '⚖', desc: '追诘“射伤神兽”之罚，取神兽羽，质问天庭不公。', req: { 逆: 28 } } },
  { vol: '卷二十一·盘丝黄花观', zhengguo: { id: 'nb_pansi', name: '盘丝破网', icon: '🕸', desc: '毗蓝婆收蜈蚣，破蛛丝网，黄花观毒雾消散，僧众得救。', req: { 渡: 30 } },
    nidao: { id: 'nb_wusheng', name: '无声过泉', icon: '💧', desc: '不战破丝，悄然西行，得濯垢泉眼，自解百毒，不染因果。', req: { 隐: 30 } } },
  { vol: '卷二十二·狮驼国', zhengguo: { id: 'nb_shishan', name: '尸山破阵', icon: '💀', desc: '四百里尸山，三魔连战，破阵而出，狮驼岭重见天日。', req: { 战: 32 } },
    nidao: { id: 'nb_gujia', name: '骨甲护身', icon: '🦴', desc: '以尸骨铸甲，自证不软，披挂上阵，直面大鹏之威。', req: { 逆: 32 } } },
  { vol: '卷二十三·比丘国', zhengguo: { id: 'nb_biqiu', name: '比丘破笼', icon: '🧒', desc: '力斩狐精，破童笼，一千一百一十一个童心得以归家。', req: { 战: 34 } },
    nidao: { id: 'nb_qianxin', name: '千心归家', icon: '🏡', desc: '一一送童归家，暖其惊魂，得童心玉，善缘深厚，却暗藏逆种。', req: { 渡: 32, 逆: 30 } } },
  { vol: '卷二十四·陷空山无底洞', zhengguo: { id: 'nb_tianwang', name: '天王收女', icon: '👼', desc: '李天王收鼠精为义女，松林救师，天庭威严得以维护。', req: { 缘: 34 } },
    nidao: { id: 'nb_yinü', name: '义女归正', icon: '🐭', desc: '收鼠精为徒，放其自新，得鼠须链，喂入八戒净坛。', req: { 逆: 34 } } },
  { vol: '卷二十五·灭法国', zhengguo: { id: 'nb_wanseng', name: '万僧得活', icon: '🛡', desc: '巧言化解，止杀僧令，万僧得活，灭法国重归祥和。', req: { 渡: 36 } },
    nidao: { id: 'nb_sengya', name: '僧压龙反', icon: '🐉', desc: '反剃王发，以“僧压龙”之梦反制，得僧压龙印，逆道凭证。', req: { 逆: 36 } } },
  { vol: '卷二十六·隐雾山', zhengguo: { id: 'nb_meihua', name: '梅花破计', icon: '🌸', desc: '碎瓣破计，力斩南山大王，隐雾山重归平静。', req: { 战: 38 } },
    nidao: { id: 'nb_cangfeng', name: '藏锋识破', icon: '🌙', desc: '识破分瓣梅花计，愿做树一刻，悟“藏锋”之境，得月华影。', req: { 隐: 38 } } },
  { vol: '卷二十七·凤仙郡祈雨', zhengguo: { id: 'nb_ganlin', name: '甘霖普降', icon: '🌧', desc: '建祠祈雨，甘霖普降，凤仙郡万民欢腾，感念佛恩。', req: { 渡: 40 } },
    nidao: { id: 'nb_zhoutian', name: '咒天夺骨', icon: '☁', desc: '咒天降灾，以旱骨为凭，夺凤仙郡雨权，控水自肥。', req: { 逆: 40 } } },
  { vol: '卷二十八·玉华州', zhengguo: { id: 'nb_bingqi', name: '兵器归主', icon: '⚔', desc: '力夺兵器，破黄狮精，兵器归位，玉华州武备重振。', req: { 战: 42 } },
    nidao: { id: 'nb_dingpa', name: '钉耙宴客', icon: '🍽', desc: '乔装赴钉耙会，窥得兵谱，盗取玉华州武备精华，以战养战。', req: { 夺: 42 } } },
  { vol: '卷二十九·青龙山玄英洞', zhengguo: { id: 'nb_xideng', name: '犀灯入夺', icon: '🏮', desc: '夺犀角灯，假佛亦照真信徒，以佛宝护佑正道。', req: { 夺: 44 } },
    nidao: { id: 'nb_jinping', name: '金平破犀', icon: '🐲', desc: '借四木禽星之力，擒杀三犀，取犀角炼制绝世兵器，以杀止杀。', req: { 战: 44 } } },
  { vol: '卷三十·天竺国', zhengguo: { id: 'nb_xingjun', name: '星君收兔', icon: '🌕', desc: '太阴星君收玉兔，真公主归位，天竺国复归太平。', req: { 渡: 46 } },
    nidao: { id: 'nb_yuetu', name: '月宫放兔', icon: '🐇', desc: '放玉兔归月宫，得玉兔粉，悟月宫孤冷，证逆道无情。', req: { 逆: 46 } } },
  { vol: '卷三十一·铜台府蒙冤', zhengguo: { id: 'nb_bianyuan', name: '辨冤复活', icon: '⚖', desc: '悟空辨冤，寇员外复活，铜台府印见证清白，正道昭彰。', req: { 渡: 48 } },
    nidao: { id: 'nb_guanyin', name: '官印追责', icon: '📛', desc: '查出真凶乃官府，直揭其恶，得官印，逆道投名状。', req: { 逆: 48 } } },
  { vol: '卷三十二·凌云渡', zhengguo: { id: 'nb_tuotai', name: '脱胎证道', icon: '🪷', desc: '坦然过渡，脱去凡胎，成圣起点，正果可期。', req: { 渡: 50 } },
    nidao: { id: 'nb_jiupi', name: '岸上旧皮', icon: '🐊', desc: '回头看岸，迟疑不渡，留岸上旧皮，混世魔王凭证。', req: { 逆: 50 } } },
  { vol: '卷三十三·归途最后一难', zhengguo: { id: 'nb_shijing', name: '通天河湿经', icon: '🌊', desc: '通天河遇鼋，经书湿透，得残缺真经，悟“不完美”之真谛。', req: { 渡: 52 } },
    nidao: { id: 'nb_fenjing', name: '焚尽难簿', icon: '🔥', desc: '灵山无字碑前，焚尽八十一难簿，逆改天命，唯我独尊。', req: { 逆: 52 } } },
];
// 扁平化：所有难簿劫难成就（含正果/逆道），便于按 id 查、按卷渲染
NDX.NANBU_ALL = [];
NDX.NANBU.forEach((vol) => {
  NDX.NANBU_ALL.push(Object.assign({ side: '正果', vol: vol.vol }, vol.zhengguo));
  NDX.NANBU_ALL.push(Object.assign({ side: '逆道', vol: vol.vol }, vol.nidao));
});
// 「分卷难簿功名」：每历尽一卷全部劫难（1-20/21-40/41-60/61-81）即解锁的卷成就，
// 提供永久微量全局加成（由 globalAchBonus 自动注入）。新增于原六道命数成就之外，
// 落实「每完成一卷劫难解锁对应卷难簿成就」的双向联动需求。
NDX.VOLUME_ACH = [
  { id: 'nanbu_vol1', name: '一卷功名·金蝉遭贬', icon: '📜', vol: '卷一·金蝉遭贬', desc: '历尽第一卷二十难，难簿初录，永久微量加成生效。', req: { trials: [1, 20] }, stat: { hp: 10, atk: 2 } },
  { id: 'nanbu_vol2', name: '二卷功名·双叉鹰愁', icon: '📜', vol: '卷二·双叉岭与鹰愁涧', desc: '历尽第二卷二十难，难簿渐丰，永久微量加成生效。', req: { trials: [21, 40] }, stat: { hp: 12, matk: 3 } },
  { id: 'nanbu_vol3', name: '三卷功名·灵山渐近', icon: '📜', vol: '卷三·观音禅院起', desc: '历尽第三卷二十难，难簿煌煌，永久微量加成生效。', req: { trials: [41, 60] }, stat: { hp: 15, atk: 3, matk: 3 } },
  { id: 'nanbu_vol4', name: '四卷功名·灵山在望', icon: '📜', vol: '卷四·万寿山起', desc: '历尽第四卷全部劫难，难簿大成，永久微量加成生效。', req: { trials: [61, 81] }, stat: { hp: 20, atk: 5, matk: 5 } },
];
NDX.VOLUME_ACH.forEach((a) => NDX.NANBU_ALL.push(Object.assign({ side: '卷功名', vol: a.vol }, a)));
NDX.NANBU_BY_ID = {};
NDX.NANBU_ALL.forEach((a) => { NDX.NANBU_BY_ID[a.id] = a; });

// D2 统计：当前存档已解锁的逆道难簿数量（用于真·逆道终职前置门槛）。
// 取自跨周目历史并集 loadAch()（与 _syncAch 写入口径一致）。
NDX.countEvilNanbu = function (s) {
  const got = (NDX.loadAch && NDX.loadAch()) || (s && s.achievements) || [];
  const set = new Set(got);
  return NDX.NANBU_ALL.filter((a) => a.side === '逆道' && set.has(a.id)).length;
};

// ============================================================
// 收集型长线·模块1：劫难成就图鉴 → 永久微量全局属性
// 设计：每解锁一个「逐难成就」（难簿正果/逆道），即视为一种「永久功名」，
//   为所有英雄、所有周目注入微量全局加成（体攻/气血/法伤/法防/减伤）。
//   机制差异而非数值膨胀：加成极微（每难 +1.2 攻 / +6 气血 / +0.6% 法伤 …），
//   封顶 81 难成就，确保长线玩家有「哪怕不打长局也能刷的小目标」，但不会被数值压垮。
//   读取：NDX.globalAchBonus() —— 在 applyStart 与 stats 面板注入。
// ============================================================
NDX.ACH_BONUS_PER = { atk: 1.2, hp: 6, matk: 0.9, mdef: 0.004, dr: 0.002 };
// 难簿成就总数（正果+逆道）即封顶
NDX.ACH_BONUS_CAP = NDX.NANBU_ALL.length;
// 软上限·边际递减：难簿逐难永久加成不无限堆叠。
//   SOFT_CUT 前每项全量；超出部分按 SOFT_TAIL 折算（线性递减），封顶后仍有成长感但不再膨胀。
NDX.ACH_SOFT_CUT = 40;   // 前 40 项难簿逐难（约前两台卷）100% 生效
NDX.ACH_SOFT_TAIL = 0.5; // 超出部分每项按 50% 计入，越往后越不划算但仍可叠加
NDX.VOLUME_ACH_STAT = function (idList) {
  // 卷功名设计的专属 stat（hp/atk/matk）此前从未单独生效——这里把它补齐，
  // 四卷功名是里程碑、天然少量，不参与难簿软上限，依旧全额（见 globalAchBonus 合并）。
  const got = new Set(idList);
  let hp = 0, atk = 0, matk = 0;
  (NDX.VOLUME_ACH || []).forEach((a) => { if (got.has(a.id)) { hp += a.stat.hp || 0; atk += a.stat.atk || 0; matk += a.stat.matk || 0; } });
  return { hp, atk, matk };
};
NDX.globalAchBonus = function () {
  const ach = NDX.loadAch() || [];
  // 难簿逐难永久功名来源：正果/逆道（nb_ 前缀）——此前误用 nanbu_ 前缀导致置空，故重写。
  const nbIds = ach.filter((id) => id.indexOf('nb_') === 0);
  const n = Math.min(nbIds.length, NDX.ACH_BONUS_CAP);
  // 软上限·边际递减：effective 为「等效已生效项数」
  const eff = n <= NDX.ACH_SOFT_CUT ? n : NDX.ACH_SOFT_CUT + (n - NDX.ACH_SOFT_CUT) * NDX.ACH_SOFT_TAIL;
  const b = NDX.ACH_BONUS_PER;
  const vs = NDX.VOLUME_ACH_STAT(ach.filter((id) => id.indexOf('nanbu_vol') === 0));
  return {
    count: n,
    effective: +eff.toFixed(2),
    soft: { cut: NDX.ACH_SOFT_CUT, tail: NDX.ACH_SOFT_TAIL },
    cap: NDX.ACH_BONUS_CAP,
    // 难簿逐难（按软上限折算）+ 卷功名里程碑（全额、天然少量）
    ti: { atk: +(b.atk * eff).toFixed(1) + (vs.atk || 0), hp: Math.round(b.hp * eff) + (vs.hp || 0), dr: +(b.dr * eff).toFixed(4) },
    yuan: { matk: +(b.matk * eff).toFixed(1) + (vs.matk || 0), mdef: +(b.mdef * eff).toFixed(4) },
  };
};

// ============================================================
// 收集型长线·模块2：英雄藏品库（跨周目持久化）
// 设计：每位英雄有两类「本命藏品」——本命红装(setTier>=3)、专属法宝(treasure & owner=该英雄)。
// 局内累计获得即登记入永久藏品库；集齐该英雄两类全部藏品即解锁英雄传记。
//   机制目标：「哪怕不打长局，也能刷装备、补收集」——碎片化小目标持续吸引上线。
// V8.6x 命痕并入劫印：命痕本不参与藏品收集，`fates` 收藏维度已随命痕系统移除。
// ============================================================
NDX.COLLECTION_KEY = NDX.storage.KEYS.COLLECTION; // V8.26 统一存储层
NDX.loadCollection = function () {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  return NDX.SaveSystem.load(NDX.COLLECTION_KEY, {});
};
NDX.saveCollection = function (col) {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  NDX.SaveSystem.save(NDX.COLLECTION_KEY, col);
};
// 将一局结束时的装备/法宝 登记入永久藏品库（按英雄归档案）
NDX.recordCollection = function (heroId, s) {
  const col = NDX.loadCollection();
  const entry = col[heroId] || { redEquips: {}, treasures: {} };
  (s.equips || []).forEach((e) => {
    const isRed = NDX.isRedEquip(e);
    if (isRed && e.id) entry.redEquips[e.id] = true;
    if (e.treasure && e.treasureId) entry.treasures[e.treasureId] = true;
  });
  col[heroId] = entry;
  NDX.saveCollection(col);
  return entry;
};
// 英雄专属套装名（EQUIP_POOL 中 set 字段值），用于匹配「本命红装」（复用既有 HERO_SET_KEY）
NDX.HERO_SET_NAME = NDX.HERO_SET_KEY || {
  wukong: '悟空', tangseng: '取经人', bajie: '八戒', xiaobailong: '龙马', shaseng: '沙僧',
};
// 计算某英雄藏品库「已收集 / 应收集」清单（供 UI 渲染 + 传记解锁判定）
NDX.collectionSummary = function (heroId) {
  const col = NDX.loadCollection()[heroId] || { redEquips: {}, treasures: {} };
  const heroSet = NDX.HERO_SET_NAME[heroId];
  // 本命红装：setTier>=3 的「该英雄专属套」成品（set 字段匹配），不含通用盘缠套等
  const redEquips = (NDX.EQUIP_POOL || []).filter((e) => NDX.isRedEquip(e, heroSet));
  // 专属法宝：owner === 该英雄（含凡品/成品，按 treasureId 去重只计 1）
  const treasures = (NDX.EQUIP_POOL || []).filter((e) => e.treasure && e.owner === heroId);
  const seenTre = {};
  const treList = treasures.filter((e) => { if (seenTre[e.treasureId]) return false; seenTre[e.treasureId] = true; return true; });
  const redGot = redEquips.filter((e) => col.redEquips[e.id]).map((e) => e.name);
  const treGot = treList.filter((e) => col.treasures[e.treasureId]).map((e) => e.name);
  const total = redEquips.length + treList.length;
  const owned = redGot.length + treGot.length;
  return {
    redEquips, treasures: treList,
    redGot, treGot,
    total, owned,
    complete: total > 0 && owned >= total,
  };
};

// ============================================================
// 收集型长线·模块4：业藏录（无怒气版 · 全系统闭环）
// 设计：全新跨英雄收藏维度（妖魔拓印 / 佛经碎片 / 五人传记 / 天庭神将），
//   加成注入 NDX._collBonus（与轮回殿赐福、成就加成同池，由 stats()/combat 读取）。
//   资源闭环：图鉴领混元点 -> 轮回殿淬炼 -> 天道劫产出图鉴素材。
//   独立 localStorage key，不破坏任何旧档。
// ============================================================
NDX.YEZANGLU_KEY = NDX.storage.KEYS.YEZANGLU; // V8.26 统一存储层
NDX.loadYezanglu = function () {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  return NDX.SaveSystem.load(NDX.YEZANGLU_KEY, {});
};
NDX.saveYezanglu = function (obj) {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  NDX.SaveSystem.save(NDX.YEZANGLU_KEY, obj || {});
};
// 取出/创建业藏录归档结构（兼容旧档：缺失字段自动补默认）
NDX.yezangluState = function () {
  const o = NDX.loadYezanglu();
  o.rubMon = o.rubMon || [];        // 怪物拓印 id 列表（妖魔类 + 大妖类 + 天庭类）
  o.sutra = o.sutra || [];          // 佛经碎片 id 列表（与 save.sutraFrags 同步）
  o.bio = o.bio || {};              // { bioId: true } 已阅传记
  o.claimed = o.claimed || [];      // 已领取奖励 key（防重复）
  o.groupProgress = o.groupProgress || {};
  NDX.saveYezanglu(o);
  return o;
};

// 业藏录专属「业障纪事」文案（五英雄隐藏传记，与英雄藏品库传记区分）
NDX.YEZANG_BIOGRAPHY = {
  yz_wukong: {
    hero: 'wukong', name: '孙悟空・纪事',
    desc: '灵明石猿，齐天大圣，西行护法。',
    text: '金箍未曾束缚肉身，真正困住他的是「齐天」这二字的重量。他在五行山下五百年，不是在悔过，而是在数算天庭的罪孽。每一道紧箍的裂纹，都是他向天道发起的一次诘问。他以为护取经人取经能证道，却不知自己才是那卷最难念的经，也是唯一能写经的笔。',
  },
  yz_tangseng: {
    hero: 'tangseng', name: '取经人・纪事',
    desc: '金蝉子转世，肉眼凡胎，十世修行。',
    text: '他被贬下界时，不是罚，是赌。佛赌他还会不会信，他赌佛还配不配信。十世不昧的元神，每一次濒死都悄悄磨亮。取经于他，是把「佛要的取经人」渡成「自己的取经人」——这一难，他才是执笔人。',
  },
  yz_bajie: {
    hero: 'bajie', name: '猪八戒・纪事',
    desc: '天蓬元帅贬下凡尘，贪嗔痴俱全。',
    text: '他扛着九齿钉耙，也扛着前世未消的天河。世人笑他好色贪吃，却不知他比谁都懂「放下」二字的重量——因为他放下了整个天庭，才换来这副贪嗔的皮囊。他的懒，是对宿命最温柔的反抗。',
  },
  yz_shaseng: {
    hero: 'shaseng', name: '沙僧・纪事',
    desc: '卷帘大将贬流沙河，沉默寡言。',
    text: '他在流沙河底数过自己的骷髅，每一颗都是被贬的自己。沉默不是无话，是话已说尽。他挑着担，也挑着一队人的体面——当所有人都在闹、在悟、在叛，只有他始终把「师徒」二字，稳稳放在肩上。',
  },
  yz_bailong: {
    hero: 'xiaobailong', name: '白龙马・纪事',
    desc: '西海龙王三太子，化身白马。',
    text: '他不是坐骑，是甘愿。一条龙屈身为马，驮着取经人走过十万八千里，马蹄下压着的是整个西海的骄傲与认罪。无人听他嘶鸣，他却把每一声喘息，都化作了渡人的蹄声。',
  },
};

// 怪物拓印定义：id -> 名称/简介（小妖、大妖、天庭分三类，但统一存 rubMon 列表）
NDX.MONSTER_RUBBING = {
  // —— 山野妖魔录（yaomo_fan）——
  mb_baigu: { name: '白骨夫人', desc: '白虎岭尸魔，三戏取经人，化作村姑老妪老翁。', group: 'yaomo_fan' },
  mb_heixiong: { name: '黑熊精', desc: '黑风山修仙黑熊，盗袈裟，善禅机。', group: 'yaomo_fan' },
  mb_huangfeng: { name: '黄风怪', desc: '黄风岭貂鼠，三昧神风吹瞎悟空。', group: 'yaomo_fan' },
  mb_chijiu: { name: '赤脚大仙部下·醉汉', desc: '蟠桃会醉仙，误放妖星。', group: 'yaomo_fan' },
  mb_xiaoyao: { name: '小妖喽啰', desc: '山野无名小妖，持叉巡山。', group: 'yaomo_fan' },
  mb_luoli: { name: '罗刹女婢', desc: '芭蕉洞侍女，掌扇窃语。', group: 'yaomo_fan' },
  // —— 大妖魔君谱（yaojun_wang）——
  mb_niumo: { name: '牛魔王', desc: '平天大圣，火焰山主，悟空结拜兄长。', group: 'yaojun_wang' },
  mb_dapeng: { name: '大鹏金翅雕', desc: '狮驼岭之主，翼遮日月，啖食众生。', group: 'yaojun_wang' },
  mb_baigujing: { name: '九尾狐', desc: '压龙洞老狐，假佛降妖。', group: 'yaojun_wang' },
  mb_elkj: { name: '二郎神犬·哮天', desc: '细犬化妖，随主猎圣。', group: 'yaojun_wang' },
  mb_hong_hai: { name: '红孩儿', desc: '圣婴大王，三昧真火，号山为王。', group: 'yaojun_wang' },
  mb_hei_li: { name: '黑水河鼍龙', desc: '西海龙族旁支，霸水为患。', group: 'yaojun_wang' },
  // —— 天庭诸神图（tianting_gods）——
  mb_juling: { name: '巨灵神', desc: '天庭先锋，掌托塔，力可撼山。', group: 'tianting_gods' },
  mb_erlang: { name: '二郎神', desc: '显圣真君，天庭战神，性傲不逊。', group: 'tianting_gods' },
  mb_tuota: { name: '托塔李天王', desc: '天庭兵马大元帅，执玲珑塔。', group: 'tianting_gods' },
  mb_nezha: { name: '哪吒三太子', desc: '莲花化身，风火轮烈，斩妖先锋。', group: 'tianting_gods' },
  mb_leigong: { name: '雷部众将', desc: '三十六雷将，奉旨行雷。', group: 'tianting_gods' },
  mb_tudi: { name: '土地公', desc: '一方地祇，知尽山野妖踪。', group: 'tianting_gods' },
};

// 佛经碎片定义（sutra_fragments）：复用既有 save.sutraFrags（碎片列表，id:count）
// 取既有碎片 id 中具代表性的 7 部佛经各取中段，作为图鉴收集目标（可达且覆盖六道）
NDX.YEZANG_SUTRA_IDS = [
  'su_jingang_1', 'su_xinjing_1', 'su_fahua_1', 'su_huayan_1',
  'su_lengyan_1', 'su_amituo_1', 'su_dabei_1',
];

// 五组图鉴定义（无怒气版 · 加成类型对齐现有战斗字段）
NDX.collectionGroups = [
  {
    id: 'yaomo_fan', name: '山野妖魔录', icon: '🐺',
    type: 'rubMon', group: 'yaomo_fan',
    desc: '白骨、黑熊等小妖拓印。拼凑山野间的残暴与可怜。',
    bonus: { dmgTaken: 0.05, tough: 0.05 },   // 受击伤害降低5% / 韧性(抗打断)提升5%
    rewards: { milestone: [0.25, 0.5, 0.75], milestoneHunyuan: [5, 10, 15], completeHunyuan: 30, completeSpecial: null },
  },
  {
    id: 'yaojun_wang', name: '大妖魔君谱', icon: '👑',
    type: 'rubMon', group: 'yaojun_wang',
    desc: '牛魔、大鹏等 BOSS 拓印。记录那些差点掀翻西行的存在。',
    bonus: { dmgBoss: 0.05, breakEff: 0.08 },  // 对BOSS伤害+5% / 破韧效率+8%
    rewards: { milestone: [0.25, 0.5, 0.75], milestoneHunyuan: [8, 15, 25], completeHunyuan: 50, completeSpecial: null },
  },
  {
    id: 'biography_5', name: '西行师徒纪事', icon: '📜',
    type: 'biography',
    desc: '五人隐藏传记。阅读即拼凑真相。',
    bonus: { cdRed: 0.05, miGain: 0.10 },       // 法宝冷却缩减5% / 混元点获取+10%
    rewards: { milestone: [0.25, 0.5, 0.75], milestoneHunyuan: [5, 10, 20], completeHunyuan: 40, completeSpecial: 'lunhui_hidden_text' },
  },
  {
    id: 'sutra_fragments', name: '佛经残篇集', icon: '🕉',
    type: 'sutra',
    desc: '各类佛经碎片。正道的低语。',
    bonus: { orderMultAdd: 0.05, healBoost: 0.05 }, // 秩序赐福效果+5% / 受治疗提升5%
    rewards: { milestone: [0.25, 0.5, 0.75], milestoneHunyuan: [5, 10, 15], completeHunyuan: 30, completeSpecial: null },
  },
  {
    id: 'tianting_gods', name: '天庭诸神图', icon: '⚡',
    type: 'rubMon', group: 'tianting_gods',
    desc: '巨灵神、二郎神等天将拓印。天道劫的宿敌。',
    bonus: { dmgTianting: 0.05, karmaSpeed: 0.10 }, // 对天庭单位+5% / 业障积累速度+10%(逆道)
    rewards: { milestone: [0.25, 0.5, 0.75], milestoneHunyuan: [10, 20, 30], completeHunyuan: 50, completeSpecial: 'tianjie_shard' },
  },
];
// 各组的收集项列表（按 type 从定义中取）
NDX._collEntries = function (g) {
  if (g.type === 'rubMon') return Object.keys(NDX.MONSTER_RUBBING).filter((id) => NDX.MONSTER_RUBBING[id].group === g.group);
  if (g.type === 'sutra') return NDX.YEZANG_SUTRA_IDS.slice();
  if (g.type === 'biography') return Object.keys(NDX.YEZANG_BIOGRAPHY);
  return [];
};

// 缓存对象：图鉴加成（由 stats()/combat 读取）
NDX._collBonus = {
  dmgBoss_coll: 0, dmgTaken_coll: 0, breakEff_coll: 0, tough_coll: 0,
  cdRed_coll: 0, miGain_coll: 0, orderMultAdd_coll: 0, healBoost_coll: 0,
  dmgTianting_coll: 0, karmaSpeed_coll: 0,
};

// 成套判定：刷新各 groupProgress + 全局加成
NDX.syncYezanglu = function () {
  const yz = NDX.yezangluState();
  const sutra = NDX.loadSutraFrags();
  for (const g of NDX.collectionGroups) {
    const entries = NDX._collEntries(g);
    const total = entries.length;
    let owned = 0;
    for (const id of entries) {
      if (g.type === 'rubMon' && yz.rubMon.indexOf(id) >= 0) owned++;
      else if (g.type === 'sutra' && (sutra[id] > 0)) owned++;
      else if (g.type === 'biography' && yz.bio[id]) owned++;
    }
    yz.groupProgress[g.id] = { owned, total, complete: total > 0 && owned >= total };
  }
  NDX.saveYezanglu(yz);
  NDX.refreshCollectionBonus();
  return yz;
};

// 刷新全局加成缓存
NDX.refreshCollectionBonus = function () {
  const b = NDX._collBonus;
  b.dmgBoss_coll = 0; b.dmgTaken_coll = 0; b.breakEff_coll = 0; b.tough_coll = 0;
  b.cdRed_coll = 0; b.miGain_coll = 0; b.orderMultAdd_coll = 0; b.healBoost_coll = 0;
  b.dmgTianting_coll = 0; b.karmaSpeed_coll = 0;
  b.collCompleteGroups = 0;
  const yz = NDX.yezangluState();
  // 业藏录各机制的「字段级防御性软上限」：图鉴属离散成套（bonus 字段互斥、单组最高 ≤10%），
  //   正常 5 组全齐的累计值都远低于阈值，故不会主动削减任何收益；
  //   阈值仅为「未来增组的保险」——一旦新增组使某字段突破，超充部分才按 SOFT_TAIL 折算，防止无限堆叠。
  //   阈值 = 当前理论最大累计值（含预留余量）。
  const cap = {
    dmgBoss: 0.30, dmgTaken: -0.30, breakEff: 0.30, tough: 0.30,
    cdRed: 0.40, miGain: 0.30, orderMultAdd: 0.30, healBoost: 0.30,
    dmgTianting: 0.30, karmaSpeed: 0.40,
  };
  const soft = (v, max) => (max == null || Math.abs(v) <= Math.abs(max)) ? v : (max > 0 ? max + (v - max) * NDX.ACH_SOFT_TAIL : max + (Math.abs(v) - Math.abs(max)) * NDX.ACH_SOFT_TAIL * -1);
  for (const g of NDX.collectionGroups) {
    const prog = yz.groupProgress[g.id];
    if (!prog || !prog.complete) continue;
    b.collCompleteGroups++;
    const gb = g.bonus || {};
    b.dmgBoss_coll = soft(b.dmgBoss_coll + (gb.dmgBoss || 0), cap.dmgBoss);
    b.dmgTaken_coll = soft(b.dmgTaken_coll + (gb.dmgTaken || 0), cap.dmgTaken);       // 负值=减伤（实际注入时用减号，见 combat）
    b.breakEff_coll = soft(b.breakEff_coll + (gb.breakEff || 0), cap.breakEff);
    b.tough_coll = soft(b.tough_coll + (gb.tough || 0), cap.tough);
    b.cdRed_coll = soft(b.cdRed_coll + (gb.cdRed || 0), cap.cdRed);
    b.miGain_coll = soft(b.miGain_coll + (gb.miGain || 0), cap.miGain);
    b.orderMultAdd_coll = soft(b.orderMultAdd_coll + (gb.orderMultAdd || 0), cap.orderMultAdd);
    b.healBoost_coll = soft(b.healBoost_coll + (gb.healBoost || 0), cap.healBoost);
    b.dmgTianting_coll = soft(b.dmgTianting_coll + (gb.dmgTianting || 0), cap.dmgTianting);
    b.karmaSpeed_coll = soft(b.karmaSpeed_coll + (gb.karmaSpeed || 0), cap.karmaSpeed);
  }
};

// 添加怪物拓印（战斗掉落调用）：去重并入
NDX.addMonsterRubbing = function (id) {
  if (!NDX.MONSTER_RUBBING[id]) return false;
  const yz = NDX.yezangluState();
  if (yz.rubMon.indexOf(id) >= 0) return false;
  yz.rubMon.push(id);
  NDX.saveYezanglu(yz);
  NDX.syncYezanglu();
  return true;
};
// 添加佛经碎片到图鉴（与 save.sutraFrags 同步）
NDX.addSutraYezang = function (id) {
  const f = NDX.sutraFragById(id);
  if (!f) return false;
  const sf = NDX.loadSutraFrags();
  if (sf[id] > 0) { NDX.syncYezanglu(); return false; }
  sf[id] = 1;
  NDX.saveSutraFrags(sf);
  NDX.syncYezanglu();
  return true;
};
// 阅读传记：标记已阅，重算成套
NDX.readBiography = function (bioId) {
  const yz = NDX.yezangluState();
  if (yz.bio[bioId]) return { ok: false, msg: '已阅' };
  yz.bio[bioId] = true;
  NDX.saveYezanglu(yz);
  NDX.syncYezanglu();
  return { ok: true, msg: '纪事解锁' };
};
// 领取图鉴奖励：mode='complete' | 'milestone'(idx)
NDX.claimCollectionReward = function (groupId, mode, idx) {
  const yz = NDX.yezangluState();
  const g = NDX.collectionGroups.find((x) => x.id === groupId);
  if (!g) return { ok: false, msg: '未知图鉴' };
  const prog = yz.groupProgress[groupId] || { owned: 0, total: 1, complete: false };
  const key = mode === 'complete' ? groupId + '_complete' : groupId + '_ms_' + idx;
  if (yz.claimed.indexOf(key) >= 0) return { ok: false, msg: '已领取' };
  if (mode === 'complete') {
    if (!prog.complete) return { ok: false, msg: '尚未集齐' };
    NDX.addMiPoints(g.rewards.completeHunyuan || 0);
    if (g.rewards.completeSpecial === 'lunhui_hidden_text') NDX._unlockLunhuiHiddenText();
    if (g.rewards.completeSpecial === 'tianjie_shard') NDX._unlockTianJieShard();
  } else {
    const ratio = prog.total > 0 ? prog.owned / prog.total : 0;
    if (ratio < g.rewards.milestone[idx]) return { ok: false, msg: '进度未达标' };
    NDX.addMiPoints(g.rewards.milestoneHunyuan[idx] || 0);
  }
  yz.claimed.push(key);
  NDX.saveYezanglu(yz);
  return { ok: true, msg: '业力归位' };
};
// 解锁轮回殿隐藏文本（五人传记集齐）
NDX._unlockLunhuiHiddenText = function () {
  const yz = NDX.yezangluState();
  yz.lunhuiHidden = true;
  NDX.saveYezanglu(yz);
};
// 解锁天道劫开局随机神装碎片（天庭图集齐）
NDX._unlockTianJieShard = function () {
  const yz = NDX.yezangluState();
  yz.tianjieShard = true;
  NDX.saveYezanglu(yz);
};

// 英雄传记：集齐该英雄三类藏品即解锁（碎片化解锁，持续刺激收集）
NDX.HERO_BIOGRAPHY = {
  wukong: {
    title: '《齐天列传》',
    text: '花果山一石迸裂，生出个不服天管的猴子。他闹过龙宫、反过天庭，被压五行山五百年，终究自己杠着金箍棒上了西行路。\n\n世人说他野，他说这世道本就该自己走。八十一难簿上没有他的名字——因为他把名字，刻在了每一根妖骨上。',
  },
  tangseng: {
    title: '《金蝉本纪》',
    text: '金蝉子十世修行，第十世投了取经人。他肉眼凡胎，却有一副不肯糊涂的心肠。\n\n世人只道他啰嗦软弱，不知那十世不昧的元神，早在每一次濒死里悄悄磨亮。西行于他，不是取经，是把自己从「佛要的取经人」渡成「自己的取经人」。',
  },
  bajie: {
    title: '《天蓬遗事》',
    text: '他曾是掌管天河水军的天蓬元帅，因醉戏嫦娥贬下凡尘，错投猪胎。钉耙在手，贪嗔未泯，却也最懂人间烟火。\n\n八戒不是懒，是看透了——既然西天未必真有经，不如吃好每一顿、护好身边人。他的传记，是一卷未写完的「将功折罪」。',
  },
  xiaobailong: {
    title: '《龙马行藏》',
    text: '西海龙王三太子，因纵火烧殿上明珠获罪，险些问斩。被观音点化，化作白马驮取经人西行。\n\n他不常言语，逆鳞却始终向着妖风。龙子变马，是罚也是渡——蹄痕所至，皆是未说出口的「我也在修行」。',
  },
  shaseng: {
    title: '《卷帘沉沙》',
    text: '卷帘大将，因打碎琉璃盏被贬流沙河，每七日受飞剑穿胸。他沉默、沉稳，是队伍里最不显眼的那一个。\n\n沙僧的传记写满了「忍」。他挨过的打、反震回去的伤，都成了西行路上最稳的锚。不动如山，方载得动这一路。',
  },
};

// 周目计数（跨周目持久化）：首周目=1，通关/重开后 +1。V8.16 起逆道一周目即可开启。
NDX.CYCLE_KEY = NDX.storage.KEYS.CYCLE; // V8.26 统一存储层
NDX.getCycle = function () {
  if (NDX.SaveSystem && typeof NDX.SaveSystem.loadNumber === 'function') {
    return NDX.SaveSystem.loadNumber(NDX.CYCLE_KEY, 1);
  }
  // 降级：统一存储层兜底（不再直接使用 localStorage）
  return parseInt(NDX.storage.load(NDX.CYCLE_KEY) || '1', 10) || 1;
};
NDX.bumpCycle = function () {
  const c = NDX.getCycle() + 1;
  if (NDX.SaveSystem && typeof NDX.SaveSystem.saveNumber === 'function') {
    NDX.SaveSystem.saveNumber(NDX.CYCLE_KEY, c);
  } else {
    NDX.storage.save(NDX.CYCLE_KEY, c);
  }
  return c;
};
NDX.resetCycle = function () {
  if (NDX.SaveSystem && typeof NDX.SaveSystem.saveNumber === 'function') {
    NDX.SaveSystem.saveNumber(NDX.CYCLE_KEY, 1);
  } else {
    NDX.storage.save(NDX.CYCLE_KEY, 1);
  }
};

// 判断某成就 req 是否满足（fate=六道业力值；cycle=当前周目）
// 返回 {ok, why}：ok=false 时 why 为「需【战】≥8，当前 5」之类提示
NDX.reqMet = function (req, fate, cycle, ctx) {
  fate = fate || {};
  cycle = cycle || 1;
  if (req == null) return { ok: true };
  if (req === 'cycle2') {
    // V8.16 取消善恶固定路线：逆道成就不再要求二周目，一周目即可解锁
    return { ok: true };
  }
  if (Array.isArray(req)) {
    for (const sub of req) { const r = NDX.reqMet(sub, fate, cycle, ctx); if (!r.ok) return r; }
    return { ok: true };
  }
  // 卷完成门槛 {trials:[lo,hi]}：需历尽该卷全部劫难（trialsPassed 覆盖 lo..hi）
  if (req.trials && Array.isArray(req.trials)) {
    const [lo, hi] = req.trials;
    const passed = (ctx && ctx.trialsPassed) || [];
    for (let d = lo; d <= hi; d++) {
      if (!passed.some((t) => t.diff === d)) return { ok: false, why: `需历尽第${lo}-${hi}难（尚缺第${d}难）` };
    }
    return { ok: true };
  }
  // 单门槛对象 {道:值}
  for (const dao of Object.keys(req)) {
    if (dao === 'trials') continue;
    const need = req[dao];
    const cur = fate[dao] || 0;
    if (cur < need) return { ok: false, why: `需【${dao}】≥${need}，当前 ${cur}` };
  }
  return { ok: true };
};

// 成就持久化（跨周目历史并集）
NDX._achKey = NDX.storage.KEYS.ACHIEVEMENTS;
NDX.loadAch = function () {
  // V8.40 通过统一模块NDX.SaveSystem读取，带错误处理
  if (NDX.SaveSystem && typeof NDX.SaveSystem.load === 'function') {
    const data = NDX.SaveSystem.load(NDX._achKey, []);
    return Array.isArray(data) ? data : [];
  }
  // 降级：统一存储层兜底（不再直接使用 localStorage）
  try {
    const raw = NDX.storage.load(NDX._achKey);
    if (raw && Array.isArray(raw)) return raw;
  } catch (e) {}
  return [];
};
NDX.saveAch = function (arr) {
  // V8.40 通过统一模块NDX.SaveSystem保存，带错误处理
  if (NDX.SaveSystem && typeof NDX.SaveSystem.save === 'function') {
    NDX.SaveSystem.save(NDX._achKey, arr || []);
    return arr || [];
  }
  // 降级：统一存储层兜底（不再直接使用 localStorage）
  try { NDX.storage.save(NDX._achKey, arr || []); } catch (e) {}
  return arr || [];
};
// 已历难号记录（难簿长卷地图用）：玩家走过的每一难编号 1-81，持久化于 _gstate
NDX._clearedKey = NDX.storage.KEYS.CLEARED_DIFFS;
NDX.loadClearedDiffs = function () {
  // V8.40 通过统一模块NDX.SaveSystem读取，带错误处理
  if (NDX.SaveSystem && typeof NDX.SaveSystem.load === 'function') {
    const data = NDX.SaveSystem.load(NDX._clearedKey, []);
    return Array.isArray(data) ? data : [];
  }
  // 降级：统一存储层兜底（不再直接使用 localStorage）
  try { const a = NDX.storage.load(NDX._clearedKey); return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
};
NDX.markDiffCleared = function (diff) {
  const d = Math.round(diff || 0);
  if (d < 1) return;
  const arr = NDX.loadClearedDiffs();
  if (arr.indexOf(d) < 0) { arr.push(d); NDX.saveClearedDiffs(arr); }
};
NDX.saveClearedDiffs = function (arr) {
  // V8.40 通过统一模块NDX.SaveSystem保存，带错误处理
  if (NDX.SaveSystem && typeof NDX.SaveSystem.save === 'function') {
    NDX.SaveSystem.save(NDX._clearedKey, arr || []);
    return arr || [];
  }
  // 降级：统一存储层兜底（不再直接使用 localStorage）
  try { NDX.storage.save(NDX._clearedKey, arr || []); } catch (e) {}
  return arr || [];
};
