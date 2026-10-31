const path = require('path');
const fs = require('fs');

/**
 * Sistema resolver. Resuelve ubicacion de archivos segun listado de ubicaciones
 * Ej. Para archivos _core de prestashop, de las siguientes carpetas donde encuentre retorna
 * - temasiglo/_dev/_core/js
 * - shencore/src/_core/js
 * - ps/themes/_core/js ( original donde obligatoriamente existe )
 */
class OverridesResolverPlugin {
  /**
   * @param {{[serch:string]:string[]}} overrides
   */
  constructor(overrides) {
    this._overrides = overrides
  }

  apply(compiler) {
    compiler.resolverFactory.hooks.resolver
      .for('normal')
      .tap('OverridesResolverPlugin', (resolver, resolveOptions, originalResolveOptions) => {
        this.fileIntercept(resolver)
      });
  }

  fileIntercept(resolver) {
    resolver.hooks.file.intercept({
      call: (request, resolveContext, callback) => {
        let requestPath = request.path
        if (requestPath) {
          const overridesSearch = this._matchOverrides(requestPath);
          if (overridesSearch) {
            const remainingPath = requestPath.substring(requestPath.indexOf(overridesSearch) + overridesSearch.length)

            const resolvedPaths = this._overrides[overridesSearch].map(override => path.resolve(override, remainingPath))

            for (const resolvedPath of resolvedPaths) {
              if (fs.existsSync(resolvedPath)) {
                requestPath = resolvedPath
                break;
              }
            }
            // resolvedPaths.reduce((reqPath, resolvedPath) => reqPath || (fs.existsSync(resolvedPath) ? resolvedPath : null), null)
            request.path = requestPath
            // si es she (sea theme o shencore) y se importa a si mismo importamos el original
            // if (request.context.issuer === sheThemePath || request.context.issuer === shencorePath) {
            //     sheThemePath = shencorePath = null
            // }
          }
        }
      }
    });
    // you can tap into resolver.hooks now
    // resolver.hooks.resolve.tap('CoreResolverPlugin', function (request, resolveContext, callback) {
    //     const x = 1;
    // })
    // resolver.hooks.result.tap('CoreResolverPlugin', function(result) {
    //     return result;
    // });
  }

  /**
   * @param {string} requestPath
   * @return {string|null}
   * @private
   */
  _matchOverrides(requestPath) {
    for (const search in this._overrides) {
      if (requestPath.indexOf(search) >= 0) {
        return search
      }
    }
    return null
  }
}

module.exports = OverridesResolverPlugin;