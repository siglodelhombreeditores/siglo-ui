import { elementCreate } from "../../services/element/element-create";

export class FormInput {
  private _parent: HTMLElement | null = null;

  constructor(protected element: HTMLInputElement) {}

  get checked(): boolean {
    return this.element.checked;
  }

  get name(): string {
    return this.element.name;
  }

  get parent(): HTMLElement {
    return this._parent ? this._parent : (this._parent = this.getParent());
  }

  get type(): string {
    return this.element.type;
  }

  set value(value: string) {
    this.element.value = value;
  }

  setInvalidFeedback(message: string | false) {
    const prevInvalidFeedback =
      this.parent.querySelector<HTMLElement>(".invalid-feedback");
    if (prevInvalidFeedback) {
      if (message === false) {
        this.element.classList.remove("is-invalid");
        prevInvalidFeedback.remove();
      } else {
        prevInvalidFeedback.innerText = message;
      }
    } else if (message) {
      this.element.classList.add("is-invalid");
      this.parent.appendChild(elementCreate(`div.invalid-feedback:contains("${message}")`));
    }
  }

  clear () {
    if (this.element.type === 'radio') {
      this.element.checked = false;
    } else {
      this.element.value = '';
    }
    this.setInvalidFeedback(false);
  }

  click() {
    this.element.click();
  }

  protected getParent(): HTMLElement {
    let parent = this.element.parentElement as HTMLElement;
    if (this.element.type === "radio") {
      parent = parent.parentElement as HTMLElement;
    }
    return parent;
  }
}