// =============================================================
// events_part1.js - 事件系统（第一部分：事件库EVENTS）
// 从 events.js 拆分，第1-1248行
// 外部接口 NDX.* 保持不变，调用方无需修改
// 拆分日期: 2026-09-14
// =============================================================

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
