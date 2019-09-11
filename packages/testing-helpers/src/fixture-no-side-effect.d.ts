/**
 * Renders a string/TemplateResult and puts it in the DOM via a fixtureWrapper.
 *
 * @example
 * const el = fixtureSync('<my-el><span></span></my-el>');
 *
 * @template {Element} T
 * @param {import('./litFixture').LitHTMLRenderable} template Either a string or lit-html TemplateResult
 * @returns {T} First child of the rendered DOM
 */
export function fixtureSync<T extends Element>(template: string | number | boolean | string[] | number[] | Node | boolean[] | Node[] | import("lit-html").TemplateResult | import("lit-html").TemplateResult[]): T;
/**
 * Renders a string/TemplateResult and puts it in the DOM via a fixtureWrapper.
 * By default fixture awaits the elements "update complete" Promise.
 * - for [lit-element](https://github.com/polymer/lit-element) that is `el.updateComplete`;
 * - for [stencil](https://github.com/ionic-team/stencil/) that is `el.componentOnReady()`;
 *
 * If none of those specfic Promise hooks are found, it will wait for one frame via
 * `await nextFrame()`.
 *
 * **Note**: this does not guarantee that the element is done rendering -
 * it just waits for the next JavaScript tick.
 *
 * @example
 * const el = await fixture('<my-el><span></span></my-el>');
 * expect(el.fullyRendered).to.be.true;
 *
 * @template {Element} T
 * @param {import('./litFixture').LitHTMLRenderable} template Either a string or lit-html TemplateResult
 * @returns {Promise<T>} A Promise that will resolve to the first child of the rendered DOM
 */
export function fixture<T extends Element>(template: string | number | boolean | string[] | number[] | Node | boolean[] | Node[] | import("lit-html").TemplateResult | import("lit-html").TemplateResult[]): Promise<T>;
