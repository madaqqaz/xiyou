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
    rootMargin: '50px 0px', // 提前50px加载
    threshold: 0.01,
    placeholder: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PC9zdmc+'
  };

  var observer = null;
  var lazyImages = new Set();

  /**
   * 初始化懒加载
   */
  function init() {
    if (!('IntersectionObserver' in window)) {
      // 不支持IntersectionObserver，直接加载所有图片
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

    // 观察现有的懒加载图片
    document.querySelectorAll('img[data-src]').forEach(function (img) {
      observeImage(img);
    });

    // 监听DOM变化，自动观察新添加的懒加载图片
    var mutationObserver = new MutationObserver(function (mutations) {
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

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[NDX] 图片懒加载已初始化');
  }

  /**
   * 观察图片
   */
  function observeImage(img) {
    if (!img.dataset.src || lazyImages.has(img)) return;
    
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
    getPendingCount: function () { return lazyImages.size; }
  };

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
