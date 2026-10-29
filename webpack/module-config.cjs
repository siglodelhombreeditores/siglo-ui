const path = require("path");
const StyleEntriesCleaner = require("./style-entries-cleaner.cjs");

class ModuleConfig {
  /**
   * @param {string} module
   * @param {'development'|'production'} mode
   * @param {string} sharedNodeModules
   */
  constructor(module, mode = 'development', sharedNodeModules = '') {
    this.roots = [
      path.resolve(__dirname, 'node_modules'),
      process.cwd(),
    ];
    this.sharedNodeModules = sharedNodeModules;
    if (this.sharedNodeModules) {
      this.roots.push(this.sharedNodeModules);
    }
    this.module = module;
    this.mode = mode;
    this.outputPath = path.resolve(process.cwd(), 'public');
    this.entries = new Map();
    this.styelEntries = new Map();
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
    this.loaderOptionsCustom = {}
    this.outputCustom = {};
    this.miniCssExtractPlugin = this.#requireResolve("mini-css-extract-plugin");
    this.name = null;
    this.dependencies = [];
    this.outputClean = true;
    this.enableCheckTypescriptTypes = false;
  }

  get isProduction() {
    return this.mode === 'production';
  }

  /**
   * @param {string} name
   * @param {string|object} src
   * @returns {ModuleConfig}
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
   * @returns {ModuleConfig}
   */
  addStyleEntry(name, src) {
    if (this.styelEntries.has(name) || this.entries.has(name)) {
      throw new Error(`Duplicate name "${name}" passed to addStyleEntry(): entries must be unique.`);
    }
    this.styelEntries.set(name, src);
    return this;
  }

  /**
   * @param {object} externals
   * @returns {ModuleConfig}
   */
  addExternals(externals = {}) {
    Object.assign(this.externals, externals);
    return this;
  }

  /**
   * @returns {ModuleConfig}
   */
  addExternalJQuery() {
    return this.addExternals({
      $: '$',
      jquery: 'jQuery'
    })
  }
  /**
   * @returns {ModuleConfig}
   */
  addExternalSigloAdmin() {
    return this.addExternals({'@siglo/ui/admin-services': 'sigloAdmin'});
  }

  /**
   * @param {string} loaderName
   * @param {object} options
   * @returns {ModuleConfig}
   */
  addLoaderOptions(loaderName, options) {
    this.loaderOptionsCustom[loaderName] = options;
    return this;
  }


  /**
   * @param {string} name
   * @param {string} type
   * @returns {ModuleConfig}
   */
  setOutputLibrary(name, type) {
    return this.#setOutputCustom({library: { name, type }})
  }

  /**
   * @param {boolean} clean
   * @returns {ModuleConfig}
   */
  cleanOutput(clean) {
    this.outputClean = clean;
    return this;
  }

  /**
   * @param {string} name
   * @returns {ModuleConfig}
   */
  setName(name) {
    this.name = name;
    return this;
  }

  /**
   * @param {string} dependencyName
   * @returns {ModuleConfig}
   */
  addDependency(dependencyName) {
    this.dependencies.push(dependencyName);
    return this;
  }

  /**
   * @param {boolean|object|string} options
   * @returns {ModuleConfig}
   */
  checkTypescriptTypes(options = true) {
    if (typeof options === 'string' && options) {
      options = {typescript: {configFile: options}};
    }
    this.enableCheckTypescriptTypes = options;
    return this;
  }

  build() {
    const build = this.name ? {name: this.name} : {};
    build.entry = this.#buildEntryConfig();
    build.mode = this.mode;
    build.output = Object.assign({
      path: this.outputPath,
      filename: this.#getDestinationFilename('.js'),
      chunkFilename: this.#getDestinationFilename('.js'),
      pathinfo: !this.isProduction,
      clean: this.outputClean ? {
        keep: /entrypoints\.json/ // clean: true borra entrypoints.json
      } : false,
      publicPath: `/modules/${this.module}/public/`,
    }, this.outputCustom);
    build.module = {  rules: this.#buildRules() };
    build.plugins = this.#buildPlugins();
    build.externals = this.externals;
    // https://webpack.js.org/configuration/devtool/#for-production #for-development
    build.devtool = this.isProduction ? 'source-map' : 'inline-source-map';
    if (this.dependencies.length > 0) {
      build.dependencies = this.dependencies;
    }
    if (this.sharedNodeModules) {
      build.resolve = {modules: ['node_modules', this.sharedNodeModules]};
      build.resolveLoader = {modules: ['node_modules', this.sharedNodeModules]}
    }
    return build;
  }

  #buildEntryConfig() {
    const entry = {};
    for (const [entryName, entryChunks] of this.entries) {
      // entryFile could be an array, we don't care
      entry[entryName] = entryChunks;
    }
    for (const [entryName, entryChunks] of this.styelEntries) {
      entry[entryName] = entryChunks;
    }
    return entry;
  }

  #getDestinationFilename(append = '', contenthash = null) {
    return (this.isProduction && contenthash !== false || contenthash ? '[name].[contenthash]' : '[name]') + append
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
      use: this.#buildLoader('esbuild-loader')
    });

    rules.push({
      test: /\.(sa|sc|c)ss$/,
      use: [
        this.miniCssExtractPlugin.loader,
        this.#buildLoader('css-loader'),
        this.#buildLoader('postcss-loader'),
        this.#buildLoader('sass-loader')
      ]
    })

    return rules;
  }

  #buildLoader(loaderName) {
    return {
      loader: loaderName,
      options: {...(this.loaderOptionsDefault[loaderName] ?? {}), ...(this.loaderOptionsCustom[loaderName] ?? {})}
    }
  }

  #buildPlugins() {
    const AssetsPlugin = this.#requireResolve("assets-webpack-plugin");
    const plugins = [
      new this.miniCssExtractPlugin({filename: this.#getDestinationFilename('.css')}),
      new AssetsPlugin({
        path: this.outputPath,
        filename: 'entrypoints.json',
        entrypoints: true,
        prettyPrint: !this.isProduction,
        removeFullPathAutoPrefix: true,
        update: !this.outputClean,
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
      }),
    ];
    const styleEntries = [...this.styelEntries.keys()];
    if (styleEntries.length) {
      plugins.push(new StyleEntriesCleaner(styleEntries))
    }
    if (this.enableCheckTypescriptTypes) {
      const ForkTsCheckerWebpackPlugin = this.#requireResolve("fork-ts-checker-webpack-plugin");
      let options = typeof this.enableCheckTypescriptTypes === 'object' ? this.enableCheckTypescriptTypes : {};
      if (this.sharedNodeModules) {
        options = this.#deepMerge({typescript: {configOverwrite: {compilerOptions: {
          paths: {"*": [this.sharedNodeModules + "/@types/*", this.sharedNodeModules + "/*"]},
          typeRoots: [this.sharedNodeModules + "/@types"]
        }}}}, options);
      }
      plugins.push(new ForkTsCheckerWebpackPlugin(options));
    }
    return plugins;
  }

  #setOutputCustom(outputCustom) {
    this.outputCustom = Object.assign(this.outputCustom, outputCustom);
    return this;
  }

  #requireResolve(name) {
    return require(require.resolve(name, { paths: this.roots }));
  }

  #deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (
        typeof source[key] === "object" &&
        !Array.isArray(source[key]) &&
        key in target &&
        typeof target[key] === "object" &&
        !Array.isArray(target[key])
      ) {
        result[key] = this.#deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}

module.exports = ModuleConfig;