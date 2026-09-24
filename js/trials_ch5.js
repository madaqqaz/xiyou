// ============================================================================
// trials_ch5.js — 《逆道西行》八十一难 · 第 5 章（难 42–46，骨架 v1.19 对齐）
// 拆分依据：骨架 v1.19 九章边界（合入式，保持 NDX.TRIAL_LIB 单对象接口）
// act 字段按指令显式置 5（由 trials_return.js 的 normalizeTrialLibAct() 统一派生）。
// 内容来源：《第五章_女儿国之劫_42-46难_新版.md》(v3.0 终版 · SOURCE OF TRUTH)。
// 结构：42-43 女儿国(复合·2难合并) / 44 琵琶洞·蝎子精(单) / 45-46 六耳猕猴·真假美猴王(复合Boss)。
// 英雄键严格：tangseng / wukong / bajie / shaseng / xiaobailong（绝无 bailongma）。
// 选项文本去标签（§4.1）：label 不含「战/渡/隐/夺/缘/逆」，仅 fate/key 落码。
// ============================================================================
NDX.TRIAL_LIB = Object.assign(NDX.TRIAL_LIB || {},
{
  // ── 第42难 · 女儿国·子母河（复合劫难·阶段1，仅立 flag，无六道结算）──
  42: {
    id: 42,
    name: '女儿国·子母河',
    act: 5,
    type: 'event',
    icon: '🌊',
    portrait: '如意真仙',
    fate: '渡',
    echo: '复合阶段1·子母河(战/隐/渡立flag→43)；缘宝物节点=避毒珠；红孩儿gate→43缘',
    branchKey: 'n42_nver',
    dark: '女儿国没有男人，子母河的水喝了便怀孕。唐僧和八戒口渴，饮了河水，行不多时腹痛难忍，腹部渐渐隆起——他们怀胎了。悟空探听得来：此乃子母河，男子饮之即怀胎，须去解阳山落胎泉取水方能落胎。那落胎泉由如意真仙守着，他是牛魔王的兄弟，因悟空降了红孩儿，记恨在心，不肯轻易给水。八戒哭丧着脸：师父，我们怀孕了。你可以直奔解阳山强夺，也可以不喝泉水、带着身孕往西走，或者变作牛魔王的模样，用一句谎去换一碗水。',
    intro: '子母河畔，师徒怀胎。落胎泉在解阳山——"守了三百年便是我的"，这道理你答不上来。阶段1仅定路线，六道于招亲后统一结算。',
    options: [
      { key: '战', label: '直奔解阳山，强夺落胎泉', fate: '战', effect: { alignEvil: 5 }, fight: true, setFlag: 'n42_nver:zhan', consequence: '前往解阳山强夺落胎泉（阶段2→战路线）' },
      { key: '隐', label: '不饮泉水，带身孕继续西行', fate: '隐', effect: { alignEvil: 3 }, setFlag: 'n42_nver:yin', consequence: '带着身孕进入女儿国（阶段2→隐路线）' },
      { key: '渡', label: '变作牛魔王，用计谋换泉水', fate: '渡', effect: { alignGood: 4 }, setFlag: 'n42_nver:du', consequence: '变牛魔王骗真仙，悄然取泉（阶段2→渡路线）' }
    ],
    treasure: { id: 'tre_biduzhu', type: 'treasure', note: '避毒珠·女儿国前宝物节点(缘·三选一必有；六珠⑥·僧袍配件+法宝双用·不消耗)' },
    hidden: { hero: 'tangseng', cond: '取经人+来福在队', job: '女儿国·双随从', hint: '取经人携来福同入女儿国——双随从触发特殊对话', desc: '女儿国事件·取经人与来福同队特殊对话（骨架 A9）' }
  },

  // ── 第43难 · 女儿国·解阳山+女王招亲（复合劫难·阶段2+阶段3，最终抉择统一结算）──
  43: {
    id: 43,
    name: '女儿国·解阳山与女王招亲',
    act: 5,
    type: 'event',
    icon: '👑',
    portrait: '女儿国国王',
    fate: '缘',
    echo: '复合阶段2+3·最终抉择(战/渡/隐/缘/逆/夺)；缘→子母河绳+红绳；逆→女王随从；夺→子母河水',
    branchKey: 'n42_nver',
    dark: '解阳山上，如意真仙拄着拐杖站在泉边：和尚，要泉水，问我手里的拐杖答不答应。你问这泉水是不是他的，他说不是，但守了三百年便是他的——这世上很多东西，不是谁的，是谁守着，便是谁的。下了山，女儿国国王亲自出城相迎，她不要贡品，不要通关文牒，只要你：她坐在凤辇上看你，说这一国的江山，我陪你坐。你看着她，又看看自己走过的子母河、解阳山，忽然答不上来：出家人，到底能不能有情。',
    intro: '依子母河之择，解阳山遭遇各异；女王招亲为最终抉择，六道与蓝劫印统一结算。红孩儿钩子： rescued（缘/渡/逆）→缘可选；战→缘灰显、转逆推荐。',
    options: [
      { key: '战', label: '强行突破女儿国防线，继续西行', fate: '战', effect: { alignEvil: 10, ti: { atk: 10, hp: 40 } }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n43_nver:zhan', consequence: '硬闯城门（禁军＝凡人→唐僧慈悲伤害-80%，可请土地山神作证）；成就【情的拒绝者】；蓝劫印' },
      { key: '渡', label: '受女王招待，点化后辞行', fate: '渡', effect: { alignGood: 16, yuan: 10 }, setFlag: 'n43_nver:du', consequence: '点化女王弃欲修行成一代女王；成就【情的点化者】；蓝劫印' },
      { key: '隐', label: '三更天不告而别，偷出城', fate: '隐', effect: { alignEvil: 16, eva: 8 }, setFlag: 'n43_nver:yin', consequence: '不告而别逃避（强制性优先）；成就【情的逃避者】；蓝劫印' },
      { key: '缘', label: '结情缘不留下，收红绳西行', fate: '缘', effect: { alignGood: 20, material: '子母河绳', relic: 'tre_nver_redrope' }, setFlag: 'n43_nver:yuan', requireFlag: 'n30_honghaier_rescued', consequence: '特殊结局"不负如来不负卿"；子母河绳(六根红绳③·八戒本命)+女儿国国王红绳(三生葫芦料)；羁绊【情的成全者】；蓝劫印' },
      { key: '逆', label: '弃僧帽换王袍，留收女儿国', fate: '逆', ni: true, effect: { alignEvil: 16, niSutra: 'ni_bufuliaowang', ally: 'nverguo_queen' }, setFlag: 'n43_nver:ni', consequence: '放弃西游，收女王·人形态逆随从；成就【放弃西游者】；蓝劫印' },
      { key: '夺', label: '夺取子母河水为法宝', fate: '夺', effect: { alignEvil: 20, ti: { hp: 30 }, treasure: 'tre_zimu_water' }, setFlag: 'n43_nver:duo', consequence: '夺得子母河水(主动:使敌怀胎3回合,攻-50%)；成就【子母河入手】；蓝劫印' }
    ],
    branches: {
      zhan: { intro: '你不讲理，斗了三天三夜赢了真仙，夺得落胎泉。腹中生命没了，你望散去的泉水：这杀生虽为取经，值。' },
      yin: { intro: '你不上山，扶着八戒一步步往西。女儿国人都惊了——一个大着肚子的和尚。你不解释，那小生命还在动。' },
      du: { intro: '你变牛魔王嘘寒问暖，真仙红眼眶指了泉眼；你趁他抹泪取水便走。腹中生命没了，这杀生用计换来，值。' }
    }
  },

  // ── 第44难 · 琵琶洞·蝎子精（单劫难，无隐）──
  44: {
    id: 44,
    name: '琵琶洞·蝎子精',
    act: 5,
    type: 'fight',
    icon: '🦂',
    portrait: '蝎子精',
    fate: '渡',
    echo: '单劫难·蝎子精(5道无隐)；渡→避毒珠(六珠⑥·双用)；缘→蝎子精随从；夺→倒马毒桩',
    dark: '蝎子精曾在灵山听经多年，被如来推了一把，一怒之下蜇了如来手指，逃到下界琵琶洞。她从洞中飞出掳走唐僧，要做夫妻，唐僧不从。悟空八戒去救，被她的倒马毒桩扎伤，中毒每回合损血；若有避毒珠，祭出便免疫毒系，直接克她。观音现身指点：这妖的克星是东天门的昴日星官。这一难还压着一桩旧事——你若在女儿国与女王结了情缘，她便嫉妒，毒更烈；你若点化了女王，她便感动，毒也轻。她蜇过如来，也问过一句没人替她答的话：听经多年，推我那一把，公平吗。',
    intro: '蝎子精倒马毒桩带毒，祭出避毒珠可免疫克制；缘/逆线蝎子精在队将影响六耳剧情（变其形试探）。',
    options: [
      { key: '战', label: '悟空八戒再战，一棒打死', fate: '战', effect: { alignEvil: 5, ti: { atk: 8, hp: 36 } }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n44_pipa:zhan', consequence: '以力击败，成就【毒的终结者】；绿劫印' },
      { key: '渡', label: '请昴日星官降服', fate: '渡', effect: { alignGood: 8, yuan: 8, treasure: 'tre_biduzhu' }, setFlag: 'n44_pipa:du', consequence: '星官赐避毒珠(六珠⑥·配件+法宝双用·不消耗)；成就【毒的点化者】；绿劫印' },
      { key: '缘', label: '点化蝎子精，收为随从', fate: '缘', effect: { alignGood: 10, ally: 'scorpion_jing' }, setFlag: 'n44_pipa:yuan', consequence: '蝎子精·人形态随从(可放倒马毒桩中毒)；成就【毒的成全者】；绿劫印' },
      { key: '逆', label: '收蝎子精为逆道随从', fate: '逆', ni: true, effect: { alignEvil: 8, niSutra: 'ni_scorpion', ally: 'scorpion_jing_ren' }, requireFlag: 'n44_pipa:zhan', setFlag: 'n44_pipa:ni', consequence: '逆道经文+蝎子精·人形态逆随从；成就【毒的征服者】；绿劫印' },
      { key: '夺', label: '夺取倒马毒桩为法宝', fate: '夺', effect: { alignEvil: 10, ti: { hp: 30 }, treasure: 'tre_daoma_duanzhuang' }, setFlag: 'n44_pipa:duo', consequence: '夺得倒马毒桩(主动:敌中毒3回合,每回合损气10%)；成就【倒马毒桩入手】；绿劫印' }
    ],
    treasure: { id: 'tre_biduzhu', type: 'treasure', note: '避毒珠·亦可由42宝物节点/第五章宝库/第五章市场100%兜底(六珠⑥·配件+法宝双用·不消耗)' }
  },

  // ── 第45难 · 六耳猕猴·真假美猴王（上，复合阶段1，仅立 flag）──
  45: {
    id: 45,
    name: '六耳猕猴·真假美猴王（上）',
    act: 5,
    type: 'event',
    icon: '🐒',
    portrait: '六耳猕猴',
    fate: '渡',
    echo: '复合阶段1·二悟空对峙(战/隐/渡立flag)；悟空离队态核心变量(跨章A6.5-c)',
    branchKey: 'n45_liuer',
    dark: '一棒袭来，一个悟空把你打翻在地，抢了行李，一个筋斗云没了影。若真悟空还在队，两个一模一样的身影便同时站在你面前，铁棒对铁棒，筋斗对筋斗，一样的招式，一样的力道，你看不出半点破绽——因为假的那个，学会了真的一切。若真悟空早已离队，回来的这个自称是真身，你无从对质，只能凭一口气去判。六耳猕猴善聆音，能察理，知前后，能预判你的每一招；照妖镜也照不出他与悟空的区别，他与你那徒弟，本就同象同音。',
    intro: '两个"悟空"站你面前。让其对打以力辨、暂且绕过、还是去观音天庭辨真假？（悟空在队态→沙僧花果山→谛听→灵山，仅渡/夺终局）',
    options: [
      { key: '战', label: '让二人对打，以力辨真假', fate: '战', effect: { alignEvil: 4 }, fight: true, setFlag: 'n45_liuer:zhan', requireFlag: 'wukong_absent', consequence: '进入战路线（阶段2硬打六耳，寻善聆音破绽）' },
      { key: '隐', label: '绕过二人，继续西行', fate: '隐', effect: { alignEvil: 3 }, setFlag: 'n45_liuer:yin', requireFlag: 'wukong_absent', consequence: '数日后行李被劫回花果山，进入隐路线（试探读心）' },
      { key: '渡', label: '先往观音天庭辨真假', fate: '渡', effect: { alignGood: 4 }, setFlag: 'n45_liuer:du', requireFlag: 'wukong_absent', consequence: '往返耗十日，进入渡路线（原著辨真假流程）' }
    ]
  },

  // ── 第46难 · 六耳猕猴·真假美猴王（下·真身，章末Boss）──
  46: {
    id: 46,
    name: '六耳猕猴·真假美猴王（下·真身）',
    act: 5,
    type: 'boss',
    icon: '🔮',
    portrait: '六耳猕猴',
    fate: '渡',
    echo: '章末Boss·镜像三态(行者假相→猕猴本相→六耳真身·照妖镜失效)；终局六道(战/渡/隐/夺/缘/逆)；舍利+隐藏',
    branchKey: 'n45_liuer',
    dark: '两个悟空打上灵山，闹到如来座前。谛听听得出真假，却不敢说；观音认不出；最后是如来点破——那假的是六耳猕猴，善聆音，能察理，知前后，万物皆明。你若赶不走他，他也赶不走你，这一难便僵在半路。你可以让如来收了他，可以趁乱夺他那点善聆音的能耐：能察理，能知前后——这本事若归了你，往后谁的话真谁的话假，你便都听得出来。最冷的一条路是：你明明分得清真假，却谁都不留，独自上路。你怕的从来不是假的，是那个也想过要走的真的。',
    intro: '六耳被识破欲逃，你拦住。依路线与悟空在否，终局六道各异——镜像之内，假的是他，真的也是你。',
    options: [
      { key: '战', label: '一棒了结此身', fate: '战', effect: { alignEvil: 10, ti: { atk: 10, hp: 60 } }, fight: true, battleFlags: { openingMomentum: 1 }, setFlag: 'n46_liuer:zhan', requireFlag: 'wukong_absent', consequence: '打死/赶走六耳；成就【真假辨明/六耳离去】；红劫印' },
      { key: '渡', label: '请如来收伏六耳', fate: '渡', effect: { alignGood: 16, yuan: 12, treasure: 'erxin_sheli' }, setFlag: 'n46_liuer:du', requireFlag: 'n45_liuer:du', consequence: '如来收伏修行；得二心古舍利(六舍利⑤·法杖配件)；红劫印' },
      { key: '隐', label: '放过六耳，不告而别', fate: '隐', effect: { alignEvil: 16, eva: 10 }, setFlag: 'n46_liuer:yin', requireFlag: 'n45_liuer:yin', consequence: '放过隐姓埋名不再作恶；成就【真假放过】；红劫印' },
      { key: '夺', label: '夺取善聆音神通', fate: '夺', effect: { alignEvil: 20, ti: { atk: 6 }, material: '意根·意见欲' }, setFlag: 'n46_liuer:duo', requireFlag: 'n45_liuer:zhan', consequence: '夺善聆音(被动:预判招式,闪避+20%,识破伪装/隐身)；意根·意见欲(六根③·悟空本命)；红劫印' },
      { key: '缘', label: '接纳六耳，代悟空取经', fate: '缘', effect: { alignGood: 20, ally: 'liuer_mihou' }, setFlag: 'n46_liuer:yuan', requireFlag: 'wukong_absent', consequence: '六耳·人形态随从(主角悟空→妖形态·A6.5-b)；成就【六耳归队】；红劫印' },
      { key: '逆', label: '收六耳为逆道随从', fate: '逆', ni: true, effect: { alignEvil: 16, niSutra: 'ni_liuer', ally: 'liuer_mihou_ren' }, setFlag: 'n46_liuer:ni', requireFlag: 'wukong_absent', consequence: '逆道经文+六耳·人形态(主角悟空→妖形态)逆随从；成就【六耳逆归】；红劫印' }
    ],
    branches: {
      zhan: { intro: '你以纯实力抓住善聆音迟疑的破绽，最终击败。六耳倒地："我善聆音，却无人纯凭实力赢过我。你赢了，我服了。"' },
      yin: { intro: '你试探出他能读心，当面揭穿："你不是悟空！悟空不会读心术！"六耳欲逃，你拦住。' },
      du: { intro: '沙僧花果山、谛听地府不敢说、灵山如来慧眼一观："周天之内有五仙……第四是六耳猕猴。"六耳见破欲逃。' }
    },
    treasure: { id: 'liuer_sheli', type: 'treasure', note: '六耳猕猴·章末舍利（红劫印→章末Boss·六耳镜像真身）' },
    hidden: { hero: 'wukong', cond: '逆 + 紧箍', job: '悟空的镜', hint: '六耳终局择「逆」、持紧箍——镜里镜外，都是俺老孙', desc: '双身同镜，体物伤+30%（悟空·悟空的镜前置）' }
  }
});
