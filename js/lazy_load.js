/**
 * 图片懒加载模块
 * 使用IntersectionObserver实现图片懒加载，提升移动端性能
 */
(function () {
  'use strict';

  var NDX = window.NDX || {};
  window.NDX = NDX;

  /**
   * 懒加载配置
   */
  var config = {
    rootMargin: '200px 0px', // 提前200px加载（优化手机加载速度）
    threshold: 0.01,
    placeholder: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PC9zdmc+',
    preloadCount: 5, // 页面加载后预加载前5张图片
    enableBackgroundLazy: true // 启用背景图片懒加载
  };

  var observer = null;
  var mutationObserver = null;
  var lazyImages = new Set();

  /**
   * 惰性创建观察者（IntersectionObserver + 全局 DOM MutationObserver）。
   * 性能优化（?v=2）：业务图片统一使用浏览器原生 loading="lazy"（见 ui.js/icon_map.js），
   * 不再走 data-src 自定义懒加载。因此仅在「真有 img[data-src] 出现」时才创建观察者，
   * 避免一个空转的全局 MutationObserver 在战斗频繁 DOM 增删时持续回调。
   * 未来若业务接入 data-src，observeImage/makeLazy 会自动触发本函数，功能保持完整。
   */
  function ensureObserver() {
    if (observer) return;
    if (!('IntersectionObserver' in window)) {
      // 不支持 IntersectionObserver：直接加载所有现有 data-src 图片，不挂 MutationObserver
      loadAllImages();
      return;
    }

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          loadImage(img);
          observer.unobserve(img);
          lazyImages.delete(img);
        }
      });
    }, {
      rootMargin: config.rootMargin,
      threshold: config.threshold
    });

    // 监听 DOM 变化，自动观察新添加的懒加载图片（仅在真有 data-src 图片时才启动）
    if (!mutationObserver && document.body) {
      mutationObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) {
              if (node.tagName === 'IMG' && node.dataset.src) {
                observeImage(node);
              }
              if (node.querySelectorAll) {
                node.querySelectorAll('img[data-src]').forEach(function (img) {
                  observeImage(img);
                });
              }
            }
          });
        });
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  /**
   * 初始化懒加载
   */
  function init() {
    if (!('IntersectionObserver' in window)) {
      loadAllImages();
      return;
    }

    // 仅扫描现有 data-src 图片；ensureObserver 会在确有图片时才创建观察者
    document.querySelectorAll('img[data-src]').forEach(function (img) {
      observeImage(img);
    });

    console.log('[NDX] 图片懒加载已初始化');
  }

  /**
   * 观察图片
   */
  function observeImage(img) {
    if (!img.dataset.src || lazyImages.has(img)) return;
    ensureObserver();
    if (!observer) return; // IO 不支持且已降级直接加载

    // 设置占位图
    if (!img.src && config.placeholder) {
      img.src = config.placeholder;
    }

    img.classList.add('lazy-loading');
    observer.observe(img);
    lazyImages.add(img);
  }

  /**
   * 加载图片
   */
  function loadImage(img) {
    var src = img.dataset.src;
    if (!src) return;

    // 加载图片
    var tempImg = new Image();
    tempImg.onload = function () {
      img.src = src;
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
      // 移除data-src，避免重复加载
      delete img.dataset.src;
    };
    tempImg.onerror = function () {
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');
    };
    tempImg.src = src;
  }

  /**
   * 加载所有图片（降级方案）
   */
  function loadAllImages() {
    document.querySelectorAll('img[data-src]').forEach(function (img) {
      img.src = img.dataset.src;
      delete img.dataset.src;
    });
    console.log('[NDX] 使用降级方案加载所有图片');
  }

  /**
   * 手动触发加载指定区域的图片
   */
  function loadImagesInContainer(container) {
    if (!container) return;
    container.querySelectorAll('img[data-src]').forEach(function (img) {
      loadImage(img);
      if (observer) observer.unobserve(img);
      lazyImages.delete(img);
    });
  }

  /**
   * 将普通img转换为懒加载img
   */
  function makeLazy(img) {
    if (!img || !img.src || img.dataset.src) return img;
    img.dataset.src = img.src;
    img.src = config.placeholder;
    img.classList.add('lazy-loading');
    ensureObserver();
    if (observer) {
      observer.observe(img);
      lazyImages.add(img);
    } else {
      img.src = img.dataset.src;
    }
    return img;
  }

  // 暴露API
  NDX.lazyLoad = {
    init: init,
    loadImagesInContainer: loadImagesInContainer,
    makeLazy: makeLazy,
    getPendingCount: function () { return lazyImages.size; },
    observeImage: observeImage,
    loadImage: loadImage,
    preloadImages: preloadImages,
    lazyBackground: lazyBackground,
    loadAll: loadAllImages
  };

  /**
   * 预加载指定图片列表（用于关键图片提前加载）
   * @param {Array<string>} urls - 图片URL列表
   * @returns {Promise} 所有图片加载完成的Promise
   */
  function preloadImages(urls) {
    if (!urls || !urls.length) return Promise.resolve();
    var promises = urls.map(function (url) {
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = url;
      });
    });
    return Promise.all(promises);
  }

  /**
   * 背景图片懒加载
   * 为带有data-bg属性的元素设置背景图片，进入视口时才加载
   * @param {HTMLElement} element - 目标元素
   */
  function lazyBackground(element) {
    if (!element || !element.dataset.bg) return;
    if (!('IntersectionObserver' in window)) {
      element.style.backgroundImage = 'url(' + element.dataset.bg + ')';
      return;
    }
    var bgObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var bgUrl = el.dataset.bg;
          if (bgUrl) {
            // 预加载背景图片
            var tempImg = new Image();
            tempImg.onload = function () {
              el.style.backgroundImage = 'url(' + bgUrl + ')';
              el.classList.add('bg-loaded');
              el.classList.remove('bg-loading');
            };
            tempImg.onerror = function () {
              el.classList.remove('bg-loading');
              el.classList.add('bg-error');
            };
            el.classList.add('bg-loading');
            tempImg.src = bgUrl;
            delete el.dataset.bg;
          }
          observer.unobserve(el);
        }
      });
    }, {
      rootMargin: config.rootMargin,
      threshold: config.threshold
    });
    bgObserver.observe(element);
  }

  /**
   * 自动初始化所有背景图片懒加载
   */
  function initBackgroundLazy() {
    if (!config.enableBackgroundLazy) return;
    document.querySelectorAll('[data-bg]').forEach(function (el) {
      lazyBackground(el);
    });
  }

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
      initBackgroundLazy();
      // 预加载关键图片（英雄头像等）
      if (NDX.HERO_PORTRAIT_TABLE) {
        var heroUrls = Object.values(NDX.HERO_PORTRAIT_TABLE).slice(0, config.preloadCount);
        preloadImages(heroUrls);
      }
    });
  } else {
    init();
    initBackgroundLazy();
  }

})();
