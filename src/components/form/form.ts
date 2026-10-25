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

  namedItem<I extends HTMLElement = HTMLInputElement>(name: string): I | null {
    return this.element()?.elements.namedItem(name) as I | null;
  }

  getFormData(append?: Record<string, string|Blob>): FormData {
    const formData = new FormData(this.element() ?? undefined);
    if (append) {
      for (const key in append) {
        formData.append(key, append[key]);
      }
    }
    return formData;
  }

  clearInputs(): this {
    this.getInputs().forEach(input => input.clear());
    return this;
  }

  setInputsInvalidFeedback(invalidFeedbacks: Record<string, string|false|null>): this {
    this.getInputs().forEach(input => input.setInvalidFeedback(invalidFeedbacks[input.name] ?? false));
    return this;
  }
}

export class Form extends BaseForm {
  // Narrower return type is allowed (covariant), and it never returns null
  override element(): HTMLFormElement {
    const element = this.resolve();
    if (!element) throw new Error(`element ${this._selector} not found`);
    return element;
  }

  override getNamedInput(name: string): FormInput {
    for (const input of this.getInputs()) {
      if (input.name === name) {
        return input;
      }
    }
    throw new Error(`Form input "${name}" not found`);
  }

  override namedItem<I extends HTMLElement = HTMLInputElement>(name: string): I;
  override namedItem<I extends HTMLElement = HTMLInputElement>(name: string): I | null;
  override namedItem<I extends HTMLElement = HTMLInputElement>(name: string): I {
    const element = super.namedItem<I>(name);
    if (!element) {
      throw new Error(`Form element "${name}" not found`);
    }
    return element;
  }
}

export class ProxyForm extends BaseForm {}