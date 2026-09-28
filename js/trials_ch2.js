// ============================================================================
// trials_ch2.js — 《逆道西行》八十一难 · 第 2 章（难 15–20，骨架 v1.19 对齐）
// 拆分依据：骨架 v1.19 九章边界（合入式，保持 NDX.TRIAL_LIB 单对象接口）
// act 字段由 trials_return.js 的 normalizeTrialLibAct() 按 ACT_RANGES 统一派生。
// 内容来源：《第二章_白骨岭之劫_15-20难_新版.md》(v3.3 终版)。
// 结构：15-16 流沙河(复合·2难合并) / 17 四圣试禅心 / 18-19 五庄观·人参果(复合) /
//       20 白骨精(章末Boss·三阶段三戏 + 甲乙丙丁四结局 + 隐藏缘白晶晶)。
// ============================================================================
NDX.TRIAL_LIB = Object.assign(NDX.TRIAL_LIB || {},
{
  15: {
    id: 15,
    name: '流沙河·遇沙僧',
    act: 2,
    type: 'fight',
    icon: '🌊',
    portrait: '沙僧',
    fate: '渡',
    echo: '渡/缘副→沙僧(卷帘)种子；避水珠钩子(夺/缘双出处)',
    branchKey: 'n15_liusha',
    dark: '八百里流沙河横在路前，弱水三千，鹅毛不浮。岸边一只半沉的残舟，舟底压着一串人头骨。一个项挂九颗骷髅的汉子从水里站起来，眼神不像要吃人，倒像在等一笔迟到很久的账。他抡杖便打，你与他战在一处。他力气极大，却越打越退——打着打着，忽然转身沉入河底，只留一圈浑水。你站在河边，看见那九颗骷髅在水里晃荡，忽然明白：他不是守河，是守着这九笔烂账，等着谁来了结。可你还不晓得，那第九颗，是谁的。',
    intro: '流沙河浊浪翻涌，卷帘大将项挂九颅拦在渡口。岸边半沉的宝箱里，似有避水之物。',
    // 宝物节点：流沙河岸边宝箱三选一（避水珠优先）
    options: [
      { key: '渡', label: '请观音，遣木叉收伏', fate: '渡', effect: { material: '九骷髅法船骨',  alignGood: 8, ally: 'shaseng' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n15_liusha:du', consequence: '收沙僧·妖形态；后续可触发木叉相关剧情得【九骷髅法船骨】' },
      { key: '夺', label: '趁木叉不备，夺其红葫芦', fate: '夺', effect: { alignEvil: 10, treasure: 'tre_honglupu', ally: 'shaseng' }, fight: true, setFlag: 'n15_liusha:duo', consequence: '得【红葫芦】(三生红绳葫芦原料)；无法触发哪吒隐藏事件' },
      { key: '战', label: '岸边再战，逼沙僧出水', fate: '战', effect: { alignEvil: 5, ti: { atk: 9, hp: 38 }, material: '流沙妖丹' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n15_liusha:zhan', consequence: '得【流沙妖丹】(☆沙僧①)；沙僧水中减伤(无八戒50%/有八戒80%/避水珠100%)' },
      // 🩸 2026-09-28 修复：requireNoTreasure 原写 'tre_bishuizhu'（全库无实体）⇒ `_owns` 恒 false
      //   ⇒ 「不得持避水珠」这条门槛**形同虚设**，本该锁死的【逆】路随时可走。
      //   避水珠真身＝`lm_bowl`（通用条目）；`bis_an`（避水珠·黯）与 lm_bowl_fan/ch2/ch3/ch4
      //   （白龙专属成长形态，treasureId 均为 lm_bowl）一并纳入。
      //   ⚠ `_owns` 判 `e.id === tid || e.treasureId === tid`（game_event_4.js:185），
      //      故 'lm_bowl' 一条即可覆盖全部形态；'bis_an' 无 treasureId，必须单列。
      { key: '逆', label: '不请神不避水，纯实力点化卷帘', fate: '逆', ni: true, effect: { material: '卷帘大将印',  alignEvil: 8, ally: 'shaseng_ren' }, fight: true, requireNoTreasure: ['lm_bowl', 'bis_an'], setFlag: 'n15_liusha:ni', consequence: '得逆道经文 + 沙僧·人形态(卷帘大将)；捏碎九颅，对抗天庭得逆道经文【卷帘大将印】' }
    ],
    // 🩸 2026-09-28 修复：原 id 'tre_bishuizhu' 全库无实体 ⇒ lootById 查不到 ⇒ 掉落静默回落
    //   _heroBaseDrop，流沙河宝物节点等于没写。改指真源 `lm_bowl`（避水珠通用条目，无 owner 限制）。
    treasure: { id: 'lm_bowl', type: 'treasure', note: '避水珠·流沙河宝物节点(宝库来源，持入水可正常战斗)' },
    hidden: { hero: 'shaseng', cond: '逆 + 降妖念珠', job: '卷帘镇妖', hint: '流沙河择「逆」、持降妖念珠——九世尸骨，等你镇压', desc: '问九世因，镇压河妖（沙僧·卷帘镇妖前置）' }
  },
  16: {
    id: 16,
    name: '流沙河·收沙僧',
    act: 2,
    type: 'event',
    icon: '⛓️',
    fate: '渡',
    echo: '复合第2难·收沙僧归队(依15抉择结算)',
    branchKey: 'n15_liusha',
    dark: '沙僧沉在河底不出来。他不会让你轻易过去——每一世金蝉走到这条河边，他都要吃一次，吃完多一颗骷髅，多记一笔。谁记的？灵山。这不是项链，是一张分期付款的账单，他还得快还完了。你在岸边站了很久：可以请观音派木叉来唤，也可以不请救兵、不入水，硬把水里的他打出来。他把九世都吃成了账，只等你这一世给他一个了结——是渡他上岸，夺他手里的宝，还是纯凭拳头逼他认清这本账其实不必还。他要的从来不是一顿饭，是九个轮回里第一个愿意伸手的人。',
    intro: '沙僧拜入师门，九颅之债至此结清。',
    options: [
      { key: '渡', label: '赐名沙悟净，携之上路', fate: '渡', effect: { alignGood: 6, ally: 'shaseng' }, requireFlag: 'n15_liusha:du', tip: '【卷帘的解脱】请观音收伏沙僧' },
      { key: '夺', label: '收红葫芦，催他快走', fate: '夺', effect: { alignEvil: 4, gold: 20, ally: 'shaseng' }, requireFlag: 'n15_liusha:duo', tip: '【宝葫入手】击败木叉，夺得红葫芦' },
      { key: '战', label: '以力降伏，纳入随行', fate: '战', effect: { alignEvil: 3, ti: { hp: 30 }, ally: 'shaseng' }, requireFlag: 'n15_liusha:zhan', tip: '【卷帘的屈服】以力降服沙僧' },
      { key: '逆', label: '卷帘大将，随你反天', fate: '逆', effect: { alignEvil: 2, ally: 'shaseng_ren' }, requireFlag: 'n15_liusha:ni', tip: '【卷帘的觉醒】点化卷帘真相，获沙僧·人形态' }
    ],
    branches: {
      du: { intro: '木叉唤一声「卷帘大将」，沙僧从水中浮出跪地归降。你赐名沙悟净，师徒渡河而去。' },
      duo: { intro: '沙僧见你夺了红葫芦，眼神多了丝不安，终是跟了你走。' },
      zhan: { intro: '沙僧被你逼出水面，跪地服输："师父，俺服了。"' },
      ni: { intro: '沙僧摘下九颗骷髅捏碎，铠甲大将立于河滩："师父，俺卷帘愿随您反天！"' }
    }
  },
  17: {
    id: 17,
    name: '四圣试禅心',
    act: 2,
    type: 'event',
    icon: '✦',
    portrait: '黎山老母',
    fate: '渡',
    echo: '渡→四圣古佛舍利(法杖六舍利②)；缘→试心新绳(☆八戒②)+照妖镜+怜怜玉佩；隐→避世',
    dark: '朱栏玉户，画栋雕梁，一位中年妇人带着三个女儿出来，要招你们为婿：良田千顷，牛马成群，女儿各有姿色。唐僧闭目诵经，心里却泛起一丝涟漪——这一路西行，究竟为的是什么。庄院的灯火暖得不像真的，帘后有女子的笑声。只有八戒眼热心跳。你知道这是黎山老母与三位菩萨设的局。识破诵经，得一颗古佛舍利；不看不闻，天明庄院消散，只留一张点破四圣的字帖；若动了凡心，与怜怜在幻象里留三日，得一枚玉佩、一根红绳、一面照妖镜——可这三日里，你不是取经人，只是一个普通的男人。',
    intro: '黎山老母与观音、普贤、文殊化身庄院，试师徒禅心。',
    options: [
      { key: '渡', label: '识破幻象，诵经渡化', fate: '渡', effect: { material: '四圣古佛舍利',  alignGood: 8, favor: '观音' }, tip: '【禅心坚定】识破四圣试探，得四圣古佛舍利（法杖六舍利②，舍利严格走渡）' },
      { key: '隐', label: '不看不闻，避世无痕', fate: '隐', effect: { alignEvil: 8, eva: 6 }, tip: '【心如止水】不看不闻，避过试探' },
      { key: '缘', label: '入戏太深，留一段尘缘', fate: '缘', effect: { alignGood: 10, treasure: 'tre_zhaoyaojing', material: '试心新绳', relic: 'lianlian_yupei' }, tip: '【尘缘未了】动凡心得试心新绳(☆八戒②)+照妖镜+怜怜玉佩，埋女儿国伏笔' }
    ]
  },
  18: {
    id: 18,
    name: '五庄观·人参果',
    act: 2,
    type: 'event',
    icon: '🌳',
    portrait: '镇元大仙',
    fate: '渡',
    echo: '渡→人参果皮(★僧履①)；缘→人参果童子(宠物)；战/隐/夺通用',
    branchKey: 'n18_wuzhuang',
    dark: '万寿山五庄观，镇元子赴会去了，只留清风、明月二童子看守。二童子奉师命送来两枚人参果——三朝未满的孩童模样，四肢俱全，五官咸备。你吓得不敢吃：好端端一个人形，怎么下得去口。二童子无奈，自己吃了。八戒在一旁听见，馋得口水直流，撺掇悟空去偷。那果子入口是天地灵根之味，可它长得太像一个婴儿。你看着那果，忽然分不清：你不敢吃，到底是因为慈悲，还是心里其实也想尝一口——只是想叫别人先去动手。',
    intro: '五庄观中人参果树三千年一果。你窃果推树，或赔树医根。',
    options: [
      { key: '渡', label: '请观音甘露救树', fate: '渡', effect: { alignGood: 8, material: '人参果皮' }, requireFlag: 'n17_sisheng_du', tip: '【地仙之盟】请观音救活果树，得人参果皮(★僧履①)' },
      { key: '缘', label: '慈悲化形，收人参果童子', fate: '缘', effect: { alignGood: 10, follower: 'renshanguozi' }, requireFlag: 'n17_sisheng_yuan', tip: '【灵果相随】人参果化形为宠物随行' },
      { key: '战', label: '与镇元子大战救师', fate: '战', effect: { alignEvil: 5, ti: { atk: 8, hp: 40 } }, fight: true, battleFlags: { openingMomentum: 1 }, tip: '【大闹五庄观】与镇元子大战' },
      { key: '隐', label: '守戒不偷，平淡而过', fate: '隐', effect: { alignEvil: 8, eva: 6 }, tip: '【守戒而过】不偷不闹，守戒度过' },
      { key: '夺', label: '见果起意，先偷为快', fate: '夺', effect: { alignEvil: 10, ti: { hp: 30 }, material: '眼根·眼看喜' }, fight: true, tip: '【眼根·先尝为快】Ⓔ夺·偷果，得眼根·眼看喜(☆悟空①)' }
    ],
    hidden: { hero: 'tangseng', cond: '缘 + 缘≥3', job: '金蝉了缘', hint: '多走「缘」、缘路连三——了却因果', desc: '缘了缘续，因果自了（唐僧·金蝉了缘前置）' }
  },
  19: {
    id: 19,
    name: '五庄观·推倒果树',
    act: 2,
    type: 'event',
    icon: '🌳',
    fate: '战',
    echo: '复合第2难·镇元子袖里乾坤擒人；依18抉择结算',
    branchKey: 'n18_wuzhuang',
    dark: '悟空偷了三枚果，与八戒、沙僧分了。二童子发现少了果，指着你们大骂。悟空大怒，一把将人参果树推倒——那树是天地灵根，果子三朝未满、似婴孩一般，一推之下，根断叶枯。镇元子回来，得知果树被推，以袖里乾坤擒住师徒，一个接一个收入袖中，像收几件行李。你可以让悟空去南海请观音，以甘露救活灵根，换一场地仙之盟；也可以与镇元子硬战；或是守着戒律不偷不闹，平淡过去。推树的那一瞬你忽然觉得：这见果便要的心思，和五百年前偷桃盗丹的，是同一处根子。',
    intro: '镇元子归，见果树被推，大怒擒人。',
    options: [
      { key: '渡', label: '随观音医树，与镇元子结义', fate: '渡', effect: { alignGood: 6, rel: { 镇元: 3 } }, requireFlag: 'n18_wuzhuang:du', tip: '果树复活，镇元子设人参果会款待' },
      { key: '缘', label: '携人参果童子西行', fate: '缘', effect: { alignGood: 4, follower: 'renshanguozi' }, requireFlag: 'n18_wuzhuang:yuan', tip: '灵果随行，回复全队气血' },
      { key: '战', label: '挣脱再战，蛮力逼退镇元', fate: '战', effect: { alignEvil: 3, ti: { atk: 6 } }, fight: true, requireFlag: 'n18_wuzhuang:zhan', tip: '以蛮力救下唐僧' },
      { key: '隐', label: '守戒者，镇元子赞赏放行', fate: '隐', effect: { alignEvil: 2, eva: 4 }, requireFlag: 'n18_wuzhuang:yin', tip: '守戒而过，素斋放行' },
      { key: '夺', label: '偷果者，镇元子追来', fate: '夺', effect: { alignEvil: 4, ti: { hp: 20 } }, requireFlag: 'n18_wuzhuang:duo', tip: '见果起意，镇元子一路追杀' }
    ],
    branches: {
      du: { intro: '观音杨柳枝蘸甘露，果树复活。镇元子大喜，与悟空结为兄弟。' },
      yuan: { intro: '镇元子见人参果化形，叹道："这果子与你有缘。"准其随行。' },
      zhan: { intro: '悟空挣脱变化之术，以蛮力逼退镇元子，救下唐僧。' },
      yin: { intro: '镇元子见唐僧守戒不偷，赞赏放行。' },
      duo: { intro: '镇元子循偷果之迹追来，怒不可遏。' }
    }
  },
  20: {
    id: 20,
    name: '白骨岭·白骨精',
    act: 2,
    type: 'boss',
    icon: '👑',
    portrait: '白骨精',
    fate: '战',
    echo: '章末Boss·三戏(人形态减伤·唐僧斥语 -80%；破幻＝照妖镜/唤土地山神)；甲乙丙丁四结局 + 隐藏缘白晶晶',
    branchKey: 'n20_baigu',
    dark: '白骨精是被写死的角色。她知道自己只是难簿上第十九笔，所以一遍遍变作村姑、老妪、老翁，一遍遍挨你的打——她不是要吃你，是要你把这一笔写完。她原是山下一个等丈夫回来的女人，等死了，骨头留在岭上，难簿便给她编了个白骨夫人。九世了，她困在这三戏里出不去。你每打一次，唐僧便念一次紧箍咒逐你；八戒说你糊涂，沙僧不说话。三戏散尽你才看清：你怕的不是她，是越靠近真相，悟空越活不成。最终一战，若持棒者正是他，且未选隐，她会以另一个身份，在岭上等你。',
    intro: '白骨岭上，三戏开场：送饭村姑、寻女老妪、寻亲老翁。任意阶段「躲」→隐结局；「请神」→渡结局；三阶段「打」→战/逆结局；悟空主角未选隐→可触发隐藏缘。',
    options: [
      { key: '战', label: '三棒皆落，以法宝破幻', fate: '战', effect: { alignEvil: 5, ti: { atk: 6, hp: 32 } }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n20_baigu:zhan', consequence: '结局甲·白骨的破碎：装备；链接第45难六耳变白骨试探' },
      { key: '渡', label: '三唤皆证，立坟超度', fate: '渡', effect: { alignGood: 8, yuan: 8 }, fight: true, setFlag: 'n20_baigu:du', consequence: '结局乙·白骨的安息：耗寿30天；链接第45难沙僧认为你有佛性' },
      { key: '隐', label: '三避其锋，取骨炼甲', fate: '隐', effect: { alignEvil: 4, eva: 9 }, treasure: 'shanwenjia', setFlag: 'n20_baigu:yin', consequence: '结局丙·白骨的铠甲：山文甲；链接第45难谛听认你敢面对自己' },
      { key: '逆', label: '不请神不法宝，纯实力折服', fate: '逆', ni: true, effect: { alignEvil: 8, niSutra: 'ni_baigu', ally: 'baigujing' }, fight: true, requireNoTreasure: 'tre_zhaoyaojing', setFlag: 'n20_baigu:ni', consequence: '结局丁·白骨的随行：逆道经文+白骨夫人(悟空不离队；主角悟空→妖形态/非悟空→人形态)' },
      { key: '缘', label: '（悟空主角·未选隐）认出白晶晶', fate: '缘', effect: { alignGood: 10, relic: 'baijingjing_hongsheng' }, hidden: true, requireHero: 'wukong', requireFlagNot: 'n20_baigu:yin', consequence: '隐藏缘·白晶晶：悟空离队携其回花果山，不产随从，只产白晶晶的红绳(三生红绳葫芦原料)' }
    ],
    treasure: { id: 'baigu_sheli', type: 'treasure', note: '白骨精·章末舍利（白劫印→绿劫印·章末Boss）' },
    hidden: { hero: 'wukong', cond: '第20难逆 + 未用法宝', job: '悟空的空', hint: '三打白骨纯凭实力、不借法宝——空而不空', desc: '体物伤+20%，分身替死' }
  }
});
