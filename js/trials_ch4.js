// ============================================================================
// trials_ch4.js — 《逆道西行》八十一难 · 第 4 章（难 32–41，骨架 v1.19 对齐）
// 拆分依据：骨架 v1.19 九章边界（合入式，保持 NDX.TRIAL_LIB 单对象接口）
// act 字段暂置 4（由 trials_return.js 的 normalizeTrialLibAct() 按 ACT_RANGES 统一派生）。
// 内容来源：《第四章_金兜山之劫_32-41难_新版.md》(v3.1 终版 · SOURCE OF TRUTH)。
// 结构：32 黑水河·鼍龙(单) / 33-35 车迟国(复合·3难合并·branchKey n33_chechi) /
//       36-38 通天河(复合·3难合并·branchKey n36_tongtian) /
//       39-41 金兜山·青牛精(复合·3难合并·Boss·branchKey n39_qingniu)。
// 复合建模说明：文档将 33-35 / 36-38 / 39-41 各记为「3难合并·系数×3」单一劫难，
//   映射到骨架 3 个 id（首=分叉/入局，次=执行阶段，末=终局六道抉择），以单 branchKey 串联；
//   终局六道 +1 统一在每组末难结算（符合文档「终局结算一次」）。
// ============================================================================
NDX.TRIAL_LIB = Object.assign(NDX.TRIAL_LIB || {},
{
  // ── 第32难 · 黑水河·鼍龙（单劫难，从第三章移至本章） ──────────────────────
  32: {
    id: 32,
    name: '黑水河·鼍龙',
    act: 4,
    type: 'event',
    icon: '🌊',
    portrait: '鼍龙',
    fate: '渡',
    echo: '渡→沧海龙纹(僧冠配件)；缘→鼍龙羁绊；战/逆/隐通用；绿劫印',
    dark: '黑水河底的鼍龙，是西海龙王的外甥，父亲泾河龙王被魏征梦斩，母亲是西海龙王的妹妹。它因血统不纯被贬来管这条河。它变作艄公，划船来渡；唐僧、八戒一上船，船便翻入水中，人被摄走。沙僧下水与它战，不敌，败回岸上。它拦你，不为吃你，为的是让你替它说一句话：我到底算不算龙。原来龙族最讲究的不是法力，是出身——你再能打，血里掺了一点别的，就永远只能守一条黑水河。',
    intro: '黑水河漆黑无船。艄公来渡，他不为吃你，只为替自己说一句话——我算不算龙？',
    options: [
      { key: '战', label: '下水与鼍龙力拼', fate: '战', fight: true, battleFlags: { openingMomentum: 1 }, effect: { alignEvil: 5, ti: { atk: 9, hp: 38 } }, setFlag: 'n32_heishui:zhan', consequence: '苦战击败鼍龙，西海龙王将其带回受罚；杀生，不合唐僧本性但救了人' },
      { key: '渡', label: '请摩昂收伏鼍龙', fate: '渡', effect: { material: '沧海龙纹',  alignGood: 8, favor: '西海龙王' }, setFlag: 'n32_heishui:du', consequence: '西海龙王派太子摩昂收鼍龙；得沧海龙纹(僧冠配件·渡线)；后续水系劫难难度降低' },
      { key: '逆', label: '折服鼍龙，纳为随行', fate: '逆', ni: true, effect: { alignEvil: 8, ally: 'tuolong_ren' }, setFlag: 'n32_heishui:ni', consequence: '鼍龙跪降随你西行；得逆道随从【鼍龙·人形态】；西海龙王记恨，后续水系劫难难度增加' },
      { key: '隐', label: '不揭穿，绕道而行', fate: '隐', effect: { alignEvil: 8, eva: 8 }, setFlag: 'n32_heishui:yin', consequence: '看破艄公是鼍龙所变却不揭穿，绕道离开；见死不救，合恶' },
      { key: '缘', label: '替鼍龙向西海正名', fate: '缘', effect: { alignGood: 10, follower: 'ni_tuolong' }, setFlag: 'n32_heishui:yuan', consequence: '替鼍龙向西海龙王说项，成全龙族羁绊；得鼍龙羁绊，后续水系劫难可触发援助' }
    ]
  },

  // ── 第33难 · 车迟国·斗法分叉（复合 33-35 · 首） ───────────────────────────
  33: {
    id: 33,
    name: '车迟国·斗法',
    act: 4,
    type: 'event',
    icon: '⚡',
    portrait: '虎力大仙',
    fate: '渡',
    echo: '车迟国·分叉：文斗→渡/缘/隐；武斗→战/逆；branchKey n33_chechi',
    branchKey: 'n33_chechi',
    dark: '车迟国的和尚都被奴役做苦工，三个国师虎力、鹿力、羊力都是妖怪修成的道士，靠五雷法求雨骗取国王宠信，在车迟国作威作福二十年。城中道士锦衣玉食，和尚衣衫褴褛，国王下令：和尚见道士不拜者，死。虎力登坛求雨，令牌一响，风云变色；悟空暗中念咒，止住龙王，虎力求雨失败。你可以让唐僧登坛接下这场文斗，也可以叫悟空直接与三妖动手——一动手，三妖便是人的模样站在殿前，唐僧的斥语一飘，你的力就散了八成。',
    intro: '车迟国中，三妖作威作福。登坛依样斗法，还是不屑斗法直接动手？',
    options: [
      { key: '渡', label: '登坛求雨，依样斗法', fate: '渡', effect: { alignGood: 5 }, setFlag: 'n33_chechi:wen', consequence: '走文斗路线：求雨→坐禅→隔板猜物，三场文斗任意一场可抽身' },
      { key: '战', label: '不屑斗法，径直动手', fate: '战', effect: { alignEvil: 4 }, setFlag: 'n33_chechi:wu', consequence: '走武斗路线：三妖化为人形态立于殿前，唐僧斥语压下你的手' }
    ]
  },

  // ── 第34难 · 车迟国·两途（复合 33-35 · 次：执行阶段） ────────────────────
  34: {
    id: 34,
    name: '车迟国·两途',
    act: 4,
    type: 'event',
    icon: '⚔️',
    fate: '战',
    echo: '车迟国·执行：文斗三场(可隐)/武斗三场(人形态·唐僧斥语 -80%)',
    branchKey: 'n33_chechi',
    dark: '文斗有三场：求雨、坐禅、隔板猜物。鹿力与唐僧比坐禅，变臭虫咬他，悟空变蜈蚣反咬，把鹿力掀下高台；羊力猜柜中之物，悟空钻进柜里把山河社稷袄换成一件破烂僧衣，让他输得一句话说不出。三场文斗之后是三场武斗：砍头、剖腹、下油锅。虎力的头被砍下，悟空变黄狗叼走；鹿力被悟空变老鹰抓走肠子；羊力下油锅，悟空叫龙王收走护身的冷龙，油锅沸腾。若你选的是武斗路线，三妖便是人形轮番上阵，斥语压着你的手，得靠照妖镜照破本相，或唤土地山神作证。',
    intro: '文斗三场，或武斗三场。人形态前唐僧斥语压手，照妖镜与土地山神可破。',
    options: [
      { key: '渡', label: '三场文斗，全胜推进', fate: '渡', effect: { alignGood: 5 }, requireFlag: 'n33_chechi:wen', setFlag: 'n33_chechi:wensheng', consequence: '文斗全胜（求雨/坐禅/隔板猜物），进入三场武斗（砍头/剖腹/下油锅，按原著无战斗）' },
      { key: '隐', label: '中途抽身离去', fate: '隐', effect: { alignEvil: 2 }, requireFlag: 'n33_chechi:wen', setFlag: 'n33_chechi:wenyin', consequence: '文斗途中不愿纠缠，带唐僧绕道，车迟国和尚继续受苦' },
      { key: '战', label: '连战三场，硬碰硬', fate: '战', effect: { alignEvil: 4 }, requireFlag: 'n33_chechi:wu', fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n33_chechi:wubare', consequence: '武斗三场均为人形态（唐僧斥语 -80%），连战三场后触发最终战三妖一同上阵' },
      { key: '战', label: '取出照妖镜破幻', fate: '战', effect: { alignEvil: 3 }, requireFlag: 'n33_chechi:wu', fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n33_chechi:wubare', consequence: '照妖镜破人形态→三妖现妖形态，伤害恢复，三场战斗后得战' }
    ]
  },

  // ── 第35难 · 车迟国·终局抉择（复合 33-35 · 末：六道 +1 结算） ─────────────
  35: {
    id: 35,
    name: '车迟国·终局',
    act: 4,
    type: 'event',
    icon: '🏯',
    fate: '渡',
    echo: '车迟国·终局：渡→避雷珠/战→车迟妖丹/逆→三妖人形态/隐/缘；绿劫印',
    branchKey: 'n33_chechi',
    dark: '三妖现了原形——黄毛虎、白毛角鹿、羚羊。国王这才醒悟，二十年宠信的国师竟是妖怪。你可以让国王释放和尚、拆毁道观，也可以收下三妖做逆道随从，或者点化它们：它们修了三千年，只求一个正果，佛门不给，便自己做国师受香火——这话你听着未免耳熟，五百年前你也求不到正果，便自封了个齐天大圣。文斗中你随时可以抽身走人，把车迟国的和尚留在那里继续受苦。你要哪一条：成全它们，还是成全你自己那点旧账。',
    intro: '三妖现原形或伏法。车迟国的因果，等你收尾。',
    options: [
      { key: '渡', label: '文斗全胜，三妖现原形', fate: '渡', requireFlag: 'n33_chechi:wensheng', effect: { alignGood: 24, treasure: 'tre_bileizhu' }, setFlag: 'n33_chechi:du', consequence: '三场文斗全胜、三妖现原形；雷部天将收雷时赐避雷珠(僧冠配件·配件+法宝双用·不消耗)；国王释放和尚' },
      { key: '战', label: '以力破三妖六形态', fate: '战', requireFlag: 'n33_chechi:wubare', fight: true, battleFlags: { openingMomentum: 1 }, effect: { alignEvil: 15, ti: { atk: 10, hp: 45 }, material: '车迟妖丹' }, setFlag: 'n33_chechi:zhan', consequence: '纯实力击破三妖六形态；得车迟妖丹(沙僧本命·战线)' },
      { key: '逆', label: '折服三妖，纳为随行', fate: '逆', ni: true, requireFlag: 'n33_chechi:wubare', effect: { alignEvil: 24, ally: 'chechi_sanyao_ren' }, setFlag: 'n33_chechi:ni', consequence: '未用法宝、未请救兵纯实力折服三妖；得逆道随从【虎力/鹿力/羊力·人形态】，触发【车迟三仙】羁绊；天庭记恨' },
      { key: '隐', label: '文斗中途抽身离去', fate: '隐', requireFlag: 'n33_chechi:wenyin', effect: { alignEvil: 24, eva: 9 }, setFlag: 'n33_chechi:yin', consequence: '文斗中途抽身，不管和尚死活，绕道而行' },
      { key: '缘', label: '点化三妖，许以正果', fate: '缘', requireFlag: 'n33_chechi:wensheng', effect: { alignGood: 30, follower: 'chechi_sanyao_ren' }, setFlag: 'n33_chechi:yuan', consequence: '点化三妖，许以取经正果；得三妖羁绊【车迟三仙】，后续仙属性劫难难度降低' }
    ],
    branches: {
      wen: { intro: '你走文斗路线，三场斗法全胜，三妖现出黄毛虎、白毛角鹿、羚羊原形。' },
      wu: { intro: '你走武斗路线，三妖立于殿前，人形态前唐僧斥语压手——你终究凭本事破局。' }
    }
  },

  // ── 第36难 · 通天河·送童分叉（复合 36-38 · 首） ─────────────────────────
  36: {
    id: 36,
    name: '通天河·送童',
    act: 4,
    type: 'event',
    icon: '🐟',
    portrait: '灵感大王',
    fate: '渡',
    echo: '通天河·分叉：变童/硬打/绕道；branchKey n36_tongtian',
    branchKey: 'n36_tongtian',
    dark: '八百里通天河，白茫茫望不到对岸。庄主陈澄、陈清跪在唐僧面前，老泪纵横：河里有个灵感大王，每年要吃一对童男女，今年轮到陈家。不送，就降灾；送了，孩子就没了。悟空说这有何难，我变童男，八戒变童女，在庙里等他。八戒嘟囔，上次高老庄变翠兰，这次又变童女。你可以依这条原著的计，让两个假童男女被抬进庙去；也可以不等祭祀，直接拎棒子上门打——那条路一开局，水盾便在灵感大王身上罩着，你打它，力先减掉八成。',
    intro: '陈家庄哭诉童男女之祸。变童入庙等候，还是直接打上门？',
    options: [
      { key: '渡', label: '变作童男女，庙中等候', fate: '渡', effect: { alignGood: 5 }, setFlag: 'n36_tongtian:bian', consequence: '悟空变童男、八戒变童女，入灵感大王庙等候（原著路线）' },
      { key: '战', label: '直接闯入灵感庙', fate: '战', effect: { alignEvil: 4 }, setFlag: 'n36_tongtian:ying', consequence: '不等祭祀，直接打上门去，进入灵感大王现本相（战斗难度较高）' },
      { key: '隐', label: '不救陈家庄，绕道而过', fate: '隐', effect: { alignEvil: 4 }, setFlag: 'n36_tongtian:walk', consequence: '不愿与灵感大王纠缠，带唐僧从上游浅滩渡过，童男女继续被吃' }
    ]
  },

  // ── 第37难 · 通天河·庙与冰面（复合 36-38 · 次：查真相/被掳） ─────────────
  37: {
    id: 37,
    name: '通天河·庙与冰',
    act: 4,
    type: 'event',
    icon: '❄️',
    fate: '战',
    echo: '通天河·执行：庙中现形(九瓣赤铜锤)/冰面被掳(水盾机制·-80%)',
    branchKey: 'n36_tongtian',
    dark: '三更时分，庙外风声大作。灵感大王推门而入——头戴金盔，身披银甲，手持九瓣赤铜锤，地面被他踩得供桌烛火直晃。他嗅了嗅，说今年的童男女怎么有股猴子味。悟空现了原形，一棒打去，八戒也现形筑耙，灵感大王以一敌二，渐渐不支，虚晃一锤，跳入通天河逃了。随后他使了一条毒计：一夜降雪结冰，诱你们踏冰过河。悟空说九月天怎会结冰，恐怕有诈；唐僧却信了八戒，走上冰面。行至河心，咔嚓一声，冰裂了。',
    intro: '庙中现形，灵感大王跳河；当夜降雪结冰，行至河心——冰裂，师父被掳入水府。',
    options: [
      { key: '渡', label: '庙中现形，逼妖出战', fate: '渡', effect: { alignGood: 4 }, requireFlag: 'n36_tongtian:bian', setFlag: 'n36_tongtian:fought', consequence: '庙中逼出灵感大王，妖怪跳水逃去，引出水府决战' },
      { key: '战', label: '冰面行至河心，落水被掳', fate: '战', effect: { alignEvil: 4 }, requireFlag: 'n36_tongtian:ying', fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n36_tongtian:fought', consequence: '硬打路线直入水府，灵感大王水盾护体，决战开启' }
    ]
  },

  // ── 第38难 · 通天河·终局抉择（复合 36-38 · 末：六道 +1 结算） ─────────────
  38: {
    id: 38,
    name: '通天河·终局',
    act: 4,
    type: 'fight',
    icon: '🌊',
    portrait: '灵感大王',
    fate: '渡',
    echo: '通天河·终局：战/渡/夺/隐(无逆无缘·食人红线)；绿劫印',
    branchKey: 'n36_tongtian',
    dark: '水府之中，灵感大王立于唐僧身前，周身水盾护体，水流在他身边旋转，形成一道无形的屏障，兵器打上去，力道先被卸去大半。八戒若在队，因他执掌过天河水军，能入水助战，把水盾的减伤压到五成；若有避水珠，入水即化，一道光芒散开，水盾应声而破。你可以请观音来，她用竹篮从河里捞起一条金鱼，说我莲花池里的金鱼逃下凡间，今日收他回去；也可以就地打死它，或趁它落败夺下那柄九瓣赤铜锤。只是这一难——它吃过陈家庄的童男女，逆与缘两条路，都收不了它。',
    intro: '灵感大王水盾护体。破盾、请观音，还是见宝起意？',
    options: [
      { key: '战', label: '水中苦战，送它归池', fate: '战', requireFlag: 'n36_tongtian:fought', fight: true, battleFlags: { openingMomentum: 1 }, effect: { alignEvil: 15, ti: { atk: 12, hp: 60 } }, setFlag: 'n36_tongtian:zhan', consequence: '不请救兵不用法宝，破水盾一棒了结；金鱼精现原形（观音莲花池金鱼）' },
      { key: '渡', label: '往南海请观音收伏', fate: '渡', requireFlag: 'n36_tongtian:fought', effect: { material: '金鱼古舍利',  alignGood: 24 }, setFlag: 'n36_tongtian:du', consequence: '观音竹篮捞金鱼收回；得金鱼古舍利(法杖配件)＋寒潭冰苔(僧履配件)' },
      { key: '夺', label: '取其九瓣赤铜锤', fate: '夺', requireFlag: 'n36_tongtian:fought', effect: { alignEvil: 30, treasure: 'tre_jiuban_chitongchui' }, setFlag: 'n36_tongtian:duo', consequence: '击败金鱼精后夺九瓣赤铜锤(主动水系范围伤害·被动水中增伤)；与观音作别' },
      { key: '隐', label: '不救陈家庄，绕道而过', fate: '隐', requireFlag: 'n36_tongtian:walk', effect: { alignEvil: 24, eva: 9, material: '冰河潜影' }, setFlag: 'n36_tongtian:yin', consequence: '绕道浅滩渡过，童男女继续被吃；得冰河潜影(白马本命·隐线)' }
    ],
    branches: {
      bian: { intro: '你变作童男女入庙，引出灵感大王，终究踏入水府决战。' },
      ying: { intro: '你不等祭祀直接打上门，灵感大王早有准备，水盾护体恶战一场。' },
      walk: { intro: '你不愿纠缠，带唐僧从上游浅滩绕过八百里通天河。' }
    }
  },

  // ── 第39难 · 金兜山·分叉（复合 39-41 · 首：Boss 入局） ──────────────────
  39: {
    id: 39,
    name: '金兜山·分叉',
    act: 4,
    type: 'event',
    icon: '🐂',
    portrait: '青牛精',
    fate: '战',
    echo: '金兜山·分叉：硬打/请老君；branchKey n39_qingniu；三态·芭蕉扇破琢',
    branchKey: 'n39_qingniu',
    dark: '悟空临行化斋，用金箍棒在地上画了一个圈，金光闪闪，说妖魔鬼怪进不来，叫师徒在圈里等。唐僧等了许久，八戒先坐不住：猴哥画个圈就能挡妖怪？前头有座洞府，不如去借宿。唐僧被说动了心，迈出圈外，走到金兜洞前敲门，门里出来一个青面獠牙的妖怪，一把抓住他。八戒沙僧刚要动手，那妖怪抛出一个白森森的圈子，刷的一声，九齿钉耙、降妖宝杖全被收走。那圈叫金刚琢，本在太上老君手里。',
    intro: '金兜洞外，青牛精持金刚琢套尽神兵。直接打上山，还是先查它的来历？',
    options: [
      { key: '战', label: '抡棒打上山门', fate: '战', effect: { alignEvil: 4 }, setFlag: 'n39_qingniu:da', consequence: '直接打上山：青牛精有准备，金刚琢收兵器，战斗难度高' },
      { key: '渡', label: '先去天庭查来历', fate: '渡', effect: { alignGood: 5 }, setFlag: 'n39_qingniu:cha', consequence: '查遍天庭西天，终至兜率宫唤醒老君；老君持芭蕉扇收青牛（战斗难度低）' }
    ]
  },

  // ── 第40难 · 金兜山·战斗（复合 39-41 · 次：金刚琢收宝） ─────────────────
  40: {
    id: 40,
    name: '金兜山·收宝',
    act: 4,
    type: 'fight',
    icon: '⭕',
    fate: '战',
    echo: '金兜山·战斗：金刚琢收宝(法宝兵器一律失效)；纯本事可直捣第三态',
    branchKey: 'n39_qingniu',
    dark: '那妖怪是太上老君的坐骑青牛，趁老君打盹偷了金刚琢下凡。金刚琢是锟钢抟炼，善能变化，水火不侵，能套诸物，收尽天下兵器法宝，无物不纳。你一提兵器，它就把圈子抛出来，刷的一声，连你的法宝一起收走，本场再也用不了。所以这一战只剩两条活路：请太上老君来收——老君手里那把芭蕉扇，是唯一扇得动金刚琢的东西；或是全程不碰法宝，凭一双拳头硬打。金刚琢收得了兵器，收不了拳头：你若敢赤手空拳站到最后，它反倒会服你。',
    intro: '金刚琢收尽你的兵器法宝，赤手相搏。唯凭本事与随从，或留待老君。',
    options: [
      { key: '战', label: '金刚琢收宝，赤手相搏', fate: '战', effect: { alignEvil: 4 }, requireFlag: 'n39_qingniu:da', fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n39_qingniu:dafought', consequence: '硬打路线：兵器尽失，纯靠神通与随从死战（未用法宝纯实力→可触发逆）' },
      { key: '渡', label: '请动老君，收了青牛', fate: '渡', effect: { alignGood: 5 }, requireFlag: 'n39_qingniu:cha', setFlag: 'n39_qingniu:chadone', consequence: '老君持芭蕉扇念真言，青牛现原形、金刚琢被收回（渡路线收尾）' }
    ]
  },

  // ── 第41难 · 金兜山·青牛精 Boss（复合 39-41 · 末：六道 +1 结算） ─────────
  41: {
    id: 41,
    name: '金兜山·青牛精',
    act: 4,
    type: 'boss',
    icon: '👑',
    portrait: '青牛精',
    fate: '战',
    echo: '金兜山·青牛精Boss：战/渡/逆/夺(无隐无缘)；章末舍利+蓝劫印；三态·芭蕉扇破琢',
    branchKey: 'n39_qingniu',
    dark: '青牛精现出原形，是太上老君的一头青牛。老君赶来，收回金刚琢，骑牛回兜率宫，沉默地走了；你也可以在打死它之后，把那枚能收天下法宝的圈子据为己有，对老君说：你的青牛下凡为妖，伤了我师父，这琢就当赔偿。老君脸色铁青，拂袖而去。章末三态，人形的魔王、金刚琢环身的无敌态、直到青牛本相；第二态法宝兵器一律失效，唯芭蕉扇可破。赢了这一场你才算明白：能收走你所有东西的，从来不是那只圈子，是那个总想仗着东西赢的你。',
    intro: '青牛精三态层叠——人形魔王、金刚琢无敌态、青牛本相。芭蕉扇可破第二态，纯本事可直捣第三态。',
    options: [
      { key: '战', label: '凭一身本事击倒青牛精', fate: '战', requireFlag: 'n39_qingniu:da', fight: true, battleFlags: { openingMomentum: 1 }, effect: { alignEvil: 15, ti: { atk: 13, hp: 55 } }, setFlag: 'n39_qingniu:zhan', consequence: '赤手凭实力打死青牛精；太上老君赶来收回金刚琢，沉默离去' },
      { key: '渡', label: '上兜率宫请太上老君', fate: '渡', requireFlag: 'n39_qingniu:cha', effect: { material: '老君金箍',  alignGood: 24 }, setFlag: 'n39_qingniu:du', consequence: '老君持芭蕉扇收青牛；得老君金箍(僧冠配件·渡线)' },
      { key: '逆', label: '纯凭实力折服，纳为随行', fate: '逆', ni: true, requireFlag: 'n39_qingniu:da', effect: { alignEvil: 24, ally: 'qingniu_ren' }, setFlag: 'n39_qingniu:ni', consequence: '未用法宝未请救兵纯实力打服青牛精；得逆道随从【青牛精·人形态】，太上老君记恨' },
      { key: '夺', label: '收了金刚琢，与老君作别', fate: '夺', requireFlag: 'n39_qingniu:da', effect: { alignEvil: 30, treasure: 'tre_jingangzhuo' }, setFlag: 'n39_qingniu:duo', consequence: '击败青牛精后夺金刚琢(主动收敌方兵器法宝·被动法宝减伤)；与太上老君翻脸' }
    ],
    treasure: { id: 'qingniu_sheli', type: 'treasure', note: '青牛精·章末舍利（蓝劫印·章末Boss）' },
    hidden: { hero: 'wukong', cond: '逆 + 未用法宝', job: '悟空的棒', hint: '金兜山纯凭实力、不借法宝折服青牛——空而不空', desc: '体物伤+20%，分身替死（悟空·持棒者隐藏事件）' },
    branches: {
      da: { intro: '你直接打上山，金刚琢收尽兵器，赤手与青牛精死战。' },
      cha: { intro: '你先查来历，太上老君持芭蕉扇亲临金兜山，念真言收了青牛。' }
    }
  }
});
