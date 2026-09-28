// ============================================================================
// trials_ch8.js — 《逆道西行》八十一难 · 第 8 章（难 65–75，骨架 v1.19 对齐）
// 拆分依据：骨架 v1.19 九章边界（合入式，保持 NDX.TRIAL_LIB 单对象接口）
// 内容来源：《第八章_比丘国之劫_65-75难_新版.md》(v3.0 终版 · 骨架 v1.19 对齐)
// 结构：65-66 比丘国·小孩心肝(复合·2难合并·×2) / 67-69 无底洞·金鼻白毛老鼠精(复合·3难合并·×3) /
//       70 灭法国·杀僧 / 71 南山大王·分瓣梅花计 / 72 凤仙郡·求雨 /
//       73-75 玉华州·黄狮精九灵元圣(复合·3难合并·×3 · 章末Boss)。
// act 字段由 trials_return.js 的 normalizeTrialLibAct() 按 ACT_RANGES 统一派生；此处按章标注 8 仅供阅读。
// 通用机制（详见 doc 〇段）：唐僧慈悲(凡人/复合进入段，-80%)、人形态减伤·唐僧斥语(规则5，
//   65-66 白鹿精/白面狐狸、67-69 老鼠精、73-75 九灵元圣首态)、食人红线(65-66 逆/缘禁用)、
//   链式门控(71 虎皮裙 Lv.3)、配件×法宝双用·不消耗(避火珠)、逆随从·人形态、六道产出签名。
// ============================================================================
NDX.TRIAL_LIB = Object.assign(NDX.TRIAL_LIB || {},
{
  // ===== 65-66 比丘国·小孩心肝（复合劫难，2难合并，系数×2）=====
  65: {
    id: 65,
    name: '比丘国·鹅笼哭声',
    act: 8,
    type: 'fight',
    icon: '🦌',
    portrait: '白鹿精',
    fate: '战',
    echo: '战/渡/隐/夺(4道)；缘·逆因食人红线禁用；白劫印·蓝(复合)',
    branchKey: 'n65_biqiu',
    dark: '比丘国国王病了，国丈白鹿精说，要用一千一百一十一个小孩的心肝做药引。国王信了，把全城小孩抓起来，关进鹅笼，摆在街口。你进城，到处是鹅笼和孩子的哭声；老妇说，孩子的爹娘都哭死了。这白鹿精是寿星的坐骑，白面狐狸是它的情人，两个都是人的模样站在殿上，你一动兵器，唐僧便飘出斥语，你的力就散了八成，得用照妖镜照破，或唤土地山神作证。这一难不是要你降妖，是要你回答：当治病的代价是一千一百一十一个孩子的心肝，你还治不治这个病。',
    intro: '你进城，满街鹅笼与孩童哭声。老妇说小孩父母都已哭死——当"治病"的代价是"小孩的心肝"，你还治不治。',
    options: [
      { key: '战', label: '直接击败白鹿精与白面狐狸', fate: '战', effect: { alignEvil: 10, ti: { atk: 9, hp: 40 }, treasure: 'equip_biqiu' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n65_biqiu:zhan', consequence: '斗了三天三夜，寿星来收白鹿精，白面狐狸被你打死，所有小孩得救' },
      { key: '渡', label: '变身诱敌，请寿星收伏白鹿精', fate: '渡', effect: { material: '寿星蟠桃核',  alignGood: 16 }, setFlag: 'n65_biqiu:du', consequence: '变作唐僧模样被擒，大殿上用计露出马脚；寿星收走白鹿精，白面狐狸被你打死，小孩得救，收走白鹿精；寿星赐【寿星蟠桃核】' },
      { key: '隐', label: '用计智取，不与其硬拼', fate: '隐', effect: { alignGood: 10, eva: 9, treasure: 'equip_biqiu_yin' }, setFlag: 'n65_biqiu:yin', consequence: '变作唐僧诱敌，用计让白鹿精自露马脚，不硬拼，白面狐狸仍被击死，小孩得救' },
      { key: '夺', label: '击败后夺取白鹿精的角', fate: '夺', effect: { alignEvil: 16, gear: 'equip_biqiu', treasure: 'tre_bailujiao' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n65_biqiu:duo', consequence: '见宝起意，夺白鹿精的角为法宝；寿星不肯，你击败寿星夺得此宝——并得【白鹿妖甲】' }
    ]
  },
  66: {
    id: 66,
    name: '比丘国·小儿得救',
    act: 8,
    type: 'event',
    icon: '🕊️',
    fate: '渡',
    echo: '复合第2难·比丘国统一结算(依65抉择结算)；蓝劫印',
    branchKey: 'n65_biqiu',
    dark: '白鹿精与白面狐狸都被逼到绝境。你可以与它们死战三天三夜，把那头白面狐狸打死；可以请寿星来收白鹿精——毕竟是他的坐骑；也可以变作唐僧的样子让它抓了去，在大殿上用计诱它自己露出马脚，不硬碰；甚至趁它落败夺下那支能治百病的角。鹅笼一只只打开，一千一百一十一个孩子扑回父母怀里，国王的病也好了。你站在城门口，看着孩子跑散，忽然想起它们关在笼里的那些天，没有人替它们求过一句情——除了这条取经路上多管闲事的你。',
    intro: '比丘国劫难收尾：所有小孩得救，国王病愈，国丈伏法。',
    options: [
      { key: '战', label: '以力镇妖，护下满城孩童', fate: '战', effect: { alignEvil: 3, ti: { atk: 4 } }, requireFlag: 'n65_biqiu:zhan', tip: '【小孩的守护者】击败比丘国白鹿精' },
      { key: '渡', label: '寿星收伏，不伤性命', fate: '渡', effect: { alignGood: 4 }, requireFlag: 'n65_biqiu:du', tip: '【小孩的点化者】请来寿星收伏白鹿精' },
      { key: '隐', label: '用计全身而退', fate: '隐', effect: { alignGood: 2, eva: 4 }, requireFlag: 'n65_biqiu:yin', tip: '【小孩的智取者】用计对付比丘国白鹿精' },
      { key: '夺', label: '夺角而去，留满城清平', fate: '夺', effect: { alignEvil: 4, gold: 10 }, requireFlag: 'n65_biqiu:duo', tip: '【白鹿精的角入手】夺得白鹿精的角' }
    ],
    branches: {
      zhan: { intro: '白面狐狸横尸殿前，白鹿精被寿星套上缰绳拖回天庭。满城父母抱着孩子跪谢，你只望向空了的鹅笼。' },
      du: { intro: '寿星拂尘一挥，白鹿精现出本相乖乖伏罪；白面狐狸已被你了结，小儿尽数归家。' },
      yin: { intro: '你用计让白鹿精当庭出丑，寿星循迹而来收妖；白面狐狸殒命，鹅笼皆空。' },
      duo: { intro: '你夺得白鹿精的角，寿星怒而战，终被你击退。比丘国自此无妖，只剩满城哭过又笑的人。' }
    }
  },

  // ===== 67-69 无底洞·金鼻白毛老鼠精（复合劫难，3难合并，系数×3）=====
  67: {
    id: 67,
    name: '黑松林·救怪',
    act: 8,
    type: 'event',
    icon: '🌲',
    fate: '渡',
    echo: '无底洞阶段1·松林救怪(剧情推进至68)；缘→无底情丝',
    branchKey: 'n67_wudidong',
    dark: '黑松林里，一个女子被绑在树上，自称被强盗掳来，求唐僧救命。悟空火眼一照，说那是妖；唐僧不听，只管解绳。那女子是金鼻白毛老鼠精——曾在灵山偷吃如来的香花宝烛，如来饶了她性命，她拜李天王做了义女。你救了她，她感激你，要把这一路的恩，用成亲来还。悟空识破，唐僧不听，这一根绳你解不解，往后几难都由它起。你提着那根绳站在林子里，忽然明白：慈悲有时候不是解绑，是把绳再系紧一点。',
    intro: '唐僧救下被绑女子，带她往镇海禅林寺。',
    options: [
      { key: '渡', label: '慈悲解绑，携怪同往禅林寺', fate: '渡', effect: { alignGood: 4 }, setFlag: 'n67_wudidong:save', consequence: '唐僧救下老鼠精，带往镇海禅林寺' }
    ]
  },
  68: {
    id: 68,
    name: '僧房·卧病',
    act: 8,
    type: 'event',
    icon: '🛏️',
    fate: '渡',
    echo: '无底洞阶段2·僧房卧病(剧情推进至69最终抉择)',
    branchKey: 'n67_wudidong',
    dark: '到了镇海禅林寺，唐僧病倒了，三天三夜不省人事，连水都咽不进。老鼠精守在病榻前，一勺一勺喂药；她说她记着那根绳的情，要留下来照顾到师父痊愈。病好后她开口，说要以身相许。唐僧不从，她便将人掳进了无底洞。你在僧房里看着那张空榻，忽然分不清：这一场病是真，还是她等的一个由头；那一勺一勺的药，是恩，还是一笔等着被还的账。她不是要你的命，是要你认下这份恩情。',
    intro: '唐僧卧病，老鼠精掳师入无底洞。',
    options: [
      { key: '渡', label: '托病守戒，终被掳入无底洞', fate: '渡', effect: { alignGood: 2 }, setFlag: 'n67_wudidong:sick', consequence: '唐僧不从成亲，被老鼠精擒入无底洞，悟空三探寻师' }
    ]
  },
  69: {
    id: 69,
    name: '无底洞·最终抉择',
    act: 8,
    type: 'fight',
    icon: '🐭',
    portrait: '金鼻白毛老鼠精',
    fate: '战',
    echo: '战/渡/隐/缘/逆/夺(6道全集)；缘→无底情丝(八戒本命)+宠物；蓝劫印·复合×3',
    branchKey: 'n67_wudidong',
    dark: '无底洞深不见底，老鼠精在自家地界上占着地利，攻击比在外面狠两成；她以女子模样现身时，唐僧的斥语压着你的手，只有逼出她本相，这一战才算真打。她终是被你逼到尽头。你可以打死她，可以请李天王和哪吒来收这个义女，可以绕开黑松林当作没见过，也可以点化她——恩情不是要成亲，是要修行；或者趁她落败夺下那盏能迷住仙佛的香花宝烛。这一难问的从来不是妖，是那一份拿命换来的恩，你到底怎么还。',
    intro: '悟空请来李天王与哪吒，你面临无底洞最终抉择。',
    options: [
      { key: '战', label: '直接打死老鼠精', fate: '战', effect: { alignEvil: 15, ti: { atk: 10, hp: 45 }, treasure: 'equip_wudidong' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n67_wudidong:zhan', consequence: '与老鼠精大战三天三夜，将其打死，唐僧得救，无底洞再无妖' },
      { key: '渡', label: '请李天王收伏老鼠精', fate: '渡', effect: { material: '玲珑塔铃',  alignGood: 24 }, setFlag: 'n67_wudidong:du', consequence: '请李天王与哪吒收伏，带它回天庭修行，唐僧得救，带它回天庭修行；李天王赐【玲珑塔铃】' },
      { key: '隐', label: '绕开黑松林，不取其命', fate: '隐', effect: { alignGood: 15, eva: 9, treasure: 'equip_wudidong_yin' }, setFlag: 'n67_wudidong:yin', consequence: '带徒绕后山西行，老鼠精照旧占洞抓人，无战斗仅得劫印' },
      { key: '缘', label: '点化老鼠精，收为随行', fate: '缘', effect: { alignGood: 30, follower: 'diyongfuren', material: '无底情丝' }, setFlag: 'n67_wudidong:yuan', consequence: '点化老鼠精：它跪地拜师，成宠物随行，赠你无底情丝（六根红绳⑥·八戒本命）' },
      { key: '逆', label: '纯实力折服，收为逆道随从', fate: '逆', ni: true, effect: { alignEvil: 15, niSutra: 'ni_wudidong', ally: 'laoshu_jing_ren' }, fight: true, requireNoTreasure: 'tre_zhaoyaojing', setFlag: 'n67_wudidong:ni', consequence: '未请救兵、未用法宝纯凭实力击败；老鼠精跪叩：随你反抗西天（逆道随从·人形态）' },
      { key: '夺', label: '夺取香花宝烛', fate: '夺', effect: { alignEvil: 24, gear: 'equip_wudidong', treasure: 'tre_xianghua_baozhu' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n67_wudidong:duo', consequence: '击败后夺其香花宝烛为法宝，老鼠精法力尽失，你带宝西行——并得【无底洞妖铠】' }
    ]
  },

  // ===== 70 灭法国·杀僧（单劫难）=====
  70: {
    id: 70,
    name: '灭法国·剃发',
    act: 8,
    type: 'fight',
    icon: '⚔️',
    portrait: '灭法国国王',
    fate: '渡',
    echo: '战/渡/隐/缘/逆/夺(6道)；渡→灭法古舍利(H3·隐藏池)；缘→灭法国国王随从；蓝劫印',
    dark: '灭法国国王发愿要杀一万个和尚。你进城，到处是和尚的尸体和血；老妇说，已杀了九千九百九十六个，还差四个——你们师徒，正好凑齐。国王的军队人多势众，却都是凡人，唐僧慈悲，不忍对凡人下手，你的力便先减了八成。夜里你潜入王宫，把国王、王后、文武百官的头发都剃了。第二天满朝醒来，摸着光头，才发现自己成了和尚。国王醒觉，不再杀僧，改国名为钦法国。你站在殿上，看着一地光头，忽然想问：他们是真的悔了，还是只是怕了。',
    intro: '你入灭法国，遍地为僧尸。以计谋或武力，让国王不再杀僧。',
    options: [
      { key: '战', label: '直接击败国王军队', fate: '战', effect: { alignEvil: 5, ti: { atk: 9, hp: 42 }, treasure: 'equip_miefa' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n70_miefa:zhan', consequence: '斗了三天三夜赢下，国王跪服改国号钦法国，不再杀僧' },
      { key: '渡', label: '夜剃王发，度其回头', fate: '渡', effect: { alignGood: 8, material: '灭法古舍利' }, setFlag: 'n70_miefa:du', consequence: '潜入王宫剃光国王、王后、百官头发，国王醒悟"和尚也是人"，改国号钦法国；得灭法古舍利(H3·隐藏第7配件池)' },
      { key: '隐', label: '趁夜剃发，不与军硬拼', fate: '隐', effect: { alignGood: 5, eva: 9, treasure: 'equip_miefa_yin' }, setFlag: 'n70_miefa:yin', consequence: '夜剃王发，国王醒悟改国号，用计智取不杀生' },
      { key: '缘', label: '点化国王，收为随从', fate: '缘', effect: { alignGood: 10, ally: 'miefa_wang' }, setFlag: 'n70_miefa:yuan', consequence: '点化国王：他跪地拜师，愿亲随西行护持取经（灭法古舍利归渡，缘线改产此随从）' },
      { key: '逆', label: '纯实力折服，收为逆道随从', fate: '逆', ni: true, effect: { alignEvil: 5, niSutra: 'ni_miefa', ally: 'miefa_wang_ren' }, fight: true, setFlag: 'n70_miefa:ni', consequence: '未请救兵、未用法宝纯凭实力击败王军；国王跪叩：随你反抗西天（逆道随从·人形态）' },
      { key: '夺', label: '夺取国王的王冠', fate: '夺', effect: { alignEvil: 8, gear: 'equip_miefa', treasure: 'tre_wangguan' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n70_miefa:duo', consequence: '击败后夺王冠为法宝，可号令三军——并得【钦法国王袍】' }
    ]
  },

  // ===== 71 南山大王·分瓣梅花计（单劫难）=====
  71: {
    id: 71,
    name: '南山大王·分瓣梅花',
    act: 8,
    type: 'fight',
    icon: '🐆',
    portrait: '南山大王',
    fate: '渡',
    echo: '战/渡/隐/缘/逆/夺(6道)；渡→分瓣梅花(僧履)；隐→隐雾潜影(白马本命)；链式门控虎皮裙Lv.3；蓝劫印',
    dark: '南山大王是艾叶花皮豹子精，在隐雾山占山为王，用一手分瓣梅花计，把你和三个徒弟生生拆开，把你掳走。悟空八戒沙僧来救，法力都不缺，却被这道计耍得团团转——它不跟你比力气，只跟你比谁先看破。后来悟空混进山去，破了这道计，才把这豹子精打死。这一难还压着一条旧线：你身上若没有前几难扒皮做裙留下的那条虎皮裙，这里的豹纹虎皮便永远灰着，穿不上。你站在隐雾山门口，看着散去的雾气，忽然明白：最厉害的不是力气，是让你连对手在哪都分不清。',
    intro: '你被救出，立于隐雾山口。以力、以计或点化，了结分瓣梅花计。',
    options: [
      { key: '战', label: '直接击败南山大王', fate: '战', effect: { alignEvil: 5, ti: { atk: 9, hp: 42 }, treasure: 'equip_nanshan' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n71_nanshan:zhan', consequence: '斗了三天三夜赢下，打死南山大王，隐雾山再无妖' },
      { key: '渡', label: '混入山寨，点化南山大王', fate: '渡', effect: { alignGood: 8, material: '分瓣梅花' }, setFlag: 'n71_nanshan:du', consequence: '变小妖混进隐雾山，破其计、点化之，得分瓣梅花（六纤⑤·僧履配件）' },
      { key: '隐', label: '混入山寨，用计破梅花计', fate: '隐', effect: { alignGood: 5, eva: 9, material: '隐雾潜影' }, setFlag: 'n71_nanshan:yin', consequence: '变小妖用计破梅花计，打死南山大王，得隐雾潜影（六缕幽影⑥·白马本命）' },
      { key: '缘', label: '点化南山大王，收为随行', fate: '缘', effect: { alignGood: 10, follower: 'nanshandawang' }, setFlag: 'n71_nanshan:yuan', consequence: '点化南山大王：它跪地拜师，成宠物随行（战斗中可施分瓣梅花计分敌）' },
      { key: '逆', label: '纯实力折服，收为逆道随从', fate: '逆', ni: true, effect: { alignEvil: 5, niSutra: 'ni_nanshan', ally: 'nanshan_dawang_ren' }, fight: true, setFlag: 'n71_nanshan:ni', consequence: '未请救兵、未用法宝纯凭实力击败；它跪叩：随你反抗西天（逆道随从·人形态）' },
      { key: '夺', label: '夺取分瓣梅花计', fate: '夺', effect: { alignEvil: 8, gear: 'equip_nanshan', treasure: 'tre_fenban_meihua_ji' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n71_nanshan:duo', consequence: '击败后夺分瓣梅花计为法宝，可分开敌方全体——并得【隐雾山大王甲】' }
    ]
  },

  // ===== 72 凤仙郡·求雨（单劫难，仅 渡/隐/缘）=====
  72: {
    id: 72,
    name: '凤仙郡·求雨',
    act: 8,
    type: 'event',
    icon: '🌧️',
    portrait: '郡侯',
    fate: '渡',
    echo: '渡/隐/缘(3道·无战/夺/逆)；渡→玉帝皂纛(僧冠)；缘→四海龙王随从；蓝劫印',
    dark: '凤仙郡大旱三年，滴雨未下。你进城，到处是干裂的土地和逃荒的人；老妇说，郡侯得罪了上天，天罚大旱三年。这一难不是要你降妖，是要你回答：当求雨的代价是认错，你还认不认。你上天庭问玉帝，玉帝说那郡侯推了供桌、把斋天的素供喂了狗、还口出秽言；要下雨也容易——须等鸡啄完米山、狗舔完面山、灯焰烧断金锁，等到郡侯真心认错。你站在干裂的田里，天上那三样东西慢慢地动，比人的一辈子还慢：原来上天罚的不是旱，是那句不肯低头的话。',
    intro: '你上天庭问玉帝，回凤仙郡让郡侯认错，或另寻雨路。',
    options: [
      { key: '渡', label: '让郡侯真心认错，玉帝下雨', fate: '渡', effect: { alignGood: 8, material: '玉帝皂纛' }, setFlag: 'n72_fengxian:du', consequence: '郡侯真心认错，米山面山金锁尽，玉帝降雨；得玉帝皂纛（六赐⑥·僧冠配件）' },
      { key: '隐', label: '用法术直接下雨，不告郡侯', fate: '隐', effect: { alignGood: 5, eva: 9, treasure: 'equip_fengxian_yin' }, setFlag: 'n72_fengxian:yin', consequence: '施术降雨却不言明，凤仙郡终得甘霖，郡侯不知缘由' },
      { key: '缘', label: '请四海龙王下雨', fate: '缘', effect: { alignGood: 10, ally: 'sihai_longwang' }, setFlag: 'n72_fengxian:yuan', consequence: '凭四海龙王好感/车迟国求雨旧缘(钩子)请龙王降雨；龙王成随从（战斗中可召唤雨水）' }
    ]
  },

  // ===== 73-75 玉华州·黄狮精九灵元圣（复合劫难，3难合并，系数×3，章末Boss）=====
  73: {
    id: 73,
    name: '豹头山·夺兵器',
    act: 8,
    type: 'fight',
    icon: '🦁',
    portrait: '黄狮精',
    fate: '战',
    echo: '玉华州阶段1·豹头山夺兵器(力战/用计/点化三分流)；渡→黄狮精随行弟子',
    branchKey: 'n73_baotou',
    dark: '玉华州三王子拜悟空、八戒、沙僧为师。黄狮精是九灵元圣的孙儿，在豹头山虎口洞偷了金箍棒、九齿钉耙、降妖宝杖，要办一席钉耙宴。你进山，小妖正敲锣打鼓地庆祝偷来的兵器。你可以直接与黄狮精死战三天三夜，把它打死，夺回兵器；可以变作小妖混进去，破了这席宴，用计把兵器拿回来；也可以点化它——五百年前你也偷过金箍棒，后来才明白，真兵器是靠自己本事赢来的。这一难问的从不是那三件兵器，是当庆祝的代价是偷来的东西，你还庆不庆祝。',
    intro: '你入豹头山，面对办钉耙宴的黄狮精。',
    options: [
      { key: '战', label: '以力降妖，直接击败黄狮精', fate: '战', effect: { alignEvil: 3, ti: { atk: 6, hp: 30 }, treasure: 'tre_huangshi_pi' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n73_baotou:zhan', consequence: '斗三天三夜赢下，打死黄狮精夺回兵器；九灵元圣将因孙儿死而怒，战斗难度增' },
      { key: '隐', label: '混入山寨，用计夺回兵器', fate: '隐', effect: { alignGood: 4, eva: 6, treasure: 'tre_dingbapyan_qingjian' }, setFlag: 'n73_baotou:yin', consequence: '变小妖混入，用计夺回兵器并破宴；九灵元圣因你用计而敬佩，难度降' },
      { key: '渡', label: '点化黄狮精', fate: '渡', effect: { alignGood: 6, ally: 'huangshi_jing' }, setFlag: 'n73_baotou:du', consequence: '以自身也曾偷棒点化之；黄狮精弃妖从善还兵器，在豹头山修行，成随行弟子（九灵元圣感动，难度降）' }
    ]
  },
  74: {
    id: 74,
    name: '玉华州·九灵报仇',
    act: 8,
    type: 'fight',
    icon: '🦁',
    portrait: '九灵元圣',
    fate: '战',
    echo: '玉华州阶段2·九灵元圣报仇(首态人形→唐僧斥语-80%；过渡至75终局)',
    branchKey: 'n73_baotou',
    dark: '九灵元圣是太乙救苦天尊的坐骑，为孙儿黄狮精报仇，把你擒住。它法力高强，九颗头一齐低垂时，连山都发抖。它的首态是元圣老叟的模样，一身人间老人的和气，唐僧的斥语一飘，你便先减了八成力；只有照破它的本相，逼出那个九头狮子，这一场才算数。第二态是九头狮子本相，第三态是断岳法相——撼山裂地的粒子层，得先断它那九灵的护体。你在它掌心里，抬头只看见九张脸，忽然想：它替孙儿报仇的心，和你替徒弟挡刀的心，是不是同一样东西。',
    intro: '九灵元圣擒住你，三态之战开场。',
    options: [
      { key: '战', label: '迎战九灵元圣', fate: '战', effect: { alignEvil: 3 }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n74_jiuying:ying', consequence: '挣脱束缚，迎战九灵元圣，进入终局抉择' }
    ]
  },
  75: {
    id: 75,
    name: '玉华州·九灵元圣',
    act: 8,
    type: 'boss',
    icon: '👑',
    portrait: '九灵元圣',
    fate: '战',
    echo: '章末Boss·三态(人形→本相九头狮→断岳法相·粒子层)；战→黄狮妖丹(沙僧本命)；渡→竹节竹衣(僧履)；夺→鼻根·鼻嗅爱(悟空本命)+九灵之力；缘/逆随从；红劫印',
    breakWith: 'zhaoyao',
    branchKey: 'n75_jiu',
    dark: '九灵元圣终是力竭伏地，九头低垂。你可以把它打死，可以请太乙救苦天尊来收这头坐骑，可以用计从洞府里脱身，可以点化它——报仇不是杀人，是渡人；也可以趁它落败，夺下那九灵之力：能随机放出九种法术的那点精华。这一战从头到尾，它都是替孙儿出头的那一个。你收下了它，或者放走了它，或者把它的九灵掏空，然后继续西行。九灵元圣的故事到这里就完了，但你要带走的那一件，得你自己挑。',
    intro: '玉华州终局：以力、请神、用计、点化、收服或夺宝，了结九灵元圣。三态 Boss：人形→本相→断岳法相。',
    options: [
      { key: '战', label: '直接击败九灵元圣', fate: '战', effect: { alignEvil: 15, ti: { atk: 10, hp: 48 }, material: '黄狮妖丹' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n75_jiu:zhan', consequence: '未请太乙救苦天尊，以力降之；九灵力竭伏地，你被救出（得黄狮妖丹·六丹⑥·沙僧本命）' },
      { key: '渡', label: '请太乙救苦天尊收伏', fate: '渡', effect: { alignGood: 24, material: '竹节竹衣' }, setFlag: 'n75_jiu:du', consequence: '请太乙救苦天尊收伏，带它回天庭；得竹节竹衣（六纤⑥·僧履配件）' },
      { key: '隐', label: '用计逃脱，不硬碰', fate: '隐', effect: { alignGood: 15, eva: 9, treasure: 'equip_yuhua_yin' }, setFlag: 'n75_jiu:yin', consequence: '变小妖混入洞府用计逃脱，不与九灵硬碰，你被救出' },
      { key: '缘', label: '点化九灵元圣，收为随行', fate: '缘', effect: { alignGood: 30, follower: 'ni_jiuling' }, setFlag: 'n75_jiu:yuan', consequence: '点化九灵：它跪地拜师，成宠物随行，战斗中可释九灵之力' },
      { key: '逆', label: '纯实力折服，收为逆道随从', fate: '逆', ni: true, effect: { alignEvil: 15, niSutra: 'ni_yuhua', ally: 'jiuling_yuansheng_ren' }, fight: true, requireNoTreasure: 'tre_zhaoyaojing', setFlag: 'n75_jiu:ni', consequence: '未请救兵、未用法宝纯凭实力击败；它跪叩：随你反抗西天（逆道随从·人形态）' },
      { key: '夺', label: '夺取九灵之力', fate: '夺', effect: { alignEvil: 24, material: '鼻根·鼻嗅爱' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n75_jiu:duo', consequence: '击败后夺九灵之力为法宝，法力尽失；得鼻根·鼻嗅爱（六根⑥·悟空本命）' }
    ],
    // 章末 Boss（九灵元圣）产出＝**红劫印**，由结算系统按章发放（骨架 v1.6:70），不走掉落通道。
    //   2026-09-28 删除：原 `treasure:{id:'jiuling_sheli'}` 全库无实体（劫印档位被误写成掉落物）。
    hidden: { hero: 'wukong', cond: '夺 + 未请救兵', job: '悟空的嗅', hint: '夺九灵之力、纯凭实力不借法宝——以鼻嗅真，方得本命', desc: '鼻根·鼻嗅爱觉醒（悟空本命·六根⑥）' }
  }
});
