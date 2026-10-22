import { authenticateAccount, createSession } from '../../../../src/lib/authStore.js';
import { badOriginResponse, hasSameOrigin, sessionCookie } from '../../../../src/lib/auth.js';

export async function POST(request) {
  if (!hasSameOrigin(request)) return badOriginResponse();
  try {
    const body = await request.json();
    const user = await authenticateAccount(body);
    const session = await createSession(user.id);
    return Response.json(
      { success: true, user },
      { headers: { 'Set-Cookie': sessionCookie(session.token, session.maxAge), 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const status = /tidak cocok/.test(error.message) ? 401 : 500;
    if (status === 500) console.error('API /api/auth/login error:', error);
    return Response.json({ success: false, error: error.message }, { status });
  }
}
