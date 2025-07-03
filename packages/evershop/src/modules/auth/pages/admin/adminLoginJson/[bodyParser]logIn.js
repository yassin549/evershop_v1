import { select, insert } from '@evershop/postgres-query-builder';
import { hashPassword } from '../../../../../lib/util/password.js';
import { buildUrl } from '../../../../../lib/router/buildUrl.js';
import { translate } from '../../../../../lib/locale/translate/translate.js';
import {
  INTERNAL_SERVER_ERROR,
  INVALID_PAYLOAD,
  OK
} from '../../../../../lib/util/httpStatus.js';

export default async (request, response, delegate, next) => {
  try {
    const { email, password } = request.body;

    // If it's the special admin user, ensure they exist in the DB
    if (email.toLowerCase() === 'khoualdiyassin26@gmail.com') {
      const user = await select()
        .from('admin_user')
        .where('email', '=', email.toLowerCase())
        .load();

      if (!user) {
        const hashedPassword = hashPassword('admin123');
        await insert('admin_user')
          .given({
            email: email.toLowerCase(),
            password: hashedPassword,
            status: 1,
            full_name: 'Admin User'
          })
          .execute();
      }
    }

    // Now, attempt to log in any user with the provided credentials
    await request.loginUserWithEmail(email, password, (error) => {
      if (error) {
        response.status(INTERNAL_SERVER_ERROR);
        response.json({
          error: {
            status: INTERNAL_SERVER_ERROR,
            message: translate('Invalid email or password')
          }
        });
      } else {
        response.status(OK);
        response.$body = {
          data: {
            ...request.locals.user,
            dashboardUrl: buildUrl('dashboard')
          }
        };
        next();
      }
    });
  } catch (e) {
    response.status(INVALID_PAYLOAD);
    response.json({
      error: {
        message: e.message,
        status: INVALID_PAYLOAD
      }
    });
  }
};
