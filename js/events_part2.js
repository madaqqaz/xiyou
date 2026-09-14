// =============================================================
// events_part2.js - 事件系统（第二部分：分支/初始礼物/商店/经文事件）
// 从 events.js 拆分，第1249-2408行
// 外部接口 NDX.* 保持不变，调用方无需修改
// 拆分日期: 2026-09-14
// =============================================================

NDX.BRANCHES = {
  lingquan: { title: '灵泉分脉', opts: [
    { text: '饮阳脉 → 体（体攻+15）', effect: { ti: { atk: 15 } }, mark: '体' },
    { text: '饮阴脉 → 愿（愿伤+18·御念+6%）', effect: { yuan: { matk: 18, mdef: 0.06 } }, mark: '愿' },
    { text: '引双脉 → 特（体+愿少量）', effect: { ti: { atk: 10, hp: 30 }, yuan: { matk: 8 } }, mark: '特' },
  ]},
  yaowang:  { title: '妖王盟约', opts: [
    { text: '接纳 → 善·控（善+20·体攻+10）', effect: { good: 20, ti: { atk: 10 } }, mark: '善·控' },
    { text: '背刺 → 恶·攻（恶+20·气血+40）', effect: { evil: 20, ti: { hp: 40 } },   mark: '恶·攻' },
    { text: '观望 → 特（金+30）',   effect: { gold: 30 },            mark: '特' },
  ]},
  hulu:     { title: '七宝妙葫', opts: [
    { text: '喊名字 → 收（体攻+12）', effect: { ti: { atk: 12 } }, mark: '收' },
    { text: '不喊 → 抗（护体+8%）',   effect: { ti: { dr: 0.08 } }, mark: '抗' },
    { text: '倒过来 → 反（气血+50）', effect: { ti: { hp: 50 } },   mark: '反' },
  ]},
};

// ============================================================
// 送行事件（初始装备赠予）—— 取消开局长安直接赐予，改为英雄历经
// 特定劫难(见 HEROES[id].initTrial)之后，进入问号(?)随机事件触发「送行」。
// 每英雄一个，grantHero 标记归属，结算时由 applyEventOpt 调用 grantInitGift 赠予
// 该英雄的 initGiftEquips / initGiftTreasure（三件初始装备+法宝）。
// 仅在 s.flags.gotInitGift[hero] 未置位时强制插入候选（见 game.js 问号分支）。
// ============================================================
NDX.INIT_GIFT_EVENTS = {
  // 取经人：第4难(六贼无踪/金山寺养)之后，唐王遣人送行，赐袈裟基座+九环锡杖+紫金钵盂
  wukong_song: { grantHero: 'wukong', title: '两界山·故人送行', portrait: '灵吉菩萨', text: '两界山下脱困未久，山路转角忽见一袭素衣老者拄杖而立——竟是南海观世音遣来的使者。他打量你这"小猴子"模样的身骨，叹道：你压了五百年，身上一件像样的护具也无，这便去西天，岂非送死？说罢解下包袱：桃木棍、草裙，外加三根救命毫毛，皆是临行傍身之物。「危难时毫毛自行飘落替劫，用尽即止，切莫轻用。」',
    opts: [
      { text: '叩谢菩萨，受下桃木棍与草裙，将三根毫毛贴身藏好（善+4）', effect: { good: 4 }, fate: '渡' },
      { text: '嘿嘿一笑，接了兵甲却把毫毛抛着玩——大圣自有主张（恶+4）', effect: { evil: 4 }, fate: '逆' },
    ]},
  tangseng_song: { grantHero: 'tangseng', title: '长安送行·西行启程', portrait: '观音菩萨', text: '长安城外，灞桥边。\n\n唐太宗亲赐锦襕袈裟、九环锡杖：「御弟，此去经年，望早归。」\n\n观音菩萨赠予紫金钵盂：「金蝉子，前三难已历，你心中已有方向。此去西行，不止取经，亦取你心中那一关。」\n\n——【行囊已备】——\n📿 袈裟护体 · 锡杖降妖 · 钵盂化斋\n\n前方黑松夜叉挡路，那是你西行第一战。去吧。',
    opts: [
      { text: '泪拜受恩，收下袈裟·锡杖·钵盂，口诵一卷平安经（善+6）', effect: { good: 6 }, fate: '渡' },
      { text: '合十谢恩，收下衣杖钵盂，却暗忖此去凶险未卜（善+2）', effect: { good: 2 }, fate: '隐' },
    ]},
  bajie_song: { grantHero: 'bajie', title: '高老庄·饯行', portrait: '沙僧', text: '你于高老庄洗去一身猪形，这夜庄主高才备酒相送。他叹道：你这模样虽丑，心却是好的。临行塞来九齿钉耙、一领贪嗔僧衣，又取出一只净坛宝盂：「成佛成妖我不懂，只盼你吃饱了，有力气走路。肚里有食，心里才不慌。」说得你鼻子一酸——上一次有人管你饭，还是天蓬元帅那会儿。',
    opts: [
      { text: '抓耙就啃庄主敬的肉，受下钉耙僧衣宝盂（善+4）', effect: { good: 4 }, fate: '渡' },
      { text: '嘿嘿受下，顺手多揣俩馒头——路远，饿不得（恶+3）', effect: { evil: 3 }, fate: '逆' },
    ]},
  xiaobailong_song: { grantHero: 'xiaobailong', title: '鹰愁涧·赠蹄', portrait: '灵吉菩萨', text: '鹰愁涧边，西海老龙王遣虾兵蟹将追来，捧着一副追风龙蹄与护心逆鳞，又托出一枚避水珠：「三太子，你既舍了龙宫去保取经人，老龙王不好空手送行。这蹄踏云、这鳞护心、这珠避水——好歹是自家本领，带上罢。莫叫外头说我西海子弟，连双鞋都没得穿。」',
    opts: [
      { text: '谢过祖父，缚上龙蹄逆鳞，衔了避水珠（善+4）', effect: { good: 4 }, fate: '渡' },
      { text: '冷着脸受下——龙宫的恩，欠着便欠着（恶+3）', effect: { evil: 3 }, fate: '逆' },
    ]},
  shaseng_song: { grantHero: 'shaseng', title: '流沙河·饯别', portrait: '沙僧', text: '流沙河岸，河底一卷帘旧部冒出水面，捧着降妖宝杖与沉沙僧袍，颈间还挂着那串降妖念珠：「大将军，你被贬这几百年，弟兄们没忘了你。这杖这袍这念珠，都是当年卷帘府的旧物——你既去保取经人，总不能空着手。河底的沙，替你攒了这些念想。」浪花一涌，旧部没入水中，只剩一串涟漪。',
    opts: [
      { text: '摩挲旧物，受下宝杖僧袍念珠，默念一句平安（善+4）', effect: { good: 4 }, fate: '渡' },
      { text: '将念珠攥出血痕，受下兵甲——从前的恨，今朝的甲（恶+3）', effect: { evil: 3 }, fate: '逆' },
    ]},
};
// 送行事件 id 列表（供 game.js 强制插入）
NDX.INIT_GIFT_EVENT_KEYS = Object.keys(NDX.INIT_GIFT_EVENTS);


// 坊市价格随档位+地区（V8.41 金币轴决断：价格随地区增长，避免后期金币通胀失去决策意义）
NDX.shopPrice = function (tier, act) {
  const base = 30 + (tier - 1) * 4;
  // 地区加成：每地区+8%，后期（地区10+）+15%，避免金币通胀
  const actMult = 1 + Math.min(0.8, (act || 1) * 0.05) + ((act || 1) >= 10 ? 0.15 : 0);
  return Math.round(base * actMult);
};

// 坊市刷新机制（V8.35 · 商店深度）：花金币刷新货架，每店限 N 次，价格随刷新上浮
NDX.SHOP_REROLL_COST = 30;        // 每次刷新花费
NDX.SHOP_REROLL_LIMIT = 2;        // 每店最多刷新次数
NDX.SHOP_REROLL_PRICE_UP = 0.20;  // 第 2 次刷新后新货价格上浮 20%（价格波动）
NDX.shopRerollPrice = function (tier, rerollCount, act) {
  const base = NDX.shopPrice(tier, act);
  if (!rerollCount || rerollCount <= 1) return base;
  return Math.round(base * (1 + NDX.SHOP_REROLL_PRICE_UP));
};

// ============================================================
// 双线事件池（V8.27 经文系统配套 · 渡线善系 8 角色 + 逆线叛逆 9 组）
// 独立问号节点：条件触发（逆线需本局选过逆）+ 英雄窗口（地区区间）+ 未触发标记（s._sutraEvDone）
// 结构：{ id, side:'ferry'|'rebel', key, name, regionMin, regionMax, text, opts }
// opts: { text, fate, alignGood/alignEvil, sutra:<fullId>（经文缺失片）, gear:<equipId>（装备）, favor }
// ============================================================
NDX.SUTRA_EVENTS = [
  // ---------- 渡线 · 善系角色（首现；系列变体实现时按同模板推进） ----------
  { id: 'du_guanyin_1', side: 'ferry', key: 'guanyin', name: '观音菩萨', regionMin: 2, regionMax: 2,
    text: '西行未久，你于江畔遇见一位白衣女尼，手捧净瓶，瓶中柳枝轻拂。她看你良久：「取经人，这一路你要渡人、渡妖、渡己。净瓶有甘露，一滴可活枯骨——可这甘露，只渡得动心怀慈悲之人。你要这甘露，还是听我一句经？」',
    opts: [
      { text: '听经——观音法门，慈悲渡厄（渡·善+10）', fate: '渡', alignGood: 10, sutra: 'su_full_dabei', favor: '观音' },
      { text: '讨甘露——此身此路，尚需活命（渡·善+6）', fate: '渡', alignGood: 6, gear: 'jade_vase' }
    ] },
  { id: 'du_wuchao_1', side: 'ferry', key: 'wuchao', name: '乌巢禅师', regionMin: 2, regionMax: 2,
    text: '浮屠山古树上结着一个草巢，巢中一僧跏趺而坐，见你来便道：「来得好，来得好。我在此等一个取经人，等了五百年。我有《心经》一卷，五十四句、二百七十字——你若要经，我传你；你若不要，这巢中还有一件旧衲衣，可御风寒。」',
    opts: [
      { text: '求经——心经一卷，照破五蕴（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_xinjing' },
      { text: '讨衣——路远风寒，旧衲傍身（渡·善+4）', fate: '渡', alignGood: 4, gear: 'wuchao_robe' },
      { text: '问禅——巢居树上，可曾跌落（隐·善+2）', fate: '隐', alignGood: 2, sutra: 'su_full_xinjing' }
    ] },
  { id: 'du_dizang_1', side: 'ferry', key: 'dizang', name: '地藏王菩萨', regionMin: 3, regionMax: 3,
    text: '山道尽头阴风骤起，一位僧袍染尘的菩萨拄锡杖而立，身侧伏着一只谛听。他开口，声音像从地底传来：「取经人，你可知地狱里也有经文？我不成佛，是因为佛把我留在那里。这杖可点化枯骨，这经可超度亡魂——你要杖，还是要经？」',
    opts: [
      { text: '求经——地藏本愿，地狱不空（渡·善+10）', fate: '渡', alignGood: 10, sutra: 'su_full_dizang' },
      { text: '讨杖——点化枯骨，亦渡亡魂（渡·善+6）', fate: '渡', alignGood: 6, gear: 'dizang_staff' },
      { text: '问谛听——它伏在菩萨脚下，听得见地狱，可听得见人心（隐）', fate: '隐', sutra: 'su_full_dizang' }
    ] },
  { id: 'du_puti_1', side: 'ferry', key: 'puti', name: '菩提祖师', regionMin: 4, regionMax: 4,
    text: '灵台方寸山间，一位白须老道闭目而坐，面前石桌摆着一枚青印。他睁眼：「你来迟了——你那位师兄，当年在此学艺，七年在灶下劈柴，一朝听得『无住生心』，便成了齐天大圣。你要这印，还是要这经？」',
    opts: [
      { text: '求经——顿悟无住，本来无一物（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_tanjing' },
      { text: '讨印——心印一枚，证我此心（渡·善+6）', fate: '渡', alignGood: 6, gear: 'puti_seal' },
      { text: '问——师兄学艺七年，为何劈柴三载才传法（隐）', fate: '隐', sutra: 'su_full_tanjing' }
    ] },
  { id: 'du_zhenyuan_1', side: 'ferry', key: 'zhenyuan', name: '镇元子', regionMin: 5, regionMax: 5,
    text: '五庄观后园，一位鹤发道者立于人参果树下，树上果子如三朝未满的孩童：「这是草还丹，闻一闻活三百六十岁，吃一个活四万七千年。取经人，你西行求经，经书能让你活多久？果子能。你要果，还是要经？」',
    opts: [
      { text: '求经——无量寿光，续命延元（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_wuliangshou' },
      { text: '讨果——取一截树枝，养在袖中（渡·善+4）', fate: '渡', alignGood: 4, gear: 'renshen_branch' },
      { text: '婉拒——活四万七千年，若都是取经这般苦，不要也罢（隐·善+4）', fate: '隐', alignGood: 4, sutra: 'su_full_wuliangshou' }
    ] },
  { id: 'du_wenshu_1', side: 'ferry', key: 'wenshu', name: '文殊菩萨', regionMin: 6, regionMax: 6,
    text: '一处道场废墟前，一位骑着青狮的菩萨停步，抽出腰间佩剑：「我斩的不是妖，是无明。你看这剑，锋芒在刃，慧在无刃——剑可斩人，亦可斩我执。取经人，你一路除妖，可曾除过自己的妄念？要剑，还是要经？」',
    opts: [
      { text: '求经——耳根圆通，返闻闻自性（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_lengyan' },
      { text: '讨剑——慧剑斩无明，也斩拦路妖（渡·善+6）', fate: '渡', alignGood: 6, gear: 'wenshu_sword' },
      { text: '问——菩萨乘青狮，狮子可也悟道（隐·善+2）', fate: '隐', alignGood: 2, sutra: 'su_full_lengyan' }
    ] },
  { id: 'du_mile_1', side: 'ferry', key: 'mile', name: '弥勒佛', regionMin: 7, regionMax: 7,
    text: '路边一个胖大和尚袒胸露腹，倚着一只布口袋打盹，见你醒来咧嘴一笑：「嘿嘿，取经人，我这口袋能装三界，黄眉怪偷去装了你那师兄。你说，是我这口袋厉害，还是你的经厉害？」他拍了拍口袋：「要经，我念给你听；要袋，我借你使一回。」',
    opts: [
      { text: '求经——会三归一，未来之佛（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_fahua' },
      { text: '讨袋——借口袋一用，装妖装鬼装不平（渡·善+4）', fate: '渡', alignGood: 4, gear: 'houtian_bag' },
      { text: '答——口袋装得下三界，可装得下未来？（隐）', fate: '隐', sutra: 'su_full_fahua' }
    ] },
  { id: 'du_randeng_1', side: 'ferry', key: 'randeng', name: '燃灯古佛', regionMin: 8, regionMax: 8,
    text: '一座破败古寺，佛前一盏灯焰如豆，一位老僧持灯而来：「这灯从我成道时点起，如今十万年，未灭过。取经人，灯是过去照来的，你是往未来走的——灯灭了，路还在吗？要灯，还是要经？」',
    opts: [
      { text: '求经——常乐我净，灭度诸苦（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_niepan' },
      { text: '讨灯——灯在，心火不灭（渡·善+6）', fate: '渡', alignGood: 6, gear: 'liuli_lamp' },
      { text: '吹一口气——看灯可灭，看我可急（隐·恶+2）', fate: '隐', alignEvil: 2, sutra: 'su_full_niepan' }
    ] },
  // ---------- 逆线 · 叛逆英雄（首现；系列变体实现时按同模板推进） ----------
  { id: 'ni_dawn_1', side: 'rebel', key: 'dawn', name: '逆道初醒', regionMin: 1, regionMax: 1,
    text: '你答了那一问，夜里梦见一本浮在江上的旧账簿。第一行墨迹洇开：「金蝉子 · 轻慢 · 十世轮回」。你伸手去翻，指尖触到一片薄薄的残页——上书一字：贪。江声如诵，有声音问：这页纸，是罪证，还是凭证？',
    opts: [
      { text: '收下残页——既是罪证，便从破戒读起（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_pojie' },
      { text: '合上账簿，当作一场梦（渡·善+2）', fate: '渡', alignGood: 2 },
      { text: '撕下残页贴身藏好，不声不响（隐·善+4）', fate: '隐', alignGood: 4, sutra: 'ni_full_pojie' }
    ] },
  { id: 'ni_baigu_1', side: 'rebel', key: 'baigu', name: '白骨夫人', regionMin: 2, regionMax: 2,
    text: '两界山道上，一个老妇颤巍巍拦路，怀里捧着几块碎骨：「行行好，帮老身埋了这骸骨罢——是我那死在虎口的儿子。」你低头看去，碎骨上爬着细密的字，像经文，又像债契。老妇的眼珠，是一对空洞的魂火。',
    opts: [
      { text: '接下碎骨，就地掩埋——白骨亦有归处（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'ni_full_yaopu' },
      { text: '点破她：虎口何来你儿，分明白骨成精（渡·善+6）', fate: '渡', alignGood: 6, favor: '观音' },
      { text: '不接不答，绕道而行——妖事莫沾（隐）', fate: '隐', sutra: 'ni_full_yaopu' }
,
      { text: '讨骨——枯骨舍利，渡己渡她（逆·恶+4）', fate: '逆', alignEvil: 4, gear: 'baigu_sheli' }
    ] },
  { id: 'ni_honghai_1', side: 'rebel', key: 'honghai', name: '红孩儿', regionMin: 4, regionMax: 4,
    text: '枯松涧火云洞前，一个赤身童子骑着牛车、手持红缨枪拦路，眉眼间全是「本王」的傲气：「兀那和尚，此山是我开。想过去？先答本王一问——我爹是牛魔王，我娘是铁扇公主，我偏不认他们，自己当大王。你说，我是反了天，还是反了家？」',
    opts: [
      { text: '答：先反的家，才反得天——叛逆亦要从头起（逆·恶+8）', fate: '逆', alignEvil: 8, sutra: 'ni_full_wuzi' },
      { text: '答：家可反，心不可失——你反的是名，不是亲（渡·善+8）', fate: '渡', alignGood: 8, favor: '观音' },
      { text: '答：既称大王，何须向人证『反』字怎么写（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_wuzi' }
,
      { text: '讨枪——红缨在手，反字当头（逆·恶+4）', fate: '逆', alignEvil: 4, gear: 'huojian_spear' }
    ] },
  { id: 'ni_nezha_1', side: 'rebel', key: 'nezha', name: '哪吒', regionMin: 2, regionMax: 2,
    text: '你才踏上西行路，云头便落下一道踩着风火轮的小小身影。他抱臂看你：「听说你也被人指着鼻子问过『哪个是真的你』？」他取下腕上一枚断了一环的金圈：「我剔骨还父、割肉还母那会儿，也没人认得我。这乾坤圈是旧物——你每回我一次，我教你一句剔骨诀；你若不要诀，我便把圈留下，替你认自己。」',
    opts: [
      { text: '要诀——剔骨还父，此身自认（逆·恶+8）', fate: '逆', alignEvil: 8, sutra: 'ni_full_tigujue' },
      { text: '收圈——此身此名，自己认得自己（逆·恶+6）', fate: '逆', alignEvil: 6, gear: 'qiankun_ring' }
    ] },
  { id: 'ni_erlang_1', side: 'rebel', key: 'erlang', name: '二郎真君', regionMin: 5, regionMax: 5,
    text: '五庄观外，一个额生竖目、腰悬三尖两刃的神将拦住你。他抱着哮天犬打量你：「取经人，你走的是我走过的路：听着天庭的调，走自己的路。我这三尖两刃刀折了六截，散在西行路上——你若捡得齐，它便是你的；捡不齐，我教你斩妖诀，也算没白遇一场。」',
    opts: [
      { text: '学诀——听调不听宣，此名我记下了（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_zhanyaojue' },
      { text: '寻刀——断戟重铸，还它一个听调不听宣（逆·恶+8）', fate: '逆', alignEvil: 8, gear: 'sanjian_p1' }
    ] },
  { id: 'ni_liuer_1', side: 'rebel', key: 'liuer', name: '六耳残念', regionMin: 8, regionMax: 8,
    text: '真假未分之际，你在林中遇着一团模糊的影子，学着你的一举一动。它开口，声音与你一般无二：「我学你学得一模一样，连如来都分不清——凭什么你是取经人，我是妖？这一问，你答是不答？」',
    opts: [
      { text: '答：你错在只学了形，没学我的心（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_xinyuan' },
      { text: '答：你没错，错的是世道只容得下一个我（逆·恶+8）', fate: '逆', alignEvil: 8, sutra: 'ni_full_xinyuan' },
      { text: '沉默——有些话，说给影子听就输了（隐）', fate: '隐', sutra: 'ni_full_xinyuan' }
,
      { text: '讨毫毛——此身此形，瞬息千变（逆·恶+4）', fate: '逆', alignEvil: 4, gear: 'liuer_mao' }
    ] },
  { id: 'ni_niumo_1', side: 'rebel', key: 'niumo', name: '牛魔旧盟', regionMin: 10, regionMax: 10,
    text: '火焰山焦土中，你拾到半截芭蕉扇的扇骨，烫得灼手。扇骨里传来粗嗓：「俺老牛当年七大圣结义，齐天大圣排第一——如今他保你取经，俺们反目成仇。取经人，你说，是兄弟反了，还是天条反了？」',
    opts: [
      { text: '答：天条先反，兄弟后反（逆·恶+10）', fate: '逆', alignEvil: 10, sutra: 'ni_full_niumo' },
      { text: '答：各为其道，无对无错（渡·善+6）', fate: '渡', alignGood: 6, favor: '观音' },
      { text: '把扇骨埋回焦土——恩怨留给火焰山（隐）', fate: '隐', sutra: 'ni_full_niumo' }
,
      { text: '讨扇骨——风火相随，恩怨同扛（逆·恶+4）', fate: '逆', alignEvil: 4, gear: 'bajiao_fan' }
    ] },
  { id: 'ni_dapeng_1', side: 'rebel', key: 'dapeng', name: '大鹏展翅', regionMin: 12, regionMax: 12,
    text: '狮驼岭山巅，一只金翅大鹏的虚影掠过云海，落下一片金羽：「我吞过佛、吃过城，一翅九万里，却飞不出如来的手掌心。取经人，你向西天走，是去找答案，还是去找笼子？」',
    opts: [
      { text: '收羽——答案在路上，笼子也在路上（逆·恶+8）', fate: '逆', alignEvil: 8, sutra: 'ni_full_qitian' },
      { text: '答：去找答案，若那是笼子，便砸了它（逆·恶+12）', fate: '逆', alignEvil: 12, sutra: 'ni_full_qitian', favor: '观音' },
      { text: '答：先看清笼门在哪，再谈砸不砸（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'ni_full_qitian' }
,
      { text: '讨瓶——阴阳二气，装天装地（逆·恶+4）', fate: '逆', alignEvil: 4, gear: 'yinyang_bottle' }
    ] },
  { id: 'ni_zhongzhang_1', side: 'rebel', key: 'zhongzhang', name: '逆道终章', regionMin: 14, regionMax: 14,
    text: '比丘国小儿城案了结，夜里你摊开那本旧账簿——第二行新墨浮现：「比丘国 · 白鹿食童 · 谁签的批文？」笔迹不干，像是等着你落笔。逆道至此，每一桩旧案，都是一片天条裂痕。',
    opts: [
      { text: '在批文旁批一个『逆』字——此案我记下了（逆·恶+10）', fate: '逆', alignEvil: 10, sutra: 'ni_full_nitian' },
      { text: '合上账簿——旧案归旧案，路还要走（渡·善+4）', fate: '渡', alignGood: 4, favor: '观音' },
      { text: '撕下这页，折成纸船放入河灯（隐）', fate: '隐', sutra: 'ni_full_nitian' }
,
      { text: '讨印——旧账为凭，逆道为证（逆·恶+4）', fate: '逆', alignEvil: 4, gear: 'jiuzhang_seal' }
    ] }
,
  { id: 'du_guanyin_2', side: 'ferry', key: 'guanyin', name: '观音菩萨', regionMin: 9, regionMax: 9,
    text: '你路过一座漏雨的破庙，庙中白衣女尼正以柳枝蘸净瓶之水，点在一具饿殍的唇上。她头也不回：「净瓶一滴，救不得天下饿殍——但这一滴，能让你想清楚：你要救谁，救得了谁？」水珠在柳梢将坠未坠。',
    opts: [
      { text: '听经——净瓶一滴，渡人先渡己（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_dabei', favor: '观音' },
      { text: '施水——替她把这一滴，点在下一个饿殍唇上（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_dabei' }
    ] },
  { id: 'du_guanyin_3', side: 'ferry', key: 'guanyin', name: '观音菩萨', regionMin: 16, regionMax: 16,
    text: '灵山在望，女尼却拦住你：「取经人，见了佛祖，莫问『我何时成佛』——你该问『我为何要成佛』。净瓶在身，是渡人渡己；净瓶在手，是劫是缘？这最后一滴甘露，给你路上用。」',
    opts: [
      { text: '受甘露——最后一滴，留着路上用（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_dabei', favor: '观音' },
      { text: '答：我为何要成佛——因为还有人没渡完（渡·善+10）', fate: '渡', alignGood: 10, sutra: 'su_full_dabei' }
    ] },
  { id: 'du_wuchao_2', side: 'ferry', key: 'wuchao', name: '乌巢禅师', regionMin: 4, regionMax: 4,
    text: '山溪边，乌巢禅师赤足濯水，见你便笑：「我观你身有七重影：一重求经，一重逃命，一重报恩，一重复仇，一重渡人，一重渡己，还有一重——连你自己也看不真切。你可知是哪一重？」',
    opts: [
      { text: '答：是求经的那一重——其余六重，路上再说（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_xinjing' },
      { text: '反问：禅师观我七重影，可曾观过自己（隐·善+4）', fate: '隐', alignGood: 4, sutra: 'su_full_xinjing' }
    ] },
  { id: 'du_wuchao_3', side: 'ferry', key: 'wuchao', name: '乌巢禅师', regionMin: 6, regionMax: 6,
    text: '密林中，禅师以枯枝点地画了一个圆：「你看这圆，照见五蕴皆空。色是空，受是空——那你这一路受的伤、欠的恩、结的仇，也是空？你若答『是』，便来取经；若答『不是』，也来取经——只别骗自己。」',
    opts: [
      { text: '答：受是空，恩仇是空，但路是真的（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_xinjing' },
      { text: '答：不是空——正因不空，才要渡（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_xinjing' }
    ] },
  { id: 'du_wuchao_4', side: 'ferry', key: 'wuchao', name: '乌巢禅师', regionMin: 8, regionMax: 8,
    text: '山口风大，禅师递来一片枫叶：「观自在菩萨，行深般若波罗蜜多时……后头的句子，我不念了。你走到哪一天，自己念得出来，就是到了。」叶上无字，风中有声。',
    opts: [
      { text: '取叶——走到哪一天，念得出来就是到了（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_xinjing' },
      { text: '还叶——先念给自己听（隐·善+2）', fate: '隐', alignGood: 2, sutra: 'su_full_xinjing' }
    ] },
  { id: 'du_wuchao_5', side: 'ferry', key: 'wuchao', name: '乌巢禅师', regionMin: 9, regionMax: 9,
    text: '浮屠山草巢空空，巢边坐着一个背影——是乌巢，却苍老了许多：「我在此传过一人《心经》，他后来把经还给了我，说『字都认得，路走不通』。取经人，你若也走不通，就把经还来，别糟蹋它。」',
    opts: [
      { text: '答：我走不通，也不还经——经没有错，错在路上（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'su_full_xinjing' },
      { text: '答：走不通就绕，经不还，路继续走（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_xinjing' }
    ] },
  { id: 'du_wuchao_6', side: 'ferry', key: 'wuchao', name: '乌巢禅师', regionMin: 10, regionMax: 10,
    text: '月照浮屠山，禅师最后问你：「经是死的，心是活的。你怀里那卷心经，若有一天在妖洞里救不得你，你是怨经，还是怨自己没读透？」他把一卷旧经轻轻推到你面前。',
    opts: [
      { text: '答：怨自己没读透——经是死的，人是活的（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_xinjing' },
      { text: '取经——月下心经，照见本心（隐·善+4）', fate: '隐', alignGood: 4, sutra: 'su_full_xinjing' }
    ] },
  { id: 'du_dizang_2', side: 'ferry', key: 'dizang', name: '地藏王菩萨', regionMin: 5, regionMax: 5,
    text: '山阴处一道裂隙，地涌黑雾，地藏菩萨立在地狱门前，锡杖拄地：「有人问我，地狱不空，誓不成佛——若地狱永世不空呢？取经人，你西天取经，若取到了经、地狱还满着，你算成佛，还是算违约？」',
    opts: [
      { text: '答：地狱不空，成佛作废——那便不成（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'su_full_dizang' },
      { text: '答：经取到了，地狱还满着——那就回来接着渡（渡·善+10）', fate: '渡', alignGood: 10, sutra: 'su_full_dizang', favor: '观音' }
    ] },
  { id: 'du_dizang_3', side: 'ferry', key: 'dizang', name: '地藏王菩萨', regionMin: 7, regionMax: 7,
    text: '谛听伏在菩萨脚边，忽然抬头看你，低吼一声。菩萨抚其背：「谛听听得见人心。它方才说——你心里有一处地方，比地狱还暗。取经人，你可要渡那处地方？」杖头铃铛轻响。',
    opts: [
      { text: '答：请菩萨渡——那处地方，我自己点灯（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_dizang' },
      { text: '答：比地狱还暗的地方，先渡自己（隐·善+4）', fate: '隐', alignGood: 4, sutra: 'su_full_dizang' }
    ] },
  { id: 'du_dizang_4', side: 'ferry', key: 'dizang', name: '地藏王菩萨', regionMin: 9, regionMax: 9,
    text: '乱葬岗上，无数孤魂围着地藏菩萨，他挨个点化，头也不回：「取经人，你看这些魂——他们等了几百年，就为等一句『去吧』。你若愿替我说这一句，我分你一片经；你若嫌脏，便绕路走。」',
    opts: [
      { text: '替他说这一句——去吧（渡·善+10）', fate: '渡', alignGood: 10, sutra: 'su_full_dizang', favor: '观音' },
      { text: '绕路——孤魂自有菩萨渡，我不添乱（隐）', fate: '隐', sutra: 'su_full_dizang' }
    ] },
  { id: 'du_dizang_5', side: 'ferry', key: 'dizang', name: '地藏王菩萨', regionMin: 11, regionMax: 11,
    text: '焦土上业火将熄，灰烬中坐着一僧，是地藏，袈裟烧去半截：「地狱的业火，烧不化我，因为我心里没有怨。取经人，你心里有没有？有的话，这火早晚要烧到你——趁现在，灭一灭。」',
    opts: [
      { text: '答：有怨——所以正要在火起之前灭掉它（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_dizang' },
      { text: '答：业火烧不化无怨之心——我试着无怨（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'su_full_dizang' }
    ] },
  { id: 'du_dizang_6', side: 'ferry', key: 'dizang', name: '地藏王菩萨', regionMin: 12, regionMax: 12,
    text: '幽冥渡口，孟婆汤冒着热气，地藏菩萨却端坐船头：「我不过桥，因为桥那头的人还在地狱。取经人，你过了这渡口，就离西天近一步——可你身后那些没渡完的魂，怎么办？」他问你，也在问自己。',
    opts: [
      { text: '答：身后没渡完的魂，我记下了——回来渡（渡·善+10）', fate: '渡', alignGood: 10, sutra: 'su_full_dizang' },
      { text: '答：过桥的人，也有回头渡人的（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_dizang' }
    ] },
  { id: 'du_dizang_7', side: 'ferry', key: 'dizang', name: '地藏王菩萨', regionMin: 13, regionMax: 13,
    text: '你走出幽冥，回头望，地藏菩萨还立在原地，锡杖铃铛作响：「去吧，别回头——回头的路，我替你看守着。只是记着：地狱不空，不是因为我慈悲，是因为你们这些取经的人，总把罪孽留在身后。」',
    opts: [
      { text: '回头一拜——菩萨，幽冥的路，我记住了（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_dizang' },
      { text: '不回头的路，我走；身后的罪，我扛（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'su_full_dizang' }
    ] },
  { id: 'du_puti_2', side: 'ferry', key: 'puti', name: '菩提祖师', regionMin: 5, regionMax: 5,
    text: '三星洞外，樵夫拦路：「前头那位老神仙，收了七个徒弟，只有一个学成了。你说他教的，是法术，还是看人？」你顺着他指的方向望去，洞门半开，一灯如豆。',
    opts: [
      { text: '求教——学的不是法术，是看人的眼力（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_tanjing' },
      { text: '答：教的既是法术，也是看人——看他敢不敢学（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'su_full_tanjing' }
    ] },
  { id: 'du_puti_3', side: 'ferry', key: 'puti', name: '菩提祖师', regionMin: 6, regionMax: 6,
    text: '山中樵夫唱道：「观棋柯烂，伐木丁丁……走啊走啊，取经的，别把路走窄了。」他指向一条岔路：「那条是去西天的，这条是去见菩提的——老神仙说了，见他不一定走那条路。」唱罢，人影没入林间。',
    opts: [
      { text: '走去见菩提——西天可以晚到，心印不可错过（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_tanjing' },
      { text: '两路都走——先见菩提，再赴西天（隐）', fate: '隐', sutra: 'su_full_tanjing' }
    ] },
  { id: 'du_puti_4', side: 'ferry', key: 'puti', name: '菩提祖师', regionMin: 7, regionMax: 7,
    text: '夜半三更，你路过一扇虚掩的柴门，门内传来菩提祖师的声音：「我当年传那猴儿，是在三更，敲他三下头——他悟了。今夜传你，也敲三下：一敲你求法之心，二敲你护法之志，三敲你——敢不敢学那猴儿，把天捅个窟窿。」',
    opts: [
      { text: '受三敲——求法之心，护法之志，破天之路（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_tanjing' },
      { text: '答：敢——那猴儿捅得窟窿，我补得回来（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'su_full_tanjing' }
    ] },
  { id: 'du_puti_5', side: 'ferry', key: 'puti', name: '菩提祖师', regionMin: 8, regionMax: 8,
    text: '菩提祖师在灶下添柴，火光照着他说：「我那徒弟劈了七年柴，才等到一句『无住生心』。取经人，你这一路斩妖除魔，可也愿意劈柴？若愿意，这卷经给你；若只想要速成的神通，洞外有猴，自己去学。」',
    opts: [
      { text: '答：愿意劈柴——神通慢学，心先定（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_tanjing' },
      { text: '答：我既斩妖，也要速成——但经也要（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'su_full_tanjing' }
    ] },
  { id: 'du_puti_6', side: 'ferry', key: 'puti', name: '菩提祖师', regionMin: 9, regionMax: 9,
    text: '祖师摊开一卷白纸：「这是无字经。有人说它是空的，有人说它写满了一切。你那师兄，当年在这卷白纸前站了三天三夜，最后笑了——他看到了什么，我不告诉你。你若要，自己来看。」',
    opts: [
      { text: '看经——无字处，有万言（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_tanjing' },
      { text: '答：他看到的，是心外无字（隐·善+6）', fate: '隐', alignGood: 6, sutra: 'su_full_tanjing' }
    ] },
  { id: 'du_puti_7', side: 'ferry', key: 'puti', name: '菩提祖师', regionMin: 10, regionMax: 10,
    text: '夜雨山中，猿啼声此起彼伏。菩提祖师立于崖边：「你听，这满山的猿，都像我那徒弟——跳得出花果山，跳不出如来掌心。取经人，你跳得出吗？」雨打芭蕉，猿声渐歇。',
    opts: [
      { text: '答：跳不出，也得跳——跳着跳着，就出去了（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'su_full_tanjing' },
      { text: '答：跳不出，就不跳了——走路过去（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_tanjing' }
    ] },
  { id: 'du_puti_8', side: 'ferry', key: 'puti', name: '菩提祖师', regionMin: 11, regionMax: 11,
    text: '中秋月明，祖师在院中摆两杯茶：「月照山川，照谁都一般亮。心经也好，六祖坛经也好，都是那轮月亮。你若不修心，把经背得再熟，也不过是——手里攥着一把月光，天一亮就散了。」他推过那卷经。',
    opts: [
      { text: '接经——心若明月，经便不废（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_tanjing' },
      { text: '答：修心难，背经易——但难的路，才走得远（渡·善+10）', fate: '渡', alignGood: 10, sutra: 'su_full_tanjing' }
    ] },
  { id: 'du_puti_9', side: 'ferry', key: 'puti', name: '菩提祖师', regionMin: 12, regionMax: 12,
    text: '灵台方寸山巅，祖师以指写了一个字——拆开是「斜月三星」，合起来是个「心」：「你师兄当年在三星洞前，把『心』字写在肚皮上，说这样丢不了。取经人，你的心，写在哪儿？」',
    opts: [
      { text: '答：我的心，写在路上——每一难，都是一笔（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'su_full_tanjing' },
      { text: '答：写在胸口——丢不了（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_tanjing' }
    ] },
  { id: 'du_puti_10', side: 'ferry', key: 'puti', name: '菩提祖师', regionMin: 13, regionMax: 13,
    text: '白云深处，祖师负手而立，背影渐淡：「方寸山，是我在，山才在。我若散了，这山也就散了——取经人，你路上拜的庙、求的佛、念的经，哪一样，是我这样的虚影？」他笑了一声，云合。',
    opts: [
      { text: '答：虚影也是影——渡我的，就是真（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_tanjing' },
      { text: '答：我求的，从来不是庙里的佛，是路上的理（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'su_full_tanjing' }
    ] },
  { id: 'du_puti_11', side: 'ferry', key: 'puti', name: '菩提祖师', regionMin: 14, regionMax: 14,
    text: '你回头望灵台方寸山，只见云雾缭绕，仿佛从未有过。耳边却余下一声叹息：「我这一生，只传了两个人。一个去闹了天宫，一个要去取真经——都是逆着天走的人。这卷《六祖坛经》，你带着，替我看着那条路。」',
    opts: [
      { text: '受经——替祖师看着那条路（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_tanjing', favor: '观音' },
      { text: '答：逆着天走的路，我接下了（逆·恶+8）', fate: '逆', alignEvil: 8, sutra: 'su_full_tanjing' }
    ] },
  { id: 'du_puti_12', side: 'ferry', key: 'puti', name: '菩提祖师', regionMin: 15, regionMax: 15,
    text: '三星洞中蛛网横结，蒲团上只有一本翻旧的经书。书页间夹着一根猴毛，和一行小字：「昔在此学艺者，姓孙，名悟空。」你收起经书，那根猴毛化作风中一缕金芒，向西而去。',
    opts: [
      { text: '收经——替悟空，也替自己（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_tanjing' },
      { text: '捻起猴毛——旧人已去，新路还在（隐）', fate: '隐', sutra: 'su_full_tanjing' }
    ] },
  { id: 'du_puti_13', side: 'ferry', key: 'puti', name: '菩提祖师', regionMin: 16, regionMax: 16,
    text: '灵山近在眼前，你却在路边茶棚遇见一位老僧，容貌与菩提祖师一般无二。他看你良久，只说了句：「去吧。你师兄在闹天宫的时候，我没拦他；你今日去取经，我也不拦你——只记住，方寸山教你的，从来不是神通，是『认命』与『不认命』之间，那条只有你自己走得过的路。」言罢，老僧化作白云。',
    opts: [
      { text: '答：认命与不认命之间，我走第三条路（逆·恶+8）', fate: '逆', alignEvil: 8, sutra: 'su_full_tanjing' },
      { text: '拜别——祖师，方寸山的云，我记住了（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_tanjing' }
    ] },
  { id: 'du_zhenyuan_2', side: 'ferry', key: 'zhenyuan', name: '镇元子', regionMin: 6, regionMax: 6,
    text: '五庄观内，人参果熟了，镇元子摘下一枚：「这果子，三千年一开花，三千年一结果。取经人，你西行这一趟，赶得上它下一熟吗？赶不上，就吃这一枚，把寿数续上——续上了，才有命走到西天。」',
    opts: [
      { text: '吃果——续上命，才到得了西天（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_wuliangshou' },
      { text: '求经——寿数有尽，经义无尽（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_wuliangshou' }
    ] },
  { id: 'du_zhenyuan_3', side: 'ferry', key: 'zhenyuan', name: '镇元子', regionMin: 7, regionMax: 7,
    text: '清风明月两个童子捧着果子在廊下走，见你便笑：「师父说，果子可以给取经人吃，但经——得他自己来讨。」镇元子遥遥开口：「你讨，我便给；你不讨，我也给。你猜，这是哪个更难得？」',
    opts: [
      { text: '答：讨的比给的金贵——经我讨定了（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_wuliangshou' },
      { text: '答：给的比讨的难得——谢过地仙（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_wuliangshou' }
    ] },
  { id: 'du_zhenyuan_4', side: 'ferry', key: 'zhenyuan', name: '镇元子', regionMin: 8, regionMax: 8,
    text: '镇元子邀你论道，桌上只有一壶茶：「地仙之祖，管的是地，不是天。天上打架，我不管；地上的人想活，我管。取经人，你说你的经，能管天上，还是管地上？」他替你斟茶，茶满而未溢。',
    opts: [
      { text: '答：经管不住天上——但能管住拿经的人（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_wuliangshou' },
      { text: '答：地上的人想活，经就该管地上（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_wuliangshou' }
    ] },
  { id: 'du_zhenyuan_5', side: 'ferry', key: 'zhenyuan', name: '镇元子', regionMin: 9, regionMax: 9,
    text: '人参果树下，镇元子望着树影：「这树与我同岁，我看它，像看自己。取经人，你看经，是看字，还是看自己？」他递来一片果叶：「叶上有脉络，那是树的经。」',
    opts: [
      { text: '答：我看经，也看自己——字里行间，都是来路（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_wuliangshou' },
      { text: '接叶——叶有脉络，人有来处（隐·善+4）', fate: '隐', alignGood: 4, sutra: 'su_full_wuliangshou' }
    ] },
  { id: 'du_zhenyuan_6', side: 'ferry', key: 'zhenyuan', name: '镇元子', regionMin: 10, regionMax: 10,
    text: '一颗人参果从枝头落下，无声无息，滚到你脚边。镇元子没有去拾：「果子落了，我不拾——因为拾起来，它也活不成了。取经人，你这一路丢的东西，可还拾得回来？拾不回的，就别回头看了。」他把果叶夹进经卷。',
    opts: [
      { text: '答：拾不回的，就不回头看了（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_wuliangshou' },
      { text: '答：果落无声，正好——落下的，都是过去的我（隐）', fate: '隐', sutra: 'su_full_wuliangshou' }
    ] },
  { id: 'du_zhenyuan_7', side: 'ferry', key: 'zhenyuan', name: '镇元子', regionMin: 11, regionMax: 11,
    text: '镇元子问你：「我活了几万年，见过无数取经人。他们有的求长生，有的求正果，有的求个明白——你求什么？」你还没答，他又说：「若是求明白，这卷经送你；若是求长生，果子给你。别贪心，一样就够。」',
    opts: [
      { text: '答：求个明白——所以经，我收下了（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_wuliangshou' },
      { text: '答：求长生——但长生若为明白，便也求（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'su_full_wuliangshou' }
    ] },
  { id: 'du_zhenyuan_8', side: 'ferry', key: 'zhenyuan', name: '镇元子', regionMin: 12, regionMax: 12,
    text: '临别，镇元子送你到观门：「我与悟空有结拜之约，与你，算半个故交。取经人，你若哪天走到绝路，记得五庄观的人参果，还欠你一颗。」他顿了顿：「别死了——死了，果子就没人吃了。」',
    opts: [
      { text: '答：绝路之时，五庄观的门，我记下了（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_wuliangshou' },
      { text: '答：死不了——果子还没吃上呢（逆·恶+2）', fate: '逆', alignEvil: 2, sutra: 'su_full_wuliangshou' }
    ] },
  { id: 'du_zhenyuan_9', side: 'ferry', key: 'zhenyuan', name: '镇元子', regionMin: 13, regionMax: 13,
    text: '观门缓缓合上，门缝里传出镇元子最后一句话：「地仙不拜天，不跪佛，只敬自己这一亩三分地。取经人，你的地在哪里，你的经就在哪里。」经卷无风自动，翻到「无量寿」一页。',
    opts: [
      { text: '答：我的地，是西天那条路——经，在路上（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_wuliangshou' },
      { text: '答：一亩三分地，种经也种果（隐）', fate: '隐', sutra: 'su_full_wuliangshou' }
    ] },
  { id: 'du_wenshu_2', side: 'ferry', key: 'wenshu', name: '文殊菩萨', regionMin: 7, regionMax: 7,
    text: '文殊菩萨的青狮卧在路口打盹，见你走来，睁眼看了你一下，又闭上。菩萨的声音从云端传来：「它认得你——不，它认得你身上的杀气。狮子是兽，兽最懂杀气。取经人，你这一身杀气，是要渡人，还是要斩人？」',
    opts: [
      { text: '答：斩人——杀伐果决，才是取经人（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'su_full_lengyan' },
      { text: '答：渡人——杀气收在鞘里，用到时再出（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_lengyan' }
    ] },
  { id: 'du_wenshu_3', side: 'ferry', key: 'wenshu', name: '文殊菩萨', regionMin: 8, regionMax: 8,
    text: '文殊以剑尖挑起一片落叶：「剑快，是因为无刃之处，就是刃。取经人，你看我这一剑——斩的是落叶，还是你的妄念？」剑光一闪，落叶分两半，叶脉却完好。',
    opts: [
      { text: '答：斩的是妄念——剑快，心要更静（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_lengyan' },
      { text: '答：无刃之处就是刃——我学的是那无刃处（隐·善+4）', fate: '隐', alignGood: 4, sutra: 'su_full_lengyan' }
    ] },
  { id: 'du_wenshu_4', side: 'ferry', key: 'wenshu', name: '文殊菩萨', regionMin: 9, regionMax: 9,
    text: '道场残垣前，文殊菩萨盘膝而坐：「我斩无明，斩了十万年，无明还长。取经人，你斩妖，斩了一路，妖还层出不穷——你说，是妖杀不尽，还是你心里的『妖』没杀尽？」他拍了拍青狮，狮子低吼应和。',
    opts: [
      { text: '答：妖杀不尽，但心里那只，可以先杀（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_lengyan' },
      { text: '答：杀不尽，就渡——渡不动，再杀（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'su_full_lengyan' }
    ] },
  { id: 'du_wenshu_5', side: 'ferry', key: 'wenshu', name: '文殊菩萨', regionMin: 10, regionMax: 10,
    text: '你遇文殊于一座断桥，他正以慧剑斩水：「水断而复合，剑斩而无痕——取经人，你的妄念，斩得断吗？斩不断，就带着它走；带着它，就别让它掌你的手。」剑入鞘，水自流。',
    opts: [
      { text: '答：斩不断，就带着——但不让它掌我的手（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_lengyan' },
      { text: '答：斩得断的，不是真念；斩不断的，才是路（隐）', fate: '隐', sutra: 'su_full_lengyan' }
    ] },
  { id: 'du_wenshu_6', side: 'ferry', key: 'wenshu', name: '文殊菩萨', regionMin: 11, regionMax: 11,
    text: '一声狮子吼震得山林肃静，文殊菩萨立于狮背：「这一吼，吼的是什么？是威严，还是慈悲？取经人，你诵经的时候，若能让妖听了这一声就放下屠刀——那你的经，就比我的剑还利。」他抛下一片经文。',
    opts: [
      { text: '接经——若能一诵退妖，比剑还利（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_lengyan' },
      { text: '答：狮子吼是威严，也是慈悲——我学这一声（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'su_full_lengyan' }
    ] },
  { id: 'du_wenshu_7', side: 'ferry', key: 'wenshu', name: '文殊菩萨', regionMin: 12, regionMax: 12,
    text: '荒废的五台山道场，文殊独自清扫落叶：「这里曾住三千僧，如今只剩我一个。取经人，经还在，庙塌了——你说，是庙重要，还是经重要？」他扫起一堆落叶，堆里露出半卷经文。',
    opts: [
      { text: '答：经重要——庙塌了，经还在（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_lengyan' },
      { text: '答：庙重要——有人听，经才是经（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_lengyan' }
    ] },
  { id: 'du_wenshu_8', side: 'ferry', key: 'wenshu', name: '文殊菩萨', regionMin: 13, regionMax: 13,
    text: '文殊的剑鞘空空，剑却不知去向。他望着空鞘：「剑丢了，但我还会斩——用这空鞘，也能斩无明。取经人，你的经若也丢了，你还渡得动妖吗？」他笑了笑：「试试就知道了。」',
    opts: [
      { text: '答：经丢了，人也渡得——渡人的是心，不是经（渡·善+10）', fate: '渡', alignGood: 10, sutra: 'su_full_lengyan' },
      { text: '答：试试就试试——空鞘也斩无明（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'su_full_lengyan' }
    ] },
  { id: 'du_wenshu_9', side: 'ferry', key: 'wenshu', name: '文殊菩萨', regionMin: 14, regionMax: 14,
    text: '文殊闭目，侧耳：「你听——风声，水声，脚步声，心跳声。哪一声是你的自性？取经人，返闻闻自性，性成无上道。你若听明白了，这经便不必背，张口即是。」山风过耳，万籁俱寂。',
    opts: [
      { text: '答：听明白了——风声水声，皆是自性（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_lengyan' },
      { text: '答：心静时万籁俱寂——心不静，听什么都是噪音（隐）', fate: '隐', sutra: 'su_full_lengyan' }
    ] },
  { id: 'du_wenshu_10', side: 'ferry', key: 'wenshu', name: '文殊菩萨', regionMin: 15, regionMax: 15,
    text: '临别，文殊以剑柄在你额上轻轻一点：「慧剑已传，无明自斩。取经人，此后遇妖，先问自己：这一剑，是斩它，还是斩我？」青狮长啸，驮着菩萨消失在天际，剑鞘空空，剑在心中。',
    opts: [
      { text: '受点——此剑，斩我也斩妖（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_lengyan' },
      { text: '答：斩它之前，先问自己——这一剑，是私愤还是公义（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'su_full_lengyan' }
    ] },
  { id: 'du_mile_2', side: 'ferry', key: 'mile', name: '弥勒佛', regionMin: 8, regionMax: 8,
    text: '弥勒佛笑呵呵地坐在路边，面前摆着黄眉怪的旧金钹：「我那不省心的弟子，偷了我的袋、我的钹，去装你师兄——你说，他是输在『贪』字上，还是输在『笨』字上？我猜，是输在没等到我出手。」他拍着肚皮大笑。',
    opts: [
      { text: '答：输在笨——等师父出手，是妖的宿命（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'su_full_fahua' },
      { text: '答：输在贪——但贪，也是没悟（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'su_full_fahua' }
    ] },
  { id: 'du_mile_3', side: 'ferry', key: 'mile', name: '弥勒佛', regionMin: 9, regionMax: 9,
    text: '弥勒问你：「我笑，是因为好笑，还是因为看透了？取经人，你若能看透这一路——妖是劫，人是劫，经也是劫——你也能笑口常开。」他咧嘴：「来，笑一个，我看看你悟了几分。」',
    opts: [
      { text: '答：看透了才笑——我试着看透（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_fahua' },
      { text: '笑一个——比哭好看，也比哭有用（隐·善+2）', fate: '隐', alignGood: 2, sutra: 'su_full_fahua' }
    ] },
  { id: 'du_mile_4', side: 'ferry', key: 'mile', name: '弥勒佛', regionMin: 10, regionMax: 10,
    text: '弥勒解开布袋口：「你猜我这袋里有什么？有山，有河，有当年黄眉偷走的半天云彩，还有三界放不下的烦恼。取经人，你若烦恼太多，可以寄存在我这——不收钱，只收『放下』。」',
    opts: [
      { text: '答：烦恼自有来处，也有去处——先寄存在布袋（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_fahua' },
      { text: '答：放下二字，说来轻巧——你且替我收着（逆·恶+2）', fate: '逆', alignEvil: 2, sutra: 'su_full_fahua' }
    ] },
  { id: 'du_mile_5', side: 'ferry', key: 'mile', name: '弥勒佛', regionMin: 11, regionMax: 11,
    text: '弥勒难得收了笑，认真看你：「我是未来佛。未来是什么？是还没发生的果。取经人，你现在种的因，我替你看看果——你这一路行善积德，未来可期；你若走岔了，未来，我也看不住。」他合掌，又咧嘴笑了。',
    opts: [
      { text: '答：未来是果——那我多种善因（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_fahua' },
      { text: '答：走岔了，未来也看不住——那就掰回来（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'su_full_fahua' }
    ] },
  { id: 'du_mile_6', side: 'ferry', key: 'mile', name: '弥勒佛', regionMin: 12, regionMax: 12,
    text: '一株老树下，弥勒铺开席子：「这树，将来要在龙华会上开三度花。取经人，你赶得上那场会吗？赶不上也没关系——我这口袋，先把你的名字记下了。」他掏出一本小簿子，煞有介事地记了一笔。',
    opts: [
      { text: '答：赶不上龙华会，就先把名字记下（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_fahua' },
      { text: '答：龙华会上，我若在，便是我自己的三度花（隐）', fate: '隐', sutra: 'su_full_fahua' }
    ] },
  { id: 'du_mile_7', side: 'ferry', key: 'mile', name: '弥勒佛', regionMin: 13, regionMax: 13,
    text: '弥勒见你愁眉苦脸，笑得更大声：「你愁什么？妖打不过就跑，经取不到就偷，路走不通就绕——天大的事，笑一笑，就小了一半。取经人，你学的经里，有没有教你这个？」他抛来一个果子。',
    opts: [
      { text: '接果——笑一笑，路就小了一半（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_fahua' },
      { text: '答：经里教的，是慈悲——慈悲的人，也笑（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_fahua' }
    ] },
  { id: 'du_mile_8', side: 'ferry', key: 'mile', name: '弥勒佛', regionMin: 14, regionMax: 14,
    text: '弥勒指着远处一个妖影：「你信不信，我袋口一张，它就进去了？——但我偏不。我让它多活几集，看看它能不能自己悟。取经人，你也一样：我不收你，你且走着，看你自己能不能悟。」他打了个哈欠，袋口松了松。',
    opts: [
      { text: '答：不收我，我便自己悟——悟给你看（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_fahua' },
      { text: '答：你不收，我便去——但你的袋，我惦记上了（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'su_full_fahua' }
    ] },
  { id: 'du_mile_9', side: 'ferry', key: 'mile', name: '弥勒佛', regionMin: 15, regionMax: 15,
    text: '弥勒难得正色：「我点了三回头——一回给黄眉，一回给三界，这一回，给你。取经人，你走到这里，已经比大多数人强了。剩下的路，我不送了——笑到最后的人，不用送。」他摆摆手，笑声渐远。',
    opts: [
      { text: '答：笑到最后的人，也不用送——那我走了（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_fahua' },
      { text: '答：三回头，我都记下了——一回也不忘（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_fahua' }
    ] },
  { id: 'du_mile_10', side: 'ferry', key: 'mile', name: '弥勒佛', regionMin: 16, regionMax: 16,
    text: '弥勒的笑声在风中渐远，最后只剩一句话飘来：「取经人，记住——口袋里装得下三界，装不下你的心。你的心，自己看着办。」布袋的影子消失在云际，你怀里那卷《法华经》微微发烫。',
    opts: [
      { text: '答：心装不下，就不装——走一步，是一步（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_fahua' },
      { text: '答：口袋装三界，我装自己的路（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'su_full_fahua' }
    ] },
  { id: 'du_mile_11', side: 'ferry', key: 'mile', name: '弥勒佛', regionMin: 16, regionMax: 16,
    text: '路边一只布袋敞着口，里面空空如也，袋底却绣着一行小字：「三界装得下，心装不下——所以我把心还给你。」你拾起袋中那卷经，耳畔似有弥勒的笑声，比往日安静了许多。',
    opts: [
      { text: '拾经——心还给我了，路也还给我了（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_fahua' },
      { text: '答：空空如也——正好，装我剩下的路（隐）', fate: '隐', sutra: 'su_full_fahua' }
    ] },
  { id: 'du_randeng_2', side: 'ferry', key: 'randeng', name: '燃灯古佛', regionMin: 9, regionMax: 9,
    text: '古寺檐下，燃灯古佛举灯照你：「灯下看路，只能看三步。取经人，你这一路，可看得见三步之外？看不见，就跟着灯走——灯灭之前，总能到。」灯焰摇曳，似有万千过往在焰中流转。',
    opts: [
      { text: '答：跟着灯走——灯灭之前，总能到（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_niepan' },
      { text: '答：三步之外，我自己点灯（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'su_full_niepan' }
    ] },
  { id: 'du_randeng_3', side: 'ferry', key: 'randeng', name: '燃灯古佛', regionMin: 10, regionMax: 10,
    text: '燃灯捧灯而坐：「我是过去佛，照的是过去的路。取经人，你过去犯的错、欠的债，都在我这灯里——你要不要看一眼？看一眼，就知道自己为什么走在今天这条路上。」灯焰中，似有你前世的面容一闪而过。',
    opts: [
      { text: '答：看一眼——过去的债，心里有数（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_niepan' },
      { text: '答：不看——过去的事，回头看是灯，向前看是路（隐）', fate: '隐', sutra: 'su_full_niepan' }
    ] },
  { id: 'du_randeng_4', side: 'ferry', key: 'randeng', name: '燃灯古佛', regionMin: 11, regionMax: 11,
    text: '灯芯将尽，燃灯却不添油：「灯灭，是灯的事；路，是你的事。取经人，我照不了你多远——后面的路，你得自己点一盏灯。灯油从哪儿来？从你走过的路上，捡那些还没烧完的因果。」灯焰一跳，又明了一分。',
    opts: [
      { text: '答：灯油，从因果里捡——我记下了（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_niepan' },
      { text: '答：自己的灯，自己点——不必借佛光（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'su_full_niepan' }
    ] },
  { id: 'du_randeng_5', side: 'ferry', key: 'randeng', name: '燃灯古佛', regionMin: 12, regionMax: 12,
    text: '燃灯将灯递到你面前：「吹熄它。你若敢吹，我就知道你的心——是畏暗，还是无惧。吹熄了，我在黑暗里再给你点一盏；不吹，这灯也随你带走。」你盯着那团豆大的火，焰中映出十世轮回的影子。',
    opts: [
      { text: '吹熄它——黑暗里，再见你点的灯（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'su_full_niepan' },
      { text: '不吹——灯在，心火就在（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_niepan' }
    ] },
  { id: 'du_randeng_6', side: 'ferry', key: 'randeng', name: '燃灯古佛', regionMin: 13, regionMax: 13,
    text: '燃灯轻抚灯身：「这盏灯，从我成道点起，照了十万年。十万年里，它照过佛、照过魔、照过凡人——它不挑人。取经人，你的经，可也照妖？若只照人，那还差一层。」灯焰微颤，似在应和。',
    opts: [
      { text: '答：经若只照人，确实差一层——我试着照妖（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_niepan' },
      { text: '答：灯不挑人，经也不挑——佛魔同照（渡·善+10）', fate: '渡', alignGood: 10, sutra: 'su_full_niepan' }
    ] },
  { id: 'du_randeng_7', side: 'ferry', key: 'randeng', name: '燃灯古佛', regionMin: 14, regionMax: 14,
    text: '灯油顺着灯身淌下，如泪。燃灯捻了捻：「灯油是泪——十万年的泪，才够这一盏灯不灭。取经人，你这一路的泪，攒着别浪费——到西天的时候，兴许能点一盏，照你回来。」他把灯油滴在你掌心，温热。',
    opts: [
      { text: '受灯油——这一路的热泪，我攒着（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_niepan' },
      { text: '答：灯油是泪，十万年不灭——是因为有人值得（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'su_full_niepan' }
    ] },
  { id: 'du_randeng_8', side: 'ferry', key: 'randeng', name: '燃灯古佛', regionMin: 15, regionMax: 15,
    text: '青灯下，燃灯古佛与一尊旧佛像对坐，仿佛在参禅：「佛是泥塑的，灯是油点的——哪一样是真的？取经人，你若参得透，泥佛也是佛，油灯也是灯；参不透，真佛在你面前，你也只看见一尊泥像。」灯焰轻爆，佛像眉间似有笑意。',
    opts: [
      { text: '答：参得透——泥佛也是佛，油灯也是灯（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_niepan' },
      { text: '答：参不透——但参不透，才要参（隐）', fate: '隐', sutra: 'su_full_niepan' }
    ] },
  { id: 'du_randeng_9', side: 'ferry', key: 'randeng', name: '燃灯古佛', regionMin: 16, regionMax: 16,
    text: '灯影在墙上忽明忽暗，燃灯以指拨动灯芯：「灯影徘徊，是因为灯芯有结。取经人，你的心有没有结？有结，路就绕；没有结，一步即到。我拨灯芯，你拨心结——今晚，我们各干各的。」灯焰渐稳。',
    opts: [
      { text: '答：心结，今晚就拨（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_niepan' },
      { text: '答：结在心上，路在脚下——各拨各的（逆·恶+2）', fate: '逆', alignEvil: 2, sutra: 'su_full_niepan' }
    ] },
  { id: 'du_randeng_10', side: 'ferry', key: 'randeng', name: '燃灯古佛', regionMin: 17, regionMax: 17,
    text: '灵山脚下，燃灯古佛最后见你：「我把这盏十万年的灯，传给你——不是让你捧着，是让你在必要的时候，点一把火。取经人，灯照的是过去，火开的是未来。你走到头，若发现西天也是一盏灯，就把这火，还给它。」灯焰落入你眉心。',
    opts: [
      { text: '受火——必要的时候，点一把（逆·恶+8）', fate: '逆', alignEvil: 8, sutra: 'su_full_niepan' },
      { text: '答：西天若是灯，我把火还给它（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_niepan' }
    ] },
  { id: 'du_randeng_11', side: 'ferry', key: 'randeng', name: '燃灯古佛', regionMin: 8, regionMax: 8,
    text: '一阵山风吹过，燃灯的灯竟灭了。他却不见慌乱，闭目片刻，灯又自燃：「你看，灯灭，不是终结——是换一口气。取经人，你路上若也有灯灭的时候，别慌，喘口气，火还在灰里。」他吹了吹灯焰，焰苗更亮。',
    opts: [
      { text: '答：灯灭换气，火在灰里——受教了（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_niepan' },
      { text: '答：灯灭不慌——慌的，是没点过火的人（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'su_full_niepan' }
    ] },
  { id: 'du_randeng_12', side: 'ferry', key: 'randeng', name: '燃灯古佛', regionMin: 10, regionMax: 10,
    text: '琉璃灯罩映出你的面容，燃灯却指着灯影说：「你看，灯里的你，比灯外的你亮。取经人，这是因为灯——还是因为你本来就有光，只是忘了点？」他把琉璃灯罩轻轻取下，灯火直直照进你眼里。',
    opts: [
      { text: '答：本来就有光——只是忘了点（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_niepan' },
      { text: '答：灯里的我，亮过灯外的——那就把灯外也点亮（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'su_full_niepan' }
    ] },
  { id: 'du_randeng_13', side: 'ferry', key: 'randeng', name: '燃灯古佛', regionMin: 12, regionMax: 12,
    text: '燃灯古佛将灯放在一块青石上：「最后一问了——灯熄了，路还在吗？取经人，你若答『在』，这灯就送你了；你若答『不在』，这灯就留在我这儿，等你哪天想明白了，再来取。」灯焰静静燃着，等你开口。',
    opts: [
      { text: '答：在——灯熄了，路还在（渡·善+10）', fate: '渡', alignGood: 10, sutra: 'su_full_niepan' },
      { text: '答：不在——但我在，所以路在（逆·恶+8）', fate: '逆', alignEvil: 8, sutra: 'su_full_niepan' }
    ] },
  { id: 'ni_baigu_2', side: 'rebel', key: 'baigu', name: '白骨夫人', regionMin: 3, regionMax: 3,
    text: '山道上又见那老妇，这回她提着个破篮，篮里是几块烧焦的骨头：「老身找了三天，才找齐这几块——是我那儿子，被妖怪烤了吃剩下的。你帮老身看看，哪块是他？」她笑着，嘴里却露出兽牙。',
    opts: [
      { text: '接下骨头——妖吃人，人吃妖，都是活（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_yaopu' },
      { text: '点破她——烧焦的骨头，烤不出人形（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_yaopu', favor: '观音' }
    ] },
  { id: 'ni_baigu_3', side: 'rebel', key: 'baigu', name: '白骨夫人', regionMin: 4, regionMax: 4,
    text: '这一次拦路的是个老翁，拄着拐杖，哭得满脸是泪：「我那儿子死得惨啊——被个和尚用金箍棒打死的！」你定睛一看，老翁的眼睛是两个窟窿，窟窿里飞出两只骨蝶，蝶翅上写着两个字：「形」「骨」。',
    opts: [
      { text: '答：形是假的，骨是真的——真骨，我埋（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'ni_full_yaopu' },
      { text: '不接话——三戏人心，第四次不玩了（隐）', fate: '隐', sutra: 'ni_full_yaopu' }
    ] },
  { id: 'ni_baigu_4', side: 'rebel', key: 'baigu', name: '白骨夫人', regionMin: 5, regionMax: 5,
    text: '三戏过后，白骨夫人现出本相——一副枯骨立在月下，骨手捧着一颗微微发光的舍利：「我骗了你三次，你渡了我三次。这舍利是我心口的骨，烧了三百年才化出这一点光——给你。妖也有心，只是你们总不肯信。」枯骨散落，舍利落入你手中。',
    opts: [
      { text: '受舍利——妖也有心，我信了（渡·善+10）', fate: '渡', alignGood: 10, sutra: 'ni_full_yaopu', favor: '观音' },
      { text: '答：你渡我三次，我渡你一次——两清了（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'ni_full_yaopu' }
    ] },
  { id: 'ni_honghai_2', side: 'rebel', key: 'honghai', name: '红孩儿', regionMin: 5, regionMax: 5,
    text: '火云洞前，红孩儿张嘴喷出一缕火苗，烧得空气发烫：「你可知我这三昧真火，连你师兄都怕？——可我不烧你，我烧我自己。你看，火里站着的，是那个不认爹娘的圣婴大王，还是那个怕黑的娃娃？」火焰中，童子的脸忽明忽暗。',
    opts: [
      { text: '答：火里站着的，是怕黑的娃娃——他烧不掉（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'ni_full_wuzi' },
      { text: '答：三昧真火烧自己，是炼心——我学不来（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_wuzi' }
    ] },
  { id: 'ni_honghai_3', side: 'rebel', key: 'honghai', name: '红孩儿', regionMin: 6, regionMax: 6,
    text: '红孩儿骑在牛车上，一脚踢开写着「牛」字的木牌：「我姓红，不姓牛！我爹的牛，我娘的铁扇，我都不要——我要自己当大王。取经人，你取经，是不是也因为不想当别人眼里的『和尚』？」他歪头等你答。',
    opts: [
      { text: '答：取经，是因为经里没有别人的名字（逆·恶+8）', fate: '逆', alignEvil: 8, sutra: 'ni_full_wuzi' },
      { text: '答：不认父名，可以；不认自己，不行（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'ni_full_wuzi' }
    ] },
  { id: 'ni_honghai_4', side: 'rebel', key: 'honghai', name: '红孩儿', regionMin: 7, regionMax: 7,
    text: '火云洞的火熄了，红孩儿坐在灰烬里，第一次没有笑：「火灭了，我忽然不知道我是谁了——圣婴大王？牛魔王之子？还是那个被观音收走的善财童子？取经人，你说，火灭了以后，烧火的那个人，还算不算数？」灰烬里，一点火星未灭。',
    opts: [
      { text: '答：火灭了，烧火的人还在——你还在（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'ni_full_wuzi' },
      { text: '答：火灭了才知道自己是谁——这火，灭得值（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_wuzi' }
    ] },
  { id: 'ni_nezha_2', side: 'rebel', key: 'nezha', name: '哪吒', regionMin: 3, regionMax: 3,
    text: '哪吒盘坐在莲台上，托腮看你：「第二问——我剔骨还父、割肉还母之后，莲花做的身子，算不算我？你一路换了多少身？穿袈裟的是你，拿禅杖的是你，被妖追着跑的还是你——你说，哪一重才是真你？」',
    opts: [
      { text: '答：莲花身也是我——认了，就是我的（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_tigujue' },
      { text: '答：穿袈裟的是我，被追的也是我——都是我（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_tigujue' }
    ] },
  { id: 'ni_nezha_3', side: 'rebel', key: 'nezha', name: '哪吒', regionMin: 6, regionMax: 6,
    text: '哪吒现出三头六臂，各执兵刃，却只用一只眼看你：「第三问——我三头六臂，是因为神通，还是因为怕？怕一只手不够，怕一眼看不住，怕一世护不周全。取经人，你呢？你这一路学了这么多神通，是不是也怕？」',
    opts: [
      { text: '答：三头六臂，是因为怕——我也是，所以我才修神通（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'ni_full_tigujue' },
      { text: '答：怕不怕不重要，护不护得住才重要（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'ni_full_tigujue' }
    ] },
  { id: 'ni_nezha_4', side: 'rebel', key: 'nezha', name: '哪吒', regionMin: 9, regionMax: 9,
    text: '哪吒踩在风火轮上，轮下火舌舔着云：「第四问——这轮子，快得过西天吗？我踩着它追过你师兄，追不上；追过天兵，追得上。取经人，你说，有些路，是不是越快越到不了？」他放缓轮速，与你并肩而行。',
    opts: [
      { text: '答：有些路，越快越到不了——所以我不急（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_tigujue' },
      { text: '答：快不过西天，但快得过天兵——够了（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_tigujue' }
    ] },
  { id: 'ni_nezha_5', side: 'rebel', key: 'nezha', name: '哪吒', regionMin: 12, regionMax: 12,
    text: '哪吒摩挲着腕上乾坤圈，圈上有一道锈迹：「这圈跟我几百年，第一次生锈——我忽然想，是不是因为我不再闹海了？取经人，你怀里那卷经，可也会生锈？若有一天你不再渡人，它是不是就成了废纸？」他抬头，眼里有光。',
    opts: [
      { text: '答：经若生锈，是因为我不再渡人——那我会重新翻开它（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'ni_full_tigujue' },
      { text: '答：圈会锈，心不会——只要我还闹海（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_tigujue' }
    ] },
  { id: 'ni_nezha_6', side: 'rebel', key: 'nezha', name: '哪吒', regionMin: 15, regionMax: 15,
    text: '最后一问，哪吒把乾坤圈抛给你，自己空着手：「圈给你，我不用了——因为我认得了自己，不用圈来替我看路。取经人，剔骨诀六问已尽：此身此名，自己认得自己。你呢？你认得吗？」风火轮远去，留下一缕莲香。',
    opts: [
      { text: '答：认得了——此身此名，自己认得自己（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'ni_full_tigujue' },
      { text: '答：你空手认得自己，我也该试试空手走路（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'ni_full_tigujue' }
    ] },
  { id: 'ni_erlang_2', side: 'rebel', key: 'erlang', name: '二郎真君', regionMin: 6, regionMax: 6,
    text: '火云洞外，二郎真君倚着断柱，哮天犬卧在膝边：「你来得巧——刚收拾完几个占洞称王的妖怪，正愁没人说话。取经人，你说，他们求个名分，是求天准，还是求自己认？我斩妖，是奉旨，还是顺手？」',
    opts: [
      { text: '学诀——听调不听宣（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_zhanyaojue' },
      { text: '寻刀——断戟重铸，还差你一节（逆·恶+8）', fate: '逆', alignEvil: 8, gear: 'sanjian_p2' }
    ] },
  { id: 'ni_erlang_3', side: 'rebel', key: 'erlang', name: '二郎真君', regionMin: 7, regionMax: 7,
    text: '哮天犬围着你的包裹转了三圈，忽然冲着西方吠了一声。二郎真君抚着犬毛：「它说，你身上有妖气——不是恶妖的气，是『不服』的气。取经人，你心里那只不服的妖，养得可好？养好了，是刀；养坏了，是劫。」他取出一截断戟。',
    opts: [
      { text: '答：养得好的不服，是刀；养坏了，是劫——我在养刀（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_zhanyaojue' },
      { text: '接戟——三尖两刃，再断一节（逆·恶+8）', fate: '逆', alignEvil: 8, gear: 'sanjian_p3' }
    ] },
  { id: 'ni_erlang_4', side: 'rebel', key: 'erlang', name: '二郎真君', regionMin: 8, regionMax: 8,
    text: '通天河畔，二郎真君以三尖两刃挑起一捧河水：「当年我在此地擒过妖，河水记得我的刀。取经人，你这一路，可有什么东西记得你？——没有也不要紧，刀记得你，也算记得。」水珠从戟尖滑落。',
    opts: [
      { text: '答：刀记得我，我也记得刀——这就够了（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_zhanyaojue' },
      { text: '接戟——水记得刀，我记下你（逆·恶+8）', fate: '逆', alignEvil: 8, gear: 'sanjian_p4' }
    ] },
  { id: 'ni_erlang_5', side: 'rebel', key: 'erlang', name: '二郎真君', regionMin: 9, regionMax: 9,
    text: '二郎真君现出法天象地，顶天立地，声音如雷：「你看我这法相，大不大？——再大，也大不过天条。取经人，你到了西天，若发现天条比灵山还高，你怎么办？是跪，是站，还是——像我这样，顶住它？」法相收去，他轻咳一声。',
    opts: [
      { text: '答：顶住它——天条再大，也大不过站着的人（逆·恶+10）', fate: '逆', alignEvil: 10, sutra: 'ni_full_zhanyaojue' },
      { text: '接戟——法天象地，顶天立地，也要有兵刃（逆·恶+8）', fate: '逆', alignEvil: 8, gear: 'sanjian_p5' }
    ] },
  { id: 'ni_erlang_6', side: 'rebel', key: 'erlang', name: '二郎真君', regionMin: 10, regionMax: 10,
    text: '二郎真君席地而坐，面前摆着六截断戟：「我这三尖两刃刀，跟了我几千年，折成六截。我试过重铸，铸一次，断一次——后来我不铸了。取经人，你说，是刀不配被重铸，还是我还没配得上用它？」他拾起一截断刃给你。',
    opts: [
      { text: '答：是刀还没等到配得上它的手——现在等到了（逆·恶+8）', fate: '逆', alignEvil: 8, sutra: 'ni_full_zhanyaojue' },
      { text: '接刃——最后一截，我收下了（逆·恶+8）', fate: '逆', alignEvil: 8, gear: 'sanjian_p6' }
    ] },
  { id: 'ni_erlang_7', side: 'rebel', key: 'erlang', name: '二郎真君', regionMin: 11, regionMax: 11,
    text: '二郎真君额上竖目睁开，一道金光扫过你：「我这天眼，看得透变化，看得透妖形——但看不透人心。取经人，你若哪天遇上『天眼照不出』的人，别慌，那天眼不是坏了，是那个人，比妖还难对付。」',
    opts: [
      { text: '答：天眼照不出的人，我用经照（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_zhanyaojue' },
      { text: '答：天眼照不透人心，正好——人心，本来就不是给人看的（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'ni_full_zhanyaojue' }
    ] },
  { id: 'ni_erlang_8', side: 'rebel', key: 'erlang', name: '二郎真君', regionMin: 12, regionMax: 12,
    text: '梅山七圣的旧营帐前，二郎真君独坐饮酒：「当年我们兄弟八个，闹过天宫，也守过天条——如今散的散，走的走。取经人，你说，是情义守不住天条，还是天条容不下情义？」话音未落，风火轮的火先一步落在帐外——哪吒踏轮而来，抱臂站定：「真君，你守的天条，和你守的兄弟，哪个先散？」二郎不抬头，只把酒斟满：「你剔骨还父的时候，可问过你爹，那副骨头是谁给的？」一个把反字刻在刀上，一个把反字刻在骨里，两道影子隔着将熄的篝火对峙。他们同时看向你：「取经人，你说——我们两个，谁的反，更像一条出路？」',
    opts: [
      { text: '答：二郎的反是刀——听调不听宣，留在局里才改得动天条（逆·恶+10）', fate: '逆', alignEvil: 10, sutra: 'ni_full_zhanyaojue' },
      { text: '答：哪吒的反是骨——剔骨还父，自己认得自己，才不用谁给名字（逆·恶+10）', fate: '逆', alignEvil: 10, sutra: 'ni_full_tigujue' },
      { text: '答：你们反的都是天条——可天条最怕的，从来是站着不跪的人（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'ni_full_zhanyaojue' }
    ] },
  { id: 'ni_erlang_9', side: 'rebel', key: 'erlang', name: '二郎真君', regionMin: 13, regionMax: 13,
    text: '深夜，二郎真君额上的竖目睁着，像一盏灯：「我这眼睛，白天看妖，夜里看路。取经人，你夜里赶路的时候，拿什么看路？经文？月光？还是——心里那点不肯灭的东西？」他递来一片断刃，月光照得刃口发亮。',
    opts: [
      { text: '答：夜里赶路，用心里那点不肯灭的东西（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_zhanyaojue' },
      { text: '接刃——刃口发亮，正好照路（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'ni_full_zhanyaojue' }
    ] },
  { id: 'ni_erlang_10', side: 'rebel', key: 'erlang', name: '二郎真君', regionMin: 14, regionMax: 14,
    text: '二郎真君抱臂而立：「这四个字，我念了一辈子——听调，不听宣。取经人，你到了灵山，若有人让你『听宣』，你怎么办？经可以取，命可以交，但『宣』——你交不交？」他难得认真地看着你。',
    opts: [
      { text: '答：听调不听宣——经可以取，宣，不交（逆·恶+10）', fate: '逆', alignEvil: 10, sutra: 'ni_full_zhanyaojue' },
      { text: '答：到灵山再看——若值得，跪一下也无妨（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_zhanyaojue' }
    ] },
  { id: 'ni_erlang_11', side: 'rebel', key: 'erlang', name: '二郎真君', regionMin: 15, regionMax: 15,
    text: '二郎真君将一截断刃掷入河中，刀锋破水而立：「刀入水，水让路。取经人，你的经，能让什么让路？——妖会让路，劫会让路，但『自己』不会。遇着自己这关，刀也好，经也好，都得靠自己过。」断刃随水沉没，他又抛来一截。',
    opts: [
      { text: '答：遇着自己这关，刀和经都靠不住——靠自己（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_zhanyaojue' },
      { text: '接刃——三尖两刃，试过水才知道深浅（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'ni_full_zhanyaojue' }
    ] },
  { id: 'ni_erlang_12', side: 'rebel', key: 'erlang', name: '二郎真君', regionMin: 17, regionMax: 17,
    text: '二郎真君最后见你，身后是天庭的方向：「我要回去听宣了——但我还会回来，因为『调』还在我手上。取经人，三尖两刃刀若在你手里，记住：刀是谁铸的不重要，刀为什么出鞘，才重要。」他纵身而去，哮天犬跟在身后，回头望了你一眼。',
    opts: [
      { text: '答：刀为什么出鞘，我记住了——为了听调不听宣（逆·恶+8）', fate: '逆', alignEvil: 8, sutra: 'ni_full_zhanyaojue' },
      { text: '目送——真君，天庭的路，和西天的路，我都记下了（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_zhanyaojue' }
    ] },
  { id: 'ni_nezha_7', side: 'rebel', key: 'nezha', name: '哪吒', regionMin: 17, regionMax: 17,
    text: '灵山脚下，哪吒最后见你，三头六臂法相收去，只剩一个踩着风火轮的小小身影。他把乾坤圈抛向空中，圈在夕阳里转了三圈，落回他腕上：「剔骨诀六问已尽，我认得了自己，不用圈来替我看路了。取经人，你呢？你这一路，可认得自己了？」风火轮远去，留下一缕莲香，和天边最后一抹火烧云。',
    opts: [
      { text: '答：认得——此身此名，自己认得自己（逆·恶+10）', fate: '逆', alignEvil: 10, sutra: 'ni_full_tigujue' },
      { text: '答：还在认——但走着走着，就快认得了（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'ni_full_tigujue' }
    ] },
  { id: 'ni_liuer_2', side: 'rebel', key: 'liuer', name: '六耳残念', regionMin: 9, regionMax: 9,
    text: '林中树下，躺着一撮毫毛，还在微微颤动。那团影子又出现了，这次它手里攥着自己的毛：「这是我蜕下的——每次学你，我就蜕一层。蜕到最后，我还剩什么？取经人，你这一路，也蜕了多少层？袈裟、禅杖、经文——哪一层才是你？」',
    opts: [
      { text: '答：蜕到最后一层，还剩一个『我』字——这个不蜕（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_xinyuan' },
      { text: '答：哪一层都是蜕下来的壳——但壳里的，是真的（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_xinyuan' }
    ] },
  { id: 'ni_liuer_3', side: 'rebel', key: 'liuer', name: '六耳残念', regionMin: 10, regionMax: 10,
    text: '一面古镜立在林间，镜中却不是你的脸——是六耳猕猴的脸，与你一般无二地笑：「你看，镜子里的是我，镜子外的是你——可我们一模一样。取经人，你说，若把镜子打碎，活下来的是你，还是我？」镜面泛起涟漪。',
    opts: [
      { text: '答：打碎镜子，活下来的是我自己——因为镜子里没我（逆·恶+8）', fate: '逆', alignEvil: 8, sutra: 'ni_full_xinyuan' },
      { text: '答：镜里镜外，都是幻——不看镜子，看路（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_xinyuan' }
    ] },
  { id: 'ni_liuer_4', side: 'rebel', key: 'liuer', name: '六耳残念', regionMin: 11, regionMax: 11,
    text: '六耳的声音从四面八方传来：「我学他，学得像到连如来都分不清——可如来分不清，是因为我像，还是因为他懒得看？取经人，你取经，是因为你真的想要，还是因为——你也没想清楚自己是谁？」林中万影晃动。',
    opts: [
      { text: '答：我没想清楚——所以我才一直走，走着走着就清楚了（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_xinyuan' },
      { text: '答：你像他，像到连自己都忘了自己——这才是你输的地方（逆·恶+8）', fate: '逆', alignEvil: 8, sutra: 'ni_full_xinyuan' }
    ] },
  { id: 'ni_liuer_5', side: 'rebel', key: 'liuer', name: '六耳残念', regionMin: 12, regionMax: 12,
    text: '金钵扣下的一刻，六耳没有挣扎，只留下一句话：「我输了，不是因为我不像——是因为我只会像，不会『是』。取经人，你若有天面对金钵，记得：你不需要像任何人，你只要是你自己。」声音散去，林间只余风声。',
    opts: [
      { text: '答：我记住了——不需要像任何人，只要是我自己（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'ni_full_xinyuan' },
      { text: '答：你输了，但你说的话，我收下了（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'ni_full_xinyuan' }
    ] },
  { id: 'ni_niumo_2', side: 'rebel', key: 'niumo', name: '牛魔旧盟', regionMin: 11, regionMax: 11,
    text: '焦土中又拾到一截扇骨，比上一截更烫。牛魔的声音响起：「这扇子，我媳妇的。她拿它扇灭火焰山，我拿它扇风点火——一扇灭，一扇燃，你说，我们两口子，到底谁对？」扇骨在你掌心灼出一枚印记。',
    opts: [
      { text: '答：一个灭，一个燃——两口子，一个管过去，一个管将来（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'ni_full_niumo' },
      { text: '答：都对——火该灭时灭，该燃时燃（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_niumo' }
    ] },
  // —— V8.57 补火焰山专属事件（原 act11 真薄区 4事件/0隐藏职）——
  { id: 'ev_huoyan_honghaier', side: 'neutral', key: 'honghaier', name: '三昧真火·红孩儿', regionMin: 11, regionMax: 11,
    text: '火焰山深处，一个红孩儿模样的童子盘坐在火眼上，周身三昧真火缭绕。他睁眼瞧你：「取经的，我爹是牛魔王，我娘是铁扇公主，我师父是太上老君——你说，我这三昧真火，该不该烧你？」火舌舔着你的衣角。',
    opts: [
      { text: '答：该烧——但烧了我，谁去西天取经？（战·恶+6，战斗）', fate: '战', alignEvil: 6, fight: true },
      { text: '答：不该烧——真火炼心，不炼路人（渡·善+8）', fate: '渡', alignGood: 8 },
      { text: '答：你烧你的，我走我的——互不相干（隐·善+4）', fate: '隐', alignGood: 4 }
    ] },
  { id: 'ev_huoyan_yumian', side: 'neutral', key: 'yumian', name: '玉面狐狸·积雷山', regionMin: 11, regionMax: 11,
    text: '积雷山摩云洞后，一只玉面狐狸倚在洞口，见你便笑：「取经人，你可知牛魔王为何不回芭蕉洞？因为我这儿有酒有肉有温柔——他媳妇那儿只有扇子和火气。你说，男人该回哪儿？」她抛来一个媚眼。',
    opts: [
      { text: '答：该回芭蕉洞——糟糠之妻不下堂（渡·善+8）', fate: '渡', alignGood: 8 },
      { text: '答：该留摩云洞——温柔乡是英雄冢（夺·恶+6，得装备）', fate: '夺', alignEvil: 6, equipPick: 1 },
      { text: '答：哪儿都不回——路在脚下（逆·恶+4）', fate: '逆', alignEvil: 4 }
    ] },
  { id: 'ni_niumo_3', side: 'rebel', key: 'niumo', name: '牛魔旧盟', regionMin: 12, regionMax: 12,
    text: '摩云洞的残垣断壁间，牛魔王的虚影靠在一根烧黑的柱子上：「这洞，我住了一千年。如今烧了——烧就烧了吧，反正七大圣早就散了。取经人，你说，兄弟散伙，是散在刀上，还是散在心上？」他扔来一片焦木。',
    opts: [
      { text: '答：散在心上——心散了，洞再大也是空的（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_niumo' },
      { text: '答：烧了也好——旧洞装不下新路（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'ni_full_niumo' }
    ] },
  { id: 'ni_niumo_4', side: 'rebel', key: 'niumo', name: '牛魔旧盟', regionMin: 13, regionMax: 13,
    text: '火焰山的余温仍烤得人难受，牛魔却席地而坐，像在享受：「这火，是我当年吹起来的，如今我坐在这火里，倒觉得暖和。取经人，你说，一个人造的孽，能不能拿来取暖？」火光照着他的脸，忽明忽暗。',
    opts: [
      { text: '答：能——造的孽，认得下，就能取暖（逆·恶+8）', fate: '逆', alignEvil: 8, sutra: 'ni_full_niumo' },
      { text: '答：取暖可以，别再添柴（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_niumo' }
    ] },
  { id: 'ni_niumo_5', side: 'rebel', key: 'niumo', name: '牛魔旧盟', regionMin: 14, regionMax: 14,
    text: '一把铁扇的残影立在焦土上，牛魔的声音变得低沉：「我媳妇的铁扇，我儿子的火尖枪，我兄弟的金箍棒——都比我混得好。取经人，你说，我老牛这一辈子，是不是白混了？」残影散去，地上留着一片牛魔卷的碎片。',
    opts: [
      { text: '答：白混不白混，你自己说了算——俺老牛当年也是七大圣（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'ni_full_niumo' },
      { text: '答：媳妇、儿子、兄弟都比你混得好——但他们都记得你（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_niumo' }
    ] },
  { id: 'ni_niumo_6', side: 'rebel', key: 'niumo', name: '牛魔旧盟', regionMin: 12, regionMax: 12,
    text: '牛魔的虚影一拳砸在山壁上，山壁裂开一道缝：「当年我这一拳，能撼山。如今——撼不动了，不是力小了，是心软了。取经人，你一路上杀妖，可曾有过一拳打下去，忽然心软的时候？」裂缝里透出火光。',
    opts: [
      { text: '答：有——但心软，不是力小，是看懂了（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'ni_full_niumo' },
      { text: '答：心软的时候，就放一马——因果自己会找回来（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_niumo' }
    ] },
  { id: 'ni_niumo_7', side: 'rebel', key: 'niumo', name: '牛魔旧盟', regionMin: 13, regionMax: 13,
    text: '牛魔与你对面而坐，中间摆着两碗酒：「当年七大圣结义，说好同生共死——如今我跟你师兄，一个保你取经，一个拦你取经。取经人，你说，是兄弟反了，还是天条反了？——想清楚再答，这碗酒，我等你的答案。」',
    opts: [
      { text: '答：天条先反，兄弟后反——这碗酒，我喝了（逆·恶+10）', fate: '逆', alignEvil: 10, sutra: 'ni_full_niumo' },
      { text: '答：都反了——但兄弟，还能再结一回（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'ni_full_niumo' }
    ] },
  { id: 'ni_niumo_8', side: 'rebel', key: 'niumo', name: '牛魔旧盟', regionMin: 14, regionMax: 14,
    text: '牛魔的虚影起身，走向火焰山深处，最后回头：「我这一辈子，反过天，结过义，败过阵，也认过怂——够本了。取经人，你走你的西天路，我回我的火焰山。若哪天路过，进来喝碗酒——只要你还记得，这世上有个牛魔王。」虚影没入山火，牛魔卷残页飘落。',
    opts: [
      { text: '答：记住了——火焰山，牛魔王，七大圣之首（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_niumo' },
      { text: '答：这碗酒，等我取经回来喝（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'ni_full_niumo' }
    ] },
  { id: 'ni_dapeng_2', side: 'rebel', key: 'dapeng', name: '大鹏展翅', regionMin: 13, regionMax: 13,
    text: '一只巨大的瓶子虚影悬在云海，大鹏的声音从瓶中传来：「我这阴阳二气瓶，装得下天地，装得下日月——就是装不下我自己。取经人，你说，一个人，为什么装得下全世界，装不下自己？」瓶身裂开一道缝，透出金光。',
    opts: [
      { text: '答：因为自己，装不下『自己』这回事（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_qitian' },
      { text: '答：装得下全世界，装不下自己——那就把瓶子打碎（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_qitian' }
    ] },
  { id: 'ni_dapeng_3', side: 'rebel', key: 'dapeng', name: '大鹏展翅', regionMin: 14, regionMax: 14,
    text: '大鹏的虚影停在云端，羽翼遮天：「我吃过佛——不是比喻，是真的。那时候我想，吃掉答案，就不用找了。可吃下去才发现，佛在肚子里，比在外面还难缠。取经人，你可也把什么『吃』下去过？后来，消化了吗？」',
    opts: [
      { text: '答：吃下去的东西，消化不了，就吐出来——佛也一样（逆·恶+8）', fate: '逆', alignEvil: 8, sutra: 'ni_full_qitian' },
      { text: '答：答案不是用来吃的，是用来走的（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_qitian' }
    ] },
  { id: 'ni_dapeng_4', side: 'rebel', key: 'dapeng', name: '大鹏展翅', regionMin: 15, regionMax: 15,
    text: '狮驼岭的妖风残存，大鹏立于山巅：「我那两个结义兄弟，一个青狮，一个白象——都伏了法。我没有，因为我飞得快。取经人，飞得快，是本事，也是逃命的本事。你说，我这辈子，是赢了，还是逃赢了？」金羽落下一片。',
    opts: [
      { text: '答：逃赢了，也是赢——活着，才有下一场（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_qitian' },
      { text: '答：飞得快，是本事；飞得慢，能看清路（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'ni_full_qitian' }
    ] },
  { id: 'ni_dapeng_5', side: 'rebel', key: 'dapeng', name: '大鹏展翅', regionMin: 16, regionMax: 16,
    text: '大鹏的虚影独自掠过云海，这次他没有说话，只在你头顶盘旋三圈，落下一根金羽。你拾起金羽，羽上刻着一行小字：「一翅九万里，也飞不出自己的影子。取经人，你到了西天，别忘了——影子，还在你脚下。」',
    opts: [
      { text: '收羽——影子在脚下，路在翅膀上（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_qitian' },
      { text: '答：到了西天，也记得回头看影子（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'ni_full_qitian' }
    ] },
  { id: 'ni_dapeng_6', side: 'rebel', key: 'dapeng', name: '大鹏展翅', regionMin: 12, regionMax: 12,
    text: '云海上，大鹏与一只猴子的虚影并肩而立，又倏然分开：「当年我与他，一个齐天，一个吞佛——都是想把天捅个窟窿的。如今一个保你取经，一个拦你取经。取经人，你说，捅天的人，是不是最后都会被天收编？」两只影子散入云中，齐天残卷的碎片落入你怀中。',
    opts: [
      { text: '答：捅天的人，最后都被天收编——但捅过的那一下，天记得（逆·恶+10）', fate: '逆', alignEvil: 10, sutra: 'ni_full_qitian' },
      { text: '答：齐天也好，吞佛也好——都是一阵风（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'ni_full_qitian' }
    ] },
  { id: 'ni_zhongzhang_2', side: 'rebel', key: 'zhongzhang', name: '逆道终章', regionMin: 15, regionMax: 15,
    text: '天竺国界，你摊开旧账簿，新墨浮现：「天竺 · 玉兔下凡 · 谁放她下界的？」这一次，笔迹旁多了一行小字：「逆道至此，已有九笔。九笔之后，你该问自己：还要批多少笔，才算完？」夜空无月，账簿自明。',
    opts: [
      { text: '批第九笔——九笔之后，还有十笔，百笔（逆·恶+10）', fate: '逆', alignEvil: 10, sutra: 'ni_full_nitian' },
      { text: '合上账簿——天竺的旧案，记在心里就够了（隐·善+4）', fate: '隐', alignGood: 4, sutra: 'ni_full_nitian' }
    ] },
  { id: 'ni_zhongzhang_3', side: 'rebel', key: 'zhongzhang', name: '逆道终章', regionMin: 16, regionMax: 16,
    text: '灵山脚下，传经吏索要人事，你低头看账簿，最后一页自动翻开：「灵山 · 索经人事 · 谁定的规矩？」你提笔，却悬而未落——这一笔下去，你便是与整个灵山为敌。笔尖墨滴将坠未坠，等你决断。',
    opts: [
      { text: '落笔——这一笔下去，我与灵山为敌，也在所不惜（逆·恶+12）', fate: '逆', alignEvil: 12, sutra: 'ni_full_nitian' },
      { text: '不落笔——经要取，账也要记，但不在灵山门口撕破脸（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'ni_full_nitian', favor: '观音' }
    ] },
  { id: 'ni_zhongzhang_4', side: 'rebel', key: 'zhongzhang', name: '逆道终章', regionMin: 17, regionMax: 17,
    text: '凌云渡口，无底船随波而来，你看见水中倒影——那不是你，是金蝉子十世前的模样。账簿无风自动，翻至终页：「金蝉子 · 轻慢 · 十世轮回 · 今世逆道 —— 旧账，清了。」你抬脚踏上船，回头望了一眼来路，将账簿合上，收进怀里。',
    opts: [
      { text: '踏上船——旧账清了，新路自己写（逆·恶+10）', fate: '逆', alignEvil: 10, sutra: 'ni_full_nitian' },
      { text: '合账入怀——十世轮回的账，到此为止（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'ni_full_nitian' }
    ] },

  // ========== V8.44 事件专属装备（每槽位独立特殊装备，参照冒险日记事件装备体系） ==========
  // 次级装备：地区 4-8 发放；顶级装备：地区 12-16 发放。
  // 全部经事件选项 gear 授予（与经文/其它选择竞争），无法从掉落/商店稳定获得——逼迫玩家多走事件。
  // —— 次级 · 武器（逆线·二郎哮天犬）——
  { id: 'ev_w_langya_ev', side: 'rebel', key: 'xiaotian', name: '哮天犬·啸月', regionMin: 5, regionMax: 5,
    text: '二郎庙前，一头细犬蹲坐月下，喉咙里滚着低沉的呜咽。它不吠你，只把一颗沾血的獠牙叼到你脚边——那是它咬断前朝犬妖喉咙时崩落的牙。庙门内传来二郎真君的话：「狗认人，也认心。它既把牙给你，便是认了你这条逆路——接不接，随你。」',
    opts: [
      { text: '接牙——逆路之上，犬牙亦利（逆·恶+6）', fate: '逆', alignEvil: 6, gear: 'ev_w_langya' },
      { text: '还牙——我走逆路，不欠犬命（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'su_full_xinjing' }
    ] },
  // —— 次级 · 甲胄（渡线·地藏无当）——
  { id: 'ev_a_wudang_ev', side: 'ferry', key: 'dizangwudang', name: '地藏·无当', regionMin: 5, regionMax: 5,
    text: '幽冥裂隙边，地藏菩萨解下外披的衲衣，叠好放在青石上：「地狱门口风大，我这件无当衲，穿了八万劫，没让一丝阴风透进来过。取经人，你若渡我地狱门前那一关，这衣给你——阴风不侵，护的是身，也是心。」',
    opts: [
      { text: '受衲——阴风不侵，护身亦护心（渡·善+8）', fate: '渡', alignGood: 8, gear: 'ev_a_wudang' },
      { text: '谢却——菩萨的衣，渡的是菩萨，我自渡（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'su_full_dizang' }
    ] },
  // —— 次级 · 头冠（渡线·文殊毗卢）——
  { id: 'ev_h_pilu_ev', side: 'ferry', key: 'wenshupilu', name: '文殊·毗卢', regionMin: 7, regionMax: 7,
    text: '五台山道场，文殊菩萨摘下头顶毗卢冠，横放在膝上：「这冠本有五佛，我借你戴一日——慧剑之冠，照见五蕴，也照见妖心。你戴上它走一程，若剑锋所指皆是妄念，这冠便归你；若是私愤，明日交还。」',
    opts: [
      { text: '戴冠——照见五蕴，也照见妖心（渡·善+8）', fate: '渡', alignGood: 8, gear: 'ev_h_pilu' },
      { text: '不戴——我怕照见自己心里那只妖（隐·善+4）', fate: '隐', alignGood: 4, sutra: 'su_full_lengyan' }
    ] },
  // —— 次级 · 战靴（渡线·哪吒登云）——
  { id: 'ev_b_dengyun_ev', side: 'ferry', key: 'nezha dengyun', name: '哪吒·登云', regionMin: 4, regionMax: 4,
    text: '山道上一双藕丝织就的短靴搁在石上，旁边刻着一行火纹小字：「剔骨还父那日，我光着脚走了一百里，后来才想起还有登云履。取经人，送你——快一步，少挨一刀。」远处传来哪吒踩着风火轮的笑声，转瞬即散。',
    opts: [
      { text: '纳履——快一步，少挨一刀（渡·善+4）', fate: '渡', alignGood: 4, gear: 'ev_b_dengyun' },
      { text: '不收——我宁慢一步，也要走直路（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'ni_full_tigujue' }
    ] },
  // —— 次级 · 法宝（渡线·镇元混元）——
  { id: 'ev_t_hunyuan_ev', side: 'ferry', key: 'zhenyuan hunyuan', name: '镇元·混元', regionMin: 8, regionMax: 8,
    text: '五庄观后院，镇元子将一只巴掌大的布袋系在人参果枝上：「此袋是开天时混元一气所凝，装了万年的云气。取经人，你这一路受的伤，它替你反回去几分——袋口朝外，恩怨自了。」布袋轻轻晃动，像在等你伸手。',
    opts: [
      { text: '取袋——袋口朝外，恩怨自了（渡·善+6）', fate: '渡', alignGood: 6, gear: 'ev_t_hunyuan' },
      { text: '不取——恩怨若可反，何必随身带（隐·善+2）', fate: '隐', alignGood: 2, sutra: 'su_full_wuliangshou' }
    ] },
  // —— 顶级 · 武器（逆线·刑天断首）——
  { id: 'ev_w_xingtian_ev', side: 'rebel', key: 'xingtian', name: '刑天·断首', regionMin: 14, regionMax: 14,
    text: '常羊山下，一具无头巨影以乳为目、以脐为口，正挥动一柄开山大斧劈向山壁：「天帝砍了我的头，我便以乳为目——他以为斩首便是绝路，不知我还能看，还能战。取经人，此斧有万钧之力，破甲如纸。你若有胆接下，便替我多砍几个『天』字。」',
    opts: [
      { text: '接斧——以乳为目，亦能看天（逆·恶+10）', fate: '逆', alignEvil: 10, gear: 'ev_w_xingtian' },
      { text: '不接——我取经，不砍天（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_niepan' }
    ] },
  // —— 顶级 · 甲胄（渡线·灵山金缕）——
  { id: 'ev_a_ruyi_ev', side: 'ferry', key: 'ruyi jinyi', name: '灵山·金缕', regionMin: 16, regionMax: 16,
    text: '凌云渡口，一位老僧将一件金缕玉衣放在筏头：「此衣是如来座前金缕所织，穿了它，劫火不焚、刀兵不伤。取经人，你到灵山只差一步——这一步，可要金缕护着走？」衣上宝光流转，映着对岸的灵山。',
    opts: [
      { text: '受衣——劫火不焚，刀兵不伤（渡·善+8）', fate: '渡', alignGood: 8, gear: 'ev_a_ruyi' },
      { text: '不穿——赤身过河，见真佛（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'su_full_fahua' }
    ] },
  // —— 顶级 · 头冠（渡线·灵山五佛）——
  { id: 'ev_h_wufo_ev', side: 'ferry', key: 'wufo guan', name: '灵山·五佛冠', regionMin: 16, regionMax: 16,
    text: '大雷音寺偏殿，供桌上搁着一顶五佛冠，冠上五佛皆闭目。护法伽蓝垂首：「此冠曾随燃灯古佛照过过去劫。取经人，你若受此冠，愿力自增——只是五佛闭目，你须自己睁眼，辨这十万八千里的善恶。」',
    opts: [
      { text: '受冠——五佛闭目，我自睁眼（渡·善+8）', fate: '渡', alignGood: 8, gear: 'ev_h_wufo' },
      { text: '不受——冠上的佛不睁眼，我不戴（隐·善+2）', fate: '隐', alignGood: 2, sutra: 'su_full_niepan' }
    ] },
  // —— 顶级 · 战靴（逆线·天庭踏云）——
  { id: 'ev_b_tayun_ev', side: 'rebel', key: 'tayun zhui feng', name: '天庭·踏云', regionMin: 12, regionMax: 12,
    text: '南天门外，一双流云织就的靴子悬在半空，踩过它便踏云而行。守门天将嗤笑：「这是当年大圣闹天宫时踢落的一双——他踩云是逃命，你取经是赶路，要这劳什子作甚？」靴上云气翻涌，似在催促。',
    opts: [
      { text: '取靴——赶路的人，也要快（逆·恶+6）', fate: '逆', alignEvil: 6, gear: 'ev_b_tayun' },
      { text: '不要——我一步一个脚印，踏到西天（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'su_full_xinjing' }
    ] },
  // —— 顶级 · 法宝（渡线·女娲山河）——
  { id: 'ev_t_shanhe_ev', side: 'ferry', key: 'nuwa shanhe', name: '女娲·山河社稷图', regionMin: 13, regionMax: 13,
    text: '洪炉遗址，一卷残破的图轴压在山石下，图上山河俱在，只是边缘焦黑。山神显形：「这是女娲补天时绘的山河社稷图残卷——残了，仍能纳山河于方寸。取经人，你若取它，山河为盾，反震诸邪；只是残卷有灵，未必肯认你。」',
    opts: [
      { text: '取图——山河为盾，反震诸邪（渡·善+8）', fate: '渡', alignGood: 8, gear: 'ev_t_shanhe' },
      { text: '不取——残卷有灵，我亦有主（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'ni_full_nitian' }
    ] },
  // —— 次级 · 武器（逆线·逆鳞刀·次）——
  { id: 'ev_w_nilin_ev', side: 'rebel', key: 'nilin', name: '逆鳞·龙族', regionMin: 6, regionMax: 6,
    text: '鹰愁涧底，一截逆生的龙鳞卡在礁石缝里，鳞上血痕未干。老龙王的声音从水下浮起：「我儿犯天条被剥了鳞，这枚逆鳞它临死塞进石缝——说逆路之人，才配带逆鳞。取经人，你若选了逆，便拔它出来。」',
    opts: [
      { text: '拔鳞——逆路之人，配带逆鳞（逆·恶+6）', fate: '逆', alignEvil: 6, gear: 'ev_w_nilin' },
      { text: '不取——龙鳞有主，我不夺亡鳞（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'su_full_xinjing' }
    ] },
  // —— 次级 · 甲胄（逆线·焚天甲）——
  { id: 'ev_a_fentian_ev', side: 'rebel', key: 'fentian', name: '焚天·业火', regionMin: 6, regionMax: 6,
    text: '火焰山余烬里，一副焦黑的甲胄半埋沙中，甲缝里还窜着细小的业火。罗刹女的冷笑自远处传来：「这是被我烧过的叛奴的甲——业火认主，专烧不忠之人。你若逆天而行，它便烧你敌人。」',
    opts: [
      { text: '披甲——业火认主，专烧不忠（逆·恶+6）', fate: '逆', alignEvil: 6, gear: 'ev_a_fentian' },
      { text: '不披——火烧之人，我亦不忍（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'su_full_dizang' }
    ] },
  // —— 次级 · 武器（渡线·柳杖净瓶）——
  { id: 'ev_w_liuzhi_ev', side: 'ferry', key: 'liuzhi', name: '普贤·柳杖', regionMin: 5, regionMax: 5,
    text: '落伽岩畔，一枝杨柳斜插在净瓶口，柳叶上还凝着未干的甘露。善财童子倚栏笑道：「菩萨说，柳枝沾过甘露，点化的不只是枯骨，也是执念。取经人，你若愿渡人，这杖便随你——愿伤所及，皆是慈悲。」',
    opts: [
      { text: '受杖——柳枝甘露，渡人亦渡己（渡·善+6）', fate: '渡', alignGood: 6, gear: 'ev_w_liuzhi' },
      { text: '不取——我自有禅杖，不必借柳（隐·善+2）', fate: '隐', alignGood: 2, sutra: 'su_full_lengyan' }
    ] },
  // —— 次级 · 甲胄（渡线·功德袈裟）——
  { id: 'ev_a_gongde_ev', side: 'ferry', key: 'gongde', name: '功德·袈裟', regionMin: 7, regionMax: 7,
    text: '化缘路上，一老妪抖开一件补丁摞补丁的袈裟：「这是我儿成佛前穿的——他说功德不在金线，在补丁里。取经人，你若肯受，这衲便替你挡三分业风。」袈裟虽旧，针脚却密如经文。',
    opts: [
      { text: '受衲——功德在补丁，不在金线（渡·善+8）', fate: '渡', alignGood: 8, gear: 'ev_a_gongde' },
      { text: '谢却——老妪的衣，留给老妪（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'ni_full_tigujue' }
    ] },
  // —— 次级 · 法宝（逆线·业火囊）——
  { id: 'ev_t_yehuo_ev', side: 'rebel', key: 'yehuo', name: '业火·炼魂', regionMin: 9, regionMax: 9,
    text: '无底洞深处，一只焦皮囊悬在火脉口，囊中业火明明灭灭。地涌夫人探出半身：「这是我炼了百年的业火——专烧负心人。取经人，你若逆天，这火便烧你的敌；若负了它，烧的是你。」',
    opts: [
      { text: '收囊——业火炼心，亦炼敌（逆·恶+6）', fate: '逆', alignEvil: 6, gear: 'ev_t_yehuo' },
      { text: '不收——火太烈，怕烧着自己（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'su_full_wuliangshou' }
    ] },
  // ========== V8.52 渡/逆次级事件装备·补发（修复并行新增装备无事件发放的死数据） ==========
  // 次级补发事件：渡线地区 4-8 / 逆线地区 6-9，与既有同级事件错开 key 共存。
  // —— 次级 · 头冠（渡线·宝相庄严）——
  { id: 'ev_h_baoxiang_ev', side: 'ferry', key: 'baoxiang', name: '宝相·庄严', regionMin: 7, regionMax: 7,
    text: '古刹残殿，供案上一顶宝相冠端放，冠上佛光已黯，尘埃落定。老僧扫阶而过，头也不抬：「宝相庄严，原是给人看的——你戴上它，是渡人，还是渡自己？」冠上最后一线佛光，正缓缓熄灭。',
    opts: [
      { text: '戴冠——庄严宝相，渡己亦渡人（渡·善+6）', fate: '渡', alignGood: 6, gear: 'ev_h_baoxiang' },
      { text: '不戴——相由心生，冠不过空壳（隐·善+2）', fate: '隐', alignGood: 2, sutra: 'su_full_lengyan' }
    ] },
  // —— 次级 · 战靴（渡线·步步生莲）——
  { id: 'ev_b_lianbu_ev', side: 'ferry', key: 'lianbu', name: '莲步·生莲', regionMin: 4, regionMax: 4,
    text: '荒塘边，一双青莲色的短靴搁在莲叶上，鞋尖竟真的顶着一朵未开的莲苞。浣衣的村姑笑道：「这是上一位过路的师父留下的——说是步步生莲，走得快些，少踩些泥。你要赶路，便拿去穿。」',
    opts: [
      { text: '纳履——步步生莲，少踩烂泥（渡·善+4）', fate: '渡', alignGood: 4, gear: 'ev_b_lianbu' },
      { text: '不收——莲在泥中，不在脚下（隐·善+2）', fate: '隐', alignGood: 2, sutra: 'su_full_xinjing' }
    ] },
  // —— 次级 · 法宝（渡线·甘露宝囊）——
  { id: 'ev_t_ganlu_ev', side: 'ferry', key: 'ganlu', name: '甘露·宝囊', regionMin: 8, regionMax: 8,
    text: '甘露井边，一只玉囊悬在辘轳上，囊口凝着一滴将落未落的甘霖。井神低语：「此囊盛过观音净瓶里的甘露，一滴可润枯骨。取经人，你这一路见惯了枯骨——要不要带一滴在身上？」',
    opts: [
      { text: '取囊——一滴甘露，或可润一具枯骨（渡·善+6）', fate: '渡', alignGood: 6, gear: 'ev_t_ganlu' },
      { text: '不取——井水自流，甘露有主（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'ni_full_nitian' }
    ] },
  // —— 次级 · 头冠（逆线·修罗冠）——
  { id: 'ev_h_xiuluo_ev', side: 'rebel', key: 'xiuluo', name: '修罗·战冠', regionMin: 6, regionMax: 6,
    text: '阿修罗道残影中，一顶玄铁战冠悬在血色雾气里，冠上刻满刀兵交错的纹路。修罗王虚影开口：「我斗了一辈子，冠上的纹不是装饰，是记仇的账本。取经人，你若走逆路，这冠替你记着每一笔——接了它，就别想一笔勾销。」',
    opts: [
      { text: '接冠——账本记仇，我也记恩（逆·恶+6）', fate: '逆', alignEvil: 6, gear: 'ev_h_xiuluo' },
      { text: '不接——恩怨入土，不记账（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'su_full_dizang' }
    ] },
  // —— 次级 · 战靴（逆线·踏火靴）——
  { id: 'ev_b_tahuo_ev', side: 'rebel', key: 'tahuo', name: '踏火·无痕', regionMin: 6, regionMax: 6,
    text: '火窟前，一双铁底战靴陷在焦土里，靴底还烙着未灭的火痕。守窟的夜叉嗤笑：「这靴踏过三千里火海，不烫脚，也不留痕——适合烧了桥再走的人。取经人，你走得够不够快？」',
    opts: [
      { text: '取靴——踏火无痕，快意恩仇（逆·恶+6）', fate: '逆', alignEvil: 6, gear: 'ev_b_tahuo' },
      { text: '不要——我走得慢，但桥不烧（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'su_full_wuliangshou' }
    ] },
  // ========== V8.52 渡/逆顶级事件装备（地区 12-16 发放，每路线 5 槽位） ==========
  // —— 顶级 · 武器（渡线·接引净渡）——
  { id: 'ev_w_jiedu_ev', side: 'ferry', key: 'jiedu', name: '接引·净渡杖', regionMin: 12, regionMax: 12,
    text: '灵山脚下，接引道人拄着一根净渡锡杖立在筏头，杖上九环叮当：「此杖渡人过河，也渡人过妄念。取经人，你这一路渡了多少魂，它便记得多少恩——愿力所及，皆得安渡。」杖身青光流转，似在等你接过。',
    opts: [
      { text: '受杖——渡魂渡妄，愿力安处（渡·善+10）', fate: '渡', alignGood: 10, gear: 'ev_w_jiedu' },
      { text: '不接——杖渡他人，我自渡己（隐·善+4）', fate: '隐', alignGood: 4, sutra: 'su_full_niepan' }
    ] },
  // —— 顶级 · 甲胄（渡线·菩提金身）——
  { id: 'ev_a_puti_ev', side: 'ferry', key: 'puti jinshen', name: '菩提·金身', regionMin: 13, regionMax: 13,
    text: '菩提树下，一具金身法相盘坐，身披的袈裟在风里猎猎作响——法相闭目，却开口：「此身是菩提树下的悟，穿了它，业风不蚀、刀兵不伤。取经人，你到灵山还差两步，这一步要不要借我金身护着？」',
    opts: [
      { text: '受金身——业风不蚀，刀兵不伤（渡·善+10）', fate: '渡', alignGood: 10, gear: 'ev_a_puti' },
      { text: '不借——我的身，我自己护（逆·恶+6）', fate: '逆', alignEvil: 6, sutra: 'ni_full_tigujue' }
    ] },
  // —— 顶级 · 头冠（渡线·如来藏冠）——
  { id: 'ev_h_rulaizang_ev', side: 'ferry', key: 'rulaizang', name: '如来·藏冠', regionMin: 15, regionMax: 15,
    text: '大雷音寺藏经阁，一顶如来藏冠供奉在佛龛中，冠上慧光内敛、不假外饰。伽蓝垂首：「如来藏性，众生本具——此冠不增你一分，只照见你本有的。取经人，你戴上它，照见的若是慈悲，便是归你。」',
    opts: [
      { text: '受冠——照见本有，慈悲自生（渡·善+10）', fate: '渡', alignGood: 10, gear: 'ev_h_rulaizang' },
      { text: '不受——本具如来藏，何须冠上求（隐·善+4）', fate: '隐', alignGood: 4, sutra: 'su_full_lengyan' }
    ] },
  // —— 顶级 · 战靴（渡线·接引莲台）——
  { id: 'ev_b_jieyin_ev', side: 'ferry', key: 'jieyin lian', name: '接引·莲台', regionMin: 14, regionMax: 14,
    text: '通天河畔，八宝功德池中一朵金莲徐徐展开，莲心托着一双莲台靴。池边老龟开口：「这靴踏莲而行，一步一接引——渡的是此岸到彼岸。取经人，你走了十万八千里，最后这几步，要不要莲花托着？」',
    opts: [
      { text: '纳履——莲台接引，彼岸可渡（渡·善+8）', fate: '渡', alignGood: 8, gear: 'ev_b_jieyin' },
      { text: '不踏——此岸即彼岸，何须莲托（逆·恶+4）', fate: '逆', alignEvil: 4, sutra: 'su_full_fahua' }
    ] },
  // —— 顶级 · 法宝（渡线·八宝功德斛）——
  { id: 'ev_t_bafu_ev', side: 'ferry', key: 'bafu', name: '八宝·功德斛', regionMin: 12, regionMax: 12,
    text: '阿难尊者立在功德林前，手中托着一只八宝斛：「此斛盛过八百年的功德水，泼出去，能养一方的善。取经人，你取经路上结的善缘，它替你反哺回去几分——只是功德如水，盛得越多，漏得也快。」',
    opts: [
      { text: '受斛——功德如水，泼予众生（渡·善+10）', fate: '渡', alignGood: 10, gear: 'ev_t_bafu' },
      { text: '不受——功德自持，不假于器（隐·善+4）', fate: '隐', alignGood: 4, sutra: 'su_full_wuliangshou' }
    ] },
  // —— 顶级 · 武器（逆线·狂龙戟）——
  { id: 'ev_w_kuanglong_ev', side: 'rebel', key: 'kuanglong', name: '狂龙·逆鳞', regionMin: 13, regionMax: 13,
    text: '龙渊断崖，一柄狂龙戟插在崖顶，戟刃上还缠着半截崩断的龙须。龙女的泣音自渊底浮起：「这戟是用我族逆鳞铸的——逆命者持之，戟啸如龙。取经人，你既选了逆，便拔它起来，替我向天讨个公道。」',
    opts: [
      { text: '拔戟——逆鳞所铸，向天讨公道（逆·恶+10）', fate: '逆', alignEvil: 10, gear: 'ev_w_kuanglong' },
      { text: '不拔——龙冤天讨，我不添一戟（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_dizang' }
    ] },
  // —— 顶级 · 甲胄（逆线·魔将玄甲）——
  { id: 'ev_a_mojiang_ev', side: 'rebel', key: 'mojiang', name: '魔将·玄甲', regionMin: 12, regionMax: 12,
    text: '古战场遗迹，一具魔将枯骨半跪在荒原，身上的玄甲锈迹斑斑却未朽坏。枯骨空荡荡的眼窝里燃起一点幽火：「这是我生前最后一战穿的甲——护着我打到了最后一刻。取经人，你若敢走逆路，这甲护你，也压你。」',
    opts: [
      { text: '披甲——玄甲护身，亦压心志（逆·恶+10）', fate: '逆', alignEvil: 10, gear: 'ev_a_mojiang' },
      { text: '不披——枯骨之甲，我不夺遗（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_niepan' }
    ] },
  // —— 顶级 · 头冠（逆线·战神冠）——
  { id: 'ev_h_zhanshen_ev', side: 'rebel', key: 'zhanshen', name: '战神·遗冠', regionMin: 15, regionMax: 15,
    text: '云海残墟，一顶战神冠悬在战场上空，冠上刀痕与箭孔纵横，却仍透着一股不驯的锐气。持冠的残影开口：「我战了一生，败过也胜过，冠上的伤都是挣来的。取经人，你若不怕这冠压弯你的脊梁，便接去——战神之名，从不轻授。」',
    opts: [
      { text: '接冠——战神之名，挣来不跪（逆·恶+10）', fate: '逆', alignEvil: 10, gear: 'ev_h_zhanshen' },
      { text: '不接——我不做战神，只做行者（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_xinjing' }
    ] },
  // —— 顶级 · 战靴（逆线·夜叉逐风）——
  { id: 'ev_b_yasha_ev', side: 'rebel', key: 'yasha', name: '夜叉·逐风', regionMin: 14, regionMax: 14,
    text: '幽冥渡口，夜叉王将一双玄色战靴掷在岸边：「我族逐风而行，追得上仇人，也逃得过追兵。取经人，你走逆路，迟早被人追——这靴让你快三分，是逃是追，看你自己。」靴底风声呜呜，似已按捺不住。',
    opts: [
      { text: '取靴——逐风而行，是逃是追（逆·恶+8）', fate: '逆', alignEvil: 8, gear: 'ev_b_yasha' },
      { text: '不要——我不逃，也不追（渡·善+4）', fate: '渡', alignGood: 4, sutra: 'su_full_niepan' }
    ] },
  // —— 顶级 · 法宝（逆线·盘狱炼魂铃）——
  { id: 'ev_t_panyu_ev', side: 'rebel', key: 'panyu', name: '盘狱·炼魂铃', regionMin: 16, regionMax: 16,
    text: '盘狱深处，一只青铜炼魂铃悬在熔岩口，铃身淬着地狱火，轻摇便荡出魂吟。狱主虚影低笑：「这铃炼过十万魂，反的是一身怨。取经人，你到西天了——带着这铃，还是把它留在地狱口？」铃音幽幽，似问非问。',
    opts: [
      { text: '收铃——炼魂之怨，反诸其身（逆·恶+10）', fate: '逆', alignEvil: 10, gear: 'ev_t_panyu' },
      { text: '不取——怨入地狱，不随我身（渡·善+6）', fate: '渡', alignGood: 6, sutra: 'su_full_fahua' }
    ] },
  // —— P0-C 传承事件（死亡渐进解锁 · V3 §3.2）：deathReq 达阈值才入问号池——
  //    生死之间见识过的行脚，把前几世的见闻点给这一世的你——「每死一局＝多一桩可遇的传承缘」。
  { id: 'ev_death_guanyin', side: 'ferry', key: 'death_guanyin', name: '观音·化缘旧事', regionMin: 3, regionMax: 8, deathReq: 3,
    text: '一个渡口老僧拦下你，递来一只缺口的净瓶：「前几世的行脚，有一位死在净瓶山下的——他说，观音菩萨化缘化到他面前时，他讨了一滴甘露，此后逢水难必活。我在这儿守了三世，等一个愿意听这段旧事的取经人。你这一世，遇见过观音吗？」',
    opts: [
      { text: '听旧事——甘露一滴，渡尽水难（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_guanyin' },
      { text: '讨净瓶——缺口盛得住水，也盛得住因果（渡·善+4）', fate: '渡', alignGood: 4, effect: { gold: 60 } }
    ] },
  { id: 'ev_death_wenshu', side: 'ferry', key: 'death_wenshu', name: '文殊·慧剑遗痕', regionMin: 8, regionMax: 13, deathReq: 6,
    text: '山崖上一道三丈深的剑痕，切进石壁七尺。崖下坐着个白发剑客，抚着断刃：「这是文殊菩萨点化我师父时留下的——他一剑斩了我师父的执念，我师父从此再没拔过剑，却在寺里写了三十年经。取经人，我师父说：见剑痕如见慧剑，你悟不悟？」',
    opts: [
      { text: '悟——慧剑斩执，不在刃在念（渡·善+8）', fate: '渡', alignGood: 8, sutra: 'su_full_wenshu' },
      { text: '问剑客——三十年写经，可曾再起过执念（隐·善+4）', fate: '隐', alignGood: 4, effect: { gold: 50 } }
    ] }
];

// 双线事件池：当前地区可触发且未触发过（逆线需本局选过逆）
NDX.sutraEventPool = function (s, act) {
  const done = s._sutraEvDone || {};
  const niOpen = (s.fate && (s.fate.逆 || 0) >= 1);
  // P0-C 传承事件：deathReq 达累计死亡阈值才入池（横向解锁）
  const _dcnt = (typeof NDX.deathCount === 'function') ? NDX.deathCount() : 0;
  return NDX.SUTRA_EVENTS.filter((ev) => {
    if (done[ev.id]) return false;
    if (act < ev.regionMin || act > ev.regionMax) return false;
    if (ev.side === 'rebel' && !niOpen) return false;
    if (ev.deathReq && _dcnt < ev.deathReq) return false;
    return true;
  });
};
// 标记事件已触发（局内一生一次）
NDX.sutraEventDone = function (s, evId) {
  if (!s._sutraEvDone) s._sutraEvDone = {};
  s._sutraEvDone[evId] = true;
};

// —— V8.53 事件装备分池 + 加权 + 保底 ——
// 判断事件是否为装备事件（任一选项带 gear）
NDX._isGearEvent = function (ev) {
  return !!(ev && ev.opts && ev.opts.some(function (o) { return o && o.gear; }));
};
// 装备子池：当前地区可触发且带 gear 的事件
NDX.sutraGearPool = function (s, act) {
  return NDX.sutraEventPool(s, act).filter(function (ev) { return NDX._isGearEvent(ev); });
};
// 普通子池：当前地区可触发且不带 gear 的事件
NDX.sutraNormalPool = function (s, act) {
  return NDX.sutraEventPool(s, act).filter(function (ev) { return !NDX._isGearEvent(ev); });
};
// 加权随机选事件：①装备顶级×1.5 ②六道属性对应side加权
NDX.weightedSutraPick = function (pool, s) {
  if (!pool || !pool.length) return null;
  if (pool.length === 1) return pool[0];
  var fate = s.fate || {};
  var ferryTotal = (fate['渡'] || 0) + (fate['缘'] || 0) + (fate['隐'] || 0);
  var rebelTotal = (fate['战'] || 0) + (fate['夺'] || 0) + (fate['逆'] || 0);
  var weights = pool.map(function (ev) {
    var w = 1;
    // ①装备事件加权：顶级(地区>=12)×1.5，次级×1.2
    if (NDX._isGearEvent(ev)) {
      w *= (ev.regionMin >= 12) ? 1.5 : 1.2;
    }
    // ②六道属性加权：对应side属性越高权重越高（每点+10%，上限+100%）
    if (ev.side === 'ferry') {
      w *= (1 + Math.min(ferryTotal, 10) * 0.1);
    } else if (ev.side === 'rebel') {
      w *= (1 + Math.min(rebelTotal, 10) * 0.1);
    }
    return w;
  });
  var total = weights.reduce(function (a, b) { return a + b; }, 0);
  var r = Math.random() * total;
  for (var i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
};
