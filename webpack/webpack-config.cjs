const path = require("path");
const StyleEntriesCleaner = require("./plugin/style-entries-cleaner.cjs");
const { manifestPlugin, manifestModifierPlugin } = require('./plugin/manifest.cjs');
const deepMerge = require("./util/deep-merge.cjs");

class WebpackConfig {
  /** @type {boolean} */
  _outputClean;
  /** @type {boolean} */
  _assetsUpdate;
  /** @type {object} **/
  #aliases;
  /** @type {boolean} */
  #shouldSplitEntryChunks;
  /** @type {Array<object>} */
  #customRules;
  /** @type {Array<object>} */
  #customPlugins;
  /** @type {Array<object>} */
  #copyPatterns;
  /** @type {{[k: string]: object}} */
  #pluginOptions;
  /** @type {boolean} */
  #useManifestPlugin;
  /** @type {boolean|string} */
  #devtool;
  /** @type {boolean} */
  #useNotifier;
  /** @type {object} */
  #notifierOptions;
  /** @type {object|null} */
  #resolveCustom;

  /**
   * @param {{context?: string, mode?: 'development'|'production', module?: string, sharedNodeModules?: string}} options
   */
  constructor(options = {}) {
    this.name = null;
    this.entries = new Map();
    this.styelEntries = new Map();
    this.outputPath = '';
    this.publicPath = '';
    this.context = options.context ?? '';
    this.mode = options.mode ?? 'development';
    this.sharedNodeModules = options.sharedNodeModules ?? null;
    this.roots = this.sharedNodeModules ? [path.resolve(__dirname, 'node_modules', process.cwd(), this.sharedNodeModules)] : [];
    this._outputClean = true;
    this._assetsUpdate = false;
    this.outputCustom = {};
    this.#aliases = {};
    this.externals = {};
    this.loaderOptionsDefault = {
      'esbuild-loader': {
        loader: 'ts',
        target: 'es2020',
      },
      'css-loader': {
        sourceMap: !this.isProduction
      },
      'postcss-loader': {
        sourceMap: !this.isProduction
      },
      'sass-loader': {
        sourceMap: true
      },
    }
    this.loaderOptionsCustom = {};
    this.miniCssExtractPlugin = this.#requireResolve("mini-css-extract-plugin");
    this.enableCheckTypescriptTypes = false;
    this.dependencies = [];
    this.#shouldSplitEntryChunks = false;
    this.#customRules = [];
    this.#customPlugins = [];
    this.#copyPatterns = [];
    this.#pluginOptions = {};
    this.#useManifestPlugin = false;
    this.#devtool = false;
    this.#useNotifier = false;
    this.#notifierOptions = {title: 'Webpack siglo'};
    this.#resolveCustom = null;
  }

  get isProduction() {
    return this.mode === 'production';
  }

  /**
   * @param {string} name
   * @param {string|object} src
   * @returns {this}
   */
  addEntry(name, src) {
    if (this.entries.has(name) || this.styelEntries.has(name)) {
      throw new Error(`Duplicate name "${name}" passed to addEntry(): entries must be unique.`);
    }
    this.entries.set(name, src);
    return this;
  }

  /**
   * @param {string} name
   * @param {string} src
   * @returns {this}
   */
  addStyleEntry(name, src) {
    if (this.styelEntries.has(name) || this.entries.has(name)) {
      throw new Error(`Duplicate name "${name}" passed to addStyleEntry(): entries must be unique.`);
    }
    this.styelEntries.set(name, src);
    return this;
  }

  /**
   * @param aliases
   * @returns {this}
   */
  addAliases(aliases) {
    Object.assign(this.#aliases, aliases);
    return this;
  }

  /**
   * @param {object} externals
   * @returns {this}
   */
  addExternals(externals = {}) {
    Object.assign(this.externals, externals);
    return this;
  }

  /**
   * @returns {this}
   */
  addExternalJQuery() {
    return this.addExternals({$: '$', jquery: 'jQuery'})
  }

  /**
   * @param {string} loaderName
   * @param {object} options
   * @returns {this}
   */
  addLoaderOptions(loaderName, options) {
    this.loaderOptionsCustom[loaderName] = options;
    return this;
  }

  /**
   * @param {object} rule
   * @returns {this}
   */
  addRule(rule) {
    this.#customRules.push(rule);
  }

  /**
   * @param {object} plugin
   * @returns {this}
   */
  addPlugin(plugin) {
    this.#customPlugins.push(plugin);
  }

  /**
   * @returns {string}
   */
  getOutputPath() {
    return this.outputPath;
  }

  /**
   * @param {string} path
   * @returns {this}
   */
  setOutputPath(path) {
    this.outputPath = path;
    return this;
  }

  /**
   * @returns {string}
   */
  getPublicPath() {
    return this.publicPath;
  }

  /**
   * @param {string} path
   * @returns {this}
   */
  setPublicPath(path) {
    this.publicPath = path;
    return this;
  }

  /**
   * @param {string} name
   * @returns {this}
   */
  setName(name) {
    this.name = name;
    return this;
  }

  /**
   * @param {boolean} clean
   * @returns {this}
   */
  cleanOutput(clean) {
    this._outputClean = clean;
    return this;
  }

  /**
   * @param {string} name
   * @param {string} type
   * @returns {this}
   */
  setOutputLibrary(name, type) {
    return this.#setOutputCustom({library: { name, type }})
  }

  /**
   * @param {string} dependencyName
   * @returns {this}
   */
  addDependency(dependencyName) {
    this.dependencies.push(dependencyName);
    return this;
  }

  /**
   * @param {boolean|object|string} options
   * @returns {this}
   */
  checkTypescriptTypes(options = true) {
    if (typeof options === 'string' && options) {
      options = {typescript: {configFile: options}};
    }
    this.enableCheckTypescriptTypes = options;
    return this;
  }

  /**
   * @returns {this}
   */
  splitEntryChunks() {
    this.#shouldSplitEntryChunks = true;
    return this;
  }

  /**
   * @param {string} from
   * @param {string} to
   * @param {object} options
   * @returns {this}
   */
  addCopyPattern(from, to, options = {}) {
    this.#copyPatterns.push({from, to, ...options});
    return this;
  }

  /**
   * @param {string} name
   * @param {object} options
   * @returns {this}
   */
  addPluginOptions(name, options) {
    this.#pluginOptions[name] = deepMerge(this.#pluginOptions[name] ?? {}, options);
    return this;
  }

  /**
   * @param {object} resolve
   * @returns {this}
   */
  addResolve(resolve) {
    this.#resolveCustom = !this.#resolveCustom ? resolve : deepMerge(this.#resolveCustom, resolve);
    return this;
  }

  /**
   * @returns {this}
   */
  enableManifest() {
    this.#useManifestPlugin = true;
    return this;
  }

  /**
   * @param {boolean|null} enabled
   * @returns {this}
   */
  enableSourceMaps(enabled = null) {
    enabled = enabled === null ? !this.isProduction : enabled;
    // https://webpack.js.org/configuration/devtool/#for-production #for-development
    this.#devtool = !enabled ? false : (this.isProduction ? 'source-map' : 'inline-source-map');
    return this;
  }

  /**
   * @param {object} options
   * @returns {this}
   */
  enableBuildNotifications(options = {}) {
    this.#useNotifier = true;
    this.#notifierOptions = Object.assign({}, this.#notifierOptions, options);
    return this;
  }

  getDestinationFilename(append = '', contenthash = null) {
    return (this.isProduction && contenthash !== false || contenthash ? '[name].[contenthash]' : '[name]') + append
  }

  build() {
    const build = {};
    if (this.context) {
      build.context = this.context;
    }
    if (this.name) {
      build.name = this.name;
    }
    build.entry = this.#buildEntry();
    build.mode = this.mode;
    build.output = this.#buildOutput();
    build.module = { rules: this.#buildRules() };
    build.plugins = this.#buildPlugins();
    build.optimization = this.#buildOptimization();
    build.externals = this.externals;
    build.devtool = this.#devtool;
    if (this.dependencies.length > 0) {
      build.dependencies = this.dependencies;
    }
    this._buildResolve(build);
    return build;
  }

  /**
   * @protected
   */
  _getChunkFilename(append = '', contenthash = null) {
    return ''
  }

  /**
   * @param {object} build
   * @protected
   */
  _buildResolve(build) {
    let resolve = {};
    if (Object.keys(this.#aliases).length) {
      resolve.alias = this.#aliases;
    }
    if (this.#resolveCustom) {
      resolve = deepMerge(resolve, this.#resolveCustom);
    }
    if (Object.keys(resolve).length) {
      build.resolve = resolve;
    }
  }

  #buildEntry() {
    const entry = {};
    for (const [entryName, entryChunks] of this.entries) {
      entry[entryName] = entryChunks;
    }
    for (const [entryName, entryChunks] of this.styelEntries) {
      entry[entryName] = entryChunks;
    }
    return entry;
  }

  #buildOutput() {
    const output = {path: this.getOutputPath(), filename: this.getDestinationFilename('.js')};
    const chunkFilename = this._getChunkFilename('.js')
    if (chunkFilename) {
      output.chunkFilename = chunkFilename;
    }
    output.pathinfo = !this.isProduction;
    if (this._outputClean) {
      output.clean = { keep: /entrypoints\.json/ } // clean: true borra entrypoints.json
    }
    output.publicPath = this.getPublicPath();
    return Object.assign(output, this.outputCustom);
  }

  #buildRules() {
    const rules = [];
    rules.push({
      test: /\.(js|jsx|ts|tsx)?$/,
      exclude: /node_modules\/(?!@siglo\/ui)/,
      resolve: {
        fullySpecified: false,
        extensions: ['.js', '.ts'],
      },
      use: {loader: 'esbuild-loader', options: this.#loaderOptions('esbuild-loader', {}) }
    });

    rules.push({
      test: /\.(sa|sc|c)ss$/,
      use: ['css-loader', 'postcss-loader', 'resolve-url-loader', 'sass-loader'].reduce((use, loader) => {
        const options = this.#loaderOptions(loader);
        use.push(options ? {loader, options} : null);
        return use;
      }, [this.miniCssExtractPlugin.loader]).filter(Boolean)
    });

    for (const customRule of this.#customRules) {
      rules.push(customRule);
    }

    return rules;
  }

  /**
   * @param {string} loader
   * @param {object|null} fallbackOptions
   * @returns {object|null}
   */
  #loaderOptions(loader, fallbackOptions = null) {
    const defaultOptions = this.loaderOptionsDefault[loader];
    const customOptions = this.loaderOptionsCustom[loader];
    return defaultOptions || customOptions ? deepMerge(defaultOptions ?? {}, customOptions ?? {}) : fallbackOptions;
  }

  #buildPlugins() {
    const plugins = [];
    for (const customPlugin of this.#customPlugins) {
      plugins.push(customPlugin);
    }
    if (this.#copyPatterns.length) {
      const CopyPlugin = this.#requireResolve("copy-webpack-plugin");
      plugins.push(new CopyPlugin({patterns: this.#copyPatterns}));
    }

    plugins.push(new this.miniCssExtractPlugin(deepMerge(
      {filename: this.getDestinationFilename('.css')}, this.#pluginOptions['mini-css-extract-plugin'] ?? {}
    )));

    if (this.#useManifestPlugin) {
      const { WebpackManifestPlugin, getCompilerHooks } = this.#requireResolve('webpack-manifest-plugin');
      plugins.push(manifestPlugin(WebpackManifestPlugin));
      plugins.push(manifestModifierPlugin(getCompilerHooks));
    }

    this._buildAssetsPlugin(plugins);

    const styleEntries = [...this.styelEntries.keys()];
    if (styleEntries.length) {
      plugins.push(new StyleEntriesCleaner(styleEntries))
    }
    if (this.enableCheckTypescriptTypes) {
      const ForkTsCheckerWebpackPlugin = this.#requireResolve("fork-ts-checker-webpack-plugin");
      let options = typeof this.enableCheckTypescriptTypes === 'object' ? this.enableCheckTypescriptTypes : {};
      if (this.sharedNodeModules) {
        options = deepMerge({typescript: {configOverwrite: {compilerOptions: {
          paths: {"*": [this.sharedNodeModules + "/@types/*", this.sharedNodeModules + "/*"]},
          typeRoots: [this.sharedNodeModules + "/@types"]
        }}}}, options);
      }
      plugins.push(new ForkTsCheckerWebpackPlugin(options));
    }
    if (this.#useNotifier) {
      const WebpackNotifier = this.#requireResolve('webpack-notifier'); // eslint-disable-line
      plugins.push(new WebpackNotifier(this.#notifierOptions));
    }
    return plugins;
  }

  /**
   * @param {object[]} plugins
   */
  _buildAssetsPlugin(plugins) {
    const AssetsPlugin = this.#requireResolve("assets-webpack-plugin");
    plugins.push(new AssetsPlugin({
      path: this.getOutputPath(),
      filename: 'entrypoints.json',
      entrypoints: true,
      prettyPrint: !this.isProduction,
      removeFullPathAutoPrefix: true,
      update: this._assetsUpdate,
      processOutput: assets => {
        for (const bundle in assets) {
          for (const type in assets[bundle]) {
            if (!Array.isArray(assets[bundle][type])) {
              assets[bundle][type] = [assets[bundle][type]];
            }
          }
        }
        return JSON.stringify(assets, null, 2);
      }
    }));
  }

  #buildOptimization() {
    const optimization = this.isProduction ? {minimize: true} : {};
    const splitChunks = {
      chunks: this.#shouldSplitEntryChunks ? chunk => chunk.name !== 'corejs' : 'async',
    };
    if (this.#shouldSplitEntryChunks) {
      splitChunks.cacheGroups = {
        vendor: {
          test: /[\\/]node_modules[\\/](jquery)[\\/]/,
          name: 'jquery',
          chunks: 'all',
        },
      }
    }
    // This causes the split filenames (& internal names) to be,
    // for example, 0.js. This is needed so that the filename
    // doesn't change suddenly when another entry needs that same
    // shared code (e.g. vendor~entry1~entry2.js).
    // https://github.com/webpack/webpack/issues/8426#issuecomment-442375207
    if (this.#shouldSplitEntryChunks && this.isProduction) {
      splitChunks.name = false;
    }
    optimization.splitChunks = splitChunks;
    if (!this.isProduction) {
      optimization.chunkIds = 'named';
      optimization.moduleIds = 'named';
    }
    return optimization;
  }

  #setOutputCustom(outputCustom) {
    Object.assign(this.outputCustom, outputCustom);
    return this;
  }

  #requireResolve(name) {
    return this.roots.length ? require(require.resolve(name, { paths: this.roots })) : require(name);
  }
}

module.exports = WebpackConfig;