class Runtime {
  /** @type {string} */
  #context;
  /** @type {string} */
  #contextPs;
  /** @type {string} */
  #contextPsThemes;
  /** @type {string} */
  #environment;
  /** @type {string} */
  #adminDir;

  /**
   * @param {string|null} context
   * @param {string|null} contextPs
   * @param {string|null} contextPsThemes
   * @param {string|null} environment
   * @param {boolean} verbose
   * @param {string} adminDir
   */
  constructor(
    context = null,
    contextPs = null,
    contextPsThemes = null,
    environment = null,
    verbose = false,
    adminDir = 'admin-dev'
  ) {
    this.#context = context;
    this.#contextPs = contextPs;
    this.#contextPsThemes = contextPsThemes;
    this.#environment = environment ?? (process.env.NODE_ENV ? process.env.NODE_ENV : 'dev');
    this.verbose = verbose;
    this.#adminDir = adminDir;
  }

  getContext() {
    return this.#context;
  }

  getContextPs() {
    return this.#contextPs;
  }

  getContextPsThemes() {
    return this.#contextPsThemes;
  }

  isProduction() {
    return this.#environment === 'prod';
  }

  getAdminDir() {
    return this.#adminDir;
  }
}
module.exports = Runtime;