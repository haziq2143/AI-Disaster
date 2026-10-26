import {
  authCookieName,
  getSessionDurationSeconds,
  getUserForSession
} from './authStore.js';

export function getSessionToken(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookie = cookieHeader.split(';').map(part => part.trim())
    .find(part => part.startsWith(`${authCookieName}=`));
  return cookie ? decodeURIComponent(cookie.slice(authCookieName.length + 1)) : '';
}

export async function getAuthenticatedUser(request) {
  return getUserForSession(getSessionToken(request));
}

export async function requireAuthenticatedUser(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return {
      user: null,
      response: Response.json({ success: false, error: 'Silakan masuk untuk melanjutkan.' }, { status: 401 })
    };
  }
  return { user, response: null };
}

export async function requireSarUser(request) {
  const required = await requireAuthenticatedUser(request);
  if (required.response) return required;
  if (required.user.role !== 'sar') {
    return {
      user: null,
      response: Response.json({ success: false, error: 'Fitur ini khusus akun Tim SAR.' }, { status: 403 })
    };
  }
  return required;
}

export async function requireRoleAdmin(request) {
  const required = await requireAuthenticatedUser(request);
  if (required.response) return required;
  if (!required.user.canManageRoles) {
    return {
      user: null,
      response: Response.json({ success: false, error: 'Hanya admin yang dapat mengelola role akun.' }, { status: 403 })
    };
  }
  return required;
}

export function sessionCookie(token, maxAge = getSessionDurationSeconds()) {
  const attributes = [
    `${authCookieName}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`
  ];
  if (process.env.NODE_ENV === 'production') attributes.push('Secure');
  return attributes.join('; ');
}

export function clearSessionCookie() {
  return sessionCookie('', 0);
}

export function hasSameOrigin(request) {
  const originHeader = request.headers.get('origin');
  if (!originHeader) return true;
  try {
    const requestUrl = new URL(request.url);
    const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
    const host = request.headers.get('x-forwarded-host')?.split(',')[0].trim()
      || request.headers.get('host')
      || requestUrl.host;
    const protocol = forwardedProtocol || requestUrl.protocol.slice(0, -1);
    const expectedOrigin = new URL(`${protocol}://${host}`);
    return new URL(originHeader).origin === expectedOrigin.origin;
  } catch {
    return false;
  }
}

export function badOriginResponse() {
  return Response.json({ success: false, error: 'Permintaan lintas situs ditolak.' }, { status: 403 });
}
