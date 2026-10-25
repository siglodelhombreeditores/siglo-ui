import { BaseElemento } from './base-elemento';
import { EventListeners } from '../../services/event-listeners';

export class Elemento<E extends HTMLElement = HTMLElement> extends BaseElemento<E> {
  static require<E extends HTMLElement, T extends Elemento<E>>(
    this: new (element: E) => T,
    selector: string | E,
    parent?: HTMLElement|BaseElemento
  ): T {
    let instance: T | null = null;
    if (selector instanceof HTMLElement) {
      instance = new this(selector as E);
    } else {
      const root: ParentNode|null = parent instanceof BaseElemento ? parent.element() : (parent ?? document);
      const element = root?.querySelector(selector);
      if (element) {
        instance = new this(element as E);
      } else {
        throw new Error(`element ${selector} not found`);
      }
    }
    return instance;
  }

  // Narrower return type is allowed (covariant), and it never returns null
  override element(): E {
    const element = this.resolve();
    if (!element) throw new Error(`element ${this._selector} not found`);
    return element;
  }
}

export class ElementoListenable<E extends HTMLElement = HTMLElement> extends Elemento<E> {
  protected readonly listeners: EventListeners;
  constructor(element: string | E, parent?: HTMLElement | BaseElemento) {
    super(element, parent);
    this.listeners = new EventListeners(this);
  }
}