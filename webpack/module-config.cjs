const WebpackConfig = require('./webpack-config.cjs')
const path = require("path");
const deepMerge = require("./util/deep-merge.cjs");

class ModuleConfig extends WebpackConfig {

  /**
   * @param {string} module
   * @param {'development'|'production'} mode
   * @param {string} sharedNodeModules
   */
  constructor(module, mode = 'development', sharedNodeModules = '') {
    super({mode, sharedNodeModules});
    this.module = module;
    this.outputPath = path.resolve(process.cwd(), 'public');
    this.enableSourceMaps();
  }

  /**
   * @returns {this}
   */
  addExternalSigloAdmin() {
    return this.addExternals({'@siglo/ui/admin-services': 'sigloAdmin'});
  }

  getPublicPath() {
    return `/modules/${this.module}/public/`;
  }

  /**
   * @param {boolean} clean
   * @returns {this}
   */
  cleanOutput(clean) {
    this._outputClean = clean;
    this._assetsUpdate = !clean;
    return this;
  }

  _getChunkFilename(append = '', contenthash = null) {
    return this.getDestinationFilename(append, contenthash);
  }

  _buildResolve(build) {
    super._buildResolve(build);
    if (this.sharedNodeModules) {
      build.resolve = deepMerge(build.resolve ?? {}, {modules: ['node_modules', this.sharedNodeModules]});
      build.resolveLoader = {modules: ['node_modules', this.sharedNodeModules]}
    }
  }
}

module.exports = ModuleConfig;