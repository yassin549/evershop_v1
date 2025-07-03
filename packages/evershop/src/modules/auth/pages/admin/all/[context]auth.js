import { select } from '@evershop/postgres-query-builder';
import { buildUrl } from '@evershop/evershop/lib/router';

export default async (request, response, delegate, next) => {
  const { userID } = request.session;

  // Handle the hardcoded admin user
  if (userID === 1) {
    request.locals.user = {
      admin_user_id: 1,
      email: 'khoualdiyassin26@gmail.com',
      status: 1,
      full_name: 'Admin User'
    };
    request.locals.widgets = [];
    return next();
  }

  // For all other users, load from the database
  const user = await select()
    .from('admin_user')
    .where('admin_user_id', '=', userID)
    .and('status', '=', 1)
    .load();

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