import { NextResponse } from 'next/server';
import { requireSarUser } from '../../../../../src/lib/auth.js';
import { updatePosko } from '../../../../../src/lib/disasterDb.js';
import { validatePoskoUpdate } from '../../../../../src/lib/poskoManagement.js';

export async function PATCH(request, { params }) {
  const { user, response } = await requireSarUser(request);
  if (response) return response;

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Data posko tidak valid.' }, { status: 400 });
    }

    const { updates, error } = validatePoskoUpdate(body);
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    const { id } = await params;
    const data = await updatePosko(id, updates, user.name);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Posko tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API /api/map/markers/[id] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui posko.' },
      { status: 500 }
    );
  }
}
