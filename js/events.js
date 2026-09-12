// =============================================================
// events.js —— 问号(?)随机事件系统独立数据库
// 包含：奇遇事件库 EVENTS、岔路标记 BRANCHES、送行事件 INIT_GIFT_EVENTS，
//      以及事件运行时函数 pickEvent / rollYuan / shopPrice。
//
// 本文件从 data.js 中拆分独立，便于单独编辑「问号随机事件」内容。
// 依赖（定义在 data.js，须在 events.js 之前加载）：
//   - NDX._usedEventIds  缘池已用 id（运行时状态容器）
//   - NDX._pick          通用随机取一
//   - NDX.HEROES         英雄定义（INIT_GIFT_EVENTS 仅引用 hero id 字符串）
// =============================================================

// 进入「缘」节点时，从 EVENTS 池随机挑一个具体内容（同上，不预分配 id）
// V8.34：支持 region 过滤——有 region:[start,end] 的事件只在对应地区出现，无 region 为通用事件
// V8.41：支持 hero/dao 过滤——有 hero:[] 或 dao:[] 的事件只对对应英雄/道途出现；支持 chainId/chainStep 链式事件状态机
NDX.pickEvent = function (act, s) {
  const all = Object.keys(NDX.EVENTS);
  // 按当前 act 过滤区域限定事件
  const currentAct = act || 1;
  const heroId = (s && s.hero) || null;
  const mainDao = (s && NDX.mainDaoOf) ? NDX.mainDaoOf(s) : null;
  // V8.41 链式事件状态机：检查是否有未完成的链式事件，优先返回下一步
  if (s && s._chainProgress) {
    for (const chainId in s._chainProgress) {
      const step = s._chainProgress[chainId];
      if (step && step.nextId && !s._usedEventIds.includes(step.nextId)) {
        const nextEv = NDX.EVENTS[step.nextId];
        if (nextEv) {
          // 检查区域过滤
          if (!nextEv.region || (currentAct >= nextEv.region[0] && currentAct <= nextEv.region[1])) {
            if (!s._usedEventIds.includes(step.nextId)) s._usedEventIds.push(step.nextId);
            return { id: step.nextId, data: nextEv, chainId: chainId, chainStep: step.currentStep + 1 };
          }
        }
      }
    }
  }
  const regionFiltered = all.filter((k) => {
    const ev = NDX.EVENTS[k];
    if (!ev.region) return true; // 通用事件
    return currentAct >= ev.region[0] && currentAct <= ev.region[1];
  });
  // V8.41 hero/dao 过滤：有 hero:[] 或 dao:[] 的事件只对对应英雄/道途出现
  const heroDaoFiltered = regionFiltered.filter((k) => {
    const ev = NDX.EVENTS[k];
    // hero 过滤：有 hero 字段时，只对指定英雄出现
    if (ev.hero && Array.isArray(ev.hero) && heroId) {
      if (!ev.hero.includes(heroId)) return false;
    }
    // dao 过滤：有 dao 字段时，只对指定道途出现
    if (ev.dao && Array.isArray(ev.dao) && mainDao) {
      if (!ev.dao.includes(mainDao)) return false;
    }
    return true;
  });
  const pool = heroDaoFiltered.filter((k) => !NDX._usedEventIds.includes(k));
  const use = pool.length ? pool : heroDaoFiltered;
  const k = NDX._pick(use);
  if (!NDX._usedEventIds.includes(k)) NDX._usedEventIds.push(k);
  const ev = NDX.EVENTS[k];
  // V8.41 链式事件：如果事件有 chainId/chainStep，记录链式进度
  let chainInfo = null;
  if (ev && ev.chainId && ev.chainStep != null) {
    chainInfo = { chainId: ev.chainId, chainStep: ev.chainStep };
    if (s && !s._chainProgress) s._chainProgress = {};
    if (s && ev.nextStepId) {
      s._chainProgress[ev.chainId] = { currentStep: ev.chainStep, nextId: ev.nextStepId };
    } else if (s && s._chainProgress[ev.chainId]) {
      delete s._chainProgress[ev.chainId]; // 链式事件完成
    }
  }
  return chainInfo ? { id: k, data: ev, chainId: chainInfo.chainId, chainStep: chainInfo.chainStep } : { id: k, data: ev };
};

// =============================================================
// 缘(?)节点机制：遭遇战 vs 奇遇事件 的保底概率（rollYuan）
// 设计意图：问号是「风险与回报不稳定」的节点——玩家走稳妥路线还是赌一把问号，是路线规划核心博弈。
//   - 每次进入缘节点：以  p = 10% + 10%×已连续未遇战次数  的概率「遭遇战」
//   - 遭遇战时随机为「小怪(mob)」或「劫(elite)」，遇战即重置保底
//   - 未遇战则触发一个【奇遇事件】（从 NDX.EVENTS 池随机抽）：
//        事件内可选【战】(打小怪/夺宝) / 【缘】(回血·得宝·善恶抉择·装备二选一) 等
//        即「回血 / 得宝 / 抉择」皆可能，完全对应杀戮尖塔问号节点的多样性
//   - 一旦随机到战斗，保底计数重置为 0；连续未遇战则下次概率 +10%
// 状态存于 s.eventPity（连续未遇战次数）；首次进缘即 10%，连续 9 次未遇则第 10 次必遇（累计 100%）。
// =============================================================
NDX.rollYuan = function (s) {
  const pity = s.eventPity || 0;
  const p = Math.min(1, 0.10 + 0.10 * pity);
  if (Math.random() < p) {
    // 遭遇战！重置保底
    s.eventPity = 0;
    return Math.random() < 0.5 ? 'mob' : 'elite';
  }
  // 未遇战 → 保底 +1，下次概率提高，并触发奇遇事件
  s.eventPity = pity + 1;
  return 'event';
};

// 奇遇事件库（问号节点进入后随机揭晓）。
// 每个事件结构：
//   title: 事件标题
//   text:  叙事文案
//   opts:  选项数组，每个选项：
//     text:    选项文案
//     effect:  直接结算的奖励 { good/evil/yuan/ti/healFull/equip/... }
//     fight:   存在则选此项进入战斗（对话选择"战"），战胜后给 reward + fate
//     fate:    影响结局倾向（战/隐/夺/渡/逆）
NDX.EVENTS = {
  // L2 残碑秘闻
  bei:    { title: '残碑秘闻', text: '荒碑半埋，碑文是一部没写完的西游——写到"五行山"三字便断了，像是写的人自己也没走出去。碑底压着一缕不甘的碑灵，它认得你身上的味，颤声说：替我续完，别像我一样，卡在半路上。',
    opts: [
      { text: '【战】镇碑灵：以力压之，逼它吐出残篇（体攻+16）', fight: true, reward: { ti: { atk: 16 } }, fate: '战' },
      { text: '【缘】拓碑文：装备二选一，把它的故事带走', effect: { equip: 2 } },
      { text: '【缘】参禅：替它念完未竟之愿（善+15·御念+4%）',  effect: { good: 15, yuan: { mdef: 0.04 } }, fate: '缘' },
    ]},
  // L6 古井奇遇
  jing:   { title: '古井奇遇', text: '枯井深处有水光，井底盘着一条老蛟，鳞已褪了一半——它是被天庭抽了筋丢下来的。它问你是来打水，还是来夺宝，眼里却写满了：其实都一样，横竖你也要走。',
    opts: [
      { text: '【战】斗井蛟：夺其逆鳞，疼也要它给（体攻+18）', fight: true, reward: { ti: { atk: 18 }, material: '蛟鳞' }, fate: '夺' },
      { text: '【缘】打水：甲胄二选一，饮一口冷透的水', effect: { equip: 2, slot: 'armor' } },
      { text: '【缘】许愿：向井底说了句不敢说给天听的话（体攻+10·气血+30）',         effect: { ti: { atk: 10, hp: 30 } } },
    ]},
  // L6 老僧化缘
  seng:   { title: '老僧化缘', text: '一枯瘦老僧拦路化缘，钵中空空，说要化你一身因果。你细看，他僧衣下露出锁链印——这"化缘"的，怕是刚从哪座山上逃下来的。他说：你给的，我都替你担着；你给不起，我便替你下地狱。',
    opts: [
      { text: '【战】试禅心：与他论拳脚，看谁先认输（气血+60）', fight: true, reward: { ti: { hp: 60 } }, fate: '战' },
      { text: '【缘】布施：善+20·气血+60，把因果分他一半',  effect: { good: 20, ti: { hp: 60 } }, fate: '渡' },
      { text: '【缘】拒绝：体攻+15·恶+10，转身时听见他笑了',  effect: { ti: { atk: 15 }, evil: 10 }, fate: '逆' },
    ]},
  // L9 三清道观
  dao:    { title: '三清道观', text: '道观三清像金身斑驳，供桌下钻出个偷供的道童，挥着桃木剑喊你"妖人"。他太小，分不清妖与佛，只知供桌上的馒头比神仙亲。你想起自己也曾被人指着鼻子喊"妖猴"——那年，你比他还小。',
    opts: [
      { text: '【战】降道童：夺观中宝，把馒头也留给那孩子', fight: true, reward: { equip: 2, good: 10 }, fate: '夺' },
      { text: '【缘】求宝：法宝二选一，顺手塞他半个馍', effect: { equip: 2, slot: 'treasure' } },
      { text: '【缘】参拜：气血上限+150，替这破观敬一炷真香',     effect: { healFull: true }, fate: '渡' },
    ]},
  // L13 白骨洞天
  baigu:  { title: '白骨洞天', text: '洞中白骨成山，一缕幽魂泣诉：生时未得超度，愿化厉鬼也不愿散。它指给你看——每具骨头都刻着名字，是历朝历代想"取经"却倒在这儿的人。它问你：你这身皮囊，又能走几步？',
    opts: [
      { text: '【战】斩怨魂：以杀止怨，让它别再等（恶+20·体攻+16）', fight: true, reward: { evil: 20, ti: { atk: 16 } }, fate: '逆' },
      { text: '【缘】渡化：善+30·愿伤+5，念完所有刻在骨上的名', effect: { good: 30, yuan: { matk: 5 } }, fate: '渡' },
      { text: '【缘】超度：觉醒素材×1，取一截不肯散的执念',   effect: { material: '本命觉醒素材' }, fate: '隐' },
    ]},
  // L17 老龟问卜
  gui:    { title: '老龟问卜', text: '通天水府老龟驮你过涧，开口讨封：封得好，它渡你；封得不好，它吞你。它背上驮过上一任取经人，那人封它"享寿千年"，转头便把它忘了个干净。它眯着眼：这次，你打算怎么骗我？',
    opts: [
      { text: '【战】翻龟壳：夺其背甲，把谎壳掀了（护体+6%）', fight: true, reward: { ti: { dr: 0.06 }, material: '龟甲' }, fate: '夺' },
      { text: '【缘】问宝：灵宠二选一，与它做个不骗的约', effect: { equip: 2, slot: 'pet' } },
      { text: '【缘】问命：气血上限+150·上限+5%，不封它，只陪它坐会儿',     effect: { healFull: true, maxhpPct: 0.05 }, fate: '隐' },
    ]},
  // L18 龙王庙
  longwang: { title: '龙王庙', text: '废庙里龙王像缺了头，水洼中浮起一条小龙子，叱你惊了它的清梦。它爹的庙早被香客拆了供桌，它守着一汪臭水，还当自己是龙宫正统。你说不清它可怜，还是可敬。',
    opts: [
      { text: '【战】斗龙子：取其龙鳞，疼它也得给（气血素材·体攻+14）', fight: true, reward: { material: '龙鳞素材', count: 2, ti: { atk: 14 } }, fate: '夺' },
      { text: '【缘】求宝：灵宠二选一，陪这没落的小龙说句话', effect: { equip: 2, slot: 'pet' } },
      { text: '【缘】求雨：下场敌减攻30%，替它唤一场它爹没下的雨',     effect: { nextWeak: 0.30 }, fate: '隐' },
    ]},
  // L6 罗汉遗蜕
  luohan: { title: '罗汉遗蜕', text: '山坳里一具罗汉金身未腐，手中禅杖自行飞起，似要考你根器。它生前的同门早进了灵山，独留它守这荒山——金漆剥落处，写着一行小字：来时好好的，回不去了。',
    opts: [
      { text: '【战】夺禅杖：以力服金身，替它走完没走完的路（体攻+16）', fight: true, reward: { ti: { atk: 16 }, material: '罗汉舍利' }, fate: '战' },
      { text: '【缘】参禅：善+20·御念+4%，给它磕个它等了百年的头',  effect: { good: 20, yuan: { mdef: 0.04 } }, fate: '缘' },
      { text: '【缘】化缘：装备二选一，分它一点人气',     effect: { equip: 2 } },
    ]},
  // L13 莲花洞天
  lianhua: { title: '莲花洞天', text: '洞中天池开满金莲，莲心各卧一枚未醒的妖丹，催你吞下以增道行。每颗丹都裹着一个被炼化的妖——它们沉在莲心，还以为自己修成了正果。你凑近，听见丹里有人在喊"救命"。',
    opts: [
      { text: '【战】镇妖丹：夺丹而炼，先叫它们闭嘴', fight: true, reward: { equip: 2, evil: 10 }, fate: '逆' },
      { text: '【缘】采莲：生命上限+10%，放那些丹一条生路', effect: { maxhpPct: 0.10 }, fate: '隐' },
      { text: '【缘】悟道：气血上限+150，听清了丹里那声"谢"',     effect: { healFull: true }, fate: '渡' },
    ]},
  // L14 土地庙诉苦
  tudi: { title: '土地庙诉苦', text: '破庙里一尊土地神像歪着头，香灰积了半尺。它见你便哭：上界每月摊派"香火捐"，交不出便革神籍，它已欠了三百年。庙角堆着前任土地的碎瓷片——那些交不上捐的，都被砸了像，魂飞魄散。它求你替它写一封"陈情表"，可你知道，上表的渠道，也在上界手里。',
    opts: [
      { text: '【战】砸庙：替它反了这香火捐，先打碎上界的规矩', fight: true, reward: { ti: { atk: 16 }, evil: 10 }, fate: '逆' },
      { text: '【缘】替写陈情：明知石沉大海，也替它把冤屈写尽', effect: { good: 18, yuan: { mdef: 0.04 } }, fate: '缘' },
      { text: '【缘】收它残魂入钵：小神无用，炼作护符倒也实在', effect: { equip: 2, slot: 'treasure', evil: 8 }, fate: '夺' },
    ]},
  // L15 忘川渡头
  wangchuan: { title: '忘川渡头', text: '一条黑河无波，艄公是个没舌头的老者，举着破船板等你。河边挤满了亡魂，个个攥着几枚铜钱——那是它们生前攒的"渡资"，可艄公的船，从来只渡给交得起的。你看见一个孩子的魂，铜钱被别的魂抢光了，蹲在河边哭，哭了不知几百年。',
    opts: [
      { text: '【战】夺船：打翻艄公，自己撑船渡那些没钱的魂', fight: true, reward: { ti: { atk: 14, hp: 40 } }, fate: '战' },
      { text: '【缘】分财：把身上金帛散给亡魂，替它们交了渡资', effect: { good: 25, ti: { hp: 60 } }, fate: '渡' },
      { text: '【缘】取忘川水：这水炼宝可叫人忘痛，倒比渡人有用', effect: { material: '忘川水', yuan: { matk: 12 } }, fate: '夺' },
    ]},
  // L16 破寺经卷
  posi: { title: '破寺经卷', text: '荒寺藏经阁里，经卷被鼠啃得七零八落。你捡起一卷，被咬空的字缝里竟藏着暗码——那是历代僧人偷偷记下的"灵山账册"：哪一难死了多少取经人，哪一尊佛收了多少香火。老鼠不是普通鼠，它们是被派来"清理"这些记录的，啃了一千年，还没啃干净。',
    opts: [
      { text: '【战】灭鼠：把这些"清洁工"全宰了，看谁还敢毁证', fight: true, reward: { ti: { atk: 18 }, material: '灵山账册残页' }, fate: '逆' },
      { text: '【缘】抄录暗码：把账册背下来，总有一天用得上', effect: { yuan: { matk: 15, mdef: 0.05 }, good: 10 }, fate: '缘' },
      { text: '【缘】烧经：一把火烧干净，知道太多的人活不长', effect: { evil: 12, ti: { dr: 0.04 } }, fate: '隐' },
    ]},
  // L17 山鬼献舞
  shangui: { title: '山鬼献舞', text: '月色下一个赤足女子在林间起舞，衣袖扫过处，山石都开出花来。她是山鬼，专以色相试取经人的道心——可你看清她脸的瞬间，发现她的眼珠是两枚铜钱，舌头是一卷写满名字的黄纸。她舞的不是媚，是"索命簿"，每一个被她迷住的人，名字便从簿上划去，魂归山林。',
    opts: [
      { text: '【战】棒喝：一棒打碎她的铜钱眼，叫她再不能勾魂', fight: true, reward: { ti: { atk: 16, eva: 0.03 } }, fate: '战' },
      { text: '【缘】坐怀不乱：闭目诵经，任她跳到力竭', effect: { good: 20, yuan: { mdef: 0.06 } }, fate: '缘' },
      { text: '【缘】夺索命簿：她手里那卷黄纸，拿来改几笔倒也有趣', effect: { material: '索命簿残卷', evil: 15 }, fate: '夺' },
    ]},
  // L18 猎户尸骨
  liehu: { title: '猎户尸骨', text: '山坳里一具白骨还握着猎刀，刀上刻着"取经人"三个字——这是个半途折返的同行，没走多远便死在了这里。他的行囊还在：半张写了一半的家书、一枚磨得发亮的佛珠、一把淬过毒的短刀。家书最后一句是"娘，我不去了"，可他终究还是死在了去的路上。',
    opts: [
      { text: '【战】取刀：他没走完的路，你拿他的刀替他走', fight: true, reward: { equip: 2, slot: 'weapon' }, fate: '战' },
      { text: '【缘】葬骨：挖坑埋了他，把家书念完再烧', effect: { good: 22, ti: { hp: 50 } }, fate: '渡' },
      { text: '【缘】取佛珠：他的念珠沾了归途的愿力，戴上可安心神', effect: { equip: 2, slot: 'treasure', yuan: { mdef: 0.04 } }, fate: '缘' },
    ]},
  // L19 狐仙讨封
  huxian: { title: '狐仙讨封', text: '一只九尾白狐拦在路中，口吐人言："取经人，你看我像神还是像妖？"这是讨封——它修了八百年，就等一个过路人口中一句"封神"，便可脱去妖身。可你若说它像妖，它便会当场反噬，把你的气运吸个干净。它的九条尾巴各缠着一个人的头骨，都是讨封失败时被它吸死的。',
    opts: [
      { text: '【战】封它为妖：明知它反噬，偏要看看它有多大本事', fight: true, reward: { ti: { atk: 20 }, material: '九尾狐丹' }, fate: '战' },
      { text: '【缘·赌博】封它为神：一句口惠而已，渡它八百年修行', roll: true, effect: { good: 28, yuan: { matk: 10 } }, fate: '渡', rollFail: { txt: '它瞧出你口不由心，反被它吸了一口气运（善-10·气血-40）', effect: { good: -10, ti: { hp: -40 } } } },
      { text: '【缘】不封：你既不是神也不是妖，我不替天说话', effect: { ti: { hp: 70, dr: 0.05 } }, fate: '隐' },
    ]},
  // L20 河灯漂魂
  hedeng: { title: '河灯漂魂', text: '河面漂着千百盏河灯，每盏灯里蹲着一个小小的魂——它们是上元夜被放灯人"超度"的亡魂，可灯漂到中游便灭了，魂便困在河心，上不去也下不来。你伸手捞起一盏，灯里的魂冲你笑："再给我一口阳气，我就能走了。"可你知道，喂饱一个魂，要耗你三年寿数。',
    opts: [
      { text: '【战】踏灯而行：踩着河灯过河，管它困不困魂', fight: true, reward: { ti: { atk: 14, eva: 0.04 }, evil: 12 }, fate: '逆' },
      { text: '【缘·赌博】渡灯：割指滴血，喂每盏灯一口阳气', roll: true, effect: { good: 30, ti: { hp: 40 }, maxhpPct: 0.05 }, fate: '渡', rollFail: { txt: '阳气喂了一半，灯灭了大半——魂儿没渡成，反耗了你一口元气（气血-120）', effect: { ti: { hp: -120 } } } },
      { text: '【缘】收魂炼宝：困魂最是纯净，收来炼一盏引魂灯', effect: { equip: 2, slot: 'treasure', evil: 18 }, fate: '夺' },
    ]},
  // L21 石敢当裂
  shigandang: { title: '石敢当裂', text: '村口一块"石敢当"镇石裂了道缝，缝里渗出黑血。村里人说这石镇了三百年的妖，如今妖要出来了。你凑近听，缝里有个声音在笑："他们拿我镇邪，可我本是他们村的祖先——当年活埋了我砌成石，说我能镇妖。"石裂得越来越大，黑血里浮出一张人脸，正是村口祠堂里供的那位"始祖"。',
    opts: [
      { text: '【战】碎石：放出祖先，让它找活埋它的人算账', fight: true, reward: { ti: { atk: 18, dr: 0.04 }, evil: 15 }, fate: '逆' },
      { text: '【缘】补缝：以自身精血补石，再镇它三百年', effect: { good: 20, ti: { hp: 60, dr: 0.06 } }, fate: '隐' },
      { text: '【缘】超度：挖出始祖遗骨安葬，了它三百年怨气', effect: { good: 25, yuan: { mdef: 0.05 } }, fate: '缘' },
    ]},
  // L22 茶寮迷局
  chaliao: { title: '茶寮迷局', text: '荒野中一间茶寮亮着灯，里头坐满了茶客。你一进门便僵住——每个茶客的脸都是你的脸，有老有少，有僧有俗，有缺胳膊的有瞎眼的。它们是历代取经人走到这里时留下的"残影"，每个人都在喝一碗永远喝不完的茶。茶博士冲你笑："客官，你也坐下来喝一碗？喝了就不用走了。"',
    opts: [
      { text: '【战】掀桌：打碎这茶寮，叫所有残影都散了', fight: true, reward: { ti: { atk: 16, hp: 50 } }, fate: '战' },
      { text: '【缘】喝茶：坐下来喝一碗，听听每个自己的故事', effect: { yuan: { matk: 14, mdef: 0.05 }, good: 12 }, fate: '缘' },
      { text: '【缘】收残影：把这些"自己"收进经卷，炼成一面照心镜', effect: { equip: 2, slot: 'treasure', evil: 10 }, fate: '夺' },
    ]},
  // L23 城隍断案
  chenghuang: { title: '城隍断案', text: '城隍庙的城隍像忽然睁眼，求你替它断一桩阴阳案：一个书生被冤杀，化为厉鬼索命，可杀他的县令已是城隍的"香火施主"。城隍说："我若断书生赢，便断了香火；若断县令赢，便断了良心。你替我断，因果算你的。"堂下跪着的书生鬼，眼眶里流的不是泪是墨，写着一个大大的"冤"字。',
    opts: [
      { text: '【战】斩城隍：自己的案自己断，推给旁人算什么神', fight: true, reward: { ti: { atk: 20 }, evil: 18 }, fate: '逆' },
      { text: '【缘】断书生赢：冤就是冤，香火买不走公道', effect: { good: 30, material: '城隍断笔' }, fate: '渡' },
      { text: '【缘】各打五十大板：书生投胎，县令减寿三年', effect: { good: 10, evil: 10, ti: { hp: 70 } }, fate: '缘' },
    ]},
  // L24 月老红线
  yuelao: { title: '月老红线', text: '月下老人坐在一棵枯树下，手里攥着一团红线。他见你便叹气："你的姻缘线断了三百年了——不是没人牵，是你每一世都亲手剪断。"他展开红线给你看，线上系着一个个名字：有等了你一辈子的村姑，有替你死的女妖，有你从未正眼看过的同行。"这次我替你系上，你别再剪了。"他说着便要往你腕上缠。',
    opts: [
      { text: '【战】剪线：我的命数我自己定，谁也别替我系', fight: true, reward: { ti: { atk: 18, eva: 0.05 }, evil: 8 }, fate: '逆' },
      { text: '【缘】由他系：三百年了，也许该看看线那头是谁', effect: { good: 15, maxhpPct: 0.08 }, fate: '缘' },
      { text: '【缘】夺红线：这团线系的是命数枷锁，拿来自己用', effect: { material: '月老红线', yuan: { matk: 16 } }, fate: '夺' },
    ]},
  // L25 饿鬼托钵
  egui: { title: '饿鬼托钵', text: '一个饿鬼拦在路中，脖子细得像麻绳，肚子却鼓得像山。它托着一只破钵，声音嘶哑："给我一口吃的……我已经三百年没尝过饱了。"你认出它——它生前是个贪赃枉法的县令，死后被罚作饿鬼，永世吃不饱。它的钵里有一枚金元宝，那是它生前贪的最后一笔赃，到死都攥着，如今成了它唯一的"吃食"，可金子怎么吃得饱。',
    opts: [
      { text: '【战】夺钵：它吃不了金子，你替它花了', fight: true, reward: { gold: 50, evil: 12 }, fate: '夺' },
      { text: '【缘】施食：把身上干粮分它一半，哪怕只能撑一时', effect: { good: 22, ti: { hp: 40 } }, fate: '渡' },
      { text: '【缘】点化：告诉它放下金子才能吃饱，看它懂不懂', effect: { yuan: { mdef: 0.06 }, good: 10 }, fate: '缘' },
    ]},
  // L26 古树问心
  gushu: { title: '古树问心', text: '一棵千年古树横在路中，树干上长着一张苍老的人脸。它问你："你走了这么远，可曾后悔过？"树洞里涌出无数画面——是你每一次抉择的"另一种可能"：没杀的妖活了下来成了佛，没救的人死了变成了厉鬼，没拿的宝被别人拿了改天换地。古树说："你若说后悔，我便替你回到那一刻；你若说不后悔，我便让路。"',
    opts: [
      { text: '【战】砍树：我做的事我认，用不着你替我复盘', fight: true, reward: { ti: { atk: 20, hp: 60 } }, fate: '战' },
      { text: '【缘】说不后悔：每一步都是当时的我选的，认了', effect: { good: 18, yuan: { mdef: 0.05 }, ti: { dr: 0.04 } }, fate: '缘' },
      { text: '【缘】说后悔：让它替你回到最想改的那一刻', effect: { healFull: true, evil: 10 }, fate: '逆' },
    ]},
  // L27 无影戏台
  wuying: { title: '无影戏台', text: '荒野中搭着一座戏台，台上没有演员，只有影子在演——演的全是你的死法：被妖吃了、被佛收了、被自己人卖了、走到灵山发现经书是空白的。台下坐满了观众，也都是影子，它们看得津津有味，不时喝彩。戏班主冲你拱手："客官，要不要上台演一回？演完了，你就知道自己怎么死的了。"',
    opts: [
      { text: '【战】砸台：我的死活，用不着你们演给我看', fight: true, reward: { ti: { atk: 18, eva: 0.04 }, evil: 10 }, fate: '逆' },
      { text: '【缘】看戏：看完所有死法，心里便不怕了', effect: { yuan: { matk: 12, mdef: 0.06 }, good: 8 }, fate: '缘' },
      { text: '【缘】上台：演一回最惨的死法，看能不能改了结局', effect: { equip: 2, nextWeak: 0.30 }, fate: '夺' },
    ]},
  // ========== 灵宠NPC交互事件 ==========
  // L20 龙王点化·小黑龙三分支进化
  longwang_evolve: { title: '龙王点化', text: '东海深处龙宫残址，老龙王残魂浮出水面。它扫过你肩上蜷着的小黑龙，浑浊龙目一亮：「这苗子根骨尚可，只是未开龙窍。老夫可替它引一条龙脉——水、火、光，三条路，你替它选。」',
    opts: [
      { text: '【水】引水脉 → 水晶魔龙（愿伤+15·减伤+5%）', effect: { upgrade: { from: 'xiaoheilong', to: 'shuijingmolang' } }, fate: '隐' },
      { text: '【火】引火脉 → 烈焰火龙（体攻+25·愿伤+10）', effect: { upgrade: { from: 'xiaoheilong', to: 'lieyanhuolong' } }, fate: '战' },
      { text: '【光】引光脉 → 普照真龙（气血+80·减伤+8%·愿伤+20）', effect: { upgrade: { from: 'xiaoheilong', to: 'puzhaozhenlong' } }, fate: '渡' },
    ]},
  // L15 菩提点化·灵宠品质提升
  puti_dianhua: { title: '菩提点化', text: '枯菩提树下坐一老道，闭目不语。你近前时他睁眼——只一眼便看穿你肩头灵宠根骨：「此物有灵，却困于凡躯。老道替它开一窍，凡器可进灵器，灵器可进宝器——只看你舍不舍得那点机缘。」',
    opts: [
      { text: '【缘】点化灵宠：品质提升一档（凡→灵→宝）', effect: { petQualityUp: 1 } },
      { text: '【缘】不求点化：气血+80，自修亦可行', effect: { ti: { hp: 80 } }, fate: '隐' },
    ]},
  // L25 观音赐福·灵宠品质提升+回血
  guanyin_dianhua: { title: '观音赐福', text: '紫竹林中观音现相，净瓶杨柳轻洒甘露。她看你灵宠蜷缩在肩，微微一笑：「众生皆可度，何况此小物？甘露一滴，可开灵窍。」甘露落在灵宠身上，隐隐发出柔光。',
    opts: [
      { text: '【缘】赐福灵宠：品质提升一档+气血回满', effect: { petQualityUp: 1, healFull: true }, fate: '缘' },
      { text: '【渡】只求甘露：气血回满+善+10', effect: { healFull: true, good: 10 }, fate: '渡' },
    ]},
  // =============================================================
  // V8.34 从事件文档批量导入的 109 个事件（区域/英雄/转职/通用/妖怪/短事件/神仙/隐藏/链式/红孩儿长链）
  // 来源：docs/逆道西行_事件完整配置_下载/逆道西行_事件完整剧情对话与战斗配置_数值对齐版.md
  // =============================================================
  r01_huangcun: { title: "荒村夜宿", text: "大唐境内，官道渐没于荒草。前方一座村落，屋舍俨然却无半缕炊烟。村口石碑刻着村名，字迹已被黑苔覆满——唯有\"人\"字还认得出。借宿一晚，还是绕道而行？",
    region: [1, 1],
    opts: [
      { text: "【渡】借宿一晚，以善念感化此间戾气", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【战】拔杖戒备——妖气已逼到门楣", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":16}}},
      { text: "【隐】绕村而行，不沾此间因果", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
    ]},
  r02_liehu_orphan: { title: "猎户遗孤", text: "两界山脚下，猎户刘伯钦的后人拦住去路：\"前方山道有巨妖盘踞，家父当年便是被其所伤。取经人，可愿助我了此仇怨？\"少年眼中是藏不住的恐惧，和压不住的恨。",
    region: [2, 2],
    opts: [
      { text: "【战】并肩斩杀——让猎户的血债血偿", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":27}}},
      { text: "【渡】指点防守之法，不必以命相搏", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】夺过猎户祖传猎弓——此弓沾过百兽之血，是把好兵器", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  r03_huangfeng_remnant: { title: "黄风残息", text: "黄风怪虽败，余孽未清。山坳间一股黑风盘旋不散，如困兽般呜咽。风中有声：\"放我……出去……\"这股残息若被有心人收去，又是一场祸事。",
    region: [3, 3],
    opts: [
      { text: "【渡】以佛力超度，散其执念", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】收入钵中——妖风也是风，淬体正好", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":36}}},
      { text: "【隐】绕道而行，残息自散", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
    ]},
  r04_liusha_bones: { title: "流沙翻骨", text: "流沙河涨了一次秋水，河滩上翻出累累白骨——有妖的，有人的。河底传来沉闷的嗡鸣，像是沙僧当年那柄降妖宝杖的残响。一具骷髅手中紧攥着什么，指骨间隐约有灵光。",
    region: [4, 4],
    opts: [
      { text: "【缘】打捞那具骷髅手中的灵光之物", fate: '缘', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":58}}},
      { text: "【渡】以佛号超度河中亡魂", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【战】踏骨渡河——骷髅挡路便踩碎", fate: '战', effect: {"ti":{"atk":12,"hp":30}}},
    ]},
  r05_renshen_root: { title: "人参残根", text: "五庄观人参果树虽已复活，但地底深处仍有残根蔓延。镇元子不曾提起——这些残根暗中汲取地脉灵气，养出了一株通体晶莹的小草。草叶上凝着露水般的灵液，伸手可及。",
    region: [5, 5],
    opts: [
      { text: "【夺】连根拔起——灵草不认主人，谁摘归谁", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":70}}},
      { text: "【渡】以三昧真火焚根断脉，绝后患", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【缘】引导残根归入地脉，两不相欠", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  r06_huoling_cry: { title: "火灵啼哭", text: "火云洞深处，红孩儿留下的三昧真火种在岩壁间孕育出一只火灵——无定形，如一团跳动的赤焰。它发出婴孩般的啼哭，不知是在求救，还是在诱敌。火光映出你面目的倒影，那倒影在火中扭曲。",
    region: [6, 6],
    opts: [
      { text: "【渡】以佛法超度火灵，散其执念", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】吞火种淬体——三昧真火，万金难求", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":85}}},
      { text: "【缘】引火灵入法器，化敌为友", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【隐】封洞口以绝火患，任其自灭", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
    ]},
  r07_sanshi_ghost: { title: "三国师残魂", text: "车迟国三国师被悟空识破后，虎力大仙的一缕残魂附在棋盘上。每至子夜，棋子自行对弈，发出金石之声。寺中老僧夜不能寐，苦求取经人处置。残魂虽弱，却仍带着当年与悟空斗法的戾气。",
    region: [7, 7],
    opts: [
      { text: "【渡】诵经超度，送虎力入轮回", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【战】以战意碾碎残魂——妖道不值得慈悲", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":100}}},
      { text: "【逆】吸收残魂中的妖力——管他正道妖道，力量就是力量", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  r08_laogui_return: { title: "老龟再临", text: "通天河老龟再次浮出水面，背上驮着一块石碑。碑上刻满了文字——不是给你看的，是给河底的亡魂看的。老龟说：\"当年你替我问了佛祖寿数，我记了一千年。如今碑文浮出，因果该了。\"",
    region: [8, 8],
    opts: [
      { text: "【缘】帮老龟翻正石碑，了却千年执念", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【夺】在碑上刻下自己的名字——因果碑上留名，气数归我", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":310}}},
      { text: "【战】推碑入河——什么千年因果，与我无关", fate: '战', effect: {"ti":{"atk":12,"hp":30}}},
    ]},
  r09_qianshi_well: { title: "前世之井", text: "女儿国边境有一口井，名为\"照前\"。饮一口井水，便能看到自己前世的记忆。取经人的前世有九种人生——每一种都死在取经路上，每一种都带着未了的遗憾。井水微微泛着金光，像液态的月光。",
    region: [9, 9],
    opts: [
      { text: "【缘】饮井水——看前世，知来路", fate: '缘', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":166}}},
      { text: "【渡】封井——前世的遗憾不该再困后人", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【隐】不饮不封——前世是前世，今生是今生", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
      { text: "【夺】带走一瓶井水——前世记忆是稀缺货色", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  r10_liuer_shadow: { title: "六耳残影", text: "真假猴王一役后，六耳猕猴的心魔碎片散落四方。其中一片附着在取经人身上——它不是妖，是你自己内心最阴暗的那一面。它在耳边低语：\"你和我一样，不过是别人的影子。\"",
    region: [10, 10],
    opts: [
      { text: "【渡】以禅定之心对抗——我不是你的影子", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【逆】接纳心魔——影子也是自己，不如融为一体", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
      { text: "【战】以战意碾碎心魔——我不需要阴暗面", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":155}}},
      { text: "【衡】与心魔谈判——各退一步，共存于此", fate: '隐', effect: {"good":5}},
    ]},
  r11_bajiao_shard: { title: "芭蕉残片", text: "火焰山虽灭，铁扇公主的芭蕉扇碎片仍散落山间。碎片中残留着神扇的一丝力量——能扇灭八百里火焰的余威。三片碎玉般的扇骨插在焦土中，隐隐发出嗡鸣。",
    region: [11, 11],
    opts: [
      { text: "【缘】收集碎片，尝试重铸——扇虽残，魂犹在", fate: '缘', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":213}}},
      { text: "【渡】将碎片埋入火中山眼——镇灭火脉，功德无量", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】吸取碎片灵气——神扇之力，为我所用", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  r12_jinguang_temple: { title: "金光寺密室", text: "祭赛国金光寺的佛塔下发现一间密室，藏有天竺经文的残卷——但经文被禁制封锁，强行打开可能毁去内容。残卷散发着千年墨香，禁制上的符文已经模糊，似乎随时会自行消散。",
    region: [12, 12],
    opts: [
      { text: "【战】强破禁制——经文等不了，我也等不了", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":237}}},
      { text: "【缘】请当地高僧共同参悟——众人拾柴火焰高", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【隐】封存密室，留待有缘人", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
    ]},
  r13_shituo_ruins: { title: "狮驼国废墟", text: "狮驼国已成废墟。三魔被收服后，满城妖民四散，只剩断壁残垣。城中一口枯井，井底传来低语——那是被三魔吞噬的百姓的怨念，千年不散，化为妖雾笼罩废墟。妖雾中隐约有光，是亡者最后的执念。",
    region: [13, 13],
    opts: [
      { text: "【渡】以佛光净化妖雾——亡者该安息了", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】吸收妖雾中的怨力——死者已矣，生者当更强", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":262}}},
      { text: "【逆】在废墟上刻下", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
      { text: "【缘】引导亡魂入轮回——不渡不夺，各归其位", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  r14_yingling_cry: { title: "婴灵夜啼", text: "比丘国国丈鹿精被收服后，留下了一段孽缘——被他害死的孩童怨念化为婴灵，在深夜的废墟中啼哭。声音不大，却像针一样扎进心里。婴灵们不攻击，只是哭，只是看着你。",
    region: [14, 14],
    opts: [
      { text: "【渡】超度婴灵——每一个名字都该被记住", fate: '渡', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":287}}},
      { text: "【衡】封印婴灵——不超度也不放任，留待后人处置", fate: '隐', effect: {"good":5}},
      { text: "【夺】以婴灵怨气淬炼杀意——怨念也是力量", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  // =============================================================
  // P2 专属剧情·叙事高光区：祭赛国(12) / 狮驼岭(13) / 比丘国(14)
  // 每地区 3 段 region 限定专属剧情（配合原 r12/r13/r14 各 1 段），不再靠通用随机池兜底
  // =============================================================
  // ---- 祭赛国 · 金光寺舍利疑案 ----
  r12_baota_dark: { title: "宝塔失光", text: "金光寺十三层宝塔，一夜之间失了光。塔顶舍利被窃，僧众跪在塔下，以为是佛降罪，叩得额头出血。你蹲在塔基，指尖摸到一溜湿痕——是水，腥得像河底的淤泥。谁家的佛，会从水里爬上来偷光？",
    region: [12, 12],
    opts: [
      { text: "【渡】起身替僧众诵经，先安人心，再查真相", fate: '渡', effect: {"good":15,"ti":{"hp":40}}},
      { text: "【缘】循水渍出寺，追查窃宝者，为金光寺洗冤", fate: '缘', effect: {"good":12,"yuan":{"mdef":0.04}}},
      { text: "【隐】按兵不动，藏于暗处，等窃贼再犯", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
      { text: "【夺】顺水渍潜入碧波潭，把佛光据为己有", fate: '夺', effect: {"evil":12,"equip":2}},
    ]},
  r12_longgong_night: { title: "龙宫夜宴", text: "碧波潭底，万圣龙宫灯火通明。万圣公主把舍利夜明珠簪在鬓边，逢人便问：我这珠，像不像月宫的？满座龙子龙孙赔笑，没人敢说——那珠是偷来的光。她看见你，眼睛一亮：取经的，你看我像公主，还是像贼？",
    region: [12, 12],
    opts: [
      { text: "【渡】劝她归还舍利——偷来的光，照不亮自己", fate: '渡', effect: {"good":15,"ti":{"hp":40}}},
      { text: "【隐】潜行探遍龙宫，记下每一处暗门", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
      { text: "【夺】趁夜盗走夜明珠，叫她也尝尝被偷的滋味", fate: '夺', effect: {"evil":15,"equip":2}},
      { text: "【逆】掀翻龙宫夜宴，当着满堂妖客揭她的底", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  r12_jiutou_whisper: { title: "九头低语", text: "碧波潭最深处，九头虫的九个头颅叠在一起，对着一颗假舍利低语——它把偷来的光当成自己的，日日供奉，夜夜膜拜，像最虔诚的僧。虾兵说：驸马每晚都要对珠说很久的话，说它终于被人供起来了。你忽然明白：它缺的不是佛宝，是被供着的那口气。",
    region: [12, 12],
    opts: [
      { text: "【缘】以一言点破它的执念——你要的从来不是光", fate: '缘', effect: {"good":12,"yuan":{"mdef":0.04}}},
      { text: "【战】九头齐出之日，便是断它执念之时", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":237}}},
      { text: "【夺】拔下它一颗毒牙，给它留个醒", fate: '夺', effect: {"evil":15,"equip":2}},
      { text: "【隐】不动声色退出深潭，让它继续供那颗假珠", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
    ]},
  // ---- 狮驼岭 · 四百里尸山 ----
  r13_bone_robes: { title: "白骨袈裟", text: "狮驼岭四百里尸山，一具骷髅披着半截袈裟端坐，指骨在地上刻着——走到第几难，死在第几难。他和你一样，是来取经的。你数他身后的脚印：一行来，没一行回。尸山深处有风声，像是前人在问你：这一路，值不值？",
    region: [13, 13],
    opts: [
      { text: "【渡】埋骨立碑，替他念完没念完的经", fate: '渡', effect: {"good":15,"ti":{"hp":40}}},
      { text: "【缘】取下他的袈裟残片系在臂上——替他走完", fate: '缘', effect: {"good":12,"yuan":{"mdef":0.04}}},
      { text: "【逆】踩着前人尸骨过去——路就是这样铺的", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
      { text: "【夺】收走尸山骨灵的魂火，淬进自己骨里", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  r13_dapeng_feather: { title: "大鹏金羽", text: "狮驼岭云头，一根金羽缓缓飘落，羽根沾着没干透的血。妖民跪着说：鹏爷一餐要三百人，吃不完的，都堆成尸山。你捻着那根羽毛，想起它立在云上说你不是第一个的神情——那是吃惯了人，才有的慈悲。",
    region: [13, 13],
    opts: [
      { text: "【隐】收羽藏身，不惊动云上的大鹏", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
      { text: "【缘】持羽问心：吃人的妖与供妖的人，谁更该渡", fate: '缘', effect: {"good":12,"yuan":{"mdef":0.04}}},
      { text: "【战】攥羽直上云头，跟大鹏论一论第一个", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":262}}},
      { text: "【夺】以羽为刃，夺大鹏一缕金翅气", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  r13_qingshi_echo: { title: "青狮回响", text: "青狮被收，狮子吼的余韵却还在山谷回荡，震落大片崖壁——露出一条白骨铺成的路，直通狮驼城。那路是它一口一口吃出来的。崖上有妖民在哭：不是哭死人，是哭路修好了，以后交的供奉更多了。你站在路口，忽然不知道该不该走上去。",
    region: [13, 13],
    opts: [
      { text: "【渡】以佛号平复吼声余韵，让山谷先静下来", fate: '渡', effect: {"good":15,"ti":{"hp":40}}},
      { text: "【缘】循白骨路而行，把沿路亡魂一个个送走", fate: '缘', effect: {"good":12,"yuan":{"mdef":0.04}}},
      { text: "【逆】踏路直行——这路是前人拿命铺的，不该白铺", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
      { text: "【夺】收走白骨路上不甘的怨灵，为己所用", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  // ---- 比丘国 · 丹炉与名册 ----
  r14_danlu_child: { title: "丹炉小儿", text: "比丘国丹房，炉火滚沸。药童蹲在炉边，往火里续着什么——你走近，看见炉边竹筐里码着一双双小鞋。墙上贴着圣旨：为国祈福，特借一千一百一十一个心肝，炼长生丹。药童抬头看你，眼神空洞：大人，够数了，明儿该轮到我了。",
    region: [14, 14],
    opts: [
      { text: "【渡】掀翻丹炉，救下没入炉的孩童", fate: '渡', effect: {"good":15,"ti":{"hp":40}}},
      { text: "【隐】隐于暗处，记下丹房每一笔账，等一个翻案的时机", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
      { text: "【逆】捧着圣旨闯宫，问国王：心肝入药，保的谁的江山", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
      { text: "【夺】夺丹炉之火，反手炼了那国丈", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  r14_deerhorn_ledger: { title: "鹿角名册", text: "清华洞口，白鹿精被斩下的鹿角还在。角上密密麻麻刻着名字——每一个，都是一个孩子的名。你数到一千一百一十一，手开始抖。角根压着一封给国王的信：心肝入药，可保江山万年。白鹿不识字，写字的也不是白鹿。",
    region: [14, 14],
    opts: [
      { text: "【渡】逐个念名超度，给他们立一座无字碑", fate: '渡', effect: {"good":15,"ti":{"hp":40}}},
      { text: "【缘】循名册寻还活着的孩子，护他们周全", fate: '缘', effect: {"good":12,"yuan":{"mdef":0.04}}},
      { text: "【战】持名册闯宫，一个名字讨一条命", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":287}}},
      { text: "【逆】一把火焚了名册——没有名单，就没有罪证", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  r14_guoshi_lamp: { title: "国丈长明灯", text: "比丘国国丈府，一盏长明灯千年不灭。灯油是人心肝熬的——白鹿精说，这叫长生油，点了灯，江山就稳。灯下压着一卷残经，是给国王讲长生态的。你问守灯的小妖：你们国丈，信佛还是信命？小妖答：信灯火不灭。",
    region: [14, 14],
    opts: [
      { text: "【隐】断灯不惊，静待那国丈现出鹿形", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
      { text: "【渡】以清水换下长生油——灯可以不灭，恶得先断", fate: '渡', effect: {"good":15,"ti":{"hp":40}}},
      { text: "【缘】展开那卷残经，问谁先教他用人命续命", fate: '缘', effect: {"good":12,"yuan":{"mdef":0.04}}},
      { text: "【夺】夺灯芯淬体，把长生抢过来", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  r15_yutu_regret: { title: "玉兔遗恨", text: "天竺国假公主——玉兔精——被太阴星君收走前，留下了一缕仙气。这缕仙气凝在她的凤冠上，散发着月宫特有的清冷光芒。凤冠搁在妆奁中，像一弯坠落的月。",
    region: [15, 15],
    opts: [
      { text: "【缘】以仙气修复紫金钵——钵盂与月宫同源，相得益彰", fate: '缘', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":312}}},
      { text: "【渡】将仙气归还月宫——不属于我的东西不拿", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】吸收仙气——玉兔的千年修为，不要白不要", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  r16_lingshan_foot: { title: "灵山脚下", text: "灵山就在头顶，却还有一步之遥。脚下的土地是金色的，每踩一步都能听到梵音。路边有一棵菩提树，树下有一方石凳——千年前有人在此听佛祖讲经，石凳上还留着余温。",
    region: [16, 16],
    opts: [
      { text: "【渡】静坐聆听——经文入耳，功德入心", fate: '渡', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【缘】在树下种一粒种子——灵山脚下种因，来日结果", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【战】加速前行——灵山在望，不可懈怠", fate: '战', effect: {"ti":{"atk":12,"hp":30}}},
    ]},
  r17_lingyun_ferry: { title: "凌云渡", text: "凌云渡——取经的最后一关。河水不是水，是液态的光。渡过去，便是灵山；渡不过，便是又一具沉在河底的骷髅。河面上漂着一只无底船，船底透明，能看到河中沉着的无数前朝取经人的遗物。接引佛祖站在船头，向你伸出手。",
    region: [17, 17],
    opts: [
      { text: "【渡】涉水而过——以肉身渡法河，脱凡胎", fate: '渡', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":363}}},
      { text: "【缘】驾舟而行——无底船渡有缘人", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【逆】拒绝渡河——我自己的路，不需要佛祖来引", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  r18_heishui_disturbance: { title: "黑水异动", text: "大唐边境的黑水河，河水突然沸腾。河底传来沉闷的撞击声——是泾河龙王旧部在此作祟，还是西海龙宫的暗流？岸边渔村已空无一人，只剩几盏暗金灯笼在风中摇晃，灯油味混着冷檀香。青砖缝隙里散落着暗金铜锈碎屑，像是有人在此反复踩踏。",
    region: [1, 1],
    opts: [
      { text: "【战】跃入河中斩杀作祟者——黑水不靖，以杀止沸", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":16}}},
      { text: "【缘】以渔村残留的渔网设下结界——困住异动，不伤性命", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【隐】沿河岸潜行探查——先弄清是什么东西在作怪", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
    ]},
  r19_shihou_shadow: { title: "石猴旧影", text: "两界山岩壁上残留着一道石猴的剪影——是当年孙悟空被压五行山下时，以爪刻下的自己。剪影的眼眶里积着雨水，倒映出取经人的模样。岩壁缝隙长出一株小草，草叶上凝着露水般的灵液。",
    region: [2, 2],
    opts: [
      { text: "【战】以棍风拂过岩壁——让旧影再听一次金箍棒的风声", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":27}}},
      { text: "【渡】在剪影旁刻下", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【逆】抹去剪影——过去的我就是枷锁", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  r20_huangfeng_path: { title: "黄风岭密道", text: "黄风岭背风处有一条被风沙半掩的密道，洞口石壁上刻着\"虎先锋巡守处\"。洞内残留着妖风凝成的石笋，每根石笋顶端都挂着一盏锈蚀的暗金铃铛。风一吹，铃铛发出类似梵音的呜咽。",
    region: [3, 3],
    opts: [
      { text: "【夺】收走暗金铃铛——妖物法器，淬体正好", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":36}}},
      { text: "【战】打通密道——彻底拔掉虎先锋的耳目", fate: '战', effect: {"ti":{"atk":12,"hp":30}}},
      { text: "【隐】记下密道位置后封口——留作后路，不惊动妖众", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
    ]},
  r21_liusha_ferry: { title: "流沙河渡", text: "流沙河渡口，一艘无底船搁在浅滩。船底透明，能看到河底沉着无数取经人的遗物，其中一枚暗金铜钱上刻着\"沙\"字。撑船的老叟须发皆白，眼神空洞：\"渡人？先渡己。\"",
    region: [4, 4],
    opts: [
      { text: "【缘】以铜钱为引，重铸船底——无底之舟，渡有缘人", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【战】劈开浅滩妖阵——渡口清了，路才通", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":58}}},
      { text: "【隐】悄然涉水而过——不惊动撑船人，也不惊动河底", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
    ]},
  r22_wuzhuang_scent: { title: "五庄遗香", text: "五庄观外围的果园，人参果树的香气仍未散尽。一株被雷劈过的枯树根部长出了一颗畸形的小果，果皮上布满暗金纹路，像是被人用铜锈描过。守园道童的魂魄蹲在树旁，反复念叨：\"镇元子说了，根不能断……\"",
    region: [5, 5],
    opts: [
      { text: "【渡】以三昧真火焚尽畸形果——绝后患，不留祸根", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】吞下畸形果——异种也是种，力量就是力量", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":70}}},
      { text: "【缘】移栽畸形果至观外灵田——换个地界，或可变善", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  r23_huoyun_ember: { title: "火云余烬", text: "火云洞外，红孩儿走后留下的火砖仍在发烫。砖缝间残留着几缕暗红发丝——是铁扇公主来过，蹲在此处哭了很久。发丝缠绕成一枚暗金簪子，簪头雕着一朵即将熄灭的火焰。",
    region: [6, 6],
    opts: [
      { text: "【缘】收起簪子——还给铁扇公主，或能化解一段怨", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【夺】抽取簪中火灵——母子情分，炼作力量", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":85}}},
      { text: "【渡】以佛力抚平火砖——余怒该散了", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
    ]},
  r24_chechi_chess: { title: "车迟棋盘", text: "车迟国智渊寺废墟中，三国师当年对弈的棋盘仍在。棋盘是青石所制，棋子是黑白两种碎石，每一颗上都刻着一段被遗忘的咒语。棋盘正中残留着一圈烧焦的痕迹——是悟空当年一棒掀翻棋盘留下的。",
    region: [7, 7],
    opts: [
      { text: "【战】一棒扫落残棋——妖道伎俩，不必纠缠", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":100}}},
      { text: "【衡】复盘棋局——看妖师当年如何落子，知己知彼", fate: '隐', effect: {"good":5}},
      { text: "【逆】颠倒黑白子——规则既由人定，我便改它", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  r25_tongtian_stele: { title: "通天碑林", text: "通天河畔竖着一片残碑林，每座碑上刻着一名溺亡者的名字，碑脚被河水冲刷出暗金纹路。老龟说，这些碑是他一千年来一块块背来的。碑林最深处有一座无字碑，碑面光滑如镜，映出你的倒影——倒影手持禅杖。",
    region: [8, 8],
    opts: [
      { text: "【渡】在无字碑上刻下", fate: '渡', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":310}}},
      { text: "【缘】辨认碑上名字，逐一超度——慢，但每魂都记得", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【战】推倒碑林——亡者已矣，立碑何益", fate: '战', effect: {"ti":{"atk":12,"hp":30}}},
    ]},
  r26_nver_flower: { title: "女儿花信", text: "女儿国边境，一株通体雪白的\"忘忧花\"开在井旁。花瓣落地即化为宣纸残页，纸上写满未寄出的情书。花根缠绕着一枚暗金戒指，戒面刻着\"国\"字——是某一世女王遗落在此的。",
    region: [9, 9],
    opts: [
      { text: "【缘】收起戒指，代为保存——一诺千金，待还其人", fate: '缘', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":166}}},
      { text: "【渡】以佛法化花为愿力——情执最苦，度之", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】吞下花心——情念亦能入道", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  r27_zhenjia_mirror: { title: "真假镜廊", text: "真假猴王一役后，战场化作一条镜廊。两侧铜镜蒙着铜锈，镜中映出的不是你，是你在各个抉择点\"丢掉的可能性\"。其中一面镜子里，你选择了另一条路，并且走得比你更远。镜子深处传来六耳的低语。",
    region: [10, 10],
    opts: [
      { text: "【逆】击碎那面最亮的镜子——我走的路，才是对的", fate: '逆', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":155}}},
      { text: "【衡】在每面镜前各留一念——可能性不该被抹除", fate: '隐', effect: {"good":5}},
      { text: "【战】劈开镜廊出口——虚妄不必久留", fate: '战', effect: {"ti":{"atk":12,"hp":30}}},
    ]},
  r28_huoyan_eye: { title: "火焰山眼", text: "火焰山熄灭后，山顶留下一只\"山眼\"——一个冒着青烟的圆形深坑。坑底沉积着暗金色的岩浆余烬，余烬中插着半截芭蕉扇骨。坑壁刻满被天庭篡改过的灭火咒文，风一吹就飘起细小火星。",
    region: [11, 11],
    opts: [
      { text: "【渡】补全灭火咒文——山眼封印，福泽一方", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】拔出扇骨——神器残片，当为我用", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":213}}},
      { text: "【逆】引地火重燃——灭了又如何，我让它再烧一次", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  r29_jisai_tear: { title: "祭赛佛泪", text: "祭赛国金光寺塔顶，那颗被盗走的佛宝舍利其实从未离开——它化成一滴\"佛泪\"渗进了塔基。塔基青砖被泪水浸成暗金色，砖缝里长出一株只开一夜的优昙花。守塔僧人说，花开的夜晚能听到舍利在哭。",
    region: [12, 12],
    opts: [
      { text: "【渡】守到花开，护舍利归位——一夜不眠，换千年安宁", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】吞下优昙花——佛泪也是灵药", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":237}}},
      { text: "【缘】以塔基铜锈为引，重铸佛宝——残缺亦可重圆", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  r30_shituo_watch: { title: "狮驼哨塔", text: "狮驼国废墟边缘，一座哨塔半倾。塔顶挂着三魔当年的巡哨铜锣，锣面锈出暗金纹路，敲击时发出沉闷的呜咽。塔下一具妖兵枯骨，指骨间紧攥着半张军令——是青狮精下令屠城的铁证。",
    region: [13, 13],
    opts: [
      { text: "【战】击碎铜锣——妖国余音，彻底断绝", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":262}}},
      { text: "【渡】保留军令，刻上亡者之名——罪证亦需被记住", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】吞下铜锈——妖国气运，归我", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  r31_biqiu_cauldron: { title: "比丘药炉", text: "比丘国国丈府废墟中，那口炼\"小儿心肝\"的药炉还在冒烟。炉壁糊着暗金色炉灰，灰里掺着血。炉底沉着一颗未被取走的\"长生丹\"，丹上缠着一缕婴灵的青丝。炉旁墙上写着鹿精逃走前最后一句话：\"陛下，臣先走一步。\"",
    region: [14, 14],
    opts: [
      { text: "【渡】毁炉焚丹——孽缘到此为止", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】吞下长生丹——鹿精千年修为，不要白不要", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":287}}},
      { text: "【衡】封存药炉，留作警世——后人当知此恶", fate: '隐', effect: {"good":5}},
    ]},
  r32_tianzhu_crown: { title: "天竺凤冠", text: "天竺国驿馆的妆奁深处，假公主玉兔精留下的凤冠已蒙上铜绿。冠上每一颗珠子的位置都对应一颗星宿，珠与珠之间用暗金丝线相连，构成一个微型星图。星图缺口处，正好能嵌一枚取经人随身携带的物件。",
    region: [15, 15],
    opts: [
      { text: "【缘】以自身物件补全星图——月宫之秘，或可一窥", fate: '缘', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":312}}},
      { text: "【渡】将凤冠归还原主太阴星君——不属于此界，物归原处", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】拆下暗金丝线——星图之力，炼入法宝", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  r33_lingshan_moss: { title: "灵山苔径", text: "灵山脚下那条青石板路，缝隙里长着一种只吸梵音生长的苔。苔被踩踏后会发出细微的诵经声，像是无数取经人在同时低语。石板的尽头，一块界碑上的字迹已被黑苔覆满——唯有\"人\"字还认得出。界碑旁搁着一只破旧的芒鞋。",
    region: [16, 16],
    opts: [
      { text: "【渡】赤脚踏过苔径——亲聆历代取经人的低语", fate: '渡', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【缘】拾起芒鞋——它是某位失败者的全部遗物", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【逆】以脚碾碎梵音苔——我不需要前人的声音指引", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  r34_duhe_light: { title: "渡河余光", text: "凌云渡口，接引佛祖的无底船已靠岸。船底透明，能看到河底沉着的无名遗物中，有一盏从未熄灭的暗金灯笼——灯油正是第一世灵山打翻的那盏。灯笼随波轻晃，光映在船底，像一个不肯离去的手势。",
    region: [17, 17],
    opts: [
      { text: "【渡】接过灯笼——以光引路，渡河不迷", fate: '渡', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":363}}},
      { text: "【缘】将灯笼放回河心——该去的让它去", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【逆】吹灭灯笼——彼岸不需要光", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  h01_jingu_trace: { title: "紧箍残痕", text: "成佛之后，紧箍已消。但头上那道勒痕仍在——不是肉体的伤，是心里的。每当战斗激烈，痕处便隐隐作痛，像是如来的手掌从未真正松开。你摸了摸那道痕，指尖传来千年前的温度。",
    opts: [
      { text: "【逆】碎箍释恨——这一怒，压了五百年", fate: '逆', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":363}}},
      { text: "【渡】抚痕悟道——恨意随箍而去，留下的只有教训", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
    ]},
  h02_huaguoshan_empty: { title: "花果山空", text: "路过花果山旧址。水帘洞还在，但猴子猴孙早已不知去向。石桌上的酒樽积了千年的灰。你坐在石凳上，仿佛看到当年那个从石头里蹦出来的猴子——天不怕地不怕，最后被压了五百年。山风穿过空荡荡的花果山，像是谁在叹气。",
    opts: [
      { text: "【战】在山顶打一套棍法——让花果山再听一次金箍棒的风声", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":363}}},
      { text: "【渡】以佛力祝福花果山——愿猴孙们平安", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【逆】在石壁上刻", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  h03_liuer_remnant: { title: "六耳余孽", text: "六耳猕猴已死，但他的一缕残魂缠上了你。不是因为恨，是因为你们是同一块石头里出来的——他就是你没走的那条路。残魂以半透明的形态站在面前，面容与你一模一样，只是眼中多了一丝你从未有过的东西。\"你杀了我，\"残魂说，\"但你杀不掉你自己。\"",
    opts: [
      { text: "【夺】吸收六耳的六识——他听到的、看到的、知道的，都归我", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":363}}},
      { text: "【渡】超度六耳——你不是我的另一面，你只是走错了路", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【衡】与六耳对话——你不该死，但已经死了。我能为你做什么？", fate: '缘', effect: {"good":5}},
    ]},
  h04_jinchan_dream: { title: "金蝉旧梦", text: "灵山脚下，前世记忆如潮水涌来。金蝉子——如来二弟子——因不听说法、轻慢佛法被贬入轮回。十世转世，十世取经，十世死在路上。如今记忆复苏，你看到了第一世的自己——那个在莲座上打瞌睡的年轻僧人。他还不知道等待他的是什么。",
    opts: [
      { text: "【逆】觉醒前世记忆——金蝉子的智慧，不该被遗忘", fate: '逆', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":363}}},
      { text: "【渡】遗忘前世——金蝉子已死，活着的是取经人", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
    ]},
  h05_bowl_resonance: { title: "紫金钵鸣", text: "紫金钵盂是取经人十世取经的法器。每一世的主人都曾在钵底刻下一行字——有的是名字，有的是遗言，有的只是一个\"归\"字。如今十世铭文齐聚，钵盂开始嗡鸣，声音像一颗心在跳。十行字在钵底旋转，等待取经人做出选择。",
    opts: [
      { text: "【缘】以今世愿力重铸钵盂——十世合一，钵盂圆满", fate: '缘', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":363}}},
      { text: "【渡】诵读十世铭文——每一世都值得被记住", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【衡】只留今世之名——前九世的因果，到此为止", fate: '隐', effect: {"good":5}},
    ]},
  h06_gaolaozhuang_feast: { title: "高老庄宴", text: "路过故地高老庄。庄里人还在供奉你——\"天蓬元帅\"的牌位摆在堂屋正中，旁边是你当年用过的钉耙。庄里如今闹了猪妖，用的正是你当年教给庄民的武艺。\"师父，这祸根是我种下的。\"你对着牌位说。牌位上的漆已经裂了。",
    opts: [
      { text: "【战】亲手了结——自己种的因，自己收果", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":363}}},
      { text: "【渡】教庄民新的防身之法——不靠天蓬，靠自己", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【隐】悄然离去——旧账不翻，翻了对谁都不好", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
    ]},
  h07_jingtan_wrath: { title: "净坛之怒", text: "如来封你为净坛使者——享用天下供品。听起来是美差，但你知道这意味着什么：你永远不会成佛。在祭赛国的一处废弃祭坛前，你站了很久。坛上的供品早已腐烂，就像你的佛门前程。身后传来小妖的窃笑——它们也在笑你。",
    opts: [
      { text: "【逆】怒碎祭坛——净坛使者？我不认这个命！", fate: '逆', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":363}}},
      { text: "【渡】坦然受之——成佛不成佛的，吃饱就行", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【衡】在祭坛上留下自己的名字——净坛也是坛，我配得上", fate: '隐', effect: {"good":5}},
    ]},
  h08_nilin_pain: { title: "逆鳞之痛", text: "化为人形后，龙鳞已褪。但逆鳞——颈后那一片——始终未消。那是龙的命门，也是龙的尊严。每当有人触碰，便是钻心的痛。西海龙宫的旧部送来消息：龙筋被抽的旧伤又犯了，需要一味药引——取经人的一滴血。",
    opts: [
      { text: "【逆】激发逆鳞之力——痛就是力量，怒就是铠甲", fate: '逆', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":363}}},
      { text: "【渡】以佛力平息——逆鳞不是弱点，是提醒我曾是龙的印记", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
    ]},
  h09_longhun_sea: { title: "龙魂归海", text: "鹰愁涧的水已清了。当年你吞了取经人的马，被观音点化在此等候。如今再路过，涧底传来龙吟——不是你，是被你吞食的那匹白马的亡魂。它等了你千年，只为问一句：为什么？涧水映出你的倒影，倒影中是一匹白马。",
    opts: [
      { text: "【战】以龙威驱逐——我是龙马，不是你的债主", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":363}}},
      { text: "【渡】以佛力超度——是我欠你的，现在还", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【缘】化为白马原形，与亡魂共饮涧水——你我的因果，到此两清", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  h10_jiushi_skull: { title: "九世骷髅", text: "流沙河为妖时，每七日受飞剑穿胸之苦。九世取经人的骷髅项链是你唯一的执念——每一颗骷髅都是你杀死的\"自己\"。如今在狮驼岭的一处枯井边，你看到了前世骷髅化成的骨莲。花瓣上刻着九世的名字，每一世都死在同一条路上。骨莲在等你。",
    opts: [
      { text: "【战】打碎骨莲——前世已死，不必再念", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":363}}},
      { text: "【渡】拥抱骨莲——九世苦痛，皆是我身", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【缘】将骨莲沉入井底——前世安息，来世不见", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  hid01_nidao_seed: { title: "逆道之种", text: "天竺国边境，你挖出一颗漆黑的莲子——是观音池中被遗弃的\"逆道莲\"。莲子低语：\"种下我，你会看到灵山的另一面。\"只有曾经在六耳残影中选【逆】、在弃经中选【逆】的人，才能听到它的声音。莲壳上布满暗金纹路，与碑林无字碑的刻痕同源。",
    region: [15, 15],
    opts: [
      { text: "【逆】种下莲子——我要看灵山的另一面", fate: '逆', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":312}}},
      { text: "【渡】捏碎莲子——逆道不该存在", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
    ]},
  hid02_bangfo_jinchan: { title: "弃经金蝉", text: "灵山脚下，取经人的禅杖突然剧烈震动——杖头的金环自行脱落，露出里面一截漆黑的\"弃经杖\"。这是金蝉子十世以来从未示人的另一面。杖身刻着一行小字：\"若经圆满，何惧一弃？\"",
    region: [16, 16],
    opts: [
      { text: "【逆】握紧弃经杖——金蝉子的另一面，从此归我", fate: '逆', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【渡】重铸金环——谤念压下，初心不改", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
    ]},
  hid03_juanlian: { title: "卷帘复权", text: "流沙河底，一柄被锈蚀成暗金色的卷帘大将印玺半埋在沙里。印钮是蟠龙，龙角断了一根——是沙僧当年打碎的那根。印面朝下，按在沙地上，压出一方清晰的\"卷帘\"二字。河水冲刷着印钮断口，像是还在流血。",
    region: [4, 4],
    opts: [
      { text: "【战】拔起印玺——卷帘大将，该回来了", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":58}}},
      { text: "【渡】以河沙掩回印玺——过去的位置，就让它在那里", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
    ]},
  hid04_longtaizi: { title: "龙太子归", text: "凌云渡河底，白龙马的本体——那条被斩断龙角的白龙——的遗蜕静静躺着。遗蜕额头的逆鳞处嵌着一枚暗金龙珠，珠中封着西海龙王最后的嘱托：\"儿，别回来。\"但珠面裂了一道缝，裂口里长出一株水草。",
    region: [17, 17],
    opts: [
      { text: "【缘】取下龙珠——父王的嘱托，我带着", fate: '缘', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":363}}},
      { text: "【逆】捏碎龙珠——别回来？我偏要回去", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
      { text: "【渡】以河水送别遗蜕——龙族太子，在此一拜", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
    ]},
  hid05_wusheng: { title: "五圣证道", text: "灵山脚下那块无字碑，今日终于显出了完整的纹路——五道凹槽，恰好对应观音、二郎神、四海龙王、哪吒、太上老君五条链。如果你走完了全部因果，五枚印记会同时亮起，碑面浮现一行小字：\"五圣证道，方可破局。\"",
    region: [16, 16],
    opts: [
      { text: "【逆】将五印按入碑中——破局，就在今朝", fate: '逆', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【缘】只在碑前静坐——证不证道，随它去", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  d01_kuhai_cihang: { title: "苦海慈航", text: "路遇一群逃难的百姓。他们身后追着的不是兵，是妖。百姓们跪在路边，磕头如捣蒜。你看了看前方——还有八十难要走；又看了看脚下——每一张脸都在求你。苦海无边，你渡不渡？",
    opts: [
      { text: "【渡】以身饲魂——我的血肉能换他们一命", fate: '渡', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【缘】以愿力筑桥——不伤己身，引魂渡苦", fate: '缘', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【战】斩杀追兵——渡人不如渡妖，杀干净最省事", fate: '战', effect: {"ti":{"atk":12,"hp":30}}},
    ]},
  d02_sheshen_sihu: { title: "舍身饲虎", text: "深山中发现一只濒死的白虎。它不是妖，是山神的坐骑——因为山神陨落，它已饿了七日。白虎看着你，眼中没有杀意，只有饥饿。佛经里说，佛祖前世曾舍身饲虎。你虽然不是佛祖，但你有一颗渡心。",
    opts: [
      { text: "【渡】割肉饲虎——佛祖能做的，我也能做", fate: '渡', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【缘】以灵药救虎——不割肉，也能救", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【战】斩杀白虎取胆——虎胆入药，可治百伤", fate: '战', effect: {"ti":{"atk":12,"hp":30}}},
    ]},
  d03_yinguo_chain: { title: "因果缠身", text: "一根看不见的线，连接着你遇到的每一个生灵。你看不到它，但它在那里——每一次选择都在拉紧或剪断这些线。在女儿国边境的一棵古树上，因果线显现了：树上挂满了枯萎的缘分，像风干的脐带。",
    opts: [
      { text: "【缘】摘下枯缘之花——每一段因果都值得重铸", fate: '缘', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【渡】斩断枯缘——有些因果，该断了", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【逆】将因果线缠在手上——因果是锁链，也是武器", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  d04_yuanmu_qiuyu: { title: "缘木求鱼", text: "一棵千年古树上刻着无数名字——有人的，有妖的，有佛的。每个名字旁边都连着一根线，线的另一端消失在树冠深处。你找到了自己的名字——线是断的。守树的老猿说：\"你的名字是后来刻上去的，线是被人剪断的。想接上，得找到剪线的人。\"",
    opts: [
      { text: "【缘】请老猿帮忙接线——因果的事，问因果", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【战】自己爬上树顶——谁的线谁接，不假手于人", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【隐】在名字旁刻一个", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
    ]},
  d05_pojun_trial: { title: "破军试炼", text: "前方是一座废弃的古战场。地上插满了断戟残戈，空气中仍弥漫着千年前的杀意。战场的中央站着一尊石像——破军星君。石像手持长刀，刀尖指地。你走近时，石像的眼睛亮了：\"来者何人？敢入破军阵？\"",
    opts: [
      { text: "【战】来者不惧——亮兵器，入阵", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【渡】以佛号化解杀意——战场已死，杀意该散了", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】吸收战场杀意——千年战意，淬我兵刃", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  d06_qianshang_war: { title: "千伤战神", text: "你在梦中被拉入一片血色的荒原。这里没有天，没有地，只有无尽的厮杀。无数战魂在你身边倒下又站起，反复厮杀。一个声音在耳边说：\"战神之路，以伤铺就。你身上的每一道伤，都是你的勋章。\"荒原的尽头站着一个巨大的身影——千伤战神，满身疤痕，每一道疤都在流血。",
    opts: [
      { text: "【战】与战神交锋——用我的伤，换你的伤", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【逆】吞噬战魂——我不需要勋章，我需要力量", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
      { text: "【衡】观战不参战——看够了，就走了", fate: '隐', effect: {"good":5}},
    ]},
  d07_shixue_instinct: { title: "噬血本能", text: "你在林中猎杀了一只妖狐。妖狐的血溅在手上，你感到一阵奇异的快感——不是嗜杀，是某种更古老的本能在苏醒。手上沾染的血迹开始发光，像是被你的皮肤吸收了。林中的其他妖物闻到了血腥气，远远地窥视着你。",
    opts: [
      { text: "【夺】继续猎杀——血的味道会让人上瘾", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【渡】洗净血迹——这不是我，这不该是我", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【战】以战意压制本能——不是不上瘾，是压得住", fate: '战', effect: {"ti":{"atk":12,"hp":30}}},
      { text: "【隐】藏起血迹——本能可以留着，但不必让人知道", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
    ]},
  d08_tunhai_path: { title: "吞骸之路", text: "五庄观附近发现了一株千年灵草，通体晶莹，根须扎在一块灵石上。灵草已经生了灵智，见你走近，根须紧紧抱住灵石——它在害怕。但你认得那块灵石：上面上刻着镇元子的封印，灵力之浓，足以让任何修行者疯狂。灵草在发抖。",
    opts: [
      { text: "【夺】连根拔起——灵石灵草，都是我的", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【衡】只取灵石，留下灵草——我要的是石头，不是命", fate: '隐', effect: {"good":5}},
      { text: "【渡】以佛力催熟灵草——让它自己松开灵石", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
    ]},
  d09_youxing_shadow: { title: "幽行无影", text: "暗夜行路，你的影子突然脱离了你的身体。它站在你面前，和你一模一样，但更安静、更冷。它开口了：\"你一直在赶路，一直在战斗，一直在做选择。但你有没有想过——不选？\"影子伸出手，手中是一枚暗色的丹药。\"吃了它，你可以隐身于六道之外。没有因果，没有命运，也没有牵挂。\"",
    opts: [
      { text: "【隐】服下丹药——消失一时，看看没有我的世界什么样", fate: '隐', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【渡】以光照影——我不需要消失，我需要看清", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】吞噬影子——你就是我，你的力量也是我的", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  d10_xumo_walker: { title: "虚陌行者", text: "你走进了一片没有路的荒野。不是没有路被遮住，是这里从来没有路。脚下的草比你高过头，四周安静得能听到自己的心跳。你开始明白——这就是\"隐\"的极致：不是藏起来，是根本不存在于任何人的认知中。远处有一座无名的石碑，碑上空无一字。",
    opts: [
      { text: "【隐】在碑上不留一字——无名即是我", fate: '隐', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【缘】在碑上刻一个", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【战】推倒石碑——路是走出来的，不是等出来的", fate: '战', effect: {"ti":{"atk":12,"hp":30}}},
    ]},
  d11_beidao_defy: { title: "悖道而行", text: "灵山脚下的石壁上，发现了一段刻文。不是佛经，不是道藏，是一句质问：\"天道不公，何以顺之？\"刻文旁边有六个名字，每个名字后面都跟着一句话——有人写\"逆之\"，有人写\"顺之\"，有人写\"忘之\"，最后一个名字后面只写了四个字：\"天道本无。\"",
    opts: [
      { text: "【逆】在石壁上刻下\"逆之\"——天道不公，那就掀了它重写", fate: '逆', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【渡】在石壁上刻下\"顺之\"——不公也是天，顺着走，自有尽头", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【衡】在石壁上刻下\"忘之\"——公与不公，忘了就两清", fate: '隐', effect: {"good":5}},
    ]},
  d12_bangfo: { title: "破执", text: "灵山脚下，一尊泥塑金身被推倒了。不是妖推的，是人——一个衣衫褴褛的老僧，坐在倒下的泥胎旁，手中拿着一支笔。他在泥胎的脸上画了一个叉。\"佛说众生平等，\"老僧头也不抬，\"那佛和众生呢？\"他转过头看着你，\"你敢掀这泥胎吗？\"",
    opts: [
      { text: "【逆】掀翻泥胎——若道圆满，何惧一疑？", fate: '逆', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【渡】扶正金身——掀不掀的，道不在乎，但我在乎", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【衡】与老僧辩论——佛不需要辩护，但道理需要说清楚", fate: '缘', effect: {"good":5}},
    ]},
  g01_kugu_road: { title: "枯骨路", text: "前方有一段路，路基是用白骨铺的。有人的，有妖的，层层叠叠。最上面的一层已经石化，说明这些骨头已经在这里躺了很久很久。每一具骷髅生前都是取经人——他们没能走完这条路。骨缝间长出了一种白色的花，散发着淡淡的檀香。",
    opts: [
      { text: "【战】踏骨而行——从失败者身上学到的，不比从成功者身上少", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【渡】俯身超度——每一个失败者都值得被安息", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【隐】绕道而行——我不踩别人的骨头上路", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
    ]},
  g02_daota: { title: "倒塔", text: "路边有一座废弃的佛塔，塔身倾斜，随时可能倒塌。塔顶的宝瓶中传来微弱的梵音——不是佛在念经，是被困在塔中的妖灵在模仿佛音。它已经模仿了一千年，模仿得几乎以假乱真。",
    opts: [
      { text: "【渡】扶正佛塔——塔正了，妖灵就出不来了", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】推倒佛塔，释放妖灵——妖灵模仿千年，也是一种修行", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【缘】以佛力封印宝瓶——不扶不推，稳住就好", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  g03_wuzi_tianshu: { title: "无字天书", text: "灵山脚下的石崖上，有一块光滑如镜的石面。传说这是\"无字天书\"——它能映照出观者内心的文字，但写出的字只有本人能看到。石面微微发光，像在等你靠近。你凑近时，石面上开始浮现文字——你看到了，但你不会告诉别人。",
    opts: [
      { text: "【缘】凝目解读——天书无字，心中有字便是字", fate: '缘', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【渡】以掌抹平石面——天书无字，是因为不需要字", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【逆】在石面上写下自己的道——天书无字？我来写", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  g04_lunhui_ferry: { title: "轮回渡口", text: "忘川河畔，一个没有面孔的摆渡人问你：\"你渡哪一世？\"你生前有九世，每一世都死在同一条路上。摆渡人说：\"渡今世，你带着所有记忆过去；渡前世，你放下所有执念重来。\"河水翻涌，每一朵浪花都是一张脸。",
    opts: [
      { text: "【渡】渡今生——带着记忆，带着伤，继续走", fate: '渡', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【缘】渡前世——放下执念，轻装上路", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【逆】不渡——我哪一世都不渡，我走自己的路", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  g05_kongguan: { title: "空棺", text: "一处山洞中，发现了一口棺材。棺材上刻着你的名字。打开一看——里面是空的。棺底刻着一行小字：\"此棺等主人，主人还没死。\"你盯着空棺看了很久。山洞很安静，安静得能听到棺材在呼吸。",
    opts: [
      { text: "【战】毁棺——我的命，不由一口棺材定", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【渡】参悟", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【逆】躺入棺中——死而复生，方知天命", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  g06_qiju: { title: "棋局", text: "两个老人在松下对弈。见你路过，招手邀你落子。棋盘不是普通的棋盘——每一颗棋子都是一缕气数。黑子为杀，白子为守。你落下的每一子，都会改变棋局的走向——不是棋的走向，是你的。老人说：\"赢了不奖，输了不罚。但落子无悔。\"",
    opts: [
      { text: "【战】执黑先手——攻便是守", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【渡】执白后手——守便是攻", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【衡】不落子——看完全局再说", fate: '隐', effect: {"good":5}},
      { text: "【逆】掀翻棋盘——棋局是别人定的，我不下别人的棋", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  g07_duanqiao: { title: "断桥", text: "前方有一座石桥，横跨在两面三刀座深渊之间。桥已经断了——不是中间断的，是两头断的。桥面悬在空中，两端都不着地。桥面上刻满了经文，但已经被风雨磨得模糊。桥下是翻涌的云海，偶尔能看到远处灵山的轮廓。",
    opts: [
      { text: "【渡】以愿力修复断桥——路断了，就修一条", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【战】飞渡深渊——桥断了，人没断", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【缘】在桥断处刻下新经文——旧路已断，新路从此起", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  god01_guanyin_vase: { title: "净瓶杨柳", text: "女儿国井边，观音的净瓶倒插在土里，瓶口的杨柳已经枯了半边。瓶中水面上浮着一只蚂蚁——它已经在上面走了七圈，找不到岸。这是观音留下的\"试心局\"：救一只蚂蚁，还是等它自己找到岸？",
    region: [9, 9],
    opts: [
      { text: "【渡】折柳为桥——救它上岸", fate: '渡', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":166}}},
      { text: "【衡】守着看——有些岸得自己找", fate: '隐', effect: {"good":5}},
    ]},
  god06_lingji: { title: "灵吉·定风", text: "黄风岭绝顶，灵吉菩萨留下的飞龙杖插在岩缝里，杖头的定风珠黯淡无光。珠内封着黄风怪那一缕\"三昧神风\"的本源，风在珠里转成一只微小的漩涡，不停地撞着珠壁。岩壁上刻着灵吉的跋：\"风不定的，是人心。\"",
    region: [3, 3],
    opts: [
      { text: "【缘】以佛法重燃定风珠——风珠归位，黄风岭永息", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【夺】放出本源之风——为我所用，吹遍西行路", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":42}}},
      { text: "【渡】就地禅定——风由它吹，心由我定", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
    ]},
  god07_zhenyuan: { title: "镇元子·地书", text: "五庄观人参果树根部的泥土下，藏着半卷\"地书\"——镇元子记下的地脉走向。书页是暗金色树皮，字迹被虫蛀得斑驳，但仍能辨认出\"人参果树复活\"那一段。树根处散落着几粒暗金铜锈碎屑，像是被人反复摩挲过。",
    region: [5, 5],
    opts: [
      { text: "【缘】补全地书——地脉完整，五庄观再兴", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【夺】撕走", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":70}}},
      { text: "【衡】抄录一份后归还原处——借而不取", fate: '隐', effect: {"good":5}},
    ]},
  god08_mile: { title: "弥勒·口袋", text: "灵山脚下，弥勒佛的人种袋被随意丢在路边，袋口大敞。袋里传出无数人声——是历朝历代被装进去的取经人的抱怨、祈祷、咒骂。弥勒坐在袋旁，笑而不语，手里还在缝那只漏了针脚的袋口。",
    region: [16, 16],
    opts: [
      { text: "【渡】帮他把袋口缝好——一针一线，都是慈悲", fate: '渡', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【逆】钻进口袋——看看里面到底有什么", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
      { text: "【缘】与弥勒对坐而笑——不必多言，懂的都懂", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  m01_baigu_cave: { title: "白骨洞探秘", text: "白虎岭深处，一座白骨堆叠的洞窟。洞中央立着三具尚未化形的骷髅——是白骨精练\"解尸法\"用的替身。骷髅眼眶里跳动着幽绿的磷火，地上散落着暗金簪环，是她生前收集的\"人间执念\"。",
    region: [5, 5],
    opts: [
      { text: "【战】捣毁替身骷髅——断她一臂", fate: '战', fight: true, reward: {"gold":150,"exp":200,"seal":true,"ti":{"atk":28}}},
      { text: "【渡】超度骷髅亡魂——执念散，妖气消", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】收走暗金簪环——执念之物，或可为用", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  m02_jindou_mountain: { title: "金兜山识破", text: "金兜山金兜洞外，一头青牛正在磨角。它的角上缠着一圈暗金丝线——是太上老君的金刚琢被它偷偷解下，正在一点点吞吃上面的禁制。老君若在此，定会皱眉。",
    region: [12, 12],
    opts: [
      { text: "【战】先下手为强——趁禁制未复，斩了这畜生", fate: '战', fight: true, reward: {"gold":150,"exp":200,"seal":true,"ti":{"atk":256}}},
      { text: "【缘】暗中记下令牌禁制——知己知彼，来日方长", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【逆】放它去天庭——闹得越大，我越有利", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  m03_shituo_council: { title: "狮驼三议", text: "狮驼洞深处，青狮、白象、大鹏三魔正在议事。石桌上摊着一张取经人的画像——画的是你。大鹏金翅雕指着画像说：\"这肉，得趁他没到灵山就吃了。\"桌角放着一盏暗金酒杯，杯中酒已浑浊。",
    region: [13, 13],
    opts: [
      { text: "【隐】潜伏窃听——把三魔的部署听个明白", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
      { text: "【战】冲进去先斩一个——打乱他们的节奏", fate: '战', fight: true, reward: {"gold":150,"exp":200,"seal":true,"ti":{"atk":280}}},
      { text: "【夺】偷走暗金酒杯——议事信物，或可伪造军令", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  m04_spider_silk: { title: "蜘蛛丝怨", text: "盘丝洞外的古树上，缠满了暗金色泽的蛛丝。丝线的另一端正系着七件罗衫——是七个蜘蛛精的\"人皮壳\"。丝线在风中发出细微的嗡鸣，像七个女人的哭声叠在一起。树干刻着一行小字：\"盘丝不盘心。\"",
    region: [10, 10],
    opts: [
      { text: "【渡】以佛法化解蛛丝——盘丝不盘心，正该如此", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【战】焚尽蛛丝——斩草除根", fate: '战', fight: true, reward: {"gold":150,"exp":200,"seal":true,"ti":{"atk":207}}},
      { text: "【夺】抽走暗金蛛丝——织入护甲，刀枪不入", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  m05_huangmei: { title: "黄眉童子", text: "灵山脚下，一个敲磬的童子坐在路边，手里的磬槌已经敲缺了一角。他见你走来，笑道：\"弥勒佛的敲磬童子，也想取一回经。\"他身旁搁着一只暗金口袋——人种袋的仿品，袋口缝着歪歪扭扭的针脚。",
    region: [16, 16],
    opts: [
      { text: "【战】教训这狂妄童子——灵山脚下也敢放肆", fate: '战', fight: true, reward: {"gold":150,"exp":200,"seal":true,"ti":{"atk":357}}},
      { text: "【衡】与他论道——童子的狂，也有道理", fate: '缘', effect: {"good":5}},
      { text: "【逆】帮他改缝人种袋——用得上，就先欠着", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  s01_demonwind: { title: "妖风突袭", text: "黄风岭狭口，一股妖风毫无征兆地卷到面前，砂石打得人睁不开眼。风里有细微的呜咽，像是谁在模仿人哭。",
    region: [3, 3],
    opts: [
      { text: "【战】以棍风劈开妖风——硬闯过去", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":36}}},
      { text: "【隐】蹲低抱柱——等风过去", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
    ]},
  s02_poisonmarsh: { title: "路边毒沼", text: "狮驼国废墟边缘，一滩暗绿色的毒沼挡住了去路。沼面漂着被腐蚀的暗金铜钱，散发着甜腻的腥气。",
    region: [13, 13],
    opts: [
      { text: "【战】踩着残碑跳过去——冒险一搏", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":262}}},
      { text: "【渡】以树枝铺路绕行——稳字当头", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
    ]},
  s03_unknown_bones: { title: "无名尸骨", text: "官道旁散落着一具无主尸骨，身旁放着一只空水囊。骨缝间长出白色小花，散发着淡淡檀香。",
    region: [1, 1],
    opts: [
      { text: "【渡】就地掩埋——让亡者入土", fate: '渡', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":16}}},
      { text: "【隐】取走水囊——空的也聊胜于无", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
    ]},
  s04_night_bell: { title: "夜半更声", text: "车迟国废寺中，子时的更声自己响了起来。钟杵无人自摆，每敲一下，青砖地面就震动一次，震出细密的暗金粉尘。",
    region: [7, 7],
    opts: [
      { text: "【战】按住钟杵——让它别响了", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":100}}},
      { text: "【缘】聆听更声——钟声里有亡僧的遗愿", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  s05_broken_flag: { title: "断旗", text: "火焰山道上插着一面折断的旗，旗面焦黑，暗金字只剩半个\"帅\"字。旗杆是暗金铜铸，被高温熔得扭曲。",
    region: [11, 11],
    opts: [
      { text: "【夺】折下旗杆——熔了能铸件兵器", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":213}}},
      { text: "【衡】扶正断旗——让它立着，算个记号", fate: '隐', effect: {"good":5}},
    ]},
  chain_dragon_02: { title: "南海珞珈", text: "通天河连接南海的水道里，一尊珊瑚雕的龙女像被暗金藤蔓缠住。藤蔓每动一下，龙女像就渗出一粒水珠——是南海龙王被囚禁的一缕神念。水底沉着一块刻着\"南海\"二字的暗金牌位。",
    region: [8, 8],
    opts: [
      { text: "【缘】斩断藤蔓，解放神念——龙族恩怨，不该株连", fate: '缘', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":143}}},
      { text: "【夺】收走暗金牌位——四海组件，其一在此", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  chain_dragon_03: { title: "北海玄冰", text: "狮驼国废墟的地底涌出一股北海寒泉，泉眼处立着一根冰封的龙角——北海龙王当年被妖魔所害，遗蜕化作了寒泉。冰面浮着几片宣纸残页，纸上写满龙族的降表。",
    region: [13, 13],
    opts: [
      { text: "【渡】以佛力化解寒泉——降表是假的，尊严是真的", fate: '渡', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":262}}},
      { text: "【战】击碎冰封——遗蜕之力，不容浪费", fate: '战', effect: {"ti":{"atk":12,"hp":30}}},
    ]},
  chain_dragon_04: { title: "四海龙威", text: "灵山脚下，四块暗金牌位同时发光——四海龙王的神念在此汇聚。小白龙若在场，会听到一个声音：\"四海龙威加身，你不再是脚力，而是龙族太子。\"四色水柱冲天而起，在灵山脚下交织成一枚龙印。",
    region: [16, 16],
    opts: [
      { text: "【缘】引龙印入体——四海归位，龙族再兴", fate: '缘', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【逆】以龙印重塑真身——从今往后，龙族听我的", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  chain_erlang_02: { title: "山门对峙", text: "车迟国废墟，二郎神倚着智渊寺残柱，三尖两刃刀插在青砖缝里。砖缝被刀气劈出暗金裂纹。\"你在五庄观夺东西的样子，有点意思，\"他头也不抬，\"但光敢夺不够，还得夺得下来。\"第三只眼微微睁开。",
    region: [7, 7],
    opts: [
      { text: "【战】拔刀相向——你试试我夺不夺得下", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":120}}},
      { text: "【逆】夺过他的刀——看中的，就该是我的", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  chain_erlang_03: { title: "天眼照心", text: "女儿国边境的井边，二郎神第三只眼彻底睁开，目光如实质扫过你一身劫印。\"善、恶、夺、逆……你走过的路比我想象的脏，\"他顿了顿，\"但脏不怕，怕的是不敢认。\"天眼映出你前世的九种死法。",
    region: [9, 9],
    opts: [
      { text: "【逆】坦然承认——脏也好，净也罢，都是我", fate: '逆', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":166}}},
      { text: "【衡】请他指点——刀法也好，心法也好", fate: '缘', effect: {"good":5}},
    ]},
  chain_erlang_04: { title: "三尖·赠刀", text: "火焰山眼旁，二郎神把三尖两刃刀横在你面前：\"五步试完了。你够格。\"刀身暗金铜锈被他的天眼灼去一层，露出底下赤红的铭文。远处山风穿过空荡荡的花果山，像是谁在叹气。",
    region: [11, 11],
    opts: [
      { text: "【战】接过刀——从此天庭多一个不该有的朋友", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":213}}},
      { text: "【缘】与他结为兄弟——刀是外物，情分是真", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  chain_fox_02: { title: "狐仙报恩", text: "三日后，一只白狐拦住去路。它口吐人言：\"你封我成仙，我欠你一段因果。如今因果到期，我来还。\"白狐张嘴吐出一颗内丹，丹光莹莹，灵力逼人。\"吞了它，你的修为能进一大步。或者——\"白狐顿了顿，\"你帮我一个忙：我有个仇人在前面，帮我传句话。\"",
    opts: [
      { text: "【夺】吞下内丹——狐仙的好意，不收白不收", fate: '夺', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":213}}},
      { text: "【缘】拒绝内丹，帮它传话——因果不是交易", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【逆】吞下内丹，再把白狐收为仆从——仙狐当仆，不亏", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  chain_laojun_02: { title: "炼器·丹火", text: "比丘国废墟的炼丹炉灰中，竟有一粒紫气不散——是老君炉中逸出的丹火。火焰化作模糊的虚影：\"取经人，你的心是凡铁还是精钢？\"虚影抛出一颗未成形的九转胚子。炉壁糊着暗金色炉灰，风一吹飘起细小火星。",
    region: [14, 14],
    opts: [
      { text: "【逆】吞下胚子——管他什么丹，力量就是力量", fate: '逆', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":287}}},
      { text: "【渡】恭敬接过，请求指点——仙丹需炼心，心正丹成", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【衡】以自身气血温养胚子——不急不躁，顺其自然", fate: '隐', effect: {"good":5}},
    ]},
  chain_laojun_03: { title: "炼道·还魂", text: "灵山脚下，老君虚影终于凝实。他摊开掌心，一枚九转还魂丹静静躺着：\"天道不公，老道也未必服。这枚丹，算我欠取经人的。\"丹身缠绕着暗金纹路，纹路与碑林无字碑的刻痕一模一样。",
    region: [16, 16],
    opts: [
      { text: "【缘】接过还魂丹——承情，也承道", fate: '缘', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【逆】连丹带道一起吞——我不需要谁欠我", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  chain_mirror_02: { title: "镜中自我", text: "无影戏台再临。这一次，一个影子脱离了幕布——它不是演你的死，它就是你的一个碎片。影子开口了：\"我是你丢弃的一段因果。你每次做选择，都会丢掉一个可能性。那些被你丢掉的可能性，都活在我身上。\"影子伸出手，\"融合吧。完整的你，才走得完这条路。\"",
    opts: [
      { text: "【渡】接纳影子回归——丢掉的那些路，也是我走过的", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【战】拒绝融合，斩断影子——我不需要被丢掉的那些自己", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【衡】与影子对话——你带来了什么消息？", fate: '隐', effect: {"good":5}},
    ]},
  chain_monk_02: { title: "游僧再临", text: "又遇那个化缘的老僧。这一次他没有锁链——他站在路边，手中捧着一卷经文。\"你上次布施的善缘，我记下了。\"他展开经文，上面写满了名字——都是曾经帮助过他的人。\"这卷经还没写完。你愿意帮我补上最后一段吗？\"经文最后几页是空的，墨迹未干。",
    opts: [
      { text: "【渡】帮他补完经文——善缘当续", fate: '渡', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":337}}},
      { text: "【缘】在经文上留下自己的名字——我也该被记住", fate: '缘', effect: {"good":10,"equip":2}},
      { text: "【夺】夺走经文——这卷经上记着那么多善缘，都是力量", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  chain_nezha_02: { title: "莲花化身", text: "通天河畔，哪吒的残影再次现身——这一次他只有半朵莲花为身。\"我的肉身已毁，只剩这缕残魂。取经人，你若真有逆道之心，便助我重聚三头六臂。\"残影的三头同时开口：\"战、夺、逆，你选哪条路？\"莲花瓣上凝着露水般的灵液，映出你扭曲的倒影。",
    region: [8, 8],
    opts: [
      { text: "【战】以战意灌注残魂——三头六臂，当以战重生", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":143}}},
      { text: "【夺】夺取莲花灵气——我的力量，不需要你的施舍", fate: '夺', effect: {"evil":15,"equip":2}},
      { text: "【逆】融合残魂——你就是我，我就是你", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  chain_nezha_03: { title: "三头斩仙", text: "真假镜廊深处，哪吒残魂终于聚成完整法相——三头六臂，脚踏风火轮。他回头看你：\"兄长，最后一劫我来扛。\"镜廊开始崩塌，无数被天庭镇压的可能性向你涌来。",
    region: [10, 10],
    opts: [
      { text: "【逆】与哪吒并肩——火尖枪·逆贯穿天地", fate: '逆', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":189}}},
      { text: "【缘】替哪吒挡下天劫——兄弟一场，该我还", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  long_redboy_01: { title: "火云胎息", text: "五庄观地底，人参果树残根深处传来一阵胎儿般的心跳——是红孩儿出生前，三昧真火在他母腹中第一次跳动留下的\"胎息\"。胎息凝成一颗赤红的火珠，珠面映出牛魔王与铁扇公主争吵的残影。",
    region: [5, 5],
    opts: [
      { text: "【渡】以佛法安抚胎息——未出生的孩子，不该背负因果", fate: '渡', fight: true, reward: {"gold":150,"exp":200,"seal":true,"ti":{"atk":85}}},
      { text: "【夺】收走火珠——真火本源，炼化于己", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  long_redboy_02: { title: "枯松涧", text: "火云洞外的枯松涧，少年红孩儿正对着一截枯木练习喷火。他的火还不够稳，每次喷完都会咳嗽，咳出的火星落在青苔上，烧出一个个暗金色小洞。他看到你，眼神里有藏不住的恐惧，和压不住的傲。",
    region: [6, 6],
    opts: [
      { text: "【缘】教他控火之法——傲气可用，性命要紧", fate: '缘', fight: true, reward: {"gold":150,"exp":200,"seal":true,"ti":{"atk":115}}},
      { text: "【战】以战意压制——让他知道天外有天", fate: '战', effect: {"ti":{"atk":12,"hp":30}}},
    ]},
  long_redboy_03: { title: "圣婴之缚", text: "车迟国废墟中，红孩儿被三大国师的残余法器\"缚婴索\"缠住了一只手腕。索上刻着暗金咒文，越挣扎勒得越紧。他咬着牙不喊疼，只是看着你，眼里是没有流泪的恨。",
    region: [7, 7],
    opts: [
      { text: "【渡】解开缚婴索——孩子不该被咒文锁住", fate: '渡', fight: true, reward: {"gold":150,"exp":200,"seal":true,"ti":{"atk":85}}},
      { text: "【逆】留下缚婴索——痛是力量，恨是铠甲", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  long_redboy_04: { title: "莲花化身（红孩儿）", text: "通天河畔，红孩儿站在水边，望着自己的倒影。倒影里是一尊莲花化身的佛像。\"观音说，我该做善财童子，\"他低声说，\"可我连自己是谁都没弄清楚。\"水面漂着一片莲花瓣，瓣上凝着露水般的灵液。",
    region: [8, 8],
    opts: [
      { text: "【缘】让他自己选——童子的路，由童子走", fate: '缘', fight: true, reward: {"gold":150,"exp":200,"seal":true,"ti":{"atk":85}}},
      { text: "【夺】以火珠重塑其骨——不做童子，做你的助力", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  long_redboy_05: { title: "第 20 难 · 红孩儿（隐藏分支）", text: "号山火云洞，最终对峙。红孩儿端坐莲台，三昧真火焚天。但此刻他看着你，眼神复杂——你们之间已经走过了五段因果。莲花瓣在他身后缓缓旋转。",
    region: [9, 9],
    opts: [
      { text: "【渡】以善念化解——观音降临，收为善财童子（常规结局）", fate: '渡', fight: true, reward: {"ti":{"atk":183}}},
      { text: "【逆】引火烧身，与红孩儿同堕——逆道童子，从此同行（隐藏职触发）", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
      { text: "【战】正面强攻——火云洞，打到底", fate: '战', effect: {"ti":{"atk":12,"hp":30}}},
    ]},

  r02b_liangjie_elder: { title: "两界引者", text: "两界山口，一位耳垂垂到肩头的瞎眼老者拄杖而立——是此方土地的山神。他不用看也知你来：\"五行山压了那只猴子五百年，如今他去取经了。你呢，去西天，还是来填那座山？\"",
    region: [2, 2],
    opts: [
      { text: "【战】替老者平去山道暗碴——前人踩过的坑，我来填", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":27}}},
      { text: "【渡】指点老者避祸之法，不必以命相搏", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【缘】接过老者杖同行，听他讲五百年前的雷音", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  r02c_wuzhuang_letter: { title: "故人托书", text: "山道旁发现一封未寄出的信，落款是\"镇元子亲启\"——五庄观故人托路过者捎信。信纸被雨水泡软，字迹却还认得：\"人参果树已成，等一个取经人。\"",
    region: [2, 2],
    opts: [
      { text: "【战】护信杀出拦路山贼——信比命要紧", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":27}}},
      { text: "【渡】替故人补全信末未写完的偈", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【隐】将信原样埋回土中——信本就该等该等的人", fate: '隐', effect: {"good":5}},
    ]},
  r15b_bujin_bell: { title: "布金孤钟", text: "舍卫国布金禅寺已空，只余一口孤钟悬在断梁。钟身刻满布施者名，最后一个名字被指甲反复划过——是当年给孤独长者。钟不敲自鸣，声里是\"祇树给孤独\"的残偈。",
    region: [15, 15],
    opts: [
      { text: "【战】以棍风震落钟上尘封妖气——钟里封着偷听佛法的鼠精", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":312}}},
      { text: "【渡】诵偈补全布施偈，让钟声归位", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【缘】以愿力为钟续绳，让它再挂五百年", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  r15c_yutu_moon: { title: "月宫残桂", text: "天竺城外桂树忽然开花——是月宫的桂，玉兔逃下凡时捎来的。花落满地，每一朵都映着广寒宫的清冷。当地人说，谁拾满一篮桂，便能听见嫦娥的旧诺。",
    region: [15, 15],
    opts: [
      { text: "【夺】夺桂炼月华丹——桂即月精，炼了能增修为", fate: '夺', effect: {"evil":15,"equip":2}},
      { text: "【渡】将桂送回月宫方向，遥祭玉兔", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【隐】只拾一朵簪在帽檐——不炼不送，留个念想", fate: '隐', effect: {"good":5}},
    ]},
  r15d_tianzhu_plague: { title: "天竺疫市", text: "天竺集市突发疫病，百姓倒了一片。郎中说症状是\"中了妖气\"，却指不出哪路妖。药铺老板偷偷塞给你一包香灰：\"这是大雷音寺求来的，灵。\"",
    region: [15, 15],
    opts: [
      { text: "【战】以棍风驱散市集上空盘踞的疫气妖云", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":312}}},
      { text: "【渡】以愿力为病患筑庇护结界", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【逆】夺过药铺老板的灵灰——你认出那是骨灰，所谓灵验是吃人", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  r15e_false_sutra: { title: "伪经摊", text: "灵山脚下半里，一个瞎眼摊贩在卖\"真经\"——其实是抄错的残卷，错字连篇却被人抢购。摊贩笑：\"真的谁看得懂？错的才好卖。\"",
    region: [15, 15],
    opts: [
      { text: "【逆】揭穿摊贩，烧了残经——假的混真，乱的是道", fate: '逆', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":312}}},
      { text: "【渡】逐字批注残经，让它至少不害人", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【缘】买下残经留给后来者当警醒", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  r15f_leiyin_echo: { title: "伪佛回声", text: "大雷音寺外的山道上，常有\"佛号\"回响，循声走去却只是空谷。老僧说，那是未入门者心里的回声——你听见了，是你自己想听。",
    region: [15, 15],
    opts: [
      { text: "【战】以棍风劈开回响谷，让回声现形——谷中藏着偷佛号的山魈", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":312}}},
      { text: "【渡】就地禅定，任回声自散", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【隐】不理回声，只记下山道走向", fate: '隐', effect: {"good":5}},
    ]},
  r15g_yutu_kin: { title: "玉兔故巢", text: "天竺国后园假山后有一处暗洞，洞壁刻满爪痕——是玉兔精变作公主前藏身的地洞。洞底压着半块月牙形的玉，是她掉落的信物。",
    region: [15, 15],
    opts: [
      { text: "【夺】夺玉炼月华——玉含月精，炼了通灵", fate: '夺', effect: {"evil":15,"equip":2}},
      { text: "【渡】将玉送还月宫方向，了玉兔一桩执念", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【战】以棍风探洞，惊走洞里寄生的地狼", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":312}}},
    ]},
  r01c_baqiao_bone: { title: "灞桥骨柳", text: "大唐边境的灞桥，柳枝不是柳枝——每一条都系着一截指骨。送行的人折柳赠别，折了百年，柳根下埋满了未归人的手。桥头老妪在卖平安符，符纸用的全是往年的旧路引，墨迹里的地名早已改了朝。",
    region: [1, 1],
    opts: [
      { text: "【战】斩断骨柳，让桥下白骨见天日", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":16}}},
      { text: "【渡】替老妪重抄百张新路引，让她不必再折柳", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【缘】买下一张平安符——明知是假的，也买个心安", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  r02d_wuxing_chain: { title: "五行断链", text: "两界山深处，当年压猴王的五行山遗迹还在——山体上嵌着半截崩断的铁链，链头深深长进石里，像一条被斩断的蛇。链环上刻着六字真言，最后一个字被人磨平了。山风过处，铁链发出极轻的、像是磨牙的声响。",
    region: [2, 2],
    opts: [
      { text: "【战】一棍砸断铁链——这山，再压不住人", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":27}}},
      { text: "【隐】不动铁链，只把磨平的那个字重新刻回去", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
      { text: "【逆】撬下一段铁链缠在腕上——压迫本身也是力量", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  r04c_liusha_skull: { title: "骷髅项链", text: "流沙河水浅处露出一片沙洲，沙里埋着九颗取经人的头骨——颗颗都被穿了孔，用一根暗金色的绳串着，像是谁戴过的项链。第八颗的额上刻着一个「沙」字，刻痕很新，边缘还挂着未干的丝。河水涨落，项链在沙里一鼓一鼓，像还在呼吸。",
    region: [4, 4],
    opts: [
      { text: "【战】扯断项链，让九颗头骨各自入土", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":58}}},
      { text: "【渡】就地掩埋，念一段往生咒", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】取走项链——九个取经人的执念，是现成的法器", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  r04d_ruoshui_bridge: { title: "弱水独木", text: "流沙河有一段水域，鹅毛浮不起，芦花定底沉——是弱水。河上架着一根独木，木面光滑得反常，像是被无数人踩过又擦净。对岸插着一块木牌，写着「回头是岸」；牌子的背面，刻着另外四个字：「上岸者死」。",
    region: [4, 4],
    opts: [
      { text: "【战】踏木强渡——看这弱水能奈我何", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":58}}},
      { text: "【隐】绕道上流浅滩，不与弱水争锋", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
      { text: "【缘】在木牌背面添一笔——给后来者留个准信", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  r06c_huoyun_cart: { title: "火云童车", text: "火云洞外的山道上，停着一辆烧得只剩骨架的小车——是红孩儿变作孩童时骗人用的那辆。车辕上还挂着半截红绫，绫上绣的不是花纹，是一串名字，都是被他骗上车的取经人。风一吹，红绫猎猎，像在点数。",
    region: [6, 6],
    opts: [
      { text: "【战】一把火烧了这辆车，连红绫一起", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":85}}},
      { text: "【渡】记下红绫上的名字，带出去交给他们的家人", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】撕下红绫缠在臂上——三昧真火的余威，能护身", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  r06d_sanmei_ember: { title: "三昧余烬", text: "火云洞深处，三昧真火烧过的岩壁结了一层琉璃状的壳，敲一下便掉下细灰。灰里有细小的红点，遇风就自燃。老妖说这是「火种」，攒够一钵能重燃洞府。你蹲下细看——那些红点在动，它们不是在烧，是在往你的影子里爬。",
    region: [6, 6],
    opts: [
      { text: "【战】以棍风震落整片琉璃壳，断绝火种", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":115}}},
      { text: "【隐】撮一把灰收进囊中，先看看它要爬去哪", fate: '隐', effect: {"ti":{"dr":0.03},"material":"本命觉醒素材"}},
      { text: "【夺】任其附身，以血肉养这火种", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  r17b_lingyun_oar: { title: "无底船上的人", text: "凌云渡的无底船又来了，船上却站着一个和你一模一样的人。他不说话，只是把桨递给你。接引佛祖站在岸边，笑而不语。河面上浮着无数张脸，都是从前没有接桨的人。",
    region: [17, 17],
    opts: [
      { text: "【战】一棍劈碎那只船——我不渡我自己", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":363}}},
      { text: "【渡】接过桨，替他划完这一程", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【逆】把桨扔回河里——谁爱渡谁渡", fate: '逆', effect: {"evil":20,"ti":{"atk":15}}},
    ]},
  r17c_lingyun_mirror: { title: "脱胎前的最后一瞥", text: "凌云渡口立着一面水镜，据说脱凡胎前能照见本来面目。你凑近，镜中却不是你——是一具躺在水底的尸首，穿着你的衣裳，脸上很安详。水面下伸出一只手，轻轻按住镜面：别看了，上去，就不是你了。",
    region: [17, 17],
    opts: [
      { text: "【战】击碎水镜——我不需要谁来定义我是谁", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":363}}},
      { text: "【隐】不照，径直上船", fate: '隐', effect: {"good":5}},
      { text: "【缘】向水中那具尸首合十一礼", fate: '缘', effect: {"good":10,"equip":2}},
    ]},
  r10c_liuer_ear: { title: "六耳遗响", text: "真假猴王一役早了，可山野间仍有一只猴子的哭声，夜夜不绝。循声寻去，只见一棵枯树上钉着一截被割下的耳朵——是六耳猕猴的。耳朵还在动，还在听；它听见的每一句话，都从断口漏出来，变成风里的回响，一遍遍重复你当年说过的谎。",
    region: [10, 10],
    opts: [
      { text: "【战】以棍风震碎这只耳朵——死了还听，吵", fate: '战', fight: true, reward: {"gold":40,"exp":60,"seal":true,"ti":{"atk":189}}},
      { text: "【渡】替它诵一段往生咒，让它不必再听", fate: '渡', effect: {"good":15,"yuan":{"mdef":0.03}}},
      { text: "【夺】拾起耳朵挂在颈上——六耳善听，是天生的利器", fate: '夺', effect: {"evil":15,"equip":2}},
    ]},
  // V8.58 地区专属事件：提高地区辨识度，减少通用池占比
  // 两界山（地区2）专属事件
  liangjie_stone: {
    title: "两界山界碑",
    text: "山脚下一块界碑裂成两半，一半刻大唐，一半刻鞑靼。碑下压着一只五指山的石猴残影，它见你便笑：你也走到这儿了？我当年被压在山下，想的是什么时候能出去；你现在出了大唐，想的是什么时候能回来。出去和回来，哪个更难？山风过处，界碑上的字忽然都活了，像无数只眼睛盯着你。",
    region: [2, 2],
    opts: [
      { text: "【战】砸碎石猴残影——过去的事，不该挡路", fight: true, reward: { ti: { atk: 20 }, material: "两界山石" }, fate: "战" },
      { text: "【渡】替石猴念一段往生咒——它等了五百年，该解脱了", effect: { good: 20, yuan: { matk: 10 } }, fate: "渡" },
      { text: "【隐】摸一摸界碑，把大唐二字记在心里——不忘来路，方知归途", effect: { ti: { hp: 80, dr: 0.03 } }, fate: "隐" },
    ]},
  // 黄风岭（地区3）专属事件
  huangfeng_cave: {
    title: "黄风洞风眼",
    text: "洞中一道风眼旋转不息，风里夹杂着无数失忆的亡魂——它们都是被黄风怪的三昧神风刮走了记忆的人。风眼里有个声音在喊：别进来！这风不伤人，只伤你是谁。你看见风眼中央有一面破镜，镜里映出的不是你，而是一个你不认识的人——那是你失去的某段记忆。",
    region: [3, 3],
    opts: [
      { text: "【战】以定力破风眼——我是谁，我自己说了算", fight: true, reward: { ti: { atk: 25 }, material: "三昧风晶" }, fate: "战" },
      { text: "【渡】替风里的亡魂念诵佛号——让它们记起自己是谁", effect: { good: 25, yuan: { mdef: 0.05 } }, fate: "渡" },
      { text: "【夺】取走风眼中央的破镜——虽然照不出自己，但能照出敌人的弱点", effect: { evil: 15, equip: 2, slot: "treasure" }, fate: "夺" },
    ]},
  // 火焰山（地区11）专属事件
  huoyan_iron: {
    title: "火焰山铁扇",
    text: "山脚下一座废弃的铁扇庙，庙中供着一把生锈的铁扇。扇面上刻着一行小字：一扇息火，二扇生风，三扇下雨。可你拿起扇子，扇骨里传出一个女人的哭声：这扇子，原本是用来给我丈夫扇凉的。他嫌我丑，嫌我老，嫌我是个妖。他娶了玉面狐狸，把我和这把扇子一起丢在这火焰山里。扇骨里的哭声越来越大，火焰山的火也越来越旺——原来这山的火，是她五百年的怨气。",
    region: [11, 11],
    opts: [
      { text: "【战】砸烂铁扇——怨气不散，留着也是祸", fight: true, reward: { ti: { atk: 30 }, material: "铁扇骨" }, fate: "战" },
      { text: "【渡】替她扇三下——一扇息怨，二扇释怀，三扇往生", effect: { good: 30, yuan: { matk: 15 } }, fate: "渡" },
      { text: "【夺】收走铁扇——这扇子能熄火，过了这山还用得上", effect: { evil: 20, equip: 2, slot: "treasure" }, fate: "夺" },
    ]},
  // 狮驼岭（地区13）专属事件
  shituo_bone: {
    title: "狮驼岭骨山",
    text: "岭上一座白骨堆成的山，山顶插着一面旗，旗上写着小钻风巡山处。骨山里有个小妖的残魂在哭：我是小钻风，我大王是青毛狮子，二大王是白象，三大王是大鹏金翅雕。我们吃了一城的人，骨头堆成这山。可我到死都不明白——我们吃了那么多人，为什么还是觉得饿？骨山忽然震动，无数骨头自己拼成人形，朝你走来——它们都是被吃的人，死了还在问：为什么是我？",
    region: [13, 13],
    opts: [
      { text: "【战】打散骨山——死人的怨气，不该留在阳间", fight: true, reward: { ti: { atk: 35, hp: 100 }, material: "狮驼骨" }, fate: "战" },
      { text: "【渡】替满城亡魂超度——它们等了五百年，该安息了", effect: { good: 35, yuan: { matk: 20, mdef: 0.05 } }, fate: "渡" },
      { text: "【隐】绕开骨山——死人的事，活人管不了，也不该管", effect: { ti: { eva: 0.05, dr: 0.03 } }, fate: "隐" },
    ]},
  // 天竺（地区15）专属事件
  tianzhu_moon: {
    title: "天竺月宫影",
    text: "天竺国御花园里，一口古井直通月宫。井边有个宫女在哭，她说：我是素娥仙子的转世。三百年前，我在广寒宫打了玉兔一掌，因为它挡了我的路。如今我转世成天竺公主，它下界来寻仇。可它见了我，忽然下不了手——它说，我打它那一掌，是它三百年里唯一被人看见的时刻。井里忽然升起一道月光，月光里有只玉兔在捣药，捣的不是药，是它三百年的孤独。",
    region: [15, 15],
    opts: [
      { text: "【战】打散月光——前世的恩怨，不该带到今生", fight: true, reward: { ti: { atk: 30 }, material: "月华石" }, fate: "战" },
      { text: "【渡】替素娥和玉兔解怨——三百年了，该放下了", effect: { good: 30, yuan: { matk: 15 } }, fate: "渡" },
      { text: "【缘】与玉兔结缘——它的孤独，和你的西行路，倒是相似", effect: { good: 15, equip: 2, slot: "pet" }, fate: "缘" },
    ]},
  // V8.58 英雄/道途专属事件：激活过滤维度，提高内容区分度
  // 唐僧专属事件（hero: ['tangseng']）
  tangseng_sutra: {
    title: "金蝉残经",
    text: "路边一座破庙，庙中供着一卷残缺的经书。你拿起经书，发现经书上的字竟然是你自己前世在灵山抄的——那时候你还叫金蝉子，还没有被贬轮回。经书最后一页写着一行小字：若有来世，莫要再质疑如来之法。你忽然想起，自己被贬的原因，正是在灵山法会上质疑了如来的讲法。这卷经书，是你前世留给自己的警告，还是留给自己的勇气？",
    hero: ["tangseng"],
    opts: [
      { text: "【渡】抄完残经——前世的警告，我听到了，但我还是要走自己的路", effect: { good: 25, yuan: { matk: 15 } }, fate: "渡" },
      { text: "【逆】烧掉残经——前世的金蝉子已经死了，现在的我，是唐僧", effect: { evil: 15, ti: { atk: 20 } }, fate: "逆" },
      { text: "【缘】把残经收进行囊——前世的字，今生的路，都是我的", effect: { good: 10, equip: 2, slot: "treasure" }, fate: "缘" },
    ]},
  // 孙悟空专属事件（hero: ['wukong']）
  wukong_crown: {
    title: "紧箍旧痕",
    text: "山头上一块石头，石头上有一个圆形的凹槽，大小正好和你头上的紧箍一样。你摸了摸头上的紧箍，忽然想起五百年前，观音菩萨把这紧箍戴在你头上时说的话：这箍儿，不是为了约束你，是为了保护你——你这猴头，性子太烈，不约束着，迟早要闯大祸。你摘下紧箍，放进石头上的凹槽里——大小正好，像是为你量身定做的。你忽然明白，这凹槽，是你自己五百年前在五行山下刻的。那时候你想的是：总有一天，我要把这箍儿摘下来，放在这儿，告诉所有人，我孙悟空，不受约束。",
    hero: ["wukong"],
    opts: [
      { text: "【战】砸碎石头——五百年了，我还是我，不受任何人约束", fight: true, reward: { ti: { atk: 30 }, material: "五行山石" }, fate: "战" },
      { text: "【渡】把紧箍放回头上——约束不是束缚，是我自己选的路", effect: { good: 20, yuan: { mdef: 0.05 } }, fate: "渡" },
      { text: "【隐】把紧箍留在凹槽里——今天，我想做一会儿没有紧箍的孙悟空", effect: { ti: { eva: 0.08, hp: 100 } }, fate: "隐" },
    ]},
  // 渡道专属事件（dao: ['渡']）
  dao_ferry: {
    title: "渡人渡己",
    text: "河边一个老艄公在等客，他见你便说：施主，我这船，渡人不渡己。我渡了一辈子人，自己却从没到过对岸。你问他为什么，他说：我年轻时，妻子在对岸病死了。我赶过去时，她已经凉了。我发誓，这辈子要渡所有人过河，不让任何人像我一样，赶不上最后一面。他笑了笑：可我渡了一辈子人，自己还是没过去——我怕过去之后，看见她在等我，我会舍不得回来。河对岸，似乎有个女人的身影在等。",
    dao: ["渡"],
    opts: [
      { text: "【渡】替老艄公撑一次船——你渡了一辈子人，今天让我渡你一次", effect: { good: 30, yuan: { matk: 20 } }, fate: "渡" },
      { text: "【缘】陪老艄公坐一会儿——有些人，不需要到对岸，守着河，也是一种圆满", effect: { good: 15, ti: { hp: 120 } }, fate: "缘" },
      { text: "【战】把老艄公打晕，扛他过河——有些事，不需要他同意，他需要的是被推一把", fight: true, reward: { good: 10, ti: { atk: 15 } }, fate: "战" },
    ]},
  // 夺道专属事件（dao: ['夺']）· 黑风山夺袈裟 —— T0 天花板夺宝战，奖励为可隐藏升级的至宝
  dao_duo_nishang: {
    title: "黑风山·袷裟失窃",
    text: "黑风山黑熊精把那件袷裟窃了，不为穿，为了开一场佛衣会。你潜进洞里，看见它正对着水面比划，把袷裟披在身上转了个身——它一辈子没穿过一件像样的衣裳。你看着它那副认真的样子，手指僆了一下。",
    dao: ["夺"],
    region: [1, 4],
    opts: [
      { text: "【夺】乘它转身时把袷裟抽出来——这是它唯一一件体面东西，你要拿，就得先过它这关", fight: true, duo: "T0", bossDiff: 1.55, treasure: "tre_nishang", reward: { ti: { atk: 12 }, evil: 12 }, fate: "夺" },
      { text: "【战】明火执仗打上黑风山——偷衣之赌，当面讨", fight: true, reward: { ti: { atk: 18 }, good: 6 }, fate: "战" },
      { text: "【渡】随观音设局，收它为守山大神——它只是想体面地站一回", effect: { good: 22, yuan: { mdef: 0.05 } }, fate: "渡" },
    ]},
  // 战道专属事件（dao: ['战']）
  dao_battle: {
    title: "战魂不灭",
    text: "古战场上，无数兵器插在地上，像一片钢铁的森林。你走近，听见兵器里有无数战魂在呐喊——它们都是战死在这里的士兵，死了还在喊杀。你捡起一把生锈的刀，刀里有个战魂对你说：我死了三百年，还在等一个能接住我这把刀的人。你要是够强，就把我带走，让我再杀一场。你握紧刀，刀里的战魂忽然安静了——它感觉到，你身上的杀气，比它三百年杀的人还重。",
    dao: ["战"],
    opts: [
      { text: "【战】拔刀——三百年没杀过人了？今天让你杀个痛快", fight: true, reward: { ti: { atk: 35 }, material: "战魂刀" }, fate: "战" },
      { text: "【渡】超度战魂——杀了三百年，该歇歇了", effect: { good: 25, yuan: { mdef: 0.05 } }, fate: "渡" },
      { text: "【夺】收走所有兵器——这些战魂，都是我的兵器", effect: { evil: 20, equip: 2 }, fate: "夺" },
    ]},
};

// 岔路问号（标记影响后续掉落，demo 简化为即时增益）
// effect 按 体(ti) / 愿(yuan) 双体系切割；mark 用于结算结局倾向
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
