
import Router from 'koa-router';

import { DBQueries } from 'arango-client';
const dbQueries = new DBQueries();

// Koa router
const router = new Router();

router.get('/login', function*(){
  // get usernames and passwords
  // check if in ArangoDB
  // if it is:
  //          check if password is correct
  // else add to database
  //
  dbQueries
    .query(`
      FOR user in Users
      RETURN user
    `);
    // unfinished
});

let router = router.middleware;
export {router};
