// socket-server/index.es6

import { DBQueries } from 'arango-client';

const users = {};

const dbQueries = new DBQueries();

export default function init(app) {

  // all functions when connected
  app.io.sockets.on('connection', function(socket){
    
    // creates query, sorts messages and limits to 8 messages to display
    dbQueries
      .query(`
        FOR m IN Messages
        SORT m.ts DESC
        LIMIT 5
        RETURN {msg: m.msg, nick: m.nick}`)
      .then(function(data) {
        app.io.sockets.emit('load old msgs', data);
      })
      .catch(function(error) { console.log(error);});

    // to prevent multiples of usernames
    socket.on('new user', function(data, callback){
      if (data in users) {
        callback(false);
      } else {
        callback(true);
        socket.nickname = data;
        users[socket.nickname] = socket;
        app.io.sockets.emit('usernames', Object.keys(users));
      }
    });

  // to send a message in the form of username: message
    socket.on('send message', function(data, callback){

      // remove whitespace
      var message = data.trim();

      // determine if it is a whisper or not
      if(message.substr(0, 3) === '/w '){

        message = message.substr(3);
        var index = message.indexOf(' ');

        if (index != -1){
          var name = message.substr(0, index);
          var message = message.substr(index+1);

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
        var msg = {
          ts: Date.now(),
          msg: message,
          nick: socket.nickname
        };
        dbQueries
          .query(`
            INSERT @message INTO Messages
            RETURN {msg: NEW.msg, nick: NEW.nick}`,
            {message: msg})
          .then(function(results) {
            app.io.sockets.emit('new message', results[0]);
          })
          .catch(function(error) { console.log(error);});
      }
    });

  // when disconnected, removes username from array
  // and updates online statuses
    socket.on('disconnect', function(/*data*/){
      if (!socket.nickname) return;
      delete users[socket.nickname];
      app.io.sockets.emit('usernames', Object.keys(users));
    });

  });
}
