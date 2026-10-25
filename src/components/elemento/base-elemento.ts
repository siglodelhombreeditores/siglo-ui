type ElementOf<C extends abstract new (...args: any) => BaseElemento<any>> =
  InstanceType<C> extends BaseElemento<infer E> ? E : never;

export abstract class BaseElemento<E extends HTMLElement = HTMLElement> {
  protected readonly _selector: string | null = null;
  protected _element: E | null = null;
  private _classList: ElementoClassList | null = null;

  static instance<C extends new (selector: any, parent?: any) => BaseElemento<any>>(
    this: C,
    selector: string | ElementOf<C> | null,
    parent?: Element | BaseElemento<any> | null,
  ): InstanceType<C> | null {
    if (!selector) return null;

    const instance: BaseElemento<any> = new this(selector, parent ?? null);
    return instance.resolve() ? (instance as InstanceType<C>) : null;
  }

  constructor(
    selector: string | E | null = null,
    protected parent: Element | BaseElemento<any> | null = null,
  ) {
    if (typeof selector === 'string') {
      this._selector = selector;
    } else {
      this._element = selector;
    }
  }

  get classList() {
    return this._classList ??= new ElementoClassList(this);
  }

  get dataset(): DOMStringMap {
    return this.element()?.dataset || {}
  }

  /** Subclasses decide what "not found" means. */
  element(): E | null {
    return this.resolve();
  }

  data(key: string, defaultValue: string = ''): string {
    return this.dataset[key] ?? defaultValue;
  }

  hide(): this {
    this.classList.add('d-none');
    return this;
  }

  show(): this {
    this.classList.remove('d-none');
    return this;
  }

  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    this.element()?.addEventListener(type, listener, options);
  }

  querySelector<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K] | null;
  querySelector<K extends keyof SVGElementTagNameMap>(selectors: K): SVGElementTagNameMap[K] | null;
  querySelector<T extends Element = Element>(selectors: string): T | null;
  querySelector(selectors: string): Element | null {
    return this.element()?.querySelector(selectors) ?? null;
  }

  querySelectorAll<K extends keyof HTMLElementTagNameMap>(selectors: K): NodeListOf<HTMLElementTagNameMap[K]>;
  querySelectorAll<T extends Element = Element>(selectors: string): NodeListOf<T>;
  querySelectorAll(selectors: string): NodeListOf<Element> {
    // noinspection CssInvalidHtmlTagReference
    return this.element()?.querySelectorAll(selectors) ?? document.querySelectorAll('nothing-matches-this');
  }

  /** Shared lookup + caching. Returns null if not found. */
  protected resolve(): E | null {
    if (this._element) return this._element;

    if (!this._selector) {
      this._element = document.body as E;
      return this._element;
    }

    let root: ParentNode | null = document;
    if (this.parent) {
      root = this.parent instanceof BaseElemento ? this.parent.element() : this.parent;
    }
    this._element = root ? (root.querySelector(this._selector) as E | null) : null;
    return this._element;
  }
}

export class ElementoClassList {
  constructor(private owner: BaseElemento<any>) {}

  add(...tokens: string[]) {
    this.owner.element()?.classList.add(...tokens);
    return this;
  }
  remove(...tokens: string[]) {
    this.owner.element()?.classList.remove(...tokens);
    return this;
  }
  contains(token: string): boolean {
    return this.owner.element()?.classList.contains(token) ?? false;
  }
}