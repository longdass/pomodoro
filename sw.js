const CACHE_NAME = 'focus-clock-cache-v1'; // 缓存名称，版本更新时修改 v1 -> v2
const urlsToCache = [
  '/', // 缓存根目录，通常会加载 index.html
  '/index.html', // 明确缓存 index.html
  '/manifest.json', // 缓存 manifest 文件
  '/icons/icon-192x192.png', // 缓存主要图标（至少一个）
  '/icons/icon-512x512.png'
  // 注意：由于 CSS 和 JS 是内联的，它们会随着 index.html 一起被缓存。
  // 如果你有外部 CSS/JS 文件，需要将它们的路径也添加到这里。
  // 注意：Google Fonts 等外部资源默认不会被缓存，离线时可能无法加载。
  // 如果需要离线字体，需要更复杂的缓存策略。
];

// 安装 Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Install completed');
        return self.skipWaiting(); // 强制新的 Service Worker 立即激活
      })
  );
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  // 清理旧缓存
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker: Activation completed');
        return self.clients.claim(); // 控制当前打开的页面
    })
  );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  // console.log('Service Worker: Fetching', event.request.url);
  // 使用 "Cache falling back to network" 策略
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // console.log('Service Worker: Found in cache', event.request.url);
          return response; // 如果缓存中有，直接返回缓存的响应
        }
        // console.log('Service Worker: Not found in cache, fetching from network', event.request.url);
        return fetch(event.request).then(
            // 可选：将新的请求缓存起来，但对于这个应用可能不需要动态缓存太多东西
            // response => {
            //   // 检查我们是否收到了有效的响应
            //   if(!response || response.status !== 200 || response.type !== 'basic') {
            //     return response;
            //   }
            //   // 重要：克隆响应。响应是一个流，只能使用一次。
            //   // 我们需要一份给浏览器使用，一份给缓存使用。
            //   var responseToCache = response.clone();
            //   caches.open(CACHE_NAME)
            //     .then(cache => {
            //       cache.put(event.request, responseToCache);
            //     });
            //   return response;
            // }
            response // 如果不动态缓存，直接返回网络响应
        ).catch(error => {
          console.error('Service Worker: Fetch failed; returning offline page instead.', error);
          // 可选：返回一个通用的离线页面或资源
          // return caches.match('/offline.html');
        });
      })
  );
});
