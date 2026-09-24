// =============================================================
// voice_config.js — 《逆道西行》角色配音配置
// 为所有英雄及Boss配置相关配音
// 配音类型：出场/攻击/技能/胜利/死亡/受击
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// 英雄配音配置
NDX.HERO_VOICES = {
  tangseng: {
    name: '取经人',
    voiceType: '青年男性，温和慈悲，语速适中，带有佛门弟子的沉静',
    lines: {
      enter: '贫僧自东土大唐而来，去往西天拜佛求经。',
      attack: '阿弥陀佛，看杖！',
      skill: '金蝉谛听，慈悲愿力！',
      ult: '锦襕袈裟，万法不侵！',
      victory: '善哉善哉，又渡一劫。',
      defeat: '我佛慈悲……弟子尽力了……',
      hit: '呃……',
      guard: '金刚护体！',
      heal: '南无阿弥陀佛，愿力回春。',
    }
  },
  wukong: {
    name: '孙悟空',
    voiceType: '青年男性，狂放不羁，语速较快，带有齐天大圣的傲气',
    lines: {
      enter: '俺老孙来也！妖怪哪里跑！',
      attack: '吃俺老孙一棒！',
      skill: '七十二变，分身术！',
      ult: '如意金箍棒，大！大！大！',
      victory: '哈哈哈哈！就这点本事？',
      defeat: '不可能……俺老孙怎会败……',
      hit: '嘶！',
      guard: '铜头铁臂，来啊！',
      crit: '看俺老孙破甲！',
    }
  },
  bajie: {
    name: '猪八戒',
    voiceType: '中年男性，憨厚贪吃，语速较慢，带有天蓬元帅的慵懒',
    lines: {
      enter: '嘿嘿，俺老猪来也！先让俺吃口东西再说。',
      attack: '看俺九齿钉耙！',
      skill: '净坛护盾，给俺起！',
      ult: '天蓬下凡，万钧之力！',
      victory: '嘿嘿，打赢了！有啥好吃的没？',
      defeat: '完了完了……俺老猪要被炖了……',
      hit: '哎哟！疼疼疼！',
      guard: '俺皮厚，不怕！',
      heal: '嘿嘿，回血了回血了。',
    }
  },
  shaseng: {
    name: '沙僧',
    voiceType: '中年男性，沉稳厚重，语速较慢，带有卷帘大将的可靠',
    lines: {
      enter: '沙僧在此，大师兄莫慌。',
      attack: '降妖宝杖，看打！',
      skill: '沉沙御念，不动如山！',
      ult: '卷帘大将，万法不侵！',
      victory: '幸不辱命。',
      defeat: '弟子……无能……',
      hit: '哼。',
      guard: '有我在，休想伤我师父！',
      reflect: '反震！',
    }
  },
  xiaobailong: {
    name: '小白龙',
    voiceType: '青年男性，冷峻孤傲，语速较快，带有西海龙子的高贵',
    lines: {
      enter: '西海小龙，特来助阵。',
      attack: '龙影连刺！',
      skill: '疾风连击，闪避！',
      ult: '逆鳞之怒，万龙朝拜！',
      victory: '不过如此。',
      defeat: '龙……落平阳……',
      hit: '啧。',
      dodge: '太慢了。',
      crit: '龙威暴击！',
    }
  },
};

// Boss配音配置（主要Boss）
NDX.BOSS_VOICES = {
  boss_baigujing: {
    name: '白骨夫人',
    voiceType: '女性，阴冷妖异，语速缓慢，带有白骨精的诡异',
    lines: {
      enter: '嘻嘻嘻……唐僧肉……我等了好久了……',
      attack: '骨爪噬魂！',
      skill: '遁形！你看不见我……',
      ult: '万骨枯荣，白骨真身！',
      victory: '嘻嘻……又多了一具白骨……',
      defeat: '不可能……我修行了千年……',
      hit: '啊！',
      phase2: '你以为……这就是我的全部吗？',
      phase3: '白骨夫人……真正的力量！',
    }
  },
  boss_huangfeng: {
    name: '黄风大圣',
    voiceType: '中年男性，沙哑阴沉，语速中等，带有黄风怪的狡诈',
    lines: {
      enter: '哼哼……这灵山脚下，就是你的葬身之地！',
      attack: '飞沙走石！',
      skill: '黄沙护盾，万物不侵！',
      ult: '三昧神风，遮天蔽日！',
      victory: '在我的风沙里，你连眼睛都睁不开！',
      defeat: '我的风……怎么会……',
      hit: '呃！',
      special: '你以为你能看清？在风沙里，你就是瞎子！',
    }
  },
  boss_honghaier: {
    name: '红孩儿',
    voiceType: '少年男性，嚣张跋扈，语速较快，带有圣婴大王的狂妄',
    lines: {
      enter: '哈哈哈！我乃圣婴大王！唐僧，快快束手就擒！',
      attack: '三昧真火，烧！',
      skill: '火焰护盾，看你怎么攻！',
      ult: '火云洞主，万火焚天！',
      victory: '哈哈哈！被烧的滋味不好受吧！',
      defeat: '不可能……我的三昧真火……',
      hit: '哼！不痛不痒！',
      dot: '在火里慢慢煎熬吧！',
    }
  },
  boss_liuhong: {
    name: '刘洪',
    voiceType: '中年男性，阴狠残忍，语速中等，带有水贼的凶悍',
    lines: {
      enter: '此山是我开，此树是我栽！要想从此过，留下买路财！',
      attack: '看刀！',
      skill: '水贼连击，招招致命！',
      ult: '江中恶蛟，血洗江州！',
      victory: '哈哈哈！又一个送死的！',
      defeat: '我……我不甘心……',
      hit: '呃啊！',
      enrage: '你惹怒我了！',
    }
  },
  boss_jinjiao: {
    name: '金角大王',
    voiceType: '中年男性，粗狂威严，语速较慢，带有太上老君童子的傲慢',
    lines: {
      enter: '我乃金角大王！唐僧，快快入我葫芦！',
      attack: '看我紫金红葫芦！',
      skill: '叫你一声，你敢答应吗？',
      ult: '金角真身，万宝朝宗！',
      victory: '哈哈哈！又收了一个！',
      defeat: '我的葫芦……怎么会……',
      hit: '哼！皮糙肉厚！',
      treasure: '紫金红葫芦，收！',
    }
  },
  boss_yinjiao: {
    name: '银角大王',
    voiceType: '中年男性，阴沉狡诈，语速中等，带有太上老君童子的阴险',
    lines: {
      enter: '我乃银角大王！看我羊脂玉净瓶！',
      attack: '玉净瓶，收！',
      skill: '移山倒海，压！',
      ult: '银角真身，山海压顶！',
      victory: '哈哈哈！被压在山下的滋味如何？',
      defeat: '我的玉净瓶……',
      hit: '呃！',
      special: '三座大山，给我压！',
    }
  },
  boss_dapeng: {
    name: '大鹏金翅雕',
    voiceType: '中年男性，高傲威严，语速缓慢，带有凤凰之子的尊贵',
    lines: {
      enter: '我乃大鹏金翅雕！如来的娘舅！唐僧，你逃不出我的手掌心！',
      attack: '金翅斩空！',
      skill: '阴阳二气瓶，收！',
      ult: '大鹏展翅，万里云霄！',
      victory: '哈哈哈！一翅九万里，你往哪里逃！',
      defeat: '不可能……我可是凤凰之子……',
      hit: '雕虫小技！',
      fly: '在天上，我就是无敌的！',
    }
  },
  boss_niumowang: {
    name: '牛魔王',
    voiceType: '中年男性，粗犷豪放，语速较慢，带有平天大圣的威严',
    lines: {
      enter: '我乃平天大圣牛魔王！孙悟空，你欺我妻儿，今日定不与你干休！',
      attack: '混铁棍，横扫千军！',
      skill: '法天象地，大！',
      ult: '牛魔王真身，万妖臣服！',
      victory: '哈哈哈！齐天大圣？不过如此！',
      defeat: '我老牛……竟败了……',
      hit: '哼！给我挠痒痒呢？',
      rage: '惹怒我老牛，你找死！',
    }
  },
};

// 通用怪物配音（按类型）
NDX.MONSTER_VOICES = {
  // 小妖类型
  goblin: {
    voiceType: '尖锐刺耳的小妖声音，语速快，带有猥琐感',
    lines: {
      attack: '杀啊！',
      hit: '哎哟！',
      defeat: '饶命啊！',
    }
  },
  // 野兽类型
  beast: {
    voiceType: '低沉咆哮的野兽声音',
    lines: {
      attack: '吼！',
      hit: '嗷！',
      defeat: '呜咽……',
    }
  },
  // 妖道类型
  demon: {
    voiceType: '阴恻恻的妖道声音，语速缓慢，带有诡异感',
    lines: {
      attack: '受死吧！',
      hit: '呃！',
      defeat: '我不甘心……',
    }
  },
};

// 配音文件路径映射
NDX.VOICE_FILES = {
  // 英雄配音
  'tangseng_enter': 'assets/voice/tangseng_enter.mp3',
  'tangseng_attack': 'assets/voice/tangseng_attack.mp3',
  'tangseng_skill': 'assets/voice/tangseng_skill.mp3',
  'tangseng_victory': 'assets/voice/tangseng_victory.mp3',
  'tangseng_defeat': 'assets/voice/tangseng_defeat.mp3',
  
  'wukong_enter': 'assets/voice/wukong_enter.mp3',
  'wukong_attack': 'assets/voice/wukong_attack.mp3',
  'wukong_skill': 'assets/voice/wukong_skill.mp3',
  'wukong_victory': 'assets/voice/wukong_victory.mp3',
  'wukong_defeat': 'assets/voice/wukong_defeat.mp3',
  
  'bajie_enter': 'assets/voice/bajie_enter.mp3',
  'bajie_attack': 'assets/voice/bajie_attack.mp3',
  'bajie_skill': 'assets/voice/bajie_skill.mp3',
  'bajie_victory': 'assets/voice/bajie_victory.mp3',
  'bajie_defeat': 'assets/voice/bajie_defeat.mp3',
  
  'shaseng_enter': 'assets/voice/shaseng_enter.mp3',
  'shaseng_attack': 'assets/voice/shaseng_attack.mp3',
  'shaseng_skill': 'assets/voice/shaseng_skill.mp3',
  'shaseng_victory': 'assets/voice/shaseng_victory.mp3',
  'shaseng_defeat': 'assets/voice/shaseng_defeat.mp3',
  
  'xiaobailong_enter': 'assets/voice/xiaobailong_enter.mp3',
  'xiaobailong_attack': 'assets/voice/xiaobailong_attack.mp3',
  'xiaobailong_skill': 'assets/voice/xiaobailong_skill.mp3',
  'xiaobailong_victory': 'assets/voice/xiaobailong_victory.mp3',
  'xiaobailong_defeat': 'assets/voice/xiaobailong_defeat.mp3',
  
  // Boss配音 - 白骨夫人
  'boss_baigujing_enter': 'assets/voice/boss_baigujing_enter.mp3',
  'boss_baigujing_attack': 'assets/voice/boss_baigujing_attack.mp3',
  'boss_baigujing_skill': 'assets/voice/boss_baigujing_skill.mp3',
  'boss_baigujing_victory': 'assets/voice/boss_baigujing_victory.mp3',
  'boss_baigujing_defeat': 'assets/voice/boss_baigujing_defeat.mp3',
  
  // Boss配音 - 黄风大圣
  'boss_huangfeng_enter': 'assets/voice/boss_huangfeng_enter.mp3',
  'boss_huangfeng_attack': 'assets/voice/boss_huangfeng_attack.mp3',
  'boss_huangfeng_skill': 'assets/voice/boss_huangfeng_skill.mp3',
  'boss_huangfeng_victory': 'assets/voice/boss_huangfeng_victory.mp3',
  'boss_huangfeng_defeat': 'assets/voice/boss_huangfeng_defeat.mp3',
  
  // Boss配音 - 红孩儿
  'boss_honghaier_enter': 'assets/voice/boss_honghaier_enter.mp3',
  'boss_honghaier_attack': 'assets/voice/boss_honghaier_attack.mp3',
  'boss_honghaier_skill': 'assets/voice/boss_honghaier_skill.mp3',
  'boss_honghaier_victory': 'assets/voice/boss_honghaier_victory.mp3',
  'boss_honghaier_defeat': 'assets/voice/boss_honghaier_defeat.mp3',
  
  // Boss配音 - 刘洪
  'boss_liuhong_enter': 'assets/voice/boss_liuhong_enter.mp3',
  'boss_liuhong_attack': 'assets/voice/boss_liuhong_attack.mp3',
  'boss_liuhong_skill': 'assets/voice/boss_liuhong_skill.mp3',
  'boss_liuhong_victory': 'assets/voice/boss_liuhong_victory.mp3',
  'boss_liuhong_defeat': 'assets/voice/boss_liuhong_defeat.mp3',
  
  // Boss配音 - 金角大王
  'boss_jinjiao_enter': 'assets/voice/boss_jinjiao_enter.mp3',
  'boss_jinjiao_attack': 'assets/voice/boss_jinjiao_attack.mp3',
  'boss_jinjiao_skill': 'assets/voice/boss_jinjiao_skill.mp3',
  'boss_jinjiao_victory': 'assets/voice/boss_jinjiao_victory.mp3',
  'boss_jinjiao_defeat': 'assets/voice/boss_jinjiao_defeat.mp3',
  
  // Boss配音 - 银角大王
  'boss_yinjiao_enter': 'assets/voice/boss_yinjiao_enter.mp3',
  'boss_yinjiao_attack': 'assets/voice/boss_yinjiao_attack.mp3',
  'boss_yinjiao_skill': 'assets/voice/boss_yinjiao_skill.mp3',
  'boss_yinjiao_victory': 'assets/voice/boss_yinjiao_victory.mp3',
  'boss_yinjiao_defeat': 'assets/voice/boss_yinjiao_defeat.mp3',
  
  // Boss配音 - 大鹏金翅雕
  'boss_dapeng_enter': 'assets/voice/boss_dapeng_enter.mp3',
  'boss_dapeng_attack': 'assets/voice/boss_dapeng_attack.mp3',
  'boss_dapeng_skill': 'assets/voice/boss_dapeng_skill.mp3',
  'boss_dapeng_victory': 'assets/voice/boss_dapeng_victory.mp3',
  'boss_dapeng_defeat': 'assets/voice/boss_dapeng_defeat.mp3',
  
  // Boss配音 - 牛魔王
  'boss_niumowang_enter': 'assets/voice/boss_niumowang_enter.mp3',
  'boss_niumowang_attack': 'assets/voice/boss_niumowang_attack.mp3',
  'boss_niumowang_skill': 'assets/voice/boss_niumowang_skill.mp3',
  'boss_niumowang_victory': 'assets/voice/boss_niumowang_victory.mp3',
  'boss_niumowang_defeat': 'assets/voice/boss_niumowang_defeat.mp3',
  
  // 通用怪物配音 - 小妖
  'monster_xiaoyao_attack': 'assets/voice/monster_xiaoyao_attack.mp3',
  'monster_xiaoyao_hit': 'assets/voice/monster_xiaoyao_hit.mp3',
  'monster_xiaoyao_death': 'assets/voice/monster_xiaoyao_death.mp3',
  
  // 通用怪物配音 - 野兽
  'monster_yeshou_attack': 'assets/voice/monster_yeshou_attack.mp3',
  'monster_yeshou_hit': 'assets/voice/monster_yeshou_hit.mp3',
  'monster_yeshou_death': 'assets/voice/monster_yeshou_death.mp3',
  
  // 通用怪物配音 - 妖道
  'monster_yaodao_attack': 'assets/voice/monster_yaodao_attack.mp3',
  'monster_yaodao_hit': 'assets/voice/monster_yaodao_hit.mp3',
  'monster_yaodao_death': 'assets/voice/monster_yaodao_death.mp3',
};

// 播放角色配音
NDX.playVoice = function(voiceKey) {
  try {
    if (!NDX.sound || !NDX.sound.isOn || !NDX.sound.isOn()) return;
    const filePath = NDX.VOICE_FILES[voiceKey];
    if (!filePath) return;
    
    // 创建音频对象
    const audio = new Audio(filePath);
    audio.volume = Math.max(0, Math.min(1, (NDX.sound._sfxVolume != null ? NDX.sound._sfxVolume : 0.8) * 0.9));
    
    // 播放失败时静默处理
    audio.onerror = function() {
      // 配音文件缺失时不播放，不影响游戏
    };
    
    audio.play().catch(function() {});
  } catch (e) {
    // 配音播放失败不影响游戏
  }
};

// 播放英雄配音
NDX.playHeroVoice = function(heroId, type) {
  try {
    const heroVoice = NDX.HERO_VOICES[heroId];
    if (!heroVoice || !heroVoice.lines[type]) return;
    const voiceKey = heroId + '_' + type;
    NDX.playVoice(voiceKey);
  } catch (e) {}
};

// 播放Boss配音
NDX.playBossVoice = function(bossId, type) {
  try {
    const bossVoice = NDX.BOSS_VOICES[bossId];
    if (!bossVoice || !bossVoice.lines[type]) return;
    const voiceKey = bossId + '_' + type;
    NDX.playVoice(voiceKey);
  } catch (e) {}
};
