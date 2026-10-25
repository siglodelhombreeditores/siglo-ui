// @ts-ignore
import BootstrapBackdrop from 'bootstrap/js/dist/util/backdrop'
import { ProxyElemento } from "../elemento/proxy-elemento";

export type BootstrapBackdropType = {
  _getElement: () => HTMLElement,
  show: (callback?: () => void) => void,
  hide: (callback?: () => void) => void,
};

export class Backdrop extends ProxyElemento {}

export class BackdropMain extends Backdrop {
  private readonly bootstrapBackdrop: BootstrapBackdropType;

  constructor() {
    const bootstrapBackdrop = new BootstrapBackdrop({isAnimated: true})
    super(bootstrapBackdrop._getElement());
    this.bootstrapBackdrop = bootstrapBackdrop;
  }

  show(): this {
    this.bootstrapBackdrop.show();
    return this;
  }
  hide(): this {
    this.bootstrapBackdrop.hide();
    return this;
  }

  getBootstrapBackdrop(): BootstrapBackdropType {
    return this.bootstrapBackdrop;
  }
}