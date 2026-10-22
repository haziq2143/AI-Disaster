import { clearSessionCookie, getSessionToken, hasSameOrigin, badOriginResponse } from '../../../../src/lib/auth.js';
import { revokeSession } from '../../../../src/lib/authStore.js';

export async function POST(request) {
  if (!hasSameOrigin(request)) return badOriginResponse();
  await revokeSession(getSessionToken(request));
  return Response.json(
    { success: true },
    { headers: { 'Set-Cookie': clearSessionCookie(), 'Cache-Control': 'no-store' } }
  );
}
