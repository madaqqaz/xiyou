// ============================================================================
// trials_ch7.js — 《逆道西行》八十一难 · 第 7 章（难 52–64，骨架 v1.19 对齐）
// 拆分依据：骨架 v1.19 九章边界（合入式，保持 NDX.TRIAL_LIB 单对象接口）
// act 字段按指令统一写 7（由 trials_return.js 的 normalizeTrialLibAct() 按 ACT_RANGES 再次派生）。
// 内容来源：《第七章_狮驼岭之劫_52-64难_新版.md》(v3.0 终版 · SOURCE OF TRUTH)。
// 结构：52 荆棘岭(单) / [53,54] 小雷音寺·黄眉童儿(复合·2难) /
//       55 稀柿同(单) / [56,57,58] 朱紫国·金圣宫(复合·3难) /
//       59 盘丝洞(单) / 60 黄花观(单) / [61,62,63,64] 狮驼岭·三魔(复合·4难 · 章末Boss · 多形态)。
// 劫印档：单劫 绿(52/55/59/60) ＋ 复合 蓝(53-54×2 / 56-58×3) ＋ 章末Boss 红(61-64×4)。
// 食人红线：61-64 大鹏食人 → 逆/缘禁用。
// ============================================================================
NDX.TRIAL_LIB = Object.assign(NDX.TRIAL_LIB || {},
{
  // ── 第52难 · 荆棘岭·树精杏仙（单劫难 · 绿） ──────────────────────────────
  52: {
    id: 52,
    name: '荆棘岭·树精杏仙',
    act: 7,
    type: 'event',
    icon: '🌳',
    portrait: '杏仙',
    fate: '渡',
    echo: '六道全集(战/渡/隐/缘/逆/夺) · 渡→木仙庵古舍利(H1)+荆棘藤条(僧履) · 缘→随从杏仙 · 隐→闪避装 · 逆→十八公·人形态 · 夺→杏仙内丹 · 定魂珠钩子',
    dark: '荆棘岭八百里荆棘无路。四个树精——松、柏、桧、竹，还有一个杏仙，把你掳到木仙庵，请你谈诗论道。谈着谈着，杏仙开口：出家人便不能有情吗？你答不上来。它们不主动伤人，只是把你按在席上，陪你论了一夜又一夜的道。八戒等得不耐，说拱倒树木便能出去——可树一倒，这几个跟你论了一整夜诗的老树，就再没人记得了。定魂珠能护住你的心神，不被摄魂。这一难不是要你降妖，是要你回答：出家人，到底能不能有情。',
    intro: '木仙庵中，树精邀你谈诗，杏仙含情欲留你做桩。八戒在旁撺掇动手，你如何作答？',
    options: [
      { key: '战', label: '让八戒打死树精', fate: '战', effect: { alignEvil: 10, ti: { atk: 14, hp: 72 } }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n52_jingji:zhan', consequence: '木仙庵一片狼藉，树精尽殁。成就【情的终结者】' },
      { key: '渡', label: '以情点化，渡化树精', fate: '渡', effect: { material: '木仙庵古舍利',  alignGood: 8 }, setFlag: 'n52_jingji:du', consequence: '得木仙庵古舍利(H1·隐藏配件池，不计6数) 与 荆棘藤条(六纤④·僧履配件)；成就【情的点化者】' },
      { key: '隐', label: '看破情执，绕庵而过', fate: '隐', effect: { alignGood: 5, eva: 8 }, setFlag: 'n52_jingji:yin', consequence: '不接杏仙的话，带徒绕出木仙庵。成就【情的看破者】' },
      { key: '缘', label: '点化杏仙，收为随从', fate: '缘', effect: { alignGood: 10, ally: 'xingxian' }, setFlag: 'n52_jingji:yuan', consequence: '得随从【杏仙】(花木之术·群体回复)；成就【情的成全者】' },
      { key: '逆', label: '收树精为逆道随从', fate: '逆', ni: true, effect: { alignEvil: 5, niSutra: 'ni_shuqing', ally: 'shibagong' }, requireFlag: 'n52_jingji:zhan', consequence: '前提：战路线获胜未请救兵未用法宝。得逆道经文＋逆道随从【十八公·人形态】；成就【情的征服者】' },
      { key: '夺', label: '夺取杏仙的内丹', fate: '夺', effect: { alignEvil: 8, ti: { hp: 60 }, treasure: 'xingxian_neidan' }, fight: true, setFlag: 'n52_jingji:duo', consequence: '得法宝【杏仙内丹】(每回合回气血·杏花粉昏迷)；成就【杏仙内丹入手】' }
    ]
  },

  // ── 第53-54难 · 小雷音寺·黄眉童儿（复合·2难 · 蓝） ──────────────────────
  // 53 = 遭遇（假佛金铙·金铙雷音阵），54 = 破阵结算（依53抉择）
  53: {
    id: 53,
    name: '小雷音寺·假佛金铙',
    act: 7,
    type: 'fight',
    icon: '🔔',
    portrait: '黄眉童儿',
    fate: '渡',
    echo: '复合第1难·金铙雷音阵(避雷珠+定魂珠双开破阵) · 六道全集 · branchKey n53_xiaoleiyin',
    branchKey: 'n53_xiaoleiyin',
    dark: '小雷音寺的黄眉童儿是弥勒佛的童子，偷了金铙和人种袋下界为妖，变成如来的样子在寺里讲经，要你跪拜。它问：假佛便不能拜吗？你答不上来。它一件人种袋能收一切仙佛，一只金铙能困一切妖魔。它摆下金铙雷音阵，不用避雷珠，雷音一震，唐僧的心神先碎；可光有避雷珠还不够——它还要定魂珠镇精神，双珠合璧才站得住念经。这两颗珠子平时只是僧袍上的配件，到了这里，却是一整个阵的命门。',
    intro: '小雷音寺殿上，黄眉童儿端坐莲台，金铙雷音阵阵阵催魂。你如何破这假佛之局？',
    options: [
      { key: '战', label: '直接击败黄眉童儿', fate: '战', effect: { alignEvil: 10, ti: { atk: 16, hp: 80 } }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n53_xiaoleiyin:zhan', consequence: '斗三日不请弥勒，纯凭实力击败。成就【假佛的终结者】' },
      { key: '渡', label: '请弥勒佛来收童儿', fate: '渡', effect: { material: '雷音古舍利',  alignGood: 16 }, setFlag: 'n53_xiaoleiyin:du', consequence: '弥勒一句"童儿，还不回家"，黄眉收假佛相随主回天。得雷音古舍利(H2·隐藏配件池)；成就【假佛的点化者】' },
      { key: '隐', label: '看破假佛，绕寺而过', fate: '隐', effect: { alignGood: 10, eva: 8, material: '假雷音潜影' }, setFlag: 'n53_xiaoleiyin:yin', consequence: '不拜不打，绕出小雷音寺，黄眉自悟被弥勒收走。得假雷音潜影(六缕幽影⑤·白马本命)；成就【假佛的看破者】' },
      { key: '缘', label: '点化黄眉童儿，收为随从', fate: '缘', effect: { alignGood: 20, ally: 'huangmei' }, setFlag: 'n53_xiaoleiyin:yuan', consequence: '得随从【黄眉童儿】(金铙护体·控敌)；成就【假佛的成全者】' },
      { key: '逆', label: '收黄眉童儿为逆道随从', fate: '逆', ni: true, effect: { alignEvil: 10, niSutra: 'ni_leiyin', ally: 'huangmei_ni' }, setFlag: 'n53_xiaoleiyin:ni', consequence: '前提：战路线未请救兵未用法宝纯实力击败。得逆道经文＋逆道随从【黄眉童儿·人形态】；成就【假佛的征服者】' },
      { key: '夺', label: '夺取人种袋和金铙', fate: '夺', effect: { alignEvil: 16, ti: { hp: 78 }, treasure: 'renzhongdai' }, fight: true, setFlag: 'n53_xiaoleiyin:duo', consequence: '击败后夺得人种袋(收敌方全体3回合)；成就【人种袋入手】' }
    ]
  },
  54: {
    id: 54,
    name: '小雷音寺·破阵结算',
    act: 7,
    type: 'event',
    icon: '⚡',
    fate: '渡',
    echo: '复合第2难·小雷音寺统一结算(依53抉择) · 蓝劫印 · 弥勒宝相(渡·僧冠)落点',
    branchKey: 'n53_xiaoleiyin',
    dark: '黄眉童儿倒在金砖上，手里还攥着那只人种袋。你可以请弥勒佛来收它——童儿，还不回家，它便随主人回了天庭；也可以点化它：你以为佛是样子，却忘了佛是心；也可以不拜不打，只绕出寺门，让它自己愣在殿上想明白；更可以趁它落败夺下人种袋，连弥勒佛也一并打退了抢。它变成如来的样子，只能证明它会变，不能证明它是佛——这一难问的从来不是它真假，是你心里，拜的到底是那尊金身，还是金身背后那句你没敢问出口的话。',
    intro: '小雷音寺尘埃落定，依你先前所择之道收束此难。',
    options: [
      { key: '战', label: '收束战局，掩埋假佛余烬', fate: '战', effect: { alignEvil: 4, ti: { hp: 20 } }, requireFlag: 'n53_xiaoleiyin:zhan', consequence: '黄眉倒地，假佛之相无人再记' },
      { key: '渡', label: '受雷音古舍利，重整袈裟', fate: '渡', effect: { material: '雷音古舍利',  alignGood: 4 }, requireFlag: 'n53_xiaoleiyin:du', consequence: '得弥勒宝相(六赐④·僧冠配件) 与 雷音古舍利(H2)' },
      { key: '隐', label: '收假雷音潜影入白马本命', fate: '隐', effect: { alignEvil: 4, eva: 6 }, requireFlag: 'n53_xiaoleiyin:yin', consequence: '假雷音潜影归入白马本命' },
      { key: '缘', label: '偕黄眉童儿上路', fate: '缘', effect: { alignGood: 6, ally: 'huangmei' }, requireFlag: 'n53_xiaoleiyin:yuan', consequence: '黄眉系紧金铙人种袋，随你西行' },
      { key: '逆', label: '逆道随从·黄眉归反', fate: '逆', ni: true, effect: { alignEvil: 4, ally: 'huangmei_ni' }, requireFlag: 'n53_xiaoleiyin:ni', consequence: '黄眉摘下假像，跪地随你反抗西天' },
      { key: '夺', label: '收人种袋入宝囊', fate: '夺', effect: { alignEvil: 4, treasure: 'renzhongdai' }, requireFlag: 'n53_xiaoleiyin:duo', consequence: '人种袋在手，后顾之忧渐消' }
    ],
    branches: {
      zhan: { intro: '黄眉倒在小雷音寺的金砖上，假佛之相从此再无人记得。' },
      du: { intro: '弥勒拂袖，黄眉收了假佛相随主人回天庭，寺中只余清香。' },
      yin: { intro: '你绕出殿门，黄眉愣在莲台——变如来只能证明会变，不能证明是佛。' },
      yuan: { intro: '黄眉摘下如来假像，把金铙、人种袋往腰间一系，拜你为师。' },
      ni: { intro: '黄眉眼里第一次有了光，摘了假像系紧法宝，跪地随你反天。' },
      duo: { intro: '你夺了人种袋，弥勒不肯，却被你一并击败，宝物入了行囊。' }
    }
  },

  // ── 第55难 · 稀柿同秽阻（单劫难 · 绿） ──────────────────────────────────
  55: {
    id: 55,
    name: '稀柿同秽阻',
    act: 7,
    type: 'event',
    icon: '🍑',
    fate: '战',
    echo: '三道(战/隐/夺) · 无渡/缘/逆 · 八戒不在队则无战 · 隐耗寿10天 · 夺→柿子树精华',
    dark: '唐僧师徒行至稀柿同，八百里柿子林，柿子熟了没人收，烂在树上，烂在地上，臭气熏天，淤泥没膝，几十年没人敢过。八戒说这有何难，看俺老猪的，变作大猪，用嘴拱开烂柿子，硬开出一条路来。你跟在它后面，满身污秽，一步一陷。你也可以带着徒弟绕开这八百里，从后山小路走，多耗十天寿命，稀柿同照旧臭着，百姓照旧过不去。你站在污秽里，忽然明白：这一难不是要你降妖，是要你回答——当开路的代价是满身污秽，你还开不开这条路。',
    intro: '稀柿同口，八戒变猪拱路，满身污秽。你站在烂柿淤泥前，如何过此八百里？',
    options: [
      { key: '战', label: '八戒变猪拱路，强行通过', fate: '战', effect: { alignEvil: 5, ti: { atk: 12, hp: 66 } }, fight: true, battleFlags: { openingMomentum: 1 }, consequence: '八戒拱开烂柿开路，你满身污秽终过稀柿同。成就【秽路的终结者】(前提：八戒在队)' },
      { key: '隐', label: '绕道而行，不通过稀柿同', fate: '隐', effect: { alignGood: 5, eva: 6 }, consequence: '绕后山小路西行，百姓仍无法通过。耗寿命10天。成就【秽路的看破者】' },
      { key: '夺', label: '夺取柿子树精华', fate: '夺', effect: { alignEvil: 8, ti: { hp: 58 }, treasure: 'shizi_shujinghua' }, fight: true, consequence: '夺柿子树精华(每回合回气血·柿子雨昏迷)；成就【柿子树精华入手】' }
    ]
  },

  // ── 第56-58难 · 朱紫国·金圣宫（复合·3难 · 蓝） ─────────────────────────
  // 56 = 行医(阶段1·3分流) / 57 = 麒麟山救金圣宫(阶段2) / 58 = 最终抉择(阶段3·六道)
  56: {
    id: 56,
    name: '朱紫国·行医',
    act: 7,
    type: 'event',
    icon: '🏰',
    portrait: '朱紫国王',
    fate: '缘',
    echo: '复合第1难·朱紫国行医(3分流) · 阶段1Ⓐ渡/Ⓑ战/Ⓒ隐 · branchKey n56_ziziguo',
    branchKey: 'n56_ziziguo',
    dark: '朱紫国国王病了三年，太医束手无策——金圣宫娘娘被赛太岁掳走了三年。赛太岁是观音的坐骑金毛犼，偷了紫金铃下界为妖，那铃能放火、放烟、放沙。你可以悬丝诊脉，先治好国王的心病，再问清赛太岁的底细；也可以不理那病，直接奔麒麟山去救人——毕竟心病还需心药医，人救回来，病自然就好；或者变作金圣宫的模样去骗赛太岁，趁它失神偷了紫金铃。进城时你看见国王卧在榻上，三年没睡过一个整觉。',
    intro: '朱紫国王病榻三年，金圣宫被掳。你进城行医，先走哪条路？',
    options: [
      { key: '渡', label: '直接行医，治好国王的病', fate: '渡', effect: { alignGood: 8 }, setFlag: 'n56_ziziguo:du', consequence: '悬丝诊脉治好国王，问清赛太岁底细，铺垫渡线' },
      { key: '战', label: '不管国王，直奔麒麟山', fate: '战', effect: { alignEvil: 5 }, setFlag: 'n56_ziziguo:zhan', consequence: '不行医直闯麒麟山，铺垫战线' },
      { key: '隐', label: '用计骗赛太岁，偷紫金铃', fate: '隐', effect: { alignGood: 5, eva: 6 }, setFlag: 'n56_ziziguo:yin', consequence: '变金圣宫骗铃，直跳最终抉择(隐线)' }
    ]
  },
  57: {
    id: 57,
    name: '麒麟山·救金圣宫',
    act: 7,
    type: 'fight',
    icon: '🐘',
    portrait: '赛太岁',
    fate: '战',
    echo: '复合第2难·麒麟山救金圣宫(依56路线) · 避火珠钩子(紫金铃火) · branchKey n56_ziziguo',
    branchKey: 'n56_ziziguo',
    dark: '你去麒麟山，与赛太岁一战。它手上有紫金铃，一摇放火，二摇放烟，三摇放沙，铃一响，火烟沙裹着来，硬扛便是拿肉身去接；若有避火珠，火系伤害便免了。你若在朱紫国先用计偷了铃，这一战便轻；若直接来打，便得顶着紫金铃一轮轮地熬。它原是观音座下的金毛犼，下界三年，不过是想把一个女人留在洞里。你打它的时候，麒麟山头风大，铃声一下下地响——你不知道该恨它，还是该恨那个让它觉得掳人值得的世道。',
    intro: '麒麟山洞前，赛太岁摇动紫金铃。你如何救回金圣宫？',
    options: [
      { key: '渡', label: '先行医后战，以避火珠御火', fate: '渡', effect: { alignGood: 6 }, requireFlag: 'n56_ziziguo:du', setFlag: 'n57_qilin:du', consequence: '医王后上山，避火珠抵火，续渡线' },
      { key: '战', label: '直闯硬抗，与赛太岁血战', fate: '战', effect: { alignEvil: 3, ti: { atk: 14, hp: 70 } }, fight: true, battleFlags: { openingMomentum: 1 }, requireFlag: 'n56_ziziguo:zhan', setFlag: 'n57_qilin:zhan', consequence: '硬扛紫金铃火力，续战线' },
      { key: '隐', label: '计成，观音收走赛太岁', fate: '隐', effect: { alignGood: 4, eva: 4 }, requireFlag: 'n56_ziziguo:yin', setFlag: 'n57_qilin:yin', consequence: '骗铃破敌，观音收走赛太岁，金圣宫救回，直入最终抉择' }
    ],
    branches: {
      du: { intro: '你治好的国王道出底细，你持避火珠上山，火不能近身。' },
      zhan: { intro: '你不行医直闯，紫金铃火烟沙齐发，你硬扛伤血苦战。' },
      yin: { intro: '你变作金圣宫模样骗过赛太岁，偷铃破之，观音收妖。' }
    }
  },
  58: {
    id: 58,
    name: '朱紫国·最终抉择',
    act: 7,
    type: 'event',
    icon: '🔔',
    fate: '缘',
    echo: '复合第3难·最终六道(战/渡/隐/缘/逆/夺) · 缘→金毛犼·妖形态+朱紫姻缘绳(八戒本命) · 逆前提战线 · 蓝劫印',
    branchKey: 'n56_ziziguo',
    dark: '赛太岁终是被你逼到绝境。你可以与它死战三天三夜，也可以去请观音来收坐骑，还可以点化金圣宫，或收下赛太岁做逆随从，甚至趁它落败夺下那枚紫金铃。金圣宫被救回，国王与娘娘团聚。你站在城楼上，看着散去的乌云，忽然觉得这情字虽让国王病了三年，可团聚到底是值得的。可你也知道，城里还有别的人，三年里也病着，只是没人替他们去麒麟山走一趟。你要成全这一桩，还是成全那一城。',
    intro: '朱紫国尘埃落定，你面对赛太岁（金毛犼）做最后抉择。',
    options: [
      { key: '战', label: '直接击败赛太岁', fate: '战', effect: { alignEvil: 15, ti: { atk: 20, hp: 95 } }, fight: true, battleFlags: { openingMomentum: 1 }, requireFlag: 'n56_ziziguo:zhan', consequence: '斗三日纯凭实力击败，金圣宫救回。成就【情的守护者】' },
      { key: '渡', label: '请观音来收金毛犼', fate: '渡', effect: { alignGood: 24 }, requireFlag: 'n56_ziziguo:du', consequence: '观音一句"犼儿，还不回家"，赛太岁随主回南海。成就【情的点化者】' },
      { key: '隐', label: '用计偷铃，不硬碰', fate: '隐', effect: { alignGood: 15, eva: 9 }, requireFlag: 'n56_ziziguo:yin', consequence: '变金圣宫骗铃破敌，观音收走赛太岁。成就【情的智取者】' },
      { key: '缘', label: '点化赛太岁，收为宠物', fate: '缘', effect: { alignGood: 30, follower: 'ni_jinmaohou', material: '朱紫姻缘绳' }, consequence: '得宠物【金毛犼·妖形态】(可用紫金铃) 与 朱紫姻缘绳(六根红绳⑤·八戒本命)；成就【情的成全者】' },
      { key: '逆', label: '收金毛犼为逆道随从', fate: '逆', ni: true, effect: { alignEvil: 15, niSutra: 'ni_jinmaohou', ally: 'jinmaohou_ni' }, requireFlag: 'n56_ziziguo:zhan', consequence: '前提：战路线未请救兵未用法宝纯实力击败。得逆道经文＋逆道随从【金毛犼·人形态】；成就【情的征服者】' },
      { key: '夺', label: '夺取紫金铃', fate: '夺', effect: { alignEvil: 24, ti: { hp: 80 }, treasure: 'zijinling' }, fight: true, consequence: '击败后夺紫金铃(一摇火二摇烟三摇沙)；成就【紫金铃入手】' }
    ],
    branches: {
      zhan: { intro: '你与赛太岁斗了三天三夜，它倒地前说你会后悔，金圣宫终被救回。' },
      du: { intro: '观音立殿前，犼儿收了凶性随主回南海，国王娘娘团聚。' },
      yin: { intro: '你以智取铃，观音收走赛太岁，金圣宫安然归来。' },
      yuan: { intro: '金毛犼跪地拜师，化作宠物随你西行，朱紫姻缘绳系上八戒本命。' },
      ni: { intro: '金毛犼眼里第一次有了光，送出金圣宫，收铃跪地随你反天。' },
      duo: { intro: '你夺了紫金铃，观音不肯却被你击败，宝铃入囊。' }
    }
  },

  // ── 第59难 · 盘丝洞·七情迷没（单劫难 · 绿） ────────────────────────────
  59: {
    id: 59,
    name: '盘丝洞·七情迷没',
    act: 7,
    type: 'event',
    icon: '🕸️',
    portrait: '蜘蛛精',
    fate: '缘',
    echo: '六道全集 · 缘→蜘蛛精·妖形态 · 逆前提战线 · 定魂珠+避毒珠钩子 · 本心线⑤(色+食)',
    dark: '唐僧自行化斋，误入盘丝洞，被七个蜘蛛精擒住。她们在濯垢泉洗澡，悟空变作老鹰叼走她们的衣服，八戒下水调戏，反被蛛丝缠了个结实。七个蜘蛛精联手，丝线能困人，梦魇能摄魂，蛛毒能蚀骨；定魂珠护心神，避毒珠免疫毒，两珠缺一，你便要在丝网里多熬几个时辰。你可以打死她们，可以点化她们修行，可以绕开盘丝岭，也可以把她们收进队伍。你站在洞口，看着那七个身影，忽然明白：这一难不是要你降妖，是要你回答——当美色的代价是性命，你还迷不迷。',
    intro: '盘丝洞内，七蜘蛛精丝线缠人。你如何了结这七情之迷？',
    options: [
      { key: '战', label: '直接打死七个蜘蛛精', fate: '战', effect: { alignEvil: 5, ti: { atk: 13, hp: 68 } }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n59_pansi:zhan', consequence: '斗三日尽诛七蛛，唐僧得救。成就【七情的终结者】' },
      { key: '渡', label: '点化七个蜘蛛精修行', fate: '渡', effect: { alignGood: 8 }, setFlag: 'n59_pansi:du', consequence: '点化七蛛放下美色，盘丝洞修行。成就【七情的点化者】' },
      { key: '隐', label: '绕道而行，不通过盘丝岭', fate: '隐', effect: { alignGood: 5, eva: 7 }, setFlag: 'n59_pansi:yin', consequence: '绕后山小路，七蛛仍占洞迷人。成就【七情的看破者】' },
      { key: '缘', label: '点化蜘蛛精，收为宠物', fate: '缘', effect: { alignGood: 10, follower: 'zhizhujing' }, setFlag: 'n59_pansi:yuan', consequence: '得宠物【蜘蛛精·妖形态】(丝线困敌)；成就【七情的成全者】' },
      { key: '逆', label: '收蜘蛛精为逆道随从', fate: '逆', ni: true, effect: { alignEvil: 5, niSutra: 'ni_zhizhu', ally: 'zhizhujing_ni' }, requireFlag: 'n59_pansi:zhan', consequence: '前提：战路线未请救兵未用法宝纯实力击败。得逆道经文＋逆道随从【蜘蛛精·人形态】；成就【七情的征服者】' },
      { key: '夺', label: '夺取蜘蛛精的丝线', fate: '夺', effect: { alignEvil: 8, ti: { hp: 62 }, treasure: 'zhizhu_sixian' }, fight: true, setFlag: 'n59_pansi:duo', consequence: '夺蜘蛛丝线(困敌方全体3回合)；成就【蜘蛛丝线入手】' }
    ]
  },

  // ── 第60难 · 黄花观·多目遭伤（单劫难 · 绿） ────────────────────────────
  60: {
    id: 60,
    name: '黄花观·多目遭伤',
    act: 7,
    type: 'event',
    icon: '👁️',
    portrait: '百眼魔君',
    fate: '缘',
    echo: '六道全集 · 缘→多目怪·妖形态 · 逆前提战线 · 避毒珠钩子(金光毒)',
    dark: '七个蜘蛛精逃到黄花观，投奔师兄百眼魔君。那蜈蚣精胁下生着千只眼，一放金光便把人困住，连悟空都被照得睁不开眼，变作穿山甲才逃出来。它先以毒茶害唐僧、八戒、沙僧，你若是识破，便要与它正面一战；金光厉害，避毒珠能免它那口毒，却免不了你被照得步步后退。最后是毗蓝婆菩萨用一枚绣花针破了它的金光，把它收走。你站在黄花观门口，看着那一千只眼睛，忽然明白：这一难不是要你降妖，是要你回答——当毒药的代价是性命，你还喝不喝那杯茶。',
    intro: '黄花观中，百眼魔君千眼放金光。你如何了结这毒茶之难？',
    options: [
      { key: '战', label: '直接打死多目怪', fate: '战', effect: { alignEvil: 5, ti: { atk: 14, hp: 70 } }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n60_huanghua:zhan', consequence: '斗三日打死多目怪，师徒得救。成就【毒茶的终结者】' },
      { key: '渡', label: '请毗蓝婆菩萨收伏', fate: '渡', effect: { alignGood: 8 }, setFlag: 'n60_huanghua:du', consequence: '毗蓝婆绣花针收伏多目怪回山修行。成就【毒茶的点化者】' },
      { key: '隐', label: '绕道而行，不通过黄花观', fate: '隐', effect: { alignGood: 5, eva: 7 }, setFlag: 'n60_huanghua:yin', consequence: '绕后山小路，多目怪仍用毒茶害人。成就【毒茶的看破者】' },
      { key: '缘', label: '点化多目怪，收为宠物', fate: '缘', effect: { alignGood: 10, follower: 'duomuguai' }, setFlag: 'n60_huanghua:yuan', consequence: '得宠物【多目怪·妖形态】(金光致盲)；成就【毒茶的成全者】' },
      { key: '逆', label: '收多目怪为逆道随从', fate: '逆', ni: true, effect: { alignEvil: 5, niSutra: 'ni_duomu', ally: 'duomugai_ni' }, requireFlag: 'n60_huanghua:zhan', consequence: '前提：战路线未请救兵未用法宝纯实力击败。得逆道经文＋逆道随从【多目怪·人形态】；成就【毒茶的征服者】' },
      { key: '夺', label: '夺取多目怪的金光', fate: '夺', effect: { alignEvil: 8, ti: { hp: 64 }, treasure: 'duomu_jinguang' }, fight: true, setFlag: 'n60_huanghua:duo', consequence: '夺多目金光(致盲敌方全体3回合)；成就【多目金光入手】' }
    ]
  },

  // ── 第61-64难 · 狮驼岭·三魔（复合·4难 · 章末Boss · 红 · 多形态） ───────
  // 61 = 初遇三魔 / 62 = 狮驼洞被抓 / 63 = 阴阳二气瓶 / 64 = 最终抉择(Boss)
  61: {
    id: 61,
    name: '狮驼岭·初遇三魔',
    act: 7,
    type: 'fight',
    icon: '🦁',
    portrait: '狮驼岭三魔',
    fate: '战',
    echo: '复合第1难·初遇三魔(3选项:力战/绕路/请佛) · 三魔首形态假僧→唐僧斥语-80% · branchKey n61_shituoling',
    branchKey: 'n61_shituoling',
    dark: '狮驼岭八百里，三个魔王——青毛狮子怪、黄牙老象、大鹏金翅雕。它们占了狮驼国，把满城人都吃了，做成人肉包子。你进了岭，到处是包子和骨头；小妖说不吃人吃什么。三魔坐在大殿上等你很久，青毛狮子怪问你：要过狮驼岭，先回答——当生存的代价是吃人，你还吃不吃人。你看着那些骨头，忽然明白：这不是生存，是罪恶——吃人不是为了活着，是为了证明自己能吃人。你可以带徒弟硬打，可以绕岭而去，也可以星夜去请文殊、普贤、如来来收它们的主人。',
    intro: '狮驼岭大殿，三魔问：当"生存"的代价是"吃人"，你还吃不吃人？你如何开局？',
    options: [
      { key: '战', label: '以力降妖，直接与三魔战斗', fate: '战', effect: { alignEvil: 5, ti: { atk: 18, hp: 90 } }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n61_shituoling:zhan', consequence: '不请三圣，带徒斗三日。三魔首形态假僧→唐僧斥语−80%，须破幻' },
      { key: '隐', label: '绕路而行，放弃狮驼岭', fate: '隐', effect: { alignGood: 5, eva: 8 }, setFlag: 'n61_shituoling:yin', consequence: '绕后山西行，三魔仍占国吃人（阶段4强制隐）' },
      { key: '渡', label: '请文殊、普贤、如来收妖', fate: '渡', effect: { alignGood: 8 }, setFlag: 'n61_shituoling:du', consequence: '星夜分请三圣，往返耗10天（阶段4请佛线）' }
    ]
  },
  62: {
    id: 62,
    name: '狮驼洞·被抓',
    act: 7,
    type: 'fight',
    icon: '🔗',
    portrait: '黄牙老象',
    fate: '战',
    echo: '复合第2难·狮驼洞被抓(依61路线) · 黄牙老象假僧→斥语-80% · branchKey n61_shituoling',
    branchKey: 'n61_shituoling',
    dark: '三魔将师徒抓住，关进狮驼洞。洞深处血腥味压不住，墙上还挂着没剔净的骨头。悟空逃脱，去请文殊、普贤来收青毛狮子与黄牙老象。这两头坐骑在人前都是假僧的模样，一身袈裟，面带慈悲，可你一动手，唐僧便飘出斥语，你的力就散了八成——得用照妖镜照破，或唤土地山神作证，才逼得出它们那副兽相。它们各自的主人还没赶到。洞里很暗，你听得见自己的呼吸，也听得见外面小妖在剁东西。',
    intro: '狮驼洞铁索缠身，黄牙老象假僧逼近。你如何脱此困局？',
    options: [
      { key: '战', label: '挣脱再战，硬抗假僧减伤', fate: '战', effect: { alignEvil: 3, ti: { atk: 14, hp: 80 } }, fight: true, battleFlags: { openingMomentum: 1 }, requireFlag: 'n61_shituoling:zhan', setFlag: 'n62_shiyin:zhan', consequence: '破幻后硬战，续战线' },
      { key: '隐', label: '趁乱潜行，绕出狮驼洞', fate: '隐', effect: { alignGood: 4, eva: 6 }, requireFlag: 'n61_shituoling:yin', setFlag: 'n62_shiyin:yin', consequence: '绕路潜行，续隐线' },
      { key: '渡', label: '待三圣降妖，脱困', fate: '渡', effect: { alignGood: 5 }, requireFlag: 'n61_shituoling:du', setFlag: 'n62_shiyin:du', consequence: '文殊普贤赶到收青狮白象，脱困续渡线' }
    ],
    branches: {
      zhan: { intro: '你破假僧之幻，以蛮力挣脱铁索再战。' },
      yin: { intro: '你趁乱潜行，绕出狮驼洞，三魔仍占国。' },
      du: { intro: '文殊、普贤先后赶来，收了青狮白象，你脱出牢笼。' }
    }
  },
  63: {
    id: 63,
    name: '阴阳二气瓶',
    act: 7,
    type: 'fight',
    icon: '🏺',
    portrait: '大鹏金翅雕',
    fate: '战',
    echo: '复合第3难·阴阳二气瓶(避火珠+避雷珠双开扛雷火;羊脂玉净瓶→三才净瓶升级) · branchKey n61_shituoling',
    branchKey: 'n61_shituoling',
    dark: '大鹏金翅雕把你装进阴阳二气瓶。瓶中本来火烧蛇咬，如今又添了一道天雷淬瓶——雷火齐发。避火珠能扛火，避雷珠能扛雷，缺一个，你便在里面残血硬撑。这瓶子是个照妖镜：照出你这一路攒下的家底，也照出你缺的那一角。若你手上有平顶山得来的羊脂玉净瓶，还能把这瓶子收编，与观音的净瓶合流，炼成能装天装地的三才净瓶。你在瓶中听见大鹏在瓶外振翅，一翅九万里——可它飞得再远，也忘不了这瓶里装过谁。',
    intro: '阴阳二气瓶内雷火齐发，你如何生还？',
    options: [
      { key: '战', label: '双珠合璧，扛住雷火破瓶', fate: '战', effect: { alignEvil: 4, ti: { atk: 16, hp: 85 } }, fight: true, battleFlags: { openingMomentum: 1 }, requireFlag: 'n61_shituoling:zhan', setFlag: 'n63_erqi:zhan', consequence: '避火珠+避雷珠双开扛住雷火，破瓶而出' },
      { key: '隐', label: '潜息养元，避其锋芒', fate: '隐', effect: { alignGood: 4, eva: 6 }, requireFlag: 'n61_shituoling:yin', setFlag: 'n63_erqi:yin', consequence: '绕路者亦被装入，潜息避雷火待变' },
      { key: '渡', label: '净瓶合璧，化险为夷', fate: '渡', effect: { alignGood: 5 }, requireFlag: 'n61_shituoling:du', setFlag: 'n63_erqi:du', consequence: '持羊脂玉净瓶与阴阳二气瓶合并→三才净瓶，脱困续渡线' }
    ],
    branches: {
      zhan: { intro: '你双珠齐开，雷火加身却硬扛过来，瓶裂人出。' },
      yin: { intro: '你屏息养元，待雷火稍歇，从瓶缝遁出。' },
      du: { intro: '净瓶合阴阳二气瓶为三才净瓶，装天装地，安然脱困。' }
    }
  },
  64: {
    id: 64,
    name: '狮驼岭·三魔拦路',
    act: 7,
    type: 'boss',
    icon: '👑',
    portrait: '狮驼岭三魔',
    fate: '战',
    echo: '章末Boss·多形态(假僧/人形→本相) · 六道仅 战/渡/隐/夺(逆/缘食人红线禁用) · 战=连续三战大鹏强制死 · 夺=割大鹏翅膀 · 红劫印',
    branchKey: 'n61_shituoling',
    dark: '大鹏金翅雕现出妖形，金翅一展，遮住半边天。青毛狮子、黄牙老象都被人收了，只剩它一个——它是如来的舅舅，狮驼国一国的人，是它吃的。这一战没有回头路：战，是连着打它三场，最后把它打死；渡，是三圣立在殿前，各自把坐骑领回去；绕路，是这个国从此再没人管；夺，是趁它落败，割下那对能一翅九万里的翅膀。此难逆与缘都收不得它——吃过一国之人的妖，不配做随从。你站在城楼上，看着散去的乌云，满城的血味还没散。',
    intro: '狮驼国城楼，乌云压顶。三魔本相齐出，你做最后抉择——这一回，没有收编的余地，只有死战、超度、绕行、或夺其翼。',
    options: [
      { key: '战', label: '连续三次战斗，降服三魔', fate: '战', effect: { material: '狮驼妖丹', alignEvil: 20, ti: { atk: 22, hp: 110 } }, fight: true, battleFlags: { openingMomentum: 1 }, requireFlag: 'n61_shituoling:zhan', consequence: '先战青狮(人形)、再战白象(人形)、终战大鹏(妖形态)连续三战；大鹏强制死(食人红线)。得狮驼妖丹(六丹⑤·沙僧本命)；成就【群魔的终结者】' },
      { key: '渡', label: '三圣收妖，了结狮驼岭', fate: '渡', effect: { material: '如来金翅',  alignGood: 32 }, requireFlag: 'n61_shituoling:du', consequence: '文殊、普贤、如来立殿前，三魔随主归山。得如来金翅(六赐⑤·僧冠配件)；成就【群魔的点化者】' },
      { key: '隐', label: '绕路而行，放弃狮驼岭', fate: '隐', effect: { alignGood: 20, eva: 10 }, requireFlag: 'n61_shituoling:yin', consequence: '绕后山西行，三魔仍占国吃人(强制性优先)。成就【群魔的看破者】' },
      { key: '夺', label: '割下大鹏翅膀', fate: '夺', effect: { alignEvil: 32, ti: { hp: 95 }, treasure: 'dapeng_chibang' }, fight: true, consequence: '击败大鹏后割其翅为法宝(速度+50%·一翅九万里闪避1回合)；与如来斗千回合夺翅而走。成就【大鹏翅膀入手】(无论阶段1何路线，战后皆可择)' }
    ],
    // 章末 Boss（狮驼三魔）产出＝**红劫印**，由结算系统按章发放（骨架 v1.6:69），不走掉落通道。
    //   2026-09-28 删除：原 `treasure:{id:'shitu_sheli'}` 全库无实体（劫印档位被误写成掉落物）。
    hidden: { hero: 'wukong', cond: '夺 + 大鹏翅膀', job: '鹏翼之悟', hint: '割大鹏翅、持大鹏翅膀——一翅九万里，你比它还快', desc: '悟大鹏之速，身法放大约 20%（持大鹏翅膀额外加成）' }
  }
});
