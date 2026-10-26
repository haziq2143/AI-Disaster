import { createEmailVerificationToken } from '../../../../src/lib/authStore.js';
import { sendVerificationEmail } from '../../../../src/lib/email.js';
import { badOriginResponse, hasSameOrigin } from '../../../../src/lib/auth.js';
import {
  checkRequestRateLimit,
  rateLimitExceededResponse,
  rateLimitUnavailableResponse
} from '../../../../src/lib/requestRateLimit.js';

export async function POST(request) {
  if (!hasSameOrigin(request)) return badOriginResponse();
  try {
    const rateLimit = await checkRequestRateLimit(request, 'resend-verification', 5, 15 * 60);
    if (!rateLimit.available) return rateLimitUnavailableResponse();
    if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit.retryAfterSeconds);

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ success: false, error: 'Format permintaan tidak valid.' }, { status: 400 });
    }

    const token = await createEmailVerificationToken(body?.email);
    if (token) {
      try {
        await sendVerificationEmail({ email: body.email.trim().toLowerCase(), token, request });
      } catch (error) {
        console.error('Gagal mengirim ulang email verifikasi:', error);
        return Response.json(
          { success: false, error: 'Email verifikasi belum dapat dikirim. Coba lagi nanti.' },
          { status: 503, headers: { 'Cache-Control': 'no-store' } }
        );
      }
    }

    return Response.json(
      { success: true, message: 'Jika akun belum diverifikasi, tautan verifikasi akan dikirim ke email tersebut.' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('API /api/auth/resend-verification error:', error);
    return Response.json(
      { success: false, error: 'Permintaan verifikasi email gagal. Coba lagi.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
