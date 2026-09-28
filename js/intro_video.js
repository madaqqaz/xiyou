/**
 * 逆道西行 - 开篇宣传动画播放模块
 * 支持4段15秒视频连续播放，可跳过，可自动播放
 */

const IntroVideo = {
  isPlaying: false,
  currentSegment: 0,
  callback: null,
  container: null,
  video: null,
  skipBtn: null,
  progressBar: null,
  loadingBar: null,       // 加载进度条
  loadingText: null,      // 加载文字提示
  isBuffering: false,     // 是否正在缓冲
  preloadVideos: [],      // 预加载的视频元素
  timeoutTimer: null,     // 超时定时器（防止卡住）
  maxDuration: 15000,     // 最大播放时长15秒，超时自动跳过（4段×15秒=60秒总上限）

  // 4段宣传动画视频路径
  segments: [
    'video/intro_01_changan.mp4',   // 第一段 长安·逆命
    'video/intro_02_liudao.mp4',    // 第二段 六道·抉择
    'video/intro_03_81nan.mp4',     // 第三段 八十一难·肉鸽
    'video/intro_04_lingshan.mp4'   // 第四段 灵山·终章
  ],

  // 背景音乐配置
  // V9.50 修复：原 url 指向 audio/intro_bgm.mp3 —— 该文件从未入库（audio/ 下无 intro_*），
  //   每次开场必发一条 404。改指向已入库的开场主题曲（与主菜单同源，情绪连贯）。
  bgm: {
    url: 'audio/main_menu_bgm.mp3',
    volume: 0.3,
    loop: true,
    fadeIn: 2,
    fadeOut: 2
  },

  // 旁白配音配置（每段对应一个音频文件）
  // V9.50 修复：audio/intro_voice_0*.mp3 四段旁白全盘缺失（从未入库），
  //   保留配置只会每段发一次 404。故暂时停用（字幕照常显示）；
  //   待配音文件入库后，取消下方注释即可恢复。
  voiceovers: [
    // { url: 'audio/intro_voice_01.mp3', volume: 0.8, delay: 1.5 },  // 第一段旁白
    // { url: 'audio/intro_voice_02.mp3', volume: 0.8, delay: 0.5 },  // 第二段旁白
    // { url: 'audio/intro_voice_03.mp3', volume: 0.8, delay: 4.0 },  // 第三段旁白
    // { url: 'audio/intro_voice_04.mp3', volume: 0.8, delay: 2.0 }   // 第四段旁白
  ],

  // 音频对象
  bgmAudio: null,
  voiceAudio: null,
  voiceTimer: null,
  audioEnabled: true,

  // 旁白字幕（时间戳基于单段15秒）
  subtitles: {
    0: [ // 第一段
      { start: 2, end: 6, text: '他们说，西行是为了普度众生。' },
      { start: 8, end: 13, text: '可我看见的，是一条通往牢笼的路。' }
    ],
    1: [ // 第二段
      { start: 1, end: 3, text: '渡，是顺从；' },
      { start: 3, end: 5, text: '战，是反抗；' },
      { start: 5, end: 7, text: '缘，是羁绊；' },
      { start: 7, end: 9, text: '夺，是贪婪；' },
      { start: 9, end: 11, text: '隐，是逃避；' },
      { start: 12, end: 15, text: '逆——是逆天而行。' }
    ],
    2: [ // 第三段
      { start: 5, end: 9, text: '八十一难，八十一次死亡。' },
      { start: 11, end: 15, text: '每一次倒下，都不是终点——而是下一次逆道而行的起点。' }
    ],
    3: [ // 第四段
      { start: 3, end: 7, text: '他们说，到了灵山，就完成了救赎。' },
      { start: 8, end: 13, text: '可我要说——真正的救赎，从不是抵达，而是质疑。' }
    ]
  },

  subtitleTimer: null,

  /**
   * 播放完整宣传动画
   * @param {Function} callback - 播放完成后的回调
   * @param {Object} options - 选项 { autoPlay: true, showSkip: true, showSubtitles: true }
   */
  play(callback, options = {}) {
    if (this.isPlaying) return;
    
    const opts = {
      autoPlay: true,
      showSkip: true,
      showSubtitles: true,
      ...options
    };

    this.isPlaying = true;
    this.currentSegment = 0;
        this.callback = callback;

    // 全局超时保护：20秒后强制完成（防止视频卡住）
    this.globalTimeout = setTimeout(() => {
      console.warn('IntroVideo: 全局超时，强制完成');
      this.isPlaying = false;
      this.stopAllAudio();
      // 强制移除所有视频相关DOM
      document.querySelectorAll('#intro-video-container, .intro-video-container').forEach(el => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
      document.querySelectorAll('video').forEach(v => { try { v.pause(); v.src = ''; } catch (e) {} });
      // 调用回调
      if (this.callback && typeof this.callback === 'function') {
        const cb = this.callback;
        this.callback = null;
        try { cb(); } catch (e) { console.error('[IntroVideo] 回调失败:', e); }
      }
    }, 15000);

    // 创建容器
    this.container = document.createElement('div');
    this.container.id = 'intro-video-container';
    this.container.className = 'intro-video-container';
    this.container.style.cursor = 'pointer';
    this.container.title = '点击任意位置跳过开场动画';
    // 点击视频任意位置自动跳过
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('.intro-skip-btn')) return;
      console.log('[IntroVideo] 用户点击视频区域，自动跳过');
      this.skip();
    });

    // 创建视频元素
    this.video = document.createElement('video');
    this.video.className = 'intro-video-element';
    this.video.playsInline = true;
    this.video.webkitPlaysInline = true;
    this.video.muted = false;
    this.video.preload = 'auto';

    // 视频包装层（用于添加特效）
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'intro-video-wrapper';
    videoWrapper.appendChild(this.video);

    // 跳过按钮
    if (opts.showSkip) {
      this.skipBtn = document.createElement('button');
      this.skipBtn.className = 'intro-skip-btn';
      this.skipBtn.style.zIndex = '99999';
      this.skipBtn.style.position = 'relative';
      this.skipBtn.innerHTML = '跳过 <span class="intro-skip-arrow">»</span>';
      this.skipBtn.title = '点击跳过开场动画';
      this.skipBtn.title = '点击跳过开场动画';
      this.skipBtn.onclick = () => this.skip();
      this.container.appendChild(this.skipBtn);
    }

    // 进度条（播放进度）
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'intro-progress-bar';
    this.progressBar.innerHTML = '<div class="intro-progress-fill"></div>';
    this.container.appendChild(this.progressBar);

    // 加载进度条（缓冲进度）
    this.loadingBar = document.createElement('div');
    this.loadingBar.className = 'intro-loading-bar';
    this.loadingBar.innerHTML = '<div class="intro-loading-fill"></div><div class="intro-loading-text">视频加载中... 0%</div>';
    this.container.appendChild(this.loadingBar);
    this.loadingText = this.loadingBar.querySelector('.intro-loading-text');

    // 字幕层
    if (opts.showSubtitles) {
      this.subtitleLayer = document.createElement('div');
      this.subtitleLayer.className = 'intro-subtitle-layer';
      this.container.appendChild(this.subtitleLayer);
    }

    // 视频区域不响应点击（取消点击暂停功能，避免误触）
    // this.video.onclick = () => { ... };

    // 视频结束事件
    this.video.onended = () => this.playNextSegment();

    // 视频时间更新（用于字幕和进度）
    this.video.ontimeupdate = () => this.onTimeUpdate();

    // 视频加载进度（缓冲进度）
    this.video.onprogress = () => this.onLoadingProgress();

    // 视频缓冲中（播放卡顿）
    this.video.onwaiting = () => this.showBuffering();

    // 视频缓冲完成，恢复播放
    this.video.onplaying = () => {
      this.hideBuffering();
      // 视频真正开始播放时，才清除加载超时
      if (this.videoLoadTimeout) {
        clearTimeout(this.videoLoadTimeout);
        this.videoLoadTimeout = null;
      }
    
    // 清除全局超时（防止全局超时在finish后仍然触发）
    if (this.globalTimeout) {
      clearTimeout(this.globalTimeout);
      this.globalTimeout = null;
    }
    };

    // 视频可以播放时立即开始（不等待完全加载）
    this.video.oncanplay = () => {
      this.hideBuffering();
      // 清除视频加载超时
      if (this.videoLoadTimeout) {
        clearTimeout(this.videoLoadTimeout);
        this.videoLoadTimeout = null;
      }
    
    // 清除全局超时（防止全局超时在finish后仍然触发）
    if (this.globalTimeout) {
      clearTimeout(this.globalTimeout);
      this.globalTimeout = null;
    }
      if (this.video.paused && this.isPlaying) {
        this.video.play().catch(() => {});
      }
    };

    // 视频加载错误处理
    this.video.onerror = () => {
      console.warn('IntroVideo: 视频加载失败，跳过当前段');
      this.showErrorHint();
      // 2秒后自动跳过
      setTimeout(() => {
        this.hideErrorHint();
        this.playNextSegment();
      }, 2000);
    };

    // 错误提示层
    this.errorHint = document.createElement('div');
    this.errorHint.className = 'intro-error-hint';
    this.errorHint.innerHTML = '<div class="intro-error-icon">⚠</div><div class="intro-error-text">视频加载中... 如长时间无反应请点击跳过</div>';
    this.container.appendChild(this.errorHint);

    this.container.appendChild(videoWrapper);
    document.body.appendChild(this.container);

    // 添加入场动画类
    requestAnimationFrame(() => {
      if (this.container) { this.container.classList.add('intro-video-visible'); }
    });

    // 开始播放第一段
    if (opts.autoPlay) {
      // 启动背景音乐
      this.playBGM();
      this.playSegment(0);
    }

    // 启动超时保护：30秒后自动完成，防止视频加载失败导致游戏卡住
    this.startTimeout();

    return this;
  },

  /**
   * 播放背景音乐
   */
  playBGM() {
    if (!this.audioEnabled || !this.bgm.url) return;
    
    try {
      this.bgmAudio = new Audio();
      this.bgmAudio.volume = this.bgm.volume;
      this.bgmAudio.loop = this.bgm.loop;
      // 监听加载错误，文件不存在时静默失败
      this.bgmAudio.onerror = () => {
        console.warn('IntroVideo: BGM文件不存在或加载失败，已禁用BGM');
        this.bgmAudio = null;
      };
      this.bgmAudio.src = this.bgm.url;
      this.bgmAudio.play().catch((err) => {
        console.warn('IntroVideo: BGM播放失败', err);
      });
    } catch (e) {
      console.warn('IntroVideo: BGM创建失败', e);
    }
  },

  /**
   * 播放指定段落的旁白配音
   */
  playVoiceover(segmentIndex) {
    if (!this.audioEnabled) return;
    
    const vo = this.voiceovers[segmentIndex];
    if (!vo || !vo.url) return;

    // 停止之前的旁白
    this.stopVoiceover();

    // 延迟播放旁白
    this.voiceTimer = setTimeout(() => {
      try {
        this.voiceAudio = new Audio(vo.url);
        this.voiceAudio.volume = vo.volume;
        this.voiceAudio.play().catch((err) => {
          console.warn('IntroVideo: 旁白播放失败', err);
        });
      } catch (e) {
        console.warn('IntroVideo: 旁白创建失败', e);
      }
    }, (vo.delay || 0) * 1000);
  },

  /**
   * 停止旁白
   */
  stopVoiceover() {
    if (this.voiceTimer) {
      clearTimeout(this.voiceTimer);
      this.voiceTimer = null;
    }
    if (this.voiceAudio) {
      this.voiceAudio.pause();
      this.voiceAudio.src = '';
      this.voiceAudio = null;
    }
  },

  /**
   * 停止所有音频
   */
  stopAllAudio() {
    this.stopVoiceover();
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.src = '';
      this.bgmAudio = null;
    }
  },

  /**
   * 播放指定片段
   */
  playSegment(index) {
    if (index >= this.segments.length) {
      this.finish();
      return;
    }

    this.currentSegment = index;
    this.video.src = this.segments[index];
    
    // 显示加载进度条
    this.showLoading();
    
    // 后台预加载所有视频段（不阻塞当前播放）
    this.preloadAllSegments();

    // 视频加载超时检测：3秒内没有开始播放就自动跳过
    this.videoLoadTimeout = setTimeout(() => {
      if (this.isPlaying) {
        console.warn('IntroVideo: 视频加载超时（3秒），自动跳过当前段');
        this.playNextSegment();
      }
    }, 3000);

    // 立即尝试播放（不等待加载完成）
    // 浏览器会在缓冲足够时自动开始播放
    const playPromise = this.video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('IntroVideo: 自动播放被阻止，尝试静音播放', err);
        this.video.muted = true;
        this.video.play().catch(() => {
          console.warn('IntroVideo: 播放失败，跳过');
          this.playNextSegment();
        });
      });
    }

    // 播放对应段落的旁白配音
    this.playVoiceover(index);

    // 更新进度条段数
    this.updateProgressSegments();
  },

  /**
   * 后台预加载所有视频段
   */
  preloadAllSegments() {
    // 清理之前的预加载
    this.preloadVideos.forEach(v => { v.src = ''; });
    this.preloadVideos = [];

    // 从下一段开始预加载（当前段正在播放）
    for (let i = this.currentSegment + 1; i < this.segments.length; i++) {
      const preloadVideo = document.createElement('video');
      preloadVideo.preload = 'auto';
      preloadVideo.src = this.segments[i];
      preloadVideo.muted = true;  // 静音以允许自动加载
      this.preloadVideos.push(preloadVideo);
    }
  },

  /**
   * 视频加载进度更新
   */
  onLoadingProgress() {
    if (!this.video || !this.video.buffered || this.video.buffered.length === 0) return;
    
    try {
      const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
      const duration = this.video.duration || 1;
      const percent = Math.min(100, Math.round((bufferedEnd / duration) * 100));
      
      const fill = this.loadingBar.querySelector('.intro-loading-fill');
      if (fill) {
        fill.style.width = percent + '%';
      }
      if (this.loadingText) {
        this.loadingText.textContent = '视频加载中... ' + percent + '%';
      }
      
      // 加载完成后隐藏加载进度条
      if (percent >= 95) {
        this.hideLoading();
      }
    } catch (e) {
      // 忽略缓冲计算错误
    }
  },

  /**
   * 显示加载进度条
   */
  showLoading() {
    if (this.loadingBar) {
      this.loadingBar.classList.add('intro-loading-visible');
    }
  },

  /**
   * 隐藏加载进度条
   */
  hideLoading() {
    if (this.loadingBar) {
      this.loadingBar.classList.remove('intro-loading-visible');
    }
  },

  /**
   * 显示缓冲中提示
   */
  showBuffering() {
    this.isBuffering = true;
    if (this.loadingText) {
      this.loadingText.textContent = '缓冲中...';
    }
    this.showLoading();
  },

  /**
   * 隐藏缓冲中提示
   */
  hideBuffering() {
    this.isBuffering = false;
    // 如果加载完成，隐藏加载条
    if (this.video && this.video.buffered && this.video.buffered.length > 0) {
      try {
        const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
        const duration = this.video.duration || 1;
        if ((bufferedEnd / duration) >= 0.95) {
          this.hideLoading();
        }
      } catch (e) {}
    }
  },

  /**
   * 播放下一段
   */
  playNextSegment() {
    if (this.currentSegment + 1 < this.segments.length) {
      this.playSegment(this.currentSegment + 1);
    } else {
      this.finish();
    }
  },

  /**
   * 时间更新处理（字幕+进度）
   */
  onTimeUpdate() {
    const currentTime = this.video.currentTime;
    const duration = this.video.duration || 15;
    
    // 更新进度条
    const totalProgress = (this.currentSegment + currentTime / duration) / this.segments.length;
    const fill = this.progressBar.querySelector('.intro-progress-fill');
    if (fill) {
      fill.style.width = (totalProgress * 100) + '%';
    }

    // 更新字幕
    if (this.subtitleLayer && this.subtitles[this.currentSegment]) {
      const subs = this.subtitles[this.currentSegment];
      let currentSub = null;
      
      for (const sub of subs) {
        if (currentTime >= sub.start && currentTime <= sub.end) {
          currentSub = sub;
          break;
        }
      }

      if (currentSub) {
        if (this.subtitleLayer.textContent !== currentSub.text) {
          this.subtitleLayer.textContent = currentSub.text;
          this.subtitleLayer.classList.add('intro-subtitle-visible');
        }
      } else {
        this.subtitleLayer.classList.remove('intro-subtitle-visible');
      }
    }
  },

  /**
   * 更新进度条段数显示
   */
  updateProgressSegments() {
    // 可以在这里添加段数指示器
  },

  /**
   * 显示错误提示
   */
  showErrorHint() {
    if (this.errorHint) {
      this.errorHint.classList.add('intro-error-visible');
    }
  },

  /**
   * 隐藏错误提示
   */
  hideErrorHint() {
    if (this.errorHint) {
      this.errorHint.classList.remove('intro-error-visible');
    }
  },

  /**
   * 跳过动画
   */
  skip() {
    this.finish();
  },

  /**
   * 暂停
   */
  pause() {
    if (this.video) this.video.pause();
  },

  /**
   * 继续播放
   */
  resume() {
    if (this.video) this.video.play();
  },

  /**
   * 播放完成
   */
  finish() {
    if (!this.isPlaying && !this.callback) {
      // 防止重复调用，但仍然确保清理DOM
      try { this.cleanup(); } catch (e) {}
      return;
    }
    
    this.isPlaying = false;

    // 清除超时定时器
    this.clearTimeout();

    // 停止所有音频
    this.stopAllAudio();

    // 清除字幕定时器
    if (this.subtitleTimer) {
      clearInterval(this.subtitleTimer);
      this.subtitleTimer = null;
    }

    // 立即保存回调引用（防止在cleanup中被意外清除）
    const cb = this.callback;
    this.callback = null;

    // 淡出动画
    if (this.container) {
      try {
        this.container.classList.remove('intro-video-visible');
        this.container.classList.add('intro-video-hidden');
      } catch (e) {
        console.warn('IntroVideo: 淡出动画失败', e);
      }
      
      // 立即清理DOM（不延迟，确保视频容器被移除）
      try { this.cleanup(); } catch (e) { console.warn('IntroVideo: cleanup失败', e); }
    } else {
      try { this.cleanup(); } catch (e) { console.warn('IntroVideo: cleanup失败', e); }
    }

    // 立即调用回调函数（关键：确保游戏初始化不被延迟）
    if (cb && typeof cb === 'function') {
      try {
        console.log('[IntroVideo] 调用完成回调，开始初始化游戏');
        cb();
      } catch (e) {
        console.error('[IntroVideo] 回调函数执行失败:', e);
        // 回调失败时尝试直接初始化游戏（兜底）
        if (window.NDX && !window.NDX.game) {
          console.warn('[IntroVideo] 尝试兜底初始化游戏');
          try { window.NDX.game = new window.NDX.Game(); } catch (e2) { console.error('[IntroVideo] 兜底初始化失败:', e2); }
        }
      }
    }
  },

  /**
   * 清理DOM
   */
  cleanup() {
    // 清除视频加载超时
    if (this.videoLoadTimeout) {
      clearTimeout(this.videoLoadTimeout);
      this.videoLoadTimeout = null;
    }
    
    // 清除全局超时（防止全局超时在finish后仍然触发）
    if (this.globalTimeout) {
      clearTimeout(this.globalTimeout);
      this.globalTimeout = null;
    }

    // 清理预加载的视频
    if (this.preloadVideos) {
      this.preloadVideos.forEach(v => {
        try { v.pause(); v.src = ''; } catch (e) {}
      });
      this.preloadVideos = [];
    }

    if (this.video) {
      this.video.pause();
      this.video.src = '';
      this.video.onended = null;
      this.video.ontimeupdate = null;
      this.video.onerror = null;
      this.video.onprogress = null;
      this.video.onwaiting = null;
      this.video.onplaying = null;
      this.video.oncanplay = null;
      this.video = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.skipBtn = null;
    this.progressBar = null;
    this.loadingBar = null;
    this.loadingText = null;
    this.subtitleLayer = null;
  },

  /**
   * 启动超时保护
   */
  startTimeout() {
    this.clearTimeout();
    this.timeoutTimer = setTimeout(() => {
      if (this.isPlaying) {
        console.warn("IntroVideo: 播放超时，自动跳过");
        this.finish();
      }
    }, this.maxDuration);
  },

  /**
   * 清除超时定时器
   */
  clearTimeout() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  },

  /**
   * 检查是否已观看过（用于首次自动播放）
   */
  hasSeenIntro() {
    try {
      return localStorage.getItem('nidao_has_seen_intro') === 'true';
    } catch (e) {
      return false;
    }
  },

  /**
   * 标记已观看
   */
  markAsSeen() {
    try {
      localStorage.setItem('nidao_has_seen_intro', 'true');
    } catch (e) {
      // localStorage不可用时忽略
    }
  },

  /**
   * 重置观看状态（用于调试）
   */
  resetSeenStatus() {
    try {
      localStorage.removeItem('nidao_has_seen_intro');
    } catch (e) {
      // 忽略
    }
  },

  /**
   * 检查视频文件是否存在
   */
  async checkVideosAvailable() {
    const results = [];
    for (let i = 0; i < this.segments.length; i++) {
      try {
        const response = await fetch(this.segments[i], { method: 'HEAD' });
        results.push({
          index: i,
          url: this.segments[i],
          available: response.ok,
          size: response.headers.get('content-length') || 'unknown'
        });
      } catch (e) {
        results.push({
          index: i,
          url: this.segments[i],
          available: false,
          error: e.message
        });
      }
    }
    return results;
  }
};

// 导出到全局
window.IntroVideo = IntroVideo;
