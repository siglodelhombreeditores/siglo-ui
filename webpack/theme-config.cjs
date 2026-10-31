const path = require('path');
const fs = require('fs');
const YAML = require('yaml');
const context = require('./config/context.cjs');
const runtimeParse = require('./config/runtime-parse.cjs');
const WebpackConfig = require('./webpack-config.cjs');
const SheUpgradeConfig = require('./util/she-upgrade/she-upgrade-config.cjs');

class ThemeConfig {
  /** @type {import('./config/runtime.cjs')} */
  runtime;
  /** @type {WebpackConfig} */
  webpackConfig;
  /** @type {string|null} */
  #themeName;
  /** @type {SheUpgradeConfig} */
  #sheUpgrade;

  /**
   * @param {import('./config/runtime.cjs')} runtime
   */
  constructor(runtime) {
    this.runtime = runtime;
    this.webpackConfig = new WebpackConfig({
      context: this.runtime.getContext(),
      mode: this.runtime.isProduction() ? 'production' : 'development',
    });
    this.webpackConfig.checkTypescriptTypes();
    this.#themeName = null;
    this.#sheUpgrade = new SheUpgradeConfig(runtime);
  }

  /**
   * @param {string} src
   * @param {string} name
   * @returns {ThemeConfig}
   */
  addThemeEntry(src = './entry/theme.ts', name = 'theme') {
    this.webpackConfig.addEntry(name, src);
    return this;
  }

  /**
   * @param {string} name
   * @param {string|object} src
   * @returns {ThemeConfig}
   */
  addEntry(name, src) {
    this.webpackConfig.addEntry(name, src);
    return this;
  }

  /**
   * @param aliases
   * @returns {ThemeConfig}
   */
  addAliases(aliases = {}) {
    this.webpackConfig.addAliases(aliases);
    return this;
  }

  /**
   * @returns {ThemeConfig}
   */
  addExternalJQuery() {
    this.webpackConfig.addExternalJQuery();
    return this;
  }

  /**
   * @returns {ThemeConfig}
   */
  splitEntryChunks() {
    this.webpackConfig.splitEntryChunks();
    return this;
  }

  /**
   * @param {object} options
   * @returns {ThemeConfig}
   */
  addEsbuildLoaderOptions(options) {
    this.webpackConfig.addLoaderOptions('esbuild-loader', options);
    return this;
  }

  /**
   * @param {object} options
   * @returns {ThemeConfig}
   */
  addSassLoaderOptions(options) {
    this.webpackConfig.addLoaderOptions('sass-loader', options);
    return this;
  }

  /**
   * @returns {ThemeConfig}
   */
  addResolveUrlLoader() {
    this.webpackConfig.addLoaderOptions('resolve-url-loader', {sourceMap: !this.webpackConfig.isProduction});
    return this;
  }

  /**
   * @returns {ThemeConfig}
   */
  enableMediaAssets() {
    this.webpackConfig.addRule({
      test: /.(jpg|png|webp|woff(2)?|eot|otf|ttf|svg|gif)(\?[a-z0-9=.]+)?$/,
      type: 'asset/resource',
      generator: {
        filename: `../css/${(this.webpackConfig.isProduction ? '[hash]' : '[name]')}[ext]`,
      }
    });
    return this;
  }

  /**
   * @param {object} options
   * @returns {ThemeConfig}
   */
  copyImg(options = {}) {
    return this.copyFiles('img', null, null, options);
  }

  /**
   * @param {string} from
   * @param {string|null} to
   * @param {boolean|null} hash
   * @param {object} options
   * @returns {ThemeConfig}
   */
  copyFiles(from, to = null, hash = null, options = {}) {
    const extTemplate = this.#sheUpgrade.getCopyPluginExtTemplate();
    const copyFrom = this.#sheUpgrade.getCopyPluginFrom(from);
    const copyTo = path.join('..', to || from, '[path]' + this.webpackConfig.getDestinationFilename(extTemplate, hash));
    this.webpackConfig.addCopyPattern(copyFrom, copyTo, options)
    return this;
  }

  /**
   * @param {boolean|null} enabled
   * @returns {ThemeConfig}
   */
  enableSourceMaps(enabled = null) {
    this.webpackConfig.enableSourceMaps(enabled);
    return this;
  }

  /**
   * @returns {ThemeConfig}
   */
  enableBuildNotifications(options = {}) {
    this.webpackConfig.enableBuildNotifications(options);
    return this;
  }

  build() {
    this.webpackConfig.addPluginOptions('mini-css-extract-plugin', {
      filename : '../css/' + this.webpackConfig.getDestinationFilename('.css'),
      chunkFilename : '../css/' + this.webpackConfig.getDestinationFilename('.css'),
    })
    this.webpackConfig.addResolve({extensions: [ '.js' ]})
    this.#buildSheUpgrade();
    return this.webpackConfig
      .setOutputPath(path.resolve(this.runtime.getContext(), '../assets/js'))
      .setPublicPath(`/themes/${this.#getThemeName()}/assets/js/`)
      .enableManifest()
      .addExternals({prestashop: 'prestashop'})
      .build();
  }

  sheUpgrade() {
    return this.#sheUpgrade;
  }

  #buildSheUpgrade() {
    this.webpackConfig.cleanOutput(false);
    for (const [entryName, entryChunks] of this.#sheUpgrade.getAdminEntries()) {
      this.webpackConfig.addEntry(entryName, entryChunks);
    }
    this.webpackConfig.addExternals(this.#sheUpgrade.getExternals());
    for (const customRule of this.#sheUpgrade.getCustomRules()) {
      this.webpackConfig.addRule(customRule);
    }
    for (const plugin of this.#sheUpgrade.getPlugins()) {
      this.webpackConfig.addPlugin(plugin);
    }
    this.webpackConfig.addPluginOptions('mini-css-extract-plugin', this.#sheUpgrade.getMiniCssExtractPluginOptions())
    this.#sheUpgrade.buildAssetsPlugin(this.webpackConfig);
    this.webpackConfig.addAliases(this.#sheUpgrade.getAliases());
    this.webpackConfig.addResolve(this.#sheUpgrade.getResolve());
  }

  /**
   * @return {object}
   */
  #getThemeName() {
    if (this.#themeName === null) {
      const file = fs.readFileSync(path.resolve(this.runtime.getContext(), '../config/theme.yml'), 'utf8')
      this.#themeName = YAML.parse(file).name ?? 'siglo';
    }
    return this.#themeName
  }
}

// Manually configure the runtime environment if not already configured yet by the "encore" command.
// It's useful when you use tools that rely on webpack.config.js file.
if (context.runtime === null) {
  context.runtime = runtimeParse(
    Object.assign({}, require('yargs-parser')([process.env.NODE_ENV || 'dev'])),
    process.cwd()
  );
}

module.exports = new ThemeConfig(context.runtime);