const path = require('path');

/**
 * @param {typeof import('webpack-manifest-plugin').WebpackManifestPlugin} WebpackManifestPlugin
 * @returns {InstanceType<typeof import('webpack-manifest-plugin').WebpackManifestPlugin>}
 */
function manifestPlugin(WebpackManifestPlugin) {
  const imagePattern = /\.\.\/img\//
  return new WebpackManifestPlugin({
    fileName: '../manifest.json',
    filter: file => file.name.match(imagePattern),
    map: function (file) {
      file.name = file.name.replace(imagePattern, '');
      file.path = path.resolve(file.path);
      return file;
    }
  });
}

/**
 * @param {typeof import('webpack-manifest-plugin').getCompilerHooks} getCompilerHooks
 * @returns {ManifestModifierPlugin}
 */
function manifestModifierPlugin(getCompilerHooks) {
  class ManifestModifierPlugin {
    apply(compiler) {
      const { beforeEmit } = getCompilerHooks(compiler);

      beforeEmit.tap('ManifestModifierPlugin', (manifest) => {
        return this._addExtensionlessWebpEntries(manifest)
      });
    }

    /**
     * entries webp, agrega una entry adicional sin extension para que smarty pueda llamar tanto .webp como .jpg
     */
    _addExtensionlessWebpEntries(manifest) {
      const newEntries = {}
      for (const key in manifest) {
        if (key.match(/\.webp$/)) {
          newEntries[key.replace('.webp', '')] = manifest[key].replace('.webp', '')
        }
      }
      return { ...manifest, ...newEntries };
    }
  }

  return new ManifestModifierPlugin();
}

module.exports = {
  manifestPlugin,
  manifestModifierPlugin
}