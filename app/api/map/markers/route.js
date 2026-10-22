import { NextResponse } from 'next/server';
import { addPosko, getAllMarkers } from '../../../../src/lib/disasterDb.js';
import { getAuthenticatedUser, requireSarUser } from '../../../../src/lib/auth.js';

export async function GET(request) {
  try {
    const user = getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : null;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')) : null;

    const userCoords = lat && lng ? { lat, lng } : null;
    const data = getAllMarkers(userCoords);
    if (user?.role !== 'sar') data.laporan_darurat = [];
    data.user_location = null;

    return NextResponse.json({
      success: true,
      source: 'prototype-local-json',
      data_status: 'demo',
      timestamp: new Date().toISOString(),
      privacy_notice: 'Data contoh lokal bukan feed resmi real-time. Radius 1 km adalah visualisasi privasi, bukan jaminan validasi laporan anti-spoofing.',
      data
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('API /api/map/markers error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data marker dari database.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { user, response } = requireSarUser(request);
  if (response) return response;
  try {
    const body = await request.json();
    if (
      typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.length > 120 ||
      typeof body.address !== 'string' || body.address.trim().length < 2 || body.address.length > 200 ||
      typeof body.lat !== 'number' || !Number.isFinite(body.lat) || body.lat < -90 || body.lat > 90 ||
      typeof body.lng !== 'number' || !Number.isFinite(body.lng) || body.lng < -180 || body.lng > 180 ||
      (body.contact !== undefined && (typeof body.contact !== 'string' || body.contact.length > 100))
    ) {
      return NextResponse.json({ success: false, error: 'Data posko tidak valid.' }, { status: 400 });
    }
    const data = addPosko({
      name: body.name.trim(),
      address: body.address.trim(),
      lat: body.lat,
      lng: body.lng,
      contact: body.contact?.trim(),
      created_by: user.name
    });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('API /api/map/markers POST error:', error);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan posko.' }, { status: 500 });
  }
}
