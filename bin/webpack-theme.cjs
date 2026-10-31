#!/usr/bin/env node
const runtimeParse = require('./../webpack/config/runtime-parse.cjs');
const context = require('./../webpack/config/context.cjs');

const runtime = runtimeParse(
  require('yargs-parser')(process.argv.slice(2)),
  process.cwd()
);

context.runtime = runtime;

// remove the command from the input
process.argv.splice(2, 1);

console.log('Running webpack ...');
console.log();

return require('webpack/bin/webpack');