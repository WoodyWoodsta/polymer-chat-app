// socket-server/index.es6

let msgId = 0;
const clients = {};

function getClientSockets() {
  return Object.keys(clients).map(k => clients[k]);
}

setInterval(() => {
  let sockets = getClientSockets();
  for (let socket of sockets) {
    socket.emit('Server Message', { ts: Date.now(), msgId, message: `This is message ${msgId}` });
    msgId++;
  }
}, 5000);

function connect(socket) {
  console.log(socket.id, 'connected');

  // cache socket on connect
  clients[socket.id] = socket;

  // handle connections
  socket.on('disconnect', () => disconnect(socket));

  // handle client messages
  socket.on('Client Message', function (data) {
    console.log(data);
  });
}

function disconnect(socket) {
  console.log(socket.id, 'disconnected');
  // decache socket on disconnect
  delete clients[socket.id];
}

export default function init(app) {
  app.io.on('connection', socket => connect(socket));
}
