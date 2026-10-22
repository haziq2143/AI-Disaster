import { requireRoleAdmin } from '../../../../src/lib/auth.js';
import { listAccounts, setAccountRole } from '../../../../src/lib/authStore.js';

export async function GET(request) {
  const { response } = requireRoleAdmin(request);
  if (response) return response;
  return Response.json({ success: true, data: listAccounts() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request) {
  const { response } = requireRoleAdmin(request);
  if (response) return response;
  try {
    const { userId, role } = await request.json();
    const user = await setAccountRole(userId, role);
    return Response.json({ success: true, data: user }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
