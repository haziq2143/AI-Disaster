import { NextResponse } from 'next/server';
import { addEmergencyReport, readDb } from '../../../../src/lib/disasterDb.js';
import { getAuthenticatedUser, requireSarUser } from '../../../../src/lib/auth.js';

export async function GET(request) {
  const { response } = requireSarUser(request);
  if (response) return response;
  try {
    const db = readDb();
    return NextResponse.json({
      success: true,
      count: db.laporan_darurat.length,
      data: db.laporan_darurat
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil laporan darurat.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const user = getAuthenticatedUser(request);
  try {
    const body = await request.json();
    const { lat, lng, needs_description, reporter_name, hazard_type, vulnerable_members, urgency_level, precision_consent } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number' || precision_consent !== true) {
      return NextResponse.json(
        { success: false, error: 'Koordinat GPS dan persetujuan berbagi lokasi presisi diperlukan untuk laporan SOS.' },
        { status: 400 }
      );
    }

    const report = addEmergencyReport({
      lat,
      lng,
      reporter_name: user?.name || 'Pengguna anonim',
      reporter_user_id: user?.id,
      hazard_type,
      urgency_level: urgency_level || 'KRITIS',
      needs_description,
      vulnerable_members,
      precision_consent: Boolean(precision_consent)
    });

    return NextResponse.json({
      success: true,
      message: 'Laporan darurat berhasil dicatat ke database geospasial.',
      data: report
    }, { status: 201 });
  } catch (error) {
    console.error('API /api/map/emergency-reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mencatat laporan darurat.' },
      { status: 500 }
    );
  }
}
