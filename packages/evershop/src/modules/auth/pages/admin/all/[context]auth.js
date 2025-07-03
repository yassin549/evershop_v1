import { select } from '@evershop/postgres-query-builder';
import { pool } from '../../../../../lib/postgres/connection.js';
import { buildUrl } from '../../../../../lib/router/buildUrl.js';

export default async (request, response, delegate, next) => {
  const { userID } = request.session;

  // Check for our hardcoded admin user
  if (userID === 1) {
    // This is our hardcoded admin.
    // Manually set the user object and skip the database check.
    request.locals.user = {
      admin_user_id: 1,
      email: 'khoualdiyassin26@gmail.com',
      status: 1,
      full_name: 'Admin User'
    };
    return next();
  }

  // Load the user from the database for any other user
  const user = await select()
    .from('admin_user')
    .where('admin_user_id', '=', userID)
    .and('status', '=', 1)
    .load(pool);

  if (!user) {
    // The user may not be logged in, or the account may be disabled
    // Logout the user
    request.logoutUser(() => {
      // Check if current route is adminLogin
      if (
        request.currentRoute.id === 'adminLogin' ||
        request.currentRoute.id === 'adminLoginJson'
      ) {
        next();
      } else {
        response.redirect(buildUrl('adminLogin'));
      }
    });
  } else {
    // Delete the password field
    delete user.password;
    request.locals.user = user;
    next();
  }
};
