import { NextResponse } from 'next/server';
import { addEmergencyReport, readDb } from '../../../../src/lib/disasterDb.js';

export async function GET() {
  try {
    const db = readDb();
    return NextResponse.json({
      success: true,
      count: db.laporan_darurat.length,
      data: db.laporan_darurat
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil laporan darurat.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { lat, lng, needs_description, reporter_name, hazard_type, vulnerable_members, urgency_level, precision_consent } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Koordinat GPS aktual laporan diperlukan.' },
        { status: 400 }
      );
    }

    const report = addEmergencyReport({
      lat,
      lng,
      reporter_name,
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
