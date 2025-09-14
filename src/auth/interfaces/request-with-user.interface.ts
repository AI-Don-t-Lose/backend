import { Request } from 'express';
import type { JwtPayload } from './jwt-payload.interface';

export interface RequestWithUser extends Request {
  user?: JwtPayload;
  userId?: string;
}
