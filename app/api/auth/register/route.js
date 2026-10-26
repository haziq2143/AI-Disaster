import { registerAccount } from '../../../../src/lib/authStore.js';
import { sendVerificationEmail } from '../../../../src/lib/email.js';
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
    const { user, verificationToken } = await registerAccount(body);
    try {
      await sendVerificationEmail({ email: user.email, token: verificationToken, request });
    } catch (error) {
      console.error('Gagal mengirim email verifikasi akun:', error);
      return Response.json(
        { success: false, error: 'Akun menunggu verifikasi, tetapi email belum dapat dikirim. Coba kirim ulang tautan verifikasi.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    return Response.json(
      { success: true, message: 'Akun dibuat. Periksa inbox untuk memverifikasi alamat email sebelum masuk.' },
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
