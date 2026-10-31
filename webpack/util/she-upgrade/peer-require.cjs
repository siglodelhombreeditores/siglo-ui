/**
 * Importate: PHPStorm integration (fix node find peerDependencies)
 * @deprecated Sin shencore ya no es necesario
 */
if (!process.env.NODE_PATH) {
  const Module = require('module');
  const originalRequire = Module.prototype.require;

  Module.prototype.require = function(){
    if (arguments[0].startsWith('.')) {
      return originalRequire.apply(this, arguments);
    }

    const newPath = process.cwd() + '/node_modules'
    if (!this.paths.includes(newPath)) {
      this.paths.unshift(newPath)
    }
    return originalRequire.apply(this, arguments);
  };
}