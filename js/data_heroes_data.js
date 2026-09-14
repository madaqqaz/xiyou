// =============================================================
// data_heroes_data.js — 《逆道西行》英雄数据 · HEROES/CHAR_PORTRAITS/小说段落
// 从 data.js 拆分（2026-08-31）：独立维护英雄数据与立绘映射
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// focus 文字标注侧重点
NDX.HEROES = {
  wukong: {
    id: 'wukong', name: '孙悟空', portrait: 'img/portraits/heroes/wukong.webp',
    evolvePortraits: { base: 'img/portraits/heroes/wukong.webp', evil: 'img/portraits/heroes/wukong_evil.webp', tier1: 'img/portraits/heroes/wukong_tier1.webp', tier2: 'img/portraits/heroes/wukong_tier2.webp', final: 'img/portraits/heroes/wukong_final.webp', hidden: 'img/portraits/heroes/wukong_hidden.webp' },
    form: '齐天大圣·狂放', form0: '小猴子', symbol: '金箍', focus: '体·物伤·破甲', sys: 'ti',
    // 初始「送行礼」：不再开局赐予，改为历经特定劫难(见 initTrial)后，进入问号随机事件「送行」获得。
    // 悟空：两界山脱困(第2难)后，观音暗赠——天命棍胚 + 草裙 + 救命毫毛(法宝)
    initGiftEquips: ['tm_w_base', 'wk_caogun', 'wk_crown_base', 'wk_boots_fan'], initGiftTreasure: 'jiuming', initTrial: 2,
    baseAtk: 180, baseHp: 880, baseDr: 0.16, baseEva: 0.05, baseSpd: 12, // V8.5x 平衡：760→880（仍最低HP，但与小白龙1000差距从24%缩至12%，缓解前期被秒）
    baseMatk: 15, baseMdef: 0.05,
    // 被动：金睛破甲——每次物理出手使怪物护甲临时-10%（最低0），专破重甲
    // 被动：斗战善果——每点善念(good)使体攻 +7%（善念越高，金箍棒越利，与取经人"慈悲愿力"对等）
    passive: { sunder: 0.10, mercyAtk: 0.07 },
    trait: '金睛破甲：物理出手无视怪物 10% 护甲（护甲越高收益越大）；斗战善果：每 1 点善念使体攻 +7%',
    desc: '体·物伤流：肉身无双，一棒碎万法；善念加持体攻，自带破甲，专克重甲妖兵',
    // 三键手感：主打键（参悟 UI 层角标）+ 攻键专属攻式（combat.applyHeroKeyFeel 显影 passive 到按键手感）
    mainKey: 'atk',
    attackFeel: '如意棒势·撕甲：攻命中附真伤撕甲（金睛破甲显影）',
  },
  tangseng: {
    id: 'tangseng', name: '取经人', portrait: 'img/portraits/heroes/tangseng.webp',
    // 转职立绘：按转职阶段切换（assets/ 下的中文名立绘）
    evolvePortraits: { base: 'img/portraits/heroes/tangseng_base.webp', evil: 'img/portraits/heroes/tangseng_evil.webp', tier1: 'img/portraits/heroes/tangseng_tier1.webp', tier2: 'img/portraits/heroes/tangseng_tier2.webp', final: 'img/portraits/heroes/tangseng_final.webp', hidden: 'img/portraits/heroes/tangseng_hidden.webp' },
    form: '金蝉御弟·慈悲', form0: '小沙弥', symbol: '锦襕袈裟', focus: '愿·法伤·善念', sys: 'yuan',
    // 初始「送行礼」：取消开局赐予。取经人于第4难(金山寺养)之后，进入问号事件「唐王送行」获得：
    // 袈裟基座 + 九环锡杖·凡 + 紫金钵盂(法宝)。只走「袈裟胚→锦襕袈裟」单一清晰路线。
    initGiftEquips: ['ts_robe_base', 'ts_staff_fan', 'ts_crown_fan', 'ts_boots_fan'], initGiftTreasure: 'ts_bowl_fan', initTrial: 4,
    baseAtk: 78, baseHp: 1300, baseDr: 0.26, baseEva: 0.02, baseSpd: 5,
    baseMatk: 200, baseMdef: 0.22,
    // 被动：慈悲愿力——每点善念(good)使愿伤+10%
    passive: { mercy: 0.10 },
    trait: '慈悲愿力：每 1 点善念使法术伤害 +10%（善念越高，经咒越利）',
    desc: '愿·法伤流：以经咒伤人，善念加持法伤；紫金钵可用但迷失本心',
    mainKey: 'chant',
    attackFeel: '金蝉谛听·慈悲：攻命中回微血续航（慈悲愿力显影）',
  },
  bajie: {
    id: 'bajie', name: '猪八戒', portrait: 'img/portraits/heroes/bajie.webp',
    evolvePortraits: { base: 'img/portraits/heroes/bajie.webp', evil: 'img/portraits/heroes/bajie_evil.webp', tier1: 'img/portraits/heroes/bajie_tier1.webp', tier2: 'img/portraits/heroes/bajie_tier2.webp', final: 'img/portraits/heroes/bajie_final.webp', hidden: 'img/portraits/heroes/bajie_hidden.webp' },
    form: '天蓬元帅·贪嗔', form0: '小天蓬', symbol: '九齿钉耙', focus: '体·防御·护盾', sys: 'ti',
    // 初始「送行礼」：第5难后进入问号事件「高老庄饯行」获得：九齿钉耙·凡 + 贪嗔僧衣·凡 + 净坛宝盂(法宝)
    initGiftEquips: ['bj_rake_fan', 'bj_robe_fan', 'bj_crown_fan', 'bj_boots_fan'], initGiftTreasure: 'bj_bowl_fan', initTrial: 5,
    baseAtk: 150, baseHp: 1250, baseDr: 0.30, baseEva: 0.01, baseSpd: 6,
    baseMatk: 10, baseMdef: 0.06,
    // 被动：净坛护盾——开局获气血15%护盾吸收伤害；护盾未破时每回合反伤(护盾值10%)
    // 被动：净坛善缘——每点善念(good)使体攻 +6%、气血上限 +4%（善念越高，棒沉身厚，与取经人对等；不调减伤以免护盾悖论）
    passive: { shieldPct: 0.15, shieldBomb: 0.10, mercyAtk: 0.06, mercyHp: 0.004 },
    trait: '净坛护盾：每战开局得气血 15% 护盾；护盾在时每回合震敌（护盾值 10% 反伤）；净坛善缘：每 1 点善念使体攻 +6%、气血上限 +4%',
    desc: '体·防御流：肉厚减伤，开局护盾吸收，护盾在身则震敌；善念加持体攻与血肉，越善越稳',
    mainKey: 'atk',
    attackFeel: '九齿劲·攒盾：攻命中累护盾（净坛护盾主动侧）',
  },
  xiaobailong: {
    id: 'xiaobailong', name: '小白龙', portrait: 'img/portraits/heroes/longma.webp',
    evolvePortraits: { base: 'img/portraits/heroes/longma.webp', evil: 'img/portraits/heroes/longma_evil.webp', tier1: 'img/portraits/heroes/longma_tier1.webp', tier2: 'img/portraits/heroes/longma_tier2.webp', final: 'img/portraits/heroes/longma_final.webp', hidden: 'img/portraits/heroes/longma_hidden.webp' },
    form: '西海龙子·疾风', form0: '小龙子', symbol: '逆鳞', focus: '体·闪避·暴击', sys: 'ti',
    // 初始「送行礼」：第6难后进入问号事件「鹰愁涧赠蹄」获得：追风龙蹄·凡 + 护心逆鳞·凡 + 避水珠(法宝)
    initGiftEquips: ['lm_hoof_fan', 'lm_scale_fan', 'lm_crown_fan', 'lm_boots_fan'], initGiftTreasure: 'lm_bowl_fan', initTrial: 6,
    baseAtk: 230, baseHp: 1000, baseDr: 0.20, baseEva: 0.28, baseSpd: 16,
    baseMatk: 15, baseMdef: 0.08,
    // 被动：疾风连击——怪物打空(玩家闪避成功)时叠暴击层(+50%/层，上限3)，下次出手暴击；
    // 另给基础暴击容错(criBonus 0.20) 与高暴击倍率(criMult 2.2)，使"闪避→暴击倾泻"爆发更可观，
    // 弥补闪避流约 28% 回合不输出的天然稀释
    passive: { criOnDodge: 0.5, criCap: 3, criBonus: 0.20, criMult: 2.2, mercyHp: 0.004 },
    trait: '疾风连击：闪避成功则叠暴击（每层 +50%，至多 3 层），下次出手暴击倾泻',
    desc: '体·闪避流：身法如电，闪避后暴击暴涨，越打越狠',
    mainKey: 'atk',
    attackFeel: '龙影连刺·双影：攻分段连刺（身法显影）',
  },
  shaseng: {
    id: 'shaseng', name: '沙僧', portrait: 'img/portraits/heroes/shaseng.webp',
    evolvePortraits: { base: 'img/portraits/heroes/shaseng.webp', evil: 'img/portraits/heroes/shaseng_evil.webp', tier1: 'img/portraits/heroes/shaseng_tier1.webp', tier2: 'img/portraits/heroes/shaseng_tier2.webp', final: 'img/portraits/heroes/shaseng_final.webp', hidden: 'img/portraits/heroes/shaseng_hidden.webp' },
    form: '卷帘大将·沉稳', form0: '小卷帘', symbol: '降妖宝杖', focus: '愿·法防·反震', sys: 'yuan',
    // 初始「送行礼」：第7难后进入问号事件「流沙河饯别」获得：降妖宝杖·凡 + 沉沙僧袍·凡 + 降妖念珠(法宝)
    initGiftEquips: ['ss_staff_fan', 'ss_robe_fan', 'ss_crown_fan', 'ss_boots_fan'], initGiftTreasure: 'ss_bowl_fan', initTrial: 7,
    baseAtk: 180, baseHp: 1150, baseDr: 0.26, baseEva: 0.03, baseSpd: 7,
    baseMatk: 120, baseMdef: 0.28,
    // 被动：沉沙御念——御念额外+10%(上限85%)；受击即反震所承伤害(法术全额/物理七成)给怪物；
    //       净缘——每1点善念气血上限+4%(与八戒同档，吃满善线红利)
    passive: { guardMdef: 0.10, mReflect: 0.20, mercyHp: 0.004, mercy: 0.06 },
    trait: '沉沙御念：御念额外 +10%；受击即反震所承伤害（法术全额/物理七成）给攻击者；净缘：每1点善念气血+4%',
    desc: '愿·法防流：不动如山，法防超群、挨打反震，且善念厚其气血，专克妖僧法师',
    mainKey: 'chant',
    attackFeel: '降妖杖势·印记：攻命中叠持续真伤（御念反震显影）',
  },
};


// =============================================================
// V3 立绘整理：统一角色立绘映射表
// =============================================================
NDX.CHAR_PORTRAITS = {
  wukong: 'img/portraits/heroes/wukong.webp',
  tangseng: 'img/portraits/heroes/tangseng.webp',
  bajie: 'img/portraits/heroes/bajie.webp',
  longma: 'img/portraits/heroes/longma.webp',
  shaseng: 'img/portraits/heroes/shaseng.webp',
  tangseng_base: 'img/portraits/heroes/tangseng_base.webp',
  tangseng_evil: 'img/portraits/heroes/tangseng_evil.webp',
  tangseng_tier1: 'img/portraits/heroes/tangseng_tier1.webp',
  tangseng_tier2: 'img/portraits/heroes/tangseng_tier2.webp',
  tangseng_final: 'img/portraits/heroes/tangseng_final.webp',
  tangseng_hidden: 'img/portraits/heroes/tangseng_hidden.webp',
  wukong_tier1: 'img/portraits/heroes/wukong_tier1.webp',
  wukong_tier2: 'img/portraits/heroes/wukong_tier2.webp',
  wukong_final: 'img/portraits/heroes/wukong_final.webp',
  wukong_evil: 'img/portraits/heroes/wukong_evil.webp',
  wukong_hidden: 'img/portraits/heroes/wukong_hidden.webp',
  bajie_tier1: 'img/portraits/heroes/bajie_tier1.webp',
  bajie_tier2: 'img/portraits/heroes/bajie_tier2.webp',
  bajie_final: 'img/portraits/heroes/bajie_final.webp',
  bajie_evil: 'img/portraits/heroes/bajie_evil.webp',
  bajie_hidden: 'img/portraits/heroes/bajie_hidden.webp',
  longma_tier1: 'img/portraits/heroes/longma_tier1.webp',
  longma_tier2: 'img/portraits/heroes/longma_tier2.webp',
  longma_final: 'img/portraits/heroes/longma_final.webp',
  longma_evil: 'img/portraits/heroes/longma_evil.webp',
  longma_hidden: 'img/portraits/heroes/longma_hidden.webp',
  shaseng_tier1: 'img/portraits/heroes/shaseng_tier1.webp',
  shaseng_tier2: 'img/portraits/heroes/shaseng_tier2.webp',
  shaseng_final: 'img/portraits/heroes/shaseng_final.webp',
  shaseng_evil: 'img/portraits/heroes/shaseng_evil.webp',
  shaseng_hidden: 'img/portraits/heroes/shaseng_hidden.webp',
  // 2026-09-14 修：原先引用「中文名.webp」，但磁盘上真实文件是拼音 ASCII 名（资源一直都在，
  // 只是引用名写错 → 一律 404 → 立绘空白）。这里改指真实文件名，不新增美术。
  // ⚠ 黄风怪 / 黑熊精 未接入：磁盘上只有 boss_huangfeng_phase1 / boss_heixiongjing_phase1
  //   （300×400 透明底矢量精灵，配套 _atk/_hit/_idle 三帧＝**战斗立绘**），与水墨头像不是同一类资源，
  //   接进头像位会画风错位 → 暂留 404 走兜底，等确认用哪张（见 docs/待认领_乱码立绘对照表）。
  boss_zhenyuanzi: 'img/portraits/bosses/boss_zhenyuanzi.webp',
  boss_huangfeng: 'img/portraits/bosses/黄风怪.webp',
  boss_heixiongjing: 'img/portraits/bosses/黑熊精.webp',
  boss_liuhong: 'img/portraits/bosses/boss_liuhong.webp',
  boss_lingji: 'img/portraits/bosses/灵吉菩萨.webp',
  boss_anuo_jiaye: 'img/portraits/bosses/boss_anuo_jiaye.webp',
  boss_baigujing: 'img/portraits/bosses/boss_baigujing.webp',
  boss_bailu_guozhang: 'img/portraits/bosses/boss_bailu_guozhang.webp',
  boss_chechi_sanyao: 'img/portraits/bosses/boss_chechi_sanyao.webp',
  boss_dapeng: 'img/portraits/bosses/boss_dapeng.webp',
  boss_honghaier: 'img/portraits/bosses/boss_honghaier.webp',
  boss_jiutou: 'img/portraits/bosses/boss_jiutou.webp',
  boss_laoyuan: 'img/portraits/bosses/boss_laoyuan.webp',
  boss_linggan_daiwang: 'img/portraits/bosses/boss_linggan_daiwang.webp',
  boss_liuermihou: 'img/portraits/bosses/boss_liuermihou.webp',
  boss_liuhong: 'img/portraits/bosses/boss_liuhong.webp',
  boss_niumowang: 'img/portraits/bosses/boss_niumowang.webp',
  boss_xiezi: 'img/portraits/bosses/boss_xiezi.webp',
  boss_yutu: 'img/portraits/bosses/boss_yutu.webp',
  boss_zhenyuanzi: 'img/portraits/bosses/boss_zhenyuanzi.webp',
  boss_huangfeng_zhuanzhi: 'img/portraits/bosses/zy_huangfeng_v1.webp',
  special_guanyin: 'img/portraits/special/观音菩萨.webp',
  special_dizang: 'img/portraits/special/地藏王菩萨.webp',
  special_puti: 'img/portraits/special/菩提祖师.webp',
  special_wenshu: 'img/portraits/special/文殊菩萨.webp',
  special_mile: 'img/portraits/special/弥勒佛.webp',
  special_randeng: 'img/portraits/special/燃灯古佛.webp',
  special_wuchao: 'img/portraits/special/乌巢禅师.webp',
  special_rulai: 'img/portraits/special/如来.webp',
  special_taishang: 'img/portraits/special/太上老君.webp',
  special_taibai: 'img/portraits/special/太白金星.webp',
  special_nezha: 'img/portraits/special/哪吒.webp',
  special_erlang: 'img/portraits/special/二郎真君.webp',
  special_longwang: 'img/portraits/special/龙王.webp',
  special_tudi: 'img/portraits/special/土地.webp',
  special_chenghuang: 'img/portraits/special/城隍.webp',
  special_jieyin: 'img/portraits/special/接引使者.webp',
  npc_taizong: 'img/portraits/npcs/唐太宗.webp',
  npc_yinwenjiao: 'img/portraits/npcs/殷温娇.webp',
  npc_chenguangrui: 'img/portraits/npcs/陈光蕊.webp',
  npc_jiangliuer_special: 'img/portraits/npcs/npc_jiangliuer.webp',
  npc_huzi: 'img/portraits/npcs/虎仔.webp',
  // ============ 怪物立绘 ============
  mon_combat_heifeng_xiaoyao: 'img/portraits/enemies/mon_combat_heifeng_xiaoyao.webp',
  mon_combat_huangfeng_fengyao: 'img/portraits/enemies/mon_combat_huangfeng_fengyao.webp',
  mon_combat_baigu_kuloubing: 'img/portraits/enemies/mon_combat_baigu_kuloubing.webp',
  mon_combat_pingding_xiaoyao: 'img/portraits/enemies/mon_combat_pingding_xiaoyao.webp',
  mon_combat_tongtian_yuguai: 'img/portraits/enemies/mon_combat_tongtian_yuguai.webp',
  mon_combat_jindou_niuyao: 'img/portraits/enemies/mon_combat_jindou_niuyao.webp',
  mon_elite_wuji_daoshi: 'img/portraits/enemies/mon_elite_wuji_daoshi.webp',
  mon_elite_chechi_daoshi: 'img/portraits/enemies/mon_elite_chechi_daoshi.webp',
  mon_elite_nverguo_shiwei: 'img/portraits/enemies/mon_elite_nverguo_shiwei.webp',
  mon_elite_huoyanshan_huoyao: 'img/portraits/enemies/mon_elite_huoyanshan_huoyao.webp',
  mon_elite_shituoling_xiaoyao: 'img/portraits/enemies/mon_elite_shituoling_xiaoyao.webp',
  mon_elite_wudidong_shuyao: 'img/portraits/enemies/mon_elite_wudidong_shuyao.webp',

  // ============ V9.x 其他耳熟能详妖怪立绘 ============
  boss_heixiongjing_phase1: 'img/portraits/bosses/boss_heixiongjing_phase1.webp',
  boss_heixiongjing_phase2: 'img/portraits/bosses/boss_heixiongjing_phase2.webp',
  boss_zhenyuanzi_new: 'img/portraits/bosses/boss_zhenyuandaxian.webp',
  boss_jinjiao: 'img/portraits/bosses/boss_jinjiaodawang.webp',
  boss_yinjiao: 'img/portraits/bosses/boss_yinjiaodawang.webp',
  boss_huangpao: 'img/portraits/bosses/boss_huangpaoguai.webp',
  boss_qingniu: 'img/portraits/bosses/boss_qingniujing.webp',
  boss_huangmei: 'img/portraits/bosses/boss_huangmeilaofo.webp',
  boss_zhizhu: 'img/portraits/bosses/boss_zhizhujing.webp',
  boss_yutu: 'img/portraits/bosses/boss_yutujing.webp',
  boss_jiutou: 'img/portraits/bosses/boss_jiutouchong.webp',
  boss_linggan: 'img/portraits/bosses/boss_linggandawang.webp',
  boss_saitaisui: 'img/portraits/bosses/boss_saitaisui.webp',
  boss_bailu: 'img/portraits/bosses/boss_bailujing.webp',
  boss_baimianhuli: 'img/portraits/bosses/boss_baimianhuli.webp',
  boss_nanshan: 'img/portraits/bosses/boss_nanshandawang.webp',
  boss_huangshi: 'img/portraits/bosses/boss_huangshijing.webp',
  boss_jiuling: 'img/portraits/bosses/boss_jiulingyuansheng.webp',
  boss_bihan: 'img/portraits/bosses/boss_bihandawang.webp',
  boss_bishu: 'img/portraits/bosses/boss_bishudawang.webp',
  boss_bichen: 'img/portraits/bosses/boss_bichendawang.webp',

  // ============ 宠物立绘 ============
  pet_tangseng_jinchanzi: 'img/portraits/pets/pet_tangseng_jinchanzi.webp',
  pet_wukong_jindouyun: 'img/portraits/pets/pet_wukong_jindouyun.webp',
  pet_bajie_zhuganglie: 'img/portraits/pets/pet_bajie_zhuganglie.webp',
  pet_shaseng_liushaheyao: 'img/portraits/pets/pet_shaseng_liushaheyao.webp',
  pet_longma_longzhuling: 'img/portraits/pets/pet_longma_longzhuling.webp',

  // ============ V9.x Boss多段变身立绘 ============
  boss_baigujing_phase1: 'img/portraits/bosses/boss_baigujing_phase1.webp',
  boss_baigujing_phase2: 'img/portraits/bosses/boss_baigujing_phase2.webp',
  boss_baigujing_phase3: 'img/portraits/bosses/boss_baigujing_phase3.webp',
  boss_huangfeng_phase1: 'img/portraits/bosses/boss_huangfeng_phase1.webp',
  boss_huangfeng_phase2: 'img/portraits/bosses/boss_huangfeng_phase2.webp',
  boss_huangfeng_phase3: 'img/portraits/bosses/boss_huangfeng_phase3.webp',
  boss_honghaier_phase1: 'img/portraits/bosses/boss_honghaier_phase1.webp',
  boss_honghaier_phase2: 'img/portraits/bosses/boss_honghaier_phase2.webp',
  boss_honghaier_phase3: 'img/portraits/bosses/boss_honghaier_phase3.webp',
  boss_chechi_huli: 'img/portraits/bosses/boss_chechi_huli.webp',
  boss_chechi_luli: 'img/portraits/bosses/boss_chechi_luli.webp',
  boss_chechi_yangli: 'img/portraits/bosses/boss_chechi_yangli.webp',
  boss_shituo_qingmao: 'img/portraits/bosses/boss_shituo_qingmao.webp',
  boss_shituo_huangya: 'img/portraits/bosses/boss_shituo_huangya.webp',
  boss_shituo_dapeng: 'img/portraits/bosses/boss_shituo_dapeng.webp',
  boss_liuermihou_phase1: 'img/portraits/bosses/boss_liuermihou_phase1.webp',
  boss_liuermihou_phase2: 'img/portraits/bosses/boss_liuermihou_phase2.webp',
  boss_liuermihou_phase3: 'img/portraits/bosses/boss_liuermihou_phase3.webp',
  boss_niumowang_phase1: 'img/portraits/bosses/boss_niumowang_phase1.webp',
  boss_niumowang_phase2: 'img/portraits/bosses/boss_niumowang_phase2.webp',
  boss_niumowang_phase3: 'img/portraits/bosses/boss_niumowang_phase3.webp',

  player_main: 'img/portraits/heroes/player_main.webp',
  npc_jiangliuer_new: 'img/portraits/npcs/npc_jiangliuer.webp',
  npc_shaseng_liushahe: 'img/portraits/npcs/npc_shaseng_liushahe.webp',
};

// 立绘 WebP 优先：支持 WebP 的浏览器自动切换到 .webp（加载速度提升 5-8 倍）
if (typeof window.__pickWebp === 'function') {
  try {
    for (var _hid in NDX.HEROES) {
      var _h = NDX.HEROES[_hid];
      if (_h.portrait) _h.portrait = window.__pickWebp(_h.portrait);
      if (_h.evolvePortraits) {
        for (var _tk in _h.evolvePortraits) {
          _h.evolvePortraits[_tk] = window.__pickWebp(_h.evolvePortraits[_tk]);
        }
      }
    }
    for (var _pk in NDX.CHAR_PORTRAITS) {
      NDX.CHAR_PORTRAITS[_pk] = window.__pickWebp(NDX.CHAR_PORTRAITS[_pk]);
    }
  } catch(_e) {}
}
NDX.getPortrait = function(key) { return NDX.CHAR_PORTRAITS[key] || 'img/portraits/heroes/player_main.webp'; };

// ============ 悟空小说段落（战斗胜利后播放 · 打字机 + 水墨）============
// 每段截取《西游记》原著/同人气韵的写意片段，按层随机抽取，营造「斗法回」叙事感
NDX.WUKONG_NOVEL = [
  '五行山下，风雪压顶五百年。悟空睁着火眼金睛，望着那云路上的劫云——这一棒，他要为自己的不甘而挥。',
  '妖风起处，山石崩裂。悟空掂了掂金箍棒，咧嘴一笑：「俺老孙的路，岂是你们这些魑魅能拦的？」',
  '棒影如龙，裂石穿云。那妖怪哪里见过这般狂放打法，只叫得一声「大圣饶命」，便化作清风散去。',
  '劫难非劫，乃心关。悟空收棒而立，望见远处灵山微光——他知这一路，越往前越要自己扛。',
  '金箍虽束身，却束不住那颗齐天的心。一棒砸碎拦路障，他哼着荒腔野调，大步向西。',
  '血与尘落定，悟空吐出一口浊气。败过的妖、碎过的山，都成了他棒下的一道痕。',
  '风过松林，似有梵唱。悟空却只信手中棒——「佛不渡我，我便自己渡自己。」',
  '妖雾散尽，天地澄明。悟空回头望那尸山血海般的来路，淡淡道：「不过如此。」',
  '一棒定乾坤，万法皆退避。悟空负手而立，金眸中映着漫天星斗——西行路远，他才刚热了身。',
  '残阳如血，照在破甲裂袍上。悟空抚过棒身旧痕，忽觉五百年蛰伏，只为今日这一路酣畅。',
];

// 取经人（金蝉子）小说段落：以「取经人」视角书写，配合 TRIAL_LIB 主剧情（你=金蝉子转世），
// 不再使用孙悟空第一人称口吻，使选取经人时战斗后叙事与其身份一致。
NDX.TANGSENG_NOVEL = [
  '你合掌立于尸山血海之间，袈裟上溅了几滴暗红。金蝉子十世修行的清净心，头一回被这般杀业灼得发烫——可你清楚，这西行本就不是诵经便能了结的。你拾起紫金钵，将未尽之经卷拢好，踏过残妖继续向西。',
  '妖风卷着碎骨扑面，你以禅杖撑住踉跄的身形。世人只道取经人肉眼凡胎，却不知那十世不昧的元神，早在每一次濒死里悄悄磨亮。你抹去额间冷汗，低诵一声「阿弥陀佛」，不为超度，只为叫自己记得为何上路。',
  '篝火将熄，你盘膝而坐，看火苗在弟子们睡颜上跳动。这一程，你亲手斩过的妖，竟比经文里听过的还多。你忽然懂了师父临行那句「经不在纸，在行」——取来的，原是这一身披霜带血的因果。',
  '断刃还握在掌心，你望着天边将白的启明星。金蝉子被贬下界时，佛前曾笑他"痴"。如今你以凡僧之躯趟过这九九劫数，倒觉那"痴"字里，自有不肯回头的孤勇。你起身拍去尘土，钵盂轻响，如一声木鱼。',
  '残月照在湿冷的石阶上，你一步一叩，膝下是未干的妖血。有人问：既已证得罗汉果，何必亲历这般屠戮？你不答，只把紫金钵里最后一口净水，洒向那些无名枯骨——超度不了业障，总超度得了这一程的风。',
  '你于乱军中护住经囊，后背挨了记利爪，僧衣裂处渗出朱红。痛吗？痛的。可你想起重生那回，菩萨说"未到灵山，不许死"。于是你把痛咽回肚里，禅杖横扫，替身后的世界挡下这一程——取经人，本就是替苍生挨刀的人。',
];
// 八戒小说段落：以「老猪」第一人称，贪嗔痴转向净坛担当，与悟空/取经人口吻区分
NDX.BAJIE_NOVEL = [
  '钉耙一抡，连妖带山石捶了个稀碎。高老庄里那点贪吃好色的念想，早让这一路黄沙磨得只剩腌渍——可偏是这口腌渍气，撑着俺老猪没在半路撂挑子。',
  '俺老猪收了耙，抹把汗，咧嘴直喘。什么净坛使者、什么世人供奉，都是后话；眼下师父在前头走，俺就跟在后头，把妖拦下、把路趟平，也就够了。',
  '耳朵一扇，妖风散了大半。俺瞅着那碎成泥的拦路障，忽然觉着这身子骨比高老庄当女婿那会儿还瓷实——贪多嚼不烂，可嚼着嚼着，倒真嚼出了点门道。',
  '一耙下去，天地都清净三分。俺往地上一坐，从怀里摸出半个干馍边啃边嘀咕：散伙的话这世说了八百回，可真到分岔口，腿却比嘴老实，总往西边迈。',
  '妖血溅上禅衣，俺嫌骚气地抖了抖，又望着前头那个不回头的身影嘟囔一句「认了」——金箍箍的是猴子，绑住俺老猪的，是这一路走出来的缘分。',
  '耙锋滴血，俺掂了掂，忽然笑了。西行路上什么都是虚的，唯有这一耙一耙抡出来的，是俺老猪自己的路。',
];

// 沙僧小说段落：沉默、守护、卷帘将赎罪——不开口，只用一杖替众人架住身后那一步
NDX.SHASENG_NOVEL = [
  '沙僧不言语，只把降妖宝杖横在身前。流沙河九次转生，早教他懂得何谓守、何谓赎——这一杖架住的，不是妖，是兄弟们身后那一步。',
  '担子压肩，他走得不快，却从没落下半步。卷帘将打碎琉璃盏、被贬下界那点罪，早就在这一程一程的做里，慢慢磨进了骨。',
  '杖影沉稳，格开一记偷袭。他仍旧不开口，只在心里数着众人的背影——师父诵经，师兄开路，各有各的执，而他只需把这条道，走得再稳一分。',
  '恶水滔天，他一杖分波。沙僧想起流沙河底那些年月，忽觉那时的苦，竟是为此刻的守备下的注——原来堕落过的人，才最懂得把光让给别人。',
  '黄昏底下，他把禅杖插进沙土，替营火的众兄弟守夜。沉默不是不会说，是他把千言万语都咽成了这一辈子的照看——卷帘，卷的是帘，也是这人世的风尘。',
  '一步一个脚印，他始终走在队伍末尾，却守住了所有人的归途。沙僧合掌，不言不语——琉璃盏碎了九回，这一世，他偏要把它拼出个人样来。',
];

// 小白龙小说段落：被天规/父命捆成坐骑的龙，一步步挣脱缰绳、自我做主
NDX.LONGMA_NOVEL = [
  '白龙一声长嘶，四蹄踏碎波影。它原是被天规勒成坐骑的龙——可这一路奔袭下来，每一道蹄印里，都藏着一截挣断的缰绳。',
  '龙身腾跃，化作一道白电破开妖瘴。它不言语，却驮着连金蝉子都未必扛得动的经文——原来那些捆过它的枷锁，早已被它走成了脊梁。',
  '潮声起时，它回望东海方向。父命如山、天规如海，曾把它压成不能言语的脚力——如今它懂了，做不做龙，不靠谁来松口。',
  '白鳞上血迹未干，它低低打了个响鼻。这卷经，替师父驮到灵山，它便不负谁；可这一世走过的山，却是它自己挣回来的。',
  '悬崖尽处，它一抖鬃毛，把缰绳甩进深渊。小白龙仰天长吟——那一声里，既有被剥落的旧鳞，也有头一回做主的心跳。',
  '化人的夜里，它想起被贬鹰愁涧的种种。原来被困不是命，是把别人的枷锁当成了自己的河——如今西行已半，这条河，它要自己游。',
];

NDX.pickNovel = function (seed, hero) {
  // 按英雄选对应小说库：取经人→取经人记事；八戒/沙僧/小白龙→各自主视角；其余默认悟空视角
  let arr;
  if (hero === 'tangseng') arr = NDX.TANGSENG_NOVEL || [];
  else if (hero === 'bajie') arr = NDX.BAJIE_NOVEL || [];
  else if (hero === 'shaseng') arr = NDX.SHASENG_NOVEL || [];
  else if (hero === 'xiaobailong') arr = NDX.LONGMA_NOVEL || [];
  else arr = NDX.WUKONG_NOVEL || [];
  if (!arr.length) return '';
  const i = (typeof seed === 'number' && seed >= 0) ? (seed % arr.length) : Math.floor(Math.random() * arr.length);
  return arr[i];
};

// ============ 英雄解锁（P0-C 横向三通道：通关全解 / 死亡渐进 / 劫灰买印）============
// 初始仅开放取经人；任取经人通关一次即一次性解锁全部英雄；
// 未通关前，也可经「死亡渐进」（1/2/4/8 次死亡逐解 悟空/八戒/沙僧/小白龙）
// 或「劫灰坊金蝉余韵/逆心初萌」逐级提前解锁传承英雄——三者并集，越走越宽。
NDX.HERO_ORDER = ['tangseng', 'wukong', 'bajie', 'shaseng', 'xiaobailong'];

// 持久化已通关英雄（localStorage，跨会话保留）
NDX._unlockKey = 'nx_hero_unlock_v1';
NDX.unlockedHeroes = function () {
  // 首次只开放取经人；取经人通关一次后解锁全部英雄。
  // 保留旧存档兼容：若 localStorage 已有解锁记录则优先使用。
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  let arr = null;
  const data = NDX.SaveSystem.load(NDX._unlockKey, null);
  if (Array.isArray(data) && data.length) arr = data;
  if (arr) return arr;
  return ['tangseng']; // 初始仅解锁取经人
};
// P0-C 实际可用英雄 = 通关/永久解锁 ∪ 死亡渐进解锁 ∪ 劫灰提前解锁
NDX.unlockedHeroesAll = function () {
  const base = NDX.unlockedHeroes().slice();
  const death = (typeof NDX.deathHeroesUnlocked === 'function') ? NDX.deathHeroesUnlocked() : [];
  const ashN = (typeof NDX.ashUnlockHeroCount === 'function') ? NDX.ashUnlockHeroCount() : 0;
  NDX.HERO_ORDER.forEach((id, i) => {
    if (id === 'tangseng') return;
    // 劫灰通道按 HERO_ORDER 顺序逐个提前解锁（金蝉 lv1→悟空，lv2→八戒；逆心 lv1→沙僧，lv2→小白龙）
    if (i - 1 < ashN && base.indexOf(id) < 0) base.push(id);
    else if (death.indexOf(id) >= 0 && base.indexOf(id) < 0) base.push(id);
  });
  return base;
};
NDX.isHeroUnlocked = function (id) {
  return NDX.unlockedHeroesAll().indexOf(id) >= 0;
};
NDX.unlockNext = function (justClearedId) {
  const list = NDX.unlockedHeroes().slice();
  const order = NDX.HERO_ORDER;
  // 取经人通关一次后，一次性解锁全部英雄
  if (justClearedId === 'tangseng') {
    order.forEach((id) => { if (list.indexOf(id) < 0) list.push(id); });
  }
  // 记录已通关
  if (list.indexOf(justClearedId) < 0) list.push(justClearedId);
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  NDX.SaveSystem.save(NDX._unlockKey, list);
  return list;
};

// 持久化已通关记录：通关任意英雄一次即视为完成一周目，用于解锁二周目隐藏选项
NDX._clearKey = 'nx_clear_v1';
NDX.clearedHeroes = function () {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  const data = NDX.SaveSystem.load(NDX._clearKey, []);
  return Array.isArray(data) ? data : [];
};
NDX.saveClear = function (heroId) {
  const list = NDX.clearedHeroes().slice();
  if (heroId && list.indexOf(heroId) < 0) list.push(heroId);
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  NDX.SaveSystem.save(NDX._clearKey, list);
  return list;
};
NDX.hasClearedAny = function () {
  return NDX.clearedHeroes().length > 0;
};
