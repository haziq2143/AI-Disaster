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

export function getAuthenticatedUser(request) {
  return getUserForSession(getSessionToken(request));
}

export function requireAuthenticatedUser(request) {
  const user = getAuthenticatedUser(request);
  if (!user) {
    return {
      user: null,
      response: Response.json({ success: false, error: 'Silakan masuk untuk melanjutkan.' }, { status: 401 })
    };
  }
  return { user, response: null };
}

export function requireSarUser(request) {
  const required = requireAuthenticatedUser(request);
  if (required.response) return required;
  if (required.user.role !== 'sar') {
    return {
      user: null,
      response: Response.json({ success: false, error: 'Fitur ini khusus akun Tim SAR.' }, { status: 403 })
    };
  }
  return required;
}

export function requireRoleAdmin(request) {
  const required = requireAuthenticatedUser(request);
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
    'SameSite=Lax',
    `Max-Age=${maxAge}`
  ];
  return attributes.join('; ');
}

export function clearSessionCookie() {
  return sessionCookie('', 0);
}

export function hasSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const reqUrl = new URL(request.url);
    const originUrl = new URL(origin);
    if (reqUrl.origin === originUrl.origin) return true;

    // Izinkan localhost dan 127.0.0.1 saling bertukar selama port-nya sama (lingkungan dev lokal)
    const isLocalReq = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1';
    const isLocalOrigin = originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1';
    const reqPort = reqUrl.port || (reqUrl.protocol === 'https:' ? '443' : '80');
    const originPort = originUrl.port || (originUrl.protocol === 'https:' ? '443' : '80');

    if (isLocalReq && isLocalOrigin && reqPort === originPort) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function badOriginResponse() {
  return Response.json({ success: false, error: 'Permintaan lintas situs ditolak.' }, { status: 403 });
}
