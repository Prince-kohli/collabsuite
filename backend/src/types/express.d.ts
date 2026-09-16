import { TokenPayload } from '../utils/jwt.util';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}