// SW version
const CacheVersion = "SW-1.0.0";

// static Cache
const cachedFiles = [
  "./index.html",
  "./main.js",
  "./vendor/bootstrap.min.css",
  "./vendor/jquery.min.js",
  "./images/sync.png",
  "./images/flame.png",
  "./images/icon.png",
];

// SW install
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CacheVersion).then((cache) => cache.addAll(cachedFiles))
  );
});

// sw activate
self.addEventListener("activate", (e) => {
  //clean old caches
  let deletedCaches = caches.keys().then((keys) => {
    keys.forEach((key) => (key !== CacheVersion ? caches.delete(key) : key));
  });
  e.waitUntil(deletedCaches);
});

//sw request
self.addEventListener("fetch", (e) => {
  const regexUrls = /media[0-9]+\.giphy\.com\/media/i;
  console.log(e.request.url);
  if (e.request.url.match(location.origin)) {
    e.respondWith(staticCache(e.request));
  } else if (e.request.url.match("api.giphy.com/v1/gifs/trending")) {
    e.respondWith(fallbackCache(e.request));
  } else if (regexUrls.test(e.request.url)) {
    e.respondWith(staticCache(e.request, "gifs"));
  }
});

//strategy to get files requested from cache if files not exist try to get it by network request then cache it
const staticCache = (req, cacheName = CacheVersion) => {
  return caches.match(req).then((cashedRes) => {
    //if file exist in cache
    if (cashedRes) return cashedRes;
    //if file not exist in cache cache it and return
    return fetch(req).then((networkRes) => {
      caches.open(cacheName).then((cache) => cache.put(req, networkRes));
      return networkRes.clone();
    });
  });
};
//strategy to get files requested from network if request failed try to get files from cache
const fallbackCache = (req) => {
  return fetch(req)
    .then((networkRes) => {
      // case failed to get response go to cache
      if (!networkRes.ok) throw error(networkRes);
      // case success
      caches.open(CacheVersion).then((cache) => cache.put(req, networkRes));

      return networkRes.clone();
    })
    .catch((err) => caches.match(req));
};
