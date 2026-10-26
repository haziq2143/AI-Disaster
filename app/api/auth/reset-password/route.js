import { resetAccountPassword } from '../../../../src/lib/authStore.js';
import { badOriginResponse, hasSameOrigin } from '../../../../src/lib/auth.js';

export async function POST(request) {
  if (!hasSameOrigin(request)) return badOriginResponse();
  if (process.env.NODE_ENV !== 'development') {
    return Response.json(
      { success: false, error: 'Pemulihan password belum dikonfigurasi untuk server ini. Hubungi administrator.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  try {
    const { token, password } = await request.json();
    await resetAccountPassword(token, password);
    return Response.json(
      { success: true, message: 'Password berhasil diubah. Silakan masuk dengan password baru.' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const isInputError = error instanceof SyntaxError
      || /Tautan reset tidak valid|Kata sandi harus|Akun untuk tautan reset tidak ditemukan/.test(error.message);
    if (!isInputError) console.error('API /api/auth/reset-password error:', error);
    return Response.json(
      { success: false, error: error instanceof SyntaxError ? 'Format permintaan tidak valid.' : isInputError ? error.message : 'Reset password gagal. Coba lagi.' },
      { status: isInputError ? 400 : 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
