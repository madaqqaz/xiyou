// 批量给 MOB_TYPES 添加 generic 字段
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'js', 'enemies_part1.js');
let content = fs.readFileSync(file, 'utf8');

// 推断函数
function inferGeneric(name, tags) {
  const tag0 = tags[0] || '妖';
  const colorMap = { '妖':'yao','鬼':'gui','水':'shui','火':'huo','木':'mu','虫':'chong','人':'ren','佛门':'fo','魔':'mo' };
  const color = colorMap[tag0] || 'yao';

  // model 推断
  let model = 'humanoid';
  if (/水|鱼|虾|蟹|蛟|龙|河|渊|蚌|龟/.test(name)) model = 'aquatic';
  else if (/鬼|魂|骷髅|亡灵|冤|夜叉/.test(name)) model = 'ghost';
  else if (/虎|狼|熊|牛|狮|象|兽|山魈|鼠|貂|狐|鹿|羊|豹|豺|犬|猪/.test(name)) model = 'beast';

  // weapon 推断
  let weapon = 'blade';
  if (/枪|矛|戟/.test(name)) weapon = 'spear';
  else if (/杖|棍|棒|禅/.test(name)) weapon = 'staff';
  else if (/爪|钩|擒/.test(name)) weapon = 'claw';
  else if (/锤|锏|锤/.test(name)) weapon = 'hammer';
  else if (/弓|箭|射/.test(name)) weapon = 'bow';
  else if (/扇|法|道|巫/.test(name)) weapon = 'fan';
  else if (/宝|葫芦|瓶|琢|珠/.test(name)) weapon = 'treasure';

  // cast 推断
  let cast = null;
  if (/火|喷|炎|烧/.test(name) || tag0 === '火') cast = 'fire';
  else if (/风|吹|沙|卷/.test(name)) cast = 'wind';
  else if (tag0 === '水' || /水|浪|潮/.test(name)) cast = 'water';
  else if (/毒|瘴|疫/.test(name)) cast = 'poison';
  else if (/雷|电|劈/.test(name)) cast = 'thunder';
  else if (/石|岩|砸|土/.test(name)) cast = 'rock';

  const g = { model, color, weapon };
  if (cast) g.cast = cast;
  return g;
}

// 用正则替换每条怪物定义
// 匹配 { name: 'xxx', tags: ['yyy'] } 形式
const regex = /\{\s*name:\s*'([^']+)',\s*tags:\s*\[([^\]]+)\]\s*\}/g;

let count = 0;
content = content.replace(regex, (match, name, tagsStr) => {
  const tags = tagsStr.match(/'([^']+)'/g).map(s => s.replace(/'/g, ''));
  const g = inferGeneric(name, tags);
  const gStr = JSON.stringify(g).replace(/"([^"]+)":/g, '$1:');
  count++;
  return `{ name: '${name}', tags: [${tagsStr}], generic: ${gStr} }`;
});

fs.writeFileSync(file, content, 'utf8');
console.log(`已给 ${count} 条怪物添加 generic 字段`);
