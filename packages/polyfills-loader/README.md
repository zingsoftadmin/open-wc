# Polyfills loader

The polyfills loader makes it easy to manage loading polyfills and/or serving different versions of your application based on browser support. It generates a script which loads the necessary polyfills and the appropriate version of the application through on runtime feature detection.

A simplified version of the loader:

```html
<script>
  // detect support for various browser features, load a polyfill if necessary
  var polyfills = [];
  if (!('fetch' in window)) {
    polyfills.push(loadScript('./polyfills/fetch.js'));
  }

  if (!('attachShadow' in Element.prototype) || !('getRootNode' in Element.prototype)) {
    polyfills.push(loadScript('./polyfills/webcomponents.js'));
  }

  if (!('IntersectionObserver' in window)) {
    polyfills.push(loadScript('./polyfills/intersection-observer.js'));
  }

  // wait for polyfills to load
  Promise.all(polyfills).then(function() {
    if (!('noModule' in HTMLScriptElement.prototype)) {
      // browser doesn't support es modules, load a SystemJS build with es5
      System.import('./legacy/app.js');
    } else {
      // browser supports modules, import a modern build
      import('./app.js);
    }
  });
</script>
```

## Performance

The primary reason for this project is to make it easier to build performant web apps. The web ecosystem is evolving fast, it's easy for end up with many unnecessary polyfills in your application because all supported browser already implement the feature you are using.

By loading polyfills conditionally, you make sure you only load what's necessary and you don't need to include them in your main bundle. Polyfills are hashed based on content, so they can be cached indefinitely by a web server or service worker.

Serving different versions of your application means you don't need to serve the lowest common denominator to all of your users. This is often achieved used `<script type="module">` and `<script nomodule>`. The polyfills loader uses a variation of this, where the feature detection happens in javascript because we want to ensure polyfills are loaded before any of your application code is run.

## Preloading

Browser optimize loading webpages by scanning ahead for script tags and fetching them right away. Because the polyfills loader moves loading of scripts into javascript, we lose out on this optimisation. For the polyfills this is intentional, because we don't want to load them all the time and since they will be cached this optimisation does not do much anyway.

For your application code, we recommend using `preload` (or `modulepreload` when it is widely supported) links to ensure your application's modern build are fetched from the start.

```html
<head>
  <link rel="preload" href="./app.js" />
  <!-- for module scripts, add a corrs attribute -->
  <link rel="preload" href="./app.js" crossorigin="anonymous" />
</head>
```

## Basic Configuration

You will most likely use the polyfills loader as part of other tools. This is the basic configuration that can be passed to it, all options are optional.

### polyfills

The polyfills config controls which polyills are injected onto the page. These are the possible polyfills:

- [coreJs](https://github.com/zloirock/core-js)
- [regeneratorRuntime](https://github.com/facebook/regenerator/tree/master/packages/regenerator-runtime)
- [webcomponents](https://github.com/webcomponents/webcomponentsjs)
- [fetch](https://github.com/github/fetch)
- [intersectionObserver](https://github.com/w3c/IntersectionObserver)
- [systemjs](https://github.com/systemjs/systemjs) (also injected when one of the resources is systemjs)
- [dynamicImport](https://github.com/GoogleChromeLabs/dynamic-import-polyfill)
- [esModuleShims](https://github.com/guybedford/es-module-shims)

They can be turned on using booleans. When using the polyfills loader directly, these are default false. Other tools may turn on different defaults.

<details>
<summary>View example</summary>

```js
const config = {
  polyfills: {
    coreJs: true,
    fetch: true,
    webcomponents: true,
  },
};
```

</details>

#### hashing

With the `hash` option, polyfill filenames can be hashed based on their content, this allows them to be cached indefinitely.

<details>
<summary>View example</summary>

```js
const config = {
  polyfills: {
    hash: true,
    coreJs: true,
    fetch: true,
    webcomponents: true,
  },
};
```

</details>

#### custom polyfills

If you need a polyfill that isn't available in the default list, you can add a custom polyfill. These consist of at least a unique name, a path where to find the polyfill and a bit of javascript executed at runtime to test whether the polyfill should be loaded.

<details>
<summary>View example</summary>

```js
const config = {
  polyfills: {
    hash: true,
    fetch: true,
    custom: [
      {
        // the name, must be unique
        name: 'my-feature-polyfill',
        // path to the polyfill fle
        path: require.resolve('my-feature-polyfill'),
        // a test that determines when this polyfill should be loaded
        // often this is done by checking whether some property of a
        // feature exists in the window
        test: "!('myFeature' in window)",

        // optional advanced features:

        // if your polyfill is not yet minified, it can be minified by
        // the polyfills loaded if you set it to true
        minify: true,
        // whether your polyfill should be loaded as an es module
        module: false,
        // some polyfills need to be explicitly initialized
        // this can be done with the initializer
        initializer: 'window.myFeaturePolyfills.initialize()',
      },
    ],
  },
};
```

// where to load generated files such as inline scripts
// and polyfills from. defaults to ./
generatedFileDir: './',
// how the es modules in your code should be loaded, can be
moduleType: 'js-module',
extraResources: [{}],
// function to generate an inline script name
generateInlineScriptName: i => `inline-script-${i}.js?generated=true`,

</details>

### exclude

The polyfills loader delays loading any scripts until polyfills are loaded. This can create problems when you rely on specific loading behavior. You can exclude certain scripts with the `exclude` option.

<details>
<summary>View example</summary>

```js
const config = {
  exclude: {
    jsScripts: true,
    jsModules: true,
    inlineJsScripts: true,
    inlineJsModules: true,
  },
};
```

</details>

### generatedFileDir

Inline scripts and polyfills generate new files that are loaded from the polyfills loader. By default inline scripts are loaded from the root of the page, and polyfills from the `polyfills` directory. This can be configured with `generatedFileDir`.

<details>
<summary>View example</summary>

```js
const config = {
  // will load inline scripts as ./generated-files/inline-script-0.js
  // and polyfills as ./generated-files/polyfills/fetch.js
  generatedFileDir: './generated-files',
};
```

</details>

## Usage

The polyfills loaded can be used programatically in two different ways.

### injectPolyfillsLoader

`injectPolyfillsLoader` takes a HTML string, collects all scripts and wraps them in a polyfills loader script.

<details>
<summary>View example</summary>

```js
const { injectPolyfillsLoader } = require('polyfills-loader');

const indexHTMLString = readIndexHTML();

const config = {
  /* see below for config options */
};

const { htmlString, inlineScriptFiles, polyfillFiles } = injectPolyfillsLoader(
  indexHTMLString,
  config,
);
```

</details>

#### Configuration

The configuration takes the same option as the [Basic configuration](#basic-configuration) shown above, along with these advanced options:

<details>
<summary>View example</summary>

```js
const config = {
  // overwrite how module scripts are loaded, for example to always use a polyfill
  moduleType: 'systemjs',

  // extra resources to load for your app, these are not included by the legacy versions
  extraResources: [{ type: 'js-script', path: './extra-resource.js' }],

  // how and when to load legacy versions of your app
  legacy: [
    {
      // the type script to load
      type: 'systemjs',
      // runtime test when to load this version of the app
      // for example when modules aren't supported
      test: "!('noModule' in HTMLScriptElement.prototype)",
      // extra resources to load for this version of app
      extraResources: [{ type: 'js-script', path: './legacy/extra-resources.js' }],
    },
  ],

  // function to modify the way inline script names are generated
  generateInlineScriptName: index => `inline-script-${index}.js`,
};
```

</details>

#### Return values

`injectPolyfillsLoader` returns the new HTML as a string, as well as the generated inline script and polyfill files. These contain the file type, path and content. You will need to ensure these files are available at runtime as they will be requested by the polyfills loader from the browser.

<details>
<summary>View example</summary>

```js
const { htmlString, inlineScriptFiles, polyfillFiles } = injectPolyfillsLoader(
  indexHTMLString,
  config,
);

// example inlineScriptFiles:
[
  { type: 'js-script', path: 'inline-script-0.js', content: 'console.log("foo");' },
  { type: 'js-module', path: 'inline-script-1.js', content: 'console.log(import.meta.url);' },
];

// example polyfillFiles
[
  { type: 'js-script', path: 'polyfills/fetch.js', content: '... polyfill code ...' },
  { type: 'js-script', path: 'polyfills/systemjs.js', content: '... polyfill code ...' },
];
```

</details>

### createPolyfillsLoader

`createPolyfillsLoader` creates just the javascript code necessary for the polyfills loader as a string, you will need to inject it into a script yourself.

```js
const { createPolyfillsLoader } = require('polyfills-loader');

const config = {
  /* see below for config options */
};
const { code, polyfillFiles } = createPolyfillsLoader(config);
```

#### Configuration

#### Return values

`createPolyfillsLoader` returns the polyfills loader code as a string, as well as the generated polyfill files. These contain the file type, path and content. You will need to ensure these files are available at runtime as they will be requested by the polyfills loader from the browser.

<details>
<summary>View example</summary>

```js
const { code, polyfillFiles } = createPolyfillsLoader(config);

// example polyfillFiles
[
  { type: 'js-script', path: 'polyfills/fetch.js', content: '... polyfill code ...' },
  { type: 'js-script', path: 'polyfills/systemjs.js', content: '... polyfill code ...' },
];
```

</details>

## Resource types

Possible resource types are: `systemjs`, `js-module`, `js-module-shim`, and `js-script`.

See [systemjs](https://github.com/systemjs/systemjs) and [es-module-shims](https://github.com/guybedford/es-module-shims) for more info.

## Advanced configuration

The advanced options are useful when interfacing directly with the polyfills loader, when you are using it through another tool the options are configured for you.

```
// modern app build
  resources: [{ type: 'js-module', path: 'app.js' }],
  legacyResources: [
    // legacy app build, only loaded if browser does not support es modules
    {
      test: "!('noModule' in HTMLScriptElement.prototype)",
      resources: [{ type: 'systemjs', path: 'legacy/app.js' }],
    },
  ],
  // polyfills to load
  polyfills: {
    coreJs: true,
    webcomponents: true,
    fetch: true,
    // custom polyfills
    custom: [
      name: 'my-polyfill',
      path: require.resolve('my-polyfill'),
      test: "!('foo' in window)",
    ],
  },
```
