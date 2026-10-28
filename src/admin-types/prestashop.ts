export interface PrestaShop {
  component: {
    initComponents(components: PrestaShopComponent[]): void;
    EventEmitter: EventEmitter;
    Grid: typeof Grid;
    GridExtensions: Record<GridExtensionName, GridExtensionConstructor>;
    TaggableField: typeof TaggableField;
  };
}

type PrestaShopComponent =
  | 'ChoiceTree'
  | 'TaggableField'
  | 'TinyMCEEditor'
  | 'TranslatableField'
  | 'TranslatableInput';

type PrestaShopEvent =
  | 'PSComponentsInitiated'
  | 'updateSubmitButtonState';

declare class EventEmitter {
  on(eventName: PrestaShopEvent, listener: (args?: any) => void): void;
  emit(eventName: PrestaShopEvent): void;
}

declare class Grid {
  constructor(id: string);
  addExtension(extension: GridExtension): void;
}
interface GridExtension {
  extend: (grid: Grid) => void;
}
type GridExtensionConstructor = new () => GridExtension;
type GridExtensionName =
  | 'ColumnTogglingExtension'
  | 'FiltersResetExtension'
  | 'FiltersSubmitButtonEnablerExtension'
  | 'SortingExtension'
  | 'SubmitRowActionExtension';


declare class TaggableField {
  constructor({ tokenFieldSelector, options }: {tokenFieldSelector: string, options: TaggableFieldOptions});
}
interface TaggableFieldOptions {
  /**
   * Tokens (or tags). Can be:
   * - a string with comma-separated values ("one,two,three")
   * - an array of strings (["one","two","three"])
   * - an array of objects ([{ value: "one", label: "Einz" }, { value: "two", label: "Zwei" }])
   * @default []
   */
  tokens?: string | string[],
  /**
   * Maximum number of tokens allowed. 0 = unlimited
   * @default 0
   */
  limit?: number,
  /**
   * Minimum length required for token value.
   * @default 0
   */
  minLength?: number,
  /**
   * Minimum input field width. In pixels.
   * @default 60
   */
  minWidth?: number,
  /**
   * jQuery UI Autocomplete options
   * @default {}
   */
  autocomplete?: any,
  /**
   * Whether to show autocomplete suggestions menu on focus or not. Works only for jQuery UI Autocomplete,
   * as Typeahead has no support for this kind of behavior.
   * @default false
   */
  showAutocompleteOnFocus?: boolean,
  /**
   * Arguments for Twitter Typeahead. The first argument should be an options hash (or null if you want to use the
   * defaults). The second argument should be a dataset. You can add multiple datasets:
   * typeahead: [options, dataset1, dataset2]
   * @default {}
   */
  typeahead?: any,
  /**
   * Whether to turn input into tokens when tokenfield loses focus or not.
   * @default false
   */
  createTokensOnBlur?: boolean,
  /**
   * A character or an array of characters that will trigger token creation on keypress event. Defaults to ',' (comma).
   * Note - this does not affect Enter or Tab keys, as they are handled in the keydown event. The first delimiter will
   * be used as a separator when getting the list of tokens or copy-pasting tokens.
   * @default ','
   */
  delimiter?: string | string[],
  /**
   * Whether to insert spaces after each token when getting a comma-separated list of tokens. This affects both value
   * returned by getTokensList() and the value of the original input field.
   * @default true
   */
  beautify?: boolean,
  /**
   * HTML type attribute for the token input. This is useful for specifying an HTML5 input type like 'email', 'url' or
   * 'tel' which allows mobile browsers to show a specialized virtual keyboard optimized for different types of input.
   * This only sets the type of the visible token input but does not touch the original input field. So you may set
   * the original input to have type="text" but set this inputType option to 'email' if you only want to take advantage
   * of the email style keyboard on mobile, but don't want to enable HTML5 native email validation on the original
   * hidden input.
   * @default 'text'
   */
  inputType?: string,
  /**
   * Limit the number of characters allowed by token.
   * @default 0
   */
  maxCharacters?: number;
}