// 给 ELITE_TABLE 添加 generic 字段
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'js', 'enemies_part2.js');
let content = fs.readFileSync(file, 'utf8');

// 精英 generic 配置（精英额外加 elite 装饰）
const eliteGeneric = {
  '黄风卷岭': { model: 'beast', color: 'yao', weapon: 'fan', cast: 'wind', elite: { cloak: true } },
  '高老招亲': { model: 'beast', color: 'yao', weapon: 'staff', elite: { armor: true } },
  '金角银角': { model: 'humanoid', color: 'yao', weapon: 'treasure', elite: { aura: true } },
  '乌巢禅师': { model: 'humanoid', color: 'fo', weapon: 'staff', elite: { aura: true } },
  '狮驼初现': { model: 'beast', color: 'yao', weapon: 'spear', elite: { armor: true, cloak: true } },
  '金兜洞·青牛精': { model: 'beast', color: 'yao', weapon: 'treasure', elite: { armor: true } },
  '白虎岭·白骨精': { model: 'ghost', color: 'gui', weapon: 'claw', elite: { aura: true } },
  '碗子山·黄袍怪': { model: 'beast', color: 'yao', weapon: 'blade', elite: { cloak: true } },
  '乌鸡国·青毛狮': { model: 'beast', color: 'yao', weapon: 'spear', elite: { armor: true } },
  '毒敌山·蝎子精': { model: 'humanoid', color: 'chong', weapon: 'claw', cast: 'poison', elite: { aura: true } },
  '火焰山·铁扇公主': { model: 'humanoid', color: 'yao', weapon: 'fan', cast: 'wind', elite: { cloak: true, aura: true } },
  '祭赛国·九头虫': { model: 'aquatic', color: 'shui', weapon: 'spear', cast: 'water', elite: { armor: true } },
};

let count = 0;
for (const [key, g] of Object.entries(eliteGeneric)) {
  // 匹配精英定义行：'key': { name: 'key', diff: ..., tags: [...],
  // 在 tags: [...] 后面插入 generic
  const pattern = new RegExp("('" + key.replace(/[·]/g, '\\$&') + "':\\s*\\{[^}]*?tags:\\s*\\[[^\\]]*\\])", 's');
  const gStr = JSON.stringify(g).replace(/"([^"]+)":/g, '$1:');
  if (pattern.test(content)) {
    content = content.replace(pattern, '$1, generic: ' + gStr);
    count++;
  } else {
    console.log(`WARN: 未找到 ${key}`);
  }
}

fs.writeFileSync(file, content, 'utf8');
console.log(`已给 ${count} 个精英添加 generic 字段`);
