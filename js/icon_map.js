/* =============================================================================
 * 逆道西行 · 图标映射管理器
 * -----------------------------------------------------------------------------
 * 本文件集中管理所有游戏图标的路径映射，包括装备、法宝、经文、成就等。
 * 修改图标路径只需编辑本文件，无需改动其他文件。
 *
 * 挂载到 NDX 的表：
 *   NDX.ICON_MAP        图标路径映射表（按类型分组）
 *   NDX.getIconPath()   获取图标路径的工具函数
 *   NDX.getIconHtml()   获取图标HTML的工具函数
 *
 * 加载顺序（见 index.html）：data.js → equipment.js → icon_map.js → ...
 * ========================================================================== */
(function () {
  if (!window.NDX) window.NDX = {};
  var NDX = window.NDX;

  /* ============================ 图标路径映射表 ============================ */
  NDX.ICON_MAP = {
    // 装备图标（equipment目录）
    equipment: {
      // 兵刃
      'taomu_sword': 'img/icons/equipment/eq_jiuhuanxizhang.webp',
      'longti': 'img/icons/equipment/eq_zhuifenglongti.webp',
      'set_weapon_base': 'img/icons/equipment/eq_pojunqiang.webp',
      'ts_staff_base': 'img/icons/equipment/eq_jiuhuanxizhang.webp',
      'wk_crown_base': 'img/icons/equipment/eq_fengchizijinguan.webp',
      // 甲胄
      'set_armor_base': 'img/icons/equipment/eq_xuanwujia.webp',
      'ts_robe_base': 'img/icons/equipment/eq_jinlanjiasha.webp',
      'wk_armor_base': 'img/icons/equipment/eq_suozihuangjinjia.webp',
      // 法宝
      'set_treasure_base': 'img/icons/equipment/eq_tanlangzhui.webp',
      'ts_bowl_base': 'img/icons/treasures/tr_jingtanbaoyu.webp',
      'bis_an': 'img/icons/treasures/tr_bishuizhu.webp',
      'jinchan_sheli': 'img/icons/treasures/tr_jingtanbaoyu.webp',
      'renshen': 'img/icons/treasures/tr_sanmeihuozhong.webp',
      // V8.43 五行饰品已删除（五行系统整体移除）
      // 英雄专属法宝
      'jingu_treasure': 'img/icons/equipment/eq_ruyijingubang2.webp',
      'ts_bowl_fan': 'img/icons/equipment/eq_zijinboyu.webp',
      'bj_bowl_fan': 'img/icons/equipment/eq_jingtanbaoyu2.webp',
      'lm_bowl_fan': 'img/icons/equipment/eq_bishuizhu2.webp',
      'ss_bowl_fan': 'img/icons/equipment/eq_xiangyaonianzhu2.webp',
      // 黑风套
      'langyajia': 'img/icons/equipment/eq_langyajia.webp',
      'sanmei': 'img/icons/treasures/tr_sanmeihuozhong.webp',
      'jingangying': 'img/icons/equipment/eq_jingangzhuoying.webp',
      'guixi': 'img/icons/equipment/eq_guixijia.webp',
      'luotaishi': 'img/icons/treasures/tr_luotaishi.webp',
      'xieweizhen': 'img/icons/equipment/eq_xieweizhen.webp',
      // 狮驼套
      'jiutouji': 'img/icons/equipment/eq_jiutouji.webp',
      'mangzhu': 'img/icons/treasures/tr_mangzhu.webp',
      'gongwu': 'img/icons/equipment/eq_gongwujia.webp',
      'zhusi': 'img/icons/treasures/tr_zhusiwang.webp',
      'pengyu': 'img/icons/equipment/eq_pengyuren.webp',
      // 凌云套
      'meiban': 'img/icons/equipment/eq_meibanjia.webp',
      'xijiao': 'img/icons/equipment/eq_xijiaoren.webp',
      'yuehua': 'img/icons/equipment/eq_yuehuaying2.webp',
      'shajingshi': 'img/icons/treasures/tr_shaijingshi.webp',
      'wudichuan': 'img/icons/equipment/eq_wudichuangu.webp',
      // 盘缠套
      'pc_w1': 'img/icons/equipment/eq_sancaidaodao.webp',
      'pc_a1': 'img/icons/equipment/eq_sancaibuyi.webp',
      'pc_t1': 'img/icons/equipment/eq_sancaiqiandai.webp',
      'pc_w1m': 'img/icons/equipment/eq_sancaigangdao.webp',
      'pc_a1m': 'img/icons/equipment/eq_sancaipijia.webp',
      'pc_t1m': 'img/icons/equipment/eq_sancaiyinnang.webp',
      'pc_w2': 'img/icons/equipment/eq_heishiwandao.webp',
      // 悟空套装
      'wk_crown_base': 'img/icons/equipment/eq_fengchizijinguan2.webp',
      'wk_armor_base': 'img/icons/equipment/eq_suozihuangjinjia2.webp',
      'wk_staff_base': 'img/icons/equipment/eq_ruyijingubang2.webp',
      // 龙马套装
      'lm_saddle_base': 'img/icons/equipment/eq_tayunmaan2.webp',
      'lm_scale_base': 'img/icons/equipment/eq_huxinnilin2.webp',
      'lm_hoof_base': 'img/icons/equipment/eq_zhuifenglongti2.webp',
      // 八戒套装
      'bj_robe_base': 'img/icons/equipment/eq_tanchensengyi2.webp',
      'bj_belly_base': 'img/icons/equipment/eq_tunshanbianbiandu.webp',
      'bj_rake_base': 'img/icons/equipment/eq_jiuchidingpa2.webp',
      // 沙僧套装
      'ss_staff_base': 'img/icons/equipment/eq_xiangyaobaozhang2.webp',
      'ss_robe_base': 'img/icons/equipment/eq_chenshasengpao2.webp',
      // 盘缠套高阶
      'pc_w1h': 'img/icons/equipment/eq_sancaibaoren.webp',
      'pc_a1h': 'img/icons/equipment/eq_sancaijinyi.webp',
      'pc_t1h': 'img/icons/equipment/eq_sancaijinzhu.webp',
      // 盘缠套二阶中阶
      'pc_w2m': 'img/icons/equipment/eq_heishijinggangdao.webp',
      'pc_a2m': 'img/icons/equipment/eq_heishisuozijia.webp',
      'pc_t2m': 'img/icons/equipment/eq_heishiminang.webp',
      // 法宝
      'zijin_honghulu': 'img/icons/equipment/eq_zijinhonghulu.webp',
      'yangzhi_yujingping': 'img/icons/equipment/eq_yangzhiyujingping.webp',
      'huangjin_sheng': 'img/icons/equipment/eq_huangjinsheng.webp',
      'qixing_jian': 'img/icons/equipment/eq_qixingjian.webp',
      // 盘缠套二阶高阶
      'pc_w2h': 'img/icons/equipment/eq_heishixuantiejian.webp',
      'pc_a2h': 'img/icons/equipment/eq_heishixuantiejia.webp',
      'pc_t2h': 'img/icons/equipment/eq_heishimibaonang.webp',
      // 盘缠套三阶
      'pc_w3': 'img/icons/equipment/eq_sancaitulongdao.webp',
      'pc_a3': 'img/icons/equipment/eq_sancailonglinjia.webp',
      'pc_t3': 'img/icons/equipment/eq_sancaijubaopen.webp',
      // 法宝
      'bajiao_shan': 'img/icons/equipment/eq_bajiaoshan.webp',
      'jingang_zhuo': 'img/icons/equipment/eq_jingangzhuo.webp',
      // 取经人套装（升级版）
      'ts_robe_base': 'img/icons/equipment/eq_jinlanjiasha2.webp',
      'ts_staff_base': 'img/icons/equipment/eq_jiuhuanxizhang2.webp',
      // 黑风套法宝（升级版）
      'sanmei': 'img/icons/equipment/eq_sanmeihuozhong2.webp',
      'luotaishi': 'img/icons/equipment/eq_luotaishi2.webp',
      // 狮驼套法宝（升级版）
      'mangzhu': 'img/icons/equipment/eq_mangzhu2.webp',
      'zhusi': 'img/icons/equipment/eq_zhusiwang2.webp',
      // 凌云套法宝（升级版）
      'shajingshi': 'img/icons/equipment/eq_shaijingshi2.webp',
      'wudichuan': 'img/icons/equipment/eq_wudichuangu2.webp',
      // V8.43 五行饰品（升级版）已删除
      // 黑风套（升级版）
      'langyajia': 'img/icons/equipment/eq_langyajia2.webp',
      'jingangying': 'img/icons/equipment/eq_jingangzhuoying2.webp',
      'guixi': 'img/icons/equipment/eq_guixijia2.webp',
      // 狮驼套（升级版）
      'jiutouji': 'img/icons/equipment/eq_jiutouji2.webp',
      'gongwu': 'img/icons/equipment/eq_gongwujia2.webp',
      'pengyu': 'img/icons/equipment/eq_pengyuren2.webp',
      // 凌云套（升级版）
      'meiban': 'img/icons/equipment/eq_meibanjia2.webp',
      'xijiao': 'img/icons/equipment/eq_xijiaoren2.webp',
      'yuehua': 'img/icons/equipment/eq_yuehuaying2.webp',
      // 破军套（升级版）
      'tanlangzhui': 'img/icons/equipment/eq_tanlangzhui2.webp',
      // ===== 六道同构四件套图标（V8.42）：贪狼/破军/玄武/影遁/逆命 四槽三阶 + 组件 =====
      // 每套 weapon/armor/head/boots 复用本套系代表性图标（按槽位区分），组件用通用·套装灵性图标
      // —— 贪狼（缘·攻守）——
      'tl_w1': 'img/icons/equipment/eq_jiuhuanxizhang.webp',  'tl_w2': 'img/icons/equipment/eq_jiuhuanxizhang2.webp', 'tl_w3': 'img/icons/equipment/eq_jiuhuanxizhang.webp',
      'tl_a1': 'img/icons/equipment/eq_jinlanjiasha.webp',    'tl_a2': 'img/icons/equipment/eq_jinlanjiasha2.webp',  'tl_a3': 'img/icons/equipment/eq_jinlanjiasha.webp',
      'tl_h1': 'img/icons/equipment/eq_fengchizijinguan.webp', 'tl_h2': 'img/icons/equipment/eq_fengchizijinguan2.webp', 'tl_h3': 'img/icons/equipment/eq_fengchizijinguan.webp',
      'tl_b1': 'img/icons/equipment/eq_zhuifenglongti.webp',  'tl_b2': 'img/icons/equipment/eq_zhuifenglongti2.webp', 'tl_b3': 'img/icons/equipment/eq_zhuifenglongti.webp',
      'tl_comp1': 'img/icons/equipment/eq_tanlangzhui.webp', 'tl_comp2': 'img/icons/equipment/eq_tanlangzhui2.webp', 'tl_comp3': 'img/icons/equipment/eq_tanlangzhui.webp',
      // —— 破军（战·攻击）——
      'pw_w1': 'img/icons/equipment/eq_pojunqiang.webp',  'pw_w2': 'img/icons/equipment/eq_pojunqiang3.webp', 'pw_w3': 'img/icons/equipment/eq_pojunqiang.webp',
      'pw_a1': 'img/icons/equipment/eq_heishixuantiejia.webp', 'pw_a2': 'img/icons/equipment/eq_heishisuozijia.webp', 'pw_a3': 'img/icons/equipment/eq_heishixuantiejia.webp',
      'pw_h1': 'img/icons/equipment/eq_fengchizijinguan.webp', 'pw_h2': 'img/icons/equipment/eq_fengchizijinguan2.webp', 'pw_h3': 'img/icons/equipment/eq_fengchizijinguan.webp',
      'pw_b1': 'img/icons/equipment/eq_zhuifenglongti.webp',  'pw_b2': 'img/icons/equipment/eq_zhuifenglongti2.webp', 'pw_b3': 'img/icons/equipment/eq_zhuifenglongti.webp',
      'pw_comp1': 'img/icons/equipment/eq_pojunqiang.webp', 'pw_comp2': 'img/icons/equipment/eq_pojunqiang3.webp', 'pw_comp3': 'img/icons/equipment/eq_pojunqiang.webp',
      // —— 玄武（渡·防御）——
      'xw_w1': 'img/icons/equipment/eq_jiuhuanxizhang.webp',  'xw_w2': 'img/icons/equipment/eq_jiuhuanxizhang2.webp', 'xw_w3': 'img/icons/equipment/eq_jiuhuanxizhang.webp',
      'xw_a1': 'img/icons/equipment/eq_xuanwujia.webp',    'xw_a2': 'img/icons/equipment/eq_xuanwujia3.webp',   'xw_a3': 'img/icons/equipment/eq_xuanwujia.webp',
      'xw_h1': 'img/icons/equipment/eq_fengchizijinguan.webp', 'xw_h2': 'img/icons/equipment/eq_fengchizijinguan2.webp', 'xw_h3': 'img/icons/equipment/eq_fengchizijinguan.webp',
      'xw_b1': 'img/icons/equipment/eq_zhuifenglongti.webp',  'xw_b2': 'img/icons/equipment/eq_zhuifenglongti2.webp', 'xw_b3': 'img/icons/equipment/eq_zhuifenglongti.webp',
      'xw_comp1': 'img/icons/equipment/eq_xuanwujia.webp', 'xw_comp2': 'img/icons/equipment/eq_xuanwujia3.webp', 'xw_comp3': 'img/icons/equipment/eq_xuanwujia.webp',
      // —— 影遁（隐·闪避）——
      'yd_w1': 'img/icons/equipment/eq_heishijinggangdao.webp', 'yd_w2': 'img/icons/equipment/eq_heishiwandao.webp', 'yd_w3': 'img/icons/equipment/eq_heishijinggangdao.webp',
      'yd_a1': 'img/icons/equipment/eq_guixijia.webp',     'yd_a2': 'img/icons/equipment/eq_guixijia2.webp',    'yd_a3': 'img/icons/equipment/eq_guixijia.webp',
      'yd_h1': 'img/icons/equipment/eq_fengchizijinguan.webp', 'yd_h2': 'img/icons/equipment/eq_fengchizijinguan2.webp', 'yd_h3': 'img/icons/equipment/eq_fengchizijinguan.webp',
      'yd_b1': 'img/icons/equipment/eq_zhuifenglongti.webp',  'yd_b2': 'img/icons/equipment/eq_zhuifenglongti2.webp', 'yd_b3': 'img/icons/equipment/eq_zhuifenglongti.webp',
      'yd_comp1': 'img/icons/equipment/eq_guixijia.webp', 'yd_comp2': 'img/icons/equipment/eq_guixijia2.webp', 'yd_comp3': 'img/icons/equipment/eq_guixijia.webp',
      // —— 逆命（逆·全加）——
      'nm_w1': 'img/icons/equipment/eq_pojunqiang.webp',  'nm_w2': 'img/icons/equipment/eq_pojunqiang3.webp', 'nm_w3': 'img/icons/equipment/eq_pojunqiang.webp',
      'nm_a1': 'img/icons/equipment/eq_heishisuozijia.webp', 'nm_a2': 'img/icons/equipment/eq_heishixuantiejian.webp', 'nm_a3': 'img/icons/equipment/eq_heishisuozijia.webp',
      'nm_h1': 'img/icons/equipment/eq_fengchizijinguan.webp', 'nm_h2': 'img/icons/equipment/eq_fengchizijinguan2.webp', 'nm_h3': 'img/icons/equipment/eq_fengchizijinguan.webp',
      'nm_b1': 'img/icons/equipment/eq_zhuifenglongti.webp',  'nm_b2': 'img/icons/equipment/eq_zhuifenglongti2.webp', 'nm_b3': 'img/icons/equipment/eq_zhuifenglongti.webp',
      'nm_comp1': 'img/icons/equipment/eq_pojunqiang.webp', 'nm_comp2': 'img/icons/equipment/eq_pojunqiang3.webp', 'nm_comp3': 'img/icons/equipment/eq_pojunqiang.webp',
    
    // V8.42 新增：英雄基础装备图标（第一批）
    'ts_staff_fan': 'img/icons/equipment/eq_ts_staff_fan.png',
    'bj_rake_fan': 'img/icons/equipment/eq_bj_rake_fan.png',
    'lm_hoof_fan': 'img/icons/equipment/eq_lm_hoof_fan.png',
    'ss_staff_fan': 'img/icons/equipment/eq_ss_staff_fan.png',
    // V8.42 新增：英雄基础护甲图标（第二批）
    'ts_robe_fan': 'img/icons/equipment/eq_ts_robe_fan.png',
    'wk_caogun': 'img/icons/equipment/eq_wk_caogun.png',
    'bj_robe_fan': 'img/icons/equipment/eq_bj_robe_fan.png',
    'lm_scale_fan': 'img/icons/equipment/eq_lm_scale_fan.png',
    'ss_robe_fan': 'img/icons/equipment/eq_ss_robe_fan.png',
    // V8.42 新增：英雄基础头冠图标（第三批）
    'ts_crown_fan': 'img/icons/equipment/eq_ts_crown_fan.png',
    'bj_crown_fan': 'img/icons/equipment/eq_bj_crown_fan.png',
    'lm_crown_fan': 'img/icons/equipment/eq_lm_crown_fan.png',
    'ss_crown_fan': 'img/icons/equipment/eq_ss_crown_fan.png',
    // V8.42 新增：英雄基础靴子图标（第四批）
    'ts_boots_fan': 'img/icons/equipment/eq_ts_boots_fan.png',
    'wk_boots_fan': 'img/icons/equipment/eq_wk_boots_fan.png',
    'bj_boots_fan': 'img/icons/equipment/eq_bj_boots_fan.png',
    'lm_boots_fan': 'img/icons/equipment/eq_lm_boots_fan.png',
    'ss_boots_fan': 'img/icons/equipment/eq_ss_boots_fan.png',
    // V8.42 新增：法宝图标（第五批）
    'ss_skull_base': 'img/icons/equipment/eq_ss_skull_base.png',
    'pc_t2': 'img/icons/equipment/eq_pc_t2.png',
    'pc_t3m': 'img/icons/equipment/eq_pc_t3m.png',
    'pc_t3h': 'img/icons/equipment/eq_pc_t3h.png',
    'pc_t4': 'img/icons/equipment/eq_pc_t4.png',
    // V8.42 新增：通用套装武器图标（第六批）
    'pc_w3m': 'img/icons/equipment/eq_pc_w3m.png',
    'pc_w3h': 'img/icons/equipment/eq_pc_w3h.png',
    'pc_w4': 'img/icons/equipment/eq_pc_w4.png',
    'pc_w4m': 'img/icons/equipment/eq_pc_w4m.png',
    'pc_w4h': 'img/icons/equipment/eq_pc_w4h.png',
    // V8.42 新增：通用套装护甲图标（第七批）
    'pc_a2': 'img/icons/equipment/eq_pc_a2.png',
    'pc_a3m': 'img/icons/equipment/eq_pc_a3m.png',
    'pc_a3h': 'img/icons/equipment/eq_pc_a3h.png',
    'pc_a4': 'img/icons/equipment/eq_pc_a4.png',
    'pc_a4m': 'img/icons/equipment/eq_pc_a4m.png',
    // V8.42 新增：宠物图标（第八批）
    'shanque': 'img/icons/equipment/eq_shanque.png',
    'xiaoheilong': 'img/icons/equipment/eq_xiaoheilong.png',
    'xiaoshihou': 'img/icons/equipment/eq_xiaoshihou.png',
    'xiaohuli': 'img/icons/equipment/eq_xiaohuli.png',
    'jinchan': 'img/icons/equipment/eq_jinchan.png',
    // V8.42 新增：宠物图标（第九批）
    'zhihe': 'img/icons/equipment/eq_zhihe.png',
    'younianqilin': 'img/icons/equipment/eq_younianqilin.png',
    'guchong': 'img/icons/equipment/eq_guchong.png',
    'renshanguozi': 'img/icons/equipment/eq_renshanguozi.png',
    'lingyan': 'img/icons/equipment/eq_lingyan.png',
    // V8.42 新增：法宝图标（第十批）
    'pc_t4m': 'img/icons/equipment/eq_pc_t4m.png',
    'pc_t4h': 'img/icons/equipment/eq_pc_t4h.png',
    'tm_t_base': 'img/icons/equipment/eq_tm_t_base.png',
    'de_t_base': 'img/icons/equipment/eq_de_t_base.png',
    'zy_t_base': 'img/icons/equipment/eq_zy_t_base.png',
    // V8.42 新增：通用套装靴子图标（第十一批）
    'tt_b1': 'img/icons/equipment/eq_tt_b1.png',
    'tt_b2': 'img/icons/equipment/eq_tt_b2.png',
    'tt_b3': 'img/icons/equipment/eq_tt_b3.png',
    'ev_b_dengyun': 'img/icons/equipment/eq_ev_b_dengyun.png',
    'ev_b_tayun': 'img/icons/equipment/eq_ev_b_tayun.png',
    // V8.42 新增：通用套装头冠图标（第十二批）
    'tt_h1': 'img/icons/equipment/eq_tt_h1.png',
    'tt_h2': 'img/icons/equipment/eq_tt_h2.png',
    'tt_h3': 'img/icons/equipment/eq_tt_h3.png',
    'ev_h_pilu': 'img/icons/equipment/eq_ev_h_pilu.png',
    'ev_h_wufo': 'img/icons/equipment/eq_ev_h_wufo.png',
    // V8.42 新增：材料/组件图标（第十三批）
    'cmp_xuantie': 'img/icons/equipment/eq_cmp_xuantie.png',
    'cmp_lingyun': 'img/icons/equipment/eq_cmp_lingyun.png',
    'cmp_yaohun': 'img/icons/equipment/eq_cmp_yaohun.png',
    'cmp_tiangong': 'img/icons/equipment/eq_cmp_tiangong.png',
    'upg_cuiling': 'img/icons/equipment/eq_upg_cuiling.png',
    // V8.42 新增：升级石图标（第十四批）
    'xw_stone': 'img/icons/equipment/eq_xw_stone.png',
    'tl_stone': 'img/icons/equipment/eq_tl_stone.png',
    'pw_stone': 'img/icons/equipment/eq_pw_stone.png',
    'yd_stone': 'img/icons/equipment/eq_yd_stone.png',
    'nm_stone': 'img/icons/equipment/eq_nm_stone.png',
    // V8.42 新增：宠物图标（第十五批）
    'yanlin': 'img/icons/equipment/eq_yanlin.png',
    'qingyuehu': 'img/icons/equipment/eq_qingyuehu.png',
    'taxue': 'img/icons/equipment/eq_taxue.png',
    'huangzhonghu': 'img/icons/equipment/eq_huangzhonghu.png',
    'shilang': 'img/icons/equipment/eq_shilang.png',
    // V8.42 新增：武器胚图标（第十六批）
    'tm_w_base': 'img/icons/equipment/eq_tm_w_base.png',
    'tl_w_base': 'img/icons/equipment/eq_tl_w_base.png',
    'pw_w_base': 'img/icons/equipment/eq_pw_w_base.png',
    'yd_w_base': 'img/icons/equipment/eq_yd_w_base.png',
    'nm_w_base': 'img/icons/equipment/eq_nm_w_base.png',
    // V8.42 新增：护甲胚图标（第十七批）
    'tm_a_base': 'img/icons/equipment/eq_tm_a_base.png',
    'tl_a_base': 'img/icons/equipment/eq_tl_a_base.png',
    'pw_a_base': 'img/icons/equipment/eq_pw_a_base.png',
    'yd_a_base': 'img/icons/equipment/eq_yd_a_base.png',
    'nm_a_base': 'img/icons/equipment/eq_nm_a_base.png',
    // V8.42 新增：法宝胚图标（第十八批）
    'tl_t_base': 'img/icons/equipment/eq_tl_t_base.png',
    'pw_t_base': 'img/icons/equipment/eq_pw_t_base.png',
    'yd_t_base': 'img/icons/equipment/eq_yd_t_base.png',
    'nm_t_base': 'img/icons/equipment/eq_nm_t_base.png',
    'tt_t_base': 'img/icons/equipment/eq_tt_t_base.png',
    // V8.42 新增：头冠胚图标（第十九批）
    'tm_h_base': 'img/icons/equipment/eq_tm_h_base.png',
    'tl_h_base': 'img/icons/equipment/eq_tl_h_base.png',
    'pw_h_base': 'img/icons/equipment/eq_pw_h_base.png',
    'yd_h_base': 'img/icons/equipment/eq_yd_h_base.png',
    'nm_h_base': 'img/icons/equipment/eq_nm_h_base.png',
    // V8.42 新增：靴子胚图标（第二十批）
    'tm_b_base': 'img/icons/equipment/eq_tm_b_base.png',
    'tl_b_base': 'img/icons/equipment/eq_tl_b_base.png',
    'pw_b_base': 'img/icons/equipment/eq_pw_b_base.png',
    'yd_b_base': 'img/icons/equipment/eq_yd_b_base.png',
    'nm_b_base': 'img/icons/equipment/eq_nm_b_base.png',
    // V8.42 新增：宠物图标（第二十一批）
    'xunzhen': 'img/icons/equipment/eq_xunzhen.png',
    'qingzhang': 'img/icons/equipment/eq_qingzhang.png',
    'lingyan_ju': 'img/icons/equipment/eq_lingyan_ju.png',
    'yanlin_wang': 'img/icons/equipment/eq_yanlin_wang.png',
    'yueying': 'img/icons/equipment/eq_yueying.png',
    // V8.42 新增：宠物图标（第二十二批）
    'xueqi': 'img/icons/equipment/eq_xueqi.png',
    'youming': 'img/icons/equipment/eq_youming.png',
    'huangyuan': 'img/icons/equipment/eq_huangyuan.png',
    'qietian': 'img/icons/equipment/eq_qietian.png',
    'huangyan': 'img/icons/equipment/eq_huangyan.png',
    // V8.42 新增：宠物图标（第二十三批）
    'jialan_he': 'img/icons/equipment/eq_jialan_he.png',
    'fanyin_he': 'img/icons/equipment/eq_fanyin_he.png',
    'baiyu': 'img/icons/equipment/eq_baiyu.png',
    'ditingyou': 'img/icons/equipment/eq_ditingyou.png',
    'foguangque': 'img/icons/equipment/eq_foguangque.png',
    // V8.42 新增：护甲胚图标（第二十四批）
    'de_a_base': 'img/icons/equipment/eq_de_a_base.png',
    'zy_a_base': 'img/icons/equipment/eq_zy_a_base.png',
    'ym_a_base': 'img/icons/equipment/eq_ym_a_base.png',
    'np_a_base': 'img/icons/equipment/eq_np_a_base.png',
    'jm_a_base': 'img/icons/equipment/eq_jm_a_base.png',
    // V8.42 新增：武器胚图标（第二十五批）
    'de_w_base': 'img/icons/equipment/eq_de_w_base.png',
    'zy_w_base': 'img/icons/equipment/eq_zy_w_base.png',
    'ym_w_base': 'img/icons/equipment/eq_ym_w_base.png',
    'np_w_base': 'img/icons/equipment/eq_np_w_base.png',
    'jm_w_base': 'img/icons/equipment/eq_jm_w_base.png',
    // V8.42 新增：法宝胚图标（第二十六批）
    'ym_t_base': 'img/icons/equipment/eq_ym_t_base.png',
    'np_t_base': 'img/icons/equipment/eq_np_t_base.png',
    'jm_t_base': 'img/icons/equipment/eq_jm_t_base.png',
    'fs_t_base': 'img/icons/equipment/eq_fs_t_base.png',
    'lh_t_base': 'img/icons/equipment/eq_lh_t_base.png',
    // V8.42 新增：高级法宝图标（第二十七批）
    'ev_t_hunyuan': 'img/icons/equipment/eq_ev_t_hunyuan.png',
    'ev_t_shanhe': 'img/icons/equipment/eq_ev_t_shanhe.png',
    'ev_t_ganlu': 'img/icons/equipment/eq_ev_t_ganlu.png',
    'ev_t_yehuo': 'img/icons/equipment/eq_ev_t_yehuo.png',
    'ev_t_bafu': 'img/icons/equipment/eq_ev_t_bafu.png',
    // V8.42 新增：高级法宝图标（第二十八批）
    'ev_t_panyu': 'img/icons/equipment/eq_ev_t_panyu.png',
    'jade_vase': 'img/icons/equipment/eq_jade_vase.png',
    'puti_seal': 'img/icons/equipment/eq_puti_seal.png',
    'renshen_branch': 'img/icons/equipment/eq_renshen_branch.png',
    'houtian_bag': 'img/icons/equipment/eq_houtian_bag.png',
    // V8.42 新增：高级法宝图标（第二十九批）
    'liuli_lamp': 'img/icons/equipment/eq_liuli_lamp.png',
    'qiankun_ring': 'img/icons/equipment/eq_qiankun_ring.png',
    'liuer_mao': 'img/icons/equipment/eq_liuer_mao.png',
    'baigu_sheli': 'img/icons/equipment/eq_baigu_sheli.png',
    'bajiao_fan': 'img/icons/equipment/eq_bajiao_fan.png',
    // V8.42 新增：高级武器图标（第三十批）
    'ev_w_langya': 'img/icons/equipment/eq_ev_w_langya.png',
    'ev_w_xingtian': 'img/icons/equipment/eq_ev_w_xingtian.png',
    'ev_w_liuzhi': 'img/icons/equipment/eq_ev_w_liuzhi.png',
    'ev_w_nilin': 'img/icons/equipment/eq_ev_w_nilin.png',
    'ev_w_jiedu': 'img/icons/equipment/eq_ev_w_jiedu.png',
    // V8.42 新增：高级护甲图标（第三十一批）
    'ev_a_wudang': 'img/icons/equipment/eq_ev_a_wudang.png',
    'ev_a_ruyi': 'img/icons/equipment/eq_ev_a_ruyi.png',
    'ev_a_gongde': 'img/icons/equipment/eq_ev_a_gongde.png',
    'ev_a_fentian': 'img/icons/equipment/eq_ev_a_fentian.png',
    'ev_a_puti': 'img/icons/equipment/eq_ev_a_puti.png',
    // V8.42 新增：高级头冠图标（第三十二批）
    'ev_h_pilu': 'img/icons/equipment/eq_ev_h_pilu.png',
    'ev_h_wufu': 'img/icons/equipment/eq_ev_h_wufu.png',
    'ev_h_zijin': 'img/icons/equipment/eq_ev_h_zijin.png',
    'ev_h_fengchi': 'img/icons/equipment/eq_ev_h_fengchi.png',
    'ev_h_puti': 'img/icons/equipment/eq_ev_h_puti.png',
    // V8.42 新增：高级靴子图标（第三十三批）
    'ev_b_dengyun': 'img/icons/equipment/eq_ev_b_dengyun.png',
    'ev_b_tayun': 'img/icons/equipment/eq_ev_b_tayun.png',
    'ev_b_fenghuo': 'img/icons/equipment/eq_ev_b_fenghuo.png',
    'ev_b_jindou': 'img/icons/equipment/eq_ev_b_jindou.png',
    'ev_b_puti': 'img/icons/equipment/eq_ev_b_puti.png',
    // V8.42 新增：宠物图标（第三十四批）
    'diting': 'img/icons/equipment/eq_diting.png',
    'tongbishiyuan': 'img/icons/equipment/eq_tongbishiyuan.png',
    'heifengxiong': 'img/icons/equipment/eq_heifengxiong.png',
    'huangfengshu': 'img/icons/equipment/eq_huangfengshu.png',
    'baigujing': 'img/icons/equipment/eq_baigujing.png',
    // V8.42 新增：材料/升级石图标（第三十五批）
    'tt_stone': 'img/icons/equipment/eq_tt_stone.png',
    'upg_duanhun': 'img/icons/equipment/eq_upg_duanhun.png',
    'xuantie': 'img/icons/equipment/eq_xuantie.png',
    'lingyun': 'img/icons/equipment/eq_lingyun.png',
    'yaohun': 'img/icons/equipment/eq_yaohun.png',
    // V8.42 新增：高级法宝图标（第三十六批）
    'zijin_hulu': 'img/icons/equipment/eq_zijin_hulu.png',
    'yangzhi_ping': 'img/icons/equipment/eq_yangzhi_ping.png',
    'huangjin_sheng': 'img/icons/equipment/eq_huangjin_sheng.png',
    'qixing_jian': 'img/icons/equipment/eq_qixing_jian.png',
    'bajiao_shan': 'img/icons/equipment/eq_bajiao_shan.png',
    // V8.42 新增：高级武器图标（第三十七批）
    'jingu_bang': 'img/icons/equipment/eq_jingu_bang.png',
    'jiuchi_pa': 'img/icons/equipment/eq_jiuchi_pa.png',
    'xiangyao_zhang': 'img/icons/equipment/eq_xiangyao_zhang.png',
    'bailong_ti': 'img/icons/equipment/eq_bailong_ti.png',
    'zijin_boyu': 'img/icons/equipment/eq_zijin_boyu.png',
    // V8.42 新增：武器图标（第三十八批）
    'fs_w_base': 'img/icons/equipment/eq_fs_w_base.png',
    'lh_w_base': 'img/icons/equipment/eq_lh_w_base.png',
    'tt_w1': 'img/icons/equipment/eq_tt_w1.png',
    'tt_w2': 'img/icons/equipment/eq_tt_w2.png',
    'tt_w3': 'img/icons/equipment/eq_tt_w3.png',
    // V8.42 新增：护甲图标（第三十九批）
    'fs_a_base': 'img/icons/equipment/eq_fs_a_base.png',
    'lh_a_base': 'img/icons/equipment/eq_lh_a_base.png',
    'tt_a1': 'img/icons/equipment/eq_tt_a1.png',
    'tt_a2': 'img/icons/equipment/eq_tt_a2.png',
    'tt_a3': 'img/icons/equipment/eq_tt_a3.png',
    // V8.42 新增：高级武器/护甲图标（第四十批）
    'ev_w_kuanglong': 'img/icons/equipment/eq_ev_w_kuanglong.png',
    'ev_a_mojiang': 'img/icons/equipment/eq_ev_a_mojiang.png',
    'dizang_staff': 'img/icons/equipment/eq_dizang_staff.png',
    'wenshu_sword': 'img/icons/equipment/eq_wenshu_sword.png',
    'huojian_spear': 'img/icons/equipment/eq_huojian_spear.png',
    // V8.42 新增：头冠/靴子图标（第四十一批）
    'ev_h_baoxiang': 'img/icons/equipment/eq_ev_h_baoxiang.png',
    'ev_h_xiuluo': 'img/icons/equipment/eq_ev_h_xiuluo.png',
    'ev_h_rulaizang': 'img/icons/equipment/eq_ev_h_rulaizang.png',
    'ev_h_zhanshen': 'img/icons/equipment/eq_ev_h_zhanshen.png',
    'ev_b_lianbu': 'img/icons/equipment/eq_ev_b_lianbu.png',
    // V8.42 新增：靴子/法宝图标（第四十二批）
    'ev_b_tahuo': 'img/icons/equipment/eq_ev_b_tahuo.png',
    'ev_b_jieyin': 'img/icons/equipment/eq_ev_b_jieyin.png',
    'ev_b_yasha': 'img/icons/equipment/eq_ev_b_yasha.png',
    'sanjian_p1': 'img/icons/equipment/eq_sanjian_p1.png',
    'sanjian_p2': 'img/icons/equipment/eq_sanjian_p2.png',
    // V8.42 新增：法宝图标（第四十三批）
    'sanjian_p3': 'img/icons/equipment/eq_sanjian_p3.png',
    'sanjian_p4': 'img/icons/equipment/eq_sanjian_p4.png',
    'sanjian_p5': 'img/icons/equipment/eq_sanjian_p5.png',
    'sanjian_p6': 'img/icons/equipment/eq_sanjian_p6.png',
    'yinyang_bottle': 'img/icons/equipment/eq_yinyang_bottle.png',
    // V8.42 新增：护甲图标（第四十四批）
    'pc_a4h': 'img/icons/equipment/eq_pc_a4h.png',
    'wuchao_robe': 'img/icons/equipment/eq_wuchao_robe.png',
    'adv_a_buyi': 'img/icons/equipment/eq_adv_a_buyi.png',
    'adv_a_bailian': 'img/icons/equipment/eq_adv_a_bailian.png',
    'adv_a_jiuzhuan': 'img/icons/equipment/eq_adv_a_jiuzhuan.png',
    // V8.42 新增：武器/靴子图标（第四十五批）
    'adv_w_lvdao': 'img/icons/equipment/eq_adv_w_lvdao.png',
    'adv_w_jingang': 'img/icons/equipment/eq_adv_w_jingang.png',
    'adv_w_wanjun': 'img/icons/equipment/eq_adv_w_wanjun.png',
    'adv_b_caoxie': 'img/icons/equipment/eq_adv_b_caoxie.png',
    'adv_b_jifeng': 'img/icons/equipment/eq_adv_b_jifeng.png',
    // V8.42 新增：靴子/法宝图标（第四十六批·最后一批）
    'adv_b_zhuri': 'img/icons/equipment/eq_adv_b_zhuri.png',
    'jiuzhang_seal': 'img/icons/equipment/eq_jiuzhang_seal.png',
    'adv_t_tongling': 'img/icons/equipment/eq_adv_t_tongling.png',
    'adv_t_bixie': 'img/icons/equipment/eq_adv_t_bixie.png',
    'adv_t_qiankun': 'img/icons/equipment/eq_adv_t_qiankun.png',},

    // 法宝图标（treasures目录）
    treasures: {
      'zijin_boyu': 'img/icons/treasures/tr_jingtanbaoyu.webp',
      'jiuhuan_xizhang': 'img/icons/equipment/eq_jiuhuanxizhang.webp',
      'jinlan_jiasha': 'img/icons/equipment/eq_jinlanjiasha.webp',
      'jingu_bang': 'img/icons/equipment/eq_ruyijingubang.webp',
      'jiuchi_dingpa': 'img/icons/equipment/eq_jiuchidingpa.webp',
      'xiangya_baozhang': 'img/icons/equipment/eq_xiangyaobaozhang.webp',
      'bajiao_shan': 'img/icons/treasures/tr_sanmeihuozhong.webp',
      'zijin_honghulu': 'img/icons/treasures/tr_luotaishi.webp',
      'yangzhi_yujingping': 'img/icons/treasures/tr_bishuizhu.webp',
      'huangjin_sheng': 'img/icons/treasures/tr_jingtanbaoyu.webp',
      'qixing_jian': 'img/icons/equipment/eq_pojunqiang.webp',
      'jingang_zhuo': 'img/icons/equipment/eq_tanlangzhui.webp',
      'jingtan_baoyu': 'img/icons/treasures/tr_jingtanbaoyu.webp',
      'xiangya_nianzhu': 'img/icons/treasures/tr_xiangyaonianzhu.webp',
      'ruyi_jingubang': 'img/icons/treasures/tr_ruyijingubang.webp',
      'sanmei_huozhong': 'img/icons/treasures/tr_sanmeihuozhong.webp',
      'luotai_shi': 'img/icons/treasures/tr_luotaishi.webp',
      'mang_zhu': 'img/icons/treasures/tr_mangzhu.webp',
      'zhusi_wang': 'img/icons/treasures/tr_zhusiwang.webp',
      'yuehua_ying': 'img/icons/treasures/tr_yuehuaying.webp',
      'shaijing_shi': 'img/icons/treasures/tr_shaijingshi.webp',
      // V9.6 西游释厄传名器图标（复用既有 webp，避免 404）
      'jinguo_zhuo': 'img/icons/equipment/eq_tanlangzhui.webp',
      'kunxian_sheng': 'img/icons/treasures/tr_zhusiwang.webp',
      'feilong_zhang': 'img/icons/treasures/tr_mangzhu.webp',
      'jiuhuan_zhang': 'img/icons/equipment/eq_xiangyaobaozhang.webp',
      'ts_jingping': 'img/icons/treasures/tr_bishuizhu.webp',
      // V10.x 新增法宝立绘（第一批）
      'tre_fengdai': 'img/icons/treasures/tr_fengdai.webp',
      'tre_dingfengzhu': 'img/icons/treasures/tr_dingfengzhu.webp',
      'tre_baozhang': 'img/icons/treasures/tr_baozhang.webp',
      'tre_yemingzhu': 'img/icons/treasures/tr_yemingzhu.webp',
      'tre_jinshen': 'img/icons/treasures/tr_jinshen.webp',
      // V10.x 新增法宝立绘（第二批）
      'tre_ruyigou': 'img/icons/treasures/tr_ruyigou.webp',
      'tre_suixinbing': 'img/icons/treasures/tr_suixinbing.webp',
      'tre_bajiaoshan_ying': 'img/icons/treasures/tr_bajiaoshan_ying.webp',
      'tre_foguang': 'img/icons/treasures/tr_foguang.webp',
      'tre_lingzhi': 'img/icons/treasures/tr_lingzhi.webp',
      // V10.x 新增法宝立绘（第三批）
      'tre_yueyachan': 'img/icons/treasures/tr_yueyachan.webp',
      'tre_muxin': 'img/icons/treasures/tr_muxin.webp',
      'tre_tidao': 'img/icons/treasures/tr_tidao.webp',
      'tre_yufu': 'img/icons/treasures/tr_yufu.webp',
      'tre_xijiaodeng': 'img/icons/treasures/tr_xijiaodeng.webp',
      // V10.x 新增法宝立绘（第四批，10件）
      'tre_daoyaochu': 'img/icons/treasures/tr_daoyaochu.webp',
      'tre_daoyaochu_yue': 'img/icons/treasures/tr_daoyaochu_yue.webp',
      'tre_nishang': 'img/icons/treasures/tr_nishang.webp',
      'tre_nishang_du': 'img/icons/treasures/tr_nishang_du.webp',
      'tre_nishang_ni': 'img/icons/treasures/tr_nishang_ni.webp',
      'tre_dingfengdan': 'img/icons/treasures/tr_dingfengdan.webp',
      'tre_dingfengdan_du': 'img/icons/treasures/tr_dingfengdan_du.webp',
      'tre_dingfengdan_yin': 'img/icons/treasures/tr_dingfengdan_yin.webp',
      'tre_renshenguo': 'img/icons/treasures/tr_renshenguo.webp',
      'tre_renshenguo_yuan': 'img/icons/treasures/tr_renshenguo_yuan.webp',
      // V10.x 新增法宝立绘（第五批，10件）
      'tre_renshenguo_duo': 'img/icons/treasures/tr_renshenguo_duo.webp',
      'tre_jingu': 'img/icons/treasures/tr_jingu.webp',
      'tre_jingu_du': 'img/icons/treasures/tr_jingu_du.webp',
      'tre_jingu_ni': 'img/icons/treasures/tr_jingu_ni.webp',
      'tre_hulu': 'img/icons/treasures/tr_hulu.webp',
      'tre_hulu_zhan': 'img/icons/treasures/tr_hulu_zhan.webp',
      'tre_hulu_ni': 'img/icons/treasures/tr_hulu_ni.webp',
      'tre_sanmei': 'img/icons/treasures/tr_sanmei.webp',
      'tre_sanmei_du': 'img/icons/treasures/tr_sanmei_du.webp',
      'tre_sanmei_ni': 'img/icons/treasures/tr_sanmei_ni.webp',
      // V10.x 新增法宝立绘（第六批，10件）
      'tre_jingangzhuo': 'img/icons/treasures/tr_jingangzhuo.webp',
      'tre_jingangzhuo_du': 'img/icons/treasures/tr_jingangzhuo_du.webp',
      'tre_jingangzhuo_ni': 'img/icons/treasures/tr_jingangzhuo_ni.webp',
      'tre_daomadu': 'img/icons/treasures/tr_daomadu.webp',
      'tre_daomadu_du': 'img/icons/treasures/tr_daomadu_du.webp',
      'tre_daomadu_ni': 'img/icons/treasures/tr_daomadu_ni.webp',
      'tre_bajiaoshan': 'img/icons/treasures/tr_bajiaoshan.webp',
      'tre_bajiaoshan_du': 'img/icons/treasures/tr_bajiaoshan_du.webp',
      'tre_bajiaoshan_duo': 'img/icons/treasures/tr_bajiaoshan_duo.webp',
      'tre_sheli': 'img/icons/treasures/tr_sheli.webp',
      // V10.x 新增法宝立绘（第七批，10件）
      'tre_sheli_du': 'img/icons/treasures/tr_sheli_du.webp',
      'tre_sheli_duo': 'img/icons/treasures/tr_sheli_duo.webp',
      'tre_jinnao': 'img/icons/treasures/tr_jinnao.webp',
      'tre_jinnao_du': 'img/icons/treasures/tr_jinnao_du.webp',
      'tre_jinnao_ni': 'img/icons/treasures/tr_jinnao_ni.webp',
      'tre_jinling': 'img/icons/treasures/tr_jinling.webp',
      'tre_jinling_du': 'img/icons/treasures/tr_jinling_du.webp',
      'tre_jinling_duo': 'img/icons/treasures/tr_jinling_duo.webp',
      'tre_yinyangping': 'img/icons/treasures/tr_yinyangping.webp',
      'tre_yinyangping_du': 'img/icons/treasures/tr_yinyangping_du.webp',
      // V10.x 新增法宝立绘（第八批，10件）
      'tre_yinyangping_ni': 'img/icons/treasures/tr_yinyangping_ni.webp',
      'set_treasure_top': 'img/icons/treasures/tr_tanlangzhui.webp',
      'ts_bowl_top': 'img/icons/treasures/tr_zijinbo.webp',
      'jiuming': 'img/icons/treasures/tr_jiuminghaomao.webp',
      'baojiao': 'img/icons/treasures/tr_baojiaoshan_tanlang.webp',
      'dingfeng': 'img/icons/treasures/tr_dingfengzhu_tanlang.webp',
      'jingu': 'img/icons/treasures/tr_ruyijingubang.webp',
      'zijinhu': 'img/icons/treasures/tr_zijinhonghulu_tanlang.webp',
      'zhaoyao': 'img/icons/treasures/tr_zhaoyaojing.webp',
      'bj_belly_top': 'img/icons/treasures/tr_tunshanbiandudu.webp',
      // V10.x 新增法宝立绘（第九批，10件 - 英雄专属法宝进阶版）
      'bj_bowl_ch2': 'img/icons/treasures/tr_bj_bowl_ch2.webp',
      'bj_bowl_ch3': 'img/icons/treasures/tr_bj_bowl_ch3.webp',
      'bj_bowl_ch4': 'img/icons/treasures/tr_bj_bowl_ch4.webp',
      'wk_treasure_ch2': 'img/icons/treasures/tr_wk_treasure_ch2.webp',
      'wk_treasure_ch3': 'img/icons/treasures/tr_wk_treasure_ch3.webp',
      'wk_treasure_ch4': 'img/icons/treasures/tr_wk_treasure_ch4.webp',
      'ts_treasure_ch2': 'img/icons/treasures/tr_ts_treasure_ch2.webp',
      'ts_treasure_ch3': 'img/icons/treasures/tr_ts_treasure_ch3.webp',
      'ts_treasure_ch4': 'img/icons/treasures/tr_ts_treasure_ch4.webp',
      'lm_treasure_ch2': 'img/icons/treasures/tr_lm_treasure_ch2.webp',
      // V10.x 新增法宝立绘（第十批，10件 - 英雄专属法宝进阶版+套装成品）
      'lm_treasure_ch3': 'img/icons/treasures/tr_lm_treasure_ch3.webp',
      'lm_treasure_ch4': 'img/icons/treasures/tr_lm_treasure_ch4.webp',
      'ss_treasure_ch2': 'img/icons/treasures/tr_ss_treasure_ch2.webp',
      'ss_treasure_ch3': 'img/icons/treasures/tr_ss_treasure_ch3.webp',
      'ss_treasure_ch4': 'img/icons/treasures/tr_ss_treasure_ch4.webp',
      'ss_skull_top': 'img/icons/treasures/tr_ss_skull_top.webp',
      'yushou': 'img/icons/treasures/tr_yushou.webp',
      'chanyu': 'img/icons/treasures/tr_chanyu.webp',
      'sanmei_top': 'img/icons/treasures/tr_sanmei_top.webp',
      'mangzhu_top': 'img/icons/treasures/tr_mangzhu_top.webp',
      // V10.x 新增法宝立绘（第十一批，10件 - 套装成品法宝）
      'yuehua_top': 'img/icons/treasures/tr_yuehua_top.webp',
      'set_treasure_t3': 'img/icons/treasures/tr_set_treasure_t3.webp',
      'heifeng_t_t3': 'img/icons/treasures/tr_heifeng_t_t3.webp',
      'shituo_t_t3': 'img/icons/treasures/tr_shituo_t_t3.webp',
      'lingyun_t_t3': 'img/icons/treasures/tr_lingyun_t_t3.webp',
      'tm_t_top': 'img/icons/treasures/tr_tm_t_top.webp',
      'de_t_top': 'img/icons/treasures/tr_de_t_top.webp',
      'zy_t_top': 'img/icons/treasures/tr_zy_t_top.webp',
      'ym_t_top': 'img/icons/treasures/tr_ym_t_top.webp',
      'np_t_top': 'img/icons/treasures/tr_np_t_top.webp',
      // V10.x 新增法宝立绘（第十二批，17件 - 套装T3成品+高级饰品，全部完成）
      'jm_t_top': 'img/icons/treasures/tr_jm_t_top.webp',
      'fs_t_top': 'img/icons/treasures/tr_fs_t_top.webp',
      'lh_t_top': 'img/icons/treasures/tr_lh_t_top.webp',
      'tm_t_t3': 'img/icons/treasures/tr_tm_t_t3.webp',
      'de_t_t3': 'img/icons/treasures/tr_de_t_t3.webp',
      'zy_t_t3': 'img/icons/treasures/tr_zy_t_t3.webp',
      'ym_t_t3': 'img/icons/treasures/tr_ym_t_t3.webp',
      'np_t_t3': 'img/icons/treasures/tr_np_t_t3.webp',
      'jm_t_t3': 'img/icons/treasures/tr_jm_t_t3.webp',
      'fs_t_t3': 'img/icons/treasures/tr_fs_t_t3.webp',
      'lh_t_t3': 'img/icons/treasures/tr_lh_t_t3.webp',
      'cf_t_hunhe': 'img/icons/treasures/tr_cf_t_hunhe.webp',
      'adv_t_bixie_mk': 'img/icons/treasures/tr_adv_t_bixie_mk.webp',
      'adv_t_qiankun_mk': 'img/icons/treasures/tr_adv_t_qiankun_mk.webp',
      'ev_t_hunyuan2': 'img/icons/treasures/tr_ev_t_hunyuan2.webp',
      'cf_t_hunhe2': 'img/icons/treasures/tr_cf_t_hunhe2.webp',
      'mj_t': 'img/icons/treasures/tr_mj_t.webp',
    },

    // 经文图标（sutras目录）。key 与 NDX.SUTRA_FULLS/NDX.NI_SUTRA_FULLS 的 sutra 短名对应；
    // 运行时 id（su_full_X / ni_full_X / 渡经碎片 su_X_N）由 NDX.sutraIconPath 归一化为短名再查表。
    sutras: {
      // 渡经（du_）
      'jingang': 'img/icons/sutras/du_jingang.webp',
      'xinjing': 'img/icons/sutras/du_xinjing.webp',
      'fahua': 'img/icons/sutras/du_fahua.webp',
      'huayan': 'img/icons/sutras/du_huayan.webp',
      'lengyan': 'img/icons/sutras/du_lengyan.webp',
      'amituo': 'img/icons/sutras/du_amituo.webp',
      'wuliangshou': 'img/icons/sutras/du_wuliangshou.webp',
      'weimo': 'img/icons/sutras/du_weimo.webp',
      'yuanjue': 'img/icons/sutras/du_yuanjue.webp',
      'niepan': 'img/icons/sutras/du_niepan.webp',
      'dabei': 'img/icons/sutras/du_dabei.webp',
      'lengqie': 'img/icons/sutras/du_lengqie.webp',
      'jieshenmi': 'img/icons/sutras/du_jieshenmi.webp',
      'dizang': 'img/icons/sutras/du_dizang.webp',
      'shanshan': 'img/icons/sutras/du_shanshan.webp',
      'tanjing': 'img/icons/sutras/du_tanjing.webp',
      // 逆经（ni_）。注：剔骨诀/斩妖诀文件名省略"jue"（ni_tigu/ni_zhanyao）
      'pojie': 'img/icons/sutras/ni_pojie.webp',
      'wuzi': 'img/icons/sutras/ni_wuzi.webp',
      'yaopu': 'img/icons/sutras/ni_yaopu.webp',
      'xinyuan': 'img/icons/sutras/ni_xinyuan.webp',
      'qitian': 'img/icons/sutras/ni_qitian.webp',
      'tigujue': 'img/icons/sutras/ni_tigu.webp',
      'zhanyaojue': 'img/icons/sutras/ni_zhanyao.webp',
      'niumo': 'img/icons/sutras/ni_niumo.webp',
      'nitian': 'img/icons/sutras/ni_nitian.webp',
    },

    // 成就图标（achievements目录）
    achievements: {
      'nidaoxixing': 'img/icons/achievements/ac_nidaoxixing.webp',
      'nidaonitian': 'img/icons/achievements/ac_nidaonitian.webp',
      'nidaoniming': 'img/icons/achievements/ac_nidaoniming.webp',
      'nidaonixin': 'img/icons/achievements/ac_nidaonixin.webp',
      'douzhanshengfo': 'img/icons/achievements/ac_douzhanshengfo.webp',
      'jingtanshizhe': 'img/icons/achievements/ac_jingtanshizhe.webp',
      'jinshenluohan': 'img/icons/achievements/ac_jinshenluohan.webp',
      'bubutianlong': 'img/icons/achievements/ac_bubutianlong.webp',
      'zhantangongdefo': 'img/icons/achievements/ac_zhantangongdefo.webp',
      'jinchanzi': 'img/icons/achievements/ac_jinchanzi.webp',
      'shanyoushanbao': 'img/icons/achievements/ac_shanyoushanbao.webp',
      'eyouebao': 'img/icons/achievements/ac_eyouebao.webp',
      'yinianchengfo': 'img/icons/achievements/ac_yinianchengfo.webp',
      'yinianchengmo': 'img/icons/achievements/ac_yinianchengmo.webp',
      'yinguoxunhuan': 'img/icons/achievements/ac_yinguoxunhuan.webp',
      'zhuangbeicangjia': 'img/icons/achievements/ac_zhuangbeicangjia.webp',
      'fabaocangjia': 'img/icons/achievements/ac_fabaocangjia.webp',
      'jingwencangjia': 'img/icons/achievements/ac_jingwencangjia.webp',
      'xiaseng': 'img/icons/achievements/ac_xiaseng.webp',
      'shangseng': 'img/icons/achievements/ac_shangseng.webp',
      'zhouseng': 'img/icons/achievements/ac_zhouseng.webp',
      'qinseng': 'img/icons/achievements/ac_qinseng.webp',
      'hanseng': 'img/icons/achievements/ac_hanseng.webp',
      'tangseng': 'img/icons/achievements/ac_tangseng.webp',
      'xixingyuanman': 'img/icons/achievements/ac_xixingyuanman.webp',
      'wanmeijieju': 'img/icons/achievements/ac_wanmeijieju.webp',
    },
  };

  // 默认图标（当找不到对应图标时使用）
  NDX.DEFAULT_ICONS = {
    equipment: 'img/icons/equipment/generic_weapon.webp',
    treasure: 'img/icons/equipment/generic_treasure.webp',
    sutra: 'img/icons/sutras/du_jingang.webp',
    achievement: 'img/icons/achievements/ac_nidaoxixing.webp',
  };

  // 按slot类型的默认图标
  NDX.SLOT_ICONS = {
    weapon: 'img/icons/equipment/generic_weapon.webp',
    armor: 'img/icons/equipment/generic_armor.webp',
    head: 'img/icons/equipment/generic_head.webp',
    boots: 'img/icons/equipment/generic_boots.webp',
    treasure: 'img/icons/equipment/generic_treasure.webp',
    pet: 'img/icons/equipment/generic_pet.webp',
    material: 'img/icons/equipment/generic_material.webp',
    rune: 'img/icons/equipment/generic_rune.webp',
  };

  /* ============================ 工具函数 ============================ */

  /**
   * 获取图标路径
   * @param {string} type - 图标类型（equipment/treasures/sutras/achievements）
   * @param {string} id - 图标ID
   * @returns {string} 图标路径
   */
  NDX.getIconPath = function (type, id) {
    if (!type || !id) return '';
    const typeMap = NDX.ICON_MAP[type];
    if (!typeMap) return '';
    return typeMap[id] || '';
  };

  /**
   * 获取装备图标路径
   * @param {string|object} equip - 装备ID或装备对象
   * @returns {string} 图标路径
   */
  NDX.getEquipIcon = function (equip) {
    if (!equip) return NDX.DEFAULT_ICONS.equipment;
    const equipId = typeof equip === 'string' ? equip : equip.id;
    const slot = typeof equip === 'object' ? equip.slot : null;
    // 先查找专属图标
    const ownIcon = NDX.getIconPath('equipment', equipId);
    if (ownIcon) return ownIcon;
    // 如果有slot类型，使用对应通用图标
    if (slot && NDX.SLOT_ICONS[slot]) return NDX.SLOT_ICONS[slot];
    // 否则使用默认图标
    return NDX.DEFAULT_ICONS.equipment;
  };

  /**
   * 获取法宝图标路径
   * @param {string} treasureId - 法宝ID
   * @returns {string} 图标路径
   */
  NDX.getTreasureIcon = function (treasureId) {
    return NDX.getIconPath('treasures', treasureId) || NDX.DEFAULT_ICONS.treasure;
  };

  /**
   * 经文图标路径归一
   * 运行时 id 形如 su_full_jingang / ni_full_pojie / 渡经碎片 su_jingang_0，
   * 归一为 sutras 表的短 key（jingang / pojie）后再取真实 du_/ni_ 图片。
   * @param {string} sutraId - 经文 id（全本 id 或渡经碎片 id）
   * @returns {string} 图标路径
   */
  NDX.sutraIconPath = function (sutraId) {
    if (!sutraId) return '';
    let key = sutraId;
    const full = sutraId.indexOf('_full_');
    if (full >= 0) {
      key = sutraId.slice(full + 6); // su_full_jingang → jingang ; ni_full_pojie → pojie
    } else if (sutraId.indexOf('su_') === 0) {
      key = sutraId.slice(3).replace(/_\d+$/, ''); // 渡经碎片 su_jingang_0 → jingang
    }
    return NDX.getIconPath('sutras', key) || NDX.DEFAULT_ICONS.sutra;
  };

  /**
   * 获取经文图标路径
   * @param {string} sutraId - 经文ID（全本 id 或渡经碎片 id）
   * @returns {string} 图标路径
   */
  NDX.getSutraIcon = function (sutraId) {
    return NDX.sutraIconPath(sutraId);
  };

  /**
   * 获取成就图标路径
   * @param {string} achievementId - 成就ID
   * @returns {string} 图标路径
   */
  NDX.getAchievementIcon = function (achievementId) {
    return NDX.getIconPath('achievements', achievementId) || NDX.DEFAULT_ICONS.achievement;
  };

  /**
   * 获取图标HTML
   * @param {string} iconPath - 图标路径
   * @param {string} className - CSS类名
   * @param {string} alt - 替代文本
   * @returns {string} 图标HTML
   */
  NDX.getIconHtml = function (iconPath, className, alt) {
    if (!iconPath) return '';
    const cls = className || 'game-icon';
    const altText = alt || '';
    // 图片加速：优先 webp（见 index.html __pickWebp/__pickWebpImgFallback）。
    // 浏览器若不支持 webp 则 iconPath 不会被改写，仍按原图加载，安全。
    var real = typeof window.__pickWebp === 'function' ? window.__pickWebp(iconPath) : iconPath;
    return `<img src="${real}" class="${cls}" alt="${altText}" loading="lazy" decoding="async" onerror="(window.__pickWebpImgFallback && __pickWebpImgFallback(this)) || (this.style.display='none')">`;
  };

  /**
   * 图片加速：递归替换 ICON_MAP / EQUIP_ICON / HERO_PORTRAIT_TABLE ... 所有字符串值内 .png → __pickWebp
   *  作用范围：英雄头像、装备、法宝、经文、劫印、成就、NPC 等所有 game 内部图标路径。
   *  若有 webp 缺失则通过上面 getIconHtml onerror 回退 png，不会空白。
   */
  (function () {
    if (typeof window.__pickWebp !== 'function') return;
    var pick = window.__pickWebp;
    var seen = [];
    function walk(o) {
      if (!o) return o;
      if (seen.indexOf(o) >= 0) return o;
      var t = typeof o;
      if (t === 'string') return /\.(png|jpg|jpeg)($|\?)/i.test(o) ? pick(o) : o;
      if (Array.isArray(o)) { seen.push(o); for (var i=0;i<o.length;i++) o[i] = walk(o[i]); return o; }
      if (t === 'object') {
        seen.push(o);
        var keys = Object.keys(o);
        for (var k=0;k<keys.length;k++) {
          var kk = keys[k];
          var v = o[kk];
          // 跳过可能循环的函数与 prototype 污染
          if (v && typeof v === 'function') continue;
          try { o[kk] = walk(v); } catch(e) {}
        }
      }
      return o;
    }
    try { walk(NDX); } catch(e) {}
  })();

  /**
   * 根据装备对象获取图标HTML
   * @param {object} equip - 装备对象
   * @param {string} className - CSS类名
   * @returns {string} 图标HTML
   */
  NDX.getEquipIconHtml = function (equip, className) {
    if (!equip) return '';
    const iconPath = NDX.getEquipIcon(equip);
    const equipName = typeof equip === 'object' ? equip.name : '';
    return NDX.getIconHtml(iconPath, className || 'equip-icon', equipName);
  };

  /**
   * 根据法宝对象获取图标HTML
   * @param {object} treasure - 法宝对象
   * @param {string} className - CSS类名
   * @returns {string} 图标HTML
   */
  NDX.getTreasureIconHtml = function (treasure, className) {
    if (!treasure || !treasure.id) return '';
    const iconPath = NDX.getTreasureIcon(treasure.id);
    return NDX.getIconHtml(iconPath, className || 'treasure-icon', treasure.name);
  };

  console.log('[NDX] 图标映射管理器已加载，图标类型：' + Object.keys(NDX.ICON_MAP).join(', '));
})();
