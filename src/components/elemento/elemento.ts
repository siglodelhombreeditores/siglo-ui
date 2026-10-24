import { BaseElemento } from './base-elemento';
import { EventListeners } from '../../services/event-listeners';

export class Elemento<E extends HTMLElement = HTMLElement> extends BaseElemento<E> {
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