import { createSession, registerAccount } from '../../../../src/lib/authStore.js';
import { hasSameOrigin, sessionCookie, badOriginResponse } from '../../../../src/lib/auth.js';

export async function POST(request) {
  if (!hasSameOrigin(request)) return badOriginResponse();
  try {
    const body = await request.json();
    const user = await registerAccount(body);
    const session = await createSession(user.id);
    return Response.json(
      { success: true, user },
      { status: 201, headers: { 'Set-Cookie': sessionCookie(session.token, session.maxAge), 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const status = /terdaftar/.test(error.message) ? 409
      : /harus|valid|karakter|kode bootstrap/i.test(error.message) ? 400
        : 500;
    if (status === 500) console.error('API /api/auth/register error:', error);
    return Response.json({ success: false, error: error.message }, { status });
  }
}
