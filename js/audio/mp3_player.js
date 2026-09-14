/* =============================================================================
 * 逆道西行 · MP3 预渲染音频播放器
 * 用途：在程序化合成引擎之外，播放预生成的 MP3 背景音乐和音效
 * 设计：单例 + 自动循环 BGM + 一次性 SFX + 静音开关
 * ========================================================================== */
(function (global) {
  'use strict';

  const AUDIO_DIR = 'audio/';

  // 音频文件清单
  const TRACKS = {
    // BGM（可循环）
    mainMenu: { file: 'main_menu_bgm.mp3', loop: true, volume: 0.5 },
    map: { file: 'map_bgm.mp3', loop: true, volume: 0.4 },
    battle: { file: 'battle_bgm.mp3', loop: true, volume: 0.5 },
    boss: { file: 'boss_bgm.mp3', loop: true, volume: 0.6 },
    // SFX（一次性）
    uiClick: { file: 'ui_click.mp3', loop: false, volume: 0.8 },
    chant: { file: 'chant_ui.mp3', loop: false, volume: 0.7 },
    awaken: { file: 'class_awaken.mp3', loop: false, volume: 0.8 },
    victory: { file: 'victory.mp3', loop: false, volume: 0.8 },
    defeat: { file: 'defeat.mp3', loop: false, volume: 0.8 }
  };

  // 当前播放状态
  let currentBgm = null;
  const sfxPool = {}; // 音效池（每个音效预加载一个 Audio 对象）
  let muted = false;
  let initialized = false;

  // 初始化（预加载所有音效）
  function init() {
    if (initialized) return;
    initialized = true;
    Object.keys(TRACKS).forEach(key => {
      const track = TRACKS[key];
      const audio = new Audio(AUDIO_DIR + track.file);
      audio.volume = track.volume;
      if (track.loop) audio.loop = true;
      sfxPool[key] = audio;
    });
  }

  // 播放 BGM（自动停止之前的 BGM）
  function playBgm(name) {
    if (muted || !TRACKS[name]) return;
    // 停止当前 BGM
    if (currentBgm) {
      currentBgm.pause();
      currentBgm.currentTime = 0;
    }
    // 播放新 BGM
    const audio = sfxPool[name];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.warn('[MP3] BGM play failed:', name, e));
      currentBgm = audio;
    }
  }

  // 停止 BGM
  function stopBgm() {
    if (currentBgm) {
      currentBgm.pause();
      currentBgm.currentTime = 0;
      currentBgm = null;
    }
  }

  // 播放 SFX（一次性音效）
  function playSfx(name) {
    if (muted || !TRACKS[name]) return;
    const track = TRACKS[name];
    // SFX 每次创建新实例，避免打断正在播放的音效
    const audio = new Audio(AUDIO_DIR + track.file);
    audio.volume = track.volume;
    audio.play().catch(e => console.warn('[MP3] SFX play failed:', name, e));
  }

  // 静音开关
  function toggleMute() {
    muted = !muted;
    if (muted) stopBgm();
    return muted;
  }

  function isMuted() { return muted; }

  // 导出公共 API
  global.NDX_MP3 = {
    init: init,
    playBgm: playBgm,
    stopBgm: stopBgm,
    playSfx: playSfx,
    toggleMute: toggleMute,
    isMuted: isMuted,
    getCurrentBgm: () => currentBgm ? TRACKS[currentBgm] : null
  };

})(window);
