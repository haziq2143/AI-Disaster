import { requireRoleAdmin } from '../../../../src/lib/auth.js';
import { listAccounts, setAccountRole } from '../../../../src/lib/authStore.js';

export async function GET(request) {
  const { response } = await requireRoleAdmin(request);
  if (response) return response;
  return Response.json({ success: true, data: await listAccounts() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request) {
  const { response } = await requireRoleAdmin(request);
  if (response) return response;
  try {
    const { userId, role } = await request.json();
    const user = await setAccountRole(userId, role);
    return Response.json({ success: true, data: user }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const isInputError = ['Role tidak valid.', 'Akun tidak ditemukan.', 'Role admin awal tidak dapat diturunkan.']
      .includes(error.message);
    if (!isInputError) console.error('API /api/auth/users PATCH error:', error);
    return Response.json(
      { success: false, error: isInputError ? error.message : 'Gagal memperbarui role akun.' },
      { status: isInputError ? 400 : 500 }
    );
  }
}
