import { loader } from "./loader";
import { stringToNode } from "../services/element/element";

export function updateFormFields() {
  const updateFieldsTriggers = document.querySelectorAll<HTMLSelectElement>('[data-update-form-fields-trigger]');
  if (updateFieldsTriggers) {
    if (!loader.isInserted()) {
      loader.appendTo('.card');
    }

    updateFieldsTriggers.forEach(select => select.addEventListener('change', async () => {
      try {
        loader.show();
        const newFormGroups = await fetchFormGroups(select.dataset.updateFormFieldsTrigger as string, select.value);
        const currentFormGroups = FormGroup.buildFromForm(select.form!);
        const formWrapper = FormGroup.findIn(currentFormGroups, select.name)!.element.parentElement!;
        updateFormGroups(formWrapper, currentFormGroups, newFormGroups)
      } finally {
        loader.hide();
      }
    }));
  }
}

async function fetchForm(url: string, updateFieldsValue: string): Promise<HTMLFormElement> {
  url += (url.includes('?') ? '&' : '?') + 'updateFieldsValue=' + encodeURIComponent(updateFieldsValue);
  const updateFieldsResponse = await (await fetch(url)).text();
  return stringToNode(updateFieldsResponse).querySelector('form') as HTMLFormElement;
}

async function fetchFormGroups(url: string, updateFieldsValue: string): Promise<FormGroup[]> {
  const form = await fetchForm(url, updateFieldsValue);
  return FormGroup.buildFromForm(form);
}

function updateFormGroups(container: HTMLElement, currentFormGroups: FormGroup[], newFormGroups: FormGroup[]) {
  currentFormGroups = currentFormGroups.filter(currentFormGroup => {
    if (!FormGroup.findIn(newFormGroups, currentFormGroup.name)) {
      currentFormGroup.element.remove();
      return false;
    }
    return true;
  })
  for (const newFormGroup of newFormGroups) {
    const currentFormGroup = FormGroup.findIn(currentFormGroups, newFormGroup.name);
    if (!currentFormGroup) {
      insertFormGroup(container, newFormGroup, newFormGroups, currentFormGroups);
    } else {
      if (currentFormGroup.type !== newFormGroup.type) {
        currentFormGroup.element.replaceWith(newFormGroup.element)
      } else {
        currentFormGroup.syncAttributes(newFormGroup);
      }
    }
  }

  if (window.enhancedfields) {
    window.enhancedfields.fileUpload.initFields();
  }
}

function insertFormGroup(container: HTMLElement, newFormGroup: FormGroup, newFormGroups: FormGroup[], currentFormGroups: FormGroup[]) {
  let currentNextFormGroup: FormGroup|null = null;
  let newNextFormGroup: FormGroup|undefined = undefined;
  let newNextIndex = FormGroup.indexOf(newFormGroups, newFormGroup.name);
  if (newNextIndex >= 0) {
    do {
      newNextIndex++;
      newNextFormGroup = newFormGroups[newNextIndex];
      currentNextFormGroup = newNextFormGroup ? FormGroup.findIn(currentFormGroups, newNextFormGroup.name) : null;
    } while (newNextFormGroup && !currentNextFormGroup);
  }

  if (currentNextFormGroup) {
    container.insertBefore(newFormGroup.element, currentNextFormGroup.element);
    currentFormGroups.splice(FormGroup.indexOf(currentFormGroups, currentNextFormGroup.name), 0, newFormGroup);
  } else {
    container.appendChild(newFormGroup.element)
  }
}

class FormGroup {

  private label: HTMLLabelElement;

  static buildFromForm(form: HTMLFormElement) {
    const formGroups = [];
    for (const element of form.querySelectorAll<HTMLDivElement>('.form-group:not(.form-group .form-group)')) {
      const input = element.querySelector<HTMLInputElement>('input:not([type=hidden]), select, textarea');
      const name = input ? (input.name || input.id) : null;
      if (name) {
        formGroups.push(new FormGroup(name, element, input!))
      }
    }
    return formGroups;
  }

  static findIn(formGroups: FormGroup[], name: string): FormGroup|null {
    return formGroups.reduce<FormGroup|null>((has, fg) => has ?? (fg.name === name ? fg : null), null);
  }

  static indexOf(formGroups: FormGroup[], name: string): number {
    return formGroups.map(formGroup => formGroup.name).indexOf(name);
  }

  constructor(
    public readonly name: string,
    public readonly element: HTMLElement,
    private input: HTMLInputElement,
  ) {
    this.label = element.querySelector('.form-control-label') as HTMLLabelElement;
  }

  get required() {
    return this.input.required
  }
  set required(value: boolean) {
    if (value !== this.required) {
      this.label.classList.toggle('required', value);
      this.input.required = value;
      if (value) {
        this.label.insertAdjacentHTML('afterbegin', '<span class="text-danger">*</span>');
      } else {
        this.label.querySelector('.text-danger')?.remove();
      }
    }
  }

  get type() {
    return this.input.type;
  }

  syncAttributes(newFormGroup: FormGroup) {
    this.required = newFormGroup.required;

    // Remove data attributes that no longer exist
    for (const attr of this.getInputDataAttrs()) {
      if (!newFormGroup.hasInputAttribute(attr.name)) {
        this.removeInputAttribute(attr.name);
      }
    }
    // Add or update data attributes
    for (const attr of newFormGroup.getInputDataAttrs()) {
      if (this.getInputAttribute(attr.name) !== attr.value) {
        this.setInputAttribute(attr.name, attr.value);
      }
    }
  }

  getInputDataAttrs(): Attr[] {
    return [...this.input.attributes].filter(attribute => attribute.name.startsWith('data-'));
  }
  hasInputAttribute(attributeName: string): boolean {
    return this.input.hasAttribute(attributeName);
  }
  removeInputAttribute(attributeName: string): void {
    this.input.removeAttribute(attributeName);
  }
  getInputAttribute(attributeName: string): string|null {
    return this.input.getAttribute(attributeName);
  }
  setInputAttribute(attributeName: string, value: string): void {
    this.input.setAttribute(attributeName, value);
  }
}
