const path = require("path");
const OverridesResolverPlugin = require('../../plugin/overrides-resolver-plugin.cjs');
const entryPointsPlugin = require('../../plugin/entrypoints.cjs');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

class SheUpgradeConfig {
  /** @type {import('../../config/runtime.cjs')} */
  #runtime;
  /** @type {string} */
  #adminThemeName;
  /** @type {string} */
  #adminEntryNamePrefix;
  /** @type {string} */
  #adminEntryPathPrefix;
  /** @type {Map<string, object>} */
  #adminEntries;
  /** @type {{[k: string]: string[]}} */
  #adminEntryOverrides;
  /** @type {string} */
  #adminEntryOverridePrefix;
  /** @type {{[k: string]: string}} */
  #externals;
  /** @type {Array<object>} */
  #customRules;
  /** @type {number|null} */
  #copyPluginVersion;
  /** @type {string} */
  #shencorePackageName;
  /** @type {string} */
  #shencorePath;
  /** @type {string} */
  #shencorePathAlias;
  /** @type {string} */
  #shencoreSubDir;
  /** @type {boolean} */
  #cleanupOutput;
  /** @type {object} */
  #aliases;

  /**
   * @param {import('../../config/runtime.cjs')} runtime
   */
  constructor(runtime) {
    this.#runtime = runtime;
    this.#adminThemeName = 'siglo';
    this.#adminEntryNamePrefix = 'siglo-admin';
    this.#adminEntryPathPrefix = '../../../../';
    this.#adminEntries = new Map();
    this.#adminEntryOverrides = {};
    this.#adminEntryOverridePrefix = 'entry/admin'
    this.#externals = {};
    this.#customRules = [];
    this.#copyPluginVersion = null;
    this.#shencorePackageName = 'shencore';
    this.#shencorePath = '';
    this.#shencorePathAlias = '@she';
    this.#shencoreSubDir = '';
    this.#cleanupOutput = false;
    this.#aliases = {};
  }

  get adminPathPublic() {
    return this.#runtime.getAdminDir() + `/themes/${this.#adminThemeName}/public`;
  }

  /**
   * @param {string} name
   * @param {string} importPath
   * @returns {SheUpgradeConfig}
   */
  addAdminEntry(name, importPath) {
    this.#adminEntries.set(this.#adminEntryNamePrefix + '-' + name, {
      import: importPath,
      filename : this.#adminEntryPathPrefix + this.#runtime.getAdminDir() 
        + `/themes/${this.#adminThemeName}/public/${name}`
        + (!this.#runtime.isProduction() ? '.js' : '.[contenthash].js')
    });
    return this;
  }

  /**
   * @returns {Map<string, object>}
   */
  getAdminEntries() {
    return this.#adminEntries;
  }

  /**
   * @param {string} name
   * @return {SheUpgradeConfig}
   */
  setAdminThemeName(name) {
    this.#adminThemeName = name;
    return this;
  }

  /**
   * @param {string} name
   * @return {SheUpgradeConfig}
   */
  setAdminEntryNamePrefix(name) {
    this.#adminEntryNamePrefix = name;
    return this;
  }

  /**
   * @param {string} prefix
   * @return {SheUpgradeConfig}
   */
  setAdminEntryOverridePrefix(prefix) {
    this.#adminEntryOverridePrefix = prefix;
    return this;
  }

  /**
   * @returns {SheUpgradeConfig}
   */
  addExternalJQuery() {
    Object.assign(this.#externals, {$: '$', jquery: 'jQuery'});
    return this;
  }

  getExternals() {
    return this.#externals;
  }

  /**
   * siglo-core evitar error en import BootstrapModal from 'bootstrap/js/dist/modal';
   * @returns {SheUpgradeConfig}
   */
  enableFlexibleJsResolution() {
    this.#customRules.push({
      test: /\.m?js/,
      resolve: {
        fullySpecified: false
      }
    });
    return this;
  }

  /**
   * @return {Array<Object>}
   */
  getCustomRules() {
    return this.#customRules;
  }

  /**
   * @param {string} from
   * @returns {string}
   */
  getCopyPluginFrom(from) {
    return from.split('/').map(value => value === this.#shencorePathAlias
      ? path.resolve(this.#getShencorePath(), this.#shencoreSubDir)
      : value
    ).join('/')
  }

  getCopyPluginExtTemplate() {
    if (!this.#copyPluginVersion) {
      const { version } = require('copy-webpack-plugin/package.json');
      this.#copyPluginVersion = parseInt(version.split('.')[0], 10);
    }
    return this.#copyPluginVersion <= 11 ? '.[ext]' : '[ext]';
  }

  /**
   * @param {string} name
   * @return {SheUpgradeConfig}
   */
  setShencorePackageName(name) {
    this.#shencorePackageName = name;
    return this;
  }

  /**
   * @param {string} alias
   * @return {SheUpgradeConfig}
   */
  setShencorePathAlias(alias) {
    this.#shencorePathAlias = alias;
    return this;
  }

  /**
   * @param {string} subDir
   * @return {SheUpgradeConfig}
   */
  setShencoreSubDir(subDir) {
    this.#shencoreSubDir = subDir;
    return this;
  }

  /**
   * @returns {object}
   */
  getMiniCssExtractPluginOptions() {
    return {
      filename: ({ chunk }) => (
        new RegExp(`^${this.#adminEntryNamePrefix}-.*$`).test(chunk.name)
          ? path.join('..', '..', '..', '..', this.#runtime.getAdminDir(), 'themes', this.#adminThemeName, 'public',
            chunk.name.replace(`${this.#adminEntryNamePrefix}-`, ''))
          : path.join('..', 'css', '[name]')
      ) + (this.#runtime.isProduction() ? '.[contenthash].css' : '.css')
    }
  }

  /**
   * @return {SheUpgradeConfig}
   */
  cleanupOutputBeforeBuild() {
    this.#cleanupOutput = true;
    return this;
  }

  /**
   * @returns object[]
   */
  getPlugins() {
    const plugins = [];
    if (this.#cleanupOutput) {
      const cleanOnceBeforeBuildPatterns = [path.resolve(this.#runtime.getContext(), '..', 'assets') + '/**/*'];
      if (this.#adminEntries.size) {
        cleanOnceBeforeBuildPatterns.push(this.#runtime.getContextPs() + '/' + this.adminPathPublic + '/**/*')
      }
      plugins.push(new CleanWebpackPlugin({
        dry: false,
        dangerouslyAllowCleanPatternsOutsideProject: true,
        cleanOnceBeforeBuildPatterns,
      }));
    }
    if (this.#adminEntries.size) {
      plugins.push(new OverridesResolverPlugin({[`${this.#adminEntryOverridePrefix}/`] : [
        this.#runtime.getContextPsThemes() + '/' + this.#adminEntryOverridePrefix,
        path.resolve(this.#getShencorePath(), this.#adminEntryOverridePrefix)
      ]}));
    }
    return plugins;
  }

  buildAssetsPlugin(webpackConfig) {
    webpackConfig._buildAssetsPlugin = (plugins) => {
      plugins.push(entryPointsPlugin(
        webpackConfig.getOutputPath(),
        webpackConfig.isProduction,
        webpackConfig.getPublicPath(),
        entry => entry.match(new RegExp(`^${this.#adminEntryNamePrefix}-.*$`)) ? false : entry,
        (assetPath, fileType) => 'assets/' + fileType + '/' + assetPath,
      ))

      if (this.#adminEntries.size) {
        plugins.push(entryPointsPlugin(
          this.#runtime.getContextPs() + '/' + this.adminPathPublic,
          webpackConfig.isProduction,
          webpackConfig.getPublicPath(),
          entry => entry.match(new RegExp(`^${this.#adminEntryNamePrefix}-.*$`)) ? entry.replace(`${this.#adminEntryNamePrefix}-`, '') : false,
          (assetPath, fileType) => {
            // con splitEntryChunks hay archivos en theme de fo, agregamos publicPath para que en bo se lean correctamente
            if (!assetPath.includes(this.#adminEntryPathPrefix)){
              return webpackConfig.getPublicPath() + assetPath;
            }
            return '/' + assetPath.replace(this.#adminEntryPathPrefix, '');
          },
        ))
      }
    }
  }

  /**
   * @param {string} key
   * @param {string} subDir
   * @returns {SheUpgradeConfig}
   */
  addShencoreAlias (key, subDir) {
    this.#aliases[key] = path.resolve(this.#getShencorePath(), subDir);
    return this;
  }

  /**
   * @param {string} key
   * @param {string} subDir
   * @returns {SheUpgradeConfig}
   */
  addPsAdminAlias (key, subDir) {
    this.#aliases[key] = path.resolve(this.#runtime.getContextPs(), this.#runtime.getAdminDir(), subDir);
    return this;
  }

  /**
   * @returns {{[p: string]: string}}
   */
  getAliases() {
    return {
      [this.#shencorePathAlias]: path.resolve(this.#getShencorePath(), this.#shencoreSubDir),
      ...this.#aliases
    }
  }

  getResolve() {
    return {modules: [
      // Necesario para shencore pueda utilizar las librerias de la tienda en cuestion
      this.#runtime.getContext() + '/node_modules',
      'node_modules'
    ]};
  }

  /**
   * @returns {string}
   */
  #getShencorePath() {
    if (!this.#shencorePath) {
      this.#shencorePath = path.dirname(
        require.resolve(this.#shencorePackageName + '/package.json', {
          paths: [process.cwd()]
        })
      ) + '/src';
    }
    return this.#shencorePath;
  }
}

module.exports = SheUpgradeConfig;