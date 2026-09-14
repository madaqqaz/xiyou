// =============================================================
// data_treasure_evo.js — 夺道至宝池 + 隐藏升级链
// 设计定调（2026-09-12 六道整体平衡）：
//   ① 夺 = 少而难。真夺必须开战，难度为同期战力天花板（T0 1.55~1.65 / T1 1.40~1.50）。
//   ② 夺 = 奖励最高。T0 至宝可「隐藏升级」——同一件宝，看你以哪条道去浇灌它，
//      长成两件截然不同的特殊装备（顺命线：渡/缘；逆命线：逆/夺）。
//      佛法口径：器无善恶，用者分途——金刚琢套尽神兵是凶器，拿来套天庭的锁就是解脱。
//   ③ 升级不是自动白给：需持宝 + 对应道累计达标（门槛写死在 evo.need 里），
//      由 NDX.tryEvolveTreasures 在每次劫难结算后检查。
// =============================================================
(function () {
  const NDX = window.NDX;

  // ---- 至宝基座：T1（稀有，无升级链）----
  // 数值 rationale：atk = 12 + 章*1.6，hp = 40 + 章*8，dr = 0.04 + 章*0.002
  // 章 = ceil(难号/5)，保证同期夺宝战打完拿到的东西对得起 ×1.4+ 的难度。
  const T1 = [
    ['tre_fengdai', '风袋', 12, '黄风怪张口成风的本钱——袋口一松，三昧神风还在里头打转。'],
    ['tre_dingfengzhu', '定风珠', 13, '风眼里凝了千年的那一粒静。持之，风不能动你分毫。'],
    // 【2026-09-13 PHASE 4】补齐 T1 池缺口：第 15 难「云栈洞·收八戒」与第 22 难（ch2 章末·白骨夫人）
    //   此前 T1 池无 15/22 号条目，而这两难现均有真夺抉择；「真夺必须绑定至宝」是 §夺道硬契约。
    ['tre_jiuchidingpa', '九齿钉钯', 15, '天蓬被贬时唯一带下界的东西。钯齿缝里嵌着天河的水锈——他拿它筑过田，也拿它吃过人。'],
    ['tre_baozhang', '降妖宝杖', 18, '鲁班亲手所制，梭罗木心，外裹金片。沙僧在流沙河用它捅过九个人的喉咙。'],
    ['tre_zhinian', '骨中执念', 22, '她演了女儿、老妇、老翁三张脸。第三张落下时，你从骨缝里拾出这颗珠子——不是魂，是三张卸下来的脸。'],
    ['tre_yemingzhu', '颔下夜明珠', 26, '龙之根本。鼍龙被贬就因这颗珠不够"纯"——它亮，但不是他们要的那种亮。'],
    ['tre_jinshen', '灵感庙金身', 33, '千年香火凝成的一层壳。砸了它，镀的金屑够做半副护心镜。'],
    ['tre_ruyigou', '如意钩', 38, '如意真仙守泉的钩。钩的是水，也是他兄长牛魔王那点可怜的面子。'],
    ['tre_suixinbing', '随心铁杆兵', 45, '与金箍棒同炉、同重、同长。六耳拿着它，世上就再没有"假的"这回事。'],
    ['tre_bajiaoshan_ying', '芭蕉扇·影', 46, '逼出来的那一把。扇面是假的，扇出来的火却是真的——它骗过你一次。'],
    ['tre_foguang', '塔顶佛光', 51, '金光寺塔顶三年不亮的那点光。寺里僧人替它坐了三年的牢。'],
    ['tre_lingzhi', '九叶灵芝草', 52, '万圣公主拿命偷来的续命草。九头虫的命还吊在这九片叶子上。'],
    ['tre_yueyachan', '月牙铲', 54, '九头虫九首各衔一兵，这是最沉的一柄。铲刃上还挂着碧波潭的泥。'],
    ['tre_muxin', '千年木心', 55, '树精谈了一夜诗，谈出来的那点东西。砍了它，就再没人和你论过风月。'],
    ['tre_tidao', '剃度刀', 60, '灭法国王的刀。他要剃一万个和尚的头，你先剃了他的王法。'],
    ['tre_yufu', '雨符', 62, '天庭布雨的批文。凤仙郡旱三年，就是这张纸没签。'],
    ['tre_xijiaodeng', '犀角灯', 65, '三支犀角点的灯。人跪的不是佛，是这三支角烧出来的那点光。'],
    ['tre_daoyaochu', '捣药杵', 70, '玉兔在广寒宫捣了三百年的杵。她下界不为吃你，只为被人娶一次。'],
    ['tre_daoyaochu_yue', '捣药杵·月华', 72, '杵上凝了天竺那晚的霜。她说：你打碎了那张脸，正好。'],
  ];

  // ---- T0 至宝：原著根本法宝，夺之则妖失其依 ----
  // 每条含两条升级支线：顺命（渡/缘）与逆命（逆/夺），长出不同特殊装备。
  const T0 = [
    {
      id: 'tre_nishang', name: '锦襕袈裟·夺', trial: 6,
      desc: '如来赐的那件。黑熊精偷它，不为成佛，只为"也想有件像样的衣裳"——你从它怀里把这件衣裳抽了回来。',
      evo: [
        { need: { dao: '渡', n: 5 }, id: 'tre_nishang_du', name: '锦襕袈裟·分衣', hint: '以渡道浇灌五回——你替它做了一件，它就不用再偷了',
          desc: '衣能分人。【锦襕袈裟·分衣】每场战斗后回血+140、御念+14%；每通过一劫，为随行灵兽织一件（灵兽全属性+6%）。' },
        { need: { dao: '逆', n: 5 }, id: 'tre_nishang_ni', name: '锦襕袈裟·窃火', hint: '以逆道浇灌五回——观音院那把火没烧完，你把剩下的火气全披在身上',
          desc: '窃火自燃。【锦襕袈裟·窃火】反伤+16%、攻击附带目标当前气血 5% 的灼烧；受击时反弹本次伤害的 12%。' },
      ],
    },
    {
      id: 'tre_dingfengdan', name: '定风丹', trial: 11,
      desc: '灵吉镇黄风怪的那粒丹。风是它吹的，定风丹是别人替它准备的枷锁。',
      evo: [
        { need: { dao: '渡', n: 4 }, id: 'tre_dingfengdan_du', name: '定风丹·静', hint: '以渡道浇灌四回，丹中生静——风止，人心亦止',
          desc: '风停在丹里，也停在持丹人心里。【定风丹·静】每场战斗首次受击免伤 25%，且不受任何"开场气势"削减。' },
        { need: { dao: '隐', n: 4 }, id: 'tre_dingfengdan_yin', name: '定风丹·不动', hint: '以隐道浇灌四回，丹凝不动——你不动，风便无处着力',
          desc: '不动明王之相。【定风丹·不动】闪避+10%，且敌方每次攻击有概率（随闪避提高）完全落空。' },
      ],
    },
    {
      id: 'tre_renshenguo', name: '人参果', trial: 19,
      desc: '三千年一开花，三千年一结果，三千年一熟。闻一闻活三百六十岁，吃一个活四万七千年。',
      evo: [
        { need: { dao: '缘', n: 4 }, id: 'tre_renshenguo_yuan', name: '人参果树·移栽', hint: '以缘道浇灌四回，果核在你钵里发了芽——它结果的次数，从今往后由你定',
          desc: '果核已成树。【人参果树·移栽】每场战斗后回血+120，且每通过一劫额外结一果（回血递增）。' },
        { need: { dao: '夺', n: 3 }, id: 'tre_renshenguo_duo', name: '人参果·窃', hint: '以夺道再取三宝，你成了第二个镇元子——只是这回，果子不分给佛门',
          desc: '三千年一果，凭什么只许佛门吃。【人参果·窃】气血上限+15%，每场战斗开局吞一果：本场攻速与攻击+12%。' },
      ],
    },
    {
      id: 'tre_jingu', name: '紧箍', trial: 21,
      desc: '如来给观音的三件东西之一。戴上了，念咒的人疼，戴的人更疼。',
      evo: [
        { need: { dao: '渡', n: 5 }, id: 'tre_jingu_du', name: '紧箍·自渡', hint: '以渡道浇灌五回——你没有戴它，你把它戴回了自己心上',
          desc: '箍己不箍人。【紧箍·自渡】御念+12%、每场战斗后回血+80；此后队伍中无人再受"禁锢"类负面。' },
        { need: { dao: '逆', n: 5 }, id: 'tre_jingu_ni', name: '紧箍·碎', hint: '以逆道浇灌五回——你把它捏碎了，碎片比箍住人时更利',
          desc: '碎箍不弃，磨成了刃。【紧箍·碎】攻击+（已历劫数×2）、暴击+8%；恶业每 20 点再+3% 暴击。' },
      ],
    },
    {
      id: 'tre_hulu', name: '紫金红葫芦', trial: 24,
      desc: '老君装丹的葫芦。叫一声名字，应了，就进去；不应，也进去。',
      evo: [
        { need: { dao: '战', n: 5 }, id: 'tre_hulu_zhan', name: '葫芦·装兵', hint: '以战道浇灌五回——它装过天兵、装过神仙，如今装的是你打碎的东西',
          desc: '装尽神兵。【葫芦·装兵】战斗开局削敌 12% 当前气血，且无视其 15% 减伤。' },
        { need: { dao: '逆', n: 5 }, id: 'tre_hulu_ni', name: '葫芦·装天', hint: '以逆道浇灌五回——你说：天也应一声名字试试',
          desc: '应了就进去。【葫芦·装天】敌方每 3 回合损失 6% 最大气血；若其为"神/佛"系，效果翻倍。' },
      ],
    },
    {
      id: 'tre_sanmei', name: '三昧真火', trial: 27,
      desc: '红孩儿在火焰山修了三百年，修出来的一口火。它烧的不是柴，是心。',
      evo: [
        { need: { dao: '渡', n: 5 }, id: 'tre_sanmei_du', name: '三昧·心灯', hint: '以渡道浇灌五回，火从口里移到了灯里——它不再烧人，它照路',
          desc: '心灯长明。【三昧·心灯】法攻+（层×4）、每场战斗后回血+90；对"妖"系敌人伤害+15%。' },
        { need: { dao: '逆', n: 5 }, id: 'tre_sanmei_ni', name: '三昧·逆火', hint: '以逆道浇灌五回——你说：童子不做了，这口火，你自己收着',
          desc: '逆烧向雷音。【三昧·逆火】攻击附带目标最大气血 4% 的真实灼烧；每次暴击叠一层，上限 5 层。' },
      ],
    },
    {
      id: 'tre_jingangzhuo', name: '金刚琢', trial: 35,
      desc: '老君过函谷关化胡为佛的镯子。套尽神兵，水火不侵——它本是用来"度人"的。',
      evo: [
        { need: { dao: '渡', n: 6 }, id: 'tre_jingangzhuo_du', name: '金刚琢·还器', hint: '以渡道浇灌六回——套来的神兵，你一件件还了回去',
          desc: '套而不取。【金刚琢·还器】减伤+12%、反伤+10%；每受击 5 次，本场减伤再+4%（可叠）。' },
        { need: { dao: '逆', n: 6 }, id: 'tre_jingangzhuo_ni', name: '金刚琢·反套', hint: '以逆道浇灌六回——它套过十万天兵，如今该套一回天庭',
          desc: '反套其主。【金刚琢·反套】无视护甲+18%、攻击+（已夺至宝数×12）；对"神/佛"系敌人伤害+25%。' },
      ],
    },
    {
      id: 'tre_daomadu', name: '倒马毒桩', trial: 40,
      desc: '蝎子精尾巴上那根。如来被它蜇过，疼得抬不起手——佛也会疼，这就是它的道理。',
      evo: [
        { need: { dao: '渡', n: 5 }, id: 'tre_daomadu_du', name: '倒马毒·止痛', hint: '以渡道浇灌五回——你说：这一针，我不蜇人，我止痛',
          desc: '以毒攻毒。【倒马毒·止痛】每场战斗首次受致命伤时免疫一次并回血 20%；此后每场首次攻击附带破防。' },
        { need: { dao: '逆', n: 5 }, id: 'tre_daomadu_ni', name: '倒马毒·弑佛', hint: '以逆道浇灌五回——你记着雷音寺推她那一把，替她记着',
          desc: '蜇过如来，便再蜇一次。【倒马毒·弑佛】攻击附带破防（无视 30% 减伤）；对"佛"系敌人暴击+20%。' },
      ],
    },
    {
      id: 'tre_bajiaoshan', name: '芭蕉扇', trial: 49,
      desc: '昆仑山后混沌开辟以来，天地间自然产生的一个灵宝。一扇熄火，二扇生风，三扇下雨。',
      evo: [
        { need: { dao: '渡', n: 6 }, id: 'tre_bajiaoshan_du', name: '芭蕉扇·灭火', hint: '以渡道浇灌六回——你扇灭的不只是火焰山，还有牛魔王那口咽不下的气',
          desc: '熄火不熄人。【芭蕉扇·灭火】每场战斗可扇灭一次敌方的"增益/气势"（削敌 20% 攻击，持续全场）。' },
        { need: { dao: '夺', n: 4 }, id: 'tre_bajiaoshan_duo', name: '芭蕉扇·扇天', hint: '以夺道再取四宝——一扇熄火，二扇生风，三扇……你把灵山也扇一扇试试',
          desc: '扇尽不平。【芭蕉扇·扇天】全体伤害+15%；每通过一劫，本场攻击+3%（上限 30%）。' },
      ],
    },
    {
      id: 'tre_sheli', name: '佛宝舍利', trial: 50,
      desc: '祭赛国金光寺塔顶那颗。它在，塔顶发光；它丢了，全寺僧人下狱三年。',
      evo: [
        { need: { dao: '渡', n: 6 }, id: 'tre_sheli_du', name: '舍利·还塔', hint: '以渡道浇灌六回——你说：这光不是我的，是塔的',
          desc: '还光于塔。【舍利·还塔】每场战斗后回血+150、御念+15%；全队（含灵兽）每场开局获 8% 护盾。' },
        { need: { dao: '夺', n: 4 }, id: 'tre_sheli_duo', name: '舍利·私藏', hint: '以夺道再取四宝——你还了塔，却留了一颗在怀里，无人知晓',
          desc: '佛光自照。【舍利·私藏】气血上限+18%、每场战斗后回血+100；恶业每 15 点，攻击+2%。' },
      ],
    },
    {
      id: 'tre_jinnao', name: '金铙法器', trial: 56,
      desc: '弥勒的铙。悟空在里面待了三天三夜，亢金龙的角都钻弯了。',
      evo: [
        { need: { dao: '渡', n: 6 }, id: 'tre_jinnao_du', name: '金铙·开', hint: '以渡道浇灌六回——你没砸它，你把盖子掀开了',
          desc: '铙开人出。【金铙·开】免疫"困缚/禁锢"类效果；每场战斗可挣脱一次致命控制并回血 15%。' },
        { need: { dao: '逆', n: 6 }, id: 'tre_jinnao_ni', name: '金铙·困佛', hint: '以逆道浇灌六回——假佛坐莲台？那就连真的一起扣进去',
          desc: '扣住莲台。【金铙·困佛】战斗开局困敌 2 回合（其无法行动）；对"佛"系敌人效果延长 1 回合。' },
      ],
    },
    {
      id: 'tre_jinling', name: '三个金铃', trial: 57,
      desc: '赛太岁挂在脖子上的三个铃：一个放火，一个放烟，一个放沙。朱紫国王的病，一半是它吓出来的。',
      evo: [
        { need: { dao: '渡', n: 6 }, id: 'tre_jinling_du', name: '金铃·安魂', hint: '以渡道浇灌六回——铃声不变，只是这回听的人不做噩梦了',
          desc: '安魂不惊。【金铃·安魂】每场战斗后回血+110、御念+10%；免疫"恐惧/降攻"类负面。' },
        { need: { dao: '夺', n: 4 }, id: 'tre_jinling_duo', name: '金铃·三灾', hint: '以夺道再取四宝——火、烟、沙，你一个人摇得比它响',
          desc: '三灾齐发。【金铃·三灾】每次攻击附带随机一灾：灼烧（最大气血 3%）/致盲（敌攻-12%）/破甲（减伤-10%）。' },
      ],
    },
    {
      id: 'tre_yinyangping', name: '阴阳二气瓶', trial: 58,
      desc: '大鹏的瓶。装进去的人，一气化作三升水——狮驼岭四百里尸山，多半是它化的。',
      evo: [
        { need: { dao: '渡', n: 6 }, id: 'tre_yinyangping_du', name: '阴阳瓶·超度', hint: '以渡道浇灌六回——瓶里的三升水，你一句句念回成了名字',
          desc: '化水为名。【阴阳瓶·超度】每场战斗后回血+130；每通过一劫，为四百里尸山超度一魂（攻击+2%，可叠）。' },
        { need: { dao: '逆', n: 6 }, id: 'tre_yinyangping_ni', name: '阴阳瓶·颠倒', hint: '以逆道浇灌六回——装的是取经人？那就让瓶口对着灵山',
          desc: '颠倒阴阳。【阴阳瓶·颠倒】暴击+12%、暴击伤害+25%；击杀敌人时回复其最大气血 8%。' },
      ],
    },
  ];

  // ---- 生成装备条目（数值随章节递增，rationale 见上）----
  const chapOf = (trial) => Math.max(1, Math.ceil(trial / 5));
  const mk = (id, name, trial, atk, hp, dr, extra, desc) => Object.assign({
    id, name, slot: 'treasure', atk, hp, dr,
    treasure: true, treasureId: id, phase: 'in', charges: 3,
    chapter: chapOf(trial), desc,
  }, extra || {});

  const POOL = [];
  T1.forEach(([id, name, trial, desc]) => {
    const c = chapOf(trial);
    POOL.push(mk(id, name, trial,
      Math.round(12 + c * 1.6),
      Math.round(40 + c * 8),
      +(0.04 + c * 0.002).toFixed(3),
      { matk: Math.round(4 + c * 0.8) },
      desc + `【至宝·${name}】攻+${Math.round(12 + c * 1.6)} 血+${Math.round(40 + c * 8)} 减伤+${(4 + c * 0.2).toFixed(1)}%（夺宝战所得，难度 ×1.4 起）`));
  });
  T0.forEach((t) => {
    const c = chapOf(t.trial);
    const atk = Math.round(20 + c * 2.2);
    const hp = Math.round(60 + c * 10);
    const dr = +(0.06 + c * 0.004).toFixed(3);
    POOL.push(mk(t.id, t.name, t.trial, atk, hp, dr,
      { matk: Math.round(6 + c * 1.2), evoTo: t.evo.map((e) => e.id) },
      t.desc + `【至宝·${t.name}】攻+${atk} 血+${hp} 减伤+${(dr * 100).toFixed(1)}%——尚是死物，需以道浇灌方可圆满。`));
    // 升级版：属性 ×1.6，带专属关键词（供后续被动钩子识别）
    t.evo.forEach((e) => {
      POOL.push(mk(e.id, e.name, t.trial,
        Math.round(atk * 1.6), Math.round(hp * 1.6), +(dr * 1.5).toFixed(3),
        { matk: Math.round((6 + c * 1.2) * 1.6), evoFrom: t.id, evoDao: Object.keys(e.need.dao ? { [e.need.dao]: 1 } : {})[0], stackable: true },
        e.desc));
    });
  });

  NDX.DUO_TREASURE_POOL = POOL;
  // 入装备池（equipById / lootById 即可取到）
  if (NDX.EQUIP_POOL) NDX.EQUIP_POOL = NDX.EQUIP_POOL.concat(POOL);
  if (NDX.equipById && NDX.equipById.rebuild) NDX.equipById.rebuild();

  // ---- 升级链查询 ----
  NDX.TREASURE_EVO = {};
  T0.forEach((t) => { NDX.TREASURE_EVO[t.id] = t; });

  NDX.treasureEvoFor = function (id) {
    const t = NDX.TREASURE_EVO[id];
    if (!t) return null;
    return { hint: t.evo.map((e) => e.hint).join('；或'), list: t.evo };
  };

  // ---- 升级判定：持宝 + 对应道累计达标 → 原宝化为特殊装备 ----
  // 在每次劫难结算后调用（game_event_2.js 的 _afterChoice 末尾）。
  NDX.tryEvolveTreasures = function (g, s) {
    if (!s || !s.equips || !s.fate) return [];
    const done = [];
    s.equips.forEach((eq) => {
      if (!eq || !eq.treasure) return;
      const t = NDX.TREASURE_EVO[eq.id];
      if (!t) return;
      for (let i = 0; i < t.evo.length; i++) {
        const e = t.evo[i];
        const dao = e.need.dao;
        // §2.1 六道非硬门槛：进度改为「命数 OR 劫印道数」二选一（由装备+行为达成，与隐藏职 cond 同口径）；
        //   六道只作概率偏置。无劫印时行为项退回命数，零回归（2026-09-12）。
        const _daoCur = (NDX.DaoSystem && NDX.DaoSystem.calcDaoStats)
          ? Math.max((s.fate[dao] || 0), (NDX.DaoSystem.calcDaoStats(s)[dao] || 0))
          : (s.fate[dao] || 0);
        if (_daoCur < e.need.n) continue;
        const idx = s.equips.indexOf(eq);
        if (idx < 0) continue;
        const next = NDX.lootById(e.id);
        if (!next) continue;
        s.equips.splice(idx, 1, Object.assign({}, next));
        if (g && g.pushLog) {
          g.pushLog(`【至宝·圆满】${t.name} 在你手里变了模样——${e.name}（${dao}道 ×${e.need.n}）`);
          g.pushLog(`　　${e.desc}`);
          if (g.toast) g.toast(`至宝圆满：${e.name}`);
        }
        done.push(e.id);
        break;
      }
    });
    return done;
  };

  // ---- 夺道统计（供隐藏职条件与 UI 展示）----
  NDX.duoTreasureCount = function (s) {
    return (s && s.flags && s.flags.duoTreasures ? s.flags.duoTreasures.length : 0);
  };
})();
