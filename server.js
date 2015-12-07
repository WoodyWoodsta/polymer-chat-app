// index.js

// add helpers (babel-external-helpers > external-helpers.js)
require('babel-external-helpers');

// bootstrap babel
require('babel-core/register');
require('./src/server');
