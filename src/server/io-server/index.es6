// socket-server/index.es6

import { DBQueries } from 'arango-client';

const users = {};

const dbQueries = new DBQueries();

export default function init(app) {

  // all functions when connected
  app.io.sockets.on('connection', socket => {

    // to prevent multiples of usernames
    socket.on('new user', (data, callback) => {
      if (data in users) {
        callback(false);
      } else {
        socket.nickname = data;
        users[socket.nickname] = socket;
        app.io.sockets.emit('usernames', Object.keys(users));

        // Notify the users of a new user
        app.io.sockets.emit('user notification', {
          nick: socket.nickname,
          ts: Date.now(),
          notificationType: 'join'
        });

        console.log('[e-chat] - New user connected');

        // creates query, sorts messages and limits to 100 messages to display
        dbQueries
          .query(`
            FOR m IN Messages
            SORT m.ts DESC
            LIMIT 100
            RETURN {msg: m.msg, nick: m.nick, ts: m.ts}`)
          .then(data => {
            app.io.sockets.emit('load old msgs', data);
          })
          .catch(error => console.log(error));

        callback(true);
      }
    });

    // If the user was connected, but server restarted, restore the user
    socket.on('restore user', (data) => {
      // Only if the user is not in the list
      if (!(data in users)) {
        socket.nickname = data;
        users[socket.nickname] = socket;
        app.io.sockets.emit('usernames', Object.keys(users));

        console.log('[e-chat] - Existing user reconnected');
      }
    });

  // to send a message in the form of username: message
    socket.on('send message', data => {

      // remove whitespace
      let message = data.trim();

      // determine if it is a whisper or not
      if(message.substr(0, 3) === '/w ') {

        message = message.substr(3);
        let index = message.indexOf(' ');

        if (index != -1){
          let name = message.substr(0, index);
          message = message.substr(index+1);

          // check to see if user is online
          if (name in users) {
            users[name].emit('whisper', {msg: message, nick: socket.nickname});
            console.log('whisper');
          } else {
            callback('Error, enter a valid user.');
          }
          // return error if no spaces between '/w' and username
        } else {
          callback('Error!');
        }

      } else {

        // saves message to the database
        let msg = {
          ts: Date.now(),
          msg: message,
          nick: socket.nickname
        };

        // adds message to database
        dbQueries
          .query(`
            INSERT @message INTO Messages
            RETURN {msg: NEW.msg, nick: NEW.nick, ts: NEW.ts}`,
            {message: msg})
          .then(results => app.io.sockets.emit('new message', results[0]))
          .catch(error => console.log(error));
      };
    });

    // when disconnected, removes username from array
    // and updates online statuses
      socket.on('disconnect', () => {
        var deletedNick = socket.nickname;

        if (!socket.nickname) return;
        delete users[socket.nickname];
        app.io.sockets.emit('usernames', Object.keys(users));

        // Notify the users of a new user
        app.io.sockets.emit('user notification', {
          nick: deletedNick,
          ts: Date.now(),
          notificationType: 'leave'
        });

        console.log('[e-chat] - User disconnected');
      });

  });
}
