/**
 * Setups an element synchronously from the provided lit-html template and puts it in the DOM.
 *
 * @template {Element} T - Is an element or a node
 * @param {LitHTMLRenderable} template
 * @returns {T}
 */
export function litFixtureSync<T extends Element>(template: string | number | boolean | string[] | number[] | Node | boolean[] | Node[] | TemplateResult | TemplateResult[]): T;
/**
 * Setups an element asynchronously from the provided lit-html template and puts it in the DOM.
 *
 * @template {Element} T - Is an element or a node
 * @param {LitHTMLRenderable} template
 * @returns {Promise<T>}
 */
export function litFixture<T extends Element>(template: string | number | boolean | string[] | number[] | Node | boolean[] | Node[] | TemplateResult | TemplateResult[]): Promise<T>;
export type LitHTMLRenderable = string | number | boolean | string[] | number[] | Node | boolean[] | Node[] | TemplateResult | TemplateResult[];
import { TemplateResult } from "lit-html";
