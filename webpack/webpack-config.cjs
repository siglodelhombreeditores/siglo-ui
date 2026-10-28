const path = require("path");
const StyleEntriesCleaner = require("./style-entries-cleaner.cjs");

class WebpackConfig {
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
  }

  get isProduction() {
    return this.mode === 'production';
  }

  /**
   * @param {string} name
   * @param {string|object} src
   * @returns {WebpackConfig}
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
   * @returns {WebpackConfig}
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
   * @returns {WebpackConfig}
   */
  addExternals(externals = {}) {
    Object.assign(this.externals, externals);
    return this;
  }

  /**
   * @returns {WebpackConfig}
   */
  addExternalJQuery() {
    return this.addExternals({
      $: '$',
      jquery: 'jQuery'
    })
  }

  /**
   * @param {string} loaderName
   * @param {object} options
   * @returns {WebpackConfig}
   */
  addLoaderOptions(loaderName, options) {
    this.loaderOptionsCustom[loaderName] = options;
    return this;
  }


  /**
   * @param {string} name
   * @param {string} type
   * @returns {WebpackConfig}
   */
  setOutputLibrary(name, type) {
    return this.#setOutputCustom({library: { name, type }})
  }

  /**
   * @param {boolean} clean
   * @returns {WebpackConfig}
   */
  cleanOutput(clean) {
    this.outputClean = clean;
    return this;
  }

  /**
   * @param {string} name
   * @returns {WebpackConfig}
   */
  setName(name) {
    this.name = name;
    return this;
  }

  /**
   * @param {string} dependencyName
   * @returns {WebpackConfig}
   */
  addDependency(dependencyName) {
    this.dependencies.push(dependencyName);
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
      exclude: /(node_modules)/,
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
      })
    ];
    const styleEntries = [...this.styelEntries.keys()];
    if (styleEntries.length) {
      plugins.push(new StyleEntriesCleaner(styleEntries))
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
}

module.exports = WebpackConfig;