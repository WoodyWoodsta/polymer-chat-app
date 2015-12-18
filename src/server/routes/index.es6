
import Router from 'koa-router';

import { DBQueries } from 'arango-client';
const dbQueries = new DBQueries();

// Koa router
const koaRouter = new Router();

koaRouter.post('/login', function*(/*next*/){
  console.log('[login] - Request recieved');
  console.log(JSON.stringify(this.request.body));
  // check if there is a body
  // check if input is valid
  // get usernames and passwords
  // check if in ArangoDB
  // if it is:
  //          check if password is correct
  // else add to database

  let {username, password} = this.request.body || {};

  if (username && password) {
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
            console.log('[login] - Existing user logged in');
            return {error: false, user: username};
          } else {
            // Respond with an error if the password is incorrect
            return {error: true, errorMessage: 'Incorrect password'};
          }

        // If the username is not found, add it to the DB
        } else {
          return dbQueries
            .query(`
              INSERT {username: '${username}', password: '${password}'} INTO Users
              RETURN NEW
            `)
            .then(results => {
              console.log('[login] - New user registered');
              return {error: false, user: results[0].username};
            });
        }
      })
      .catch(error => {
        // Log and return the error if there is one
        console.log('[login] - Error: ' + error);
        return error;
      });

  } else {
   // yield *next;
   // Respond with invalid request if there is neither of the required keys
   console.log('[login] - Request invalid');
   this.body = {error: true, errorMessage: 'Invalid request'};
   this.status = 400;
  }
});

export function router() {
  return koaRouter.middleware();
};
