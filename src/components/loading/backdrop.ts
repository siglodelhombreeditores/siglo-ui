// @ts-ignore
import BootstrapBackdrop from 'bootstrap/js/dist/util/backdrop'
import { ProxyElemento } from "../elemento/proxy-elemento";

export type BootstrapBackdropType = {
  _getElement: () => HTMLElement,
  show: (callback?: () => void) => void,
  hide: (callback?: () => void) => void,
};

export class Backdrop extends ProxyElemento {
  show() {
    this.classList.remove('d-none');
  }
  hide() {
    this.classList.add('d-none');
  }
}

export class BackdropMain extends Backdrop {
  private readonly bootstrapBackdrop: BootstrapBackdropType;

  constructor() {
    const bootstrapBackdrop = new BootstrapBackdrop({isAnimated: true})
    super(bootstrapBackdrop._getElement());
    this.bootstrapBackdrop = bootstrapBackdrop;
  }

  show() {
    this.bootstrapBackdrop.show()
  }
  hide() {
    this.bootstrapBackdrop.hide()
  }

  getBootstrapBackdrop(): BootstrapBackdropType {
    return this.bootstrapBackdrop;
  }
}