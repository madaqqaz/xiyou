/**
 * 游戏加载动画模块
 * V9.8 游戏开始时显示加载动画，替代章节过场动画
 */
(function () {
  'use strict';

  var NDX = window.NDX || {};
  window.NDX = NDX;

  /**
   * 加载屏幕配置
   */
  var config = {
    minDuration: 2000, // 最小显示时间（毫秒）
    maxDuration: 5000, // 最大显示时间
    progressSteps: [
      { text: '正在唤醒取经人...', progress: 20 },
      { text: '整理八十一难经文...', progress: 40 },
      { text: '召唤各路妖魔鬼怪...', progress: 60 },
      { text: '点亮长安古城灯火...', progress: 80 },
      { text: '逆道西行，即将启程...', progress: 100 }
    ]
  };

  var loadingScreen = null;
  var startTime = 0;
  var progressTimer = null;
  var isComplete = false;
  var onCompleteCallback = null;

  /**
   * 创建加载屏幕DOM
   */
  function createLoadingScreen() {
    var screen = document.createElement('div');
    screen.id = 'ndx-loading-screen';
    screen.className = 'ndx-loading-screen';
    screen.innerHTML = [
      '<div class="ndx-loading-bg"></div>',
      '<div class="ndx-loading-content">',
      '  <div class="ndx-loading-title">',
      '    <span class="ndx-loading-title-char">逆</span>',
      '    <span class="ndx-loading-title-char">道</span>',
      '    <span class="ndx-loading-title-char">西</span>',
      '    <span class="ndx-loading-title-char">行</span>',
      '  </div>',
      '  <div class="ndx-loading-subtitle">黑暗西游 · 肉鸽构筑</div>',
      '  <div class="ndx-loading-progress-container">',
      '    <div class="ndx-loading-progress-bar">',
      '      <div class="ndx-loading-progress-fill"></div>',
      '    </div>',
      '    <div class="ndx-loading-progress-text">正在加载...</div>',
      '    <div class="ndx-loading-progress-percent">0%</div>',
      '  </div>',
      '  <div class="ndx-loading-tips">',
      '    <span class="ndx-loading-tip">提示：每一次死亡都是下一次成功的基石</span>',
      '  </div>',
      '</div>',
      '<div class="ndx-loading-particles">',
      '  <span class="particle p1"></span>',
      '  <span class="particle p2"></span>',
      '  <span class="particle p3"></span>',
      '  <span class="particle p4"></span>',
      '  <span class="particle p5"></span>',
      '</div>'
    ].join('');

    document.body.appendChild(screen);
    return screen;
  }

  /**
   * 显示加载屏幕
   */
  function show(callback) {
    if (loadingScreen) {
      hide();
    }

    onCompleteCallback = callback || null;
    isComplete = false;
    startTime = Date.now();

    // 创建加载屏幕
    loadingScreen = createLoadingScreen();

    // 强制重排以触发动画
    void loadingScreen.offsetWidth;
    loadingScreen.classList.add('visible');

    // 开始进度动画
    startProgressAnimation();

    console.log('[NDX] 加载屏幕已显示');
  }

  /**
   * 开始进度动画
   */
  function startProgressAnimation() {
    var currentStep = 0;
    var progressFill = loadingScreen.querySelector('.ndx-loading-progress-fill');
    var progressText = loadingScreen.querySelector('.ndx-loading-progress-text');
    var progressPercent = loadingScreen.querySelector('.ndx-loading-progress-percent');

    function updateStep() {
      if (currentStep >= config.progressSteps.length) {
        // 所有步骤完成，等待最小时间后结束
        var elapsed = Date.now() - startTime;
        var remaining = Math.max(0, config.minDuration - elapsed);
        setTimeout(function () {
          complete();
        }, remaining);
        return;
      }

      var step = config.progressSteps[currentStep];
      progressText.textContent = step.text;
      progressFill.style.width = step.progress + '%';
      progressPercent.textContent = step.progress + '%';

      currentStep++;
      progressTimer = setTimeout(updateStep, config.minDuration / config.progressSteps.length);
    }

    updateStep();
  }

  /**
   * 完成加载
   */
  function complete() {
    if (isComplete) return;
    isComplete = true;

    if (progressTimer) {
      clearTimeout(progressTimer);
      progressTimer = null;
    }

    // 确保进度条到100%
    if (loadingScreen) {
      var progressFill = loadingScreen.querySelector('.ndx-loading-progress-fill');
      var progressPercent = loadingScreen.querySelector('.ndx-loading-progress-percent');
      if (progressFill) progressFill.style.width = '100%';
      if (progressPercent) progressPercent.textContent = '100%';
    }

    // 延迟隐藏，让用户看到100%
    setTimeout(function () {
      hide();
      if (onCompleteCallback) {
        onCompleteCallback();
        onCompleteCallback = null;
      }
    }, 300);

    console.log('[NDX] 加载完成');
  }

  /**
   * 隐藏加载屏幕
   */
  function hide() {
    if (!loadingScreen) return;

    loadingScreen.classList.remove('visible');
    loadingScreen.classList.add('hidden');

    var screen = loadingScreen;
    setTimeout(function () {
      if (screen && screen.parentNode) {
        screen.parentNode.removeChild(screen);
      }
    }, 500);

    loadingScreen = null;
  }

  /**
   * 强制完成加载（用于调试或资源加载完成时）
   */
  function forceComplete() {
    if (!isComplete) {
      complete();
    }
  }

  /**
   * 检查是否正在显示
   */
  function isShowing() {
    return loadingScreen !== null && !isComplete;
  }

  // 暴露API
  NDX.loadingScreen = {
    show: show,
    hide: hide,
    complete: forceComplete,
    isShowing: isShowing
  };

  console.log('[NDX] 加载屏幕模块已加载');

})();
