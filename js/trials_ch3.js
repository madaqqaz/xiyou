// ============================================================================
// trials_ch3.js — 《逆道西行》八十一难 · 第 3 章（难 21–31，骨架 v1.19 对齐）
// 拆分依据：骨架 v1.19 九章边界（合入式，保持 NDX.TRIAL_LIB 单对象接口）
// 内容来源：《第三章_火云洞之劫_21-31难_新版.md》(v3.2 终版 · 骨架 v1.19 对齐)。
// 结构（复合劫难，4 段合并，系数×4）：
//   21-23 宝象国·黄袍怪（3难合并×3）：21 波月洞被擒 / 22 黄袍战(人形态-80%+请救兵) / 23 降伏黄袍(六道六选一)
//   24-25 平顶山·金角银角（2难合并×2）：24 莲花洞(路线分叉) / 25 降伏二童(渡 / 战逆夺)
//   26-27 乌鸡国·金丹救主（2难合并×2）：26 金丹救主(路线分叉) / 27 复位之争(战渡逆缘 / 隐)
//   28-31 火云洞·红孩儿（4难合并×4，章末Boss）：28 初遇(路线分叉) / 29 三昧真火 / 30 火甲三态 / 31 红孩儿(终局五道)
// act 字段按要求置 3（中央按 ACT_RANGES 重新派生）。
// ============================================================================
NDX.TRIAL_LIB = Object.assign(NDX.TRIAL_LIB || {},
{
  // ───────────────────────── 21-23 宝象国·黄袍怪（复合·3难合并×3） ─────────────────────────
  21: {
    id: 21,
    name: '宝象国·波月洞被擒',
    act: 3,
    type: 'event',
    icon: '🏰',
    portrait: '黄袍怪',
    fate: '渡',
    echo: '复合第1难·宝象国·3难合并×3；人形态减伤·唐僧斥语-80%',
    branchKey: 'n21_baoxiang',
    dark: '白骨精之后，孙悟空被唐僧逐走，回了花果山当齐天大圣。随从里没有孙悟空。师徒行至碗子山波月洞，唐僧化斋误入洞中，被黄袍怪捉住。这妖本是二十八宿之奎木狼，私自下凡，只为陪一个被贬下界的情人——她在天上犯了小错，被罚做宝象国公主百花羞，前尘尽忘；他便跟着下来，陪她重新活一遍。百花羞见唐僧是取经人，私下放走他，托他捎一封信给父王：女儿被妖掳去十三年，望发兵来救。你带着这封信走出洞门，回头看了一眼——洞里那个穿黄袍的，正低头替公主拢了拢披风。',
    intro: '唐僧误入波月洞被擒。百花羞私放、托血书；黄袍怪大怒变虎囚僧，白龙马夜刺受伤。',
    options: [
      { key: 'du', label: '携百花羞血书，往宝象国倒换关文', fate: '渡', effect: { alignGood: 4 }, setFlag: 'n21_baoxiang:start', consequence: '进入宝象国主线，黄袍怪人形态战斗在即' }
    ]
  },
  22: {
    id: 22,
    name: '宝象国·黄袍战',
    act: 3,
    type: 'fight',
    icon: '⚔',
    portrait: '黄袍怪',
    fate: '战',
    echo: '复合第2难·人形态战斗-80% + 请救兵(阶段3) + 破幻',
    branchKey: 'n21_baoxiang',
    dark: '八戒沙僧自告奋勇去降妖，不敌，沙僧被擒。黄袍怪大怒，到宝象国将唐僧变成一只斑斓猛虎，囚在铁笼里；白龙马化作宫女夜刺黄袍怪，也败下阵来，腿上挨了一刀。黄袍怪始终是人的模样，与凡人无异。你一提兵器，唐僧便飘出一句斥语——悟空、八戒、沙僧，不可伤人。你手里那点杀意随即泄了八成，打在它身上，像打在棉花上。要么用照妖镜照出奎木狼本相，要么唤土地山神作证，逼它现形；否则就只能看着它一身黄袍站在殿上，笑得像个体面人。',
    intro: '黄袍怪人形态当前，唐僧斥语压你手软（伤害-80%）。破幻、或十回合后请救兵。',
    options: [
      { key: 'wukong', label: '遣八戒花果山激将，请回孙悟空', fate: '战', effect: { alignEvil: 3 }, setFlag: 'n21_baoxiang:wukong', consequence: '悟空归队；若第20难走缘，额外带回白骨精·妖形态' },
      { key: 'xingxiu', label: '上表天庭，请二十七宿收奎木狼', fate: '渡', effect: { alignGood: 6 }, setFlag: 'n21_baoxiang:xingxiu', consequence: '可触发渡路线' },
      { key: 'none', label: '不请救兵，凭实力续战', fate: '逆', effect: { alignEvil: 6 }, setFlag: 'n21_baoxiang:none', consequence: '悟空永久离队当齐天大圣；可触发逆/缘' },
      { key: 'zhaoyao', label: '以照妖镜照出奎木狼本相', fate: '隐', effect: { alignEvil: 2 }, fight: true, setFlag: 'n21_baoxiang:zhaoyao', consequence: '黄袍怪现妖形，逆路线关闭' },
      { key: 'tudi', label: '唤土地山神作证，逼其现本相', fate: '渡', effect: { alignGood: 5 }, fight: true, setFlag: 'n21_baoxiang:tudi', consequence: '耗寿10天，逆路线关闭' }
    ]
  },
  23: {
    id: 23,
    name: '宝象国·降伏黄袍',
    act: 3,
    type: 'fight',
    icon: '🌟',
    portrait: '黄袍怪',
    fate: '战',
    echo: '复合第3难·六道六选一(战/渡/逆/缘/隐/夺)×3',
    branchKey: 'n21_baoxiang',
    dark: '黄袍怪终是被你逼到了绝境。它可以被二十七宿收走，可以留一缕分身陪你走完西行，也可以被你还给百花羞——只要你肯为她念一段经，替她把丢了的前尘找回来。最狠的一条路是不照本相、不请救兵，纯凭拳头把它从人形里打出来：那样它才会跪下来，说十三载了，头一回有人不用法宝就赢了我。而若你动了别的念头——它内丹是二十八宿正神的精华，剖出来便是天大一桩好处。打完这一场你要想清楚：你收的是妖，还是别人的十三载。',
    intro: '黄袍怪已败。择道收尾：六道六选一。',
    options: [
      { key: '战', label: '将其击败，交二十七宿收走', fate: '战', effect: { alignEvil: 15, ti: { hp: 30, atk: 8 }, material: '宝象妖丹' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n23_baoxiang:zhan', consequence: '得【宝象妖丹】(☆沙僧②)；成就【降伏奎木狼】' },
      { key: '渡', label: '请二十七宿收奎木狼归位', fate: '渡', effect: { alignGood: 24 }, requireFlag: 'n21_baoxiang:xingxiu', setFlag: 'n23_baoxiang:du', consequence: '不杀生；成就【天条无情】' },
      { key: '逆', label: '不靠星宿法宝，纯实力收其分身', fate: '逆', ni: true, effect: { alignEvil: 24, niSutra: 'ni_kuimulang', ally: 'kuimulang_ren' }, requireFlag: 'n21_baoxiang:none', requireFlagNot: 'n21_baoxiang:zhaoyao', fight: true, setFlag: 'n23_baoxiang:ni', consequence: '得逆道经文+奎木狼一缕分身·人形态；成就【情的讨价】' },
      { key: '缘', label: '成全奎木狼与百花羞', fate: '缘', effect: { alignGood: 30, material: 'baihua_hongsheng' }, requireFlag: 'n21_baoxiang:none', requireFlagNot: 'n21_baoxiang:zhaoyao', setFlag: 'n23_baoxiang:yuan', consequence: '得【百花羞的红绳】(三生红绳葫芦原料)；成就【奎木狼的成全】' },
      { key: '隐', label: '化人形夜刺，不显真身', fate: '隐', effect: { alignEvil: 24, material: '宝象潜影' }, setFlag: 'n23_baoxiang:yin', consequence: '得【宝象潜影】(☆白马②)；成就【夜闯银安殿】' },
      { key: '夺', label: '激将悟空归队，怒夺内丹', fate: '夺', effect: { alignEvil: 30, material: '耳根·耳听怒' }, requireFlag: 'n21_baoxiang:wukong', setFlag: 'n23_baoxiang:duo', consequence: '得【耳根·耳听怒】(☆悟空②)；成就【怒夺内丹】' }
    ],
    branches: {
      wukong: { intro: '悟空一棒打进殿去，黄袍怪惨嚎现狼形。八戒的激将，到底把那猴子请了回来。' },
      xingxiu: { intro: '二十七宿奉旨下界，将奎木狼收归天庭。百花羞眼里只有茫然——她一点都不记得他了。' },
      none: { intro: '你不借星宿不借法宝，纯凭实力赢了他。奎木狼含泪归位，百花羞眼角有一滴泪。' },
      zhaoyao: { intro: '照妖镜一照，奎木狼本相毕露。黄袍怪变妖形，再无逆路可走。' },
      tudi: { intro: '土地山神作证，黄袍怪本相自现。你耗寿十日，破去这层人皮。' }
    }
  },

  // ───────────────────────── 24-25 平顶山·金角银角（复合·2难合并×2） ─────────────────────────
  24: {
    id: 24,
    name: '平顶山·莲花洞',
    act: 3,
    type: 'fight',
    icon: '🏔️',
    portrait: '金角银角',
    fate: '渡',
    echo: '复合第1难·平顶山·2难合并×2；路线分叉(骗法宝/不骗)',
    branchKey: 'n24_pingding',
    dark: '平顶山莲花洞，金角大王、银角大王是太上老君兜率宫看炉的两个童子，私自下界为妖。他们手上有五件法宝——紫金红葫芦、羊脂玉净瓶、幌金绳、七星剑、芭蕉扇，还画了你们师徒的像，要捉唐僧吃肉。银角变作受伤道士，躺在路边呼救；唐僧慈悲，命悟空背他。行至半山，银角暗中念咒，移来须弥、峨眉、泰山三座大山，把悟空压在山下，趁势摄走唐僧、八戒、沙僧。山重得连土地山神都赶了来，才揭去山头。你从山下挣出来，第一次觉得：这三座山压的不是那个猴子，是这一路都在背人的那副肩膀。',
    intro: '银角移山压大圣，悟空脱困变道士下山。巧骗法宝，或直取莲花洞？',
    options: [
      { key: 'pian', label: '变道士以假葫芦骗得紫金红葫芦、羊脂玉净瓶', fate: '渡', effect: { alignGood: 4 }, setFlag: 'n24_pingding:pian', treasure: 'zijinhu', consequence: '得紫金红葫芦+羊脂玉净瓶；进入夺幌金绳→分而战之' },
      { key: 'bupian', label: '不屑用计，直接打上莲花洞', fate: '战', effect: { alignEvil: 3 }, setFlag: 'n24_pingding:bupian', fight: true, battleFlags: { openingMomentum: 1 }, consequence: '无宝钩子，金角银角双人同时出战' }
    ]
  },
  25: {
    id: 25,
    name: '平顶山·降伏二童',
    act: 3,
    type: 'fight',
    icon: '🌟',
    portrait: '金角银角',
    fate: '战',
    echo: '复合第2难·路线A→渡 / 路线B→战逆夺',
    branchKey: 'n24_pingding',
    dark: '你变作道士，用一根毫毛变出的假葫芦，骗过了精细鬼、伶俐虫，把紫金红葫芦、羊脂玉净瓶两件真法宝换到了手；半路又打死送幌金绳的九尾狐狸，夺了那条绳。金角设宴等你，被你甩出的幌金绳捆了个结实。它挣断绳子，抄起芭蕉扇，扇得火光冲天；银角倒下那一刻，金角才真正动了杀心。太上老君随后赶到，说这是他家看炉的童子，要收回去。你可以把二童交还老君，也可以收下它们做逆道随从，还可以拦住老君要一件法宝抵账——只是无论哪条路，那两颗在丹炉里烧了三千年的心，都回不去了。',
    intro: '二童当前。依路线抉择：渡（交还老君），或战/逆/夺。',
    options: [
      { key: '渡', label: '困住二童，等太上老君来收归天庭', fate: '渡', effect: { alignGood: 16, treasure: 'tre_bihuozhu', favor: '太上老君' }, requireFlag: 'n24_pingding:pian', setFlag: 'n25_pingding:du', consequence: '得【避火珠】(六珠④·渡线)；老君好感+1；成就【老君的谢意】' },
      { key: '战', label: '以力破局，击败金角银角双人', fate: '战', effect: { alignEvil: 10, ti: { hp: 30, atk: 8 } }, requireFlag: 'n24_pingding:bupian', fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n25_pingding:zhan', consequence: '成就【莲花洞的灰烬】' },
      { key: '逆', label: '纯实力折服，收为逆道随从', fate: '逆', ni: true, effect: { alignEvil: 16, niSutra: 'ni_jinjiao', ally: 'jinjinyinjiao_ren' }, requireFlag: 'n24_pingding:bupian', fight: true, setFlag: 'n25_pingding:ni', consequence: '得逆道经文+金角银角·人形态；老君记恨；成就【兜率宫的叛逆】' },
      { key: '夺', label: '要求老君补偿，宝物三选一', fate: '夺', effect: { alignEvil: 20, treasure: 'tre_bajiaoshan' }, requireFlag: 'n24_pingding:bupian', setFlag: 'n25_pingding:duo', consequence: '得芭蕉扇/羊脂玉净瓶/幌金绳三选一；老君记恨；成就【老君的补偿】' }
    ],
    branches: {
      pian: { intro: '你以假葫芦骗得真宝，夺幌金绳、分而战之，终将二童困住听你发落。' },
      bupian: { intro: '你不依不饶，与金角银角双人死战，逐个击破，太上老君赶来只看到两具妖尸。' }
    }
  },

  // ───────────────────────── 26-27 乌鸡国·金丹救主（复合·2难合并×2） ─────────────────────────
  26: {
    id: 26,
    name: '乌鸡国·金丹救主',
    act: 3,
    type: 'event',
    icon: '🕳️',
    portrait: '青狮精',
    fate: '渡',
    echo: '复合第1难·乌鸡国·2难合并×2；金丹救主路线分叉(救/不救)',
    branchKey: 'n26_wuji',
    dark: '乌鸡国王被青狮精推下井，那狮王扮成国王坐了三年龙椅。怪的是，这三年乌鸡国风调雨顺，赋税减半——妖坐龙椅，竟比人像样。国王鬼魂托梦诉冤，你在御花园石板下寻到那口井。悟空下井，背出泡了三年的尸身，面目却如生；井龙王说，他夜夜在井底哭，上面的百姓夜夜在笑，我拿这颗定颜珠护着他的形容，就为等一个能替他还阳的人。悟空去找太上老君要还魂丹，老君给了金丹，只说一句：这丹能死人复活，但救不救，在你。',
    intro: '国王托梦、下井背尸。悟空讨来金丹，救，还是不救？',
    options: [
      { key: 'jiu', label: '用金丹救活真王', fate: '渡', effect: { alignGood: 5 }, setFlag: 'n26_wuji:jiu', treasure: 'tre_dingyanzhu', consequence: '真王复活；可触发战/渡/逆/缘' },
      { key: 'bujiu', label: '不用金丹，不救真王', fate: '隐', effect: { alignEvil: 3 }, setFlag: 'n26_wuji:bujiu', consequence: '真王不复活；仅触发隐' }
    ]
  },
  27: {
    id: 27,
    name: '乌鸡国·复位之争',
    act: 3,
    type: 'fight',
    icon: '🌟',
    portrait: '青狮精',
    fate: '战',
    echo: '复合第2难·救真王→战渡逆缘 / 不救→隐',
    branchKey: 'n26_wuji',
    dark: '金丹在手，你可以灌进真王口中让他睁眼，也可以把丹收起来，把尸首放回井里。救了他，青狮精变作唐僧的模样与你缠斗，你只能靠念紧箍咒辨出真假；文殊随后赶来，说破因果——当年乌鸡国王曾把文殊浸在御水河里三日三夜，如来才差青狮下界报这一仇。你合掌让文殊收了青狮，真王复位。真王复位的头一件事，是加税。你站在城外看那口井，忽然答不上龙王当年那句没说完的话：百姓要的，到底是一个正统的国王，还是一个过得下去的三年。',
    intro: '青狮精当前。依金丹抉择：战/渡/逆/缘，或不救→隐。',
    options: [
      { key: '战', label: '击败青狮精，真王复位', fate: '战', effect: { alignEvil: 10, ti: { hp: 30, atk: 8 } }, requireFlag: 'n26_wuji:jiu', fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n27_wuji:zhan', consequence: '成就【正统的维护者】' },
      { key: '渡', label: '了解因果，请文殊收狮', fate: '渡', effect: { alignGood: 16, treasure: 'tre_dinghunzhu', favor: '文殊' }, requireFlag: 'n26_wuji:jiu', setFlag: 'n27_wuji:du', consequence: '得【定魂珠】(六珠③·渡线)；文殊好感+1；成就【因果的了悟】' },
      { key: '逆', label: '纯实力折服，收青狮精为逆随从', fate: '逆', ni: true, effect: { alignEvil: 16, niSutra: 'ni_qingshi', ally: 'qingshi_ren' }, requireFlag: 'n26_wuji:jiu', fight: true, setFlag: 'n27_wuji:ni', consequence: '得逆道经文+青狮精·人形态；文殊记恨；成就【文殊的叛逆】' },
      { key: '缘', label: '了解因果，不杀青狮，获定魂珠', fate: '缘', effect: { alignGood: 20, treasure: 'tre_dinghunzhu' }, requireFlag: 'n26_wuji:jiu', setFlag: 'n27_wuji:yuan', consequence: '得【定魂珠】(六珠③·缘线，同源双出处)；成就【因果的成全】' },
      { key: '隐', label: '不救真王，留青狮继续做国王', fate: '隐', effect: { alignEvil: 16, eva: 8 }, requireFlag: 'n26_wuji:bujiu', setFlag: 'n27_wuji:yin', consequence: '闪避装备；成就【正统的看破者】' }
    ],
    branches: {
      jiu: { intro: '你救活真王，与青狮精大战。青狮变唐僧难辨真假，终靠紧箍咒辨出。' },
      bujiu: { intro: '你把金丹收起，将真王尸体放回井中。青狮继续做国王，乌鸡国风调雨顺，真王永醒不过来。' }
    }
  },

  // ───────────────────────── 28-31 火云洞·红孩儿（复合·4难合并×4，章末Boss） ─────────────────────────
  28: {
    id: 28,
    name: '火云洞·初遇红孩儿',
    act: 3,
    type: 'event',
    icon: '🔥',
    portrait: '红孩儿',
    fate: '战',
    echo: '复合第1难·红孩儿·4难合并×4；初遇路线分叉(开打/变牛魔王)',
    branchKey: 'n28_huoyun',
    dark: '红孩儿号圣婴大王，是牛魔王和铁扇公主的儿子。他在火焰山修了三百年，炼成三昧真火，住在火云洞，长得像个年画娃娃，吐出来的火却能把山烧穿。他变作受难孩童吊在树上骗唐僧，唐僧慈悲，命悟空背他。红孩儿认得悟空，说五百年前大闹天宫时，他爹牛魔王还在花果山替他叫好；后来悟空被压，牛魔王便占了积雷山。他一个人在火云洞修了三百年三昧真火——没人管的火，没人问的火，没人疼的火。你可以直接与他斗一场，也可以变作牛魔王，去骗他一骗。',
    intro: '红孩儿吊树骗唐僧。悟空与他斗，还是变牛魔王骗他？',
    options: [
      { key: 'kai', label: '直接开打，与红孩儿斗一场', fate: '战', effect: { alignEvil: 3 }, setFlag: 'n28_huoyun:kai', fight: true, battleFlags: { openingMomentum: 1 }, consequence: '红孩儿有准备，难度较高；可触发战/逆/夺' },
      { key: 'niu', label: '变作牛魔王，骗他出来', fate: '渡', effect: { alignGood: 4 }, setFlag: 'n28_huoyun:niu', consequence: '红孩儿放松警惕，难度较低；可触发缘/渡' }
    ]
  },
  29: {
    id: 29,
    name: '火云洞·三昧真火',
    act: 3,
    type: 'fight',
    icon: '🔥',
    portrait: '红孩儿',
    fate: '战',
    echo: '复合第2难·三昧真火战斗；避火珠可破(法宝钩子)',
    branchKey: 'n28_huoyun',
    dark: '红孩儿张口喷出三昧真火，火光冲天，连龙王的雨水都浇不灭。你若手里有避火珠，尚能灭这火；若没有，就只剩一副皮肉去接。直接开打，他早有准备，火势最盛；变作牛魔王骗他出来，他放松了警惕，火里便少了几分狠劲。他吐火时的眼睛，不是凶，是一种憋了三百年的执拗——像是终于有人肯看他一眼，他要把火烧得够大，好叫对面记住。战斗十回合后，你得决定：是硬接这一场火，还是去请观音，或者，听他把话说完。',
    intro: '三昧真火当前。避火珠可破，否则硬扛。',
    options: [
      { key: 'bihuo', label: '祭出避火珠，灭三昧真火', fate: '渡', effect: { alignGood: 4 }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n28_huoyun:bihuo', consequence: '避火珠免火系，难度大降（配件＋法宝双用·不消耗）' },
      { key: 'hard', label: '无宝纯实力，硬扛三昧真火', fate: '战', effect: { alignEvil: 3 }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n28_huoyun:hard', consequence: '可触发逆；难度高' }
    ]
  },
  30: {
    id: 30,
    name: '火云洞·火甲三态',
    act: 3,
    type: 'fight',
    icon: '🔥',
    portrait: '红孩儿',
    fate: '战',
    echo: '复合第3难·火甲三态(妖形态→妖形态+火甲粒子层)',
    branchKey: 'n28_huoyun',
    dark: '红孩儿的火不止一层。第一层是三昧真火，燎原烧山；第二层，他把火收拢来，往身上一裹，结成一副火甲——火甲护体，你的每一击都被烧去大半力道，像打在一块滚烫的铁上。那不是换了一副皮，是把三百年的火都收进了骨头里。你越打，火甲越亮；你退半步，火便追上来。破它的法子不多：要么用避火珠压住火源，要么就靠一股不退的狠劲，把那层甲一寸寸打裂。你忽然明白，这孩子修的从来不是火，是把没人管的这三百年，炼成了一件谁也剥不下去的东西。',
    intro: '红孩儿现火甲三态：妖形态喷三昧真火，火甲护体减伤。十回合后终局。',
    options: [
      { key: 'jia', label: '破火甲，强攻终局', fate: '战', effect: { alignEvil: 3 }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n28_huoyun:jia', consequence: '进入终局六道抉择' }
    ]
  },
  31: {
    id: 31,
    name: '火云洞·红孩儿',
    act: 3,
    type: 'boss',
    icon: '👑',
    portrait: '红孩儿',
    fate: '战',
    echo: '章末Boss·火甲三态；终局五道(战/渡/逆/缘/夺)×4；蓝劫印',
    branchKey: 'n28_huoyun',
    dark: '火云洞前，红孩儿倒在火里，望着你说了最后一句：你赢了，可你赢的是个孩子。观音赶来，把他收作善财童子；红孩儿走时没回头——他被安排了一个正果，可没人问过他，想不想做善财童子。你还有别的路：变作牛魔王，听他对着爹的样貌哭诉三百年的委屈，再点化他正果不是别人给的，是自己修的；也可以纯凭实力接住三百年真火，让他跪地跟你走；最狠的是趁他落败，把他那杆能喷三昧真火的火尖枪夺过来。火散了，云洞里只剩三百年没人闻过的味道。',
    intro: '圣婴大王当前。依初遇路线终局：战/逆/夺（开打）或缘/渡（变牛魔王）。',
    options: [
      { key: '战', label: '击败红孩儿', fate: '战', effect: { alignEvil: 20, ti: { hp: 40, atk: 10 } }, requireFlag: 'n28_huoyun:kai', fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n31_huoyun:zhan', consequence: '成就【火云洞的胜者】' },
      { key: '渡', label: '请观音收红孩儿做善财童子', fate: '渡', effect: { alignGood: 32, treasure: 'chan_shancai_sheli', favor: '观音' }, requireFlag: 'n28_huoyun:niu', setFlag: 'n31_huoyun:du', consequence: '得【善财舍利】(★法杖③)；观音好感+1；成就【善财童子】' },
      { key: '逆', label: '纯实力折服，收为逆道随从', fate: '逆', ni: true, effect: { alignEvil: 32, niSutra: 'ni_honghai', ally: 'honghai_ren' }, requireFlag: 'n28_huoyun:kai', requireFlagNot: 'n28_huoyun:bihuo', fight: true, setFlag: 'n31_huoyun:ni', consequence: '得逆道经文+红孩儿·人形态；观音记恨；成就【三昧的叛逆】' },
      { key: '缘', label: '变牛魔王后点化红孩儿', fate: '缘', effect: { alignGood: 40, follower: 'honghai_jiban' }, requireFlag: 'n28_huoyun:niu', setFlag: 'n31_huoyun:yuan', consequence: '得红孩儿羁绊(后续火系劫难可援助)；成就【三昧的点化】' },
      { key: '夺', label: '见宝起意，夺火尖枪', fate: '夺', effect: { alignEvil: 40, treasure: 'tre_huojianqiang' }, requireFlag: 'n28_huoyun:kai', setFlag: 'n31_huoyun:duo', consequence: '得【火尖枪】(三昧真火·火系群伤)；牛魔王夫妇记恨；成就【火尖枪入手】' }
    ],
    treasure: { id: 'honghai_sheli', type: 'treasure', note: '红孩儿·章末舍利（蓝劫印·章末Boss）' },
    hidden: { hero: 'wukong', cond: '逆 + 未用法宝', job: '圣婴折服', hint: '红孩儿逆收、未催法宝——以力服妖', desc: '收红孩儿·人形态为逆随从（悟空持棒者视角）' },
    branches: {
      kai: { intro: '你直接开打，红孩儿有准备，三昧真火凶猛。十回合后，终局摊开。' },
      niu: { intro: '你变作牛魔王骗出红孩儿，他放松警惕，对着"爹"哭诉委屈。终局摊开。' }
    }
  }
});
