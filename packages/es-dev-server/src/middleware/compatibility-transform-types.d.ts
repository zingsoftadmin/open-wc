import { FileData } from '../utils/compatibility-transform.js';
import { TransformJs } from '../utils/inject-polyfills-loader-types.js';

export interface CompatibilityTransformMiddleware {
  rootDir: string;
  fileExtensions: string[];
  transformJs: TransformJs;
}
