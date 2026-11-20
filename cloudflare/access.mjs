import { createRemoteJWKSet, jwtVerify } from 'jose';
const resolvers = new Map();
export async function authorize(request, env, testKey) {
  const origin = new URL(request.url).origin;
  if (
    new URL(origin).hostname.endsWith('.pages.dev') ||
    origin !== env.ADMIN_ORIGIN ||
    !origin.startsWith('https://') ||
    !env.ACCESS_AUD ||
    !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(
      env.ACCESS_ISSUER || '',
    )
  )
    return null;
  if (
    !['GET', 'HEAD'].includes(request.method) &&
    request.headers.get('Origin') !== origin
  )
    return null;
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return null;
  try {
    if (!resolvers.has(env.ACCESS_ISSUER))
      resolvers.set(
        env.ACCESS_ISSUER,
        createRemoteJWKSet(new URL('/cdn-cgi/access/certs', env.ACCESS_ISSUER)),
      );
    const { payload } = await jwtVerify(
      token,
      testKey || resolvers.get(env.ACCESS_ISSUER),
      {
        issuer: env.ACCESS_ISSUER,
        audience: env.ACCESS_AUD,
        algorithms: ['RS256'],
        requiredClaims: ['exp', 'iat', 'sub', 'email'],
      },
    );
    const allowed = (env.ADMIN_EMAILS || '')
      .toLowerCase()
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    return payload.type === 'app' &&
      typeof payload.email === 'string' &&
      allowed.includes(payload.email.toLowerCase())
      ? payload.email
      : null;
  } catch {
    return null;
  }
}
