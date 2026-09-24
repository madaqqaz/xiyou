// ============================================================================
// trials_ch9.js — 《逆道西行》八十一难 · 第 9 章（难 76–81，骨架 v1.19 对齐）
// 拆分依据：骨架 v1.19 九章边界（合入式，保持 NDX.TRIAL_LIB 单对象接口）
// act 字段按指令统一设为 9（后续由 trials_return.js 的 normalizeTrialLibAct() 重新派生）。
// 内容来源：《第九章_灵山之劫_76-81难_新版.md》(v3.0 终版 · 骨架 v1.19 对齐)。
// 结构：76-77 金平府·三只犀牛精(复合·2难合并·系数×2) / 78 天竺国·玉兔精 / 79 铜台府·寇员外 /
//       80 凌云渡·脱胎换骨 / 81 灵山·取经(章末Boss·最终六道结局)。
// 通用机制：76-77 三犀「佛祖相」拟态人形＋78 玉兔精拟态人形 → 唐僧斥语(玩方伤害-80%)；
//           破幻＝照妖镜(破后该难【逆】关闭)／唤土地山神作证(渡·耗寿10天)；79-81 叙事抉择难不触发。
//           本章零必需配件；食人红线无触发点→【逆】【缘】全部可用。
// ============================================================================
NDX.TRIAL_LIB = Object.assign(NDX.TRIAL_LIB || {},
{
  76: {
    id: 76,
    name: '金平府·三只犀牛精',
    act: 9,
    type: 'fight',
    icon: '🐂',
    portrait: '辟寒大王',
    fate: '战',
    echo: '复合(76-77)×2·六道全(战/渡/隐/缘/逆/夺)；三犀假佛·唐僧斥语-80%·照妖镜破幻关逆；蓝劫印；配件零',
    branchKey: 'n76_jinping',
    dark: '金平府三只犀牛——辟寒、辟暑、辟尘大王，在青龙山玄英洞占山为王，假扮佛祖，每年收一万五千斤香油。你说它们是假佛。它们笑：假佛便不能收香油吗？你答不上来。它们呈的是佛祖相，一副金身慈悲的模样，你一动兵器，唐僧便飘出斥语，你的力先散了八成，得用照妖镜照破本相，或唤土地山神作证。这一难不是要你降妖，是要你回答：假佛，到底能不能收香油。你站在佛前，忽然分不清拜的是一尊金身，还是那一万五千斤香油。',
    intro: '青龙山下，三犀端坐佛龛，香油漫地。破人形：照妖镜，或唤土地山神作证（渡·耗寿10天）。',
    options: [
      { key: '战', label: '以力降妖，斗三天三夜', fate: '战', effect: { alignEvil: 10, ti: { atk: 14, hp: 64 }, treasure: 'tre_jinping_jia' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n76_jinping:zhan', consequence: '四木禽星赶来，辟寒被井木犴咬死，辟暑辟尘斩首。金平府再无假佛收香油。【假佛的终结者】' },
      { key: '渡', label: '请四木禽星来收犀牛', fate: '渡', effect: { alignGood: 16, treasure: 'chan_jinping' }, fight: true, setFlag: 'n76_jinping:du', consequence: '角木蛟、斗木獬、奎木狼、井木犴立洞前，三犀现形就擒。金平府再无假佛。【假佛的点化者】' },
      { key: '隐', label: '混入玄英洞，点破破绽', fate: '隐', effect: { alignGood: 10, eva: 10, treasure: 'shanwen_jinping' }, setFlag: 'n76_jinping:yin', consequence: '你变作香油探得破绽：收香油是为自吃，非普度。点破「佛非佛，是心」，四木禽星收走三犀。【假佛的看破者】' },
      { key: '缘', label: '点化三犀，随行西天', fate: '缘', effect: { alignGood: 20, follower: 'sanxi_niu_yaomo' }, setFlag: 'n76_jinping:yuan', consequence: '三犀跪地拜师，成宠物【三只犀牛·妖形态】(释放香油致敌昏迷)。【假佛的成全者】' },
      { key: '逆', label: '不请星宿不用法宝，纯力折服', fate: '逆', ni: true, effect: { alignEvil: 10, niSutra: 'ni_jinping', ally: 'sanxi_niu_ren' }, fight: true, requireNoTreasure: 'tre_xini_jiao', setFlag: 'n76_jinping:ni', consequence: '未请救兵未用法宝，纯凭实力打倒三犀。它们叩首：随你反抗西天。得逆道经文＋逆随从【三只犀牛·人形态】。【假佛的征服者】' },
      { key: '夺', label: '夺三犀的角作法宝', fate: '夺', effect: { alignEvil: 16, treasure: 'tre_xini_jiao', ti: { hp: 30 } }, fight: true, setFlag: 'n76_jinping:duo', consequence: '击败三犀夺其角，得法宝【三只犀牛的角】(治百病·香油致敌昏迷)。三犀法力尽失。【犀牛角入手】' }
    ]
  },
  77: {
    id: 77,
    name: '金平府·收犀牛（结算）',
    act: 9,
    type: 'event',
    icon: '🐂',
    fate: '战',
    echo: '复合第2难·依76抉择结算；蓝劫印；六道+1',
    branchKey: 'n76_jinping',
    dark: '四木禽星赶到时，三只犀牛的佛祖相先裂了——角木蛟、斗木獬、奎木狼、井木犴立在洞前，它们现了原形，辟寒被井木犴咬死，辟暑、辟尘被斩首。你可以请这四位星宿来收，也可以与它们死战三天三夜；可以变作香油混进洞去，点破它们——收香油是为自己吃，不是普度众生，你一句佛非佛是心，让它们自己愣在原地；也可以点化它们，收进队伍。金平府再没有假佛收香油。只有那些年年纳香油的人家，手里还攥着没交出去的香油，不知道明年该往哪送。',
    intro: '金平府复合劫难统一结算。',
    options: [
      { key: '战', label: '假佛的终结者', fate: '战', effect: { alignEvil: 5 }, requireFlag: 'n76_jinping:zhan', consequence: '六道+1(战)；获蓝劫印。后续：正常流程。' },
      { key: '渡', label: '假佛的点化者', fate: '渡', effect: { alignGood: 6 }, requireFlag: 'n76_jinping:du', consequence: '六道+1(渡)；获蓝劫印。后续：正常流程。' },
      { key: '隐', label: '假佛的看破者', fate: '隐', effect: { alignEvil: 3 }, requireFlag: 'n76_jinping:yin', consequence: '六道+1(隐)；获蓝劫印。后续：正常流程。' },
      { key: '缘', label: '假佛的成全者', fate: '缘', effect: { alignGood: 5 }, requireFlag: 'n76_jinping:yuan', consequence: '六道+1(缘)；获蓝劫印。三犀在队→后续香油相关战斗难度降低。' },
      { key: '逆', label: '假佛的征服者', fate: '逆', effect: { alignEvil: 6 }, requireFlag: 'n76_jinping:ni', consequence: '六道+1(逆)；获蓝劫印。三犀在队→后续战斗难度降低。' },
      { key: '夺', label: '犀牛角入手', fate: '夺', effect: { alignEvil: 5 }, requireFlag: 'n76_jinping:duo', consequence: '六道+1(夺)；获蓝劫印。【三只犀牛的角】在身。' }
    ],
    branches: {
      zhan: { intro: '四木禽星立洞前，辟寒被咬死，辟暑辟尘斩首。金平府再无假佛收香油。' },
      du: { intro: '四木禽星收伏三犀，金平府再无假佛。' },
      yin: { intro: '你点破「佛非佛，是心」，三犀愣住——和尚，你说得对。四木禽星将它们收走。' },
      yuan: { intro: '三犀跪地拜师：师父，我们懂了，佛是修行的。它们随你西行。' },
      ni: { intro: '三犀倒在大殿，眼里第一次有了光：你是头一个不靠星宿法宝打倒我们的人。它们叩首随你反抗西天。' },
      duo: { intro: '你夺了犀牛角，三犀法力尽失，你带角西行。' }
    }
  },
  78: {
    id: 78,
    name: '天竺国·玉兔精',
    act: 9,
    type: 'fight',
    icon: '🌕',
    portrait: '玉兔精',
    fate: '战',
    echo: '单劫·六道(战/渡/隐/缘/逆·无夺)；玉兔拟态人形·唐僧斥语-80%；八戒本心点⑥(守本心等嫦娥→嫦娥揭穿王母设局→大彻大悟)；蓝劫印',
    dark: '天竺国玉兔精，本是广寒宫捣玄霜仙药的玉兔，偷了玉杵下界为妖。它变作天竺国公主的模样，登楼抛绣球，那绣球不偏不倚打中你。国王大喜，招你为驸马，满朝张灯结彩。洞房里，它支开众人，看着你笑：和尚，假公主便不能招驸马吗？你答不上来。它要以你的元阳成太乙上仙。你可以将计就计应下这门亲，可以趁夜逃走不做这驸马，也可以星夜去广寒宫请嫦娥——只是嫦娥一来，一句玉兔儿还不回家，这出戏便收场了，真公主才从冷宫里出来。',
    intro: '绣球打中你，国王招驸马。洞房里玉兔支开众人：和尚，假公主便不能招驸马吗？',
    options: [
      { key: '战', label: '将计就计，假意应亲后降妖', fate: '战', effect: { alignEvil: 5, ti: { atk: 9, hp: 38 }, treasure: 'tre_yuchu' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n78_tianzhu:zhan', consequence: '你未请嫦娥、凭实力击败玉兔，得法宝【玉杵】(攻击+)。真公主获救，国王团聚。【假公主的终结者】' },
      { key: '渡', label: '星夜请来嫦娥收伏', fate: '渡', effect: { alignGood: 8, treasure: 'chan_tianzhu' }, setFlag: 'n78_tianzhu:du', consequence: '嫦娥立殿一句「玉兔儿还不回家」，玉兔现原形随归广寒宫。真公主出冷宫，国王团聚。【假公主的点化者】' },
      { key: '隐', label: '趁夜逃走，不做这驸马', fate: '隐', effect: { alignGood: 5, eva: 8, treasure: 'shanwen_tianzhu' }, setFlag: 'n78_tianzhu:yin', consequence: '你连夜带徒出城，玉兔继续假冒公主，真公主获救无望。最终六道强制为隐。仅得劫印。【假公主的看破者】' },
      { key: '缘', label: '点化玉兔，随行西天', fate: '缘', effect: { alignGood: 10, follower: 'yutu_yaomo' }, setFlag: 'n78_tianzhu:yuan', consequence: '玉兔被点化，跪地拜师，成宠物【玉兔精·妖形态】(玉杵与寒雾)。【假公主的成全者】' },
      { key: '逆', label: '不请嫦娥不用法宝，纯力收服', fate: '逆', ni: true, effect: { alignEvil: 5, ally: 'yutu_suidixing' }, fight: true, requireNoTreasure: 'tre_yuchu', setFlag: 'n78_tianzhu:ni', consequence: '未请救兵未用法宝，纯凭实力收服。玉兔弃公主相叩首：随你反抗西天。得随行弟子【玉兔精】(玉杵与寒雾·非随从位)。【假公主的收服者】' }
    ]
  },
  79: {
    id: 79,
    name: '铜台府·寇员外',
    act: 9,
    type: 'event',
    icon: '🏮',
    portrait: '寇员外',
    fate: '战',
    echo: '单劫·六道全(战/渡/隐/缘/逆/夺)；寇妻(凡人)慈悲-80%潜在；蓝劫印；配件零',
    dark: '铜台府地灵县，寇员外斋僧一万，你们师徒恰是他斋的第一万个。他大喜，留你们住了半个月。当晚强盗闯门，打死寇员外、抢了家产；寇妻反告是唐僧师徒所为，官府把你们下了狱。你在牢里明白：这一难不叫你降妖，只问一句——当善的代价是被冤枉，你还善不善。你可以打出大牢，把铜台府闹翻天；可以让悟空设计让寇员外还魂，说出真相；可以趁夜逃走，让这桩冤案烂在牢里；也可以点化寇妻。寇员外还魂那一夜，灯火亮得刺眼，他说的第一句话，是谢你们救他，还是谢你们害他。',
    intro: '铜台府大牢，师徒蒙冤。寇妻在堂上指认，强盗在外逍遥。',
    options: [
      { key: '战', label: '打出大牢，强行洗冤', fate: '战', effect: { alignEvil: 5, ti: { atk: 9, hp: 38 }, treasure: 'tre_tongtai_jia' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n79_tongtai:zhan', consequence: '你打出大牢闹翻铜台府，官府重查，强盗被抓、寇员外还魂。【善的终结者】' },
      { key: '渡', label: '用计让寇员外还魂', fate: '渡', effect: { alignGood: 8, treasure: 'chan_tongtai' }, setFlag: 'n79_tongtai:du', consequence: '悟空设计让寇员外还魂，说出真相。官府释放师徒，强盗被抓。【善的点化者】' },
      { key: '隐', label: '趁夜逃走，不洗冤', fate: '隐', effect: { alignGood: 5, eva: 8, treasure: 'shanwen_tongtai' }, setFlag: 'n79_tongtai:yin', consequence: '你连夜带徒逃出大牢。铜台府仍认定是师徒所为，寇员外冤屈无人洗清。仅得劫印。【善的看破者】' },
      { key: '缘', label: '点化寇妻，随行西天', fate: '缘', effect: { alignGood: 10, follower: 'kouqi_ren' }, setFlag: 'n79_tongtai:yuan', consequence: '你点化寇妻（五百年前你也被人冤过），她说出真相、夫妻团聚，被点化成宠物【寇妻·人形态】(召唤斋饭)。【善的成全者】' },
      { key: '逆', label: '不请救兵不用法宝，纯力折服', fate: '逆', ni: true, effect: { alignEvil: 5, niSutra: 'ni_kouyuanwai', ally: 'kouyuanwai_ren' }, fight: true, requireNoTreasure: 'tre_koujiachan', setFlag: 'n79_tongtai:ni', consequence: '未请救兵未用法宝，纯凭实力击败强盗、让寇员外还魂。他叩首：随你反抗西天。得逆道经文＋逆随从【寇员外·人形态】(召唤斋饭)。【善的征服者】' },
      { key: '夺', label: '夺寇员外的家产作法宝', fate: '夺', effect: { alignEvil: 8, treasure: 'tre_koujiachan', ti: { hp: 30 } }, fight: true, setFlag: 'n79_tongtai:duo', consequence: '击败强盗后夺寇员外家产，得法宝【寇员外的家产】(金钱+50%·召唤斋饭)。寇员外一贫如洗。【寇员外家产入手】' }
    ]
  },
  80: {
    id: 80,
    name: '凌云渡·脱胎换骨',
    act: 9,
    type: 'event',
    icon: '🌉',
    portrait: '接引佛祖',
    fate: '渡',
    echo: '单劫·六道全(战/渡/隐/缘/逆/夺)；无战斗叙事抉择；A7.2八戒情缘路线「渡」＝撒魂节点；蓝劫印；配件零',
    dark: '凌云渡只有一根独木桥，横在万丈深渊上。唐僧不敢过，悟空、八戒、沙僧都过去了，他一个人站在桥头，吓得浑身发抖。后来接引佛祖撑着一只无底船来接：上船吧。上得船去，凡胎便脱。你站在桥头，看着那具凡胎的尸体顺水漂走——那是唐僧用了十几年的身子，一路挑担、挨饿、受惊，最后连一句话都没留下。接引佛祖说，渡的就是这一具。这一难不是要你降妖，是要你回答：当成佛的代价是脱凡胎，你还成不成。船在水上，不沉也不动。',
    intro: '凌云渡桥头，独木桥横，深渊无底。接引佛祖撑船而来。',
    options: [
      { key: '战', label: '打死接引佛祖，强行过河', fate: '战', effect: { alignEvil: 5, ti: { atk: 9, hp: 38 }, treasure: 'tre_lingyun_jia' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n80_lingyun:zhan', consequence: '你与接引佛祖大战三天三夜将他打死，强行过河不脱凡胎。【凡胎的终结者】' },
      { key: '渡', label: '上船脱凡胎，成佛', fate: '渡', effect: { alignGood: 8, treasure: 'chan_lingyun' }, setFlag: 'n80_lingyun:du', consequence: '你上船脱了凡胎，凡胎尸体顺水漂走，成了佛。若全程走八戒情缘路线，此「渡」为八戒撒魂节点。【凡胎的点化者】' },
      { key: '隐', label: '绕道而行，不过凌云渡', fate: '隐', effect: { alignGood: 5, eva: 8, treasure: 'shanwen_lingyun' }, setFlag: 'n80_lingyun:yin', consequence: '你带徒绕开凌云渡从后山西行。凌云渡照旧无人敢过。仅得劫印。【凡胎的看破者】' },
      { key: '缘', label: '点化接引佛祖，随行西天', fate: '缘', effect: { alignGood: 10, follower: 'jieyin_ren' }, setFlag: 'n80_lingyun:yuan', consequence: '你点化接引佛祖，他跪地拜师，成宠物【接引佛祖·人形态】(渡船·使敌无法行动)。【凡胎的成全者】' },
      { key: '逆', label: '不请救兵不用法宝，纯力折服', fate: '逆', ni: true, effect: { alignEvil: 5, niSutra: 'ni_jieyin', ally: 'jieyin_ren_ni' }, fight: true, requireNoTreasure: 'tre_jieyin_chuan', setFlag: 'n80_lingyun:ni', consequence: '未请救兵未用法宝，纯凭实力击败接引佛祖。他叩首：随你反抗西天。得逆道经文＋逆随从【接引佛祖·人形态】(渡船)。【凡胎的征服者】' },
      { key: '夺', label: '夺接引佛祖的船作法宝', fate: '夺', effect: { alignEvil: 8, treasure: 'tre_jieyin_chuan', ti: { hp: 30 } }, fight: true, setFlag: 'n80_lingyun:duo', consequence: '击败接引佛祖后夺其船，得法宝【接引佛祖的船】(主动·渡敌全体无法行动3回合)。接引佛祖法力尽失。【接引佛祖的船入手】' }
    ]
  },
  81: {
    id: 81,
    name: '灵山·取经',
    act: 9,
    type: 'boss',
    icon: '📿',
    portrait: '阿傩、迦叶',
    fate: '渡',
    bossName: '传经吏·索经',
    heart: true,
    echo: '章末Boss·最终六道结局(战/渡/隐/缘/逆/夺)；阿傩迦叶索人事传无字经；红劫印；配件零·夺产【阿傩、迦叶的法宝】',
    dark: '灵山之上，如来让阿傩、迦叶传经。他们伸手要人事，唐僧没有，只取了一摞无字的白本。后来燃灯古佛让白雄尊者把经抢走，师徒才发现那纸上一字皆无；回头再上灵山，把那只紫金钵盂递过去，才换得有字真经。这一难不是要你降妖，是要你回答：当真经的代价是人事，你还取不取。你可以打死阿傩、迦叶硬抢，可以把钵盂给他们换真经，可以绕开灵山一去不回头，可以点化他们，也可以趁乱夺下那对能传一切经的法宝。取完这一部经，八十一难便算走完——只是那部无字的白本，谁也没提它后来去了哪儿。',
    intro: '灵山藏经阁前，阿傩、迦叶捻指而笑：传经岂能白传？人事拿来。',
    options: [
      { key: '战', label: '打死阿傩迦叶，强行取经', fate: '战', effect: { alignEvil: 5, ti: { atk: 9, hp: 38 }, treasure: 'tre_lingshan_jia' }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n81_lingshan:zhan', ending: '逆道西行', consequence: '你与阿傩迦叶大战三天三夜将他们打死，强行取有字真经。真经无人能懂，大唐依旧黑暗，你成逆道祖师。【人事的终结者】' },
      { key: '渡', label: '奉紫金钵盂，取有字真经', fate: '渡', effect: { alignGood: 8, treasure: 'chan_lingshan' }, setFlag: 'n81_lingshan:du', ending: '普渡众生', consequence: '你把紫金钵盂给了阿傩迦叶，取有字真经回大唐普渡众生，成旃檀功德佛。【人事的点化者】' },
      { key: '隐', label: '绕道而行，不取真经', fate: '隐', effect: { alignGood: 5, eva: 8, treasure: 'shanwen_lingshan' }, setFlag: 'n81_lingshan:yin', ending: '空门西行', consequence: '你带徒绕开灵山从后山西行。灵山照旧无人能取真经。仅得劫印，回大唐出家为僧。【人事的看破者】' },
      { key: '缘', label: '点化阿傩迦叶，随行回唐', fate: '缘', effect: { alignGood: 10, follower: 'anuo_ren' }, setFlag: 'n81_lingshan:yuan', ending: '师徒西行', consequence: '你点化阿傩迦叶，他们跪地拜师，成随从【阿傩、迦叶·人形态】(传经·使敌昏迷)，随你回大唐。【人事的成全者】' },
      { key: '逆', label: '不请救兵不用法宝，纯力折服', fate: '逆', ni: true, effect: { alignEvil: 5, niSutra: 'ni_anuo', ally: 'anuo_ren_ni' }, fight: true, requireNoTreasure: 'tre_anuo_fabao', setFlag: 'n81_lingshan:ni', ending: '逆道祖师', consequence: '未请救兵未用法宝，纯凭实力击败阿傩迦叶。他们叩首：随你反抗西天。得逆道经文＋逆随从【阿傩、迦叶·人形态】(传经)。【人事的征服者】' },
      { key: '夺', label: '夺阿傩迦叶的法宝', fate: '夺', effect: { alignEvil: 8, treasure: 'tre_anuo_fabao', ti: { hp: 30 } }, fight: true, setFlag: 'n81_lingshan:duo', ending: '法宝西行', consequence: '击败阿傩迦叶后夺其法宝，得【阿傩、迦叶的法宝】(主动·传经使敌全体昏迷3回合)。二尊法力尽失。【阿傩、迦叶的法宝入手】' }
    ],
    treasure: { id: 'lingshan_sheli', type: 'treasure', note: '阿傩、迦叶·章末舍利（红劫印·章末Boss）' },
    hidden: { hero: 'wukong', cond: '逆 + 未用法宝', job: '持棒证道', hint: '灵山择「逆」、纯凭实力折服阿傩迦叶、不借法宝——棒下见真佛', desc: '持棒者以实力折服阿傩迦叶，夺回真经话语权（悟空·持棒证道前置）' }
  }
});
