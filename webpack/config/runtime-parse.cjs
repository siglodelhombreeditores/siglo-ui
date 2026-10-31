const Runtime = require('./runtime.cjs');
const fs = require('fs');
const dotenv = require('dotenv');

/**
 * @param {object} argv
 * @param {String} cwd
 * @returns {Runtime}
 */
function runtimeParse(argv, cwd) {
  let environment = argv._?.[0] ?? 'dev';

  const envConfig = getEnvConfig(cwd, environment);

  const pwd = envConfig.parsed.PS_CONTEXT && envConfig.parsed.PS_THEME
    ? envConfig.parsed.PS_CONTEXT + '/themes/' + envConfig.parsed.PS_THEME + '/_dev'
    : cwd;

  if (environment === 'development') {
    environment = 'dev';
  } else if (environment === 'production') {
    environment = 'prod';
  }
  if (environment !== 'dev' && environment !== 'prod') {
    console.error(`environment ${environment} not supported`);
    process.exit();
  }

  return new Runtime(
    cwd,
    envConfig.parsed.PS_CONTEXT,
    pwd,
    environment,
    environment !== 'prod',
    envConfig.parsed.PS_ADMIN_DIR ?? 'admin-dev'
  );
}

module.exports = runtimeParse;

/**
 * Lee archivo .env y posibiles .env.prod
 * @param {string} cwd
 * @param {string} environment
 * @returns {import('dotenv').DotenvConfigOutput}
 */
function getEnvConfig(cwd, environment) {
  const envFilePath = cwd + '/.env'
  if (!fs.existsSync(envFilePath)) {
    console.warn('Archivo .env no encontrado');
    process.exit()
    // let pwd = process.env.PWD
    // pwd = readlineSync.question(`Ingrese ps themes context [${pwd}] : `) || pwd
    // fs.writeFileSync(envFilePath, `PS_THEMES_CONTEXT=${pwd}`);
  }

  let envConfig = dotenv.config({ path: envFilePath });

  const environmentEnvFilePath = `${cwd}/.env.${environment}`;
  if (fs.existsSync(environmentEnvFilePath)) {
    const environmentEnvConfig = dotenv.config({ path: environmentEnvFilePath });
    envConfig = { parsed: {...envConfig.parsed, ...environmentEnvConfig.parsed}};
  }

  return envConfig;
}