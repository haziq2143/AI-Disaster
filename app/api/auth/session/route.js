import { getAuthenticatedUser } from '../../../../src/lib/auth.js';

export async function GET(request) {
  return Response.json(
    { success: true, user: await getAuthenticatedUser(request) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
