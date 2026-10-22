import { NextResponse } from 'next/server';
import { getAllMarkers } from '../../../../src/lib/disasterDb.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : null;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')) : null;

    const userCoords = lat && lng ? { lat, lng } : null;
    const data = getAllMarkers(userCoords);

    return NextResponse.json({
      success: true,
      source: 'database',
      timestamp: new Date().toISOString(),
      privacy_notice: 'Radius 1 km perkiraan adalah visualisasi privasi, bukan jaminan validasi laporan anti-spoofing.',
      data
    });
  } catch (error) {
    console.error('API /api/map/markers error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data marker dari database.' },
      { status: 500 }
    );
  }
}
