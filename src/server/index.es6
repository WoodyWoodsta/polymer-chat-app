// server/index.es6

import Koa from 'koa';
import koaBody from 'koa-body';
import koaStatic from 'koa-static';
import responseTime from 'koa-response-time';
import { router } from './routes';
import http from 'http';
import https from 'https';

import io from 'socket.io';
import { readFileSync } from 'fs';

import createIOServer from './io-server';

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
app.use(router());
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
  server = https.createServer(ssl, app.callback());
} else {
  server = http.createServer(app.callback());
}

// attach socket.io
app.io.attach(server);

// create io server
createIOServer(app);

// listen
console.log();
server.listen(config.port, config.host, function(err) {
  if (err) throw err;
  console.log(`Listening on ${config.ssl ? 'https' : 'http'}://${config.host}:${config.port}`);
});
