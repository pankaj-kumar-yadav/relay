import jwtLib, { type SignOptions } from 'jsonwebtoken';

import {
  InternalError,
  TokenExpiredError,
  UnauthorizedError,
} from '@/utils/errors.js';

export class JWTPayload {
  iss: string;
  aud: string;
  sub: string;
  prm: string;
  iat: number;
  exp: number;

  constructor(
    issuer: string,
    audience: string,
    subject: string,
    param: string,
    validitySec: number,
  ) {
    this.iss = issuer;
    this.aud = audience;
    this.sub = subject;
    this.prm = param;
    this.iat = Math.floor(Date.now() / 1000);
    this.exp = this.iat + validitySec;
  }
}

async function encode(payload: JWTPayload, secret: string): Promise<string> {
  if (!secret) throw new InternalError('Token generation failure');
  const options: SignOptions = { algorithm: 'HS256' };
  return new Promise((resolve, reject) => {
    jwtLib.sign({ ...payload }, secret, options, (err, token) => {
      if (err || !token) return reject(new InternalError('Token generation failure'));
      resolve(token);
    });
  });
}

async function decode(token: string): Promise<JWTPayload> {
  if (!token) throw new UnauthorizedError('Token decoding failure');
  const decoded = jwtLib.decode(token);
  if (!decoded || typeof decoded === 'string') {
    throw new UnauthorizedError('Invalid token');
  }
  return decoded as JWTPayload;
}

async function validate(token: string, secret: string): Promise<JWTPayload> {
  if (!token) throw new UnauthorizedError('Token validation failure');
  return new Promise((resolve, reject) => {
    jwtLib.verify(token, secret, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return reject(new TokenExpiredError());
        }
        return reject(new UnauthorizedError('Invalid token'));
      }
      resolve(decoded as JWTPayload);
    });
  });
}

export default { encode, decode, validate };
