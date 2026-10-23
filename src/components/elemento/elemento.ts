import { BaseElemento } from './base-elemento';
import { EventListeners } from '../../services/event-listeners';

export class Elemento<E extends HTMLElement = HTMLElement> extends BaseElemento<E> {
  static instance<E extends HTMLElement, T extends Elemento<E>>(
    this: new (element: E) => T,
    selector: string | E | null,
    parent?: HTMLElement|Elemento
  ): T | null {
    let instance: T | null = null;
    if (selector instanceof HTMLElement) {
      instance = new this(selector as E);
    } else if (selector) {
      const root: ParentNode = parent instanceof Elemento ? parent.element() : (parent ?? document);
      const element = root.querySelector(selector);
      instance = element ? new this(element as E) : null;
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
  constructor(element: string | E, parent?: HTMLElement | Elemento) {
    super(element, parent);
    this.listeners = new EventListeners(this);
  }
}