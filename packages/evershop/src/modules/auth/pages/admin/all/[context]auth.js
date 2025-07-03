import { select } from '@evershop/postgres-query-builder';
import { pool } from '../../../../../lib/postgres/connection.js';
import { buildUrl } from '../../../../../lib/router/buildUrl.js';

export default (request, response, next) => {
  const { userID } = request.session;
  // Load the user from the database
  select()
    .from('admin_user')
    .where('admin_user_id', '=', userID)
    .and('status', '=', 1)
    .load(pool)
    .then((user) => {
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
    })
    .catch(() => {
      // In case of a database error, we should probably logout the user as well
      request.logoutUser(() => {
        response.redirect(buildUrl('adminLogin'));
      });
    });
};