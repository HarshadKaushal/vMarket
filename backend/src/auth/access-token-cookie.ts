export const accessTokenCookie = 'access_token';

export const accessTokenCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 1000,
};
