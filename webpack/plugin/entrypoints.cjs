const AssetsPlugin = require('assets-webpack-plugin');

/**
 * @param {string} basePath
 * @param {boolean} isProduction
 * @param {string} publicPath
 * @param {function} entryModifier
 * @param {function} assetPathModifier
 * @returns {AssetsPlugin}
 */
module.exports = (
  basePath,
  isProduction,
  publicPath,
  entryModifier,
  assetPathModifier,
) => new AssetsPlugin({
  path: basePath,
  filename: 'entrypoints.json',
  includeAllFileTypes: true,
  entrypoints: true,
  prettyPrint: !isProduction,
  removeFullPathAutoPrefix: true,
  processOutput: assets => {
    const processedAssets = {};
    for (const entry in assets) {
      const processedEntryKey = entryModifier ? entryModifier(entry) : entry;
      if (!processedEntryKey) {
        continue
      }
      processedAssets[processedEntryKey] = {}
      for (const fileType in assets[entry]) {
        const formattedAssets = [];
        if (!Array.isArray(assets[entry][fileType])) {
          assets[entry][fileType] = [assets[entry][fileType]];
        }
        for (let i = 0; i < assets[entry][fileType].length; i++) {
          let assetPath = assetPathModifier(assets[entry][fileType][i]
              // eliminamos public path ya que este es incluido por prestashop
              .replace(publicPath, '')
              // css viene en forma ../css
              .replace('../css', '')
              // no empiecen con /
              .replace(/^\//, '')
            , fileType);
          if (assetPath) {
            formattedAssets.push(assetPath)
          }
        }
        processedAssets[processedEntryKey][fileType] = formattedAssets;
      }
    }
    return JSON.stringify(processedAssets, null, 2);
  }
});