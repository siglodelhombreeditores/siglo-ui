type ElementOf<T> = T extends BaseElemento<infer E> ? E : never;

export abstract class BaseElemento<E extends HTMLElement = HTMLElement> {
  protected readonly _selector: string | null = null;
  protected _element: E | null = null;
  private _classList: ElementoClassList | null = null;

  static instance<T extends BaseElemento<any>>(
    this: new (elemento: any) => T,
    selector: string | ElementOf<T> | null,
    parent: Element | BaseElemento<any> | ParentNode = document,
  ): T | null {
    const element= typeof selector === 'string' ? parent.querySelector(selector) : selector;
    return element ? new this(element) : null;
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

  get classList(): ElementoClassList {
    return this._classList ??= new ElementoClassList(this);
  }

  get dataset(): DOMStringMap {
    return this.element()?.dataset || {}
  }

  get isConnected(): boolean {
    return !!(this.element()?.isConnected);
  }

  get selector(): string|null {
    return this._selector;
  }

  appendChild(child: HTMLElement | BaseElemento): void {
    const element = this.element();
    if (element) {
      const childElement = child instanceof BaseElemento ? child.element() : child;
      if (childElement) {
        element.appendChild(childElement);
      }
    }
  }

  contains(child: Node | BaseElemento): boolean {
    const element = this.element();
    const childElement = element && child instanceof BaseElemento ? child.element() : child;
    return element && childElement ? element.contains(childElement as Node) : false;
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
    this.onAddEventListener(type, listener, options);
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

    this._element = (this.parent || document).querySelector(this._selector) as E | null;
    return this._element;
  }

  protected onAddEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {}
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
  toggle(token: string, force: boolean) {
    this.owner.element()?.classList.toggle(token, force);
    return this;
  }
}