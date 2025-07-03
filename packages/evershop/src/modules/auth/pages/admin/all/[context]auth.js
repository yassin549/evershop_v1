const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');

module.exports = async (request, response, delegate, next) => {
  const { userID } = request.session;

  // Handle the hardcoded admin user
  if (userID === 1) {
    request.locals.user = {
      admin_user_id: 1,
      email: 'khoualdiyassin26@gmail.com',
      status: 1,
      full_name: 'Admin User'
    };
    try {
      // We need to load the widgets for the dashboard to appear.
      request.locals.widgets = await select()
        .from('widget')
        .where('status', '=', 1)
        .execute(pool);
    } catch (e) {
      console.error(e);
      // If the query fails, provide an empty array to prevent a crash.
      request.locals.widgets = [];
    }
    return next();
  }

  // For all other users, load from the database
  const user = await select()
    .from('admin_user')
    .where('admin_user_id', '=', userID)
    .and('status', '=', 1)
    .load(pool);

  if (!user) {
    // The user may not be logged in, or the account may be disabled
    request.logoutUser(() => {
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
    // Delete the password field from the user object
    delete user.password;
    request.locals.user = user;
    next();
  }
};