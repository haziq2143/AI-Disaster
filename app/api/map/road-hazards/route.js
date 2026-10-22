import { NextResponse } from 'next/server';
import { getRoadHazards, toggleRoadHazard } from '../../../../src/lib/disasterDb.js';

export async function GET() {
  try {
    const hazards = getRoadHazards();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      disclaimer: 'Data status bahaya jalan dihimpun dari laporan terverifikasi BPBD/SAR dan laporan warga. Tidak menjamin kondisi jalan aman mutlak.',
      data: hazards
    });
  } catch (error) {
    console.error('API /api/map/road-hazards GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat status bahaya jalan.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, active } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Parameter id hazard wajib diisi.' },
        { status: 400 }
      );
    }

    const updated = toggleRoadHazard(id, active !== undefined ? active : null);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Hazard dengan id tersebut tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Status bahaya ${updated.road_name} berhasil diperbarui: ${updated.active ? 'Aktif' : 'Non-aktif'}`,
      data: updated
    });
  } catch (error) {
    console.error('API /api/map/road-hazards PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui status bahaya jalan.' },
      { status: 500 }
    );
  }
}
