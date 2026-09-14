/**
 * 逆道西行 - 结局动画播放模块
 * 支持3个主要结局的15秒动画播放
 */

const EndingVideo = {
  isPlaying: false,
  container: null,
  video: null,
  callback: null,

  // 结局视频配置
  endings: {
    'zhengguo': {
      title: '正果·金蝉东归',
      video: 'video/ending_zhengguo.mp4',
      subtitle: '取经人合掌，经卷落地生莲。灵山钟声响彻九霄，他终于成了「自己要成的佛」。',
      tone: 'light'
    },
    'nidao': {
      title: '逆道·难簿焚尽',
      video: 'video/ending_nidao.mp4',
      subtitle: '大圣将金箍棒横在灵山门前，难簿被残卷点燃。「这经，不取也罢。」他转身，把因果一笔一笔，重写在自己骨上。',
      tone: 'dark'
    },
    'dasheng': {
      title: '大圣脱局·齐天再临',
      video: 'video/ending_dasheng.mp4',
      subtitle: '五行山碎，金箍落地。悟空没去灵山，也没回花果山——他扛着棒，朝天庭方向走去。「俺老孙的齐天，从来不是谁封的。」',
      tone: 'rebel'
    }
  },

  /**
   * 播放结局动画
   * @param {string} endingId - 结局ID (zhengguo/nidao/dasheng)
   * @param {Function} callback - 播放完成后的回调
   * @param {Object} options - 选项
   */
  play(endingId, callback, options = {}) {
    if (this.isPlaying) return;

    const ending = this.endings[endingId];
    if (!ending) {
      console.warn('EndingVideo: 未知结局ID', endingId);
      if (callback) callback();
      return;
    }

    this.isPlaying = true;
    this.callback = callback;

    // 创建容器
    this.container = document.createElement('div');
    this.container.className = 'ending-video-container ending-tone-' + ending.tone;

    // 创建视频元素
    this.video = document.createElement('video');
    this.video.className = 'ending-video-element';
    this.video.playsInline = true;
    this.video.webkitPlaysInline = true;
    this.video.muted = false;
    this.video.preload = 'auto';
    this.video.src = ending.video;

    // 视频包装层
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'ending-video-wrapper';
    videoWrapper.appendChild(this.video);

    // 结局标题
    const titleLayer = document.createElement('div');
    titleLayer.className = 'ending-title-layer';
    titleLayer.innerHTML = `
      <div class="ending-title">${ending.title}</div>
      <div class="ending-subtitle">${ending.subtitle}</div>
    `;

    // 跳过按钮
    const skipBtn = document.createElement('button');
    skipBtn.className = 'ending-skip-btn';
    skipBtn.innerHTML = '跳过结局 <span class="ending-skip-arrow">»</span>';
    skipBtn.onclick = () => this.finish();

    // 进度条
    const progressBar = document.createElement('div');
    progressBar.className = 'ending-progress-bar';
    progressBar.innerHTML = '<div class="ending-progress-fill"></div>';

    // 视频结束事件
    this.video.onended = () => this.finish();

    // 视频时间更新
    this.video.ontimeupdate = () => {
      const currentTime = this.video.currentTime;
      const duration = this.video.duration || 15;
      const progress = (currentTime / duration) * 100;
      const fill = progressBar.querySelector('.ending-progress-fill');
      if (fill) fill.style.width = progress + '%';
    };

    // 视频加载错误处理
    this.video.onerror = () => {
      console.warn('EndingVideo: 视频加载失败，直接显示结局文字');
      // 显示文字结局3秒后结束
      setTimeout(() => this.finish(), 3000);
    };

    // 点击视频区域暂停/继续
    this.video.onclick = () => {
      if (this.video.paused) {
        this.video.play();
      } else {
        this.video.pause();
      }
    };

    this.container.appendChild(videoWrapper);
    this.container.appendChild(titleLayer);
    this.container.appendChild(skipBtn);
    this.container.appendChild(progressBar);
    document.body.appendChild(this.container);

    // 添加入场动画
    requestAnimationFrame(() => {
      this.container.classList.add('ending-video-visible');
    });

    // 开始播放
    this.video.play().catch((err) => {
      console.warn('EndingVideo: 自动播放被阻止，尝试静音播放', err);
      this.video.muted = true;
      this.video.play().catch(() => {
        console.warn('EndingVideo: 播放失败，直接显示结局文字');
        setTimeout(() => this.finish(), 3000);
      });
    });

    return this;
  },

  /**
   * 完成播放
   */
  finish() {
    this.isPlaying = false;

    if (this.container) {
      this.container.classList.remove('ending-video-visible');
      this.container.classList.add('ending-video-hidden');

      setTimeout(() => {
        this.cleanup();
        if (this.callback) {
          const cb = this.callback;
          this.callback = null;
          cb();
        }
      }, 800);
    } else {
      this.cleanup();
      if (this.callback) {
        const cb = this.callback;
        this.callback = null;
        cb();
      }
    }
  },

  /**
   * 清理DOM
   */
  cleanup() {
    if (this.video) {
      this.video.pause();
      this.video.src = '';
      this.video.onended = null;
      this.video.ontimeupdate = null;
      this.video.onerror = null;
      this.video = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  },

  /**
   * 检查结局视频是否可用
   */
  async checkEndingVideo(endingId) {
    const ending = this.endings[endingId];
    if (!ending) return false;

    try {
      const response = await fetch(ending.video, { method: 'HEAD' });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  /**
   * 获取所有结局列表
   */
  getEndingList() {
    return Object.keys(this.endings).map(id => ({
      id,
      title: this.endings[id].title,
      tone: this.endings[id].tone
    }));
  }
};

// 导出到全局
window.EndingVideo = EndingVideo;
