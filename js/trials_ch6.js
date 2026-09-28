// ============================================================================
// trials_ch6.js — 《逆道西行》八十一难 · 第 6 章（难 47–51，骨架 v1.19 对齐）
// 拆分依据：骨架 v1.19 九章边界（合入式，保持 NDX.TRIAL_LIB 单对象接口）
// 内容来源：《第六章_火焰山之劫_47-51难_新版.md》(v3.0 终版 · 骨架 v1.19 对齐)。
// 结构：47-49 火焰山·三调芭蕉扇(复合·3难合并·×3·章末Boss牛魔王·红劫印) /
//       50-51 祭赛国·金光寺舍利子(复合·2难合并·×2·蓝劫印)。
// act 字段由 trials_return.js 的 normalizeTrialLibAct() 按 ACT_RANGES 统一派生，
// 此处置 6 仅为可读性（后续集中重派生）。
// 选项文本一律不出现「战/渡/隐/夺/缘/逆」字样（§4.1 去标签）。
// ============================================================================
NDX.TRIAL_LIB = Object.assign(NDX.TRIAL_LIB || {},
{
  // —— 火焰山复合①：一调芭蕉扇·钩子判定（阶段1）——
  47: {
    id: 47,
    name: '火焰山·一调芭蕉扇',
    act: 6,
    type: 'event',
    icon: '🔥',
    fate: '渡',
    echo: '火焰山复合①·一调钩子判定：渡/战/隐(隐缘)三路铺垫；红孩儿钩子→牛魔王-20%人形态；六耳钩子→识破假扇；定风珠御扇风',
    branchKey: 'n47_huoyanshan',
    dark: '火焰山八百里火焰，寸草不生，要过山，须借铁扇公主的芭蕉扇：一扇熄火，二扇生风，三扇下雨。铁扇公主是牛魔王之妻、红孩儿之母。你到翠云山芭蕉洞前求扇，她高坐堂上，开门见山：我儿红孩儿在你那里，你还有脸来借我的扇。一扇袭来，你立脚不稳，身后山火在烧，门里她在等——等你低头，或等你动手。若你红孩儿走的是缘渡逆，她态度还缓；若走的是战，她记恨，借扇更难。你可以按棒行礼好言相求，可以掣棒便打，也可以变作一只小虫，趁她喝茶时潜入她腹中。',
    intro: '你到翠云山借扇，铁扇公主开门见山。一扇之风已起，借扇之路就此分流。',
    options: [
      { key: '渡', label: '好言相求，提红孩儿在观音处修成正果', fate: '渡', effect: { alignGood: 8 }, setFlag: 'n47_huoyanshan:du', consequence: '进入渡路线：以情化扇；红孩儿钩子触发，后续牛魔王战力-20%且保持人形态' },
      { key: '战', label: '掣棒强借，被一扇扇落小须弥山', fate: '战', fight: true, battleFlags: { openingMomentum: 1 }, effect: { alignEvil: 5 }, setFlag: 'n47_huoyanshan:zhan', consequence: '被扇飞落小须弥山；若第14难曾夺灵吉飞龙宝杖则灵吉闭门不助，只能凭自备/宝库/市场定风珠或蛮力硬撑、额外耗寿；否则得定风珠抵御风力' },
      { key: '隐', label: '变作小虫，趁茶潜入她腹中逼扇', fate: '隐', effect: { alignEvil: 4 }, setFlag: 'n47_huoyanshan:yin', consequence: '进入隐/缘路线：腹中翻搅逼得铁扇公主答应借扇' }
    ]
  },

  // —— 火焰山复合②：二调芭蕉扇·钩子分支（阶段2）——
  48: {
    id: 48,
    name: '火焰山·二调芭蕉扇',
    act: 6,
    type: 'event',
    icon: '🌪️',
    fate: '渡',
    echo: '火焰山复合②·二调钩子分支：回去→假扇进阶段3；验证/聆听→得真扇或战铁扇，直入终战',
    branchKey: 'n47_huoyanshan',
    dark: '铁扇公主被你说动，或被逼，递来一把扇子。你若信她，接过来便走，对着火焰山一扇——火腾地窜起数丈；二扇，火更烈。假扇。她记着仇，怎会真给你。若红孩儿在队、你手上有太上老君那把芭蕉扇、或六耳猕猴善聆音在你身边，你还能验一验真假：红孩儿认得娘的扇，六耳听得见她心里那句假扇也想骗我。验出真扇，牛魔王闻讯赶回，直接开战；验不出，你得变作牛魔王的模样进洞，去骗那把真的——可赴宴回来的真牛魔王又会变作八戒，把扇子骗回去。',
    intro: '二调芭蕉扇——你接过扇子，是要信她，还是验她。',
    options: [
      { key: '隐', label: '不验证，接过扇子径直回山', fate: '隐', effect: { alignEvil: 4 }, setFlag: 'n48_huoyanshan:huiqu', consequence: '假扇！火焰更烈，只得再回，进入阶段3三调骗扇' },
      { key: '渡', label: '请红孩儿或查老君扇，验明真伪', fate: '渡', effect: { alignGood: 6 }, setFlag: 'n48_huoyanshan:yanzheng', consequence: '识破假扇，铁扇公主无奈交真扇；牛魔王闻讯赶回，直入终战（跳过阶段3）' },
      { key: '缘', label: '六耳善聆音，听破她心中暗笑', fate: '缘', effect: { alignGood: 6 }, setFlag: 'n48_huoyanshan:lingting', consequence: '识破假扇，铁扇公主恼羞成怒与你战；战后可得缘铁扇公主·妖形态（六耳钩子，罗刹女妖形）' }
    ]
  },

  // —— 火焰山复合③ + 章末Boss：三调芭蕉扇·牛魔王（阶段3 + 最终六道抉择）——
  49: {
    id: 49,
    name: '火焰山·三调芭蕉扇·牛魔王',
    act: 6,
    type: 'boss',
    icon: '👑',
    portrait: '牛魔王',
    fate: '战',
    echo: '章末Boss·牛魔王三态(人形→巨牛本相→芭蕉扇风暴·定风珠可破·幌金绳锁切换)；六道+1红劫印；渡→芭蕉叶脉/夺→舌根+芭蕉扇/缘→罗刹姻缘绳+铁扇/战→牛魔妖丹/逆→逆随从牛魔王',
    branchKey: 'n47_huoyanshan',
    dark: '牛魔王自碧波潭赴宴回来，闻你欺他妻儿、骗他扇子，掣混铁棍迎上。八戒举钉耙助阵，山头天兵远远围了，却按兵不动，只看你打。你与牛魔王斗了一天一夜，他力大无穷，三态流转：人形、巨牛本相，直到火焰山魔王的芭蕉扇风暴——无定风珠，风暴一起便卷走全场。红孩儿若在队，出面喊一声爹，他分心战力减两成，也守着人形；无红孩儿，他便全力化妖，不受斥语所限。打完这一场你要选：请天庭佛门相助，请观音化解恩怨，收他为逆随从，夺下那把扇子，或者放他一条生路，自己绕山而行。',
    intro: '牛魔王自碧波潭赴宴归来，与你斗了一天一夜。恩怨到头，扇在谁家——终局六道，由你落子。',
    options: [
      { key: '战', label: '请天庭佛门相助，围杀降服', fate: '战', fight: true, battleFlags: { openingMomentum: 1 }, effect: { alignEvil: 15, ti: { atk: 9, hp: 40 }, material: '牛魔妖丹' }, setFlag: 'n49_huoyanshan:zhan', consequence: '牛魔王被降服，铁扇公主献扇，火尽灭；得装备+牛魔妖丹(六丹④·沙僧本命)；成就【恩怨的终结者】' },
      { key: '渡', label: '请观音出面点化，铁扇献扇', fate: '渡', effect: { alignGood: 24, material: '芭蕉叶脉' }, setFlag: 'n49_huoyanshan:du', consequence: '观音点化牛魔王归降，铁扇献扇；得经文+芭蕉叶脉(六纤③·僧履配件)；成就【恩怨的点化者】' },
      { key: '隐', label: '放过牛魔王，率众绕道过山', fate: '隐', effect: { alignEvil: 24, eva: 9 }, setFlag: 'n49_huoyanshan:yin', consequence: '绕道三十日荒路，人困马乏，山火仍灼过往行人；得闪避装备；成就【恩怨的逃避者】' },
      { key: '缘', label: '点化铁扇公主，一家团聚', fate: '缘', effect: { alignGood: 30, ally: 'tieshan', material: '罗刹姻缘绳' }, setFlag: 'n49_huoyanshan:yuan', consequence: '铁扇公主拜师随行(六耳在队·妖形态／无六耳·人形态)，牛魔王不阻献扇；得随从【铁扇公主】+罗刹姻缘绳(六根红绳④·八戒本命)；成就【恩怨的成全者】' },
      { key: '逆', label: '纯实力折服，收牛魔王为逆随从', fate: '逆', ni: true, fight: true, effect: { alignEvil: 24, niSutra: 'ni_niumo', ally: 'niumo' }, setFlag: 'n49_huoyanshan:ni', consequence: '未请救兵未用法宝，纯凭实力赢他；牛魔王折服随你反天；得逆道经文+逆随从【牛魔王】(红孩儿在队·人形态／无红孩儿·妖形态)；成就【平天大圣的归服】' },
      { key: '夺', label: '见宝起意，夺取芭蕉扇', fate: '夺', fight: true, effect: { alignEvil: 30, ti: { atk: 8, hp: 30 }, treasure: 'tre_bajiaoshan', material: '舌根·舌尝思' }, setFlag: 'n49_huoyanshan:duo', consequence: '击败牛魔王夫妇夺扇，铁扇法力尽失；得装备+法宝【芭蕉扇】(免疫火伤)+舌根·舌尝思(六根④·悟空本命)；成就【芭蕉扇入手】' }
    ],
    // 章末 Boss（牛魔王）产出＝**红劫印**，由结算系统按章发放（骨架 v1.6:68），不走掉落通道。
    //   2026-09-28 删除：原 `treasure:{id:'niu_sheli'}` 全库无实体（劫印档位被误写成掉落物）。
  },

  // —— 祭赛国复合①：金光寺失宝+查明真凶（阶段1）——
  50: {
    id: 50,
    name: '祭赛国·金光寺失宝',
    act: 6,
    type: 'event',
    icon: '🛕',
    fate: '渡',
    echo: '祭赛国复合①·金光寺失宝查凶：战(劫狱)/隐(绕行)/渡(查案)三路铺垫；九头虫盗舍利，和尚替罪',
    branchKey: 'n50_jisai',
    dark: '祭赛国金光寺的舍利子被盗，国王认定是和尚所偷，将满寺僧人下狱，戴上枷锁，在烈日下搬砖。你站在寺门外，老和尚从砖堆里抬头看你一眼，又低下头继续搬。你问他为何不反抗，他说反抗过，死了一半；剩下的，学会了搬砖。你忽然明白：这一难不是要你降妖，而是问你——当清白的代价是死，你还选不选清白。你可以打破枷锁先把和尚救出来，可以不动手、先问案，从宝塔残迹、潭中水气里一点点拼出真凶在碧波潭，也可以绕开金光寺，取你的经去。',
    intro: '你站寺门外，老和尚搬砖。这一难不只要你降妖，更问你：当清白的代价是死，你还选不选清白。',
    options: [
      { key: '战', label: '打破枷锁，救出和尚直奔碧波潭', fate: '战', effect: { alignEvil: 5 }, setFlag: 'n50_jisai:zhan', consequence: '进入战路线：直闯碧波潭，与九头虫水族战作一团' },
      { key: '隐', label: '绕开金光寺，继续西行', fate: '隐', effect: { alignEvil: 8 }, setFlag: 'n50_jisai:yin', consequence: '舍利流失，和尚继续被冤；此劫以隐收束，仅得蓝劫印' },
      { key: '渡', label: '不动手，先问案查真凶', fate: '渡', effect: { alignGood: 8 }, setFlag: 'n50_jisai:du', consequence: '查明九头虫，渡路线：坐实证据再请二郎神（往返耗寿10天）' }
    ]
  },

  // —— 祭赛国复合②：碧波潭交战+九头虫现本相+最终六道抉择（阶段2）——
  51: {
    id: 51,
    name: '祭赛国·碧波潭·九头虫',
    act: 6,
    type: 'fight',
    icon: '🐉',
    portrait: '九头虫',
    fate: '战',
    echo: '祭赛国复合②·碧波潭交战+九头虫现本相；蓝劫印；渡→金光佛舍利/隐→塔顶潜影/缘→万圣公主/夺→舍利子/逆→逆随从九头虫；水盾80%(避水珠破)/避毒珠',
    branchKey: 'n50_jisai',
    dark: '你打入碧波潭底，万圣公主侍立九头虫身侧，手里那株灵芝草，正是从王母园里盗来的。潭水幽冷，宝光从石匣里漏出来。九头虫在水中水盾减伤八成，八戒在队可压到五成，避水珠入水即破；他带毒攻击，有避毒珠便能免疫。战到底，万圣公主被诛，九头虫带伤逃向潭心，怒极现出本相——九头齐出，每颗头都喷毒水。你若全程不请二郎神、不动法宝，纯凭实力把他斗到力竭，他才会真正心服；请了救兵、用了法宝，就只剩战、渡、夺、缘。这一潭的水，到底替谁洗得清。',
    intro: '九头虫力竭倒地，你面临终局六道。舍利子与清白，都在你一念。',
    options: [
      { key: '战', label: '请二郎神相助，哮天犬咬其首', fate: '战', fight: true, battleFlags: { openingMomentum: 1 }, effect: { alignGood: 10, ti: { atk: 6, hp: 30 } }, setFlag: 'n51_jisai:zhan', consequence: '二郎神率梅山兄弟至，九头虫带伤逃走；万圣公主交舍利，众僧释放；得装备；成就【清白的守护者】' },
      { key: '渡', label: '请观音收伏，万圣公主归降', fate: '渡', effect: { alignGood: 16, material: '金光佛舍利' }, setFlag: 'n51_jisai:du', consequence: '观音点化九头虫归降，万圣公主交舍利与灵芝；得经文+金光佛舍利(六舍利⑥·法杖配件)；成就【清白的点化者】' },
      { key: '隐', label: '放过九头虫，不告而别', fate: '隐', effect: { alignEvil: 16, eva: 9, material: '塔顶潜影' }, setFlag: 'n51_jisai:yin', consequence: '万圣公主见其逃走主动交舍利，众僧释放，但九头虫仍近处为害；得闪避装备+塔顶潜影(六缕幽影④·白马本命)；成就【清白的逃避者】' },
      { key: '缘', label: '点化万圣公主，收为随从', fate: '缘', effect: { alignGood: 20, ally: 'wansheng' }, setFlag: 'n51_jisai:yuan', consequence: '万圣公主拜师交出灵芝与舍利随行；九头虫见妻归降亦交舍利；得随从【万圣公主】(水系辅助)；成就【清白的成全者】' },
      { key: '逆', label: '纯实力按在水底，收九头虫', fate: '逆', ni: true, fight: true, effect: { alignEvil: 16, niSutra: 'ni_jiutou', ally: 'jiutouchong' }, setFlag: 'n51_jisai:ni', consequence: '未请救兵未用法宝，潭心斗三天三夜折服；得逆道经文+逆随从【九头虫·人形态】(水系群攻水遁)；成就【碧波潭的归从】' },
      { key: '夺', label: '见宝起意，夺取舍利子', fate: '夺', fight: true, effect: { alignEvil: 20, ti: { atk: 8, hp: 30 }, treasure: 'tre_sheli' }, setFlag: 'n51_jisai:duo', consequence: '击败九头虫夺舍利，万圣法力尽失；得装备+法宝【舍利子】(免疫阴性伤害诅咒·每回合回血·对假佛妖族伤害翻倍)；成就【舍利子入手】' }
    ]
  }
});
