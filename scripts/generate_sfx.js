// generate_sfx.js - 使用Web Audio API生成游戏音效文件
// 运行方式：在浏览器中打开，或使用Node.js + web-audio-api

const fs = require('fs');
const path = require('path');

// 音效配置
const SFX_CONFIG = {
  // 战斗音效
  attack: { freq: 440, dur: 0.15, type: 'sawtooth', vol: 0.4, glide: 220, desc: '攻击挥砍' },
  hit: { freq: 180, dur: 0.12, type: 'triangle', vol: 0.5, overtone: 1.8, desc: '受击闷响' },
  crit: { freq: 880, dur: 0.2, type: 'square', vol: 0.35, overtone: 1.5, desc: '暴击爆发' },
  guard: { freq: 420, dur: 0.1, type: 'triangle', vol: 0.4, overtone: 2.1, desc: '格挡脆响' },
  dodge: { freq: 1200, dur: 0.1, type: 'sine', vol: 0.25, glide: 600, desc: '闪避高频下滑' },
  
  // 技能音效
  skill: { freq: 660, dur: 0.18, type: 'triangle', vol: 0.35, overtone: 1.5, desc: '技能释放' },
  ult: { freq: 294, dur: 0.4, type: 'triangle', vol: 0.45, overtone: 1.5, desc: '绝招爆发' },
  
  // 系统音效
  equip: { freq: 520, dur: 0.15, type: 'triangle', vol: 0.35, overtone: 2, desc: '装备获得' },
  seal: { freq: 440, dur: 0.2, type: 'sine', vol: 0.3, glide: 660, desc: '劫印获得' },
  heal: { freq: 523, dur: 0.2, type: 'sine', vol: 0.3, glide: 784, desc: '治疗上行' },
  poison: { freq: 220, dur: 0.25, type: 'sawtooth', vol: 0.2, glide: 110, desc: '中毒低频下行' },
  reflect: { freq: 330, dur: 0.12, type: 'square', vol: 0.3, overtone: 1.5, desc: '反伤' },
  levelup: { freq: 523, dur: 0.5, type: 'sine', vol: 0.4, desc: '升级四连上行' },
  collect: { freq: 700, dur: 0.12, type: 'sine', vol: 0.3, glide: 1050, desc: '收集' },
  treasure: { freq: 1000, dur: 0.2, type: 'sine', vol: 0.35, overtone: 1.5, desc: '宝藏发现' },
  warn: { freq: 330, dur: 0.2, type: 'square', vol: 0.25, glide: 220, desc: '警告双声' },
  hover: { freq: 880, dur: 0.05, type: 'sine', vol: 0.12, desc: '按钮悬停' },
  victory: { freq: 523, dur: 0.5, type: 'sine', vol: 0.4, desc: '胜利三连上行' },
  defeat: { freq: 220, dur: 0.5, type: 'sawtooth', vol: 0.25, glide: 110, desc: '失败下沉低鸣' },
  lifewarn: { freq: 440, dur: 0.15, type: 'square', vol: 0.25, glide: 330, desc: '生命警告' },
  roll: { freq: 900, dur: 0.3, type: 'square', vol: 0.15, desc: '骰子滚动' },
  open: { freq: 520, dur: 0.15, type: 'sine', vol: 0.35, glide: 880, desc: '展卷开启' },
};

// 环境音配置
const AMBIENT_CONFIG = {
  wind: { type: 'noise', dur: 3, vol: 0.15, filter: 'lowpass', freq: 400, desc: '风声' },
  rain: { type: 'noise', dur: 3, vol: 0.2, filter: 'highpass', freq: 1000, desc: '雨声' },
  bell: { freq: 880, dur: 2, type: 'sine', vol: 0.3, decay: true, desc: '寺庙钟声' },
  fire: { type: 'noise', dur: 3, vol: 0.18, filter: 'bandpass', freq: 800, q: 2, desc: '火焰' },
  water: { type: 'noise', dur: 3, vol: 0.15, filter: 'lowpass', freq: 600, desc: '水流' },
  bird: { freq: 2000, dur: 0.3, type: 'sine', vol: 0.15, glide: 3000, desc: '鸟鸣' },
};

// 生成WAV文件
function generateWAV(samples, sampleRate = 44100) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  
  // WAV头
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // 单声道
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  
  // 采样数据
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(sample * 32767, 44 + i * 2);
  }
  
  return buffer;
}

// 生成振荡器采样
function generateOscillator(config, sampleRate = 44100) {
  const length = Math.floor(config.dur * sampleRate);
  const samples = new Float32Array(length);
  
  const freq = config.freq || 440;
  const type = config.type || 'sine';
  const vol = config.vol || 0.3;
  const glide = config.glide || null;
  const overtone = config.overtone || null;
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const progress = i / length;
    
    // 频率滑动
    let currentFreq = freq;
    if (glide) {
      currentFreq = freq + (glide - freq) * progress;
    }
    
    // 包络（ADSR简化版）
    let envelope = 1;
    if (progress < 0.05) {
      envelope = progress / 0.05; // Attack
    } else if (progress > 0.7) {
      envelope = 1 - (progress - 0.7) / 0.3; // Release
    }
    
    // 振荡器波形
    let sample = 0;
    const phase = 2 * Math.PI * currentFreq * t;
    
    switch (type) {
      case 'sine':
        sample = Math.sin(phase);
        break;
      case 'square':
        sample = Math.sin(phase) > 0 ? 1 : -1;
        break;
      case 'sawtooth':
        sample = 2 * (t * currentFreq - Math.floor(t * currentFreq + 0.5));
        break;
      case 'triangle':
        sample = 2 * Math.abs(2 * (t * currentFreq - Math.floor(t * currentFreq + 0.5))) - 1;
        break;
    }
    
    // 泛音
    if (overtone) {
      sample += 0.4 * Math.sin(phase * overtone);
    }
    
    samples[i] = sample * vol * envelope;
  }
  
  return samples;
}

// 生成噪声采样
function generateNoise(config, sampleRate = 44100) {
  const length = Math.floor(config.dur * sampleRate);
  const samples = new Float32Array(length);
  
  const vol = config.vol || 0.2;
  
  for (let i = 0; i < length; i++) {
    samples[i] = (Math.random() * 2 - 1) * vol;
  }
  
  return samples;
}

// 生成多音符音效（如胜利、升级等）
function generateMultiNote(config, sampleRate = 44100) {
  const notes = [];
  
  if (config.name === 'victory') {
    // 胜利三连上行
    notes.push({ freq: 523, start: 0, dur: 0.16, vol: 0.3 });
    notes.push({ freq: 659, start: 0.13, dur: 0.16, vol: 0.32 });
    notes.push({ freq: 784, start: 0.26, dur: 0.28, vol: 0.36, glide: 1046 });
  } else if (config.name === 'levelup') {
    // 升级四连上行
    notes.push({ freq: 523, start: 0, dur: 0.12, vol: 0.28 });
    notes.push({ freq: 659, start: 0.1, dur: 0.12, vol: 0.3 });
    notes.push({ freq: 784, start: 0.2, dur: 0.12, vol: 0.32 });
    notes.push({ freq: 1046, start: 0.3, dur: 0.24, vol: 0.36, glide: 1318 });
  } else if (config.name === 'roll') {
    // 骰子滚动
    notes.push({ freq: 900, start: 0, dur: 0.05, vol: 0.12, glide: 300 });
    notes.push({ freq: 1200, start: 0.09, dur: 0.05, vol: 0.12, glide: 400 });
    notes.push({ freq: 740, start: 0.18, dur: 0.18, vol: 0.4, type: 'triangle' });
  } else if (config.name === 'warn') {
    // 警告双声
    notes.push({ freq: 330, start: 0, dur: 0.15, vol: 0.18, glide: 220, type: 'square' });
    notes.push({ freq: 330, start: 0.2, dur: 0.15, vol: 0.18, glide: 220, type: 'square' });
  } else if (config.name === 'ult') {
    // 绝招
    notes.push({ freq: 294, start: 0, dur: 0.3, vol: 0.4, type: 'triangle', overtone: 1.5 });
    notes.push({ freq: 880, start: 0, dur: 0.16, vol: 0.3, type: 'square' });
    notes.push({ freq: 440, start: 0.14, dur: 0.28, vol: 0.3, glide: 1046 });
  } else if (config.name === 'skill') {
    // 技能
    notes.push({ freq: 660, start: 0, dur: 0.14, vol: 0.3, type: 'triangle', overtone: 1.5 });
    notes.push({ freq: 880, start: 0.06, dur: 0.12, vol: 0.25, glide: 1320 });
  } else if (config.name === 'treasure') {
    // 宝藏
    notes.push({ freq: 1000, start: 0, dur: 0.12, vol: 0.3, overtone: 1.5 });
    notes.push({ freq: 1200, start: 0.09, dur: 0.2, vol: 0.3, glide: 1500 });
  } else if (config.name === 'heal') {
    // 治疗
    notes.push({ freq: 523, start: 0, dur: 0.12, vol: 0.22, glide: 784 });
    notes.push({ freq: 659, start: 0.08, dur: 0.16, vol: 0.24, glide: 880 });
  } else if (config.name === 'seal') {
    // 劫印
    notes.push({ freq: 440, start: 0, dur: 0.12, vol: 0.25, glide: 660 });
    notes.push({ freq: 660, start: 0.1, dur: 0.16, vol: 0.28, glide: 880 });
  } else if (config.name === 'equip') {
    // 装备
    notes.push({ freq: 520, start: 0, dur: 0.1, vol: 0.28, type: 'triangle', overtone: 2 });
    notes.push({ freq: 780, start: 0.08, dur: 0.14, vol: 0.25 });
  }
  
  // 计算总长度
  let totalLength = 0;
  for (const note of notes) {
    totalLength = Math.max(totalLength, (note.start + note.dur) * 44100);
  }
  
  const samples = new Float32Array(Math.floor(totalLength));
  
  // 混合所有音符
  for (const note of notes) {
    const noteSamples = generateOscillator(note, 44100);
    const startSample = Math.floor(note.start * 44100);
    for (let i = 0; i < noteSamples.length && startSample + i < samples.length; i++) {
      samples[startSample + i] += noteSamples[i];
    }
  }
  
  return samples;
}

// 主函数
function main() {
  const outputDir = path.join(__dirname, 'generated_sfx');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('开始生成音效文件...\n');
  
  // 生成SFX音效
  for (const [name, config] of Object.entries(SFX_CONFIG)) {
    let samples;
    
    if (['victory', 'levelup', 'roll', 'warn', 'ult', 'skill', 'treasure', 'heal', 'seal', 'equip'].includes(name)) {
      samples = generateMultiNote({ ...config, name }, 44100);
    } else {
      samples = generateOscillator(config, 44100);
    }
    
    const wavBuffer = generateWAV(samples, 44100);
    const filePath = path.join(outputDir, `sfx_${name}.wav`);
    fs.writeFileSync(filePath, wavBuffer);
    
    const sizeKB = (wavBuffer.length / 1024).toFixed(2);
    console.log(`✅ sfx_${name}.wav (${sizeKB} KB) - ${config.desc}`);
  }
  
  // 生成环境音
  console.log('\n开始生成环境音文件...\n');
  
  for (const [name, config] of Object.entries(AMBIENT_CONFIG)) {
    let samples;
    
    if (config.type === 'noise') {
      samples = generateNoise(config, 44100);
    } else {
      samples = generateOscillator(config, 44100);
    }
    
    const wavBuffer = generateWAV(samples, 44100);
    const filePath = path.join(outputDir, `ambient_${name}.wav`);
    fs.writeFileSync(filePath, wavBuffer);
    
    const sizeKB = (wavBuffer.length / 1024).toFixed(2);
    console.log(`✅ ambient_${name}.wav (${sizeKB} KB) - ${config.desc}`);
  }
  
  console.log('\n🎉 音效文件生成完成！');
  console.log(`输出目录: ${outputDir}`);
}

main();
