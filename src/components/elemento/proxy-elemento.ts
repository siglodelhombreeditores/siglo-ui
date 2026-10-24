import { BaseElemento } from './base-elemento';
import { EventListeners } from '../../services/event-listeners';

export class ProxyElemento<E extends HTMLElement = HTMLElement> extends BaseElemento<E> {
  get isConnected(): boolean {
    return !!(this.element()?.isConnected);
  }
}

export class ProxyElementoListenable<E extends HTMLElement = HTMLElement> extends ProxyElemento<E> {
  protected readonly listeners: EventListeners;
  constructor(selector: string | E | null = null, parent: Element | ProxyElemento | null = null) {
    super(selector, parent);
    this.listeners = new EventListeners(this);
  }
}