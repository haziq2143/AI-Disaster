import { registerAccount } from '../../../../src/lib/authStore.js';
import { hasSameOrigin, badOriginResponse } from '../../../../src/lib/auth.js';
import {
  checkRequestRateLimit,
  rateLimitExceededResponse,
  rateLimitUnavailableResponse
} from '../../../../src/lib/requestRateLimit.js';

export async function POST(request) {
  if (!hasSameOrigin(request)) return badOriginResponse();
  try {
    const rateLimit = await checkRequestRateLimit(request, 'auth-register', 5, 60 * 60);
    if (!rateLimit.available) return rateLimitUnavailableResponse();
    if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit.retryAfterSeconds);

    const body = await request.json();
    await registerAccount(body);
    return Response.json(
      { success: true, message: 'Akun berhasil dibuat. Silakan masuk.' },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ success: false, error: 'Format permintaan tidak valid.' }, { status: 400 });
    }
    const status = /terdaftar/.test(error.message) ? 409
      : /harus|valid|karakter|kode bootstrap/i.test(error.message) ? 400
        : 500;
    if (status === 500) console.error('API /api/auth/register error:', error);
    return Response.json(
      { success: false, error: status === 500 ? 'Layanan akun sedang bermasalah. Coba lagi.' : error.message },
      { status }
    );
  }
}
