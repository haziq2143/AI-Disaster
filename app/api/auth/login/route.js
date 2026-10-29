import { authenticateAccount, createSession } from '../../../../src/lib/authStore.js';
import { badOriginResponse, hasSameOrigin, sessionCookie } from '../../../../src/lib/auth.js';
import {
  checkRequestRateLimit,
  rateLimitExceededResponse,
  rateLimitUnavailableResponse
} from '../../../../src/lib/requestRateLimit.js';

export async function POST(request) {
  if (!hasSameOrigin(request)) return badOriginResponse();
  try {
    const rateLimit = await checkRequestRateLimit(request, 'auth-login', 10, 15 * 60);
    if (!rateLimit.available) return rateLimitUnavailableResponse();
    if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit.retryAfterSeconds);

    const body = await request.json();
    const user = await authenticateAccount(body);
    const session = await createSession(user.id);
    return Response.json(
      { success: true, user },
      { headers: { 'Set-Cookie': sessionCookie(session.token, session.maxAge), 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ success: false, error: 'Format permintaan tidak valid.' }, { status: 400 });
    }
    const status = /tidak cocok/.test(error.message) ? 401 : 500;
    if (status === 500) console.error('API /api/auth/login error:', error);
    return Response.json(
      {
        success: false,
        error: status === 500 ? 'Layanan akun sedang bermasalah. Coba lagi.' : error.message
      },
      { status }
    );
  }
}
