// =============================================================
// data_trials_story.js — 81难剧情库/结局/伏笔回响
// TRIALS/ENDINGS/evaluateEnding/trialByLayer/normalizeTrial/echoPayoff
// 从 data.js 拆分（2026-08-31，Node 锚点拆分）
// 全局命名空间 NDX
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// ============================================================
// 劫难叙事（肉鸽三选一）—— 取代原"纯战斗"
// 每个劫难：title 劫名 / text 弹窗叙事 / opts 三选一
// 选项 effect 沿用通用字段；fate 决定通关结局倾向：
//   战=以力破劫 · 隐=避锋修心 · 夺=逆取天机 · 渡=渡人向善 · 逆=跳出簿子
// ============================================================
// 前二十难（五行山下篇）—— 按《逆道西行》剧情叙事文档的"劫名"对齐
// 键 = 难数（与 MAP_PLAN 中 trial 节点的 diff 对应）
// drop = 该劫固定宝物（可进入合成链）；opts 三选一沿用肉鸽命运倾向
NDX.TRIALS = {
  // —— 英雄专属劫难（heroLock 指定英雄专属；该英雄首次进入劫难必遇，且每个英雄仅一次）——
  // 小猴子(悟空) 必定经过「两界山」：可戴金箍(+100% 战力) 或 不戴走隐藏暗线(必选项)
  wukong_liangjie: {
    heroLock: 'wukong',
    title: '两界山·金箍之择', drop: ['wk_crown_base', 'wk_armor_base', '冠·翎', '甲·环'],
    text: '两界山下，那张封了五百年的符还贴着。山下有影子蠢动——那是被压着的「小猴子」你自己。山神递来一道金箍：「戴上它，你便听调不听宣，战力暴涨；不戴，山下那个你便会醒来，带你走一条无人走过的暗路。」你望着自己的影子，迟迟未决。',
    opts: [
      { text: '戴上金箍——束身换战力，战力暴涨百分百（+100% 体攻），从此听调不听宣（恶+8）', jingu: true, effect: { evil: 8 }, fate: '战' },
      { text: '摘符不戴——放另一个自己醒来，走隐藏暗线（必选项，此后妖路大不相同）', tsHidden: true, effect: {}, fate: '隐' },
    ],
  },
  1: { title: '陷虎穴·金星解厄', drop: ['tm_w_base', 'set_weapon_base', '破军·锋', '破军·脊'], text: '双叉岭两道分叉，虎熊牛精要分食你这"取经人"。它们啃骨头嚼得咔咔响，像在试你够不够塞牙缝。太白金星遥掷一缕金光，却在耳边低语：你本不该在此受难——压你的山，才是第一难。金星顺手授你破军枪胚与两段枪材：集齐便可铸破军枪。金光散处，你看见自己的影子被虎精踩在脚下，却一声不吭。',
    opts: [
      { text: '以棒碎虎穴，夺金星所赠灵木——让吃人的先尝被吃的滋味（体攻+18）', effect: { ti: { atk: 18 } }, fate: '战' },
      { text: '顺金星之意卸力藏形，把杀心摁回肚里（气血+60）', effect: { ti: { hp: 60 } }, fate: '隐' },
      { text: '窃金光中一枚灵石私藏——好处不落外人之手', effect: { gold: 30, material: '灵石' }, fate: '夺' },
    ] },
  2: { title: '劈高山·伯钦留僧', drop: 'de_a_base', text: '两界山上，猎户刘伯钦替你挡开猛虎，请你去家歇脚。酒肉间他问：你这和尚去灵山，可是去认命？你瞥见山那头，正是压了五百年的你自己——那个影子正盯着你，像在问：你出来了，可你自由了吗？炉火映着伯钦刀上的血，他杀了半生虎，到头来也不过替这座山看门。',
    opts: [
      { text: '随伯钦猎虎，取其皮甲——以猎户的皮，裹自己的命（体攻+20）', effect: { ti: { atk: 20 } }, fate: '战' },
      { text: '与伯钦叙旧，听一段人间经——最懂佛的，往往是杀生的人（善+15·气血+40）', effect: { good: 15, ti: { hp: 40 } }, fate: '渡' },
      { text: '两界山石中撬出旧日兵刃炼宝——从前埋的，今天挖出来用', effect: { equip: 2 }, fate: '夺' },
    ] },
  3: { title: '心猿归正', drop: 'tm_t_base', text: '五行山下一张符封着你的七十二变。山下人说揭了符你就自由，可揭了符，你便又成了"泼猴"——那张他们最怕的脸。你盯着那符，纸都黄了，墨却鲜红得像刚写。是揭，还是让山替你记着从前？山不说话，它压了你五百年，早学会了沉默。',
    opts: [
      { text: '以肉身硬扛，崩山夺符中灵木——碎的不是山，是给你贴的标签（体攻+22·气血+30）', effect: { ti: { atk: 22, hp: 30 } }, fate: '战' },
      { text: '顺气卸力，借压淬体养神——山压得住身，压不住你生根（气血+70）', effect: { ti: { hp: 70 } }, fate: '隐' },
      { text: '剥符皮制甲，夺其凶煞——把封你的咒，穿成护你的甲（护体+5%）', effect: { equip: 2, evil: 10, ti: { dr: 0.05 } }, fate: '逆' },
    ] },
  4: { title: '六贼无踪', drop: 'tm_a_base', text: '眼耳舌身意，六个毛贼拦路，要抢你"肉眼凡胎"的旧皮囊。你认得他们——那是你还不曾反时的六种软弱。可他们手里刀比你还旧，显然也穷得揭不开锅。你忽然觉得，这哪是劫财，分明是六个走投无路的人，想从你身上讨一口"从前的自己"。',
    opts: [
      { text: '攥住一把锈刃，破贼而出——先动手的，才配叫干净（体攻+24）', effect: { ti: { atk: 24 } }, fate: '战' },
      { text: '闭息沉心，随缘打发——软的来了，硬的便让路（气血+80·护体+3%）', effect: { ti: { hp: 80, dr: 0.03 } }, fate: '隐' },
      { text: '取六贼兵刃熔作一宝——他们的穷，铸成你的锋', effect: { equip: 2, slot: 'weapon' }, fate: '夺' },
    ] },
  5: { title: '蛇盘山·意马收缰', drop: 'de_t_base', text: '蛇盘山深渊里，一匹白龙被锁在西海旧誓中。它鳞片剥落处露出旧伤，那是它爹亲手抽的——天庭的规矩，连亲儿子也照样锁。它问你：你那根金箍棒，可也曾被谁锁着？你摸了摸空荡荡的手心，竟答不上来。',
    opts: [
      { text: '一棍碎锁，收白龙为脚力——同是被圈住的，便做一路（体攻+26·恶+8）', effect: { ti: { atk: 26 }, evil: 8 }, fate: '逆' },
      { text: '为白龙立誓，超度旧缚——它欠的债，你替它念完（善+20·气血上限+150）', effect: { good: 20, healFull: true }, fate: '渡' },
      { text: '取龙鳞炼一副轻甲——剥它的痛，护你的身（气血+30）', effect: { equip: 2, ti: { hp: 30 } }, fate: '隐' },
    ] },
  6: { title: '观音禅院·僧谋宝贝', drop: 'de_w_base', text: '观音禅院里，老僧见你锦襕袈裟便起了杀心。金池长老活了二百七十岁，修的全是"如何不死"，到头来为一件衣裳要人命。火起时他站在檐下笑，火光里你看见自己当年大闹天宫的那点狂——原来佛堂与天宫，烧起来都是一个味。',
    opts: [
      { text: '掀翻禅院，夺院中镇宝净瓶——和尚不慈悲，宝器便归敢拿的', effect: { equip: 2, slot: 'treasure' }, fate: '夺' },
      { text: '混入僧众，盗一身气象——披着袈裟的，从来不止和尚（体攻+28·气血+40）', effect: { ti: { atk: 28, hp: 40 } }, fate: '战' },
      { text: '点醒老僧，揭破贪障——你渡他，他未必领情（善+25）', effect: { good: 25 }, fate: '渡' },
    ] },
  7: { title: '黄风怪阻', drop: 'de_a_base', text: '黄风岭一口黄风，吹得你睁不开眼。风里有人笑：当年你搅乱蟠桃会，也是这般教人睁眼瞎。黄风怪本是灵山脚下一只貂鼠，偷了灯油便被撵下界——你说他是妖，天庭说他是贼，横竖都没人问他愿不愿。',
    opts: [
      { text: '踏风而行，反斩出一条风路——风再大，也吹不散不肯低头的人（体攻+30）', effect: { ti: { atk: 30 } }, fate: '战' },
      { text: '读风里残铭，悟守心诀——风过耳，心不过耳（气血+90·御念+4%）', effect: { ti: { hp: 90 }, yuan: { mdef: 0.04 } }, fate: '隐' },
      { text: '收三缕妖风，炼定风之宝——他吹乱的世道，你拿来镇自己', effect: { equip: 2, slot: 'treasure' }, fate: '夺' },
    ] },
  8: { title: '流沙河·木叉奉法', drop: 'de_a_base', text: '流沙河底，卷帘大将项上挂着你同类的骷髅。每失手一次，天庭便削他一层仙籍，骷髅便是他掉下来的"自己"。他问：你跳出簿子，可曾跳出"被收服"的命？你低头看河面，水里那个你，也戴着一串别人的骷髅。',
    opts: [
      { text: '以旧日狂性压沙，反夺沙中宝——他跪惯了，你偏不跪（体攻+32·恶+12）', effect: { ti: { atk: 32 }, evil: 12 }, fate: '逆' },
      { text: '借沙势炼体，皮糙肉厚——沙子磨人，也磨出硬壳（气血+100）', effect: { ti: { hp: 100 } }, fate: '隐' },
      { text: '与沙僧论劫，得其锁子宝甲——同是戴罪身，便换件衣裳（善+10）', effect: { equip: 2, slot: 'armor', good: 10 }, fate: '渡' },
    ] },
  9: { title: '四圣显化·试禅心', drop: ['set_armor_base', '玄武·鳞', '玄武·心'], text: '黎山老母携三圣变作一户人家，要招你入赘。四圣的棋，考的不是色，是你还肯不肯"被人安排"。你坐在这虚假的暖屋里，想起五行山下连个遮风的都没有——他们用你最缺的，试你最软的。试罢，四圣赐你玄武甲胚与两片甲材：集齐可铸玄武甲。',
    opts: [
      { text: '一一拆了他们的试探——安排我的，先过我这关（体攻+34）', effect: { ti: { atk: 34 } }, fate: '战' },
      { text: '下注押自己赢，赢来香火金——赌局是假的，金子是实的', effect: { gold: 60, material: '香火' }, fate: '夺' },
      { text: '点化四圣，使其弃术向道——施试的人，也该被点一回（善+30·气血上限+150）', effect: { good: 30, healFull: true }, fate: '渡' },
    ] },
  10: { title: '大闹五庄观·人参果', drop: 'tm_w_base', text: '万寿山五庄观，镇元子的人参果你一口吞了。果子落地能说话，说它活了九千年，等的就是被人吃。推倒宝树时你忽然明白：你反的从来不是道，是"非给你不可"的恩——镇元子待你以礼，你却怕这礼背后，又是另一道五行山。',
    opts: [
      { text: '踏碎冰刀，硬趟过去——恩也好，刀也好，挡路便碎（体攻+36·气血+50）', effect: { ti: { atk: 36, hp: 50 } }, fate: '战' },
      { text: '顺观中脉潜游，省下气力——硬的不来，便走软的（气血+110）', effect: { ti: { hp: 110 } }, fate: '隐' },
      { text: '剥宝树气脉铸一柄寒兵——他镇观的树，成你手中的刃', effect: { equip: 2, slot: 'weapon' }, fate: '夺' },
    ] },
  11: { title: '白骨迭现·尸魔三戏', drop: 'de_a_base', text: '荒冢里白骨一具变三具，每一具都像你将来可能的模样：少年、壮汉、老僧。尸魔三戏，戏的不是色，是你还认不认得自己。风卷起骨渣扑你脸，凉得像有人替你哭。你举棒时手抖了一下——打死的是妖，还是没走成的那个你？',
    opts: [
      { text: '一棍碎尽，不愿照见自己——看清了，反而下不去手（体攻+38·恶+8）', effect: { ti: { atk: 38 }, evil: 8 }, fate: '逆' },
      { text: '为白骨立坟，超度它们——它们没走成的路，你替它们安息（善+22·气血上限+150）', effect: { good: 22, healFull: true }, fate: '渡' },
      { text: '取白骨炼一副山文甲——把"可能的自己"穿在身上（气血+40）', effect: { equip: 2, slot: 'armor', ti: { hp: 40 } }, fate: '隐' },
    ] },
  12: { title: '莲花洞·木母逢灾', drop: 'zy_w_base', text: '平顶山莲花洞，金角银角持你当年的家当：紫金红葫芦、玉净瓶。他们笑：这套路的发明者，不正是你？当年你用葫芦装人，今天他们用葫芦装你——因果转了个圈，又套回自己头上。童子本是看炉的，看久了便以为炉里的宝贝是自己的。',
    opts: [
      { text: '以力破圈，夺回旧日烈焰枪——自己的招，自己收回来（体攻+40）', effect: { ti: { atk: 40 }, equip: 2, slot: 'weapon' }, fate: '战' },
      { text: '绕圈周旋，看出破绽——他们学的，终究不及你随手使得熟（气血+120·护体+5%）', effect: { ti: { hp: 120, dr: 0.05 } }, fate: '隐' },
      { text: '假意臣服，反偷其圈中宝——你教过天下的套路，自己也会（金+70·恶+15）', effect: { gold: 70, evil: 15 }, fate: '逆' },
    ] },
  13: { title: '外道迷真性·元神助本心', drop: 'zy_a_base', text: '银角大王一声"孙悟空"，便把你的元神装进了葫芦。你在瓶里翻滚，听见外面的自己正和妖怪谈笑——原来最难装下的，是你自己。葫芦贴着"敕令"二字，是太上老君的印，你这才懂：连装你的瓶子，都是上头发的。',
    opts: [
      { text: '和"自己"斗到一方认输——瓶里瓶外，总得有个服的（体攻+42）', effect: { ti: { atk: 42 } }, fate: '战' },
      { text: '与瓶中共振，补全心魂——困住你的，也能养住你（气血+140·善+15）', effect: { ti: { hp: 140 }, good: 15 }, fate: '渡' },
      { text: '吞掉瓶中影，夺其修为——把分裂的自己，吞回肚里（体攻+20·气血+60·恶+15）', effect: { ti: { atk: 20, hp: 60 }, evil: 15, sutraInsight: '自书其契' }, fate: '逆' },
    ] },
  14: { title: '魔王谋大圣', drop: 'zy_t_base', text: '九尾魔王设宴请你，席上敬的是"齐天大圣"的旧封号。你举杯时才看清：那杯里映的，是灵山给你留的座——原来他们请的不是你，是你将来"成正果"的那个影子。魔王笑：做妖的请做佛的吃饭，这世道，果然谁上去都一样。',
    opts: [
      { text: '劈宴引风，把局当披风——座是假的，披风是实的（体攻+44·气血+50）', effect: { ti: { atk: 44, hp: 50 } }, fate: '战' },
      { text: '取宝扇，扇出一条生路——别人给的路，不如自己扇的开', effect: { equip: 2, slot: 'treasure' }, fate: '夺' },
      { text: '坐宴中参禅，火里开花——乱局之中，反倒坐得住（气血+150·御念+5%）', effect: { ti: { hp: 150 }, yuan: { mdef: 0.05 } }, fate: '隐' },
    ] },
  15: { title: '缚魔归正·黑水河', drop: 'ym_w_base', text: '黑水河鼍龙占了河神之位，说"归正"便是替天庭看门。它问你：你那五行山，不也是"归正"二字压下来的？它本是西海龙王外甥，犯点小错便被贬来看河——"归正"的牌子一挂，连亲戚都成了下属。你忽然觉得，这河里泡着的，不止它一个。',
    opts: [
      { text: '一棍打碎金身，夺其舍利——它拜的佛，你偏砸给他看（体攻+46）', effect: { ti: { atk: 46 }, equip: 2 }, fate: '逆' },
      { text: '跪而思过，忏出一身轻——替它跪，也替从前的自己跪（善+35·气血上限+150）', effect: { good: 35, healFull: true }, fate: '渡' },
      { text: '借水脉淬体，肉身成圣——它看不住的河，你拿来养身（气血+160）', effect: { ti: { hp: 160 } }, fate: '隐' },
    ] },
  16: { title: '成器让婴儿·火云洞', drop: 'zy_w_base', text: '火云洞红孩儿吐三昧真火，火里映出你大闹天宫的旧影。他说：你当年的火，可比我纯。这孩子是牛魔王与罗刹女的儿子，父母忙着争地盘，把他丢在洞里自己长大——他吐的火，烧的其实是没人管他的委屈。你看着那点红痣，竟有点怜他。',
    opts: [
      { text: '以诗为刃，劈开绝路——他缺的不是火，是有人接得住（体攻+48）', effect: { ti: { atk: 48 } }, fate: '战' },
      { text: '三昧尽数抄下，悟其中道——他烧出来的，你拿来取暖（气血+170·善+10）', effect: { ti: { hp: 170 }, good: 10 }, fate: '渡' },
      { text: '焚火取灰，炼一味奇毒宝——他的怨，成你的器', effect: { equip: 2, slot: 'treasure', evil: 20 }, fate: '逆' },
    ] },
  17: { title: '黑河妖孽·火云余烬', drop: ['ym_t_base', 'set_treasure_base', '贪狼·牙', '贪狼·瞳', 'pj_armor_base', '破军·铠', '破军·骨', 'pj_treasure_base', '破军·印', '破军·魄'], text: '火云散后，黑河底浮起一枚紫金铃，是当年你绑在坐骑颈上的。它说：你以为丢了自由，其实自由一直在你手里响。河底另沉贪狼坠胚与狼牙狼瞳、破军甲胚与铠骨、破军坠胚与印魄：集齐可铸贪狼坠与破军甲坠。铃铛锈了，声却还清——原来你早有挣脱的力气，只是忘了摇。',
    opts: [
      { text: '破自己布的局，证明无悔——从前下的套，今天自己解（体攻+50·气血+60）', effect: { ti: { atk: 50, hp: 60 } }, fate: '战' },
      { text: '顺河势走，借杀机炼体——水往下流，你顺着它反倒站稳（气血+180·护体+6%）', effect: { ti: { hp: 180, dr: 0.06 } }, fate: '隐' },
      { text: '逆转阵眼，夺阵中仙宝——他设的阵，你反手收了', effect: { equip: 2, slot: 'treasure' }, fate: '夺' },
    ] },
  18: { title: '车迟国斗法', drop: 'zy_w_base', text: '车迟国虎力鹿力羊力三妖，以"斗法"替天庭牧民。百姓跪在台下喊"国师万寿"，眼里却没光——他们信的不是佛，是能求来雨的棍子。你认得这戏码：用神通换顺民，正是你最恨的。三妖原是山中修行的兽，被招安那天起，便不再是自己。',
    opts: [
      { text: '掀翻妖席，夺三王兵权——他们替天庭牧的民，你偏放走（体攻+52）', effect: { ti: { atk: 52 }, equip: 2, slot: 'weapon' }, fate: '战' },
      { text: '超度满城民，积无边功德——顺民也是人，值得有人渡一回（善+40·气血上限+150）', effect: { good: 40, healFull: true }, fate: '渡' },
      { text: '坐妖山顶，自封为王——他们做的椅，你坐得，天庭便管不着（恶+30·气血+80）', effect: { evil: 30, ti: { hp: 80 }, sutraInsight: '账簿问谁' }, fate: '逆' },
    ] },
  19: { title: '金㔉山遇怪·独角兕', drop: 'ym_a_base', text: '金㔉山青牛精晃着金刚琢，说这圈子能套住天上一切——包括你的来路。你忽然懂了：当年压你的五行山，也是个圈子，只是更大、更旧、写着"天命"二字。青牛本是太上老君的坐骑，套惯了人，也套惯了自己——它晃圈子时，眼里有种认命的温和。',
    opts: [
      { text: '抓住坠落的自己，叠成一体——散了一地的，重新捏回来（体攻+54·气血+70）', effect: { ti: { atk: 54, hp: 70 } }, fate: '战' },
      { text: '放绳救起每一个自己——掉下去的版本，也值得拉一把（善+42·气血+90）', effect: { good: 42, ti: { hp: 90 } }, fate: '渡' },
      { text: '抽身而出，把圈子留给天庭——他们爱的圈，让他们自己钻（恶+32）', effect: { evil: 32, equip: 2 }, fate: '逆' },
    ] },
  20: { title: '灵山脚下·无底堕天', drop: 'ym_t_base', text: '灵山脚下是无底洞，洞里没有妖，只有无数版本的"你"在坠落：当和尚的、当妖王的、半途折返的、到了山门又不进的。这是最后一难——你究竟要救哪一个自己？金光从头顶漏下来，照不到洞底，正如灵山那扇门，从不为还在坠落的人开。',
    opts: [
      { text: '以力攀出无底，夺壁上灵瓶——别人给的座不要，自己挣的瓶先拿（体攻+56·气血+90）', effect: { ti: { atk: 56, hp: 90 } }, fate: '战' },
      { text: '坐洞底参禅，火里开花——救不起所有人，便先坐稳自己（气血+190·护体+6%）', effect: { ti: { hp: 190, dr: 0.06 } }, fate: '隐' },
      { text: '抽身而出，把坠落留给他们——你走出无底，便是对他们最好的渡（恶+35）', effect: { evil: 35, equip: 2 }, fate: '逆' },
    ] },
  // 落地即直面「簿外之我」，奖励逆道专属（逆系劫印 + 逆道命痕二选其一），逼玩家在逆道流上加深
  __xinmo: {
    title: '心魔劫 · 簿外之我', drop: null, hidden: true, cycleReq: 2,
    text: '一道与你一模一样的影子从簿子里走出来——它不是妖，是「本该走的另一条路」。它说：你每逆一道，我便实一分。二周目逆道已开，心魔不再躲藏，径直拦在路口要你认。认下，便得逆道真传；不认，便与它缠斗到底。',
    opts: [
      { text: '纳心魔为印——逆系劫印刻入魂魄（直接获得一枚随机蓝色逆道劫印）', effect: { grantNiSeal: true }, fate: '逆' },
      { text: '化心魔为经——逆道经文碎片铸入血肉（拾得一枚逆道经文碎片）', effect: { grantNiSutraFrag: true }, fate: '逆' },
      { text: '斩心魔证我——以战破幻（体攻+60·气血+120）', effect: { ti: { atk: 60, hp: 120 } }, fate: '战' },
    ] },
};

// ============================================================
// 多结局：真源不在此文件（2026-09-07 结局三轨收口）
//   · 结算真源：js/game/game_meta.js computeEnding()（按英雄 + 善恶，7 变种）
//   · 二周目覆盖：js/game/game_lundao.js lundaoChoose() 写 s.over.ending（焚 / 重续 / 存留）
//   · 呈现真源：js/data_endings_cg.js NDX.ENDINGS_CG（6 条 CG）
// 已移除死代码 NDX.ENDINGS / NDX.evaluateEnding：全局无任何调用点，且其键集为
//   战/隐/夺/渡/逆/衡——缺「缘」且多出「衡」，在「缘」主导时会 e.title 抛 TypeError。
//   ⚠ 勿再恢复。改结局口径请统一改上述三处真源，保持单一真源。
// ============================================================

// 英雄初始（五英雄）
// 体 / 愿 双体系：
//   体（肉身·物理）：baseAtk 体攻 / baseHp 气血 / baseDr 护体 / baseEva 身法
//   愿（心念·法术）：baseMatk 愿伤 / baseMdef 御念
// sys：本英雄「主线体系」（ti=体 / yuan=愿），影响初始装侧重与共鸣
// focus 文字标注侧重点

// ============ 黑暗西游 · 八十一难剧情内容库（按难号 layer 索引）============
// 与现有随机 TRIALS 池并存：game.js 在「按难号精确叙事」时优先取本库（NDX.trialByLayer），
// 随机肉鸽劫难仍走 NDX.TRIALS 随机池，互不干扰。
// 结构统一为 { id, name, act, type, icon, dark, intro, options[], treasure, hidden }，
// options 字段：{ key, label, fate, fight?, reward?, effect?, treasure?, ending? }
NDX.TRIALS = NDX.TRIALS || {};

// 按难号(layer)取剧情：优先剧情库（精确叙事），回退到原随机 TRIALS 池（肉鸽劫难）
// hero：当前英雄 id（wukong/bajie/shaseng/xiaobailong/tangseng）。
//   若 NDX.HERO_TRIALS[hero][layer] 存在，则按字段浅合并专属文本（name/dark/intro/options），
//   实现「每个英雄在第 8 难后的专属难替换原叙事」，且不污染原 TRIAL_LIB。
NDX.trialByLayer = function (layer, hero) {
  const lib = NDX.TRIAL_LIB || {};
  let base = (layer && lib[layer]) || null;
  // 回退：随机抽一条原 TRIALS 池（保持肉鸽多样，不卡死）
  if (!base) {
    try { return NDX.pickTrial(); } catch (e) { return null; }
  }
  const ht = NDX.HERO_TRIALS && hero && NDX.HERO_TRIALS[hero];
  const over = ht && ht[layer];
  // 合并：专属字段覆盖；options 若提供则整体替换（序章二选一用）
  const merged = {};
  Object.keys(base).forEach((k) => { merged[k] = base[k]; });
  if (over) {
    Object.keys(over).forEach((k) => {
      if (k === 'options') merged.options = over.options.slice();
      else if (over[k] != null) merged[k] = over[k];
    });
  }
  // 按当前英雄把取经人专属掉落替换为对应英雄的装备/法宝，防止孙悟空拿到金蝉舍利等串戏奖励。
  const dropMap = NDX.HERO_TRIAL_DROPS && hero && NDX.HERO_TRIAL_DROPS[hero];
  if (dropMap) {
    const mapTreasure = (id) => dropMap[id] || id;
    // 1) trial 级 treasure.id
    if (merged.treasure) {
      if (merged.treasure.id) merged.treasure = { id: mapTreasure(merged.treasure.id) };
      else if (typeof merged.treasure === 'string') merged.treasure = mapTreasure(merged.treasure);
    }
    // 2) options 级 treasure（字符串或数组）
    if (Array.isArray(merged.options)) {
      merged.options = merged.options.map((opt) => {
        if (!opt || !opt.treasure) return opt;
        const next = Object.assign({}, opt);
        if (typeof next.treasure === 'string') next.treasure = mapTreasure(next.treasure);
        else if (Array.isArray(next.treasure)) next.treasure = next.treasure.map(mapTreasure);
        return next;
      });
    }
  }
  // 若专属只给了 intro 而保留了原 dark，则把 intro 作为补充段落（normalizeTrial 会拼接 text）
  return merged;
};

// 兼容桥：无论旧 schema(title/text/opts/drop) 还是新 schema(dark/intro/options)，
// 统一返回 { title, text, opts, type, icon, treasure, hidden }，供 game.js / ui.js 直接消费。
// V8.7x：六道善恶解耦。选项善/恶标签由逐选项 effect.alignGood/alignEvil 决定（见 game_event_3._applyFate）。
// 此兜底仅在选项未显式声明 align 时生效：渡/缘 固定善，逆/夺 固定恶，战/隐 中性（不给默认标签）。
function _alignOfFate(f) {
  if (f === '渡' || f === '缘') return 'good';
  if (f === '逆' || f === '夺') return 'evil';
  return null; // 战/隐 中性：不自动赋善/恶标签，由选项自身 effect 决定
}
NDX.normalizeTrial = function (t) {
  if (!t) return null;
  if (t.dark !== undefined || t.options !== undefined) {
    // 新库 schema
    return {
      id: t.id,
      name: t.name,
      act: NDX.chapterOf(t.id), // 按难号(1-81)推断真实章节，避免用了错位元数据 t.act（原库把 11-20 误标 act:2）
      type: t.type,
      icon: t.icon,
      fate: t.fate || null,   // 六道命运·主命运（8.11：每难 tonal 主导的命运线）
      echo: t.echo || null,   // 前后呼应（8.11：倒序重构 / 暗线指向）
      title: t.name || ('第' + (t.id || '?') + '难'),
      text: (t.dark || '') + (t.intro ? ('\n\n' + t.intro) : ''),
      // V8.15：基于 fate 自动推导 align（善/恶二分）与 daotu（三选项声道）
      // 善：渡/隐；恶：战/夺/逆。V8.16 起 align 仅作选项善/恶标签展示，不再触发锁定；
      // 三选项：前两条标对立 align，第三条标 daotu（其 fate 单字道名，需已领该道）。
      opts: (function () {
        const raw = (t.options || []).map((o) => ({
          key: o.key,
          text: o.label,
          label: o.label || o.key || null,
          align: o.align || null,
          daotu: o.daotu || null,
          noDao: !!o.noDao,
          ge: o.ge || null,
          geVal: o.geVal || 0,
          fate: o.fate,
          fight: !!o.fight,
          reward: o.reward,
          effect: o.effect,
          treasure: o.treasure,
          ending: o.ending,
          battleFlags: o.battleFlags,
          rewardTitle: o.rewardTitle || null,
          rewardDesc: o.rewardDesc || null,
          bossDiff: o.bossDiff || null,
          // 六道平衡（2026-09-12）：夺道分级与复合劫难抉择链
          //   duo      : 'T0'（天花板难度+至宝+隐藏升级）/ 'T1'（高难+稀有法宝）
          //   chain    : 本选项落子后记入 s.flags.chain 的链标记（供同复合节点的后续子难读取）
          //   chainMul : [链标记, 倍率] —— 若该标记已立，本场战斗难度 ×倍率（抉择改写战场）
          duo: o.duo || null,
          chain: o.chain || null,
          chainMul: o.chainMul || null,
          unlockCodex: o.unlockCodex || null,
          crackJingu: o.crackJingu || null,
          disciple: o.disciple || null,
          favorGate: o.favorGate || null,
          favorText: o.favorText || null,
          favorEffect: o.favorEffect || null,
          subTitle: o.subTitle || null,
          subText: o.subText || null,
          tip: o.tip || null,
          subOptions: Array.isArray(o.subOptions) ? o.subOptions.map((so) => ({
            key: so.key, text: so.label, label: so.label || so.key || null, fate: so.fate,
            align: so.align || null, daotu: so.daotu || null, ge: so.ge || null, geVal: so.geVal || 0,
            fight: !!so.fight, noFight: !!so.noFight, reward: so.reward, effect: so.effect, treasure: so.treasure,
            battleFlags: so.battleFlags, tip: so.tip || null,
            favorGate: so.favorGate || null, favorText: so.favorText || null, favorEffect: so.favorEffect || null,
          })) : null,
        }));
        if (raw.length === 3) {
          const f0 = _alignOfFate(raw[0].fate);
          const f1 = _alignOfFate(raw[1].fate);
          // 前两条对立 align
          if (f0 && !raw[0].align) raw[0].align = f0;
          if (f1 && !raw[1].align) raw[1].align = f1;
          // 第三条声道（取自身 fate 单字道名，需已领该道）；noDao:true 可显式解除（叙事/战斗类三途不锁）
          if (!raw[2].daotu && !raw[2].noDao) raw[2].daotu = raw[2].fate || null;
        } else if (raw.length === 2) {
          const f0 = _alignOfFate(raw[0].fate);
          const f1 = _alignOfFate(raw[1].fate);
          // 仅当两条分属不同阵营才标 align（对立）；同阵营不标（align 仅作标签展示）
          if (f0 && f1 && f0 !== f1) {
            if (!raw[0].align) raw[0].align = f0;
            if (!raw[1].align) raw[1].align = f1;
          }
        }
        // V8.37 软锁兜底：选项为空时添加默认"继续西行"选项，避免数据瑕疵导致死局
        if (raw.length === 0) {
          console.warn('[normalizeTrial] 选项为空，已注入默认继续选项，trial id=' + (t.id || '?'));
          raw.push({
            key: 'continue',
            text: '继续西行',
            label: '继续西行',
            fate: null,
            align: null,
            daotu: null,
            noDao: true,
            fight: false,
            effect: null,
            treasure: null,
          });
        }
        return raw;
      })(),
      treasure: t.treasure || null,
      hidden: t.hidden || null,
    };
  }
  // 旧库 schema：直接返回（已含 title/text/opts/drop）
  return t;
};

// ============ 全难伏笔一一对应（echo 落地可视化）============
// 后期难(D∈[41,80])回访早期难(D-40)：按早期选择的六道命运给予因果回报。
//   正向(渡/缘) → 善意彩蛋 + 额外经文碎片；逆向前置(逆) → 专属逆剧情 + 专属材料。
NDX.ECHO_POS_MAT = '经文碎片';                        // 正向伏笔回报材料
NDX.ECHO_NEG_MATS = ['人参根', '六耳毛'];             // 逆向前置回报材料（按 earlyDiff 轮转）

NDX.echoPayoff = function (s, diff) {
  if (diff == null || diff < 41 || diff > 80) return null;
  const earlyDiff = diff - 40;
  const log = (s.trialFateLog || []).find((t) => t.diff === earlyDiff);
  if (!log || !log.fate) return null;
  const title = log.title || ('第' + earlyDiff + '难');
  if (log.fate === '渡' || log.fate === '缘') {
    return {
      kind: 'good',
      mat: NDX.ECHO_POS_MAT,
      text: `【伏笔回访·善】第${earlyDiff}难「${title}」你曾行渡/缘之善，因果在此回响——故人留一份善意彩蛋，并赠你一份经文碎片。`,
    };
  }
  if (log.fate === '逆') {
    const mat = NDX.ECHO_NEG_MATS[(earlyDiff - 1) % NDX.ECHO_NEG_MATS.length];
    return {
      kind: 'ni',
      mat: mat,
      text: `【伏笔回访·逆】第${earlyDiff}难「${title}」你曾逆道而行，暗线在此收束——一段专属逆剧情浮现，并落下专属材料「${mat}」。`,
    };
  }
  return null;
};

// 转职解锁进度（结算大屏用）：列出本英雄所有隐藏职业的满足/缺失状态。
// 返回 [{ job, ok, missing, held, missingHeld }]，ok 表示已达成转职条件。
NDX.jobProgressFor = function (heroId, s) {
  const cfg = NDX.HIDDEN_JOBS && NDX.HIDDEN_JOBS[heroId];
  if (!cfg || !cfg.jobs) return null;
  const held = s.flags.hiddenJobReady || [];
  const seals = s.hSeals || [];
  const jobList = Object.keys(cfg.jobs);
  return jobList.map((job) => {
    const cond = cfg.jobs[job];
    const missingSeals = (cond.requireSeals || []).filter((sl) => !seals.includes(sl));
    const missingTrials = NDX.hiddenTrialsMet(heroId, s.trialsPassed).missing;
    const missingHeld = (cond.requireHeld || []).filter((h) => !held.includes(h));
    const ok = (cond.requireSeals || []).every((sl) => seals.includes(sl)) &&
      missingTrials.length === 0 &&
      (cond.requireHeld || []).every((h) => held.includes(h));
    return {
      job: job,
      ok: ok,
      name: cond.name,
      missingSeals: missingSeals,
      missingTrials: missingTrials,
      missingHeld: missingHeld
    };
  });
};

