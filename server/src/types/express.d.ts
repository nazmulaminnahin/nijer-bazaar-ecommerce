import type { AuthUser, AuthAdmin } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      admin?: AuthAdmin;
    }
  }
}

export {};