/**
 * Service Worker - PWA离线缓存
 * 缓存静态资源，提升移动端加载速度和离线体验
 */

const CACHE_NAME = 'nidao-xiyou-v1';
const CACHE_VERSION = '20260913';

// 预缓存的核心资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/mobile-landscape.css',
  '/js/lazy_load.js',
  '/manifest.json',
  // 核心图片
  '/img/bg/act_01_datang.webp',
  '/img/pwa/icon-192.png',
  '/img/pwa/icon-512.png'
];

// 缓存策略配置
const CACHE_STRATEGIES = {
  // 图片：缓存优先，网络回退
  image: {
    extensions: ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'],
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    maxEntries: 200
  },
  // 字体：缓存优先
  font: {
    extensions: ['.woff', '.woff2', '.ttf', '.eot'],
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
    maxEntries: 20
  },
  // JS/CSS：网络优先，缓存回退（确保更新及时）
  script: {
    extensions: ['.js', '.css'],
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    maxEntries: 150
  },
  // 音频：缓存优先
  audio: {
    extensions: ['.ogg', '.mp3', '.wav'],
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
    maxEntries: 50
  }
};

// 安装事件：预缓存核心资源
self.addEventListener('install', function (event) {
  console.log('[SW] 安装中，预缓存核心资源...');
  event.waitUntil(
    caches.open(CACHE_NAME + '-' + CACHE_VERSION)
      .then(function (cache) {
        return cache.addAll(PRECACHE_URLS.map(function (url) {
          return new Request(url, { credentials: 'same-origin' });
        }));
      })
      .then(function () {
        console.log('[SW] 核心资源预缓存完成');
        return self.skipWaiting();
      })
      .catch(function (error) {
        console.warn('[SW] 预缓存失败:', error);
      })
  );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', function (event) {
  console.log('[SW] 激活中，清理旧缓存...');
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.filter(function (cacheName) {
          return cacheName.startsWith(CACHE_NAME + '-') &&
                 cacheName !== CACHE_NAME + '-' + CACHE_VERSION;
        }).map(function (cacheName) {
          console.log('[SW] 删除旧缓存:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function () {
      console.log('[SW] 旧缓存清理完成');
      return self.clients.claim();
    })
  );
});

// 请求拦截：根据资源类型使用不同缓存策略
self.addEventListener('fetch', function (event) {
  // 只处理GET请求
  if (event.request.method !== 'GET') return;

  var url = new URL(event.request.url);
  
  // 只缓存同源资源
  if (url.origin !== self.location.origin) return;

  // 跳过API请求和非静态资源
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/data/')) return;

  var extension = getExtension(url.pathname);
  var strategy = getStrategy(extension);

  if (strategy) {
    if (strategy === 'script') {
      // JS/CSS：网络优先，缓存回退
      event.respondWith(networkFirst(event.request, strategy));
    } else {
      // 图片/字体/音频：缓存优先，网络回退
      event.respondWith(cacheFirst(event.request, strategy));
    }
  } else {
    // HTML和其他：网络优先
    event.respondWith(networkFirst(event.request, { maxAge: 0 }));
  }
});

/**
 * 缓存优先策略
 */
function cacheFirst(request, strategy) {
  return caches.open(CACHE_NAME + '-' + CACHE_VERSION).then(function (cache) {
    return cache.match(request).then(function (cachedResponse) {
      if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
        // 缓存命中且未过期
        return cachedResponse;
      }
      
      // 缓存未命中或已过期，从网络获取
      return fetch(request).then(function (networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          // 缓存响应
          cache.put(request, networkResponse.clone());
          // 限制缓存数量
          limitCacheSize(cache, strategy.maxEntries);
        }
        return networkResponse;
      }).catch(function () {
        // 网络失败，返回缓存（即使过期）
        return cachedResponse || caches.match('/index.html');
      });
    });
  });
}

/**
 * 网络优先策略
 */
function networkFirst(request, strategy) {
  return caches.open(CACHE_NAME + '-' + CACHE_VERSION).then(function (cache) {
    return fetch(request).then(function (networkResponse) {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
        limitCacheSize(cache, strategy.maxEntries || 100);
      }
      return networkResponse;
    }).catch(function () {
      // 网络失败，从缓存获取
      return cache.match(request).then(function (cachedResponse) {
        return cachedResponse || caches.match('/index.html');
      });
    });
  });
}

/**
 * 获取文件扩展名
 */
function getExtension(pathname) {
  var index = pathname.lastIndexOf('.');
  return index > -1 ? pathname.substring(index).toLowerCase() : '';
}

/**
 * 获取缓存策略
 */
function getStrategy(extension) {
  for (var key in CACHE_STRATEGIES) {
    if (CACHE_STRATEGIES[key].extensions.indexOf(extension) > -1) {
      return key;
    }
  }
  return null;
}

/**
 * 检查缓存是否过期
 */
function isExpired(response, maxAge) {
  if (!maxAge || maxAge === 0) return false;
  var cachedTime = response.headers.get('sw-cache-time');
  if (!cachedTime) return true;
  return (Date.now() - parseInt(cachedTime)) > maxAge;
}

/**
 * 限制缓存大小
 */
function limitCacheSize(cache, maxEntries) {
  cache.keys().then(function (keys) {
    if (keys.length > maxEntries) {
      cache.delete(keys[0]);
    }
  });
}

// 监听消息：手动更新缓存
self.addEventListener('message', function (event) {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'clearCache') {
    caches.keys().then(function (cacheNames) {
      cacheNames.forEach(function (cacheName) {
        caches.delete(cacheName);
      });
    });
  }
});

console.log('[SW] Service Worker 已加载');
