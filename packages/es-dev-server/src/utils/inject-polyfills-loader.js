/** @typedef {import('parse5').Document} DocumentAst */
/** @typedef {import('parse5').Node} NodeAst */
/** @typedef {import('./inject-polyfills-loader-types').InjectPolyfillsLoaderConfig} InjectPolyfillsLoaderConfig */
/** @typedef {import('polyfills-loader').File} File */
/** @typedef {import('polyfills-loader').GeneratedFile} GeneratedFile */
/** @typedef {import('polyfills-loader').PolyfillsConfig} PolyfillsConfig */

import {
  getAttribute,
  getTextContent,
  remove,
  setTextContent,
} from '@open-wc/building-utils/dom5-fork/index.js';
import { parse, serialize } from 'parse5';
import deepmerge from 'deepmerge';
import {
  injectPolyfillsLoader as originalInjectPolyfillsLoader,
  fileTypes,
  findJsScripts,
  getScriptFileType,
} from 'polyfills-loader';
import { compatibilityModes, virtualFilePrefix } from '../constants.js';
import { logDebug } from './utils.js';

export const systemJsTransformResolverPath = `${virtualFilePrefix}systemjs-transform-resolver.js`;

/** @type {PolyfillsConfig} */
const allPolyfills = {
  coreJs: true,
  regeneratorRuntime: true,
  fetch: true,
  webcomponents: true,
};

/** @type {PolyfillsConfig} */
const allPolyfillsWithSystemjs = {
  ...allPolyfills,
  systemjsExtended: true,
};

/**
 * In max compatibility mode, we need to load the regenerator runtime on all browsers since
 * we're always compiling to es5.
 */
/** @type {PolyfillsConfig} */
const maxPolyfills = {
  ...allPolyfillsWithSystemjs,
  regeneratorRuntime: 'always',
};

/**
 * @param {InjectPolyfillsLoaderConfig} cfg
 * @returns {PolyfillsConfig}
 */
function getPolyfillsConfig(cfg) {
  switch (cfg.compatibilityMode) {
    case compatibilityModes.MAX:
      return maxPolyfills;
    case compatibilityModes.MIN:
      return allPolyfills;
    case compatibilityModes.AUTO:
    case compatibilityModes.ALWAYS:
      if (cfg.compatibilityMode === compatibilityModes.AUTO && cfg.uaCompat.modern) {
        return {};
      }

      if (cfg.uaCompat.supportsEsm) {
        return allPolyfills;
      }
      return allPolyfillsWithSystemjs;
    default:
      return {};
  }
}

/**
 * @param {InjectPolyfillsLoaderConfig} cfg
 * @param {DocumentAst} documentAst
 */
function findScripts(cfg, documentAst) {
  const scriptNodes = findJsScripts(
    documentAst,
    cfg.polyfillsLoaderConfig && cfg.polyfillsLoaderConfig.exclude,
  );

  /** @type {File[]}  */
  const files = [];
  /** @type {GeneratedFile[]} */
  const inlineScripts = [];
  /** @type {NodeAst[]} */
  const inlineScriptNodes = [];
  scriptNodes.forEach((scriptNode, i) => {
    const type = getScriptFileType(scriptNode);
    let path = getAttribute(scriptNode, 'src');

    if (!path) {
      path = `inline-script-${i}.js?source=${encodeURIComponent(cfg.indexUrl)}`;
      inlineScripts.push({
        path,
        type,
        content: getTextContent(scriptNode),
      });
      inlineScriptNodes.push(scriptNode);
    }

    files.push({
      type,
      path,
    });
  });

  return { files, inlineScripts, inlineScriptNodes };
}

/**
 * @param {PolyfillsConfig} polyfills
 */
function hasPolyfills(polyfills) {
  const { hash, custom, ...rest } = polyfills;
  return (custom && custom.length > 0) || Object.values(rest).some(v => v !== false);
}

/**
 * @param {InjectPolyfillsLoaderConfig} cfg
 * @param {NodeAst[]} inlineScriptNodes
 */
async function transformInlineScripts(cfg, inlineScriptNodes) {
  const asyncTransforms = [];

  for (const scriptNode of inlineScriptNodes) {
    const asyncTransform = cfg
      .transformJs({
        uaCompat: cfg.uaCompat,
        filePath: cfg.indexFilePath,
        code: getTextContent(scriptNode),
        transformModule: false,
      })
      .then(code => {
        setTextContent(scriptNode, code);
      });
    asyncTransforms.push(asyncTransform);
  }

  await Promise.all(asyncTransforms);
}

/**
 * transforms index.html, extracting any modules and import maps and adds them back
 * with the appropriate polyfills, shims and a script loader so that they can be loaded
 * at the right time
 *
 * @param {InjectPolyfillsLoaderConfig} cfg
 * @returns {Promise<{ indexHTML: string, inlineScripts: GeneratedFile[], polyfills: GeneratedFile[] }>}
 */
export async function injectPolyfillsLoader(cfg) {
  const polyfillModules =
    ([compatibilityModes.AUTO, compatibilityModes.ALWAYS].includes(cfg.compatibilityMode) &&
      !cfg.uaCompat.supportsEsm) ||
    cfg.compatibilityMode === compatibilityModes.MAX;

  const documentAst = parse(cfg.htmlString);
  const { files, inlineScripts, inlineScriptNodes } = findScripts(cfg, documentAst);

  const polyfillsConfig = getPolyfillsConfig(cfg);

  if (!hasPolyfills(polyfillsConfig) && !polyfillModules) {
    // no polyfils module polyfills, so we don't need to inject a loader
    if (inlineScripts && inlineScripts.length > 0) {
      // there are inline scripts, we need to transform them
      // transformInlineScripts mutates documentAst
      await transformInlineScripts(cfg, inlineScriptNodes);
      return { indexHTML: serialize(documentAst), inlineScripts, polyfills: [] };
    }
    return { indexHTML: cfg.htmlString, inlineScripts: [], polyfills: [] };
  }

  // we will inject a loader, so we need to remove the inline script nodes as the loader
  // will include them as virtual modules
  for (const scriptNode of inlineScriptNodes) {
    // remove script from document
    remove(scriptNode);
  }

  const polyfillsLoaderConfig = deepmerge(
    {
      modern: {
        type: polyfillModules ? fileTypes.SYSTEMJS : fileTypes.MODULE,
        files,
      },
      polyfills: polyfillsConfig,
    },
    cfg.polyfillsLoaderConfig || {},
  );

  logDebug('[polyfills-loader] config', polyfillsLoaderConfig);

  const result = originalInjectPolyfillsLoader(serialize(document), polyfillsLoaderConfig);

  logDebug(
    '[polyfills-loader] generated polyfills: ',
    result.polyfillFiles.map(p => ({ ...p, content: '[stripped]' })),
  );

  logDebug(
    'Inline scripts generated by polyfills-loader',
    inlineScripts.map(p => ({ ...p, content: '[stripped]' })),
  );

  return {
    indexHTML: result.htmlString,
    inlineScripts,
    polyfills: result.polyfillFiles,
  };
}
