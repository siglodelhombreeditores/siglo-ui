import BaseElemento from './base-elemento';
import { EventListeners } from '../../services/event-listeners';

export default class ProxyElemento<E extends HTMLElement = HTMLElement> extends BaseElemento<E> {}

export class ProxyElementoListenable extends ProxyElemento {
  protected readonly listeners: EventListeners;
  constructor(selector: string | HTMLElement | null = null, parent: Element | ProxyElemento | null = null) {
    super(selector, parent);
    this.listeners = new EventListeners(this);
  }
}