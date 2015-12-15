
import Router from 'koa-router';

import { DBQueries } from 'arango-client';
const dbQueries = new DBQueries();

// Koa router
const router = new Router();

router.get('/login', function*(next){
  // get usernames and passwords
  // check if in ArangoDB
  // if it is:
  //          check if password is correct
  // else add to database
  // ** pseudo code happening here **

  dbQueries
    .query(`
      FOR user in Users
      RETURN {user: user.user, pwd: user.password}
    `)
    .then(results => {
        if (this.request.body.username in results) {
          var index = indexOf(this.username);
          return index;
        }
      }
    )
    .then(results => {
      if (results[index].password === this.password) {
      return true;
    } else {
      dbQueries.query(`INSERT username INTO Users`);
    }
    });
    yield *next;

});

let router = router.middleware;
export {router};
