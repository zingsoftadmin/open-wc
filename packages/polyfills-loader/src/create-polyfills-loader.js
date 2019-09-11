/* eslint-disable prefer-template */
/** @typedef {import('./types').PolyfillsLoaderConfig} PolyfillsLoaderConfig */
/** @typedef {import('./types').File} File */
/** @typedef {import('./types').GeneratedFile} GeneratedFile */
/** @typedef {import('./types').PolyfillFile} PolyfillFile */
/** @typedef {import('./types').PolyfillsConfig} PolyfillsConfig */
/** @typedef {import('./types').PolyfillConfig} PolyfillConfig */
/** @typedef {import('./types').PolyfillsLoader} PolyfillsLoader */
/** @typedef {import('./types').LegacyEntrypoint} LegacyEntrypoint */

const { transform } = require('@babel/core');
const Terser = require('terser');
const { fileTypes, hasFileOfType, cleanImportPath, toBrowserPath } = require('./utils');
const { createPolyfillsData } = require('./create-polyfills-data');

const DEFAULT_POLYFILLS_DIR = 'polyfills';

/**
 * Function which loads a script dynamically, returning a thenable (object with then function)
 * because Promise might not be loaded yet
 */
const loadScriptFunction = `
  function loadScript(src, type) {
    var loaded = false, thenCb, s = document.createElement('script');
    function resolve() {
      document.head.removeChild(s);
      thenCb ? thenCb() : loaded = true;
    }
    s.src = src;
    s.onload = resolve;
    s.onerror = function () {
      console.error('[polyfills-loader] failed to load: ' + src + ' check the network tab for HTTP status.');
      resolve();
    }
    if (type) s.type = type;
    document.head.appendChild(s);
    return { then: function (cb) { loaded ? cb() : thenCb = cb; } };
  }
`;

/**
 * Returns the loadScriptFunction if a script will be loaded for this config.
 * @param {PolyfillsLoaderConfig} cfg
 * @param {PolyfillFile[]} polyfills
 * @returns {string}
 */
function createLoadScriptCode(cfg, polyfills) {
  const { MODULE, SCRIPT, ES_MODULE_SHIMS } = fileTypes;
  if (
    (polyfills && polyfills.length > 0) ||
    [SCRIPT, MODULE, ES_MODULE_SHIMS].some(type => hasFileOfType(cfg, type))
  ) {
    return loadScriptFunction;
  }

  return '';
}

/**
 * Returns a js statement which loads the given resource in the browser.
 * @param {File} file
 */
function createLoadFile(file) {
  const resourePath = cleanImportPath(file.path);

  switch (file.type) {
    case fileTypes.SCRIPT:
      return `loadScript('${resourePath}')`;
    case fileTypes.MODULE:
      return `loadScript('${resourePath}', 'module')`;
    case fileTypes.ES_MODULE_SHIMS:
      return `loadScript('${resourePath}', 'module-shim')`;
    case fileTypes.SYSTEMJS:
      return `System.import('${resourePath}')`;
    default:
      throw new Error(`Unknown resource type: ${file.type}`);
  }
}

/**
 * Creates a statement which loads the given resources in the browser sequentually.
 * @param {File[]} files
 */
function createLoadFiles(files) {
  if (files.length === 1) {
    return createLoadFile(files[0]);
  }

  return `[
    ${files.map(r => `function() { return ${createLoadFile(r)} }`)}
  ].reduce(function (a, c) {
    return a.then(c);
  }, Promise.resolve())`;
}

/**
 * Creates js code which loads the correct resources, uses runtime feature detection
 * of legacy resources are configured to load the appropriate resources.
 * @param {PolyfillsLoaderConfig} cfg
 */
function createLoadFilesFunction(cfg) {
  const loadResources = createLoadFiles(cfg.modern.files);
  if (!cfg.legacy || cfg.legacy.length === 0) {
    return loadResources;
  }

  /**
   * @param {string} all
   * @param {LegacyEntrypoint} current
   * @param {number} i
   */
  function reduceFn(all, current, i) {
    return `${all}${i !== 0 ? ' else ' : ''}if (${current.test}) {
      ${createLoadFiles(current.files)}
    }`;
  }
  const loadLegacyResources = cfg.legacy.reduce(reduceFn, '');

  return `${loadLegacyResources} else {
      ${loadResources}
    }`;
}

/**
 * Creates js code which waits for polyfills if applicable, and executes
 * the code which loads entrypoints.
 * @param {PolyfillsLoaderConfig} cfg
 * @param {PolyfillFile[]} polyfills
 * @returns {string}
 */
function createLoadFilesCode(cfg, polyfills) {
  const loadFilesFunction = createLoadFilesFunction(cfg);

  // create a separate loadFiles to be run after polyfills
  if (polyfills && polyfills.length > 0) {
    return `
  function loadFiles() {
    ${loadFilesFunction}
  }

  polyfills.length ? Promise.all(polyfills).then(loadFiles) : loadFiles()`;
  }

  // there are no polyfills, load entries straight away
  return `${loadFilesFunction}`;
}

/**
 * Creates code which loads the configured polyfills
 * @param {PolyfillsLoaderConfig} cfg
 * @param {PolyfillFile[]} polyfills
 * @returns {{ loadPolyfillsCode: string, generatedFiles: GeneratedFile[] }}
 */
function createPolyfillsLoaderCode(cfg, polyfills) {
  if (!polyfills || polyfills.length === 0) {
    return { loadPolyfillsCode: '', generatedFiles: [] };
  }
  /** @type {GeneratedFile[]} */
  const generatedFiles = [];
  let loadPolyfillsCode = '  var polyfills = [];';

  polyfills.forEach(polyfill => {
    let loadScript = `loadScript('./${toBrowserPath(polyfill.path)}')`;
    if (polyfill.initializer) {
      loadScript += `.then(function () { ${polyfill.initializer} })`;
    }
    const loadPolyfillCode = `polyfills.push(${loadScript})`;

    if (polyfill.test) {
      loadPolyfillsCode += `if (${polyfill.test}) { ${loadPolyfillCode} }`;
    } else {
      loadPolyfillsCode += `${loadPolyfillCode}`;
    }

    generatedFiles.push({
      type: polyfill.type,
      path: polyfill.path,
      content: polyfill.content,
    });
  });

  return { loadPolyfillsCode, generatedFiles };
}

/**
 * Creates a loader script that executes immediately, loading the configured
 * polyfills and resources (app entrypoints, scripts etc.).
 *
 * @param {PolyfillsLoaderConfig} cfg
 * @returns {PolyfillsLoader | null}
 */
function createPolyfillsLoader(cfg) {
  const polyfills = createPolyfillsData(cfg);
  const { loadPolyfillsCode, generatedFiles } = createPolyfillsLoaderCode(cfg, polyfills);

  let code = `
    (function () {
      ${createLoadScriptCode(cfg, polyfills)}
      ${loadPolyfillsCode}
      ${createLoadFilesCode(cfg, polyfills)}
    })();
  `;

  if (cfg.minify) {
    const output = Terser.minify(code);
    if (!output || !output.code) {
      throw new Error('Could not minify loader.');
    }
    ({ code } = output);
  } else {
    const output = transform(code);
    if (!output || !output.code) {
      throw new Error('Could not prettify loader.');
    }
    ({ code } = output);
  }

  return { code, polyfillFiles: generatedFiles };
}

module.exports = {
  createPolyfillsLoader,
  DEFAULT_POLYFILLS_DIR,
};
