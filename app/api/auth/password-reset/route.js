import { createPasswordResetToken } from '../../../../src/lib/authStore.js';
import { badOriginResponse, hasSameOrigin } from '../../../../src/lib/auth.js';
import {
  checkRequestRateLimit,
  rateLimitExceededResponse,
  rateLimitUnavailableResponse
} from '../../../../src/lib/requestRateLimit.js';

export async function POST(request) {
  if (!hasSameOrigin(request)) return badOriginResponse();
  if (process.env.NODE_ENV !== 'development') {
    return Response.json(
      { success: false, error: 'Pemulihan password belum dikonfigurasi untuk server ini. Hubungi administrator.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const rateLimit = await checkRequestRateLimit(request, 'password-reset', 5, 15 * 60);
    if (!rateLimit.available) return rateLimitUnavailableResponse();
    if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit.retryAfterSeconds);

    const { email } = await request.json();
    const token = await createPasswordResetToken(email);
    const resetUrl = token
      ? new URL(request.headers.get('origin') || new URL(request.url).origin)
      : null;
    if (resetUrl) resetUrl.hash = `resetPassword=${token}`;
    return Response.json(
      {
        success: true,
        message: 'Jika email terdaftar, tautan reset demo siap digunakan.',
        ...(resetUrl ? { resetUrl: resetUrl.href } : {})
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (!(error instanceof SyntaxError)) console.error('API /api/auth/password-reset error:', error);
    const message = error instanceof SyntaxError
      ? 'Format permintaan tidak valid.'
      : process.env.NODE_ENV === 'development'
        ? `Permintaan reset password gagal: ${error.message}`
        : 'Permintaan reset password gagal. Coba lagi.';
    return Response.json(
      { success: false, error: message },
      { status: error instanceof SyntaxError ? 400 : 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
