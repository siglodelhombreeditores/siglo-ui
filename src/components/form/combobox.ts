import { elementCreate } from "../../services/element/element-create";
import { eventTargetMatches } from "../../services/event/event";
import { getSelectOptions } from "../../services/form";
import { ProxyElemento } from "../elemento/proxy-elemento";
import { EventDispatcher } from "../../services/event/event-dispatcher";

type ComboboxConfig = {
  callbackOptions?: CallbackOptions;
  defaultValue?: string;
  placeholder?: string;
  options?: Option[];
  searchable?: boolean;
  trackPosition?: boolean;
  selectedOptionReselect?: boolean;
};
type Option = { value: string; label: string };
type CallbackOptions = () => Promise<Option[]>;

export class Combobox extends ProxyElemento<HTMLDivElement> {
  private containerResolved: boolean = false;
  private configOriginal: ComboboxConfig;
  private config: ComboboxConfig;
  private selectButton!: HTMLButtonElement;
  private optionsContainer!: HTMLDivElement;
  private searchInput: HTMLInputElement | null = null;
  private options: Option[] = [];
  private callbackOptions: CallbackOptions | null = null;
  private selectedOption: Option | null = null;
  private isOpen: boolean = false;
  private placeholder: string = 'Seleccione una opción';
  private searchable: boolean = false;
  private disabled: boolean = false;
  private position: 'top' | 'bottom' | null = null; // Track the dropdown position
  private readonly dispatcher: EventDispatcher;

  constructor(
    selector: HTMLDivElement|HTMLSelectElement|string,
    config: ComboboxConfig = {}
  ) {
    super(selector as HTMLDivElement|string);
    this.configOriginal = config;
    this.config = {...this.configOriginal};
    this.resolve();
    // Add event listeners
    this.addEventListeners();
    this.dispatcher = new EventDispatcher(this);
  }

  onShow(listener: () => void): this {
    this.dispatcher.add('show', listener);
    return this;
  }

  onChange(listener: (value: string) => void): this {
    this.dispatcher.add('change', listener);
    return this;
  }

  doFetch(callback: () => Promise<Option[]>) {
    const loadingOption = elementCreate('div.combobox-option-message:contains("Cargando...")');
    this.renderOptions([...this.options, loadingOption], false);

    callback()
      .then(options => {
        this.updateOptions(options, true)
      })
      .catch(() => this.updateOptions(this.options))
  }

  getValue(): string | null {
    return this.selectedOption ? this.selectedOption.value : null;
  }

  setValue(value: string, dispatchEvent: boolean = true): void {
    this.selectOption(value, dispatchEvent);
  }

  reset() {
    this.selectedOption = null;
    this.updateButtonText();
  }

  updateOptions(options: Option[], clearOptionsContainer?: boolean): this {
    this.options = options;
    // Ensure selected option still exists
    if (this.selectedOption) {
      const stillExists = this.options.some(opt => opt.value === this.selectedOption?.value);
      if (!stillExists) {
        this.selectedOption = null;
      }
    }
    this.updateButtonText();
    this.renderOptions(this.options, this.searchable, clearOptionsContainer);
    return this;
  }

  setDisabled(disabled: boolean) {
    this.disabled = disabled;
    this.selectButton.classList.toggle('disabled', disabled);
    this.classList.toggle('disabled', disabled);
  }

  reconnect() {
    if (this._selector) {
      this.containerResolved = false;
      this.config = {...this.configOriginal};
    }
    return super.reconnect();
  }

  protected resolve(): HTMLDivElement | null {
    if (!this.containerResolved) {
      let container: HTMLDivElement|HTMLSelectElement|null = null;
      if (this._selector) {
        container = document.querySelector<HTMLDivElement|HTMLSelectElement>(this._selector);
      } else {
        container = this._element;
      }
      if (container instanceof HTMLSelectElement) {
        container = this.constructFromSelect(container);
      } else if (!container) {
        throw new Error(`Container element with selector "${container}" not found`);
      }
      container.classList.add('combobox-container');
      this._element = container;
      this.resolveConfig(container);
      this.renderElements(container);
      this.containerResolved = true;
    }
    return this._element;
  }

  private addEventListeners(): void {
    document.addEventListener('click', (e: MouseEvent) => {
      if (!this.disabled) {
        const target = e.target as Node;
        if (this.contains(target)) {
          if (this.selectButton.contains(target)) {
            this.toggleDropdown()
          } else {
            const option = eventTargetMatches<HTMLDivElement>(e, '.combobox-option');
            if (option) {
              this.selectOption(option.dataset.value!)
            }
          }
        } else {
          this.closeDropdown();
        }
      }
    });
    // Handle keyboard navigation
    this.addEventListener('keydown', this.handleKeyDown.bind(this));
    // Update position on scroll or resize
    if (this.position) {
      window.addEventListener('scroll', () => this.updateDropdownPosition(), true);
      window.addEventListener('resize', () => this.updateDropdownPosition());
    }
  }

  private constructFromSelect(select: HTMLSelectElement): HTMLDivElement {
    const container = elementCreate('div');
    this.config.options = this.config.options || getSelectOptions(select);
    this.config.placeholder = this.config.placeholder || select.dataset.placeholder || '';
    const selectedOption = select.querySelector<HTMLOptionElement>('option[selected]');
    if (selectedOption && !this.config.defaultValue) {
      this.config.defaultValue = selectedOption.value;
    }
    select.insertAdjacentElement('afterend', container);
    select.classList.add('d-none');
    return container;
  }

  private focusNextOption(): void {
    const options = Array.from(this.optionsContainer.querySelectorAll('.combobox-option'));
    const currentFocusIndex = options.findIndex(opt => opt.getAttribute('data-focused') === 'true');

    // Remove current focus
    options.forEach(opt => opt.setAttribute('data-focused', 'false'));

    // Set focus on next option or first if none or last is focused
    const nextIndex = currentFocusIndex < 0 || currentFocusIndex >= options.length - 1
      ? 0
      : currentFocusIndex + 1;

    if (options[nextIndex]) {
      options[nextIndex].setAttribute('data-focused', 'true');
      options[nextIndex].scrollIntoView({block: 'nearest'});
    }
  }

  private focusPreviousOption(): void {
    const options = Array.from(this.optionsContainer.querySelectorAll('.combobox-option'));
    const currentFocusIndex = options.findIndex(opt => opt.getAttribute('data-focused') === 'true');

    // Remove current focus
    options.forEach(opt => opt.setAttribute('data-focused', 'false'));

    // Set focus on previous option or last if none or first is focused
    const prevIndex = currentFocusIndex <= 0
      ? options.length - 1
      : currentFocusIndex - 1;

    if (options[prevIndex]) {
      options[prevIndex].setAttribute('data-focused', 'true');
      options[prevIndex].scrollIntoView({block: 'nearest'});
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Escape':
        this.closeDropdown();
        break;
      case 'ArrowDown':
        if (!this.isOpen) {
          this.openDropdown();
        } else {
          this.focusNextOption();
        }
        e.preventDefault();
        break;
      case 'ArrowUp':
        if (!this.isOpen) {
          this.openDropdown();
        } else {
          this.focusPreviousOption();
        }
        e.preventDefault();
        break;
      case 'Enter':
        if (this.isOpen) {
          const focusedOption = this.optionsContainer.querySelector('.combobox-option[data-focused="true"]');
          if (focusedOption) {
            const value = focusedOption.getAttribute('data-value') || '';
            this.selectOption(value);
          }
        } else {
          this.openDropdown();
        }
        e.preventDefault();
        break;
    }
  }

  private handleSearchInput() {
    const query = this.searchInput!.value.toLowerCase() || '';
    const filteredOptions = this.options.filter(option => option.label.toLowerCase().includes(query));
    this.renderOptions(filteredOptions);
  }

  private resolveConfig(container: HTMLDivElement): void {
    this.options = this.config.options || [];
    this.placeholder = this.config.placeholder || 'Seleccione una opción';
    this.searchable = this.config.searchable || false;
    this.disabled = container.classList.contains('disabled');
    this.position = this.config.trackPosition ? 'bottom' : null;
    this.callbackOptions = this.config.callbackOptions || null;
    this.selectedOption = this.config.defaultValue ? (this.options.find(opt => opt.value === this.config.defaultValue) ?? null) : null;
  }

  private toggleDropdown(): void {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  private updateDropdownPosition(): void {
    if (this.isOpen) {
      // Reset position classes first
      if (this.position) {
        this.classList.remove('position-top', 'position-bottom');
        this.optionsContainer.classList.remove('position-top', 'position-bottom');
      }

      // Get necessary measurements
      const buttonRect = this.selectButton.getBoundingClientRect();
      // const optionsHeight = this.optionsContainer.scrollHeight;
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      // Calculate max height for options (leave small margin)
      const margin = 20; // pixels to leave as margin on each side
      const maxHeightBelow = spaceBelow - margin;
      const maxHeightAbove = spaceAbove - margin;

      // Determine if there's enough space below
      // if (spaceBelow < optionsHeight && spaceAbove > spaceBelow) {
      // Determine if options should show above or below based on available space
      if (this.position && spaceBelow < 200 && spaceAbove > spaceBelow) { // 200px is minimum preferred height
        // Not enough space below, but more space above
        this.position = 'top';
        this.classList.add('position-top');
        this.optionsContainer.classList.add('position-top');

        this.optionsContainer.style.maxHeight = `${maxHeightAbove}px`;
        // Update list container if searchable
        const optionsList = this.optionsContainer.querySelector('.combobox-options-list');
        if (optionsList) {
          (optionsList as HTMLElement).style.maxHeight = `${maxHeightAbove - 40}px`; // Account for search input
        }
      } else {
        // Default to bottom
        if (this.position) {
          this.position = 'bottom';
          this.classList.add('position-bottom');
          this.optionsContainer.classList.add('position-bottom');
        }
        this.optionsContainer.style.maxHeight = `${maxHeightBelow}px`;
        // Update list container if searchable
        const optionsList = this.optionsContainer.querySelector('.combobox-options-list');
        if (optionsList) {
          (optionsList as HTMLElement).style.maxHeight = `${maxHeightBelow - 40}px`; // Account for search input
        }
      }
    }
  }

  private openDropdown(): void {
    this.dispatcher.dispatch('show');
    this.isOpen = true;
    this.selectButton.setAttribute('aria-expanded', 'true');
    this.classList.add('open');

    // Check position before opening
    // if (this.position) {
    this.updateDropdownPosition();
    // }

    this.optionsContainer.classList.add('open');

    // Focus on search input if searchable
    if (this.searchable && this.searchInput) {
      setTimeout(() => this.searchInput!.focus(), 0);
    }

    // Focus on selected option if exists
    if (this.selectedOption) {
      // this.updateOptionElements(true);
      const selectedEl = this.optionsContainer.querySelector(`.combobox-option[data-value="${this.selectedOption.value}"]`);
      if (selectedEl) {
        selectedEl.setAttribute('data-focused', 'true');
        selectedEl.scrollIntoView({block: 'nearest'});
      }
    }
  }

  private closeDropdown(): void {
    this.isOpen = false;
    this.selectButton.setAttribute('aria-expanded', 'false');
    this.classList.remove('open');
    this.optionsContainer.classList.remove('open');

    // Reset search if searchable
    if (this.searchable && this.searchInput) {
      this.searchInput.value = '';
      this.renderOptions(this.options);
    }
  }

  private renderElements(container: HTMLDivElement) {
    this.selectButton = elementCreate(
      `button.combobox-button.${this.disabled ? 'disabled' : ''}[type="button"][aria-haspopup="listbox"][aria-expanded="false"]`
    );
    this.optionsContainer = elementCreate('div.combobox-options[role="listbox"]');
    this.updateButtonText();
    container.appendChild(this.selectButton);
    container.appendChild(this.optionsContainer);
    // Add search input if searchable
    if (this.searchable) {
      this.searchInput = elementCreate('input.combobox-search[placeholder="Buscar..."][type="text"]')
      this.optionsContainer.appendChild(this.searchInput);
      this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
    }
    // Render options
    this.renderOptions(this.options);
  }

  private renderOptions(options: Array<Option|HTMLElement>, searchable?: boolean, clearOptionsContainer?: boolean): void {
    searchable = searchable ?? this.searchable;
    // Clear options (except search input)
    const optionsContainer = searchable ? elementCreate('div.combobox-options-list') : this.optionsContainer;

    if (searchable) {
      // Remove old options list if exists
      const oldList = this.optionsContainer.querySelector('.combobox-options-list');
      if (oldList) {
        this.optionsContainer.removeChild(oldList);
      }
    }
    if (!searchable || clearOptionsContainer) {
      this.optionsContainer.innerHTML = '';
      if (this.searchInput) {
        this.optionsContainer.appendChild(this.searchInput);
        this.searchInput.focus();
      }
    }

    // Create option elements
    options.forEach(option => {
      if (option instanceof HTMLElement) {
        optionsContainer.appendChild(option);
      } else {
        const optionEl = elementCreate(`div.combobox-option[role="option"]`)
        optionEl.setAttribute('data-value', option.value);
        const textSpan = document.createElement('span');
        textSpan.textContent = option.label;
        optionEl.appendChild(textSpan);
        optionsContainer.appendChild(optionEl);
      }
    });
    this.updateOptionElements(optionsContainer);

    if (searchable) {
      this.optionsContainer.appendChild(optionsContainer);
    }

    // Show empty state if no options
    if (options.length === 0) {
      optionsContainer.appendChild(elementCreate('div.combobox-option-message:contains("Sin resultados")'));
    }
  }

  private updateButtonText(): void {
    const text = this.selectedOption ? this.selectedOption.label : this.placeholder;

    const valueSpan = elementCreate('span.combobox-value');
    valueSpan.textContent = text;
    const iconSpan = this.buildSvgIcon('combobox-icon', '6 9 12 15 18 9');

    // Clear button content
    this.selectButton.innerHTML = '';
    this.selectButton.appendChild(valueSpan);
    this.selectButton.appendChild(iconSpan);

    // Add selected class if an option is selected
    if (this.selectedOption) {
      this.selectButton.classList.add('has-selection');
    } else {
      this.selectButton.classList.remove('has-selection');
    }
  }

  private selectOption(value: string, dispatchEvent: boolean = true): void {
    const option = this.options.find(opt => opt.value === value);
    if (option) {
      if (this.selectedOption !== option) {
        this.selectedOption = option;
        this.updateOptionElements();
        this.updateButtonText();
      } else {
        dispatchEvent = !dispatchEvent ? false : !!this.config.selectedOptionReselect;
      }
      if (dispatchEvent) {
        this.dispatcher.dispatch('change', value);
      }
      this.closeDropdown();
    }
  }

  private updateOptionElements(optionsContainer?: HTMLDivElement) {
    (optionsContainer ?? this.optionsContainer).querySelectorAll<HTMLDivElement>('.combobox-option').forEach(optionEl => {
      const checkIcon = optionEl.querySelector<HTMLSpanElement>('.check-icon');
      if (this.selectedOption && this.selectedOption.value === optionEl.dataset.value) {
        optionEl.classList.add('selected');
        optionEl.setAttribute('aria-selected', 'true');
        if (!checkIcon) {
          optionEl.appendChild(this.buildSvgIcon('check-icon', '20 6 9 17 4 12'));
        }
      } else {
        optionEl.classList.remove('selected');
        optionEl.setAttribute('aria-selected', 'false');
        optionEl.dataset.focused = 'false';
        checkIcon?.remove();
      }
    });
  }

  private buildSvgIcon(cls: string, points: string): HTMLSpanElement {
    const span = elementCreate(`span.${cls}`);
    span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      `<polyline points="${points}"></polyline>` +
      '</svg>';
    return span;
  }

}