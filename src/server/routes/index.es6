
import Router from 'koa-router';
import * as ioServer from '../io-server';
import { DBQueries } from 'arango-client';

const dbQueries = new DBQueries();

// Koa router
const koaRouter = new Router();

// Update the database user entry with the currently used socket id
function updateId(username, socketId) {
  // Record the socketId of the verified user
  return dbQueries
    .query(`
      FOR user in Users
      FILTER LOWER(user.username) == LOWER('${username}')
      UPDATE { _key: user._key, id: '${socketId}'} in Users
    `)
    .then (results => {
      return {error: false, user: username};
    })
    .catch(error => {
      // Log and return the error if there is one
      console.log('[login] - Id update error: ' + error);
      return error;
    });
}

koaRouter.post('/login', function*(/*next*/) {
  console.log('[login] - Login request recieved');

  let {username, password, socketId, addNewUser} = this.request.body || {};

  if (username && password && socketId) {
    this.body = yield dbQueries
      // Grab the user from the DB
      .query(`
        FOR user in Users
        FILTER LOWER(user.username) == LOWER('${username}')
        RETURN {username: user.username, password: user.password}
      `)
      .then(results => {
        if (results.length) {
          let user = results[0];

          // Verify that the password is correct
          if (user.password === password) {
            ioServer.addUser({nickname: username, id: socketId});
            console.log('[login] - Existing user logged in');
            return updateId(username, socketId);
          } else {
            return {error: true, errorCode: -2, errorMessage: 'Incorrect details'};
          }

        // If the username is not found, add it to the DB if confirmation is granted
        } else {
          if (addNewUser) {
            return dbQueries
              .query(`
                INSERT {username: '${username}', password: '${password}', id: '${socketId}'} INTO Users
                RETURN NEW
              `)
              .then(results => {
                let user = results[0];
                ioServer.addUser({nickname: username, id: socketId});

                console.log('[login] - New user logged in');
                return {error: false, user: user.username};
              })
              .catch(error => {
                // Log and return the error if there is one
                console.log('[login] - User insertion error: ' + error);
                return error;
              });
          } else {
            // return error to get confirmation of adding a new user
            return {error: true, errorCode: -3, errorMessage: 'New user confirmation required'};
          }
        }
      })
      .catch(error => {
        // Log and return the error if there is one
        console.log('[login] - Password verification error: ' + error);
        return error;
      });

  } else {
   // yield *next;
   // Respond with invalid request if there is neither of the required keys
   console.log('[login] - Request invalid');
   this.body = {error: true, errorCode: -1, errorMessage: 'Invalid request'};
   this.status = 400;
  }
});

koaRouter.post('/reconnect', function*(/*next*/) {
  console.log('[login] - Reconnect request recieved');

  let {username, oldSocketId, newSocketId} = this.request.body || {};

  if (username && oldSocketId && newSocketId) {
    this.body = yield dbQueries
      // Grab the user from the DB
      .query(`
        FOR user in Users
        FILTER LOWER(user.username) == LOWER('${username}')
        RETURN {username: user.username, socketId: user.id}
      `)
      .then(results => {
        if (results.length) {
          let user = results[0];

          // Verify that the id is correct
          if (user.socketId === oldSocketId) {
            ioServer.addUser({nickname: username, id: newSocketId});
            console.log('[login] - Existing user reconnected');

            return updateId(username, newSocketId);
          } else {
            return {error: true, errorCode: -3, errorMessage: 'No id match'};
          }
        }
      })
      .catch(error => {
        // Log and return the error if there is one
        console.log('[login] - Reconnection error: ' + error);
        return error;
      });

  } else {
   // yield *next;
   // Respond with invalid request if there is neither of the required keys
   console.log('[login] - Request invalid');
   this.body = {error: true, errorCode: -1, errorMessage: 'Invalid request'};
   this.status = 400;
  }
});

export function router() {
  return koaRouter.middleware();
};
