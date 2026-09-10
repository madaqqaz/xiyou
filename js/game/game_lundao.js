/* =============================================================================
 * 逆道西行 · 二周目论道 · 三选结局（P1-6 · V8.63）
 * -----------------------------------------------------------------------------
 * 对应设计定稿：《六道奖励框架与二周目论道_设计文档.md》§六（主结局：焚 · 天条逆命）
 *   序章 → 三问（以道作答，不入善恶账，只调收束口吻）→ 逆道感悟兑现 → 三选（焚/重续/存留）
 *   · 触发：二周目胜利结算（game_meta.js 在 bumpCycleOnce 前判定 NDX.ZHUANJIE.lundaoOpen）
 *   · 存留门槛（设计稿"暂拟"口径落地）：持「旧账·逆道印」+ 本局从未使用戾骨献祭
 *   · 存留奖励：meta 道具《旧账》持久化（SaveSystem），带进下一世
 * 交互：pending 保持 gameover；s._lundaoStep 非 null 且未了断时，UI 以论道浮层拦截
 *       胜局画面（ui_core.js gameover 分支 → lundaoHtml；按钮经 main.js lundao-* 派发）。
 * 加载顺序：game shards 内、ui.js 之前（依赖 NDX.Game / NDX.ZHUANJIE / NDX.SaveSystem）。
 * ========================================================================== */
(function () {
  if (!window.NDX) window.NDX = {};
  var NDX = window.NDX;

  /* ----------------------------- 论道文案数据（设计稿 §6.1/§6.2） ----------------------------- */
  NDX.LUNDAO = {
    introTitle: '论道 · 旧账簿',
    intro: '灵山金顶，如来案前。你翻出第一世那本旧账簿——封皮黄脆，墨迹却新。\n条目第一行：「金蝉子 · 轻慢 · 十世轮回」。\n\n十世行走，三条逆道感悟在怀。如来不问你想求什么正果，只把账簿推到你面前：\n「此账，你欲何了？」',
    questions: [
      {
        title: '问「度谁」',
        sub: '「你的经，若只渡得了合它尺寸的人——余下的呢？」',
        opts: [
          { dao: '渡', text: '渡也。渡得尽的先渡，渡不尽的，来世接着渡——路还长。' },
          { dao: '逆', text: '错不在人，在尺寸。经若只合一种人，便该把经改到合所有人。' },
          { dao: '隐', text: '答不了，也不答。余下的路，让他们自渡去。' },
        ],
      },
      {
        title: '问「账簿」',
        sub: '「条目上写你的『罪』——还是编写经的人，需要你个罪？」',
        opts: [
          { dao: '战', text: '是枷。既是枷，便一棒打碎——看它里面锁的到底是谁。' },
          { dao: '缘', text: '是账。既是账，便一笔一笔对清——谁的债，谁来认。' },
          { dao: '逆', text: '是笔。写什么是握笔的说了算——如今，笔在我手里。' },
        ],
      },
      {
        title: '问「自写契约」',
        sub: '「这一次，纸条上你亲笔写下的——是承诺，还是抵触？」',
        opts: [
          { dao: '渡', text: '承诺。替前十世那个不敢答的人，把这一行补完。' },
          { dao: '夺', text: '我只写我认的。不认的，连纸带字一并吞了。' },
          { dao: '隐', text: '不写。纸留给风，字留给自己。' },
        ],
      },
    ],
    choices: {
      fire: {
        key: 'fire', title: '焚 · 天条逆命', cg: 'nidao', main: true,
        act: '当庭焚簿，逆天消账',
        text: '你把旧账簿举过头顶，就着灵山的长明灯点燃。纸页蜷曲、字迹如活物般挣扎，终化作一缕青烟，散在大殿之上。\n「金蝉子 · 轻慢 · 十世轮回」——从今往后，无此一账。\n\n如来不语，金身低眉。你合掌，还了个不跪的礼，转身下山。\n道不灭，账已消。此世起，经书是你的，路也是你的。',
      },
      guide: {
        key: 'guide', title: '重续 · 引渡者', cg: 'zhengguo',
        act: '奉还账簿，续引渡旧路',
        text: '你把旧账簿双手奉还：「此账太重，我不做评判——我做摆渡的。」\n簿子回到如来案上，第一行「金蝉子 · 轻慢 · 十世轮回」被朱笔缓缓划去。\n\n你接下的不是正果，是一支篙：从此渡口的灯为你长明，每个到不了对岸的魂，都多一条路。',
      },
      keep: {
        key: 'keep', title: '存留 · 带下灵山', cg: 'dasheng',
        act: '收簿入怀，写给下一个自己',
        text: '你把旧账簿收进怀里，向如来一礼：「这笔账我背着——不是认，是记着。写给下一个我。」\n金身微微一震，似叹似笑。\n\n你下山时，怀里有纸页摩挲的轻响，像另一个你，在前路等你。',
        gateHint: '门槛：持「旧账·逆道印」+ 本局从未以戾骨献祭焚力（了断之世，不带火气）',
      },
    },
    closings: {
      '渡': '你答得软，像凌云渡的水——不争，却能载船。',
      '缘': '你答得细，像数账的人——一笔一笔，都是牵挂。',
      '战': '你答得硬，像五行山下磨了五百年的棒——问什么，都是一击。',
      '夺': '你答得野，像出了匣的刀——先斩后奏，斩完再论。',
      '隐': '你答得淡，像雪地上的脚印——浅浅几个，转身便被埋了。',
      '逆': '你答得干脆，像当年踢翻的炼丹炉——不留余地，也不留悔。',
    },
  };

  /* ----------------------------- meta：《旧账》（存留彩蛋 · 跨周目） ----------------------------- */
  NDX.LUNDAO_KEY = 'xynj_jiuzhang_book';
  NDX.loadJiuzhangBook = function () {
    try {
      const d = NDX.SaveSystem.load(NDX.LUNDAO_KEY, null);
      return d && typeof d === 'object' ? d : null;
    } catch (e) { return null; }
  };
  NDX.saveJiuzhangBook = function () {
    try { NDX.SaveSystem.save(NDX.LUNDAO_KEY, { kept: true, ts: Date.now() }); } catch (e) {}
  };

  /* ----------------------------- 判定助手 ----------------------------- */
  // 存留门槛（设计稿"暂拟"口径落地）：持「旧账·逆道印」+ 本局从未戾骨献祭
  NDX.lundaoKeepOk = function (s) {
    const hasSeal = (s.equips || []).some(function (e) {
      return e && (e.id === 'jiuzhang_seal' || e.eid === 'jiuzhang_seal' || e.name === '旧账·逆道印');
    });
    const ligu = (s.lundaoStats && s.lundaoStats.liguUsed) || 0;
    return hasSeal && ligu === 0;
  };
  // 支配道 → 收束口吻（三问作答不入善恶账，只调口吻——设计稿 §6.2）
  NDX.lundaoClosing = function (answers) {
    const cnt = {};
    (answers || []).forEach(function (d) { cnt[d] = (cnt[d] || 0) + 1; });
    let best = null, n = 0;
    Object.keys(cnt).forEach(function (d) { if (cnt[d] > n) { n = cnt[d]; best = d; } });
    return best ? (NDX.LUNDAO.closings[best] || '') : '';
  };

  /* ----------------------------- 流程方法（Game 实例） ----------------------------- */
  // UI 拦截判定：胜局 + 论道进行中（_lundaoStep 非 null）且未了断
  NDX.Game.prototype.lundaoActive = function lundaoActive() {
    const s = this.state;
    return !!(s && s.over && s.over.win && s.pending && s.pending.kind === 'gameover'
      && s._lundaoStep != null && !s._lundaoChosen);
  };
  // 序章「论道开始」→ 三问；兑现页「三选了断」→ 三选（step: 0 序章 / 1-3 三问 / 4 兑现 / 5 三选）
  NDX.Game.prototype.lundaoContinue = function lundaoContinue() {
    const s = this.state;
    if (!s || s._lundaoStep == null || s._lundaoChosen) return;
    if (s._lundaoStep === 0) { s._lundaoStep = 1; return; }
    if (s._lundaoStep === 4) { s._lundaoStep = 5; return; }
  };
  // 三问作答：记录所答之道（不入善恶账），推进下一问；答完第三问进入兑现页
  NDX.Game.prototype.lundaoAnswer = function lundaoAnswer(idx) {
    const s = this.state;
    if (!s || s._lundaoStep == null || s._lundaoStep < 1 || s._lundaoStep > 3) return;
    const q = NDX.LUNDAO.questions[s._lundaoStep - 1];
    const o = q && q.opts[idx];
    if (!o) return;
    s._lundaoAnswers = s._lundaoAnswers || [];
    s._lundaoAnswers.push(o.dao);
    this.pushLog('【论道 · ' + q.title + '】你以「' + o.dao + '」作答——' + o.text);
    s._lundaoStep = s._lundaoStep + 1; // → 下一问 / 4 = 兑现
    if (s._lundaoStep === 4) {
      // 逆道感悟兑现：一周目仅录不赋值，此刻一次性兑现为命数铭文（设计稿 §6.2 兑现机制）
      const ins = (s.niInsights || []).slice();
      s.lundaoCash = { insights: ins, ts: Date.now() };
      ins.forEach(function (name) {
        this.pushLog('【兑现】逆道感悟「' + name + '」铸为命数铭文（随收官之身，载入轮回）');
      }, this);
      if (!ins.length) this.pushLog('【兑现】账簿空空——此世逆道无所录，亦无所兑。');
    }
  };
  // 三选了断：改写 s.over.ending → 胜局画面按新结局呈现
  NDX.Game.prototype.lundaoChoose = function lundaoChoose(key) {
    const s = this.state;
    if (!s || s._lundaoStep !== 5 || s._lundaoChosen) return;
    const def = NDX.LUNDAO.choices[key];
    if (!def) return;
    if (key === 'keep' && !NDX.lundaoKeepOk(s)) return;
    const closing = NDX.lundaoClosing(s._lundaoAnswers);
    const ending = { title: def.title, text: def.text + (closing ? '\n\n' + closing : '') };
    if (def.cg) ending.cg = def.cg;
    if (key === 'keep') {
      NDX.saveJiuzhangBook();
      ending.text += '\n\n《旧账》收进怀里——此世攒的，下世接着带。';
      this.pushLog('【论道 · 存留】旧账簿入怀，已记入轮回总鉴（下世论道可见「前世存留」）。');
    }
    s.over.ending = ending;
    s.over.lundaoChoice = key;
    s.lundaoDone = true;
    s._lundaoStep = null;
    this.pushLog('【论道了断】' + def.title + '——' + def.act);
  };
})();
