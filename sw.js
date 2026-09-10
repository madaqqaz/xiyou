/**
 * 逆道西行 PWA Service Worker
 * 功能：离线缓存 + 自动更新 + 版本管理
 * 策略：Stale-While-Revalidate（缓存优先，后台更新）
 */

const CACHE_VERSION = 'nidao-xiyou-v1.0.0';
const CACHE_NAME = `nidao-xiyou-${CACHE_VERSION}`;

// 预缓存核心文件（首次安装时缓存）
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  // 核心JS文件（按加载顺序）
  './js/data.js',
  './js/events.js',
  './js/equipment.js',
  './js/combat.js',
  './js/game.js',
  './js/ui.js',
  './js/main.js',
  // PWA图标
  './img/pwa/icon-192.png',
  './img/pwa/icon-512.png',
];

// 安装事件：预缓存核心文件
self.addEventListener('install', (event) => {
  console.log('[PWA] Service Worker 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[PWA] 预缓存核心文件...');
        return cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log('[PWA] 预缓存完成');
        return self.skipWaiting(); // 立即激活，不等待旧SW退出
      })
      .catch((error) => {
        console.warn('[PWA] 预缓存部分失败:', error);
        return self.skipWaiting();
      })
  );
});

// 激活事件：清除旧缓存
self.addEventListener('activate', (event) => {
  console.log('[PWA] Service Worker 激活中...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('nidao-xiyou-') && name !== CACHE_NAME)
            .map((name) => {
              console.log('[PWA] 清除旧缓存:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[PWA] 旧缓存清除完成');
        return self.clients.claim(); // 立即接管所有页面
      })
  );
});

//  fetch事件：拦截请求，Stale-While-Revalidate策略
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // 只处理GET请求
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 不缓存跨域请求（除非是图片等静态资源）
  if (url.origin !== self.location.origin) {
    // 跨域图片可以缓存
    if (request.destination === 'image') {
      event.respondWith(cacheFirst(request));
    }
    return;
  }

  // HTML文件：网络优先，失败用缓存（保证最新）
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 静态资源（CSS/JS/图片/字体）：缓存优先，后台更新
  if (
    url.pathname.match(/\.(css|js|png|jpg|jpeg|webp|gif|svg|woff|woff2|ttf|eot|mp3|ogg|wav|json)$/i)
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // 其他请求：缓存优先
  event.respondWith(cacheFirst(request));
});

/**
 * 策略1：Stale-While-Revalidate（缓存优先，后台更新）
 * 立即返回缓存，同时后台更新缓存
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // 后台更新缓存（不阻塞响应）
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // 网络失败，忽略（缓存已经返回）
    });

  // 如果有缓存，立即返回缓存；否则等待网络请求
  if (cachedResponse) {
    return cachedResponse;
  }
  return fetchPromise;
}

/**
 * 策略2：Network First（网络优先，失败用缓存）
 * 优先从网络获取，失败时返回缓存
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('[PWA] 网络请求失败，使用缓存:', request.url);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // 如果没有缓存，返回离线页面
    return new Response('离线状态，请检查网络连接', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

/**
 * 策略3：Cache First（缓存优先，缓存没有才网络）
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('[PWA] 缓存和网络都失败:', request.url);
    return new Response('资源加载失败', {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// 监听来自页面的消息（用于手动更新、清除缓存等）
self.addEventListener('message', (event) => {
  const { type } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      console.log('[PWA] 收到跳过等待指令');
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      console.log('[PWA] 收到清除缓存指令');
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name.startsWith('nidao-xiyou-')) {
            caches.delete(name);
          }
        });
      });
      break;

    case 'GET_VERSION':
      event.source.postMessage({
        type: 'VERSION',
        version: CACHE_VERSION,
        cacheName: CACHE_NAME
      });
      break;
  }
});

// 推送通知（可选，以后扩展）
self.addEventListener('push', (event) => {
  console.log('[PWA] 收到推送:', event);
  // 以后可以扩展推送通知功能
});

console.log('[PWA] Service Worker 已加载，版本:', CACHE_VERSION);
