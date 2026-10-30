import { NextResponse } from 'next/server';
import { addPosko, getAllMarkers } from '../../../../src/lib/disasterDb.js';
import { getAuthenticatedUser, requireSarUser } from '../../../../src/lib/auth.js';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const hasLat = searchParams.has('lat');
    const hasLng = searchParams.has('lng');
    if (hasLat !== hasLng) {
      return NextResponse.json({ success: false, error: 'Koordinat peta tidak lengkap.' }, { status: 400 });
    }

    const lat = hasLat ? Number(searchParams.get('lat')) : null;
    const lng = hasLng ? Number(searchParams.get('lng')) : null;
    if (hasLat && (
      !Number.isFinite(lat) || lat < -90 || lat > 90
      || !Number.isFinite(lng) || lng < -180 || lng > 180
    )) {
      return NextResponse.json({ success: false, error: 'Koordinat peta tidak valid.' }, { status: 400 });
    }

    const userCoords = hasLat ? { lat, lng } : null;
    const data = await getAllMarkers(userCoords);

    const isSar = user?.role === 'sar';

    if (!isSar && Array.isArray(data.laporan_darurat)) {
      // User biasa tetap bisa melihat laporan darurat di peta komunitas (sesuai PRD 4.11 PIN SOS),
      // tapi koordinat presisi disamarkan ke area ~1 km dan detail kontak disembunyikan.
      data.laporan_darurat = data.laporan_darurat.map(r => {
        if (!r.precision_consent) return null; // hanya tampilkan jika korban setuju dibagikan
        return {
          id: r.id,
          // Geser koordinat ±0.005 derajat (~500m) agar tidak presisi untuk user biasa
          lat: r.lat + (Math.random() - 0.5) * 0.005,
          lng: r.lng + (Math.random() - 0.5) * 0.005,
          area: r.address_detail
            ? r.address_detail.split(',').slice(-2).join(',').trim()
            : 'Area tidak diketahui',
          hazard_type: r.hazard_type,
          urgency_level: r.urgency_level,
          status: r.status,
          vulnerable_members: r.vulnerable_members,
          needs_description: r.needs_description,
          reported_at: r.reported_at,
          verified_status: r.verified_status,
          precision_consent: r.precision_consent,
          // Field sensitif disembunyikan untuk user biasa
          contact: null,
          address_detail: null,
          reporter_name: 'Anonim (laporan warga)',
        };
      }).filter(Boolean);
    }

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
  const { user, response } = await requireSarUser(request);
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
    const data = await addPosko({
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
