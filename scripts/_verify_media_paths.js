#!/usr/bin/env node
'use strict';
/*
 * _verify_media_paths.js — 「媒体资源路径一致性」静态门禁
 * ---------------------------------------------------------------
 * 背景（V9.50）：实测发现多处「代码引用了仓库里根本不存在的媒体文件」，
 * 造成运行期 404（不崩，但刷 console 错误、污染网络层、掩盖真实故障）：
 *   1) js/sound.js   BGM_FILES 全指向 *_seed.wav（磁盘只有 *_ai.ogg / 裸名.ogg）；
 *   2) js/sound.js   SFX_FILES 声明 20+ 条 sfx_*.wav（磁盘只有 3 个 .mp3）；
 *   3) js/sound.js   AMBIENT_FILES 六个 ambient_*.wav 全缺；
 *   4) js/intro_video.js  bgm=audio/intro_bgm.mp3、旁白 intro_voice_0*.mp3 全缺；
 *   5) js/ui/ui_panel_2.js 宠物战斗立绘按 pet_<id>_<state>.webp 拼路径，与美术实际命名不符。
 * 本门禁把这些资源表「就地扫出来」，逐条断言文件真实存在（含宠物三态齐备），
 * 一旦有人再写死路径 / 改名漏改，立即红灯。
 *
 * 通过标准：全部断言通过 → exit 0；任一失败 → exit 1。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, extra) {
  if (cond) { pass++; } else { fail++; fails.push(name + (extra ? '  → ' + extra : '')); }
}

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
// 去掉行注释，避免把「已注释停用」的配置误判成引用（如 intro voiceovers 的注释行）
function stripComments(src) {
  return src.split(/\r?\n/).map(l => l.split('//')[0]).join('\n');
}
// 从 `marker` 起、到其后第一个 `endMark` 之间的文本块
function block(src, marker, endMark) {
  const i = src.indexOf(marker);
  if (i < 0) return null;
  const j = src.indexOf(endMark, i + marker.length);
  if (j < 0) return null;
  return src.slice(i, j);
}
// 抽出块内所有引号字符串
function quoted(s) {
  const out = [];
  const re = /['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(s))) out.push(m[1]);
  return out;
}
function mediaPaths(s) { return quoted(s).filter(p => /\.(wav|mp3|ogg|mp4)$/i.test(p)); }

// ---------- 1. sound.js：BGM / SFX / AMBIENT ----------
const soundSrc = stripComments(read('js/sound.js'));

const bgmBlock = block(soundSrc, 'const BGM_FILES = {', '};');
ok('sound.js 可解析 BGM_FILES 块', !!bgmBlock);
const bgmPaths = bgmBlock ? mediaPaths(bgmBlock) : [];
ok('BGM_FILES 命中 10 个场景', bgmPaths.length === 10, 'got=' + bgmPaths.length);
bgmPaths.forEach(p => ok('BGM 文件存在: ' + p, exists(p)));
bgmPaths.forEach(p => ok('BGM 不用未入库的 _seed.wav: ' + p, p.indexOf('_seed.wav') < 0));

const sfxBlock = block(soundSrc, 'const SFX_FILES = {', '};');
ok('sound.js 可解析 SFX_FILES 块', !!sfxBlock);
const sfxPaths = sfxBlock ? mediaPaths(sfxBlock) : [];
ok('SFX_FILES 登记真实入库音效（>=3，防注册崩空）', sfxPaths.length >= 3, 'got=' + sfxPaths.length);
sfxPaths.forEach(p => ok('SFX 文件存在: ' + p, exists(p)));
ok('SFX_FILES 全部指向真实文件（无 404 死路径）', sfxPaths.every(p => exists(p)), sfxPaths.filter(p => !exists(p)).join(','));

const ambBlock = block(soundSrc, 'const AMBIENT_FILES = {', '};');
ok('sound.js 可解析 AMBIENT_FILES 块', !!ambBlock);
const ambPaths = ambBlock ? mediaPaths(ambBlock) : [];
ok('AMBIENT_FILES 命中 6 条环境音', ambPaths.length === 6, 'got=' + ambPaths.length);
// 环境音文件当前未入库 → 由 AMBIENT_USE_FILES=false 保证不发请求；门禁只断言开关存在且为 false
ok('存在 AMBIENT_USE_FILES 开关', /const AMBIENT_USE_FILES\s*=\s*(true|false)\s*;/.test(soundSrc));
ok('AMBIENT_USE_FILES=true 时环境音须全部入库（否则置 false 防 404）', !/const AMBIENT_USE_FILES\s*=\s*true\s*;/.test(soundSrc) || ambPaths.every(p => exists(p)));
const ambMissing = ambPaths.filter(p => !exists(p));
ok('AMBIENT 文件缺失时开关必须为 false', ambMissing.length === 0 || /AMBIENT_USE_FILES\s*=\s*false/.test(soundSrc), 'missing=' + ambMissing.join(','));

// ---------- 2. intro_video.js：BGM / 旁白 / 视频段 ----------
const introSrc = stripComments(read('js/intro_video.js'));
const introMedia = mediaPaths(introSrc);
introMedia.forEach(p => ok('intro_video 引用文件存在: ' + p, exists(p)));
ok('intro_video BGM 已指向入库文件', /url:\s*'audio\/main_menu_bgm\.mp3'/.test(introSrc));
ok('intro_video 已停用未入库旁白(无 intro_voice_ 引用)', introSrc.indexOf('intro_voice_') < 0);

// ---------- 3. mp3_player.js：audio/ 目录曲目 ----------
const mp3Src = stripComments(read('js/audio/mp3_player.js'));
const dirMatch = mp3Src.match(/AUDIO_DIR\s*=\s*'([^']+)'/);
const audioDir = dirMatch ? dirMatch[1] : 'audio/';
const mp3Files = (mp3Src.match(/file:\s*'([^']+)'/g) || []).map(s => s.replace(/^file:\s*'/, '').replace(/'$/, ''));
ok('mp3_player 解析到曲目列表', mp3Files.length > 0, 'got=' + mp3Files.length);
mp3Files.forEach(f => ok('mp3_player 曲目存在: ' + audioDir + f, exists(audioDir + f)));

// ---------- 4. 宠物战斗立绘：三态齐备 ----------
const heroSrc = stripComments(read('js/data_heroes_data.js'));
const artBlock = block(heroSrc, 'NDX.PET_COMBAT_ART = {', '};');
const heroPetBlock = block(heroSrc, 'NDX.HERO_PET_ART = {', '};');
ok('data_heroes_data 可解析 PET_COMBAT_ART', !!artBlock);
ok('data_heroes_data 可解析 HERO_PET_ART', !!heroPetBlock);
const artKeys = artBlock ? [...new Set(quoted(artBlock))] : [];
const heroArtValues = heroPetBlock ? quoted(heroPetBlock).filter(k => k.indexOf('pet_') === 0) : [];
// 每个英雄 id 都应有本命灵宠映射（HEROES 的 5 位：wukong/tangseng/bajie/xiaobailong/shaseng）
['wukong', 'tangseng', 'bajie', 'xiaobailong', 'shaseng'].forEach(h =>
  ok('HERO_PET_ART 覆盖英雄: ' + h, !!heroPetBlock && new RegExp('\\b' + h + '\\s*:').test(heroPetBlock)));
ok('PET_COMBAT_ART 至少 5 组', artKeys.length >= 5, 'got=' + artKeys.length);
['idle', 'atk', 'hit'].forEach(state => {
  artKeys.forEach(k => ok('宠物立绘存在: ' + k + '_' + state + '.webp', exists('img/portraits/pets/' + k + '_' + state + '.webp')));
});
// HERO_PET_ART 的每个取值都必须是 PET_COMBAT_ART 的合法键（避免英雄映射挂空）
const artKeySet = new Set(artKeys);
heroArtValues.forEach(k => ok('HERO_PET_ART 值已在 PET_COMBAT_ART 登记: ' + k, artKeySet.has(k)));

// ---------- 5. ui_panel_2.js：不得再私自拼死路径 ----------
const uiSrc = read('js/ui/ui_panel_2.js');
ok('ui_panel_2 宠物立绘改走 NDX.petCombatArtKey', uiSrc.indexOf('petCombatArtKey') >= 0);
ok('ui_panel_2 已移除 pet_<id>_<state> 硬拼路径', uiSrc.indexOf("'img/portraits/pets/pet_' + _petId") < 0);

// ---------- 汇总 ----------
console.log('媒体路径一致性门禁：' + pass + ' 通过 / ' + fail + ' 失败');
if (fail) { console.log('—— 失败项 ——'); console.log(fails.join('\n')); process.exit(1); }
process.exit(0);
