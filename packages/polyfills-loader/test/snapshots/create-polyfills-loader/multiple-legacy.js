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

  if (!('noModule' in HTMLScriptElement.prototype) || 'foo' in bar) {
    polyfills.push(loadScript('./polyfills/systemjs.js'));
  }

  function loadFiles() {
    if (!('noModule' in HTMLScriptElement.prototype)) {
      [function () {
        return System.import('./legacy/app-1.js');
      }, function () {
        return loadScript('./legacy/app-2.js');
      }].reduce(function (a, c) {
        return a.then(c);
      }, Promise.resolve());
    } else if ('foo' in bar) {
      [function () {
        return loadScript('./foobar/app-1.js');
      }, function () {
        return System.import('./foobar/app-2.js');
      }].reduce(function (a, c) {
        return a.then(c);
      }, Promise.resolve());
    } else {
      [function () {
        return loadScript('./app-1.js', 'module');
      }, function () {
        return loadScript('./app-2.js');
      }].reduce(function (a, c) {
        return a.then(c);
      }, Promise.resolve());
    }
  }

  polyfills.length ? Promise.all(polyfills).then(loadFiles) : loadFiles();
})();