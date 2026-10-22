export class EventListeners<T = (...args: any[]) => any> {
  private readonly events: {[eventName: string]: Array<T>}
  private readonly owner: any;
  private eventAddedListeners: {[eventName: string]: Array<() => void>} = {}

  constructor(owner: any = null) {
    this.events = {};
    this.owner = owner
  }

  get(eventName: string): T[] {
    if (!this.has(eventName)) {
      this.events[eventName] = [];
      this.eventAddedListeners[eventName]?.forEach(callback => callback());
    }
    return this.events[eventName];
  }

  has(eventName: string): boolean {
    return typeof this.events[eventName] !== 'undefined'
  }

  add(eventName: string|string[], listenerCallback: T): this {
    Array.isArray(eventName)
      ? eventName.map(eventName => this.get(eventName).push(listenerCallback))
      : this.get(eventName).push(listenerCallback)
    return this
  }

  execute(eventName: string, ...args: any[]) {
    this.get(eventName).forEach(listener => (listener as (...args: any[]) => any).apply(this.owner, args))
  }

  onEventAdded(eventName: string, listener: () => void): this {
    if (!this.eventAddedListeners[eventName]) {
      this.eventAddedListeners[eventName] = [];
    }
    this.eventAddedListeners[eventName].push(listener);
    return this;
  }
}