class Form {
  // Registry: one Form instance per HTMLFormElement
  private static instances = new WeakMap<HTMLFormElement, Form>();

  private blocked = false;
  private pendingSubmit = false;
  private pendingSubmitter: HTMLElement | null = null;
  private submitButton: false|HTMLButtonElement|HTMLInputElement|null = false;

  private constructor(public readonly element: HTMLFormElement) {
    // capture: true so we run before listeners the page added earlier or later
    element.addEventListener("submit", this.onSubmit, { capture: true });
  }

  /** Get (or create) the singleton Form for a given form element. */
  static for(element: HTMLFormElement): Form {
    let instance = Form.instances.get(element);
    if (!instance) {
      instance = new Form(element);
      Form.instances.set(element, instance);
    }
    return instance;
  }

  /** true: block all submits. false: allow them again and replay any blocked one. */
  preventSubmit(block: boolean): void {
    this.blocked = block;
    if (block) {
      this.disableSubmitButton();
      return;
    }
    this.enableSubmitButton();
    if (!this.pendingSubmit) return;

    const submitter = this.pendingSubmitter;
    this.pendingSubmit = false;
    this.pendingSubmitter = null;

    // requestSubmit() re-runs validation and fires a normal submit event
    // (which now passes through our listener since blocked is false).
    try {
      this.element.requestSubmit(submitter);
    } catch {
      // submitter was removed/disabled/changed in the meantime
      this.element.requestSubmit();
    }
  }

  getSubmitButton(): HTMLButtonElement|HTMLInputElement|null {
    if (this.submitButton === false) {
      const submitButtons = this.element.querySelectorAll<HTMLButtonElement | HTMLInputElement>(
        'button[type="submit"], button:not([type="button"]):not([type="reset"]), input[type="submit"], input[type="image"]'
      )
      // If buttons exist, take the last one (furthest down the DOM tree)
      this.submitButton = submitButtons.length > 0 ? submitButtons[submitButtons.length - 1] : null;
    }
    return this.submitButton;
  }

  disableSubmitButton() {
    this.setSubmitButtonDisabled(true)
  }
  enableSubmitButton() {
    this.setSubmitButtonDisabled(false)
  }

  private onSubmit = (event: SubmitEvent): void => {
    if (!this.blocked) return;

    event.preventDefault();             // stop the navigation / native submit
    event.stopImmediatePropagation();   // stop other submit handlers from reacting

    // remember that a submit was attempted, and which button triggered it
    this.pendingSubmit = true;
    this.pendingSubmitter = event.submitter;
  };

  private setSubmitButtonDisabled(disable: boolean) {
    if (this.getSubmitButton()) {
      this.getSubmitButton()!.disabled = disable;
    }
  }
}

type FormControl =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
  | HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLOutputElement
  | HTMLObjectElement;

/** Resolve the custom Form for any form-associated element. */
export function getForm(control: FormControl): Form | null {
  const formEl = control.form;
  return formEl ? Form.for(formEl) : null;
}
