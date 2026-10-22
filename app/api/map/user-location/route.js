import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '../../../../src/lib/auth.js';

export async function POST(request) {
  const { response } = requireAuthenticatedUser(request);
  if (response) return response;
  return NextResponse.json(
    { success: false, error: 'Lokasi live tidak disimpan sebagai lokasi global. Gunakan laporan SOS dengan persetujuan eksplisit.' },
    { status: 410 }
  );
}
