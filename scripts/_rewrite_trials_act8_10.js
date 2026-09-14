// _rewrite_trials_act8_10.js — 按《六道抉择》范式 + 《八十一难_调整提案_第二批》重撰 31~45 难选项
// 规格：① 去【六道】前缀（隐藏标签，fate 后台累加）② 每选项显式 alignGood/alignEvil（战/隐按后果手写）
//      ③ 复合节点按「渡/逆双主轴 + 战/夺/隐混合」④ 逆选项标 ni:true 供连续触发链记账
//      ⑤ 38/39 真交换 ID（连带 hidden/echo 迁移）
// 用法：node scripts/_rewrite_trials_act8_10.js [--dry]
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'js', 'trials81.js');
const DRY = process.argv.includes('--dry');

// 新选项体（内部行，6 空格缩进，每行自带尾逗号）
const NEWOPT = {
  31: [
    `      { key: '战', label: '一棒破三妖，斩断香火神位', fate: '战', fight: true, effect: { alignEvil: 10 } },`,
    `      { key: '渡', label: '点破三妖，令其归正', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '逆', label: '反借香火，反噬三妖', fate: '逆', ni: true, effect: { alignEvil: 6 } },`,
  ],
  // 32 通天河渔户：渡主轴（去「夺」——无 Boss 可抢的场景错配，见《六道抉择》§6.2）
  32: [
    `      { key: '渡', label: '设坛祈渡，解陈家庄厄', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '逆', label: '掀了祭桌——谁定的这规矩', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
    `      { key: '缘', label: '应诺代童入河，换那孩子一命', fate: '缘', effect: { alignGood: 6 } },`,
    `      { key: '战', label: '夜伏河畔，替这村守一夜', fate: '战', fight: true, effect: { alignGood: 4 } },`,
  ],
  33: [
    `      { key: '逆', label: '砸庙揭供，断它千年香火', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
    `      { key: '渡', label: '入庙说法，渡那池中金鱼', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '夺', label: '夺灵感庙金身，熔作路上盘缠', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '战', label: '引它出水，一战定这条河', fate: '战', fight: true, effect: { alignGood: 3 } },`,
  ],
  34: [
    `      { key: '隐', label: '贴冰潜行，听它凿到天亮', fate: '隐', effect: { alignGood: 2 } },`,
    `      { key: '渡', label: '诵经化冰，稳步过河', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '战', label: '踏冰呐喊，引它破冰一战', fate: '战', fight: true, effect: { alignGood: 3 } },`,
  ],
  // 35 金兜金刚：缘→渡 + 新增逆（第二批 §二）
  35: [
    `      { key: '战', label: '力战青牛，套尽神兵', fate: '战', fight: true, battleFlags: { openingMomentum: 1 }, effect: { alignGood: 3 } },`,
    `      { key: '夺', label: '趁乱夺琢，金兜归你', fate: '夺', effect: { alignEvil: 6 } },`,
    `      { key: '渡', label: '还琢论道，与老君共度青牛', fate: '渡', effect: { alignGood: 8 } },`,
    `      { key: '逆', label: '反掌夺牛，悖其本源', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
  ],
  36: [
    `      { key: '战', label: '翻江一战，擒那金鱼', fate: '战', fight: true, effect: { alignEvil: 10 } },`,
    `      { key: '渡', label: '以佛法渡之，收其归正', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '逆', label: '借其反噬，反掌降妖', fate: '逆', ni: true, effect: { alignEvil: 6 } },`,
  ],
  // 37 女儿国水：缘/夺 → 战/渡/逆（第二批 §三）
  37: [
    `      { key: '战', label: '硬闯泉眼，强行夺水', fate: '战', fight: true, effect: { alignEvil: 8 } },`,
    `      { key: '渡', label: '与其论法，劝真仙放行', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '逆', label: '倒转泉眼，破其守泉根本', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
  ],
  // 38 = 落胎泉·解阳山（原 39 内容，第二批 §四 交换后）
  38: [
    `      { key: '战', label: '夺泉一战，败如意真仙', fate: '战', fight: true, effect: { alignEvil: 8 } },`,
    `      { key: '渡', label: '以礼相求，请其解厄', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '逆', label: '夜取泉水，不告而取', fate: '逆', ni: true, effect: { alignEvil: 6 } },`,
  ],
  // 39 = 女王招亲（原 38 内容，含 hidden 弃经者迁移）
  39: [
    `      { key: '渡', label: '温柔辞别，留一纸通关', fate: '渡', effect: { alignGood: 15 } },`,
    `      { key: '逆', label: '揭穿她也是这国的囚徒', fate: '逆', ni: true, effect: { alignEvil: 10 } },`,
    `      { key: '夺', label: '夺通关文牒，连夜出城', fate: '夺', effect: { alignEvil: 6 } },`,
  ],
  // 40 蝎精摄僧：补逆（第二批 §五）
  40: [
    `      { key: '渡', label: '请昴日星官降之，以音破毒', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '战', label: '以力破法，强战琵琶精', fate: '战', fight: true, battleFlags: { openingMomentum: 1 }, effect: { alignEvil: 8 } },`,
    `      { key: '逆', label: '劝她弃邪西行，与你同路', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
  ],
  41: [
    `      { key: '缘', label: '暂不责罚，细观其行', fate: '缘', effect: { alignGood: 6 } },`,
    `      { key: '逆', label: '两皆杖责，逼其现形', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
    `      { key: '战', label: '棒喝二猴，试其真身', fate: '战', fight: true, effect: { alignEvil: 8 } },`,
  ],
  42: [
    `      { key: '缘', label: '慰沙僧，共商辨假之策', fate: '缘', effect: { alignGood: 6 } },`,
    `      { key: '渡', label: '念经问心，以心辨假', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '逆', label: '怒而遣散二猴，独自西行', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
    `      { key: '隐', label: '隐于云端，袖手观真假之争', fate: '隐', effect: { alignEvil: 4 } },`,
  ],
  43: [
    `      { key: '隐', label: '不再追问，听其言外', fate: '隐', effect: { alignGood: 2 } },`,
    `      { key: '渡', label: '请地藏开示，寻辨真法', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '逆', label: '逼谛听说破，不惜逆天', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
  ],
  44: [
    `      { key: '渡', label: '合掌谢如来，了却真假', fate: '渡', effect: { alignGood: 10 } },`,
    `      { key: '逆', label: '讥如来偏私，拂袖而去', fate: '逆', ni: true, effect: { alignEvil: 8 } },`,
    `      { key: '战', label: '一棒压那六耳，亲自收束', fate: '战', fight: true, effect: { alignEvil: 8 } },`,
    `      { key: '隐', label: '隐于莲座旁，听如来道破', fate: '隐', effect: { alignGood: 2 } },`,
  ],
  45: [
    `      { key: '战', label: '如来收六耳', fate: '战', fight: true, battleFlags: { openingMomentum: 1 }, effect: { alignEvil: 6 } },`,
    `      { key: '逆', label: '认下「你即我」', fate: '逆', ni: true, effect: { alignEvil: 15, d29Ni: true } },`,
    `      { key: '渡', label: '与六耳和解', fate: '渡', effect: { alignGood: 15 } },`,
  ],
};

let raw = fs.readFileSync(SRC, 'utf8');
const BOM = raw.charCodeAt(0) === 0xfeff ? '\uFEFF' : '';
if (BOM) raw = raw.slice(1);
const crlf = (raw.match(/\r\n/g) || []).length;
const lf = (raw.match(/\n/g) || []).length;
const EOL = crlf * 2 > lf ? '\r\n' : '\n';           // 众数行尾
const rawLF = raw.replace(/\r\n/g, '\n');
const lines = rawLF.split('\n');

// 块索引：^  NN: { id: NN,
const starts = [];
lines.forEach((l, i) => { const m = l.match(/^ {2}(\d+): \{ id: (\d+),/); if (m) starts.push({ id: +m[1], line: i }); });
starts.sort((a, b) => a.line - b.line);
const blockOf = {};
starts.forEach((s, i) => { const end = (i + 1 < starts.length) ? starts[i + 1].line : lines.length; blockOf[s.id] = end; });
if (Object.keys(blockOf).length < 45) { console.log('块定位异常：仅找到 ' + Object.keys(blockOf).length + ' 块'); process.exit(1); }

// —— 步骤 1：38/39 真交换（连带 id / echo 难号修正，hidden/intro/dark 随块迁移）——
function swap(a, b) {
  const ga = lines.slice(starts.find((s) => s.id === a).line, blockOf[a]);
  const gb = lines.slice(starts.find((s) => s.id === b).line, blockOf[b]);
  const fix = (g, from, to) => g.map((l) =>
    l.replace(new RegExp('^ {2}' + from + ': \\{ id: ' + from + ','), '  ' + to + ': { id: ' + to + ',')
     .replace(new RegExp('第' + from + '难'), '第' + to + '难'));
  return { na: fix(gb, b, a), nb: fix(ga, a, b) };
}
const { na, nb } = swap(38, 39);
const s38 = starts.find((s) => s.id === 38).line, s39 = starts.find((s) => s.id === 39).line;
const before = lines.slice(0, s38);
const after = lines.slice(blockOf[39]);
// 38 在 39 之前（顺序 32..38,39,40），中间无其它块
const mid = lines.slice(blockOf[38], s39);
if (mid.join('').trim()) { console.log('38/39 之间存在其它内容，中止：' + JSON.stringify(mid)); process.exit(1); }
lines.splice(s38, blockOf[39] - s38, ...na, ...nb);

// 交换后重算索引
starts.length = 0;
lines.forEach((l, i) => { const m = l.match(/^ {2}(\d+): \{ id: (\d+),/); if (m) starts.push({ id: +m[1], line: i }); });
starts.sort((a, b) => a.line - b.line);
Object.keys(blockOf).forEach((k) => delete blockOf[k]);
starts.forEach((s, i) => { const end = (i + 1 < starts.length) ? starts[i + 1].line : lines.length; blockOf[s.id] = end; });

// —— 步骤 2：逐难替换 options 子块（保留 dark/intro/hidden/treasure）——
const report = [];
Object.keys(NEWOPT).map(Number).sort((a, b) => a - b).forEach((id) => {
  const st = starts.find((s) => s.id === id);
  if (!st) { report.push('缺块 ' + id); return; }
  let oi = -1;
  for (let i = st.line; i < blockOf[id]; i++) { if (/^ {4}options: \[/.test(lines[i])) { oi = i; break; } }
  if (oi < 0) { report.push('缺 options ' + id); return; }
  // 方括号计数定位结束行
  let depth = 0, end = -1;
  for (let i = oi; i < blockOf[id]; i++) {
    for (const ch of lines[i]) { if (ch === '[') depth++; else if (ch === ']') depth--; }
    if (depth === 0) { end = i; break; }
  }
  if (end < 0) { report.push('options 未闭合 ' + id); return; }
  const body = ['    options: ['].concat(NEWOPT[id], ['    ],']);
  const oldN = end - oi + 1;
  lines.splice(oi, oldN, ...body);
  const delta = body.length - oldN;
  starts.forEach((s) => { if (s.line > oi) s.line += delta; });
  Object.keys(blockOf).forEach((k) => { if (blockOf[k] > oi) blockOf[k] += delta; });
  report.push('难' + id + ' 选项 ' + (oldN - 2) + '→' + NEWOPT[id].length);
});

const out = BOM + lines.join(EOL);
if (DRY) { report.forEach((r) => console.log(r)); console.log('--dry 未写盘'); process.exit(0); }
fs.writeFileSync(SRC, out, 'utf8');
report.forEach((r) => console.log(r));
console.log('已写盘 js/trials81.js');
