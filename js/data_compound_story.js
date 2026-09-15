// =============================================================
// data_compound_story.js — 《逆道西行》复合劫难多阶段剧情系统
// 复合劫难（车迟国、女儿国、火云洞等）采用3阶段多重选项结构
// 玩家的选择产生不同的故事路线和后果
// 全局命名空间 NDX
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// ============================================================
// 复合劫难多阶段剧情定义
// 结构：
//   id: 复合劫难ID
//   name: 复合劫难名称
//   title: 复合劫难标题
//   icon: 图标
//   trials: 包含的劫难号
//   stages: 阶段数组
//     stage.id: 阶段ID
//     stage.name: 阶段名称
//     stage.text: 阶段叙事文本
//     stage.opts: 选项数组
//       opt.id: 选项ID
//       opt.text: 选项文本
//       opt.effect: 即时效果
//       opt.next_stage: 下一阶段ID（null表示进入最终抉择）
//       opt.flag: 设置的标记（用于后续阶段判断）
//   final_choices: 最终抉择数组
//     choice.id: 抉择ID
//     choice.text: 抉择文本
//     choice.fate: 对应六道（战/隐/夺/渡/缘/逆）
//     choice.effect: 效果
//     choice.ending: 结局描述
//   endings: 结局映射（根据阶段选择和最终抉择确定结局）
// ============================================================

NDX.COMPOUND_STORY = {
  // ============================================================
  // 车迟国复合劫难（难28-31）
  // ============================================================
  chechi: {
    id: 'chechi',
    name: '车迟国斗法',
    title: '第28-31难 · 车迟国斗法',
    icon: '⚔️',
    trials: [28, 29, 30, 31],
    stages: [
      {
        id: 'stage1',
        name: '初入车迟国',
        text: '车迟国虎力、鹿力、羊力三妖，以"斗法"替天庭牧民。百姓跪在台下喊"国师万寿"，眼里却没光——他们信的不是佛，是能求来雨的棍子。你认得这戏码：用神通换顺民，正是你最恨的。三妖原是山中修行的兽，被招安那天起，便不再是自己。',
        opts: [
          {
            id: 's1_a',
            text: '暗访民情——乔装入城，了解三妖治下百姓的真实生活',
            effect: { good: 5 },
            next_stage: 'stage2_a',
            flag: 'investigated'
          },
          {
            id: 's1_b',
            text: '直接挑战——当街叫板三妖，要与他们斗法',
            effect: { evil: 5 },
            next_stage: 'stage2_b',
            flag: 'challenged'
          },
          {
            id: 's1_c',
            text: '混入僧众——加入被压迫的僧众行列，暗中观察',
            effect: {},
            next_stage: 'stage2_c',
            flag: 'infiltrated'
          }
        ]
      },
      // 阶段2A：暗访民情后的深入
      {
        id: 'stage2_a',
        name: '民情真相',
        text: '你暗访得知：三妖虽然把持朝政，但确实为百姓求来了雨。只是这雨，是他们用百姓的香火和童男童女向天换来的。百姓敢怒不敢言，因为他们知道，没有三妖，就连这点雨也没有。你站在破庙里，看着僧众们被鞭打做苦役，心里五味杂陈。',
        opts: [
          {
            id: 's2a_1',
            text: '利用民情——煽动百姓反抗，告诉他们三妖的真相',
            effect: { evil: 10, ti: { atk: 10 } },
            next_stage: null,
            flag: 'incited'
          },
          {
            id: 's2a_2',
            text: '同情三妖——他们也是被天庭利用，何苦为难同类',
            effect: { good: 10 },
            next_stage: null,
            flag: 'sympathized'
          },
          {
            id: 's2a_3',
            text: '暗中保护——不与三妖正面冲突，暗中保护百姓和僧众',
            effect: { good: 15, ti: { hp: 50 } },
            next_stage: null,
            flag: 'protected'
          }
        ]
      },
      // 阶段2B：直接挑战后的深入
      {
        id: 'stage2_b',
        name: '三场斗法',
        text: '三妖应下你的挑战，约定三场斗法：云梯显圣（比坐禅）、隔板猜物（比智慧）、砍头剖腹（比性命）。虎力大仙冷笑："和尚，你敢比哪一场？"你看着台下围观的百姓，他们眼里有期待，也有恐惧——他们怕你输，也怕你赢。',
        opts: [
          {
            id: 's2b_1',
            text: '云梯显圣——比坐禅，看谁的心更定',
            effect: { yuan: { mdef: 0.05 } },
            next_stage: null,
            flag: 'meditation'
          },
          {
            id: 's2b_2',
            text: '隔板猜物——比智慧，看谁的眼更利',
            effect: { ti: { spd: 3 } },
            next_stage: null,
            flag: 'wisdom'
          },
          {
            id: 's2b_3',
            text: '砍头剖腹——比性命，看谁的命更硬',
            effect: { ti: { atk: 20, hp: 30 }, evil: 10 },
            next_stage: null,
            flag: 'deadly'
          }
        ]
      },
      // 阶段2C：混入僧众后的深入
      {
        id: 'stage2_c',
        name: '僧众之苦',
        text: '你混入僧众，才知道他们过的是什么日子：白天做苦役，晚上念经文，稍有差错便被鞭打。老和尚告诉你，三妖原本也是修行的兽，被天庭招安后便开始欺压僧众——他们恨佛，因为佛让他们做了兽。你摸着手上的佛珠，忽然觉得这珠子沉得很。',
        opts: [
          {
            id: 's2c_1',
            text: '策反僧众——暗中联络僧众，准备里应外合',
            effect: { good: 10, ti: { atk: 15 } },
            next_stage: null,
            flag: 'rebellion'
          },
          {
            id: 's2c_2',
            text: '盗取法宝——利用僧众身份，盗取三妖的修炼法宝',
            effect: { equip: 2, evil: 15 },
            next_stage: null,
            flag: 'stole'
          },
          {
            id: 's2c_3',
            text: '带领逃离——带领僧众逃离车迟国，另寻活路',
            effect: { good: 20, healFull: true },
            next_stage: null,
            flag: 'escaped'
          }
        ]
      }
    ],
    // 最终抉择
    final_choices: [
      {
        id: 'final_war',
        text: '战·以力破劫——掀翻妖席，斩杀三妖，车迟国恢复佛法',
        fate: '战',
        effect: { ti: { atk: 30 }, evil: 20 },
        ending: '你斩杀了三妖，车迟国百姓重归佛法。但三妖的师父太上老君前来问罪，说你杀了他的看门兽。你冷笑："看门兽？那被他们欺压的僧众，又算什么？"'
      },
      {
        id: 'final_du',
        text: '渡·渡人向善——点化三妖，让他们弃道从佛，成为护法',
        fate: '渡',
        effect: { good: 40, ti: { hp: 100 } },
        ending: '你点化了三妖，他们弃道从佛，成为车迟国的护法僧。百姓不再被欺压，僧众不再被鞭打。虎力大仙摸着光头说："原来做佛，比做兽自在。"'
      },
      {
        id: 'final_yin',
        text: '隐·避锋修心——不与三妖正面冲突，暗中保护百姓后离开',
        fate: '隐',
        effect: { ti: { hp: 80, dr: 0.05 }, good: 15 },
        ending: '你没有与三妖正面冲突，只是暗中保护了百姓和僧众，然后悄然离开。车迟国维持着表面的平静，但百姓们都知道，有个取经人曾在暗中保护过他们。'
      },
      {
        id: 'final_ni',
        text: '逆·跳出簿子——自封"车迟国王"，取代三妖统治',
        fate: '逆',
        effect: { evil: 40, ti: { atk: 25, hp: 80 } },
        ending: '你自封"车迟国王"，取代了三妖的统治。天庭震怒，说你逆天而行。你坐在王座上，看着台下跪拜的百姓，忽然觉得这王座，和五行山一样沉。'
      }
    ],
    // 结局映射（根据阶段标记和最终抉择确定结局描述）
    endings: {
      // 暗访民情 + 同情三妖 + 渡
      'investigated_sympathized_final_du': '你暗访民情后，对三妖心生同情。最终你选择点化他们，三妖弃道从佛，成为护法僧。他们说："原来我们求的不是雨，是被人看见。"',
      // 暗访民情 + 利用民情 + 战
      'investigated_incited_final_war': '你煽动百姓反抗，又在最终抉择中斩杀三妖。车迟国百姓暴动，三妖在乱中被斩杀。但你看着暴动的百姓，忽然觉得他们和三妖，也没什么不同。',
      // 直接挑战 + 砍头剖腹 + 战
      'challenged_deadly_final_war': '你选择砍头剖腹的死斗，又在最终抉择中斩杀三妖。三妖斗法失败，临死前虎力大仙说："和尚，你比我们还狠。"你擦着刀上的血，没有说话。',
      // 直接挑战 + 云梯显圣 + 隐
      'challenged_meditation_final_yin': '你选择云梯显圣比坐禅，与三妖平局收场。最终你选择不告而别，暗中保护百姓后离开。三妖望着你离去的方向，鹿力大仙说："这和尚，有点意思。"',
      // 混入僧众 + 策反僧众 + 逆
      'infiltrated_rebellion_final_ni': '你策反僧众，又在最终抉择中自封国王。僧众暴动，三妖被推翻，你坐上了王座。但你看着台下的僧众，忽然觉得他们看你的眼神，和看三妖时，一模一样。',
      // 混入僧众 + 带领逃离 + 渡
      'infiltrated_escaped_final_du': '你带领僧众逃离车迟国，又在最终抉择中点化三妖。三妖追悔莫及，弃道从佛。你带着僧众继续西行，身后是车迟国的钟声。'
    }
  },

  // ============================================================
  // 女儿国复合劫难（难38-41）
  // ============================================================
  nuerguo: {
    id: 'nuerguo',
    name: '女儿国情劫',
    title: '第38-41难 · 女儿国·情劫',
    icon: '💕',
    trials: [38, 39, 40, 41],
    stages: [
      {
        id: 'stage1',
        name: '初入女儿国',
        text: '女儿国满城皆是女子，见了你们这几个男人，如见珍宝。国王听闻取经人到来，欲招你为夫，共享江山。你看着满城的桃花，忽然觉得这桃花，和五行山下的野花，一样寂寞。',
        opts: [
          {
            id: 's1_a',
            text: '隐瞒身份——乔装打扮，混入城中',
            effect: {},
            next_stage: 'stage2_a',
            flag: 'hidden'
          },
          {
            id: 's1_b',
            text: '公开身份——直接面见国王，请求通关文牒',
            effect: { good: 5 },
            next_stage: 'stage2_b',
            flag: 'revealed'
          },
          {
            id: 's1_c',
            text: '绕道而行——试图绕过女儿国，不进城',
            effect: { ti: { spd: 2 } },
            next_stage: 'stage2_c',
            flag: 'detour'
          }
        ]
      },
      // 阶段2A：隐瞒身份后的深入
      {
        id: 'stage2_a',
        name: '身份暴露',
        text: '你隐瞒身份混入城中，但女儿国的女子们眼尖，很快就认出了你是取经人。她们把你围在中间，叽叽喳喳地问东问西。国王闻讯赶来，看着你说："御弟哥哥，你就从了我吧。"你看着她眼里的期待，忽然觉得这期待，比妖怪的獠牙还可怕。',
        opts: [
          {
            id: 's2a_1',
            text: '将计就计——假装答应，伺机盗取通关文牒',
            effect: { evil: 10, equip: 1 },
            next_stage: null,
            flag: 'deceived'
          },
          {
            id: 's2a_2',
            text: '坦诚相告——告诉国王你取经的决心，请求放行',
            effect: { good: 15 },
            next_stage: null,
            flag: 'honest'
          },
          {
            id: 's2a_3',
            text: '暗中调查——调查女儿国"子母河"的秘密',
            effect: { yuan: { matk: 10 } },
            next_stage: null,
            flag: 'investigated'
          }
        ]
      },
      // 阶段2B：公开身份后的深入
      {
        id: 'stage2_b',
        name: '国王招亲',
        text: '你公开身份面见国王，国王当即提出招亲。她说："御弟哥哥，我这女儿国，什么都有，就是缺个男人。你若留下，我便与你共享江山，如何？"满朝文武都看着你，等着你回答。你看着国王，她眼里有真情，也有帝王的算计。',
        opts: [
          {
            id: 's2b_1',
            text: '接受招亲——留下做国王的夫君',
            effect: { good: 10, ti: { hp: 100 } },
            next_stage: null,
            flag: 'accepted'
          },
          {
            id: 's2b_2',
            text: '婉拒请求——告诉国王你取经的决心，请求通关',
            effect: { good: 20 },
            next_stage: null,
            flag: 'refused'
          },
          {
            id: 's2b_3',
            text: '悟空变身——让悟空变作你的模样，替你应亲',
            effect: { evil: 5, ti: { spd: 3 } },
            next_stage: null,
            flag: 'wukong_sub'
          }
        ]
      },
      // 阶段2C：绕道而行后的深入
      {
        id: 'stage2_c',
        name: '子母河',
        text: '你试图绕道离开女儿国，却误饮了子母河的水。不多时，你便觉得腹痛难忍，竟是有了身孕。悟空告诉你，这子母河的水，喝了便会怀胎，唯有解阳山聚仙庵的落胎泉水才能解。你摸着肚子，忽然觉得这肚子里的生命，和你自己，一样无辜。',
        opts: [
          {
            id: 's2c_1',
            text: '求取落胎泉——去解阳山求取落胎泉水',
            effect: { good: 10, ti: { hp: 50 } },
            next_stage: null,
            flag: 'sought_water'
          },
          {
            id: 's2c_2',
            text: '留下孩子——决定生下这个孩子，带他一起取经',
            effect: { good: 30, ti: { hp: 150 } },
            next_stage: null,
            flag: 'kept_child'
          },
          {
            id: 's2c_3',
            text: '被守军发现——被女儿国守军发现，押回王宫',
            effect: { evil: 5 },
            next_stage: null,
            flag: 'captured'
          }
        ]
      }
    ],
    // 最终抉择
    final_choices: [
      {
        id: 'final_yuan',
        text: '缘·羁绊——接受国王情意，留下一段姻缘',
        fate: '缘',
        effect: { good: 30, ti: { hp: 200 } },
        ending: '你接受了国王的情意，在女儿国留下了一段姻缘。国王赠你"女儿国国王的信物"，说："御弟哥哥，你若回来，我便还在。"你带着信物继续西行，身后是女儿国的桃花。'
      },
      {
        id: 'final_du',
        text: '渡·渡人向善——点化国王，让她明白"情爱皆空"',
        fate: '渡',
        effect: { good: 40, yuan: { matk: 20 } },
        ending: '你点化了国王，让她明白"情爱皆空"。国王弃国修行，成为一代高僧。她送你出城时说："御弟哥哥，原来渡人，比留人更难。"你合掌称谢，继续西行。'
      },
      {
        id: 'final_yin',
        text: '隐·避锋修心——不告而别，偷偷离开女儿国',
        fate: '隐',
        effect: { ti: { spd: 5, eva: 0.05 } },
        ending: '你不告而别，偷偷离开了女儿国。国王发现后相思成疾，派追兵前来。你躲过了追兵，但心里总觉得欠了她什么。多年后你才明白，有些债，不是用经文能还的。'
      },
      {
        id: 'final_ni',
        text: '逆·跳出簿子——留在女儿国，与国王成亲，放弃取经',
        fate: '逆',
        effect: { evil: 30, ti: { hp: 300 } },
        ending: '你留在了女儿国，与国王成亲，放弃了取经。你成了女儿国的国王，过着锦衣玉食的生活。但每到夜深人静，你总会想起五行山下的那朵野花，和那个还在等你取经的人。'
      }
    ],
    // 结局映射
    endings: {
      'revealed_accepted_final_yuan': '你公开身份，接受了国王的招亲。你们在女儿国举行了盛大的婚礼，满城桃花为你们盛开。国王说："御弟哥哥，从今往后，你便是我女儿国的王。"你握着她的手，忽然觉得这人间的温暖，比灵山的佛光，更真实。',
      'revealed_refused_final_du': '你公开身份，婉拒了国王的招亲。你点化了国王，让她明白"情爱皆空"。国王弃国修行，送你出城时说："御弟哥哥，原来渡人，比留人更难。"你合掌称谢，继续西行。',
      'hidden_deceived_final_ni': '你隐瞒身份，将计就计欺骗了国王。你盗取了通关文牒，却被国王的真情感动，最终选择留在女儿国。但你知道，这份感情，从一开始就是谎言。',
      'detour_kept_child_final_yuan': '你绕道而行，误饮子母河水，决定留下孩子。你带着孩子继续取经，国王得知后派人送来信物，说："御弟哥哥，这孩子，也算我半个儿。"你带着孩子和信物继续西行，身后是女儿国的祝福。',
      'detour_sought_water_final_yin': '你绕道而行，误饮子母河水，求取了落胎泉水。你不告而别，偷偷离开了女儿国。国王发现后相思成疾，但你已经走远。你摸着平坦的肚子，忽然觉得这肚子里的生命，和你自己，一样无辜。'
    }
  },

  // ============================================================
  // 火云洞复合劫难（难23-27）
  // ============================================================
  huoyundong: {
    id: 'huoyundong',
    name: '火云洞·三昧真火',
    title: '第23-27难 · 火云洞·红孩儿',
    icon: '🔥',
    trials: [23, 24, 25, 26, 27],
    stages: [
      {
        id: 'stage1',
        name: '初遇红孩儿',
        text: '火云洞红孩儿吐三昧真火，火里映出你大闹天宫的旧影。他说："你当年的火，可比我纯。"这孩子是牛魔王与罗刹女的儿子，父母忙着争地盘，把他丢在洞里自己长大——他吐的火，烧的其实是没人管他的委屈。你看着那点红痣，竟有点怜他。',
        opts: [
          {
            id: 's1_a',
            text: '以力降服——直接与红孩儿战斗，用武力降服他',
            effect: { ti: { atk: 15 }, evil: 5 },
            next_stage: 'stage2_a',
            flag: 'force'
          },
          {
            id: 's1_b',
            text: '以智取胜——用计谋对付红孩儿，不与他正面硬拼',
            effect: { ti: { spd: 3 } },
            next_stage: 'stage2_b',
            flag: 'wisdom'
          },
          {
            id: 's1_c',
            text: '以情感化——试图用亲情感化红孩儿，让他弃恶从善',
            effect: { good: 10 },
            next_stage: 'stage2_c',
            flag: 'emotion'
          }
        ]
      },
      // 阶段2A：以力降服后的深入
      {
        id: 'stage2_a',
        name: '三昧真火',
        text: '你与红孩儿战斗，他吐出三昧真火，火势凶猛，你竟一时难以抵挡。这火不是凡火，是他修炼了三百年的心头火——烧的是他对父母的怨恨，对世界的不满。你在火中翻滚，忽然想起五百年前大闹天宫时，你也烧过这样的火。',
        opts: [
          {
            id: 's2a_1',
            text: '硬抗真火——用肉身硬抗三昧真火，证明自己的道',
            effect: { ti: { atk: 25, hp: 50 }, evil: 10 },
            next_stage: null,
            flag: 'endured'
          },
          {
            id: 's2a_2',
            text: '请龙降雨——请来东海龙王，用雨水灭火',
            effect: { good: 5, ti: { hp: 80 } },
            next_stage: null,
            flag: 'dragon_rain'
          },
          {
            id: 's2a_3',
            text: '钻入肚中——变作小虫，钻入红孩儿肚中',
            effect: { ti: { atk: 20, spd: 5 }, evil: 15 },
            next_stage: null,
            flag: 'inside'
          }
        ]
      },
      // 阶段2B：以智取胜后的深入
      {
        id: 'stage2_b',
        name: '假扮牛魔王',
        text: '你用计谋对付红孩儿，决定假扮牛魔王，骗他出来。红孩儿果然上当，对着"牛魔王"哭诉自己的委屈："爹，你和娘都不管我，我一个人在这洞里，烧了三百年的火，也没人来看我一眼。"你听着他的哭诉，忽然觉得这孩子，和当年被压在五行山下的你，一样孤独。',
        opts: [
          {
            id: 's2b_1',
            text: '将计就计——继续假扮牛魔王，骗取三昧真火的修炼法门',
            effect: { equip: 2, evil: 20 },
            next_stage: null,
            flag: 'stole_art'
          },
          {
            id: 's2b_2',
            text: '激将法——利用红孩儿的好胜心，激他与你比试',
            effect: { ti: { atk: 15, spd: 3 } },
            next_stage: null,
            flag: 'provoked'
          },
          {
            id: 's2b_3',
            text: '真情流露——不再假扮，告诉红孩儿真相，触动他',
            effect: { good: 20, ti: { hp: 100 } },
            next_stage: null,
            flag: 'truth'
          }
        ]
      },
      // 阶段2C：以情感化后的深入
      {
        id: 'stage2_c',
        name: '牛魔王夫妇',
        text: '你试图用亲情感化红孩儿，决定请来牛魔王和铁扇公主。牛魔王来了，看着红孩儿说："儿啊，爹和娘忙着争地盘，忽略了你。"铁扇公主抱着红孩儿哭："我的儿，娘对不起你。"红孩儿看着父母，眼里的火，渐渐灭了。',
        opts: [
          {
            id: 's2c_1',
            text: '父子相认——让牛魔王与红孩儿父子相认，化解恩怨',
            effect: { good: 25, ti: { hp: 150 } },
            next_stage: null,
            flag: 'father_son'
          },
          {
            id: 's2c_2',
            text: '母子团圆——让铁扇公主与红孩儿母子团圆，温暖他的心',
            effect: { good: 30, yuan: { matk: 15 } },
            next_stage: null,
            flag: 'mother_son'
          },
          {
            id: 's2c_3',
            text: '讲述往事——讲述五百年前大闹天宫的往事，触动红孩儿',
            effect: { good: 15, ti: { atk: 10, hp: 80 } },
            next_stage: null,
            flag: 'past_story'
          }
        ]
      }
    ],
    // 最终抉择
    final_choices: [
      {
        id: 'final_war',
        text: '战·以力破劫——请来观音，用金箍降服红孩儿',
        fate: '战',
        effect: { ti: { atk: 30 }, good: 10 },
        ending: '你请来观音，用金箍降服了红孩儿。红孩儿成为善财童子，在观音座下修行。他临走时说："猴子，谢谢你。"你看着他离去的背影，忽然觉得这孩子，和当年被压在五行山下的你，一样需要被人看见。'
      },
      {
        id: 'final_yuan',
        text: '缘·羁绊——认红孩儿为义子，带他一起取经',
        fate: '缘',
        effect: { good: 35, ti: { hp: 200, atk: 20 } },
        ending: '你认红孩儿为义子，带他一起取经。红孩儿成为你的随行弟子，战斗中为你提供三昧真火的援助。他叫你"义父"，你叫他"红儿"。多年后你才明白，有些缘分，不是用经文能算清的。'
      },
      {
        id: 'final_du',
        text: '渡·渡人向善——点化红孩儿，让他明白"真火非火，是心"',
        fate: '渡',
        effect: { good: 40, yuan: { matk: 25 } },
        ending: '你点化了红孩儿，让他明白"真火非火，是心"。红孩儿弃妖从善，在火云洞修行，成为一代高僧。他送你出城时说："猴子，原来渡人，比烧人更难。"你合掌称谢，继续西行。'
      },
      {
        id: 'final_ni',
        text: '逆·跳出簿子——传授红孩儿大闹天宫的本事，让他反出天庭',
        fate: '逆',
        effect: { evil: 40, ti: { atk: 40, hp: 150 } },
        ending: '你传授红孩儿大闹天宫的本事，让他反出天庭。红孩儿成为新一代妖王，号称"圣婴大王"，天庭震怒，派十万天兵天将围剿。你看着红孩儿在天庭上大闹的身影，忽然觉得这孩子，和五百年前的你，一模一样。'
      }
    ],
    // 结局映射
    endings: {
      'force_endured_final_war': '你硬抗三昧真火，又请来观音降服红孩儿。红孩儿成为善财童子，临走时说："猴子，你比我狠。"你看着他离去的背影，身上的烧伤还在疼，但你知道，这孩子，终于被人看见了。',
      'wisdom_truth_final_du': '你假扮牛魔王，却被红孩儿的真情感动，选择告诉他真相。你点化了红孩儿，让他明白"真火非火，是心"。红孩儿弃妖从善，送你出城时说："猴子，原来渡人，比烧人更难。"',
      'emotion_father_son_final_yuan': '你请来牛魔王，让他们父子相认。你认红孩儿为义子，带他一起取经。红孩儿叫你"义父"，牛魔王叫你"兄弟"。你看着这父子俩，忽然觉得这人间的温暖，比灵山的佛光，更真实。',
      'emotion_mother_son_final_du': '你请来铁扇公主，让他们母子团圆。你点化了红孩儿，让他弃妖从善。铁扇公主送你一把芭蕉扇说："猴子，谢谢你。"你接过芭蕉扇，继续西行，身后是火云洞的烟火。',
      'wisdom_stole_art_final_ni': '你假扮牛魔王，骗取了三昧真火的修炼法门。你传授红孩儿大闹天宫的本事，让他反出天庭。红孩儿成为新一代妖王，天庭震怒。你看着红孩儿大闹天庭的身影，忽然觉得这孩子，和五百年前的你，一模一样。'
    }
  }
};

// ============================================================
// 复合劫难状态管理
// ============================================================
NDX.CompoundState = {
  // 当前复合劫难ID
  current: null,
  // 当前阶段ID
  current_stage: null,
  // 已选择的标记
  flags: {},
  // 已选择的选项历史
  history: [],

  // 初始化复合劫难
  init: function(compoundId) {
    this.current = compoundId;
    this.current_stage = 'stage1';
    this.flags = {};
    this.history = [];
  },

  // 选择选项
  choose: function(optId) {
    var compound = NDX.COMPOUND_STORY[this.current];
    if (!compound) return null;

    // 查找当前阶段
    var stage = null;
    for (var i = 0; i < compound.stages.length; i++) {
      if (compound.stages[i].id === this.current_stage) {
        stage = compound.stages[i];
        break;
      }
    }
    if (!stage) return null;

    // 查找选项
    var opt = null;
    for (var j = 0; j < stage.opts.length; j++) {
      if (stage.opts[j].id === optId) {
        opt = stage.opts[j];
        break;
      }
    }
    if (!opt) return null;

    // 记录选择
    this.history.push({
      stage: this.current_stage,
      opt: optId,
      flag: opt.flag
    });

    // 设置标记
    if (opt.flag) {
      this.flags[opt.flag] = true;
    }

    // 应用即时效果
    if (opt.effect) {
      this.applyEffect(opt.effect);
    }

    // 返回下一阶段或最终抉择
    if (opt.next_stage) {
      this.current_stage = opt.next_stage;
      return { type: 'stage', stage: this.current_stage };
    } else {
      return { type: 'final', choices: compound.final_choices };
    }
  },

  // 最终抉择
  finalChoose: function(choiceId) {
    var compound = NDX.COMPOUND_STORY[this.current];
    if (!compound) return null;

    // 查找抉择
    var choice = null;
    for (var i = 0; i < compound.final_choices.length; i++) {
      if (compound.final_choices[i].id === choiceId) {
        choice = compound.final_choices[i];
        break;
      }
    }
    if (!choice) return null;

    // 记录选择
    this.history.push({
      stage: 'final',
      opt: choiceId,
      fate: choice.fate
    });

    // 应用效果
    if (choice.effect) {
      this.applyEffect(choice.effect);
    }

    // 生成结局描述
    var ending = this.getEnding(choiceId);

    return {
      type: 'ending',
      fate: choice.fate,
      ending: ending,
      choice: choice
    };
  },

  // 获取结局描述
  getEnding: function(choiceId) {
    var compound = NDX.COMPOUND_STORY[this.current];
    if (!compound) return '';

    // 生成结局key（根据阶段标记和最终抉择）
    var flags = Object.keys(this.flags);
    var key = flags.join('_') + '_' + choiceId;

    // 查找特定结局
    if (compound.endings && compound.endings[key]) {
      return compound.endings[key];
    }

    // 查找部分匹配的结局
    for (var endingKey in compound.endings) {
      if (compound.endings.hasOwnProperty(endingKey)) {
        var parts = endingKey.split('_');
        var choicePart = parts[parts.length - 1];
        if (choicePart === choiceId) {
          return compound.endings[endingKey];
        }
      }
    }

    // 默认结局
    var choice = null;
    for (var i = 0; i < compound.final_choices.length; i++) {
      if (compound.final_choices[i].id === choiceId) {
        choice = compound.final_choices[i];
        break;
      }
    }
    return choice ? choice.ending : '';
  },

  // 应用效果
  applyEffect: function(effect) {
    // 这里需要与游戏的状态系统对接
    // 暂时只记录效果
    console.log('应用效果:', effect);
  },

  // 重置状态
  reset: function() {
    this.current = null;
    this.current_stage = null;
    this.flags = {};
    this.history = [];
  }
};

console.log('[data_compound_story.js] 复合劫难多阶段剧情系统已加载');
