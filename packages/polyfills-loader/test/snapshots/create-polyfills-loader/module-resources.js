(function () {
  function loadScript(src, type) {
    var loaded = false,
        thenCb,
        s = document.createElement('script');

    function resolve() {
      document.head.removeChild(s);
      thenCb ? thenCb() : loaded = true;
    }

    s.src = src;
    s.onload = resolve;

    s.onerror = function () {
      console.error('[polyfills-loader] failed to load: ' + src + ' check the network tab for HTTP status.');
      resolve();
    };

    if (type) s.type = type;
    document.head.appendChild(s);
    return {
      then: function (cb) {
        loaded ? cb() : thenCb = cb;
      }
    };
  }

  var polyfills = [];

  if (!('fetch' in window)) {
    polyfills.push(loadScript('./polyfills/fetch.js'));
  }

  polyfills.push(loadScript('./polyfills/systemjs.js'));

  function loadFiles() {
    [function () {
      return loadScript('./app.js', 'module');
    }, function () {
      return loadScript('./shared.js');
    }, function () {
      return System.import('./other.js');
    }].reduce(function (a, c) {
      return a.then(c);
    }, Promise.resolve());
  }

  polyfills.length ? Promise.all(polyfills).then(loadFiles) : loadFiles();
})();