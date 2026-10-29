import { getAccountProfile, updateAccountProfile } from '../../../../src/lib/authStore.js';
import { hasSameOrigin, badOriginResponse, requireAuthenticatedUser } from '../../../../src/lib/auth.js';

export async function GET(request) {
  const { user, response } = await requireAuthenticatedUser(request);
  if (response) return response;
  try {
    return Response.json(
      { success: true, data: await getAccountProfile(user.id) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('API /api/auth/profile GET error:', error);
    return Response.json(
      { success: false, error: 'Profil tidak dapat dimuat. Coba lagi.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export async function PATCH(request) {
  if (!hasSameOrigin(request)) return badOriginResponse();
  const { user, response } = await requireAuthenticatedUser(request);
  if (response) return response;

  try {
    const profile = await updateAccountProfile(user.id, await request.json());
    return Response.json(
      { success: true, data: profile },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { success: false, error: 'Format permintaan tidak valid.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    const isInputError = /^(Format profil|Data profil|Nama harus|Tanggal lahir|Nomor telepon|Ada data profil|Golongan darah|Pilihan jenis kelamin|Foto profil|Akun tidak ditemukan)/.test(error.message);
    if (!isInputError) console.error('API /api/auth/profile PATCH error:', error);
    return Response.json(
      { success: false, error: isInputError ? error.message : 'Profil tidak dapat disimpan. Coba lagi.' },
      { status: isInputError ? 400 : 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
