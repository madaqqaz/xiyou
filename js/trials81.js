// ============================================================================
//  八十一难数据库（劫难剧情库 + 难名表）
//  独立维护：本文件包含全部 81 难的剧情与命名数据。
//  数据表：NDX.TRIAL_LIB（1~81 难剧情条目：name/act/type/icon/dark/intro/options/treasure/hidden）
//          NDX.TRIAL_BOSS（难号 1~81 → 登场敌方/劫难名 映射）
//  服务函数：NDX.trialBossName（按难号取登场敌方名，回退用劫难名本身）
//  2026-09-01 原著地理重排：难号按 17 地区原著地理重新编号；原 57-80 返程段移至 NDX.RETURN_TRIALS（隐藏保留·后续开发）。
//  修改某一难的名称/章节(act)/类型(type)/黑暗独白(dark)/选项(options)/隐藏职(hidden)，
//  直接编辑 NDX.TRIAL_LIB 中对应 id 即可；修改战斗中登场的敌名，编辑 NDX.TRIAL_BOSS。
// ============================================================================

NDX.TRIAL_LIB = {
  1: { id: 1, name: '金蝉遭贬', act: 1, type: 'story', icon: '✦',
    portrait: '灵吉菩萨',
    fate: '渡', echo: '逆线→弃经金蝉(取经人)种子；二周目转生既定伏笔',
    // V8.27 follow-up：三段合并为一页，去掉「第一段｜金光」等分段提示词，让叙事一气呵成。
    // V8.33 难1文案重写：初始即「灵山遭贬·轮回道口」当下场景，接引使者持鞭拦路——去掉旧「出长安第一夜·破庙入梦」结构（送行事件已后移，出长安不再发生于首难前）。
    dark: '灵山讲经台上，你问如来："大乘度己，小乘度人——若经书本身便是枷锁，度的是谁？"满座无声。上座执事合掌，袖中账簿滑出一角，你瞥见了上面的字。法判你"轻慢"，贬你十世轮回。你被贬下界，接引使者持鞭拦在轮回道口，皮笑肉不笑——"金蝉子投的胎，还得爷送。"可你下界时，天庭仍给你留了"取经人"的牌子——没人敢真断了这条香火。你摸了摸自己的脸，确认这世还是这世。前世那句问话还在耳边，你把它收进行囊，抬脚往西。',
    intro: '灵山云端，金蝉子一句问话触怒灵山法统，被贬下凡十世轮回。轮回道口，接引使者持鞭拦路——这第一难，先识六道、习战斗。', sixdaoSelect: true,
    options: [
      // —— V8.58 六道直选：取消顺命/争胜/避世三分组，六道长横条直接展示 ——
      { key: '渡', label: '【渡】双手捧钵，承佛之命', fate: '渡',
        tip: '双手捧钵——成佛之命。你将踏上渡道，观音好感结缘；得「紫金钵盂·虚」基座，善+10',
        guanyinTip: '观音菩萨：渡者，慈悲顺命，渡己渡人。诵经可渡敌，钵盂可承佛之命——此道仁厚绵长，然杀伐不足，遇强魔时需借法宝之力。',
        longDesc: '渡道 · 慈悲顺命 · 诵经渡敌 · 观音结缘 · 紫金钵盂',
        effect: { alignGood: 10, favor: '观音', material: '紫金钵盂·虚' } },
      { key: '缘', label: '【缘】指尖触钵，惜众生缘', fate: '缘',
        tip: '指尖触钵——惜众生缘。你将踏上缘道；得「紫金钵盂·虚」基座（不结缘观音），善+8',
        guanyinTip: '观音菩萨：缘者，广结善缘，随缘而安。防御加身，肉生成圣——此道稳如磐石，然进取不足，需借劫印突破瓶颈。',
        longDesc: '缘道 · 广结善缘 · 防御加身 · 肉生成圣 · 稳如磐石',
        effect: { alignGood: 8, material: '紫金钵盂·虚' } },
      { key: '战', label: '【战】夺鞭立威，驱而不伤', fate: '战', noFight: true,
        tip: '夺鞭立威——驱而不伤。你将走上战道，恶+8，落定首枚战印',
        guanyinTip: '观音菩萨：战者，以力破局，杀伐果断。以杀止杀，以力破法——此道威猛却折寿，每战需速战速决，久战必亏。',
        longDesc: '战道 · 以力破局 · 杀伐果断 · 以杀止杀 · 威猛折寿',
        effect: { alignEvil: 8 } },
      { key: '夺', label: '【夺】抽走鞭梢，掠走物证', fate: '夺', noFight: true,
        tip: '掠走物证——你将走上夺道；得「青驴鞭影」兵刃 1 件，恶+10',
        guanyinTip: '观音菩萨：夺者，巧取豪夺，利益至上。夺取宝物，万宝附体——此道富贵险中求，然失道寡助，心魔易涨，需持正念压之。',
        longDesc: '夺道 · 巧取豪夺 · 万宝附体 · 富贵险求 · 心魔易涨',
        effect: { alignEvil: 10, material: '青驴鞭影', equipPick: 1, slot: 'weapon' } },
      { key: '隐', label: '【隐】任碎石盖身，避世无痕', fate: '隐',
        tip: '任碎石盖身——避世无痕。你将走上隐道；闪避 +8、善+6、心魔不涨',
        guanyinTip: '观音菩萨：隐者，避世潜行，明哲保身。万物成空，无道无我——此道身法卓绝，然正面交锋乏力，需借闪避与暴击制敌。',
        longDesc: '隐道 · 避世潜行 · 明哲保身 · 身法卓绝 · 闪避暴击',
        effect: { alignGood: 6, eva: 8 } },
      { key: '逆', label: '【逆】我问一句：账簿上我值几文', fate: '逆',
        tip: '我问一句——你将踏上逆道；触发「直问天条」经文洞察，恶+6',
        guanyinTip: '观音菩萨：逆者，逆天改命，不走寻常。我命由我，普度众人——此道最为凶险，须先炼成一世正果（完美通关）方得入此道，然一旦入道，天地皆为之侧目。',
        longDesc: '逆道 · 逆天改命 · 我命由我 · 最为凶险 · 天地侧目',
        effect: { alignEvil: 6, sutraInsight: '直问天条' } },
    ],
    hidden: { hero: 'tangseng', cond: '逆 + 紫金钵', job: '弃经金蝉', desc: '愿伤+30%，但每战恶+5' },
    // 序章叙事劫难也应有收获：金蝉子前世遗泽——金蝉舍利（温和续命法宝，非战斗回约50%气血，无本心代价）
    treasure: { id: 'jinchan', type: 'treasure', note: '金蝉舍利·序章机缘（原著：金蝉子十世余泽）' } },
  2: { id: 2, name: '出胎几杀', act: 1, type: 'fight', icon: '⚔',
    portrait: '刘洪',
    fate: '战', echo: '',
    // V8.33 去掉「第一段｜金光」等分段提示词（与难1 V8.27 统一，三段叙事一气呵成）
    dark: '襁褓之中，你借这具不足满月的身睁眼。江声入耳，你合眼，忽入一梦——出生这一夜，你的状元父亲接旨赴任——灵山连"爹"都替你选好了：一个注定活不过上任途中、也没活过你满月的宿世故人。你睁眼，见母亲殷温娇跪在血水里；窗外一个黑衣官差领着水卒，正一道一道数她身上那道帘。他腰牌上，刻着灵山的莲花纹。\n' +
      '刘洪不是来抢位子的，是来"验货"的。货单上写得分明：金蝉子 · 第一世，该死于满月。他奉命，让你死在难簿记该记的那一页。可他漏算了一样——你的娘，是个甘愿把整条命押上，也要跟你换一个"活"字的人。\n' +
      '木盆浮在水上，你娘把你放进江里。她不哭，她哭着求的只有三个字——"别回头"。江流暗涌，岸上仪仗敲锣打鼓，像在送一具货。你忽然懂了：这世上的爹不止陈光蕊一个人；牌上那朵莲，也从不只挂在他一个人的腰上。梦醒时，你正攥着那领袈裟，指节发白。你摸了摸鬓角，那里已添一缕霜白——西行路上，每历一难，寿数便短一分；寿尽之日，便是大限坐化之时。此身有尽，须惜命而行。',
    intro: '襁褓之中，江声入耳。刘洪水卒破府，刀光漫过廊下，母亲殷温娇将你护在怀中。满月未至，杀机先至——这一夜，你借这具不足满月的身，走你十世里的第一笔。战或渡，随你。',
    options: [
      { key: '战', label: '【战】护母突围，夺路而走', fate: '战', fight: true, battleFlags: { openingMomentum: 1 },
        effect: { alignEvil: 8 } },
      { key: '渡', label: '【渡】随江流漂走，顺命入劫', fate: '渡',
        effect: { alignGood: 10 } },
      { key: '隐', label: '【隐】藏入棺椁，权且避世', fate: '隐', noDao: true,
        effect: { alignGood: 6 } }
    ],
    // 第2难必掉袈裟基座（取经人只走袈裟单一路线：袈裟胚→+金线/佛纹→锦襕袈裟）
    treasure: { id: 'ts_robe_base', type: 'armor', hp: 90, dr: 0.05, mdef: 0.05, note: '袈裟胚·取经人专属基座' } },
  3: { id: 3, name: '满月抛江', act: 1, type: 'story', icon: '✦',
    portrait: '江流儿',
    fate: '渡', echo: '战副→前世金身暗线(与第70难回扣)；渡副→弃经链；宿慧记忆伏笔',
    // V8.33 去掉「第一段｜金光」等分段提示词（与难1 V8.27 统一）
    dark: '满月当空，母亲把你放进木盆，推入江中。江水拍岸，木盆顺流而下，你睁着眼看天，天上那轮满月，像法统簿上盖的印。她笑着推你走，眼里是解脱——她知道留你必死。\n' +
      '江心浮起一具若有似无的金身，是你前世的残影——它正等你回头，替你把余生走完。你伸手去够，指尖却穿过那光，只捞起一捧江水。\n' +
      '江水东去，你漂过无人渡口，身侧那领袈裟被露水打湿。江声依旧，月影沉在水底。你望着那轮月，忽然懂了：木盆里的孩子与此刻的你，原是同一人。你起身，披上袈裟，继续往西。',
    intro: '满月当空，母亲将你放入木盆，推入江中。江水东去，这一漂从死处漂到活处——你借襁褓之身，睁眼看那轮满月。渡或战，随你。',
    options: [
      { key: '渡', label: '【渡】听江声，认这一漂', fate: '渡', effect: {alignGood: 10} },
      { key: '战', label: '【战】召唤前世金身，与之一战', fate: '战', fight: true, battleFlags: { openingMomentum: 1 }, effect: { alignEvil: 8 } },
      { key: '隐', label: '【隐】合眼不看那轮满月印', fate: '隐', noDao: true, effect: {alignGood: 6} }
    ],
    // 序章漂流叙事也应有收获：江流浮木中裹着一领袈裟胚（与取经人单一袈裟线一致）
    treasure: { id: 'ts_robe_base', type: 'armor', hp: 90, dr: 0.05, mdef: 0.05, note: '袈裟胚·序章机缘' } },
  4: { id: 4, name: '寻亲报冤', act: 1, type: 'fight', icon: '⚔',
    portrait: '刘洪',
    fate: '战', echo: '渡/逆副→弃经链；血溅公堂杀戮+',
    dark: '十八年后你持血书寻母。母亲已成刘洪之妻，见你如见鬼。你明白：复仇救不了任何人，只把你也变成"上面的人"。',
    // V8.33 丰富难4 intro：第一章关隘Boss叙事铺垫（十八年寻亲·江州公堂·刘洪的末路）
    intro: '十八年后，你持血书入江州。公堂之上，刘洪身着状元官服，端坐如旧——他占了你爹的位子、娶了你娘、用了你爹的名字，十八年。他见你，先是一愣，随即笑了："又来一个取经人。"你娘站在屏风后，指尖掐进掌心，不敢出声。这一战，是你西行前最后的人间债。蓄力重击时可识破反制。',
    options: [
      { key: '战', label: '【战】少年提剑，手刃刘洪', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】放他入狱候审', fate: '渡', effect: {alignGood: 20} },
      { key: '逆', label: '【逆】逼问幕后', fate: '逆', effect: {alignEvil: 15} }
    ],
    // 第4难必掉袈裟基座（取经人只走袈裟单一路线）
    treasure: { id: 'ts_robe_base', type: 'armor', hp: 90, dr: 0.05, mdef: 0.05, note: '袈裟胚·取经人专属基座' } },
  5: { id: 5, name: '出城逢虎', act: 2, type: 'fight', icon: '⚔',
    fate: '缘', echo: '战副→伯钦之缘(人伦线)',
    dark: '长安城外，猛虎实为城隍所化——它吃的是"逾期未归的取经人魂"。猎户伯钦救你，他爹也是取经人，没回来。',
    // V8.33 丰富难5 intro：第二章首战叙事铺垫（长安城外·猛虎·猎户伯钦）
    intro: '长安城外，荒草齐腰。一只吊睛白额虎伏在路心，不吼不扑，只是盯着你——它眼里没有兽性，只有一种"等了很久"的疲惫。山后转出猎户伯钦，弓已拉满："师父快走，这虎，吃过九世取经人。"',
    options: [
      { key: '战', label: '【战】猎户助阵·双人杀虎', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】放虎归山，为伯钦爹立坟', fate: '渡', effect: { alignGood: 10 } },
      { key: '缘', label: '【缘】伯钦赠刀', fate: '缘', effect: { equipPick: 3 } }
    ],
    // 第5难必掉袈裟基座（取经人只走袈裟单一路线）
    treasure: { id: 'ts_robe_base', type: 'armor', hp: 90, dr: 0.05, mdef: 0.05, note: '袈裟胚·取经人专属基座' } },
  6: { id: 6, name: '落坑折从', act: 2, type: 'event', icon: '✦',
    fate: '缘', echo: '逆副→逆鳞白龙(小白龙)种子；避水珠前置',
    dark: '双叉岭陷坑，两个随从被寅将军吃掉。你发现坑是"按难簿挖好的"——你每一步，都被写好了。',
    intro: '太白金星化身老者引路（金星是灵山眼线，但这次他心生怜悯）。',
    options: [
      { key: '逆', label: '【逆】不信老者', fate: '逆', effect: {alignEvil: 5} },
      { key: '渡', label: '【渡】为随从收尸立碑', fate: '渡', effect: { alignGood: 10 } },
      { key: '缘', label: '【缘】受指引', fate: '缘', effect: { gold: 20 } }
    ],
    hidden: { hero: 'xiaobailong', cond: '逆 + 避水珠', job: '逆鳞白龙', desc: '闪避+25%，水战无敌' },
    // 太白金星引路——避水珠·黯（8.11 难6 专属·小白龙逆鳞白龙转职持有门槛件）
    treasure: { id: 'bis_an', type: 'treasure', note: '避水珠·黯·落坑机缘（8.11 难6 专属）' } },
  7: { id: 7, name: '双叉岭上', act: 2, type: 'fight', icon: '◐',
    fate: '战', echo: '渡副→残魂路标呼应第58难',
    dark: '岭上魔影重叠，是历代取经人残魂筑的"路标"。它们求你别走，又求你快走——走是死，不走也是死，它们只是想有人替它们把这句话说出口。',
    // V8.33 丰富难7 intro：双叉岭残魂路标叙事
    intro: '双叉岭上，雾里浮着无数半透明的人影——他们穿着不同朝代的僧衣，朝同一个方向走，又在同一个地方停下。你听见他们在念同一句话，声音叠在一起，像风穿过破庙："别走……快走……"这是历代取经人残魂筑的路标。',
    options: [
      { key: '战', label: '【战】斩残魂开路', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】听它们说完名字', fate: '渡', effect: { alignGood: 15 } },
      { key: '隐', label: '【隐】绕行，不惊动残魂', fate: '隐', effect: {} }
    ],
    // 第7难必掉装备（修复"劫难打怪不掉装备"）
    treasure: { id: 'ss_skull_base', type: 'treasure', hp: 18, dr: 0.04, note: '骷髅串基座·沙僧专属' } },
  8: { id: 8, name: '两界山头', act: 2, type: 'story', icon: '✦',
    fate: '渡', echo: '逆副→孙悟空双线(紧箍/弃箍)·斗战胜佛 vs 混世魔王',
    dark: '五行山下压着的不只是猴，是一句没说完的"我不服"。揭帖是你自己前世写的——金蝉子曾许诺救他，十世都忘了。',
    // V8.33 丰富难8 intro：收悟空关键剧情叙事（五行山·揭帖·十世之约）
    intro: '五行山根，一只毛脸雷公嘴的猴子被压在石匣里，只露一颗头。他见你，先是一愣，随即笑了："金蝉子？你终于来了。我等了你十世——你前世写的揭帖，还贴在我头顶。"山风揭动那帖，金光一闪，是你自己的笔迹。',
    options: [
      { key: '渡', label: '【渡】与他立约同行', fate: '渡', effect: { alignGood: 10, flag: '取经同行' } },
      { key: '逆', label: '【逆】以"保命"为条件', fate: '逆', effect: { alignEvil: 8, wukongMorale: true } },
      { key: '缘', label: '【缘】许他自由', fate: '缘', effect: {ally: 'wukong'} }
    ],
    // 两界山收悟空——紧箍（原著如来帖压五行山，后观音赐紧箍约束；此处作为剧情机缘），非战斗叙事也有收获
    treasure: { id: 'jingu', type: 'treasure', note: '紧箍·两界山机缘（原著：五行山收悟空，观音赐金箍）' } },
  9: { id: 9, name: '两界山·鹰愁涧', act: 2, type: 'fight', icon: '🐉',
    fate: '缘', echo: '战副→龙太子归呼应(第59难)；白龙初现',
    dark: '过了两界山，涧水横在路前。鹰愁涧下盘着一条玉龙——西海龙王三太子，因纵火烧了殿上明珠，被贬在此等候取经人。它见你驮马行李，忽起贪念，欲吞了马再走："我本是龙，凭什么驮经？"',
    intro: '涧水翻涌，一条玉龙破水而出，口衔马缰。它问你：你那马，驮得动几卷经？',
    options: [
      { key: '战', label: '【战】降龙，收为脚力', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】点化白龙，随行驮经', fate: '渡', effect: { alignGood: 10 } },
      { key: '缘', label: '【缘】放它归海，白龙衔珠相赠', fate: '缘', effect: {} }
    ],
    hidden: { hero: 'wukong', cond: '战 + 战≥3', job: '斗战明王', desc: '以战正道，战意化刃' },
    treasure: { id: 'lm_scale_base', type: 'armor', hp: 40, dr: 0.02, eva: 0.05, note: '逆鳞胚·鹰愁涧机缘（龙马·鳞基座）' } },
  10: { id: 10, name: '虎先锋前哨', act: 3, type: 'fight', icon: '⚔',
    portrait: '虎仔',
    fate: '战', echo: '战副→黄风逆吹呼应(第62难)；黄风岭前哨',
    dark: '黄风岭前哨，虎先锋横刀拦路。它原是黄风怪座下先锋，专吃"过岭的取经人"——风起时，它比风先到。',
    intro: '虎先锋立在风沙里，刀尖挑着半截经幡："过岭的，先过我这关。"',
    options: [
      { key: '战', label: '【战】斗虎先锋', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】渡化绕行，化风而过', fate: '渡', effect: { alignGood: 10 } },
      { key: '隐', label: '【隐】潜行避其锋芒', fate: '隐', effect: {} }
    ],
    treasure: { id: 'set_weapon_base', type: 'weapon', atk: 10, note: '破军·兵刃基座（黄风岭前哨）' } },

  11: { id: 11, name: '黄风卷沙', act: 3, type: 'fight', icon: '🌪',
    portrait: '黄风怪',
    fate: '隐', echo: '战副→黄风逆吹呼应(第62难)；黄风岭首战',
    dark: '黄风岭的风不是风，是一只貂鼠的怨。它原是灵山脚下守酥陀的貂，偷抿了一口香油便被打下界——一勺油，换满山黄沙。它吹的不是风，是那句「我守了一辈子，却连尝一口都不配」。风卷着你转了九圈，像要把你这句话也嚼碎。',
    intro: '风眼里，一只貂鼠盘着尾，问你：三藏，你这一路取经，到头来是给谁点的灯？',
    options: [
      { key: '战', label: '【战】踏风穿云，一拳定住风眼', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】请灵吉念一卷还香油经', fate: '渡', effect: { alignGood: 10 } },
      { key: '隐', label: '【隐】闭目不为风动', fate: '隐', effect: {} }
    ],
    treasure: { id: 'dingfeng', type: 'treasure', note: '定风珠·黄风大圣首次掉落（原著：灵吉菩萨定风丹）' } },
  12: { id: 12, name: '三昧神风', act: 3, type: 'fight', icon: '🌀',
    portrait: '黄风怪',
    fate: '隐', echo: '战副→黄风逆吹回扣(第62难)',
    dark: '黄风怪吹的不是沙，是"遗忘"——被吹过的人，连自己为何取经都忘了。风停时，你发现同行的随从正互相问："我们这是要去哪？"这一吹，连火眼金睛也睁不开。',
    intro: '黄风怪现出真身，张口一吹——三昧神风，天地无色。',
    options: [
      { key: '战', label: '【战】灵吉收风', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】借风势渡岭', fate: '渡', effect: { alignGood: 10 } },
      { key: '隐', label: '【隐】闭目不为所动', fate: '隐', effect: {} }
    ],
    // 第12难必掉装备（修复"劫难打怪不掉装备"）
    treasure: { id: 'bj_robe_base', type: 'treasure', hp: 120, dr: 0.07, note: '僧衣基座·八戒专属' } },
  13: { id: 13, name: '黄风大圣', act: 3, type: 'fight', icon: '👑',
    portrait: '黄风怪',
    fate: '战', echo: '战副→黄风逆吹呼应(第62难)；黄风岭终战',
    dark: '黄毛貂鼠现出本相，三目齐开。风起时天地无声——它想起来了：它本是灵山养在笼中的"风"，今日要撕碎这笼子。灵吉菩萨的飞龙宝杖已在半空，可这一战，终究要你自己走完。',
    intro: '黄风大圣立在风眼，金目赤红："过岭的取经人，都该被吹成沙。"',
    options: [
      { key: '战', label: '【战】决战黄风大圣', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】请灵吉菩萨收风', fate: '渡', effect: { alignGood: 10 } },
      { key: '逆', label: '【逆】夺其风源，反吹灵山', fate: '逆', effect: {alignEvil: 8} }
    ],
    treasure: { id: 'dingfeng', type: 'treasure', note: '黄风大圣·定风珠（原著：灵吉菩萨定风丹）' } },
  14: { id: 14, name: '流沙河畔·沙僧初遇', act: 4, type: 'event', icon: '✦',
    fate: '缘', echo: '原著地理重排·新增（第14难·地区4）',
    dark: '流沙河八百里，弱水三千，鹅毛飘不起。岸边残舟半沉，舟底压着一串人头骨——那是沙僧的项上珠。',
    intro: '初到流沙河，河声如诉。渡口无人，唯河中妖气翻涌——这一程，从渡河开始。',
    options: [
      { key: '缘', label: '【缘】细察残舟，拾得渡河旧物', fate: '缘', effect: {'alignGood':6} },
      { key: '渡', label: '【渡】沿河诵经，渡河妖去', fate: '渡', effect: {'alignGood':10} },
      { key: '战', label: '【战】掷石入河，激妖出阵', fate: '战', fight: true, effect: {'alignEvil':8} },
    ] },
  15: { id: 15, name: '四圣试禅心', act: 4, type: 'event', icon: '✦',
    fate: '渡', echo: '原著地理重排·新增（第15难·地区4）',
    dark: '山间一座庄院凭空而起，三女一母笑迎投宿。你知这是黎山老母与菩萨设的局——试的从来不是色心，是取经的心。',
    intro: '黎山老母与三菩萨化身庄院，试师徒禅心。',
    options: [
      { key: '渡', label: '【渡】合掌谢过，不入庄门', fate: '渡', effect: {'alignGood':10} },
      { key: '缘', label: '【缘】借宿一夜，点破机关', fate: '缘', effect: {'alignGood':6} },
      { key: '逆', label: '【逆】拂袖而去，讥其设局', fate: '逆', effect: {'alignEvil':8} },
    ] },
  16: { id: 16, name: '流沙九颅', act: 4, type: 'fight', icon: '⚔',
    fate: '战', echo: '原著地理重排·新增（第16难·地区4）',
    dark: '沙僧项上九颗骷髅，是九世取经人的颅骨。你问他：第十颗，是不是你的？他低头数河底：已经数不清了。',
    intro: '沙僧骷髅串近在咫尺，河底怨灵翻涌。',
    options: [
      { key: '战', label: '【战】夺那骷髅串，与河底怨灵一战', fate: '战', fight: true, effect: {'alignEvil':8} },
      { key: '渡', label: '【渡】合掌渡那九颅，送其转生', fate: '渡', effect: {'alignGood':10} },
      { key: '隐', label: '【隐】绕开河底，避其锋芒', fate: '隐', effect: {'alignGood':4} },
      { key: '问', label: '【逆】问那九世因——沙僧，你吞的九世，哪一世最悔？', fate: '逆', effect: {'alignEvil':4,'jiushiyin':true} },
    ],
    hidden: { hero: 'shaseng', cond: '问九世因 + 降妖念珠', job: '卷帘镇妖', desc: '问九世因，镇压河妖（沙僧·卷帘镇妖前置）' } },
  17: { id: 17, name: '河神问渡', act: 4, type: 'event', icon: '✦',
    fate: '缘', echo: '原著地理重排·新增（第17难·地区4）',
    dark: '流沙河神浮出水面，捧着一枚渡牌："收下它，河会载你。只是——你渡得了河，渡得了河底的魂吗？"',
    intro: '河神以渡牌相赠，问西行人之志。',
    options: [
      { key: '缘', label: '【缘】收下渡牌，记河神一恩', fate: '缘', effect: {'alignGood':6} },
      { key: '渡', label: '【渡】合掌应诺，代渡河魂', fate: '渡', effect: {'alignGood':10} },
      { key: '逆', label: '【逆】拒渡牌，只身涉水', fate: '逆', effect: {'alignEvil':8} },
      { key: '夺', label: '【夺】夺那渡牌，自掌水路', fate: '夺', effect: {'alignEvil':6} },
    ] },
  18: { id: 18, name: '流沙河收沙僧', act: 4, type: 'fight', icon: '⛓️',
    portrait: '沙僧',
    fate: '渡', echo: '战副→卷帘复权(沙僧)种子；善≥30门槛',
    dark: '沙僧项下九颗骷髅，是九世取经人的头。他每吃一世金蝉，就多一颗——这是灵山让他"记住债"。他跪在河滩叩首："小僧，你若渡我上岸，我便不吃第十世。"',
    intro: '流沙河浊浪翻涌，卷帘大将项挂九颅，拦在渡口。',
    options: [
      { key: '战', label: '【战】降之', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】木吒说降', fate: '渡', effect: { alignGood: 15, ally: 'shaseng' } },
      { key: '逆', label: '【逆】问罪卷帘，索回九颅', fate: '逆', effect: {alignEvil: 8} }
    ],
    // 第14难必掉装备（修复"劫难打怪不掉装备"）
    treasure: { id: 'ss_skull_base', type: 'treasure', hp: 18, dr: 0.04, note: '骷髅串基座·沙僧专属' },
    hidden: { hero: 'shaseng', cond: '渡 + 善≥30', job: '卷帘复权', desc: '愿法防+25%，可复活一次' } },
  19: { id: 19, name: '五庄观人参', act: 5, type: 'event', icon: '✦',
    portrait: '镇元大仙',
    fate: '缘', echo: '逆副→五庄观根回扣(第65难)',
    dark: '镇元子的人参果，吃一颗活四万七千年——但果树的根，缠着千万取经人的尸骨当肥。',
    intro: '五庄观中，镇元子人参果树三千年一果；你窃果推树，或赔树医根。',
    options: [
      { key: '逆', label: '【逆】拔树看根', fate: '逆', effect: {alignEvil: 10} },
      { key: '渡', label: '【渡】与镇元子论道', fate: '渡', effect: {alignGood: 10} },
      { key: '缘', label: '【缘】求观音医树', fate: '缘', effect: {},
        favorGate: '观音',
        favorText: '观音念你昔日捧钵承命，净瓶甘霖救活人参果树，连根也搭了三分情——愿 +3、善 +2。',
        favorEffect: { yuan: 3, alignGood: 2 } }
    ],
    // 五庄观人参——芭蕉扇（镇元子与芭蕉扇渊源，后文借芭蕉扇灭火；此处作为剧情机缘），非战斗事件也有收获
    treasure: { id: 'baojiao', type: 'treasure', note: '芭蕉扇·五庄观机缘（原著：镇元子与芭蕉扇同源）' },
    hidden: { hero: 'tangseng', cond: '缘 + 缘≥3', job: '金蝉了缘', desc: '缘了缘续，因果自了（唐僧·金蝉了缘前置）' } },
  20: { id: 20, name: '白骨三戏', act: 5, type: 'fight', icon: '⚔',
    fate: '渡', echo: '战副→悟空空(悟空)种子；立坟超度',
    dark: '白骨精是"被写死的角色"——她知道自己只是难簿上第19笔，求你杀了她，好投个明白胎。',
    intro: '白骨夫人三戏取经人，只为求你杀她投明白胎；你三打，或听遗言。',
    options: [
      { key: '战', label: '【战】三打', fate: '战', fight: true, rounds: 3, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】听她遗言', fate: '渡', effect: { alignGood: 15 } },
      { key: '逆', label: '【逆】撕了难簿这一页', fate: '逆', effect: {alignEvil: 10} }
,
      { key: '隐', label: '【隐】隐去真身，辨白骨三戏', fate: '隐', effect: {"alignGood":4} },
    ],
    hidden: { hero: 'wukong', cond: '第3打选渡 + 救命毫毛', job: '悟空的空', desc: '体物伤+20%，分身替死' } },
  21: { id: 21, name: '贬退心猿', act: 5, type: 'event', icon: '✦',
    fate: '逆', echo: '渡副→贬退反转回扣(第72难)',
    dark: '取经人念紧箍咒逐悟空——不是糊涂，是他怕：悟空越近真相，越活不成。',
    intro: '叙事抉择（悟空离队）。',
    options: [
      { key: '渡', label: '【渡】忍痛放行', fate: '渡', effect: { alignGood: 10 } },
      { key: '逆', label: '【逆】悟空抗命不走', fate: '逆', effect: { alignEvil: 10, loosenCirclet: true } }
,
      { key: '夺', label: '【夺】夺那紧箍，自此无束', fate: '夺', effect: {"alignEvil":6} },
    ],
    hidden: { hero: 'wukong', cond: '逆 + 紧箍', job: '齐天残念', desc: '紧箍改为敌方减血10%，自身不掉血' },
    // 8.11 难22 专属：金箍·束缚（悟空齐天残念转职持有门槛件）
    treasure: { id: 'jingu_shu', type: 'treasure', note: '金箍·束缚·贬退心猿机缘（8.11 难22 专属）' } },
  22: { id: 22, name: '黄袍掳公主', act: 5, type: 'fight', icon: '⚔',
    fate: '隐', echo: '战副→黄袍放情回扣(第67难)',
    dark: '黄袍怪本是二十八宿奎木狼，私下凡间只为陪被贬的情人——天条比妖狠。',
    intro: '黄袍怪掳走宝象公主，天条与私情对峙；你战，或放其私奔。',
    options: [
      { key: '战', label: '【战】降之', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】为公主传书', fate: '渡', effect: { alignGood: 10 } },
      { key: '隐', label: '【隐】放他们私奔', fate: '隐', effect: {} }
    ] },
  23: { id: 23, name: '黑松林失', act: 6, type: 'fight', icon: '⚔',
    fate: '隐', echo: '战副→隐雾梅花呼应(第43难)',
    dark: '黄袍怪趁悟空不在掳取经人，八戒沙僧才知：没有那只猴，他们连"被写进经书"的资格都没有。',
    intro: '八戒沙僧不敌（可召唤悟空回归）。',
    options: [
      { key: '战', label: '【战】召回悟空', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '隐', label: '【隐】智取', fate: '隐', effect: {} }
,
      { key: '夺', label: '【夺】夺回被掳行囊，趁乱而行', fate: '夺', effect: {"alignEvil":6} },
      { key: '渡', label: '【渡】求山神护佑，负伤而行', fate: '渡', effect: { alignGood: 10 } }
    ],
    // 2026-09-01 八戒·血反伤路线：以背承山，以伤还伤（渡道·善≥30）
    hidden: { hero: 'bajie', cond: '渡 + 善≥30', job: '天蓬·负岳', desc: '以背承山，以伤还伤（八戒·血反伤路线）' } },
  24: { id: 24, name: '平顶山宝', act: 6, type: 'fight', icon: '⚔',
    fate: '夺', echo: '战副→吞天净坛(八戒)种子；真葫芦夺',
    dark: '金角银角是太上老君看炉童子，奉旨下界"演一出被收"——法宝都是道具，戏演完了你得配合。',
    intro: '平顶山莲花洞，金角银角持真葫芦装人；你斗法，或夺宝。',
    options: [
      { key: '战', label: '【战】以假乱真', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '夺', label: '【夺】强夺紫金葫芦', fate: '夺', effect: {} },
      { key: '逆', label: '【逆】私吞宝匣，倒戈老君', fate: '逆', effect: { alignEvil: 12 } }
    ],
    // 8.11 难18：八戒「吞天净坛」隐藏职 = 逆 + 净坛宝盂（八戒初始即持 bj_bowl）
    hidden: { hero: 'bajie', cond: '逆 + 净坛宝盂', job: '吞天净坛', desc: '吞食万物，饱食成盾（净坛宝盂持有门槛）' },
    treasure: { id: 'zijinhu', type: 'treasure', note: '紫金红葫芦·金角银角机缘' } },
  25: { id: 25, name: '乌鸡井龙', act: 6, type: 'event', icon: '✦',
    fate: '缘', echo: '渡副→乌鸡立新王(重排后难25 fuxinwang 标记源)',
    dark: '乌鸡国王被青狮推井，狮王扮国王坐了三年——妖坐龙椅，比人像样。井底龙王托梦诉冤，井水都带着龙泪的咸。',
    intro: '乌鸡国井底，真王尸身沉了三年；井龙王诉冤，你背尸，或先问价。',
    options: [
      { key: '逆', label: '【逆】先问价，扶立新王', fate: '逆', effect: { alignEvil: 8, gold: 30, fuxinwang: true } },
      { key: '渡', label: '【渡】亲下井背尸', fate: '渡', effect: { alignGood: 10 } },
      { key: '缘', label: '【缘】八戒背尸', fate: '缘', effect: {} }
,
      { key: '隐', label: '【隐】隐入井底，探乌鸡真相', fate: '隐', effect: {"alignGood":4} },
    ],
    hidden: { hero: 'bajie', cond: '逆 + 扶新王', job: '天蓬复称', desc: '重称天蓬，倒海翻江（八戒·天蓬复称前置，须于本难择「扶立新王」）' } },
  26: { id: 26, name: '黑水鼍龙', act: 6, type: 'fight', icon: '⚔',
    fate: '隐', echo: '战副→避水珠抗水(第9难链)',
    dark: '西海龙王外甥，因"血统不纯"被贬管黑水河——龙族内部，比妖界更讲出身。',
    intro: '黑水河底，鼍龙因"血统不纯"被贬；你解咒，或灭之。',
    options: [
      { key: '战', label: '【战】河伯助收', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '隐', label: '【隐】放其归海', fate: '隐', effect: {} }
,
      { key: '夺', label: '【夺】夺鼍龙夜明珠', fate: '夺', effect: {"alignEvil":6} },
    ],
    // 2026-09-01 小白龙·血防路线：御水成甲，潜渊自守（隐道·隐≥3）
    hidden: { hero: 'xiaobailong', cond: '隐 + 隐≥3', job: '白龙·御水', desc: '御水成甲，潜渊自守（小白龙·血防闪避路线）' },
    // 8.11 难21 专属：避水珠·潜流（龙马成长件）
    treasure: { id: 'bis_qian', type: 'treasure', note: '避水珠·潜流·黑水河机缘（8.11 难21 专属）' } },
  27: { id: 27, name: '红孩真火', act: 6, type: 'fight', icon: '⚔',
    fate: '战', echo: '渡副→火云逆父回扣(第70难)',
    dark: '红孩儿的三昧真火，是他爹悟空当年在八卦炉里偷学的——子承父"业"，却认了牛魔王。',
    intro: '火云洞中，红孩儿三昧真火困住悟空；你战，或认亲。',
    options: [
      { key: '战', label: '【战】请观音收之', fate: '战', fight: true, battleFlags: { openingMomentum: 1 },
        favorGate: '观音',
        favorText: '观音曾受你捧钵之诚，净瓶真火一覆，红孩三昧便哑了三分——愿 +3、善 +2，起手势 +1。',
        favorEffect: { yuan: 3, alignGood: 2, momentum: 1 } },
      { key: '渡', label: '【渡】劝其认父', fate: '渡', effect: { alignGood: 15 } },
      { key: '夺', label: '【夺】夺三昧真火', fate: '夺', effect: {alignEvil: 10} }
    ],
    // 第20难必掉装备（修复"劫难打怪不掉装备"）
    treasure: { id: 'zy_w_base', type: 'weapon', atk: 20, note: '镇妖棍·镇妖套武器基座' } },
  28: { id: 28, name: '车迟求雨', act: 7, type: 'event', icon: '✦',
    fate: '渡', echo: '原著地理重排·新增（第28难·地区7）',
    dark: '车迟国大旱三年，虎力大仙登坛求雨。你见那雨水里掺着香灰——求来的不是雨，是香火钱。',
    intro: '车迟国斗法始——虎力登坛，求雨争胜。',
    options: [
      { key: '战', label: '破坛断香，激怒虎力——力战求雨台', fate: '战', fight: true, effect: {'alignEvil':8} },
      { key: '渡', label: '罢斗诵经，劝虎力体察民情', fate: '渡', effect: {'alignGood':10} },
      { key: '隐', label: '避战脱身，潜行查探三清观', fate: '隐', effect: {'alignGood':4} },
    ] },
  29: { id: 29, name: '三妖赌胜', act: 7, type: 'fight', icon: '⚔',
    fate: '战', echo: '原著地理重排·新增（第29难·地区7）',
    dark: '虎力赌头、鹿力剖腹、羊力下油锅。赌注不是命，是"谁才是这国的神"。',
    intro: '车迟国三妖以命相赌，逼你入局。',
    options: [
      { key: '战', label: '【战】应赌，逐妖破法', fate: '战', fight: true, effect: {'alignEvil':8} },
      { key: '渡', label: '【渡】罢赌，劝三妖归正', fate: '渡', effect: {'alignGood':10} },
      { key: '夺', label: '【夺】趁乱夺其法器', fate: '夺', effect: {'alignEvil':6} },
    ],
    hidden: { hero: 'xiaobailong', cond: '夺 + 夺≥3', job: '夺宝龙子', desc: '龙的宝，迟早游回龙手里（白龙·夺宝龙子前置）' } },
  30: { id: 30, name: '车迟监·灭僧', act: 7, type: 'event', icon: '✦',
    fate: '逆', echo: '原著地理重排·新增（第30难·地区7）',
    dark: '车迟城监里关着千百和尚——不是犯戒，是"信错了神"。铁栏后有人喊你：取经人，救不救？',
    intro: '车迟国灭佛监僧，城中僧人尽数披枷。',
    options: [
      { key: '逆', label: '【逆】砸监放僧，与车迟王廷为敌', fate: '逆', effect: {'alignEvil':8} },
      { key: '渡', label: '【渡】入宫说法，谏车迟王', fate: '渡', effect: {'alignGood':10} },
      { key: '战', label: '【战】劫牢夺囚，一战破监', fate: '战', fight: true, effect: {'alignEvil':8} },
      { key: '夺', label: '【夺】夺监中香火银两，取之不义', fate: '夺', effect: {"alignEvil":6} },
    ] },
  31: { id: 31, name: '车迟三妖·魁首', act: 7, type: 'fight', icon: '⚔',
    fate: '战', echo: '原著地理重排·新增（第31难·地区7）',
    dark: '虎力大仙被斩首后，颈腔里钻出的不是血，是香火灰。鹿力羊力骇然："大哥，你求的雨……"他笑："那雨，本来就是我们。"',
    intro: '车迟国关隘——虎力/鹿力/羊力，一役定神位。',
    options: [
      { key: '战', label: '【战】一棒破三妖，斩断香火神位', fate: '战', fight: true, effect: {'alignEvil':10} },
      { key: '渡', label: '【渡】点破三妖，令其归正', fate: '渡', effect: {'alignGood':10} },
      { key: '逆', label: '【逆】反借香火，反噬三妖', fate: '逆', effect: {'alignEvil':6} },
    ] },
  32: { id: 32, name: '通天河渔户', act: 8, type: 'event', icon: '✦',
    fate: '缘', echo: '原著地理重排·新增（第32难·地区8）',
    dark: '陈家庄年年要往通天河送一对童男童女，供灵感大王。村长递给你一碗热汤："师父，今夜轮到我家了。"汤里映着他的脸。',
    intro: '陈家庄祭童之祸——通天河灵感大王索童。',
    options: [
      { key: '缘', label: '【缘】应诺代童入河', fate: '缘', effect: {'alignGood':6} },
      { key: '渡', label: '【渡】设坛祈渡，解陈家庄厄', fate: '渡', effect: {'alignGood':10} },
      { key: '战', label: '【战】夜伏河畔，猎那灵感', fate: '战', fight: true, effect: {'alignEvil':8} },
      { key: '夺', label: '【夺】夺祭童赎金，占为己有', fate: '夺', effect: {"alignEvil":6} },
    ] },
  33: { id: 33, name: '灵感大王', act: 8, type: 'event', icon: '✦',
    fate: '渡', echo: '原著地理重排·新增（第33难·地区8）',
    dark: '灵感大王庙里香火鼎盛，供的是条金鱼。你问庙祝：它吃什么？庙祝低头：童男童女。你抬头看那金鱼，它正盯着你笑。',
    intro: '金鱼精灵感大王盘踞通天河，以童男童女为食。',
    options: [
      { key: '渡', label: '【渡】入庙说法，渡那金鱼', fate: '渡', effect: {'alignGood':10} },
      { key: '逆', label: '【逆】砸庙揭供，断其香火', fate: '逆', effect: {'alignEvil':8} },
      { key: '战', label: '【战】引它出水，一战定河', fate: '战', fight: true, effect: {'alignEvil':8} },
      { key: '夺', label: '【夺】夺灵感庙金身，熔作路费', fate: '夺', effect: {"alignEvil":6} },
    ] },
  34: { id: 34, name: '冰河渡难', act: 8, type: 'event', icon: '✦',
    fate: '隐', echo: '原著地理重排·新增（第34难·地区8）',
    dark: '河水一夜封冻，通天河结了冰。你踏上冰面，听见冰下"咚咚"——那是金鱼精在凿冰，等你踏空。',
    intro: '通天河结冰，踏冰过河险象环生。',
    options: [
      { key: '隐', label: '【隐】贴冰潜行，避其凿击', fate: '隐', effect: {'alignGood':4} },
      { key: '渡', label: '【渡】诵经化冰，稳步过河', fate: '渡', effect: {'alignGood':10} },
      { key: '战', label: '【战】踏冰呐喊，引它破冰一战', fate: '战', fight: true, effect: {'alignEvil':8} },
    ],
    hidden: { hero: 'wukong', cond: '隐 + 隐≥3', job: '白衣渡客', desc: '白衣渡尽，不着一物（悟空·白衣渡客前置）' } },
  35: { id: 35, name: '金兜金刚', act: 8, type: 'fight', icon: '⚔',
    fate: '夺', echo: '战副→金兜碎琢回扣(第74难)',
    dark: '青牛精的金刚琢，能套一切兵器——包括"天命"。老君下界，只为证明"连你手里的棍，也是我的"。',
    intro: '金兜洞外，青牛精持金刚琢套尽神兵；你战，或趁乱夺琢。',
    options: [
      { key: '战', label: '【战】老子收牛', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '夺', label: '【夺】趁乱夺琢', fate: '夺', effect: {} }
,
      { key: '缘', label: '【缘】还金刚琢于老君，结善缘', fate: '缘', effect: {"alignGood":6} },
    ],
    // 第25难必掉装备（修复"劫难打怪不掉装备"）
    treasure: { id: 'jingangzhuo', type: 'treasure', note: '金刚琢·金兜洞机缘（原著：青牛精金刚琢）' } },
  36: { id: 36, name: '金鱼精·通天河决战', act: 8, type: 'fight', icon: '⚔',
    fate: '战', echo: '原著地理重排·新增（第36难·地区8）',
    dark: '灵感大王现出金鱼本相，翻江倒海。你想起陈家庄那碗汤——今日该让这河，换个吃法。',
    intro: '通天河关隘——金鱼精灵感大王决战。',
    options: [
      { key: '战', label: '【战】翻江一战，擒那金鱼', fate: '战', fight: true, effect: {'alignEvil':10} },
      { key: '渡', label: '【渡】以佛法渡之，收其归正', fate: '渡', effect: {'alignGood':10} },
      { key: '逆', label: '【逆】借其反噬，反掌降妖', fate: '逆', effect: {'alignEvil':6} },
    ] },
  37: { id: 37, name: '女儿国水', act: 9, type: 'event', icon: '✦',
    fate: '缘', echo: '逆副→吞天净坛链(八戒)',
    dark: '子母河的水，喝一口便怀"取经人之种"——女儿国女王要的，不是夫，是"能走出这片国的种"。',
    intro: '子母河畔，落胎泉眼被如意真仙把持；你争泉，或强夺。',
    options: [
      { key: '缘', label: '【缘】如意真仙给水', fate: '缘', effect: {} },
      { key: '逆', label: '【逆】强夺泉眼', fate: '逆', effect: {alignEvil: 10} }
,
      { key: '夺', label: '【夺】夺那子母河水为药', fate: '夺', effect: {"alignEvil":6} },
    ] },
  38: { id: 38, name: '女王招亲', act: 9, type: 'event', icon: '✦',
    fate: '逆', echo: '渡副→弃经链；女儿国种回扣(第75难)',
    dark: '女王许你王位，条件是留下——她看穿了：经书到手，你也只是灵山一尊新像。',
    intro: '女儿国驿馆，女王许你王位只为留"种"；你拒婚，或揭穿她也是囚徒。',
    options: [
      { key: '渡', label: '【渡】温柔辞别', fate: '渡', effect: { alignGood: 15 } },
      { key: '逆', label: '【逆】揭穿她也是囚徒', fate: '逆', effect: {alignEvil: 10} }
,
      { key: '夺', label: '【夺】夺通关文牒，连夜出城', fate: '夺', effect: {"alignEvil":6} },
    ],
    hidden: { hero: 'tangseng', cond: '逆 + 紫金钵 + 善≥20', job: '弃经者', desc: '可拒通关，改写结局' } },
  39: { id: 39, name: '落胎泉·解阳山', act: 9, type: 'fight', icon: '⚔',
    fate: '战', echo: '原著地理重排·新增（第39难·地区9）',
    dark: '子母河水怀胎，解阳山落胎泉是唯一的解药。如意真仙守着泉，见你便拔剑："取经人，也配喝我的泉？"',
    intro: '解阳山落胎泉——如意真仙阻路，为取泉水须先破他。',
    options: [
      { key: '战', label: '【战】夺泉一战，败如意真仙', fate: '战', fight: true, effect: {'alignEvil':8} },
      { key: '渡', label: '【渡】以礼相求，请其解厄', fate: '渡', effect: {'alignGood':10} },
      { key: '逆', label: '【逆】夜取泉水，不告而取', fate: '逆', effect: {'alignEvil':6} },
    ] },
  40: { id: 40, name: '蝎精摄僧', act: 9, type: 'fight', icon: '⚔',
    fate: '渡', echo: '战副→蝎歌彻听回扣(第76难)',
    dark: '琵琶精的倒马毒，专克佛门——她是第一个"用佛的办法破佛"的人。',
    intro: '琵琶洞中，蝎子精倒马毒克佛；你战，或听她歌破佛。',
    options: [
      { key: '战', label: '【战】昴日克之', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】听她歌', fate: '渡', effect: {} }
    ] },
  41: { id: 41, name: '六耳初现', act: 10, type: 'event', icon: '✦',
    fate: '缘', echo: '原著地理重排·新增（第41难·地区10）',
    dark: '你打伤一个"悟空"——他死前喊冤：我才是真的。另一个悟空从云里落下，冷笑：他装的。你看着两个一模一样的人，头一回分不清真假。',
    intro: '真假美猴王——六耳猕猴初现，真假难辨。',
    options: [
      { key: '缘', label: '【缘】暂不责罚，细观其行', fate: '缘', effect: {'alignGood':6} },
      { key: '逆', label: '【逆】两皆杖责，逼其现形', fate: '逆', effect: {'alignEvil':8} },
      { key: '战', label: '【战】棒喝二猴，试其真身', fate: '战', fight: true, effect: {'alignEvil':8} },
    ] },
  42: { id: 42, name: '沙僧辨假', act: 10, type: 'event', icon: '✦',
    fate: '缘', echo: '原著地理重排·新增（第42难·地区10）',
    dark: '沙僧去花果山请悟空，却见"悟空"在花果山称王。他跪求真经，两个悟空都说：我是真的。沙僧回来问你：师父，连我都辨不出。',
    intro: '真假猴王——沙僧往返对质，真假莫辨。',
    options: [
      { key: '缘', label: '【缘】慰沙僧，共商辨假之策', fate: '缘', effect: {'alignGood':6} },
      { key: '渡', label: '【渡】念经问心，以心辨假', fate: '渡', effect: {'alignGood':10} },
      { key: '逆', label: '【逆】怒而遣散二猴，独自西行', fate: '逆', effect: {'alignEvil':8} },
      { key: '隐', label: '【隐】隐于云端，观真假之争', fate: '隐', effect: {} },
    ] },
  43: { id: 43, name: '幽冥谛听', act: 10, type: 'event', icon: '✦',
    fate: '隐', echo: '原著地理重排·新增（第43难·地区10）',
    dark: '地府谛听伏地听了半晌，抬头只说了句："不可说破。"你问为何？它瞥你一眼："说破的，都是死过的。"',
    intro: '真假猴王——地府谛听辨六耳，不敢道破。',
    options: [
      { key: '隐', label: '【隐】不再追问，听其言外', fate: '隐', effect: {'alignGood':4} },
      { key: '渡', label: '【渡】请地藏开示，寻辨真法', fate: '渡', effect: {'alignGood':10} },
      { key: '逆', label: '【逆】逼谛听说破，不惜逆天', fate: '逆', effect: {'alignEvil':8} },
    ] },
  44: { id: 44, name: '如来说破', act: 10, type: 'event', icon: '✦',
    fate: '渡', echo: '原著地理重排·新增（第44难·地区10）',
    dark: '灵山之上，如来合掌："六耳猕猴，善聆音，能察理。"他话音未落，那假悟空已现出本相——浑身是毛，眼放金光。你忽然懂了：辨真假的法子，从来不在眼睛。',
    intro: '真假猴王——灵山如来道破六耳本相。',
    options: [
      { key: '渡', label: '【渡】合掌谢如来，了却真假', fate: '渡', effect: {'alignGood':10} },
      { key: '逆', label: '【逆】讥如来偏私，拂袖而去', fate: '逆', effect: {'alignEvil':8} },
      { key: '战', label: '【战】一棒压那六耳，亲自收束', fate: '战', fight: true, effect: {'alignEvil':8} },
      { key: '隐', label: '【隐】隐于莲座旁，听如来道破', fate: '隐', effect: {} },
    ] },
  45: { id: 45, name: '真假美猴王', act: 10, type: 'fight', icon: '⚔',
    fate: '逆', echo: '战/渡副→悟空线·六耳；真假归一回扣(第77难)',
    dark: '六耳猕猴不是妖，是"另一个可能"——若当年压在五行山下的，是听话的那只。',
    intro: '真假美猴王难辨，天庭地府皆无奈；你收六耳，或认下"你即我"。',
    options: [
      { key: '战', label: '【战】如来收六耳', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '逆', label: '【逆】认下"你即我"', fate: '逆', effect: {alignEvil: 15, d29Ni: true} },
      { key: '渡', label: '【渡】与六耳和解', fate: '渡', effect: { alignGood: 15 } }
    ],
    hidden: { hero: 'wukong', cond: '逆 + 紧箍', job: '齐天·大圣', desc: '双身同战，体物伤+30%' },
    // 8.11 难29 专属：六耳化身印（齐天·大圣 / 六耳·残 转职持有门槛件）
    treasure: { id: 'liuer', type: 'treasure', note: '六耳化身印·真假美猴王机缘（8.11 难29 专属）' } },
  46: { id: 46, name: '火焰借扇', act: 11, type: 'fight', icon: '⚔',
    fate: '夺', echo: '战副→火焰重燃回扣(第78难)',
    dark: '铁扇公主的扇，扇一下是火，扇一下是风——她守的不是山，是"不让你过去，就不必面对牛魔王背叛的真相"。',
    intro: '火焰山前，铁扇公主假扇戏你三调芭蕉；你力夺真扇，或变虫入腹逼扇。',
    options: [
      { key: '战', label: '【战】力夺真扇', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '夺', label: '【夺】变虫入腹逼扇', fate: '夺', effect: {} }
,
      { key: '缘', label: '【缘】以礼借扇，结一段善缘', fate: '缘', effect: {"alignGood":6} },
    ],
    treasure: { id: 'liuer', note: '已在 TREASURES' } },

  47: { id: 47, name: '假扇风波', act: 11, type: 'event', icon: '✦',
    fate: '隐', echo: '原著地理重排·新增（第47难·地区11）',
    dark: '铁扇公主给了你一把扇，你借它灭火——火越扇越旺。你烧了满脸，才知扇是假的。你笑：真扇她留着，假扇烧了八百里。',
    intro: '火焰山——铁扇公主以假扇相欺，火势更旺。',
    options: [
      { key: '隐', label: '【隐】忍下火燎，再谋真扇', fate: '隐', effect: {'alignGood':4} },
      { key: '渡', label: '【渡】托人斡旋，求和借扇', fate: '渡', effect: {'alignGood':10} },
      { key: '战', label: '【战】持假扇怒闯芭蕉洞', fate: '战', fight: true, effect: {'alignEvil':8} },
      { key: '缘', label: '【缘】寻铁扇结缘，辨假扇真伪', fate: '缘', effect: {"alignGood":6} },
    ] },
  48: { id: 48, name: '积雷山·牛魔王', act: 11, type: 'fight', icon: '⚔',
    fate: '战', echo: '原著地理重排·新增（第48难·地区11）',
    dark: '积雷山摩云洞，牛魔王端坐饮酒，见你便笑："我妻的扇，你也敢惦记？"他吹一口气，山都矮了三分。',
    intro: '火焰山——积雷山牛魔王挡道。',
    options: [
      { key: '战', label: '【战】棒斗牛魔王，夺路入洞', fate: '战', fight: true, effect: {'alignEvil':8} },
      { key: '渡', label: '【渡】攀交讲和，请他让扇', fate: '渡', effect: {'alignGood':10} },
      { key: '夺', label: '【夺】夜袭摩云洞，盗那扇柄', fate: '夺', effect: {'alignEvil':6} },
    ] },
  49: { id: 49, name: '翠云山·真扇决战', act: 11, type: 'fight', icon: '⚔',
    fate: '战', echo: '原著地理重排·新增（第49难·地区11）',
    dark: '翠云山芭蕉洞前，牛魔王现出白牛本相，踏碎云头。你攥紧金箍棒——这扇不拿到手，八百里火焰山烧的就不止是路了。',
    intro: '火焰山关隘——牛魔王/铁扇公主，真扇之战。',
    options: [
      { key: '战', label: '【战】降伏牛魔，得真扇灭焰', fate: '战', fight: true, effect: {'alignEvil':10} },
      { key: '渡', label: '【渡】以情动铁扇，化干戈为玉帛', fate: '渡', effect: {'alignGood':10} },
      { key: '夺', label: '【夺】巧夺芭蕉扇，拂焰而去', fate: '夺', effect: {'alignEvil':6} },
    ],
    // —— V8.57 补火焰山隐藏职（原 act11 0隐藏职）——
    hidden: { hero: 'all', cond: '渡 + 第47难曾选渡', job: '罗刹·铁扇', desc: '铁扇公主见你以情动人，将芭蕉扇真法传你——解锁隐藏转职「罗刹·铁扇」（须于本难择「以情动铁扇」，且第47难曾选「托人斡旋，求和借扇」）' } },
  50: { id: 50, name: '祭赛金光', act: 12, type: 'fight', icon: '⚔',
    fate: '渡', echo: '战副→祭赛还光回扣(第79难)',
    dark: '金光寺舍利被窃，实是碧波潭龙女偷去献天——"献祭"是妖界向上爬的唯一路。',
    intro: '金光寺塔顶三年无光，满城香客怨僧不诚。你夜探碧波潭，见龙宫宴上九头虫把舍利系在龙女发间当夜明珠——"取经人？"九头虫九首齐转，"我缺一盏照夜灯，你来得正好。"',
    options: [
      { key: '战', label: '【战】二郎助擒', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】夺回舍利超度', fate: '渡', effect: {alignGood: 12} }
,
      { key: '夺', label: '【夺】夺佛宝舍利，自取其一', fate: '夺', effect: {"alignEvil":6} },
    ],
    treasure: { id: 'zhaoyao', phase: 'out', effect: '照妖，下战-1' } },
  51: { id: 51, name: '金光寺冤僧', act: 12, type: 'event', icon: '✦',
    fate: '逆', echo: '渡副→金光寺舍利失窃（呼应第31难祭赛金光）',
    dark: '金光寺宝塔失光，舍利被窃，满寺僧众被冤下狱——住持不认，被拷断十指；小沙弥不认，被锁进地牢。\n城里的孩童唱："和尚偷了佛的光，佛便收了城的香。"你路过地牢，听见老僧在念经——念的不是求饶，是超度。\n他们跪着求的佛，先偷了他们的光。',
    intro: '祭赛国金光寺宝塔蒙尘，舍利失窃，满寺僧众被冤下狱；你查案申冤，或趁乱取利，问一问那失窃的光。',
    options: [
      { key: '渡', label: '【渡】为僧申冤', fate: '渡', effect: {} },
      { key: '逆', label: '【逆】趁乱夺塔中旧物', fate: '逆', effect: {alignEvil: 10} }
,
      { key: '夺', label: '【夺】夺回镇寺之宝，占为功果', fate: '夺', effect: {"alignEvil":6} },
    ] },

  52: { id: 52, name: '碧波潭探', act: 12, type: 'event', icon: '✦',
    fate: '隐', echo: '渡副→碧波潭龙宫暗线',
    dark: '碧波潭底，万圣龙宫灯火通明——九头虫把舍利当夜明珠，挂在龙女床头。',
    intro: '追查舍利至碧波潭，龙宫夜宴；你潜潭暗查，或逼问龙兵。',
    options: [
      { key: '渡', label: '【渡】劝龙兵回头', fate: '渡', effect: { alignGood: 15 } },
      { key: '逆', label: '【逆】逼问龙兵', fate: '逆', effect: { alignEvil: 10 } }
,
      { key: '夺', label: '【夺】夺九叶灵芝草', fate: '夺', effect: {"alignEvil":6} },
    ] },
  53: { id: 53, name: '万圣盗草·乱石山伏', act: 12, type: 'event', icon: '✦',
    fate: '隐', echo: '缘副→九叶灵芝草暗线',
    dark: '万圣公主偷了王母的九叶灵芝草，只为给九头虫续命——她以为偷来的爱，能养出真心。',
    intro: '万圣公主盗九叶灵芝草救九头虫；你点破她，或助她偷到底。',
    options: [
      { key: '缘', label: '【缘】助她偷到底', fate: '缘', effect: {} },
      { key: '渡', label: '【渡】点破她', fate: '渡', effect: { alignGood: 10 } }
,
      { key: '夺', label: '【夺】黑吃黑，夺盗草赃物', fate: '夺', effect: {"alignEvil":8} },
    ] },
  54: { id: 54, name: '九头虫·碧波潭', act: 12, type: 'fight', icon: '⚔',
    fate: '战', echo: '战副→祭赛还光回扣(第79难)；九头虫伏诛',
    dark: '九头虫九头齐出，舍利在他腹中发光——他吞的不是佛宝，是"被供奉"的执念。\n他大笑："你替秃驴们讨光？他们供了三百年的佛光，佛可曾分他们一寸？不如留给我——我做这碧波潭的佛，起码还照得见龙女的眉。"',
    intro: '碧波潭底水宫尽塌，九头虫现出本相，九首各衔一件兵刃，舍利悬在正中那颗头颅的眉心——"取经人，你抢回去的只是一颗珠子。可这国的人，早忘了光是什么。"',
    options: [
      { key: '战', label: '【战】战九头虫', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '隐', label: '【隐】避其锋', fate: '隐', effect: {} }
    ] },
  55: { id: 55, name: '木仙谈诗', act: 13, type: 'event', icon: '✦',
    fate: '缘', echo: '渡/隐副→诗酒机缘',
    dark: '荆棘岭树精邀你谈诗——它们活了千年，只因"不做取经人"。杏仙要你留下，做一棵树。',
    intro: '荆棘岭木仙庵，树精邀你谈诗欲留你做树；你斩树脱身，或愿做树一刻。',
    options: [
      { key: '渡', label: '【渡】斩树精脱身', fate: '渡', effect: { alignGood: 10 } },
      { key: '隐', label: '【隐】愿做树一刻', fate: '隐', effect: {} }
,
      { key: '夺', label: '【夺】夺其千年木心', fate: '夺', effect: {"alignEvil":6} },
    ] },
  56: { id: 56, name: '小雷音假佛', act: 13, type: 'fight', icon: '⚔',
    fate: '逆', echo: '渡副→弃经链；小雷音破回扣(第80难)',
    dark: '黄眉童儿坐莲台，那人种袋能装一切——包括"你相信的那尊佛"。山门护法来收，却笑说：你分得清真假吗？',
    intro: '小雷音寺，黄眉童儿假佛坐莲台；你战，或夺人种袋破假佛。',
    options: [
      { key: '渡', label: '【渡】弥勒收之', fate: '渡', effect: { alignGood: 12 }, fight: true, battleFlags: { dmgMul: 0.9, incomingDmgMul: 0.85 } },
      { key: '逆', label: '【逆】夺人种袋', fate: '逆', effect: {} }
,
      { key: '夺', label: '【夺】夺金铙法器，破其假阵', fate: '夺', effect: {"alignEvil":6} },
    ],
    treasure: { id: 'bf_renzhongdai', phase: 'in', effect: '装敌一回合，1/1' } },
  57: { id: 57, name: '朱紫医王', act: 13, type: 'event', icon: '✦',
    fate: '缘', echo: '逆副→吞天净坛链(八戒)',
    dark: '朱紫国王因"射伤神兽"被罚，金圣宫被赛太岁夺——天庭的罚，比妖狠。',
    intro: '朱紫国王被罚，金圣宫被赛太岁夺；你悬丝诊脉医王，或问其罪。',
    options: [
      { key: '缘', label: '【缘】医国王', fate: '缘', effect: {} },
      { key: '逆', label: '【逆】问国王罪', fate: '逆', effect: {alignEvil: 8} }
,
      { key: '夺', label: '【夺】夺金铃铛三宝', fate: '夺', effect: {"alignEvil":6} },
    ] },
  58: { id: 58, name: '狮驼尸山·如来收鹏', act: 13, type: 'fight', icon: '⚔',
    fate: '逆', echo: '战/渡副→卷帘/弃经链；取尸骨为甲',
    dark: '四百里尸山，是历代取经人堆的——大鹏说：你不是第一个，也不会是最后一个。',
    intro: '狮驼岭四百里尸山，历代取经人堆成；你破尸山，或取尸骨为甲。',
    options: [
      { key: '战', label: '【战】破尸山', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】超度亡魂', fate: '渡', effect: { alignGood: 20 } },
      { key: '逆', label: '【逆】取尸骨为甲', fate: '逆', effect: {alignEvil: 10} }
    ],
    treasure: { id: 'bf_yinerping', phase: 'passive', effect: '敌现身处-8%血，1/1' },
    hidden: { hero: 'all', cond: '逆 + 第29难曾选逆', job: '六耳·残', desc: '解锁隐藏第四人·六耳可参战（须于难45真假美猴王认六耳）' } },
  59: { id: 59, name: '比丘白鹿', act: 14, type: 'event', icon: '✦',
    fate: '逆', echo: '原著地理重排·新增（第59难·地区14）',
    dark: '比丘国国王要用一千一百一十一个小孩的心肝做药引——他只道这是国丈献的长生方。国丈拄杖立在丹房，鹿眼藏在官帽下，看那些被锁的孩童如看草料。\n你问他：鹿心做药引，够不够？\n他笑了，声音像从很深的山洞里传来："够？国王要的是长生，我给的是药引。药引是真是假，谁在意呢——反正吃过的人，都死了。"\n后来你才知，这国丈是终南山的白鹿精，假扮寿星的模样，只为一国童血养它一具鹿身。',
    intro: '比丘国白鹿精假国丈，以孩童心肝炼药；国王久病不愈，国丈执掌朝纲。你入宫探案，或直捣清华洞，问鹿心够不够。',
    options: [
      { key: '逆', label: '【逆】揭穿国丈，救孩童于丹炉', fate: '逆', effect: {'alignEvil':8} },
      { key: '渡', label: '【渡】入宫说法，劝国王罢手', fate: '渡', effect: {'alignGood':10} },
      { key: '战', label: '【战】追白鹿至清华洞，一战除妖', fate: '战', fight: true, effect: {'alignEvil':8} },
      { key: '隐', label: '【隐】隐于丹房，探白鹿底细', fate: '隐', effect: {} },
    ] },
  60: { id: 60, name: '灭法剃王', act: 14, type: 'event', icon: '✦',
    fate: '逆', echo: '渡副→弃经链',
    dark: '灭法国要杀万僧，因国王梦见"僧压龙"——梦是灵山授的，杀是王替天行。',
    intro: '灭法国王梦"僧压龙"要杀万僧；你智剃众僧发，或反制剃王。',
    options: [
      { key: '缘', label: '【缘】化解', fate: '缘', effect: { gold: 30 } },
      { key: '逆', label: '【逆】剃尽僧发反制', fate: '逆', effect: { alignEvil: 8 } }
,
      { key: '夺', label: '【夺】夺其剃度刀，绝其王法', fate: '夺', effect: {"alignEvil":6} },
    ] },
  61: { id: 61, name: '隐雾梅花', act: 14, type: 'fight', icon: '⚔',
    fate: '隐', echo: '战副→卷帘复权链(沙僧)',
    dark: '南山大王分瓣梅花计，是把"你"拆成几瓣骗自己——你以为选了路，其实路选了你。',
    intro: '隐雾山分瓣梅花计，把"你"拆成几瓣骗自己；你破计，或识破不走。',
    options: [
      { key: '战', label: '【战】破计', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '隐', label: '【隐】识破不走', fate: '隐', effect: {} }
,
      { key: '缘', label: '【缘】与梅花鹿精结缘，渡其归道', fate: '缘', effect: {"alignGood":6} },
    ],
    hidden: { hero: 'tangseng', cond: '隐 + 隐≥3 + 索命簿残卷', job: '判官金蝉', desc: '断人生死，替天行道' } },
  62: { id: 62, name: '凤仙求雨', act: 14, type: 'event', icon: '✦',
    fate: '缘', echo: '渡副→求雨机缘',
    dark: '凤仙郡侯因推倒供桌被旱三年——天庭的雨，要"诚心"买，诚心是粮。',
    intro: '凤仙郡旱三年，因推倒供桌触怒天庭；你建祠求雨，或咒天不下。',
    options: [
      { key: '渡', label: '【渡】建祠求雨', fate: '渡', effect: { alignGood: 15 }, disciple: 'fengxian' },
      { key: '逆', label: '【逆】咒天不下', fate: '逆', effect: {alignEvil: 10} }
,
      { key: '夺', label: '【夺】夺雨符，自布云雨', fate: '夺', effect: {"alignEvil":6} },
    ] },
  63: { id: 63, name: '玉华盗兵', act: 14, type: 'fight', icon: '⚔',
    fate: '夺', echo: '战副→夺兵暗线',
    dark: '玉华州三王子学艺，黄狮精盗兵器开"钉耙会"——妖也办宴，庆自己"像个人"。',
    intro: '玉华州黄狮精盗兵开钉耙会，庆自己"像个人"；你夺兵，或赴宴。',
    options: [
      { key: '战', label: '【战】夺回兵器', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '缘', label: '【缘】赴钉耙会', fate: '缘', effect: { equipPick: 3 }, disciple: 'yuhua3' }
    ] },
  64: { id: 64, name: '竹节九狮', act: 15, type: 'fight', icon: '⚔',
    fate: '渡', echo: '战副→九狮收；驯兽师伏笔',
    dark: '九灵元圣一口衔住你——它不恨你，只是"天尊的坐骑，习惯了衔东西"。被你一路收下的百兽，在你身后列队嘶吼，全世界都在等你，把这头九头狮子也收进你的兽园。',
    intro: '竹节山九灵元圣一口衔住你，只因习惯衔物；你收九狮为御兽，或顺毛脱身。',
    options: [
      { key: '战', label: '【战】天尊收狮', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '夺', label: '【夺】收九灵为御兽', fate: '夺', fight: true, battleFlags: { openingMomentum: 2 },
        subText: '你有足够的兽缘与身阵——若能出阵三只以上的御兽，便以兽领群，驯服这头九灵元圣，自封驭兽之主。' },
      { key: '隐', label: '【隐】顺毛而脱', fate: '隐', effect: {} }
,
      { key: '缘', label: '【缘】与九灵元圣结缘，化敌为友', fate: '缘', effect: {"alignGood":6} },
    ],
    hidden: { hero: 'all', cond: '夺 + 出阵灵兽≥3', job: '驯兽师·百兽归心',
      desc: '收九灵为御兽：每上阵一只灵兽，全属性放大约 6%' } },
  65: { id: 65, name: '金平犀灯', act: 15, type: 'fight', icon: '⚔',
    fate: '夺', echo: '战副→犀灯',
    dark: '三犀牛假佛收灯油，因香火供奉"收得太贵"——假佛的灯，照的也是真信徒。',
    intro: '玄英洞三犀假佛收灯油，因香火供奉收得太贵；你战四木禽星，或夺犀角灯。',
    options: [
      { key: '战', label: '【战】四木禽星助', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '夺', label: '【夺】夺犀角灯', fate: '夺', effect: {}, disciple: 'jinping' }
,
      { key: '缘', label: '【缘】结缘犀牛精，渡其归正', fate: '缘', effect: {"alignGood":6} },
    ],
    hidden: { hero: 'shaseng', cond: '夺 + 夺≥3', job: '卷帘夺宴', desc: '夺他人之宴，喂自己之腹' },
    treasure: { id: 'liuer', phase: 'out', effect: '回血40%' } },
  66: { id: 66, name: '给孤招婚', act: 15, type: 'fight', icon: '⚔',
    fate: '缘', echo: '战副→吞天净坛链(八戒)',
    dark: '天竺假公主（玉兔）招婚，因她在月宫"捣了一辈子药，想被人娶一次"。',
    intro: '天竺玉兔假公主招婚，只为被人娶一次；你太阴收兔，或放她回月。',
    options: [
      { key: '战', label: '【战】太阴收兔', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】放她回月', fate: '渡', effect: { alignGood: 15 } }
,
      { key: '夺', label: '【夺】夺婚书聘礼，拂袖而去', fate: '夺', effect: {"alignEvil":6} },
    ] },
  67: { id: 67, name: '铜台辨冤', act: 15, type: 'event', icon: '✦',
    fate: '逆', echo: '渡副→弃经链',
    dark: "寇员外斋僧万僧，却在自家门前被人一棍打死。官府拿了取经人当替罪羊，说'和尚贪财害命'。悟空夜入地府，一棒砸开森罗殿，要阎王还寇员外的魂。阎王翻簿：'他斋僧二十七年，善簿厚得压手——可他死前一念，恨的是我斋了一辈子僧，末了被僧害死。这一念恨，把二十七年的善，全烧成了灰。'悟空把那灰捧在手里，吹了一口气：'善人，你恨错了人。害你的不是僧，是贪。'寇员外睁眼，第一句话是：'我那斋僧的粥锅，还热着吗？'——善人的命，要猴王去讨；可善人的执念，要他自己放下。",
    intro: '寇员外斋僧被害，悟空辨冤复活；你复活员外，或查真凶是官。',
    options: [
      { key: '渡', label: '【渡】复活员外', fate: '渡', effect: { alignGood: 20 } },
      { key: '逆', label: '【逆】查真凶是官', fate: '逆', effect: {alignEvil: 8} }
,
      { key: '缘', label: '【缘】与铜台百姓结缘，辨明冤情', fate: '缘', effect: {"alignGood":6} },
    ] },
  68: { id: 68, name: '玉兔假公主', act: 15, type: 'event', icon: '✦',
    fate: '缘', echo: '原著地理重排·新增（第68难·地区15）',
    dark: '天竺国公主绣球抛向你，你却见那"公主"手指甲里嵌着月宫的土。\n三百年前广寒宫，素娥仙子嫌捣药的玉兔挡路，一掌把它打翻在地。如今素娥转世为天竺公主，玉兔下界寻仇——可它见那公主眉目温软，忽然不知该恨谁。\n它杀不了一个无辜的转世，就做了三天公主，替她活一遍。嫦娥在月宫叹气："它偷的从来不是公主的命，是那三百年没被人好好看过的自己。"\n她笑：娶了我，保你西行无忧。你笑：我西行，从不靠娶。',
    intro: '天竺国玉兔精假扮公主招亲，只为替转世的素娥活一遍；你识破其异，或接绣球，窥她三百年心事。',
    options: [
      { key: '缘', label: '【缘】不接绣球，暗察其异', fate: '缘', effect: {'alignGood':6} },
      { key: '渡', label: '【渡】明言拒亲，劝其归月', fate: '渡', effect: {'alignGood':10} },
      { key: '逆', label: '【逆】当众揭破公主是假', fate: '逆', effect: {'alignEvil':8} },
      { key: '隐', label: '【隐】隐于月影，识破玉兔', fate: '隐', effect: {} },
    ] },
  69: { id: 69, name: '月宫桂影', act: 15, type: 'event', icon: '✦',
    fate: '渡', echo: '原著地理重排·新增（第69难·地区15）',
    dark: '月宫桂树下，嫦娥低头捣药。她说那玉兔走失人间三百年，假扮公主只为躲一个"还"字。你问：还什么？她不答，桂影摇了一地。',
    intro: '月宫玉兔往事——嫦娥捣药，桂影摇摇。',
    options: [
      { key: '渡', label: '【渡】劝嫦娥了却旧怨，迎兔归月', fate: '渡', effect: {'alignGood':10} },
      { key: '缘', label: '【缘】记下玉兔苦衷，暂不相逼', fate: '缘', effect: {'alignGood':6} },
      { key: '隐', label: '【隐】不涉月宫恩怨，抽身而退', fate: '隐', effect: {'alignGood':4} },
    ] },
  70: { id: 70, name: '捣药杵', act: 15, type: 'fight', icon: '⚔',
    fate: '夺', echo: '原著地理重排·新增（第70难·地区15）',
    dark: '玉兔操起捣药杵，砸碎天竺金銮殿的门。那杵不是药杵——是月宫里镇过妖的兵。',
    intro: '天竺国玉兔持捣药杵为兵，战于金銮殿。',
    options: [
      { key: '夺', label: '【夺】夺那捣药杵，破其兵势', fate: '夺', effect: {'alignEvil':6} },
      { key: '战', label: '【战】迎战玉兔，直捣其巢', fate: '战', fight: true, effect: {'alignEvil':8} },
      { key: '渡', label: '【渡】以佛法镇之，止其兵戈', fate: '渡', effect: {'alignGood':10} },
    ] },
  71: { id: 71, name: '玉兔遁月', act: 15, type: 'event', icon: '✦',
    fate: '隐', echo: '原著地理重排·新增（第71难·地区15）',
    dark: '玉兔见败，纵身向月遁去。你伸手拦——她回眸："我偷了三百年的月光，该还了。"话音未落，人已入月，只剩一地清辉。',
    intro: '天竺国玉兔战败遁月，三百年偷来的月光一朝归还；你任其归月，或追月问罪，了却一段因果。',
    options: [
      { key: '隐', label: '【隐】任其归月，不再追逼', fate: '隐', effect: {'alignGood':4} },
      { key: '渡', label: '【渡】向月合掌，送其一程', fate: '渡', effect: {'alignGood':10} },
      { key: '逆', label: '【逆】追月问罪，讨个说法', fate: '逆', effect: {'alignEvil':8} },
    ] },
  72: { id: 72, name: '玉兔精·天竺决战', act: 15, type: 'fight', icon: '⚔',
    fate: '战', echo: '原著地理重排·新增（第72难·地区15）',
    dark: '玉兔精临逃回首，金瞳一睁："你可知天竺国这三年，供的都是假公主？今日一了——"你攥紧法器：假的供了三百年，真的就这一棒。',
    intro: '金銮殿前，玉兔精褪了人皮，露出雪白的耳——捣药杵横在身前，月光在她身周凝成霜："三百年，我学做公主、学做新娘、学做人。可你们只认那一张脸。今日我不躲了——你打碎了它，正好。"',
    options: [
      { key: '战', label: '【战】一棒降玉兔，了结天竺之乱', fate: '战', fight: true, effect: {'alignEvil':10} },
      { key: '渡', label: '【渡】渡其归月，化干戈', fate: '渡', effect: {'alignGood':10} },
      { key: '夺', label: '【夺】收其捣药杵为宝', fate: '夺', effect: {'alignEvil':6} },
    ] },
  73: { id: 73, name: '化电归真', act: 16, type: 'story', icon: '☯',
    fate: '逆', echo: '渡副→弃经/逆道链',
    dark: '雷音门前，如来拈花一笑："金蝉子，你历九九八十一难，功德圆满。今封你为旃檀功德佛，永世受香火。"你低头看自己的手——这双手，在灵山捻过佛珠，在轮回殿喝过孟婆，在长安城外接过唐王的酒，在白虎岭被白骨夫人的指甲划破过。它们是"金蝉子"的手，还是"你"的手？如来又问："你愿做经，还是愿做自己？"做经，便是永世被人念诵，被人供奉，被人当成一句"阿弥陀佛"——可再也没有人叫你"御弟"，再也没有人记得你在女儿国喝过的那杯酒。做自己，便是放下佛位，再入轮回，生生世世做一个普通人——可你终于可以自己决定，下一顿饭吃什么，下一段路怎么走。雷音寺的钟响了。你抬头，看见如来身后的墙上，刻着一行小字："佛者，觉也。觉者，自知也。"——最后一考，不是考你能不能成佛，是考你敢不敢不成佛。',
    intro: '雷音门前最后一考："做经，还是做自己"；你受封，或拒封。',
    options: [
      { key: '渡', label: '【渡】受封', fate: '渡', effect: { alignGood: 10 } },
      { key: '逆', label: '【逆】拒封', fate: '逆', effect: { alignEvil: 20, flag: '逆道前置' } }
    ] },
  74: { id: 74, name: '传经索人事', act: 16, type: 'event', icon: '✦',
    fate: '逆', echo: '原著地理重排·新增（第74难·地区16）',
    dark: '灵山藏经阁前，执事僧捻指："传经岂能白传？拿人事来。"你摸遍行囊，只剩一个破碗。他收了碗，给你一摞白纸。',
    intro: '灵山执事僧索人事，传"无字经"。',
    options: [
      { key: '逆', label: '【逆】索回人事，讥其贪墨', fate: '逆', effect: {'alignEvil':8} },
      { key: '渡', label: '【渡】以钵盂相赠，权作人事', fate: '渡', effect: {'alignGood':10} },
      { key: '战', label: '【战】夺经而走，不与之交易', fate: '战', fight: true, effect: {'alignEvil':8} },
      { key: '缘', label: '【缘】以钵结缘，赠执事人事', fate: '缘', effect: {"alignGood":6} },
    ] },
  75: { id: 75, name: '无字真经·勘破', act: 16, type: 'event', icon: '✦',
    fate: '渡', echo: '原著地理重排·新增（第75难·地区16）',
    dark: '你翻开"真经"，满纸无一字。你先是怒，继而笑——灵山给有字经渡人，给无字经渡心。你把这摞白纸揣进怀里：这一路八十一难，早把字都写在你心里了。',
    intro: '灵山无字真经——勘破白纸。',
    options: [
      { key: '渡', label: '【渡】合掌收下，悟无字之经', fate: '渡', effect: {'alignGood':10} },
      { key: '逆', label: '【逆】掷经于地，斥其欺世', fate: '逆', effect: {'alignEvil':8} },
      { key: '缘', label: '【缘】留存白纸，以证此行', fate: '缘', effect: {'alignGood':6} },
    ] },
  76: { id: 76, name: '问佛根源', act: 16, type: 'fight', icon: '☯',
    fate: '渡', echo: '渡副→老君伪善链(第二章最终Boss)',
    dark: '如来道："纵牛下界者，老君也。"悟空愣住——那青牛，原是老君炉边坐骑，故意放它下界，只为试取经队伍几分真心。',
    intro: '兜率宫前，太上老君自丹炉雾中现身。青牛已伏，执念未消——这一战，关乎"天道是否值得赴"。',
    // 第二章最终 Boss：老君本体战（呼应天庭征伐主题）。正道闭环天道秩序，逆道揭伪善得专属传记。
    boss: '太上老君化身',
    options: [
      // 正道：问如来→如来点老君→老君收牛（闭环天道秩序），获天道正统认可
      { key: '渡', label: '【渡】问如来·请老君收牛', fate: '渡', effect: {alignGood: 28},
        rewardTitle: '天道归序·金丹护体', rewardDesc: '老君亲手收牛，赐你一粒护身金丹：受愿伤减免 +5%。天道秩序，自此闭环。',
        fight: true, bossDiff: 0.95 },
      // 逆道：不请如来，直闯兜率宫质问"为何纵牛"——揭露老君故意试队伍阴谋，触发隐藏传记
      { key: '逆', label: '【逆】闯兜率宫·质问老君', fate: '逆', effect: {alignEvil: 22},
        rewardTitle: '业藏录·老君伪善', rewardDesc: '你揪住老君衣襟："你纵牛下界，试我等真心！"——伪善被揭，专属传记《业藏录·老君伪善》解锁。攻击 +10、愿伤 +10。',
        unlockCodex: '业藏录·老君伪善', fight: true, bossDiff: 1.22 }
,
      { key: '隐', label: '【隐】隐于莲座下，窃听佛问', fate: '隐', effect: {} },
    ] },
  77: { id: 77, name: '灵山无字·大圣残躯', act: 16, type: 'boss', icon: '⚔',
    fate: '逆', echo: '战副→逆道真结局门槛；↔80难小雷音破（无字碑↔假佛，真假灵山之辨）',
    dark: '灵山不见佛影，只有一块无字碑——碑上说：来者皆被写进经，有人把经当牢。你面前，是历代取经人的"合体"——大圣残躯。',
    intro: '终战 Boss（diff 20，多阶段）。',
    options: [
      { key: '渡', label: '【渡】归入经书', fate: '渡', ending: '真·结局（牺牲线）' },
      { key: '逆', label: '【逆】碎无字碑', fate: '逆', ending: '逆道结局（反抗线，需全程逆≥阈值）' },
      { key: '隐', label: '【隐】携碑遁走', fate: '隐', ending: '隐世结局（需全程隐≥阈值）' }
    ],
    unlock: '击败后主菜单解锁"命数"面板与全部隐藏转职触发条件' },

  78: { id: 78, name: '凌云渡·无底船', act: 17, type: 'event', icon: '✦',
    fate: '渡', echo: '原著地理重排·新增（第78难·地区17）',
    dark: '凌云渡口，一只无底船泊在江心。撑船的老者看你："上船吧，这船不渡活人，只渡死过的。"你抬脚踏上——船没沉，因为你的影子，早沉了。',
    intro: '凌云渡无底船——渡生死之界。',
    options: [
      { key: '渡', label: '【渡】踏上无底船，渡此生死', fate: '渡', effect: {'alignGood':10} },
      { key: '逆', label: '【逆】拒不上船，质问船夫', fate: '逆', effect: {'alignEvil':8} },
      { key: '隐', label: '【隐】沿岸寻桥，绕开此渡', fate: '隐', effect: {'alignGood':4} },
      { key: '缘', label: '【缘】与渡夫结缘，同登彼岸', fate: '缘', effect: {"alignGood":6} },
    ] },
  79: { id: 79, name: '晒经石', act: 17, type: 'event', icon: '✦',
    fate: '缘', echo: '原著地理重排·新增（第79难·地区17）',
    dark: '通天河老鼋翻身，真经湿透。你在晒经石上摊开晾晒，几页经文的字被水浸去。你忽然明白：八十一难的最后一难，不在取，在"还"。',
    intro: '通天河晒经石——湿经还字。',
    options: [
      { key: '缘', label: '【缘】细读湿经残字，记其本真', fate: '缘', effect: {'alignGood':6} },
      { key: '渡', label: '【渡】合掌向老鼋，应诺还它一问', fate: '渡', effect: {'alignGood':10} },
      { key: '逆', label: '【逆】怪老鼋覆舟，拂袖而去', fate: '逆', effect: {'alignEvil':8} },
    ] },
  80: { id: 80, name: '接引佛·灵山脚下', act: 17, type: 'event', icon: '✦',
    fate: '逆', echo: '原著地理重排·新增（第80难·地区17）',
    dark: '灵山脚下，接引佛合掌而立，问你一句三百年没变的话："经取到了，你是谁？"你张口，却答不出——你才发觉，这一路渡了无数人，唯独忘了渡自己。',
    intro: '灵山脚下接引佛问——你是谁。',
    options: [
      { key: '逆', label: '【逆】答：我是那个问过如来的人', fate: '逆', effect: {'alignEvil':8} },
      { key: '渡', label: '【渡】合掌答：我是取经人', fate: '渡', effect: {'alignGood':10} },
      { key: '隐', label: '【隐】默然不语，转身继续西行', fate: '隐', effect: {'alignGood':4} },
    ] },
  81: { id: 81, name: '通天河遇鼋湿经', act: 17, type: 'boss', icon: '⚰️',
    fate: '逆', echo: '终局收束：通天河晒经石前，为八十一难之末；金蝉脱壳，湿经东归',
    dark: '『第八十一难』渡通天河，那老鼋问你：这一去灵山，可问过如来，几时可再回原地？你答不得——它驮着真经，沉了九天九夜，这一个字，你都还不上它。\n' +
      '它翻覆身子，真经湿透，晾干时熬下百二十余字。你忽然明白：八十一难的最后一难，不在取，在"还"。',
    intro: '终局 Boss 战：通天河老鼋，水覆沉经。渡水渡己，答或不答，皆在取舍之间。',
    options: [
      { key: '逆', label: '【逆】焚尽难簿 · 逆命乾元', fate: '逆', ending: '真·逆道结局（解锁全英雄终极隐藏职）' },
      { key: '渡', label: '【渡】如实相告 · 引渡老鼋', fate: '渡', ending: '善之结局' },
      { key: '隐', label: '【隐】携湿经隐世', fate: '隐', ending: '隐世结局（全员隐藏职激活）' }
    ],
    // 8.11 难81：全英雄终极隐藏职「真·逆道」= 逆 + 真·逆道结局
    hidden: { hero: 'all', cond: '逆 + 真·逆道结局', job: '真·逆道', desc: '逆道之极：全英雄终极隐藏职觉醒' } },
};

// ============================================================
// 返程 / 暂存素材（隐藏保留 · 后续开发）
// 原 57-80 倒序返程段 + 被并入段（24 宝象变虎 / 34 七绝 / 36 盘丝 / 37 黄花 / 40 普天 / 53 乱石山），
// 正传流程不再使用；原样保留供后续开发（如二周目返程）。键号=原难号。
NDX.RETURN_TRIALS = {
  24: { id: 24, name: '宝象变虎', act: 2, type: 'fight', icon: '⚔',
    fate: '战', echo: '渡副→宝象破笼回扣(第73难)',
    dark: '取经人被变虎锁笼，白龙马化人夜刺黄袍——它终于为自己，不是为"经"。',
    intro: '宝象国中，取经人被变猛虎锁入笼；白龙夜刺黄袍，你救主，或求原身。',
    options: [
      { key: '战', label: '【战】胜', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】求得原身', fate: '渡', effect: { alignGood: 10 } }
    ] },
  34: { id: 34, name: '七绝蟒雾', act: 3, type: 'fight', icon: '⚔',
    fate: '战', echo: '渡副→除蟒渡魂',
    dark: '七绝山红蟒食人，因山被"绝"了生路——它只是饿了千年的囚徒。',
    intro: '七绝山红蟒食人，因山被"绝"了生路；你除蟒，或喂其解脱。',
    options: [
      { key: '战', label: '【战】除蟒', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】喂其解脱', fate: '渡', effect: { alignGood: 12 } }
    ] },
  36: { id: 36, name: '盘丝吐丝', act: 3, type: 'fight', icon: '⚔',
    fate: '隐', echo: '战副→破丝而走',
    dark: '七蛛精濯垢泉，丝是她们"织的命"——每个都想织出一条不通往灵山的路。',
    intro: '盘丝洞温泉，七蛛精织丝不通往灵山；你破丝而走，或战毗蓝收蜈蚣。',
    options: [
      { key: '战', label: '【战】毗蓝收蜈蚣', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '隐', label: '【隐】破丝而走', fate: '隐', effect: {} }
    ],
    hidden: { hero: 'wukong', cond: '隐 + 隐≥3', job: '白衣渡客', desc: '白衣渡尽，不着一物' } },
  37: { id: 37, name: '黄花观毒', act: 3, type: 'fight', icon: '⚔',
    fate: '渡', echo: '战副→求解药',
    dark: '蜈蚣精下毒，因他被"多目"之罪逐出师门——眼多，看得清，便是错。',
    intro: '黄花观中，蜈蚣精下毒因"多目"之罪；你求解药，或战毗蓝破之。',
    options: [
      { key: '战', label: '【战】毗蓝破之', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】求解药', fate: '渡', effect: { alignGood: 10 } }
    ] },
  40: { id: 40, name: '普天神难伏', act: 2, type: 'fight', icon: '🐂',
    fate: '战', echo: '战副→青牛伏诛链(第二章准Boss)',
    dark: '独角兕套走满天神佛的兵器，笑道："你们的兵器，不过是俺老君炉里一块废铁。"悟空却不肯请神——他要凭一身筋骨，硬撼那金刚琢。',
    intro: '金兜洞外，青牛精独角兕持金刚琢而立。此琢能套尽三界兵器，众神束手。',
    // 青牛精天然机制：金刚琢=破韧+缴械（套走兵器→强制破韧+清空法宝CD）；二阶段无敌帧须以"非兵器手段"破业障槽。
    boss: '青牛精·独角兕',
    options: [
      // 正道：依传统剧情请众神助战——虽败犹荣，换得秩序赐福（减伤类永久加成）
      { key: '渡', label: '【渡】请众神助战', fate: '渡', effect: {alignGood: 25},
        rewardTitle: '秩序赐福·众神庇佑', rewardDesc: '虽败犹荣：众神感你诚心，赐下庇佑，受击减伤 +6%。',
        fight: true, bossDiff: 0.92 },
      // 逆道：不请神，以"吞金刚琢"之势硬刚——以力证道（攻击/破韧），但紧箍加深一道裂纹
      { key: '逆', label: '【逆】不请神·硬撼金刚琢', fate: '逆', effect: {alignEvil: 18},
        rewardTitle: '逆道劫印·以力证道', rewardDesc: '你一口吞下金刚琢的罡风，骨缝里榨出力量：攻击 +14；紧箍应声裂开一道新纹。',
        crackJingu: 1, fight: true, bossDiff: 1.18, battleFlags: { openingMomentum: 2, drainPct: 0.02 } }
    ] },
  53: { id: 53, name: '乱石山伏', act: 3, type: 'event', icon: '✦',
    fate: '缘', echo: '渡副→乱石山妖兵',
    dark: '乱石山妖兵列阵，九头虫在潭底冷笑——他偷的不是舍利，是"被看见"的资格。',
    intro: '乱石山妖兵拦路，九头虫在潭底观战；你退妖兵，或借妖势。',
    options: [
      { key: '渡', label: '【渡】退妖兵', fate: '渡', effect: { alignGood: 10 } },
      { key: '逆', label: '【逆】借妖势', fate: '逆', effect: { alignEvil: 8 } }
    ] },
  57: { id: 57, name: '再临五行山（倒序）', act: 4, type: 'fight', icon: '⚔',
    fate: '逆', echo: '战副→悟空线；五行山回扣(第1/8难)',
    dark: '【金光】五行山下还压着一只"听话的猴"，它从不闹、从不逃，连看守都快忘了它的存在。【暗红】你伸手去揭那道帖，指腹却抖——你忽然分不清：此刻去救的，是它，还是当年本可能认命的自己？【灰黑】帖落，山下空空。原来"听话"的，从来不曾被谁真想救过。',
    intro: '再临五行山，揭帖放那只从未反抗的猴。',
    options: [
      { key: '渡', label: '【渡】放之', fate: '渡', effect: { alignGood: 20 } },
      { key: '逆', label: '【逆】取其石胆', fate: '逆', effect: {alignEvil: 10} }
    ],
    treasure: { id: 'duanshanfu', phase: 'passive', effect: '开局破紧箍一次' } },
  58: { id: 58, name: '重勘双叉岭', act: 4, type: 'event', icon: '✦',
    fate: '渡', echo: '战副→双叉岭残魂呼应(第7难)',
    dark: '【金光】双叉岭风里全是没念完的名字，残魂排着队，等你叫出第一个。【暗红】你为它们立碑，却不敢落一字——灵山教人写的名，写错便又是一难。【灰黑】最后碑上空着。有些魂，本就不该被写进任何簿。',
    intro: '重勘双叉岭，为历代取经人残魂立碑或焚难簿。',
    options: [
      { key: '渡', label: '【渡】立碑', fate: '渡', effect: { alignGood: 15 } },
      { key: '隐', label: '【隐】焚簿', fate: '隐', effect: {} }
    ] },
  59: { id: 59, name: '倒流鹰愁涧', act: 4, type: 'fight', icon: '⚔',
    fate: '缘', echo: '战副→避水珠链(第9难)',
    dark: '【金光】鹰愁涧水倒流，小白龙浮出水面，衔着那截被抽走的龙筋。【暗红】"当年吞你马，是不甘；"它说，"如今讨回，是还自己一个\'龙\'字。"【灰黑】筋接上的那一刻，它终于不必再做一匹马。',
    intro: '倒流鹰愁涧，助白龙向抽筋者讨回龙筋，或还筋化马。',
    options: [
      { key: '战', label: '【战】弑抽筋者', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '缘', label: '【缘】还筋化马', fate: '缘', effect: {} }
    ],
    // 8.11 难59：白龙「龙太子归」隐藏职 = 助讨龙筋(缘) + 持有避水珠·化龙
    hidden: { hero: 'xiaobailong', cond: '助讨龙筋 + 闪避≥阈值', job: '龙太子归', desc: '化龙归位，水战无敌（避水珠·化龙门槛）' },
    // 8.11 难59 专属：避水珠·化龙（小白龙龙太子归转职持有门槛件）
    treasure: { id: 'bis_shui_hua', type: 'treasure', note: '避水珠·化龙·倒流鹰愁涧机缘（8.11 难59 专属）' } },
  60: { id: 60, name: '观音院火', act: 4, type: 'event', icon: '✦',
    fate: '渡', echo: '战副→黑风呼应(第10/61难)',
    dark: '【金光】观音院九百件袈裟在墙上发光，每一件都曾属于一个"走到半路的人"。【暗红】火是你自己点的。烧的不是院，是灵山收藏失败者的橱窗。【灰黑】灰里没有舍利，只有九百个没被记住的名字，终于暖了一次。',
    intro: '观音院火，你亲手点燃，烧掉收藏失败者的"墙"。',
    options: [
      { key: '逆', label: '【逆】烧', fate: '逆', effect: {alignEvil: 15} }
    ],
    treasure: { id: 'bis_shui_hua', phase: 'in', effect: '火伤反弹' } },
  61: { id: 61, name: '黑风开箱', act: 4, type: 'event', icon: '✦',
    portrait: '黑熊精',
    fate: '缘', echo: '战副→黑风盗袈呼应(第10难)',
    dark: '【金光】黑风洞的箱锁着，你以为里面是袈裟。【暗红】开箱，是一匣"失败者"的残魂，它们求你释，也求你取。【灰黑】你取了。从此这笔账，有人替它们记着。',
    intro: '黑风开箱，释被藏袈裟之魂，或取走箱中宝。',
    options: [
      { key: '渡', label: '【渡】释', fate: '渡', effect: { alignGood: 15 } },
      { key: '夺', label: '【夺】取宝', fate: '夺', effect: { equipPick: 3 } }
    ],
    hidden: { hero: 'xiaobailong', cond: '夺 + 夺≥3', job: '夺宝龙子', desc: '龙的宝，迟早游回龙手里' } },
  62: { id: 62, name: '黄风逆吹', act: 4, type: 'fight', icon: '⚔',
    fate: '逆', echo: '战副→黄风卷岭呼应(第12难)',
    dark: '【金光】黄风怪那口"遗忘"的风，被你兜住，调了头。【暗红】风灌进灵山，菩萨们忽然忘了自己念了多久的经。【灰黑】原来忘了，也是一种醒——只是没人敢先停。',
    intro: '黄风逆吹，将"遗忘"之风吹回天庭，或自守不为所动。',
    options: [
      { key: '战', label: '【战】吹回', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '隐', label: '【隐】自守', fate: '隐', effect: {} }
    ] },
  63: { id: 63, name: '流沙数颅', act: 4, type: 'event', icon: '✦',
    fate: '逆', echo: '渡副→卷帘复权链(沙僧)',
    dark: '【金光】沙僧项下九颗骷髅，你一颗颗数。【暗红】数到第九颗，你不敢信——那里面，有过你。【灰黑】归葬时，流沙河第一次没有吞人。',
    intro: '流沙数颅，将九世骷髅归葬，或追问九世因果。',
    options: [
      { key: '渡', label: '【渡】葬', fate: '渡', effect: { alignGood: 20 } },
      { key: '逆', label: '【逆】问九世因', fate: '逆', effect: {alignEvil: 10, jiushiyin: true} }
    ],
    hidden: { hero: 'shaseng', cond: '问九世因 + 降妖念珠', job: '卷帘镇妖', desc: '问尽九世因，念珠镇妖邪' } },
  64: { id: 64, name: '四圣拆庄', act: 4, type: 'event', icon: '✦',
    fate: '逆', echo: '渡副→流沙收沙呼应(第14难)',
    dark: '【金光】黎山老母的庄院，拆。【暗红】里面供着的"标本"一个个醒过来——贪心入赘的取经人，被点成了永不老的摆设。【灰黑】它们走出门，第一件事，是忘了自己曾多想当那家的婿。',
    intro: '四圣拆庄，拆毁显化庄院放出标本，或度化之。',
    options: [
      { key: '逆', label: '【逆】拆', fate: '逆', effect: { alignEvil: 10 } },
      { key: '渡', label: '【渡】度', fate: '渡', effect: { alignGood: 15 } }
    ] },
  65: { id: 65, name: '五庄观根', act: 4, type: 'event', icon: '✦',
    fate: '缘', echo: '逆副→五庄观人参呼应(第15难)',
    dark: '【金光】你拔起人参果树，根须缠着千万取经人的尸骨当肥。【暗红】镇元子在一旁笑：树活了四万七千年。【灰黑】喂它的，从来不是土——是每一个没走到的人。',
    intro: '五庄观根，拔树见尸骨之肥，或移树重生。',
    options: [
      { key: '逆', label: '【逆】曝根', fate: '逆', effect: {alignEvil: 15} },
      { key: '缘', label: '【缘】移树重生', fate: '缘', effect: {} }
    ],
    hidden: { hero: 'tangseng', cond: '缘 + 缘≥3', job: '金蝉了缘', desc: '缘了缘续，因果自了' } },
  66: { id: 66, name: '白骨平冤', act: 4, type: 'event', icon: '✦',
    fate: '渡', echo: '战副→白骨三戏呼应(第16难)',
    dark: '【金光】白骨夫人坟前，你替她立碑。【暗红】她曾是难簿上第19笔，求你杀她好投明白胎。【灰黑】如今碑上写"戏中人"——算是还她一个名。',
    intro: '白骨平冤，为白骨夫人立碑，或化灰入土。',
    options: [
      { key: '渡', label: '【渡】立', fate: '渡', effect: { alignGood: 20 } },
      { key: '隐', label: '【隐】化灰入土', fate: '隐', effect: {} }
    ] },
  67: { id: 67, name: '黄袍放情', act: 4, type: 'fight', icon: '⚔',
    fate: '隐', echo: '战副→黄袍掳公主呼应(第17难)',
    dark: '【金光】奎木狼要带被贬的情人私奔，天兵来追。【暗红】你挡在前面：天条关你何事？【灰黑】他不过是想陪一个人，过完被人拆散的那一世。',
    intro: '黄袍放情，护奎木狼私奔，或战天庭追兵。',
    options: [
      { key: '隐', label: '【隐】护', fate: '隐', effect: {} },
      { key: '战', label: '【战】战天兵', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } }
    ] },
  68: { id: 68, name: '平顶收宝', act: 4, type: 'fight', icon: '⚔',
    fate: '夺', echo: '战副→平顶山宝呼应(第18难)',
    dark: '【金光】老君的道具库，金角银角守了一出"被收"的戏。【暗红】你这次不配合。【灰黑】真葫芦、金刚琢，连那炉灰，一并端了。',
    intro: '平顶收宝，真夺老君道具库，或砸炉泄愤。',
    options: [
      { key: '夺', label: '【夺】夺', fate: '夺', effect: {refill: true} },
      { key: '逆', label: '【逆】砸炉', fate: '逆', effect: { alignEvil: 15 } }
    ] },
  69: { id: 69, name: '乌鸡复国', act: 4, type: 'event', icon: '✦',
    fate: '缘', echo: '渡副→乌鸡井龙呼应(第19难)',
    dark: '【金光】青狮还坐在龙椅上，扮了三年国王。【暗红】你扶真王复位，狮王下座。【灰黑】它嘟囔：妖坐龙椅，原比人像样。',
    intro: '乌鸡复国，扶真国王复位，或立新王。',
    options: [
      { key: '渡', label: '【渡】扶', fate: '渡', effect: { alignGood: 20 } },
      { key: '逆', label: '【逆】立新王', fate: '逆', effect: { alignEvil: 10, fuxinwang: true } }
    ],
    hidden: { hero: 'bajie', cond: '逆 + 扶新王', job: '天蓬复称', desc: '重称天蓬，倒海翻江' } },
  70: { id: 70, name: '火云逆父', act: 4, type: 'fight', icon: '⚔',
    fate: '逆', echo: '战副→红孩真火呼应(第20难)',
    dark: '【金光】红孩儿的三昧真火，本是他爹悟空在八卦炉里偷学的。【暗红】你助他认悟空为父、叛了牛魔。【灰黑】子承的，原是"逆"业。',
    intro: '火云逆父，助红孩认悟空为父叛牛魔，或一家团圆。',
    options: [
      { key: '战', label: '【战】叛', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '缘', label: '【缘】一家', fate: '缘', effect: {} }
    ] },
  71: { id: 71, name: '黑水解咒', act: 4, type: 'event', icon: '✦',
    fate: '缘', echo: '渡副→黑水鼍龙呼应(第21难)',
    dark: '【金光】鼍龙颈上的"血统不纯"咒，是西海龙族自己下的。【暗红】你解了它，它愣住。【灰黑】原来不是命不配，是有人不许它配。',
    intro: '黑水解咒，解鼍龙血统咒，或放其归海。',
    options: [
      { key: '渡', label: '【渡】解', fate: '渡', effect: { alignGood: 15 } },
      { key: '隐', label: '【隐】归海', fate: '隐', effect: {} }
    ] },
  72: { id: 72, name: '贬退反转', act: 4, type: 'event', icon: '✦',
    fate: '逆', echo: '渡副→贬退心猿呼应(第22难)',
    dark: '【金光】你亲手为悟空摘下紧箍。【暗红】咒褪的一刻，他火眼金睛第一次不为你疼。【灰黑】你说：这一难，该我来担。',
    intro: '贬退反转，你为悟空摘下紧箍，或共担其苦。',
    options: [
      { key: '逆', label: '【逆】摘咒', fate: '逆', effect: { circletToEnemy: true } },
      { key: '渡', label: '【渡】共担', fate: '渡', effect: { alignGood: 15 } }
    ] },
  73: { id: 73, name: '宝象破笼', act: 4, type: 'fight', icon: '⚔',
    fate: '战', echo: '渡副→宝象变虎呼应(第24难)',
    dark: '【金光】宝象国笼里锁着被变虎的取经人。【暗红】你破笼放虎，它回头看你一眼。【灰黑】原来被写进经书的，也曾是想做人的。',
    intro: '宝象破笼，破笼救出变虎的取经人，或放其归山。',
    options: [
      { key: '战', label: '【战】破', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】放', fate: '渡', effect: { alignGood: 10 } }
    ] },
  74: { id: 74, name: '金兜碎琢', act: 4, type: 'fight', icon: '⚔',
    fate: '夺', echo: '战副→金兜金刚呼应(第25难)',
    dark: '【金光】你亲手碎了金刚琢——那能套尽三界兵器的，连"天命"也能套。【暗红】碎片落地一声轻响。【灰黑】像是天庭松了口气，又像是它哽住了。',
    intro: '金兜碎琢，碎金刚琢断"天命套"，或战老君化身。',
    options: [
      { key: '逆', label: '【逆】碎', fate: '逆', effect: {alignEvil: 15} },
      { key: '战', label: '【战】战老君化身', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } }
    ],
    treasure: { id: 'zhuosui', phase: 'in', effect: '敌攻-40%永久' } },
  75: { id: 75, name: '女儿国种', act: 4, type: 'event', icon: '✦',
    fate: '缘', echo: '渡副→女王招亲呼应(第27难)',
    dark: '【金光】女儿国的"种"，女王求了一路。【暗红】你把它还给她。【灰黑】不是夫，不是经，是她自己走出这片国、再不必求人的资格。',
    intro: '女儿国种，还女王"种"的自由，或携种走。',
    options: [
      { key: '渡', label: '【渡】还', fate: '渡', effect: { alignGood: 20 } },
      { key: '逆', label: '【逆】携种走', fate: '逆', effect: {alignEvil: 10} }
    ] },
  76: { id: 76, name: '蝎歌彻听', act: 4, type: 'event', icon: '✦',
    fate: '缘', echo: '渡副→蝎精摄僧呼应(第28难)',
    dark: '【金光】蝎子精的倒马毒专克佛门，她是第一个"用佛的办法破佛"的人。【暗红】你听她唱完那支歌。【灰黑】才懂：破佛的，从来不是外道。',
    intro: '蝎歌彻听，听蝎精歌破佛，或合奏一曲。',
    options: [
      { key: '渡', label: '【渡】听', fate: '渡', effect: {} },
      { key: '隐', label: '【隐】合奏', fate: '隐', effect: {} }
    ] },
  77: { id: 77, name: '真假归一', act: 4, type: 'story', icon: '☯',
    fate: '逆', echo: '渡副→悟空/六耳线·归一(第29难)',
    dark: '【金光】六耳与悟空，本就是一个"可能"的两面。【暗红】你选合一，它们便归一。【灰黑】从此齐天，不只是大圣的名，也是你肯认下的"另一个我"。',
    intro: '真假归一，六耳与悟空合一，或各走各路。',
    options: [
      { key: '逆', label: '【逆】合一', fate: '逆', effect: { jobConfirm: '齐天·大圣' } },
      { key: '渡', label: '【渡】各走', fate: '渡', effect: { alignGood: 15 } }
    ] },
  78: { id: 78, name: '火焰重燃', act: 4, type: 'fight', icon: '⚔',
    fate: '逆', echo: '战副→火焰借扇呼应(第30难)',
    dark: '【金光】铁扇公主守的山，是假的不让你过，真的她不敢烧。【暗红】你助她熄了假山、燃起真火。【灰黑】牛魔王的背叛，不必再用一座山来挡。',
    intro: '火焰重燃，助铁扇熄假山燃真火，或得真扇。',
    options: [
      { key: '战', label: '【战】燃', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '缘', label: '【缘】借得扇法真言', fate: '缘', effect: {refill: true} }
    ] },
  79: { id: 79, name: '祭赛还光', act: 4, type: 'event', icon: '✦',
    fate: '渡', echo: '战副→祭赛金光呼应(第31难)',
    dark: '【金光】舍利归寺，金光寺的暗才退。【暗红】碧波潭龙女偷舍利献天，只为向上爬。【灰黑】你把光还回去，照的却是妖界跪着求上进的路。',
    intro: '祭赛还光，舍利归寺照妖，或留灯自用。',
    options: [
      { key: '渡', label: '【渡】还', fate: '渡', effect: { alignGood: 20 } },
      { key: '夺', label: '【夺】留灯', fate: '夺', effect: {} }
    ] },
  80: { id: 80, name: '小雷音破', act: 4, type: 'fight', icon: '⚔',
    fate: '战', echo: '渡副→小雷音假佛呼应(第33难)；↔56难灵山无字（假佛↔无字碑，真假灵山之辨）',
    dark: '【金光】人种袋碎了，黄眉童儿的莲台塌了。【暗红】山门护法来收，却笑问：你分得清真假吗？【灰黑】你踩过碎袋：假的佛，碎了才是真。',
    intro: '小雷音破，碎人种袋破"假佛"，或战护法影。',
    options: [
      { key: '逆', label: '【逆】碎', fate: '逆', effect: {alignEvil: 15, refill: true} },
      { key: '战', label: '【战】战护法影', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } }
    ] },
};

// ============================================================
// TRIAL_BOSS（重排后难号 → 登场敌方名）
NDX.TRIAL_BOSS = {
  1: '天庭贬谪使', 2: '刘洪水卒', 3: '前世金身·江流残识', 4: '水贼刘洪', 5: '城隍虎精', 6: '双叉岭陷坑魔',
  7: '取经残魂', 8: '五行山石魔', 9: '鹰愁涧白龙', 10: '虎先锋', 11: '黄风怪·风沙', 12: '黄风怪·三昧神风',
  13: '黄风大圣', 14: '流沙河妖·初渡', 15: '四圣试禅心·幻影', 16: '流沙九颅煞', 17: '流沙河神', 18: '流沙河沙僧',
  19: '镇元子道童', 20: '白骨夫人', 21: '紧箍咒灵', 22: '奎木狼', 23: '黄袍怪', 24: '金角大王',
  25: '乌鸡青狮精', 26: '黑水鼍龙', 27: '圣婴红孩儿', 28: '虎力大仙', 29: '车迟三妖', 30: '车迟狱卒',
  31: '虎力大仙·车迟魁首', 32: '陈家庄祭灵', 33: '灵感大王', 34: '通天河冰魔', 35: '青牛精', 36: '金鱼精·灵感大王',
  37: '如意真仙', 38: '女儿国王', 39: '如意真仙·守泉', 40: '蝎子精', 41: '六耳猕猴·影', 42: '花果山假猴兵',
  43: '谛听兽', 44: '灵山法相', 45: '六耳猕猴', 46: '铁扇公主', 47: '火焰山火灵', 48: '牛魔王',
  49: '牛魔王·芭蕉洞主', 50: '九头虫', 51: '金光寺妖僧', 52: '碧波潭水妖', 53: '万圣龙女·乱石山伏', 54: '九头虫·碧波潭',
  55: '荆棘岭树精', 56: '黄眉童儿', 57: '赛太岁', 58: '金翅大鹏雕', 59: '白鹿精·国丈', 60: '灭法国兵',
  61: '南山大王', 62: '凤仙郡旱魃', 63: '黄狮精', 64: '九灵元圣', 65: '玄英洞犀牛精', 66: '天竺玉兔精',
  67: '寇员外冤魂', 68: '玉兔宫娥', 69: '月宫桂影·嫦娥影', 70: '捣药玉兔', 71: '玉兔遁影', 72: '天竺玉兔精',
  73: '雷音门前考', 74: '传经索人事', 75: '无字经护法', 76: '太上老君化身', 77: '大圣残躯·无字碑', 78: '凌云渡夫',
  79: '晒经石灵', 80: '接引使者', 81: '通天河老鼋',
};
// 取某劫难的登场敌方名称，找不到则用劫难名本身兜底。
// 兼容 trial.id / trial.trialId（s.pending 里用 trialId），以及 trial.name / trial.title（兜底展示）。
NDX.trialBossName = function (trial) {
  if (!trial) return '劫难';
  const id = (trial.id != null) ? trial.id : (trial.trialId != null ? trial.trialId : null);
  if (id != null && NDX.TRIAL_BOSS[id]) return NDX.TRIAL_BOSS[id];
  const label = trial.name || trial.title || null;
  return (label && label.indexOf('（') >= 0) ? label.split('（')[0] : (label || '劫难');
};
