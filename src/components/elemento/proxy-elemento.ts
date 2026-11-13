import { BaseElemento } from './base-elemento';

interface RegisteredListener {
  type: string;
  listener: EventListenerOrEventListenerObject;
  options?: boolean | AddEventListenerOptions;
}

export class ProxyElemento<E extends HTMLElement = HTMLElement> extends BaseElemento<E> {
  private static disconnectObserver: MutationObserver | null = null;
  private static disconnectWatched = new Set<ProxyElemento>();

  private registeredListeners: RegisteredListener[] = [];
  private disconnectedListeners: Array<() => void> = [];

  private static watchDisconnect(instance: ProxyElemento) {
    ProxyElemento.disconnectWatched.add(instance);

    if (!ProxyElemento.disconnectObserver) {
      ProxyElemento.disconnectObserver = new MutationObserver(ProxyElemento.disconnectCheck);
      ProxyElemento.disconnectObserver.observe(document, { childList: true, subtree: true });
    }
  }

  private static disconnectCheck() {
    for (const instance of ProxyElemento.disconnectWatched) {
      if (!instance.isConnected) {
        ProxyElemento.disconnectWatched.delete(instance);

        instance.disconnectedListeners.forEach(cb => cb());

        if (ProxyElemento.disconnectWatched.size === 0 && ProxyElemento.disconnectObserver) {
          ProxyElemento.disconnectObserver.disconnect();
          ProxyElemento.disconnectObserver = null;
        }
      }
    }
  }

  onDisconnected(callback: () => void): void {
    this.disconnectedListeners.push(callback);
    ProxyElemento.watchDisconnect(this);
  }

  reconnect() {
    if (this._selector) {
      this.resolve();
      this.reconnectEvents();
    }
    return this;
  }

  protected onAddEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    this.registeredListeners.push({ type, listener, options });
  }

  protected reconnectEvents() {
    const element = this.element();
    if (element) {
      for (const { type, listener, options } of this.registeredListeners) {
        if (typeof options === "object" && options.signal?.aborted) continue;
        element.addEventListener(type, listener, options);
      }
      if (this.disconnectedListeners.length) {
        ProxyElemento.watchDisconnect(this);
      }
    }
    return this;
  }
}