/* eslint-disable no-param-reassign */
/** @typedef {import('../src/types').CreatePolyfillsLoaderConfig} CreatePolyfillsLoaderConfig  */
/** @typedef {import('../src/types').PolyfillFile} PolyfillFile  */

const path = require('path');
const { expect } = require('chai');
const { createPolyfillsData } = require('../src/create-polyfills-data');
const { noModuleSupportTest, fileTypes } = require('../src/utils');

/**
 * @param {PolyfillFile} polyfill
 */
function cleanupPolyfill(polyfill) {
  delete polyfill.content;

  Object.entries(polyfill).forEach(([key, value]) => {
    if (value === undefined) {
      // @ts-ignore
      delete polyfill[key];
    }
  });
}

describe('polyfills', () => {
  it('returns the correct polyfills data', () => {
    /** @type {CreatePolyfillsLoaderConfig} */
    const config = {
      modern: { files: [{ type: fileTypes.MODULE, path: 'foo.js' }] },
      polyfills: {
        hash: false,
        coreJs: true,
        webcomponents: true,
        fetch: true,
        intersectionObserver: true,
        dynamicImport: true,
        esModuleShims: true,
      },
    };

    const polyfills = createPolyfillsData(config);
    polyfills.forEach(p => {
      expect(p.content).to.be.a('string');
      cleanupPolyfill(p);
    });

    expect(polyfills).to.eql([
      {
        type: fileTypes.SCRIPT,
        path: 'polyfills/core-js.js',
        test: "!('noModule' in HTMLScriptElement.prototype)",
      },
      {
        type: fileTypes.SCRIPT,
        path: 'polyfills/fetch.js',
        test: "!('fetch' in window)",
      },
      {
        type: fileTypes.SCRIPT,
        path: 'polyfills/dynamic-import.js',
        initializer:
          "window.dynamicImportPolyfill.initialize({ importFunctionName: 'importShim' });",
        test:
          "'noModule' in HTMLScriptElement.prototype && (function () { try { Function('window.importShim = s => import(s);').call(); return true; } catch (_) { return false } })()",
      },
      {
        type: fileTypes.MODULE,
        path: 'polyfills/es-module-shims.js',
        test: "'noModule' in HTMLScriptElement.prototype",
      },
      {
        type: fileTypes.SCRIPT,
        path: 'polyfills/intersection-observer.js',
        test:
          "!('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype)",
      },
      {
        type: fileTypes.SCRIPT,
        path: 'polyfills/webcomponents.js',
        test: "!('attachShadow' in Element.prototype) || !('getRootNode' in Element.prototype)",
      },
      {
        type: fileTypes.SCRIPT,
        path: 'polyfills/custom-elements-es5-adapter.js',
        test: "!('noModule' in HTMLScriptElement.prototype) && 'getRootNode' in Element.prototype",
      },
    ]);
  });

  it("loads systemjs when an entrypoint needs it, including it's test", () => {
    /** @type {CreatePolyfillsLoaderConfig} */
    const config = {
      modern: { files: [{ type: fileTypes.MODULE, path: 'foo.js' }] },
      legacy: [
        {
          test: noModuleSupportTest,
          files: [{ type: fileTypes.SYSTEMJS, path: 'foo.js' }],
        },
      ],
      polyfills: {
        hash: false,
      },
    };

    const polyfills = createPolyfillsData(config);
    polyfills.forEach(p => {
      expect(p.content).to.be.a('string');
      cleanupPolyfill(p);
    });

    expect(polyfills).to.eql([
      {
        type: fileTypes.SCRIPT,
        path: 'polyfills/systemjs.js',
        test: "!('noModule' in HTMLScriptElement.prototype)",
      },
    ]);
  });

  it('loads systemjs when an entrypoint needs it, including multiple tests', () => {
    /** @type {CreatePolyfillsLoaderConfig} */
    const config = {
      modern: { files: [{ type: fileTypes.MODULE, path: 'foo.js' }] },
      legacy: [
        {
          test: "'foo' in bar",
          files: [{ type: fileTypes.SYSTEMJS, path: 'foo.js' }],
        },
        {
          test: noModuleSupportTest,
          files: [{ type: fileTypes.SYSTEMJS, path: 'foo.js' }],
        },
      ],
      polyfills: {
        hash: false,
      },
    };

    const polyfills = createPolyfillsData(config);
    polyfills.forEach(p => {
      expect(p.content).to.be.a('string');
      cleanupPolyfill(p);
    });

    expect(polyfills).to.eql([
      {
        type: fileTypes.SCRIPT,
        path: 'polyfills/systemjs.js',
        test: "'foo' in bar || !('noModule' in HTMLScriptElement.prototype)",
      },
    ]);
  });

  it('always loads systemjs if an entrypoint has no tests', () => {
    /** @type {CreatePolyfillsLoaderConfig} */
    const config = {
      modern: { files: [{ type: fileTypes.SYSTEMJS, path: 'foo.js' }] },
      polyfills: {
        hash: false,
      },
    };

    const polyfills = createPolyfillsData(config);
    polyfills.forEach(p => {
      expect(p.content).to.be.a('string');
      cleanupPolyfill(p);
    });

    expect(polyfills).to.eql([
      {
        type: fileTypes.SCRIPT,
        path: 'polyfills/systemjs.js',
      },
    ]);
  });

  it('can load custom polyfills', () => {
    const custom = [
      {
        name: 'polyfill-a',
        test: "'foo' in window",
        path: path.resolve(__dirname, 'custom-polyfills/polyfill-a.js'),
      },
      {
        name: 'polyfill-b',
        path: path.resolve(__dirname, 'custom-polyfills/polyfill-b.js'),
      },
    ];

    /** @type {CreatePolyfillsLoaderConfig} */
    const config = {
      modern: { files: [{ type: fileTypes.MODULE, path: 'foo.js' }] },
      polyfills: {
        hash: false,
        coreJs: true,
        webcomponents: false,
        fetch: false,
        intersectionObserver: false,
        custom,
      },
    };

    const polyfills = createPolyfillsData(config);
    polyfills.forEach(p => {
      expect(p.content).to.be.a('string');
      cleanupPolyfill(p);
    });

    expect(polyfills).to.eql([
      {
        type: fileTypes.SCRIPT,
        path: 'polyfills/polyfill-a.js',
        test: "'foo' in window",
      },
      {
        type: fileTypes.SCRIPT,
        path: 'polyfills/polyfill-b.js',
      },
      {
        type: fileTypes.SCRIPT,
        path: 'polyfills/core-js.js',
        test: "!('noModule' in HTMLScriptElement.prototype)",
      },
    ]);
  });
});
