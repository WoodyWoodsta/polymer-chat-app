// server/index.es6

import Koa from 'koa';
import koaBody from 'koa-body';
import koaStatic from 'koa-static';
import responseTime from 'koa-response-time';

import io from 'socket.io';
import { readFileSync } from 'fs';

// KoaJS app
const app = new Koa();

// socket.io
const _io = io();
Object.defineProperty(app, 'io', {
  value: _io
});

// middlewares
app.use(responseTime());
app.use(koaBody());

app.use(koaStatic(process.cwd() + '/www'));

// quick hack to load config
const config = JSON.parse(readFileSync('server.config'));

// create Server
let server;

// check for ssl
if (config.useSSL) {
  let ssl = {};
  for (let key in config.ssl) {
    ssl[key] = fs.readFileSync(config.ssl[key], 'utf8');
  }
  server = require('https').createServer(ssl, app.callback());
} else {
  server = require('http').createServer(app.callback());
}

// attach socket.io
app.io.attach(server);

//
// customise here
//

// listen
console.log();
server.listen(config.port, config.host, function(err) {
  if (err) throw err;
  console.log(`Listening on ${config.ssl ? 'https' : 'http'}://${config.host}:${config.port}`);
});
