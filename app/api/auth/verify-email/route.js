import { verifyAccountEmail } from '../../../../src/lib/authStore.js';
import { badOriginResponse, hasSameOrigin } from '../../../../src/lib/auth.js';
import {
  checkRequestRateLimit,
  rateLimitExceededResponse,
  rateLimitUnavailableResponse
} from '../../../../src/lib/requestRateLimit.js';

export async function POST(request) {
  if (!hasSameOrigin(request)) return badOriginResponse();
  try {
    const rateLimit = await checkRequestRateLimit(request, 'verify-email', 20, 15 * 60);
    if (!rateLimit.available) return rateLimitUnavailableResponse();
    if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit.retryAfterSeconds);
  } catch (error) {
    console.error('API /api/auth/verify-email rate limit error:', error);
    return Response.json(
      { success: false, error: 'Layanan verifikasi email sedang bermasalah. Coba lagi.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: 'Format permintaan tidak valid.' }, { status: 400 });
  }

  try {
    await verifyAccountEmail(body?.token);
    return Response.json(
      { success: true, message: 'Email berhasil diverifikasi. Silakan masuk.' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const isInputError = error.status === undefined
      && /Tautan verifikasi tidak valid|Akun untuk tautan verifikasi tidak ditemukan/.test(error.message);
    if (!isInputError) console.error('API /api/auth/verify-email error:', error);
    return Response.json(
      { success: false, error: isInputError ? error.message : 'Verifikasi email gagal. Coba lagi.' },
      { status: isInputError ? 400 : 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
