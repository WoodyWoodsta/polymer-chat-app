
import Router from 'koa-router';

import { DBQueries } from 'arango-client';
const dbQueries = new DBQueries();

// Koa router
const koaRouter = new Router();

koaRouter.post('/login', function*(/*next*/){
  // check if there is a body
  // check if input is valid
  // get usernames and passwords
  // check if in ArangoDB
  // if it is:
  //          check if password is correct
  // else add to database
  // ** pseudo code happening here **
  let {username, password} = this.request.body || {};

  if (username && password) {

    this.body = yield dbQueries
      .query(`
        FOR user in Users
        FILTER LOWER(user.username) == LOWER('${username}')
        RETURN {username: user.username, password: user.password}
      `)
      .then(results => {
        console.log('results = ' + results);
        if (results.length) {
          let user = results[0];

          if (user.password === password) {
            console.log({error: false, user: user});
            return {error: false, user: username};
          } else {
            return {error: true, errorMessage: 'Incorrect password'};
          }

        } else {
          return dbQueries
            .query(`
              INSERT {username: '${username}', password: '${password}'} INTO Users
              RETURN NEW
            `)
            .then(results => {
              console.log({error: false, user: results[0].username});
              return {error: false, user: results[0].username};
            });
        }
      })
      .catch(error => {
        console.log(error);
        return error;
      });

  } else {
   // yield *next;
   this.body = {error: true, errorMessage: 'Invalid request'};
   this.status = 400;
  }
});

export function router() {
  return koaRouter.middleware();
};
