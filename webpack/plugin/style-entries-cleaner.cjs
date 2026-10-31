class StyleEntriesCleaner {

  /**
   * @param {string[]} entryNames
   */
  constructor(entryNames) {
    this.entryNames = entryNames;
  }
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('StyleEntriesCleaner', (compilation) => {
      compilation.hooks.processAssets.tap(
        { name: 'StyleEntriesCleaner', stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE },
        () => {
          for (const entryName of this.entryNames) {
            const entrypoint = compilation.entrypoints.get(entryName);
            if (entrypoint) {
              for (const chunk of entrypoint.chunks) {
                const jsFiles = [...chunk.files, ...chunk.auxiliaryFiles].filter(
                  (file) => /\.(m?js|js\.map)(\?.*)?$/.test(file)
                );

                jsFiles.forEach((file) => compilation.deleteAsset(file));
              }
            }
          }
        }
      );
    });
  }
}

module.exports = StyleEntriesCleaner;