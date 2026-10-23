import { BaseElemento } from "../elemento/base-elemento";
import { FormInput } from "./form-input";
import { EventListeners } from "../../services/event-listeners";

abstract class BaseForm extends BaseElemento<HTMLFormElement> {

  public static InputClass: typeof FormInput = FormInput;

  protected readonly listeners: EventListeners;

  protected inputs: FormInput[]|null = null;

  constructor(selector: string | HTMLFormElement | null = null, parent: Element | BaseElemento | null = null) {
    super(selector, parent);
    this.listeners = new EventListeners(this);
    this.listeners.onEventAdded('submit', () =>
      this.addEventListener('submit', e => this.listeners.execute('submit', e))
    )
  }

  checkValidity() {
    const valid = this.element()?.checkValidity() ?? false;
    this.classList.add('was-validated');
    return valid;
  }

  onSubmit(listener: (e: SubmitEvent) => void) {
    this.listeners.add('submit', listener);
  }

  submit() {
    this.element()?.submit();
  }

  getInputs(): FormInput[] {
    if (this.inputs === null) {
      this.inputs = [];
      const element = this.element();
      if (element) {
        for (const el of Array.from(element)) {
          if (el instanceof HTMLInputElement) {
            this.inputs.push(new Form.InputClass(el))
          }
        }
      }
    }
    return this.inputs;
  }

  getNamedInput(name: string): FormInput|null {
    for (const input of this.getInputs()) {
      if (input.name === name) {
        return input;
      }
    }
    return null;
  }

  getFormData(): FormData {
    return new FormData(this.element() ?? undefined);
  }
}

export class Form extends BaseForm {
  // Narrower return type is allowed (covariant), and it never returns null
  override element(): HTMLFormElement {
    const element = this.resolve();
    if (!element) throw new Error(`element ${this._selector} not found`);
    return element;
  }
}

export class ProxyForm extends BaseForm {}