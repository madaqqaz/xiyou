// =============================================================
// trials81_part2.js - 八十一难数据（第二部分：回归难/Boss难/规范化函数）
// 从 trials81.js 拆分，第1265-1577行
// 外部接口 NDX.* 保持不变，调用方无需修改
// 拆分日期: 2026-09-14
// =============================================================

NDX.RETURN_TRIALS = {
  24: { id: 24, name: '宝象变虎', act: 2, type: 'fight', icon: '⚔',
    fate: '战', echo: '渡副→宝象破笼回扣(第73难)',
    dark: '取经人被变虎锁笼，白龙马化人夜刺黄袍——它终于为自己，不是为"经"。',
    intro: '宝象国中，取经人被变猛虎锁入笼；白龙夜刺黄袍，你救主，或求原身。',
    options: [
      { key: '战', label: '【战】胜', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】求得原身', fate: '渡', effect: { alignGood: 10, rel: { 观音: +4 } } }
    ] },
  34: { id: 34, name: '七绝蟒雾', act: 3, type: 'fight', icon: '⚔',
    fate: '战', echo: '渡副→除蟒渡魂',
    dark: '七绝山红蟒食人，因山被"绝"了生路——它只是饿了千年的囚徒。',
    intro: '七绝山红蟒食人，因山被"绝"了生路；你除蟒，或喂其解脱。',
    options: [
      { key: '战', label: '【战】除蟒', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】喂其解脱', fate: '渡', effect: { alignGood: 12, rel: { 观音: +4 } } }
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
      { key: '渡', label: '【渡】求解药', fate: '渡', effect: { alignGood: 10, ti: { hp: 65, dr: 0.04 } } }
    ] },
  40: { id: 40, name: '普天神难伏', act: 2, type: 'fight', icon: '🐂',
    fate: '战', echo: '战副→青牛伏诛链(第二章准Boss)',
    dark: '独角兕套走满天神佛的兵器，笑道："你们的兵器，不过是俺老君炉里一块废铁。"悟空却不肯请神——他要凭一身筋骨，硬撼那金刚琢。',
    intro: '金兜洞外，青牛精独角兕持金刚琢而立。此琢能套尽三界兵器，众神束手。',
    // 青牛精天然机制：金刚琢=破韧+缴械（套走兵器→强制破韧+清空法宝CD）；二阶段无敌帧须以"非兵器手段"破业障槽。
    boss: '青牛精·独角兕',
    options: [
      // 正道：依传统剧情请众神助战——虽败犹荣，换得秩序赐福（减伤类永久加成）
      { key: '渡', label: '【渡】请众神助战', fate: '渡', effect: { alignGood: 25, ti: { hp: 66, dr: 0.05 } },
        rewardTitle: '秩序赐福·众神庇佑', rewardDesc: '虽败犹荣：众神感你诚心，赐下庇佑，受击减伤 +6%。',
        fight: true, bossDiff: 0.92 },
      // 逆道：不请神，以"吞金刚琢"之势硬刚——以力证道（攻击/破韧），但紧箍加深一道裂纹
      { key: '逆', label: '【逆】不请神·硬撼金刚琢', fate: '逆', effect: { alignEvil: 18, rel: { 妖王: +3 } },
        rewardTitle: '逆道劫印·以力证道', rewardDesc: '你一口吞下金刚琢的罡风，骨缝里榨出力量：攻击 +14；紧箍应声裂开一道新纹。',
        crackJingu: 1, fight: true, bossDiff: 1.18, battleFlags: { openingMomentum: 2, drainPct: 0.02 } }
    ] },
  53: { id: 53, name: '乱石山伏', act: 3, type: 'event', icon: '✦',
    fate: '缘', echo: '渡副→乱石山妖兵',
    dark: '乱石山妖兵列阵，九头虫在潭底冷笑——他偷的不是舍利，是"被看见"的资格。',
    intro: '乱石山妖兵拦路，九头虫在潭底观战；你退妖兵，或借妖势。',
    options: [
      { key: '渡', label: '【渡】退妖兵', fate: '渡', effect: { alignGood: 10, rel: { 观音: +5 } } },
      { key: '逆', label: '【逆】借妖势', fate: '逆', effect: { alignEvil: 8, yuan: { matk: 12, mdef: 0.07 } } }
    ] },
  57: { id: 57, name: '再临五行山（倒序）', act: 4, type: 'fight', icon: '⚔',
    fate: '逆', echo: '战副→悟空线；五行山回扣(第1/8难)',
    dark: '【金光】五行山下还压着一只"听话的猴"，它从不闹、从不逃，连看守都快忘了它的存在。【暗红】你伸手去揭那道帖，指腹却抖——你忽然分不清：此刻去救的，是它，还是当年本可能认命的自己？【灰黑】帖落，山下空空。原来"听话"的，从来不曾被谁真想救过。',
    intro: '再临五行山，揭帖放那只从未反抗的猴。',
    options: [
      { key: '渡', label: '【渡】放之', fate: '渡', effect: { alignGood: 20, rel: { 观音: +3 } } },
      { key: '逆', label: '【逆】取其石胆', fate: '逆', effect: { alignEvil: 10, rel: { 妖王: +4 } } }
    ],
    treasure: { id: 'duanshanfu', phase: 'passive', effect: '开局破紧箍一次' } },
  58: { id: 58, name: '重勘双叉岭', act: 4, type: 'event', icon: '✦',
    fate: '渡', echo: '战副→双叉岭残魂呼应(第7难)',
    dark: '【金光】双叉岭风里全是没念完的名字，残魂排着队，等你叫出第一个。【暗红】你为它们立碑，却不敢落一字——灵山教人写的名，写错便又是一难。【灰黑】最后碑上空着。有些魂，本就不该被写进任何簿。',
    intro: '重勘双叉岭，为历代取经人残魂立碑或焚难簿。',
    options: [
      { key: '渡', label: '【渡】立碑', fate: '渡', effect: { alignGood: 15, rel: { 观音: +5 } } },
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
      { key: '逆', label: '【逆】烧', fate: '逆', effect: { alignEvil: 15, rel: { 妖王: +5 } } }
    ],
    treasure: { id: 'bis_shui_hua', phase: 'in', effect: '火伤反弹' } },
  61: { id: 61, name: '黑风开箱', act: 4, type: 'event', icon: '✦',
    portrait: '黑熊精',
    fate: '缘', echo: '战副→黑风盗袈呼应(第10难)',
    dark: '【金光】黑风洞的箱锁着，你以为里面是袈裟。【暗红】开箱，是一匣"失败者"的残魂，它们求你释，也求你取。【灰黑】你取了。从此这笔账，有人替它们记着。',
    intro: '黑风开箱，释被藏袈裟之魂，或取走箱中宝。',
    options: [
      { key: '渡', label: '【渡】释', fate: '渡', effect: { alignGood: 15, ti: { hp: 143, dr: 0.07 } } },
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
      { key: '渡', label: '【渡】葬', fate: '渡', effect: { alignGood: 20, rel: { 观音: +4 } } },
      { key: '逆', label: '【逆】问九世因', fate: '逆', effect: {alignEvil: 10, jiushiyin: true} }
    ],
    hidden: { hero: 'shaseng', cond: '问九世因 + 降妖念珠', job: '卷帘镇妖', desc: '问尽九世因，念珠镇妖邪' } },
  64: { id: 64, name: '四圣拆庄', act: 4, type: 'event', icon: '✦',
    fate: '逆', echo: '渡副→流沙收沙呼应(第14难)',
    dark: '【金光】黎山老母的庄院，拆。【暗红】里面供着的"标本"一个个醒过来——贪心入赘的取经人，被点成了永不老的摆设。【灰黑】它们走出门，第一件事，是忘了自己曾多想当那家的婿。',
    intro: '四圣拆庄，拆毁显化庄院放出标本，或度化之。',
    options: [
      { key: '逆', label: '【逆】拆', fate: '逆', effect: { alignEvil: 10, rel: { 妖王: +5 } } },
      { key: '渡', label: '【渡】度', fate: '渡', effect: { alignGood: 15, rel: { 观音: +5 } } }
    ] },
  65: { id: 65, name: '五庄观根', act: 4, type: 'event', icon: '✦',
    fate: '缘', echo: '逆副→五庄观人参呼应(第15难)',
    dark: '【金光】你拔起人参果树，根须缠着千万取经人的尸骨当肥。【暗红】镇元子在一旁笑：树活了四万七千年。【灰黑】喂它的，从来不是土——是每一个没走到的人。',
    intro: '五庄观根，拔树见尸骨之肥，或移树重生。',
    options: [
      { key: '逆', label: '【逆】曝根', fate: '逆', effect: { alignEvil: 15, rel: { 妖王: +5 } } },
      { key: '缘', label: '【缘】移树重生', fate: '缘', effect: {} }
    ],
    hidden: { hero: 'tangseng', cond: '缘 + 缘≥3', job: '金蝉了缘', desc: '缘了缘续，因果自了' } },
  66: { id: 66, name: '白骨平冤', act: 4, type: 'event', icon: '✦',
    fate: '渡', echo: '战副→白骨三戏呼应(第16难)',
    dark: '【金光】白骨夫人坟前，你替她立碑。【暗红】她曾是难簿上第19笔，求你杀她好投明白胎。【灰黑】如今碑上写"戏中人"——算是还她一个名。',
    intro: '白骨平冤，为白骨夫人立碑，或化灰入土。',
    options: [
      { key: '渡', label: '【渡】立', fate: '渡', effect: { alignGood: 20, rel: { 观音: +3 } } },
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
      { key: '逆', label: '【逆】砸炉', fate: '逆', effect: { alignEvil: 15, rel: { 妖王: +3 } } }
    ] },
  69: { id: 69, name: '乌鸡复国', act: 4, type: 'event', icon: '✦',
    fate: '缘', echo: '渡副→乌鸡井龙呼应(第19难)',
    dark: '【金光】青狮还坐在龙椅上，扮了三年国王。【暗红】你扶真王复位，狮王下座。【灰黑】它嘟囔：妖坐龙椅，原比人像样。',
    intro: '乌鸡复国，扶真国王复位，或立新王。',
    options: [
      { key: '渡', label: '【渡】扶', fate: '渡', effect: { alignGood: 20, ti: { hp: 141, dr: 0.06 } } },
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
      { key: '渡', label: '【渡】解', fate: '渡', effect: { alignGood: 15, ti: { hp: 115, dr: 0.06 } } },
      { key: '隐', label: '【隐】归海', fate: '隐', effect: {} }
    ] },
  72: { id: 72, name: '贬退反转', act: 4, type: 'event', icon: '✦',
    fate: '逆', echo: '渡副→贬退心猿呼应(第22难)',
    dark: '【金光】你亲手为悟空摘下紧箍。【暗红】咒褪的一刻，他火眼金睛第一次不为你疼。【灰黑】你说：这一难，该我来担。',
    intro: '贬退反转，你为悟空摘下紧箍，或共担其苦。',
    options: [
      { key: '逆', label: '【逆】摘咒', fate: '逆', effect: { circletToEnemy: true } },
      { key: '渡', label: '【渡】共担', fate: '渡', effect: { alignGood: 15, rel: { 观音: +5 } } }
    ] },
  73: { id: 73, name: '宝象破笼', act: 4, type: 'fight', icon: '⚔',
    fate: '战', echo: '渡副→宝象变虎呼应(第24难)',
    dark: '【金光】宝象国笼里锁着被变虎的取经人。【暗红】你破笼放虎，它回头看你一眼。【灰黑】原来被写进经书的，也曾是想做人的。',
    intro: '宝象破笼，破笼救出变虎的取经人，或放其归山。',
    options: [
      { key: '战', label: '【战】破', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } },
      { key: '渡', label: '【渡】放', fate: '渡', effect: { alignGood: 10, rel: { 观音: +4 } } }
    ] },
  74: { id: 74, name: '金兜碎琢', act: 4, type: 'fight', icon: '⚔',
    fate: '夺', echo: '战副→金兜金刚呼应(第25难)',
    dark: '【金光】你亲手碎了金刚琢——那能套尽三界兵器的，连"天命"也能套。【暗红】碎片落地一声轻响。【灰黑】像是天庭松了口气，又像是它哽住了。',
    intro: '金兜碎琢，碎金刚琢断"天命套"，或战老君化身。',
    options: [
      { key: '逆', label: '【逆】碎', fate: '逆', effect: { alignEvil: 15, rel: { 妖王: +4 } } },
      { key: '战', label: '【战】战老君化身', fate: '战', fight: true, battleFlags: { openingMomentum: 1 } }
    ],
    treasure: { id: 'zhuosui', phase: 'in', effect: '敌攻-40%永久' } },
  75: { id: 75, name: '女儿国种', act: 4, type: 'event', icon: '✦',
    fate: '缘', echo: '渡副→女王招亲呼应(第27难)',
    dark: '【金光】女儿国的"种"，女王求了一路。【暗红】你把它还给她。【灰黑】不是夫，不是经，是她自己走出这片国、再不必求人的资格。',
    intro: '女儿国种，还女王"种"的自由，或携种走。',
    options: [
      { key: '渡', label: '【渡】还', fate: '渡', effect: { alignGood: 20, ti: { hp: 98, dr: 0.07 } } },
      { key: '逆', label: '【逆】携种走', fate: '逆', effect: { alignEvil: 10, rel: { 妖王: +3 } } }
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
      { key: '渡', label: '【渡】各走', fate: '渡', effect: { alignGood: 15, rel: { 观音: +3 } } }
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
      { key: '渡', label: '【渡】还', fate: '渡', effect: { alignGood: 20, ti: { hp: 107, dr: 0.07 } } },
      { key: '夺', label: '【夺】留灯', fate: '夺', effect: {} }
    ] },
  80: { id: 80, name: '小雷音破', act: 4, type: 'fight', icon: '⚔',
    fate: '战', echo: '渡副→小雷音假佛呼应(第33难)；↔56难灵山无字（假佛↔无字碑，真假灵山之辨）',
    dark: '【金光】人种袋碎了，黄眉童儿的莲台塌了。【暗红】山门护法来收，却笑问：你分得清真假吗？【灰黑】你踩过碎袋：假的佛，碎了才是真。',
    intro: '小雷音破，碎人种袋破"假佛"，或战护法影。',
    options: [
      { key: '逆', label: '【逆】碎', fate: '逆', effect: { alignEvil: 15, refill: true, yuan: { matk: 21, mdef: 0.06 } } },
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

// =============================================================
// 章号归一（2026-09-13 · 消除 17 地区制残留真源）
//   TRIAL_LIB 的 act 字段原按 17 地区制硬编码（1~17）。09-01 地理重排 + 09-13 九章边界重排后，
//   81 条里有 77 条与新 ACT_RANGES 章号错位（如难5-13 旧标 act2/act3，实际同属第 1 章）。
//   act 在运行时零消费（全仓只读 name / hidden / options / treasure），仅审计脚本读取，
//   且其正确值恒等于「由难号推章号」——即纯派生字段，保留字面量就是第二真源。
//   故此处按唯一真源 ACT_RANGES 归一写回，杜绝两套区划口径继续漂移。
//   注：若本文件被单独 require（未加载 data_region_config），保持原值不动，不抛错。
// =============================================================
(function normalizeTrialLibAct() {
  const R = (NDX.ACT_RANGES || []);
  if (!R.length) return;
  const actOfId = (n) => {
    for (let i = 0; i < R.length; i++) { if (n <= R[i].end) return R[i].act; }
    return R.length;
  };
  Object.keys(NDX.TRIAL_LIB || {}).forEach((k) => {
    const e = NDX.TRIAL_LIB[k];
    if (e && e.id != null) e.act = actOfId(e.id);
  });
})();

